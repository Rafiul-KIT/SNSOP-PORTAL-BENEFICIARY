import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FingerScoreResults } from './finger-score-results';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { BomaProgress, FingerScoreService, SubjectStats } from './finger-score.service';
import { LoadingSpinner } from '../../../components/loading-spinner/loading-spinner';
import { LookupItem, LookupService } from '../../../services/lookup.service';

@Component({
  selector: 'app-report-finger-score',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, FingerScoreResults, LoadingSpinner, PaginatorModule, ToastModule, SelectModule, FloatLabelModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: './report-finger-score.html',
  styleUrl: './report-finger-score.scss',
})
export class ReportFingerScore implements OnInit, OnDestroy {
  private readonly service = inject(FingerScoreService);
  private readonly document = inject(DOCUMENT);
  private readonly lookup = inject(LookupService);
  private resultsTrigger: HTMLElement | null = null;
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
  readonly resultsContext = signal<{ boma: BomaProgress | null; household: string; view: 'subjects' | 'scores' } | null>(null);
  bomaSearch = '';
  private appliedBomaId = '';
  householdNumber = '';
  readonly stateOptions = signal<LookupItem[]>([]);
  readonly countyOptions = signal<LookupItem[]>([]);
  readonly payamOptions = signal<LookupItem[]>([]);
  readonly bomaOptions = signal<LookupItem[]>([]);
  readonly selectedState = signal<LookupItem | null>(null);
  readonly selectedCounty = signal<LookupItem | null>(null);
  readonly selectedPayam = signal<LookupItem | null>(null);
  readonly selectedBoma = signal<LookupItem | null>(null);

  ngOnInit(): void { void this.loadInitialData(); }

  async loadInitialData(): Promise<void> {
    // Keep one stable loading state until the parallel initial requests finish.
    await Promise.all([this.loadSummary(), this.loadBomas(), this.loadStateOptions()]);
    if (!this.destroyed) this.initialLoading.set(false);
  }

  async loadStateOptions(): Promise<void> {
    try {
      const states = await this.lookup.getOrFetchStateList();
      if (!this.destroyed) this.stateOptions.set(states);
    } catch { /* The location filter is a convenience; leave it empty if lookups are unavailable. */ }
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
      const response = await this.service.getBomas(Math.floor(this.bomaFirst() / this.bomaRows()), this.bomaRows(), this.bomaSearch, this.appliedBomaId);
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

  hasLocationFilter(): boolean {
    return !!(this.selectedState() || this.selectedCounty() || this.selectedPayam() || this.selectedBoma());
  }

  canSearchByLocation(): boolean {
    return !!(this.selectedState()?.id && this.selectedCounty()?.id && this.selectedPayam()?.id && this.selectedBoma()?.id);
  }

  async onStateChange(state: LookupItem | null): Promise<void> {
    this.selectedState.set(state);
    this.selectedCounty.set(null);
    this.selectedPayam.set(null);
    this.selectedBoma.set(null);
    this.countyOptions.set([]);
    this.payamOptions.set([]);
    this.bomaOptions.set([]);
    if (state?.id) this.countyOptions.set(await this.lookup.getCountyListByStateId(state.id));
  }

  async onCountyChange(county: LookupItem | null): Promise<void> {
    this.selectedCounty.set(county);
    this.selectedPayam.set(null);
    this.selectedBoma.set(null);
    this.payamOptions.set([]);
    this.bomaOptions.set([]);
    if (county?.id) this.payamOptions.set(await this.lookup.getPayamListByCountyId(county.id));
  }

  async onPayamChange(payam: LookupItem | null): Promise<void> {
    this.selectedPayam.set(payam);
    this.selectedBoma.set(null);
    this.bomaOptions.set([]);
    if (payam?.id) this.bomaOptions.set(await this.lookup.getBomaListByPayamId(payam.id));
  }

  searchByLocation(): void {
    if (!this.canSearchByLocation() || this.loadingBomas()) return;
    this.bomaSearch = '';
    this.appliedBomaId = this.selectedBoma()!.id;
    void this.loadBomas(true);
  }

  clearSearch(): void {
    this.bomaSearch = '';
    this.appliedBomaId = '';
    this.selectedState.set(null);
    this.selectedCounty.set(null);
    this.selectedPayam.set(null);
    this.selectedBoma.set(null);
    this.countyOptions.set([]);
    this.payamOptions.set([]);
    this.bomaOptions.set([]);
    void this.loadBomas(true);
  }

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
}
