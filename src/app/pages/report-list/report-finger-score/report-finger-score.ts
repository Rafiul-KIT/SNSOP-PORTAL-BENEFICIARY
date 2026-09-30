import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { FingerScoreResults } from './finger-score-results';
import { BomaSummary, FingerScoreService } from './finger-score.service';

const SEARCH_DEBOUNCE_MS = 350;

@Component({
  selector: 'app-report-finger-score',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, FingerScoreResults, PaginatorModule, ToastModule],
  templateUrl: './report-finger-score.html',
  styleUrl: './report-finger-score.scss',
})
export class ReportFingerScore implements OnInit, OnDestroy {
  private readonly service = inject(FingerScoreService);
  private readonly messages = inject(MessageService);
  private readonly document = inject(DOCUMENT);
  private resultsTrigger: HTMLElement | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private request = 0;
  private destroyed = false;
  readonly bomas = signal<BomaSummary[]>([]);
  readonly bomaTotal = signal(0);
  readonly bomaFirst = signal(0);
  readonly bomaRows = signal(10);
  readonly loadingBomas = signal(true);
  readonly bomaError = signal('');
  readonly bomaSearch = signal('');
  readonly householdNumber = signal('');
  readonly downloadingBomaId = signal<number | null>(null);
  readonly resultsContext = signal<{ boma: BomaSummary | null; household: string } | null>(null);
  readonly skeletonRows = [1, 2, 3, 4, 5];

  ngOnInit(): void { void this.loadBomas(); }

  ngOnDestroy(): void {
    this.destroyed = true;
    ++this.request;
    clearTimeout(this.searchTimer);
  }

  async loadBomas(reset = false): Promise<void> {
    if (reset) this.bomaFirst.set(0);
    const request = ++this.request;
    this.loadingBomas.set(true);
    this.bomaError.set('');
    try {
      const response = await this.service.getBomas(Math.floor(this.bomaFirst() / this.bomaRows()), this.bomaRows(), this.bomaSearch());
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

  onBomaSearchChange(value: string): void {
    this.bomaSearch.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.loadBomas(true), SEARCH_DEBOUNCE_MS);
  }

  submitBomaSearch(): void {
    clearTimeout(this.searchTimer);
    void this.loadBomas(true);
  }

  clearBomaSearch(): void {
    this.bomaSearch.set('');
    this.submitBomaSearch();
  }

  searchHousehold(): void {
    const number = this.householdNumber().trim();
    if (!number) return;
    this.rememberResultsTrigger();
    this.resultsContext.set({ boma: null, household: number });
  }

  openBoma(boma: BomaSummary): void {
    this.rememberResultsTrigger();
    this.resultsContext.set({ boma, household: '' });
  }

  async downloadBomaCsv(boma: BomaSummary): Promise<void> {
    if (this.downloadingBomaId() != null) return;
    this.downloadingBomaId.set(boma.id);
    try {
      await this.service.downloadBomaCsv(boma);
    } catch {
      if (!this.destroyed) this.messages.add({ severity: 'error', summary: 'Download failed', detail: `Couldn’t download the CSV for ${boma.name}. Please try again.` });
    } finally { if (!this.destroyed) this.downloadingBomaId.set(null); }
  }

  closeResults(): void { this.resultsContext.set(null); }

  restoreResultsFocus(): void {
    if (!this.resultsContext() && this.resultsTrigger?.isConnected) this.resultsTrigger.focus();
  }

  private rememberResultsTrigger(): void {
    this.resultsTrigger = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  }
}
