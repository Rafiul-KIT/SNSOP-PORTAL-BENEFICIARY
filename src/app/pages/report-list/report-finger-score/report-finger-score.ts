import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import {
  BomaProgress,
  FingerScore,
  FingerScoreService,
  SubjectStats,
} from './finger-score.service';

interface FingerColumn {
  field: keyof FingerScore;
  label: string;
}

@Component({
  selector: 'app-report-finger-score',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginatorModule, ToastModule],
  templateUrl: './report-finger-score.html',
  styleUrl: './report-finger-score.scss',
})
export class ReportFingerScore implements OnInit, OnDestroy {
  private readonly fingerScoreService = inject(FingerScoreService);
  private readonly messageService = inject(MessageService);

  private bomaRequest = 0;
  private subjectRequest = 0;
  private scoresRequest = 0;
  private detailRequest = 0;
  readonly bomaView = signal<'subjects' | 'scores'>('subjects');
  readonly scoreFirst = signal(0);
  readonly scoreRows = signal(20);
  readonly visibleBomaScores = computed(() =>
    this.bomaScores().slice(this.scoreFirst(), this.scoreFirst() + this.scoreRows()));
  readonly downloadingBomas = signal<ReadonlySet<number>>(new Set());
  readonly householdResultNumber = signal('');
  readonly uploadScore = signal<number | null>(null);

  ngOnDestroy(): void {
    ++this.bomaRequest;
    ++this.subjectRequest;
    ++this.scoresRequest;
    ++this.detailRequest;
  }

  readonly stats = signal<SubjectStats>({ total: 0, beneficiaries: 0, alternates: 0 });
  readonly bomaCount = signal(0);
  readonly bomas = signal<BomaProgress[]>([]);
  readonly bomaTotal = signal(0);
  readonly bomaFirst = signal(0);
  readonly bomaRows = signal(10);

  readonly selectedBoma = signal<BomaProgress | null>(null);
  readonly subjects = signal<FingerScore[]>([]);
  readonly subjectTotal = signal(0);
  readonly subjectFirst = signal(0);
  readonly subjectRows = signal(10);
  readonly bomaScores = signal<FingerScore[]>([]);
  readonly selectedScore = signal<FingerScore | null>(null);
  readonly householdScores = signal<FingerScore[]>([]);

  readonly loadingSummary = signal(false);
  readonly loadingBomas = signal(false);
  readonly loadingSubjects = signal(false);
  readonly loadingBomaScores = signal(false);
  readonly loadingScore = signal(false);
  readonly uploading = signal(false);

  bomaSearch = '';
  subjectSearch = '';
  householdNumber = '';
  selectedFile: File | null = null;

  readonly fingerColumns: FingerColumn[] = [
    { field: 'leftThumb', label: 'Left Thumb' },
    { field: 'leftIndex', label: 'Left Index' },
    { field: 'leftMiddle', label: 'Left Middle' },
    { field: 'leftRing', label: 'Left Ring' },
    { field: 'leftSmall', label: 'Left Small' },
    { field: 'rightThumb', label: 'Right Thumb' },
    { field: 'rightIndex', label: 'Right Index' },
    { field: 'rightMiddle', label: 'Right Middle' },
    { field: 'rightRing', label: 'Right Ring' },
    { field: 'rightSmall', label: 'Right Small' },
  ];

  ngOnInit(): void {
    void Promise.all([this.loadSummary(), this.loadBomas(true)]);
  }

  async loadSummary(): Promise<void> {
    this.loadingSummary.set(true);
    try {
      const [statsResponse, countResponse] = await Promise.all([
        this.fingerScoreService.getSubjectStats(),
        this.fingerScoreService.getBomaCount(),
      ]);
      this.stats.set(statsResponse.data ?? { total: 0, beneficiaries: 0, alternates: 0 });
      this.bomaCount.set(countResponse.data ?? 0);
    } catch (error) {
      this.showError(error, 'Could not load finger-score progress.');
    } finally {
      this.loadingSummary.set(false);
    }
  }

  async loadBomas(resetPage = false): Promise<void> {
    if (resetPage) this.bomaFirst.set(0);
    const request = ++this.bomaRequest;
    this.loadingBomas.set(true);
    try {
      const page = Math.floor(this.bomaFirst() / this.bomaRows());
      const response = await this.fingerScoreService.getBomas(page, this.bomaRows(), this.bomaSearch);
      if (request !== this.bomaRequest) return;
      this.bomas.set(response.data?.content ?? []);
      this.bomaTotal.set(response.data?.totalElements ?? 0);
    } catch (error) {
      if (request !== this.bomaRequest) return;
      this.bomas.set([]);
      this.bomaTotal.set(0);
      this.showError(error, 'Could not load processed bomas.');
    } finally {
      if (request === this.bomaRequest) this.loadingBomas.set(false);
    }
  }

  onBomaPageChange(event: PaginatorState): void {
    this.bomaFirst.set(event.first ?? 0);
    this.bomaRows.set(event.rows ?? 10);
    void this.loadBomas();
  }

  selectBoma(boma: BomaProgress): void {
    ++this.scoresRequest;
    ++this.detailRequest;
    this.loadingScore.set(false);
    this.loadingBomaScores.set(false);
    this.bomaView.set('subjects');
    this.selectedBoma.set(boma);
    this.subjectSearch = '';
    this.subjectFirst.set(0);
    this.bomaScores.set([]);
    this.selectedScore.set(null);
    void this.loadSubjects(true);
  }

  async loadSubjects(resetPage = false): Promise<void> {
    const boma = this.selectedBoma();
    if (!boma) return;
    if (resetPage) this.subjectFirst.set(0);
    const request = ++this.subjectRequest;
    this.loadingSubjects.set(true);
    try {
      const page = Math.floor(this.subjectFirst() / this.subjectRows());
      const response = await this.fingerScoreService.getBomaSubjects(
        boma.id,
        page,
        this.subjectRows(),
        this.subjectSearch
      );
      if (request !== this.subjectRequest) return;
      this.subjects.set(response.data?.content ?? []);
      this.subjectTotal.set(response.data?.totalElements ?? 0);
    } catch (error) {
      if (request !== this.subjectRequest) return;
      this.subjects.set([]);
      this.subjectTotal.set(0);
      this.showError(error, 'Could not load subjects for this boma.');
    } finally {
      if (request === this.subjectRequest) this.loadingSubjects.set(false);
    }
  }

  onSubjectPageChange(event: PaginatorState): void {
    this.subjectFirst.set(event.first ?? 0);
    this.subjectRows.set(event.rows ?? 10);
    void this.loadSubjects();
  }

  async loadBomaScores(boma: BomaProgress): Promise<void> {
    const request = ++this.scoresRequest;
    ++this.subjectRequest;
    ++this.detailRequest;
    this.loadingScore.set(false);
    this.loadingSubjects.set(false);
    this.subjectSearch = '';
    this.bomaView.set('scores');
    this.bomaScores.set([]);
    this.scoreFirst.set(0);
    this.selectedBoma.set(boma);
    this.subjects.set([]);
    this.subjectTotal.set(0);
    this.loadingBomaScores.set(true);
    this.selectedScore.set(null);
    try {
      const response = await this.fingerScoreService.getBomaScores(boma.id);
      if (request !== this.scoresRequest) return;
      this.bomaScores.set(response.data ?? []);
    } catch (error) {
      if (request !== this.scoresRequest) return;
      this.bomaScores.set([]);
      this.showError(error, 'Could not load finger scores for this boma.');
    } finally {
      if (request === this.scoresRequest) this.loadingBomaScores.set(false);
    }
  }

  closeBomaScores(): void {
    const boma = this.selectedBoma();
    if (boma) this.selectBoma(boma);
  }

  async loadIndividualScore(id: number): Promise<void> {
    const request = ++this.detailRequest;
    this.selectedScore.set(null);
    this.loadingScore.set(true);
    try {
      const response = await this.fingerScoreService.getIndividualScore(id);
      if (request !== this.detailRequest) return;
      this.selectedScore.set(response.data ?? null);
    } catch (error) {
      if (request !== this.detailRequest) return;
      this.selectedScore.set(null);
      this.showError(error, 'Could not load this individual finger score.');
    } finally {
      if (request === this.detailRequest) this.loadingScore.set(false);
    }
  }

  async searchHousehold(): Promise<void> {
    if (!this.householdNumber.trim()) return;
    const request = ++this.detailRequest;
    this.selectedScore.set(null);
    this.loadingScore.set(true);
    try {
      const household = this.householdNumber.trim();
      const response = await this.fingerScoreService.getHouseholdScores(household);
      if (request !== this.detailRequest) return;
      this.householdResultNumber.set(household);
      this.householdScores.set(response.data ?? []);
      this.selectedScore.set(null);
      if (!response.data?.length) {
        this.messageService.add({ severity: 'info', summary: 'No records', detail: 'No finger scores found for this household.' });
      }
    } catch (error) {
      if (request !== this.detailRequest) return;
      this.householdScores.set([]);
      this.showError(error, 'Could not load household finger scores.');
    } finally {
      if (request === this.detailRequest) this.loadingScore.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  async uploadWsq(fileInput: HTMLInputElement): Promise<void> {
    if (!this.selectedFile || this.uploading()) return;
    this.uploadScore.set(null);
    this.uploading.set(true);
    try {
      const response = await this.fingerScoreService.uploadWsq(this.selectedFile);
      this.uploadScore.set(response.data);
      this.messageService.add({
        severity: 'success',
        summary: 'File processed',
        detail: response.message
          ? `${response.message} (Score: ${response.data})`
          : `Finger score: ${response.data}`,
      });
      this.selectedFile = null;
      fileInput.value = '';
      void Promise.all([this.loadSummary(), this.loadBomas(true)]);
    } catch (error) {
      this.showError(error, 'Could not process the WSQ file.');
    } finally {
      this.uploading.set(false);
    }
  }

  async downloadCsv(boma: BomaProgress): Promise<void> {
    if (this.downloadingBomas().has(boma.id)) return;
    this.downloadingBomas.update(ids => new Set([...ids, boma.id]));
    try {
      await this.fingerScoreService.downloadBomaCsv(boma);
    } catch (error) {
      this.showError(error, 'Could not download the boma CSV file.');
    } finally {
      this.downloadingBomas.update(ids => {
        const remaining = new Set(ids);
        remaining.delete(boma.id);
        return remaining;
      });
    }
  }

  trackScore(score: FingerScore): string {
    return `${score.id}-${score.type}`;
  }

  private showError(error: any, fallback: string): void {
    const detail = error?.response?.data?.message || error?.message || fallback;
    this.messageService.add({ severity: 'error', summary: 'Request failed', detail });
  }
}
