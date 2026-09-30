import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, OnDestroy, OnInit, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { isAxiosError } from 'axios';
import { saveAs } from 'file-saver';
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { BomaSummary, FingerScoreService, HouseholdScores } from './finger-score.service';
import { FINGER_COLUMNS, LOW_SCORE_THRESHOLD, ScoreStatus, householdFlags, householdsCsv, memberTypeLabel, scoreStatus } from './finger-score.utils';

@Component({
  selector: 'app-finger-score-results',
  standalone: true,
  imports: [CommonModule, PaginatorModule],
  templateUrl: './finger-score-results.html',
  styleUrl: './report-finger-score.scss',
})
export class FingerScoreResults implements OnInit, OnDestroy {
  private readonly service = inject(FingerScoreService);
  private readonly messages = inject(MessageService);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('resultsHeading');
  private request = 0;
  readonly boma = input<BomaSummary | null>(null);
  readonly household = input('');
  readonly close = output<void>();
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notFound = signal(false);
  readonly households = signal<HouseholdScores[]>([]);
  readonly total = signal(0);
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly downloading = signal(false);
  /** A household opened from the boma list; its scores are already loaded, so no request is needed. */
  readonly selected = signal<HouseholdScores | null>(null);
  readonly fingers = FINGER_COLUMNS;
  readonly hands = (['Left', 'Right'] as const).map(hand => ({ hand, fingers: FINGER_COLUMNS.filter(f => f.hand === hand) }));
  readonly lowThreshold = LOW_SCORE_THRESHOLD;
  readonly memberTypeLabel = memberTypeLabel;

  readonly detail = computed(() => this.selected() ?? (this.household() ? this.households()[0] ?? null : null));
  readonly title = computed(() => {
    const number = this.selected()?.householdNumber || this.household();
    return number ? `Household ${number}` : this.boma()?.name || 'Boma';
  });
  readonly rowsWithFlags = computed(() => this.households().map(household => ({ household, flags: householdFlags(household) })));
  readonly detailFlags = computed(() => {
    const household = this.detail();
    return household ? householdFlags(household) : null;
  });
  readonly bomaLocation = computed(() => {
    const boma = this.boma();
    return boma ? [boma.payam, boma.county, boma.state].filter(Boolean).join(' · ') : '';
  });
  readonly canDownloadCsv = computed(() => !this.loading() && !this.error() &&
    (this.detail() ? this.detail()!.members.length > 0 : this.total() > 0));

  ngOnInit(): void { void this.load(); }

  ngOnDestroy(): void { ++this.request; }

  async load(): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    this.error.set('');
    this.notFound.set(false);
    try {
      if (this.household()) {
        const response = await this.service.getHousehold(this.household());
        if (request !== this.request) return;
        this.households.set(response.data ? [response.data] : []);
        this.notFound.set(!response.data);
      } else {
        const response = await this.service.getBomaHouseholds(this.boma()!.id, Math.floor(this.first() / this.rows()), this.rows());
        if (request !== this.request) return;
        this.households.set(response.data?.content ?? []);
        this.total.set(response.data?.totalElements ?? 0);
      }
    } catch (error) {
      if (request !== this.request) return;
      this.households.set([]);
      if (this.household() && isAxiosError(error) && error.response?.status === 404) this.notFound.set(true);
      else this.error.set(this.household() ? 'We couldn’t load this household. Please try again.' : 'We couldn’t load the households. Please try again.');
    } finally { if (request === this.request) this.loading.set(false); }
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    void this.load();
  }

  openHousehold(household: HouseholdScores): void {
    this.selected.set(household);
    this.focusHeading();
  }

  backToHouseholds(): void {
    this.selected.set(null);
    this.focusHeading();
  }

  async downloadCsv(): Promise<void> {
    if (this.downloading() || !this.canDownloadCsv()) return;
    this.downloading.set(true);
    try {
      const household = this.detail();
      if (household) {
        const safeName = household.householdNumber.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 100) || 'household';
        saveAs(new Blob([householdsCsv([household])], { type: 'text/csv;charset=utf-8' }), `household_${safeName}_finger_scores.csv`);
      } else {
        await this.service.downloadBomaCsv(this.boma()!);
      }
    } catch { this.messages.add({ severity: 'error', summary: 'Download failed', detail: 'Please try downloading the CSV again.' }); }
    finally { this.downloading.set(false); }
  }

  /** Short visible value; `scoreText` carries the full meaning for screen readers and tooltips. */
  scoreDisplay(value: number | null): string {
    return value == null ? '—' : value < 0 ? 'Recapture' : String(value);
  }

  isRecapture(value: number | null): boolean {
    return value != null && value < 0;
  }

  scoreText(value: number | null, type: string): string {
    const status: ScoreStatus = scoreStatus(value, type);
    if (status === 'missing') return 'No score';
    if (status === 'recapture') return 'Recapture required';
    return status === 'low' ? `${value} (below ${LOW_SCORE_THRESHOLD})` : String(value);
  }

  statusClass(value: number | null, type: string): string {
    return `is-${scoreStatus(value, type)}`;
  }

  /** Width of the quality bar in the detail view; scores are on a 0–100 scale. */
  barWidth(value: number | null): number {
    return value == null || value < 0 ? 0 : Math.min(value, 100);
  }

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
  }
}
