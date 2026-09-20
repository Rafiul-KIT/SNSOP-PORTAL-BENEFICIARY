import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { FingerScoreResults } from './finger-score-results';
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { BomaProgress, FingerScoreService, SubjectStats } from './finger-score.service';
import { LoadingSpinner } from '../../../components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-report-finger-score',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, FingerScoreResults, LoadingSpinner, PaginatorModule, ToastModule],
  templateUrl: './report-finger-score.html',
  styleUrl: './report-finger-score.scss',
})
export class ReportFingerScore implements OnInit, OnDestroy {
  private readonly service = inject(FingerScoreService);
  private readonly document = inject(DOCUMENT);
  private resultsTrigger: HTMLElement | null = null;
  private readonly messages = inject(MessageService);
  private request = 0;
  private destroyed = false;
  readonly stats = signal<SubjectStats>({ total: 0, beneficiaries: 0, alternates: 0 });
  readonly bomaCount = signal(0);
  readonly bomas = signal<BomaProgress[]>([]);
  readonly bomaTotal = signal(0);
  readonly bomaFirst = signal(0);
  readonly bomaRows = signal(10);
  readonly initialLoading = signal(true);
  readonly loadingSummary = signal(true);
  readonly summaryError = signal(false);
  readonly loadingBomas = signal(true);
  readonly bomaError = signal('');
  readonly uploading = signal(false);
  readonly uploadScore = signal<number | null>(null);
  readonly uploadName = signal('');
  readonly fileError = signal('');
  readonly downloadingBomas = signal<ReadonlySet<number>>(new Set());
  readonly resultsContext = signal<{ boma: BomaProgress | null; household: string; view: 'subjects' | 'scores' } | null>(null);
  bomaSearch = '';
  householdNumber = '';
  selectedFile: File | null = null;

  ngOnInit(): void { void this.loadInitialData(); }

  async loadInitialData(): Promise<void> {
    // Keep one stable loading state until the parallel initial requests finish.
    await Promise.all([this.loadSummary(), this.loadBomas()]);
    if (!this.destroyed) this.initialLoading.set(false);
  }
  ngOnDestroy(): void { this.destroyed = true; ++this.request; }

  async loadSummary(): Promise<void> {
    this.loadingSummary.set(true);
    this.summaryError.set(false);
    try {
      const [stats, count] = await Promise.all([this.service.getSubjectStats(), this.service.getBomaCount()]);
      if (this.destroyed) return;
      this.stats.set(stats.data ?? { total: 0, beneficiaries: 0, alternates: 0 });
      this.bomaCount.set(count.data ?? 0);
    } catch { if (!this.destroyed) this.summaryError.set(true); }
    finally { if (!this.destroyed) this.loadingSummary.set(false); }
  }

  async loadBomas(reset = false): Promise<void> {
    if (reset) this.bomaFirst.set(0);
    const request = ++this.request;
    this.loadingBomas.set(true);
    this.bomaError.set('');
    try {
      const response = await this.service.getBomas(Math.floor(this.bomaFirst() / this.bomaRows()), this.bomaRows(), this.bomaSearch);
      if (request !== this.request) return;
      this.bomas.set(response.data?.content ?? []);
      this.bomaTotal.set(response.data?.totalElements ?? 0);
    } catch {
      if (request !== this.request) return;
      this.bomas.set([]);
      this.bomaTotal.set(0);
      this.bomaError.set('We couldn’t load the bomas. Please try again.');
    } finally { if (request === this.request) this.loadingBomas.set(false); }
  }

  onBomaPageChange(event: PaginatorState): void {
    this.bomaFirst.set(event.first ?? 0);
    this.bomaRows.set(event.rows ?? 10);
    void this.loadBomas();
  }

  clearSearch(): void { this.bomaSearch = ''; void this.loadBomas(true); }

  searchHousehold(): void {
    const number = this.householdNumber.trim();
    if (!number) return;
    this.rememberResultsTrigger();
    this.resultsContext.set({ boma: null, household: number, view: 'scores' });
  }

  openBoma(boma: BomaProgress, view: 'subjects' | 'scores'): void {
    this.rememberResultsTrigger();
    this.resultsContext.set({ boma, household: '', view });
  }

  closeResults(): void { this.resultsContext.set(null); }

  restoreResultsFocus(): void {
    if (!this.resultsContext() && this.resultsTrigger?.isConnected) this.resultsTrigger.focus();
  }

  private rememberResultsTrigger(): void {
    this.resultsTrigger = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError.set('');
    this.uploadScore.set(null);
    this.selectedFile = null;
    if (file && (!/\.wsq$/i.test(file.name) || file.size === 0)) {
      this.fileError.set(file.size === 0 ? 'This file is empty. Choose a WSQ fingerprint file.' : 'Choose a file with the .wsq extension.');
      input.value = '';
      return;
    }
    this.selectedFile = file;
  }

  async uploadWsq(input: HTMLInputElement): Promise<void> {
    if (!this.selectedFile || this.uploading()) return;
    const file = this.selectedFile;
    this.uploading.set(true);
    this.fileError.set('');
    this.uploadScore.set(null);
    try {
      const response = await this.service.uploadWsq(file);
      if (this.destroyed) return;
      this.uploadScore.set(response.data);
      this.uploadName.set(file.name);
      this.selectedFile = null;
      input.value = '';
      void this.loadSummary();
      void this.loadBomas(true);
    } catch { if (!this.destroyed) this.fileError.set('We couldn’t process this file. Please try again or choose another WSQ file.'); }
    finally { if (!this.destroyed) this.uploading.set(false); }
  }

  async downloadCsv(boma: BomaProgress): Promise<void> {
    if (this.downloadingBomas().has(boma.id)) return;
    this.downloadingBomas.update(ids => new Set([...ids, boma.id]));
    try { await this.service.downloadBomaCsv(boma); }
    catch { this.messages.add({ severity: 'error', summary: 'Download failed', detail: 'Please try downloading the boma CSV again.' }); }
    finally { this.downloadingBomas.update(ids => { const next = new Set(ids); next.delete(boma.id); return next; }); }
  }
}
