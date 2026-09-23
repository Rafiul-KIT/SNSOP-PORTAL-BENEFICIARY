import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { BomaProgress, FingerScore, FingerScoreService } from './finger-score.service';
import { ReportFingerScore } from './report-finger-score';
import { FingerScoreResults } from './finger-score-results';
import { scoresCsv } from './finger-score.utils';

describe('Fingerprint quality report', () => {
  const boma: BomaProgress = { id: 1, name: 'Boma', payam: '', county: '', state: '' };
  let api: jasmine.SpyObj<ApiService>;
  let service: FingerScoreService;
  let report: ReportFingerScore;
  let results: FingerScoreResults;
  let fixture: ComponentFixture<FingerScoreResults>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['GET', 'POST']);
    // The location filter's geo lookups go through POST; default to an empty, successful result so specs
    // that don't care about the filter aren't broken by its background fetch.
    api.POST.and.resolveTo({ data: { operationResult: true, lookups: [] } } as any);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideNoopAnimations(), { provide: ApiService, useValue: api }, MessageService],
    });
    service = TestBed.inject(FingerScoreService);
    report = TestBed.runInInjectionContext(() => new ReportFingerScore());
  });

  function createResults(render = false): void {
    if (!render) spyOn(FingerScoreResults.prototype, 'ngOnInit');
    fixture = TestBed.createComponent(FingerScoreResults);
    fixture.componentRef.setInput('boma', boma);
    results = fixture.componentInstance;
  }

  it('rejects HTTP 200 failure envelopes', async () => {
    api.GET.and.resolveTo({ data: { success: false, message: 'Failed' } } as any);
    await expectAsync(service.getBomaCount()).toBeRejectedWithError('Failed');
  });

  it('uses page pagination without assuming the meaning of optional start', async () => {
    api.GET.and.resolveTo({ data: { success: true, data: {} } } as any);
    await service.getBomas(2, 10, ' test ');
    expect(api.GET.calls.mostRecent().args[1]).toEqual({
      search: 'test', page: 2, size: 10, sort: 'name,asc',
    });
    await service.getBomas(0, 10, '', '42');
    expect(api.GET.calls.mostRecent().args[1]).toEqual({
      search: undefined, bomaId: '42', page: 0, size: 10, sort: 'name,asc',
    });
    await service.getHouseholdScores(' A/B ');
    expect(api.GET.calls.mostRecent().args[0]).toBe('https://gwapp.southsudansafetynet.info/fingerquality/api/v1/household/A%2FB/finger-scores');
  });

  it('rejects JSON download errors instead of saving them as CSV', async () => {
    api.GET.and.resolveTo({ data: new Blob(
      [JSON.stringify({ success: false, message: 'Export failed' })],
      { type: 'application/json' },
    ) } as any);
    await expectAsync(service.downloadBomaCsv(boma)).toBeRejectedWithError('Export failed');
    expect(api.GET.calls.mostRecent().args[3]?.responseType).toBe('blob');
    expect(api.GET.calls.mostRecent().args[0]).toBe('https://gwapp.southsudansafetynet.info/fingerquality/api/v1/boma/1/finger-scores/csv');
  });

  it('ignores stale subject responses after switching bomas', async () => {
    createResults();
    let resolveFirst!: (value: any) => void;
    const pending = new Promise<any>(resolve => resolveFirst = resolve);
    spyOn(service, 'getBomaSubjects').and.returnValues(pending,
      Promise.resolve({ success: true, data: { content: [{ id: 2 }], totalElements: 1 } } as any));
    const first = results.load();
    fixture.componentRef.setInput('boma', { ...boma, id: 2 });
    await results.load();
    resolveFirst({ success: true, data: { content: [{ id: 1 }], totalElements: 1 } });
    await first;
    expect(results.records()[0].id).toBe(2);
  });

  it('enables modal CSV only after score data loads and deduplicates pending downloads', async () => {
    createResults();
    results.view.set('scores');
    let complete!: () => void;
    const pending = new Promise<void>(resolve => complete = resolve);
    const download = spyOn(service, 'downloadBomaCsv').and.returnValue(pending);
    await results.downloadCsv();
    expect(download).not.toHaveBeenCalled();
    results.loading.set(false);
    results.records.set([{ id: 1 } as FingerScore]);
    expect(results.canDownloadCsv()).toBeTrue();
    const first = results.downloadCsv();
    await results.downloadCsv();
    expect(download).toHaveBeenCalledTimes(1);
    expect(api.GET).not.toHaveBeenCalled();
    expect(results.downloading()).toBeTrue();
    complete();
    await first;
    expect(results.downloading()).toBeFalse();
    results.error.set('Failed');
    expect(results.canDownloadCsv()).toBeFalse();
    results.error.set('');
    results.records.set([]);
    expect(results.canDownloadCsv()).toBeFalse();
  });

  it('limits rendered score rows and preserves an empty scores view', async () => {
    createResults();
    results.view.set('scores');
    results.records.set(Array.from({ length: 10000 }, (_, id) => ({ id } as FingerScore)));
    expect(results.visibleRecords().length).toBe(10);
    spyOn(service, 'getBomaScores').and.resolveTo({ success: true, data: [] } as any);
    await results.load();
    expect(results.view()).toBe('scores');
    expect(results.records()).toEqual([]);
  });

  it('keeps household CSV disabled until a nonempty score response arrives', async () => {
    createResults(true);
    fixture.componentRef.setInput('boma', null);
    fixture.componentRef.setInput('household', '001');
    let finish!: (value: any) => void;
    const scores = spyOn(service, 'getHouseholdScores').and.returnValue(new Promise(resolve => finish = resolve));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeTrue();
    finish({ success: true, data: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeTrue();
    scores.and.resolveTo({ success: true, data: [{ id: 1 } as FingerScore] } as any);
    await results.load();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeFalse();
  });

  it('opens and closes results without losing the boma search or page', () => {
    report.bomaSearch = 'Test';
    report.bomaFirst.set(20);
    report.openBoma(boma, 'scores');
    expect(report.resultsContext()?.view).toBe('scores');
    expect(report.resultsContext()?.boma).toEqual(boma);
    report.closeResults();
    expect(report.resultsContext()).toBeNull();
    expect(report.bomaSearch).toBe('Test');
    expect(report.bomaFirst()).toBe(20);
    report.householdNumber = ' A/B ';
    report.searchHousehold();
    expect(report.resultsContext()).toEqual({ boma: null, household: 'A/B', view: 'scores' });
  });

  it('requires all location selections and keeps the boma ID across pages', async () => {
    const getBomas = spyOn(service, 'getBomas').and.resolveTo({ success: true, data: { content: [], totalElements: 0 } } as any);
    report.loadingBomas.set(false);
    report.selectedState.set({ id: '1', name: 'State' });
    report.selectedCounty.set({ id: '2', name: 'County' });
    report.selectedPayam.set({ id: '3', name: 'Payam' });
    expect(report.canSearchByLocation()).toBeFalse();
    report.searchByLocation();
    expect(getBomas).not.toHaveBeenCalled();

    report.selectedBoma.set({ id: '42', name: 'Boma name' });
    expect(report.canSearchByLocation()).toBeTrue();
    report.searchByLocation();
    await Promise.resolve();
    expect(getBomas).toHaveBeenCalledWith(0, 10, '', '42');
    report.onBomaPageChange({ first: 10, rows: 10 });
    await Promise.resolve();
    expect(getBomas).toHaveBeenCalledWith(1, 10, '', '42');
    report.clearSearch();
    await Promise.resolve();
    expect(getBomas).toHaveBeenCalledWith(0, 10, '', '');
    expect(report.canSearchByLocation()).toBeFalse();
  });

  it('ignores pending subject data after switching to scores', async () => {
    createResults();
    let complete!: (value: any) => void;
    spyOn(service, 'getBomaSubjects').and.returnValue(new Promise(resolve => complete = resolve));
    spyOn(service, 'getBomaScores').and.resolveTo({ success: true, data: [{ id: 2 }] } as any);
    const pending = results.load();
    results.switchView('scores');
    await Promise.resolve();
    complete({ success: true, data: { content: [{ id: 1 }], totalElements: 1 } });
    await pending;
    expect(results.records()[0].id).toBe(2);
    expect(results.loading()).toBeFalse();
  });

  it('does not reopen a subject detail after it has been closed', async () => {
    createResults();
    let complete!: (value: any) => void;
    spyOn(service, 'getIndividualScore').and.returnValue(new Promise(resolve => complete = resolve));
    const pending = results.openDetail({ id: 1, name: 'Test subject' } as FingerScore);
    results.closeDetail();
    complete({ success: true, data: { id: 1 } });
    await pending;
    expect(results.selectedScore()).toBeNull();
    expect(results.dialogVisible).toBeFalse();
  });

  it('filters scores by name or household and role before paginating', () => {
    createResults();
    results.view.set('scores');
    results.records.set([
      { id: 1, name: 'Mary', householdNumber: 'HH-001', type: 'BENEFICIARY' },
      { id: 2, name: 'John', householdNumber: 'HH-001', type: 'ALTERNATE' },
      { id: 3, name: 'Mary', householdNumber: 'HH-002', type: 'BENEFICIARY' },
    ] as FingerScore[]);
    results.first.set(20);
    results.filterScores(' hh-001 ', 'ALTERNATE');
    expect(results.first()).toBe(0);
    expect(results.visibleRecords().map(score => score.id)).toEqual([2]);
    results.filterScores('mary', '');
    expect(results.resultCount()).toBe(2);
  });

  it('exports all ten fingers, preserves zero, and escapes spreadsheet text', () => {
    const csv = scoresCsv([{ householdNumber: '001', name: 'A, "B"', type: '=formula', leftThumb: 0, rightSmall: 42 } as FingerScore]);
    expect(csv).toContain('"Left Thumb"');
    expect(csv).toContain('"Right Little"');
    expect(csv).toContain('"001","A, ""B""","\'=formula","0"');
    expect(csv).toContain(',"42"');
  });

  it('highlights beneficiary scores below 40 and preserves missing and recapture states', async () => {
    createResults(true);
    fixture.componentRef.setInput('initialView', 'scores');
    spyOn(service, 'getBomaScores').and.resolveTo({ success: true, data: [
      { id: 1, name: 'Test subject', type: 'BENEFICIARY', householdNumber: '001',
        leftThumb: 0, leftIndex: null, leftMiddle: -1, leftRing: 39, leftSmall: 40 },
      { id: 2, name: 'Alternate', type: 'ALTERNATE', householdNumber: '001', leftThumb: 39 },
    ] } as any);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('.score-value');
    expect(cells.length).toBe(20);
    expect(cells[0].textContent.trim()).toBe('0');
    expect(cells[0].classList).toContain('low-score');
    expect(cells[1].textContent.trim()).toBe('—');
    expect(cells[1].classList).not.toContain('low-score');
    expect(cells[2].textContent.trim()).toBe('Recapture required');
    expect(cells[2].classList).toContain('recapture-score');
    expect(cells[2].classList).not.toContain('low-score');
    expect(cells[3].classList).toContain('low-score');
    expect(cells[4].classList).not.toContain('low-score');
    expect(cells[10].classList).not.toContain('low-score');
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.view-tabs button').length).toBe(2);
    results.selectedScore.set(results.records()[0]);
    results.detailName.set('Test subject');
    results.dialogVisible = true;
    await fixture.whenStable();
    fixture.detectChanges();
    const detailScore = fixture.nativeElement.querySelector('.finger-grid .recapture-score');
    expect(detailScore.textContent.trim()).toBe('Recapture required');
    const lowDetailScores = fixture.nativeElement.querySelectorAll('.finger-grid .low-score');
    expect(Array.from(lowDetailScores, (element: any) => element.textContent.trim())).toEqual(['0', '39']);
  });

  it('opens households and switches scores inside a modal without changing the URL', async () => {
    const subject = { id: 1, name: 'Test subject', type: 'BENEFICIARY', householdNumber: '001', leftThumb: 0 } as FingerScore;
    spyOn(service, 'getSubjectStats').and.resolveTo({ success: true, data: { total: 1, beneficiaries: 1, alternates: 0 } } as any);
    spyOn(service, 'getBomaCount').and.resolveTo({ success: true, data: 1 } as any);
    spyOn(service, 'getBomas').and.resolveTo({ success: true, data: { content: [boma], totalElements: 1 } } as any);
    spyOn(service, 'getBomaSubjects').and.resolveTo({ success: true, data: { content: [subject], totalElements: 1 } } as any);
    spyOn(service, 'getBomaScores').and.resolveTo({ success: true, data: [subject] } as any);
    const page = TestBed.createComponent(ReportFingerScore);
    const initialLoad = spyOn(page.componentInstance, 'loadInitialData').and.callThrough();
    page.detectChanges();
    await initialLoad.calls.first().returnValue;
    await page.whenStable();
    page.detectChanges();
    expect(page.nativeElement.querySelector('[aria-label="Download CSV for Boma"]')).toBeNull();
    const url = window.location.href;
    page.nativeElement.querySelector('[aria-label="View households in Boma"]').click();
    await page.whenStable();
    page.detectChanges();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Test subject');
    (document.querySelectorAll('.view-tabs button')[1] as HTMLButtonElement).click();
    await page.whenStable();
    page.detectChanges();
    expect(document.querySelector('.score-table')).not.toBeNull();
    expect(window.location.href).toBe(url);
    (document.querySelector('.p-dialog-close-button') as HTMLButtonElement).click();
    await page.whenStable();
    page.detectChanges();
    expect(page.componentInstance.resultsContext()).toBeNull();
    expect(page.nativeElement.querySelector('[aria-label="View households in Boma"]')).not.toBeNull();
  });


  it('shows one initial loader until both summary and bomas arrive, then keeps content during refresh', async () => {
    let finishSummary!: (value: any) => void;
    let finishBomas!: (value: any) => void;
    spyOn(service, 'getSubjectStats').and.returnValue(new Promise(resolve => finishSummary = resolve));
    spyOn(service, 'getBomaCount').and.resolveTo({ success: true, data: 1 } as any);
    const bomas = spyOn(service, 'getBomas').and.returnValue(new Promise(resolve => finishBomas = resolve));
    const page = TestBed.createComponent(ReportFingerScore);
    const initialLoad = spyOn(page.componentInstance, 'loadInitialData').and.callThrough();
    page.detectChanges();
    expect(page.nativeElement.querySelectorAll('[role="status"]').length).toBe(1);
    expect(page.nativeElement.querySelector('.summary-grid')).toBeNull();
    finishSummary({ success: true, data: { total: 1, beneficiaries: 1, alternates: 0 } });
    await page.whenStable();
    page.detectChanges();
    expect(page.nativeElement.querySelector('.initial-loading')).not.toBeNull();
    finishBomas({ success: true, data: { content: [boma], totalElements: 1 } });
    await initialLoad.calls.first().returnValue;
    await page.whenStable();
    page.detectChanges();
    expect(page.nativeElement.querySelector('.initial-loading')).toBeNull();
    expect(page.nativeElement.querySelector('.summary-grid')).not.toBeNull();
    const originalRow = page.nativeElement.querySelector('.report-table tbody tr');
    let finishRefresh!: (value: any) => void;
    bomas.and.returnValue(new Promise(resolve => finishRefresh = resolve));
    const refresh = page.componentInstance.loadBomas();
    page.detectChanges();
    expect(page.nativeElement.querySelector('.initial-loading')).toBeNull();
    expect(page.nativeElement.querySelector('.report-table tbody tr')).toBe(originalRow);
    finishRefresh({ success: true, data: { content: [boma], totalElements: 1 } });
    await refresh;
  });

  it('replaces the initial loader with retryable errors when the APIs fail', async () => {
    spyOn(service, 'getSubjectStats').and.rejectWith(new Error('Unavailable'));
    spyOn(service, 'getBomaCount').and.rejectWith(new Error('Unavailable'));
    spyOn(service, 'getBomas').and.rejectWith(new Error('Unavailable'));
    await report.loadInitialData();
    expect(report.initialLoading()).toBeFalse();
    expect(report.summaryError()).toBeTrue();
    expect(report.bomaError()).toContain('try again');
  });

});
