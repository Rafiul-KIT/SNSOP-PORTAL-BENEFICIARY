import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, OnDestroy, OnInit, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { BomaProgress, FingerScore, FingerScoreService } from './finger-score.service';
import { FINGER_COLUMNS, scoresCsv } from './finger-score.utils';

@Component({
  selector: 'app-finger-score-results',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorModule],
  templateUrl: './finger-score-results.html',
  styleUrl: './report-finger-score.scss',
})
export class FingerScoreResults implements OnInit, OnDestroy {
  private readonly service = inject(FingerScoreService);
  private readonly injector = inject(Injector);
  readonly detailHeading = viewChild<ElementRef<HTMLElement>>('detailHeading');
  readonly listHeading = viewChild<ElementRef<HTMLElement>>('listHeading');
  private readonly messages = inject(MessageService);
  private request = 0;
  private detailRequest = 0;
  readonly boma = input<BomaProgress | null>(null);
  readonly initialView = input<'subjects' | 'scores'>('subjects');
  readonly close = output<void>();
  readonly household = input('');
  readonly view = signal<'subjects' | 'scores'>('subjects');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly records = signal<FingerScore[]>([]);
  readonly total = signal(0);
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly search = signal('');
  readonly role = signal('');
  readonly downloading = signal(false);
  readonly selectedScore = signal<FingerScore | null>(null);
  readonly loadingDetail = signal(false);
  readonly detailError = signal('');
  readonly detailName = signal('');
  detailId = 0;
  dialogVisible = false;
  subjectSearch = '';
  readonly fingers = FINGER_COLUMNS;
  readonly hands = ['Left', 'Right'] as const;
  readonly title = computed(() => this.household() ? `Household ${this.household()}` : this.boma()?.name || 'Boma results');
  readonly filteredScores = computed(() => {
    const search = this.search().trim().toLowerCase();
    return this.records().filter(score => (!this.role() || score.type === this.role()) &&
      (!search || `${score.name ?? ''} ${score.householdNumber ?? ''}`.toLowerCase().includes(search)));
  });
  readonly visibleRecords = computed(() => {
    if (this.view() === 'subjects') return this.records();
    // A household's own results are already the complete, small list — paginating them adds clicks for no benefit.
    if (this.household()) return this.filteredScores();
    return this.filteredScores().slice(this.first(), this.first() + this.rows());
  });
  readonly resultCount = computed(() => this.view() === 'subjects' ? this.total() : this.filteredScores().length);
  readonly canDownloadCsv = computed(() => this.view() === 'scores' && !this.loading() && !this.error() && this.records().length > 0);

  ngOnInit(): void {
    this.view.set(this.household() ? 'scores' : this.initialView());
    void this.load();
  }

  ngOnDestroy(): void { ++this.request; ++this.detailRequest; }

  async load(reset = false): Promise<void> {
    if (reset) this.first.set(0);
    const request = ++this.request;
    this.loading.set(true);
    this.error.set('');
    this.records.set([]);
    this.total.set(0);
    try {
      if (this.household()) {
        const response = await this.service.getHouseholdScores(this.household());
        if (request !== this.request) return;
        this.records.set(response.data ?? []);
      } else if (this.view() === 'scores') {
        const response = await this.service.getBomaScores(this.boma()!.id);
        if (request !== this.request) return;
        this.records.set(response.data ?? []);
      } else {
        const response = await this.service.getBomaSubjects(this.boma()!.id, Math.floor(this.first() / this.rows()), this.rows(), this.subjectSearch);
        if (request !== this.request) return;
        this.records.set(response.data?.content ?? []);
        this.total.set(response.data?.totalElements ?? 0);
      }
    } catch {
      if (request === this.request) this.error.set('We couldn’t load these results. Please try again.');
    } finally { if (request === this.request) this.loading.set(false); }
  }

  switchView(view: 'subjects' | 'scores'): void {
    if (view === this.view()) return;
    this.view.set(view);
    this.first.set(0);
    this.subjectSearch = '';
    this.filterScores('', '');
    void this.load();
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    if (this.view() === 'subjects') void this.load();
  }

  filterScores(value: string, role = this.role()): void {
    this.search.set(value);
    this.role.set(role);
    this.first.set(0);
  }

  clearFilters(): void {
    this.subjectSearch = '';
    this.filterScores('', '');
    if (this.view() === 'subjects') void this.load(true);
  }

  async openDetail(subject: FingerScore): Promise<void> {
    const request = ++this.detailRequest;
    this.detailId = subject.id;
    this.detailName.set(subject.name || 'Subject');
    this.dialogVisible = true;
    afterNextRender(() => this.detailHeading()?.nativeElement.focus(), { injector: this.injector });
    this.selectedScore.set(null);
    this.detailError.set('');
    this.loadingDetail.set(true);
    try {
      const response = await this.service.getIndividualScore(subject.id);
      if (request !== this.detailRequest) return;
      this.selectedScore.set(response.data ?? null);
      if (!response.data) this.detailError.set('No fingerprint scores are available for this subject yet.');
    } catch {
      if (request === this.detailRequest) this.detailError.set('We couldn’t load this person’s scores. Please try again.');
    } finally { if (request === this.detailRequest) this.loadingDetail.set(false); }
  }

  closeDetail(): void {
    ++this.detailRequest;
    this.dialogVisible = false;
    afterNextRender(() => this.listHeading()?.nativeElement.focus(), { injector: this.injector });
    this.selectedScore.set(null);
    this.loadingDetail.set(false);
  }

  retryDetail(): void { void this.openDetail({ id: this.detailId, name: this.detailName() } as FingerScore); }

  async downloadCsv(): Promise<void> {
    if (this.downloading() || !this.canDownloadCsv()) return;
    this.downloading.set(true);
    try {
      if (this.boma()) await this.service.downloadBomaCsv(this.boma()!);
      else this.exportScores(this.records(), `household_${this.household()}`);
    } catch { this.messages.add({ severity: 'error', summary: 'Download failed', detail: 'Please try downloading the CSV again.' }); }
    finally { this.downloading.set(false); }
  }

  exportScores(scores: FingerScore[], name: string): void {
    const safeName = name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 100) || 'fingerprint';
    saveAs(new Blob([scoresCsv(scores)], { type: 'text/csv;charset=utf-8' }), `${safeName}_scores.csv`);
  }

  scoreDisplay(value: number | null): number | string {
    return value == null ? '—' : value < 0 ? 'Recapture required' : value;
  }

  isRecaptureScore(value: number | null): boolean {
    return value != null && value < 0;
  }

  isLowScore(value: number | null, type: string): boolean {
    return type === 'BENEFICIARY' && value != null && value >= 0 && value < 40;
  }

  trackScore(score: FingerScore): string { return `${score.id}-${score.type}`; }
}
