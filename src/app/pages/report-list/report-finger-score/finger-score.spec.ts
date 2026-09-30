import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { BomaSummary, FingerScoreService, HouseholdScores, MemberScores } from './finger-score.service';
import { ReportFingerScore } from './report-finger-score';
import { FingerScoreResults } from './finger-score-results';
import { householdFlags, householdsCsv, memberTypeLabel } from './finger-score.utils';

describe('Fingerprint quality report', () => {
  const boma: BomaSummary = { id: 1, name: 'Boma', payam: 'Payam', county: 'County', state: 'State' };
  const blankScores = {
    leftThumb: null, leftIndex: null, leftMiddle: null, leftRing: null, leftSmall: null,
    rightThumb: null, rightIndex: null, rightMiddle: null, rightRing: null, rightSmall: null,
  };
  const member = (type: string, scores: Partial<MemberScores> = {}): MemberScores => ({ ...blankScores, type, ...scores });
  const household = (householdNumber: string, members: MemberScores[]): HouseholdScores => ({ householdNumber, bomaId: 1, members });
  let api: jasmine.SpyObj<ApiService>;
  let service: FingerScoreService;
  let report: ReportFingerScore;
  let results: FingerScoreResults;
  let fixture: ComponentFixture<FingerScoreResults>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['GET']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideNoopAnimations(), { provide: ApiService, useValue: api }, MessageService],
    });
    service = TestBed.inject(FingerScoreService);
    report = TestBed.runInInjectionContext(() => new ReportFingerScore());
  });

  function createResults(inputs: { boma?: BomaSummary | null; household?: string } = { boma }, render = false): void {
    if (!render) spyOn(FingerScoreResults.prototype, 'ngOnInit');
    fixture = TestBed.createComponent(FingerScoreResults);
    fixture.componentRef.setInput('boma', inputs.boma ?? null);
    fixture.componentRef.setInput('household', inputs.household ?? '');
    results = fixture.componentInstance;
  }

  async function render(target: ComponentFixture<unknown>): Promise<void> {
    target.detectChanges();
    await target.whenStable();
    target.detectChanges();
  }

  it('rejects HTTP 200 failure envelopes', async () => {
    api.GET.and.resolveTo({ data: { success: false, message: 'Failed' } } as any);
    await expectAsync(service.getBomas(0, 10)).toBeRejectedWithError('Failed');
  });

  it('calls the fingerscore endpoints on the MIS server with page parameters', async () => {
    api.GET.and.resolveTo({ data: { success: true, data: { content: [] } } } as any);
    await service.getBomas(2, 10, ' juba ');
    expect(api.GET.calls.mostRecent().args.slice(0, 2)).toEqual(['fingerscore/bomas', { search: 'juba', page: 2, size: 10 }]);
    await service.getBomas(0, 10);
    expect(api.GET.calls.mostRecent().args[1]).toEqual({ search: undefined, page: 0, size: 10 });
    await service.getBomaHouseholds(7, 1, 20);
    expect(api.GET.calls.mostRecent().args.slice(0, 2)).toEqual(['fingerscore/boma/7', { page: 1, size: 20 }]);
    await service.getHousehold(' A/B ');
    expect(api.GET.calls.mostRecent().args[0]).toBe('fingerscore/household/A%2FB');
  });

  it('parses string scores and orders members beneficiary first', async () => {
    api.GET.and.resolveTo({ data: { success: true, data: {
      householdNumber: '001', bomaId: 1, members: [
        { type: 'ALTERNATE_2', leftThumb: '12' },
        { type: 'BENEFICIARY', leftThumb: '-1', leftIndex: 0, leftMiddle: '', rightSmall: 'x' },
        { type: 'NOMINEE' },
      ],
    } } } as any);
    const { data } = await service.getHousehold('001');
    expect(data!.members.map(m => m.type)).toEqual(['BENEFICIARY', 'NOMINEE', 'ALTERNATE_2']);
    expect(data!.members[0]).toEqual(jasmine.objectContaining({ leftThumb: -1, leftIndex: 0, leftMiddle: null, rightSmall: null }));
    expect(data!.members[2].leftThumb).toBe(12);
  });

  it('treats a missing household payload as not found', async () => {
    api.GET.and.resolveTo({ data: { success: true, data: null } } as any);
    expect((await service.getHousehold('404')).data).toBeNull();
  });

  it('rejects JSON download errors instead of saving them as CSV', async () => {
    api.GET.and.resolveTo({ data: new Blob(
      [JSON.stringify({ success: false, message: 'Export failed' })],
      { type: 'application/json' },
    ) } as any);
    await expectAsync(service.downloadBomaCsv(boma)).toBeRejectedWithError('Export failed');
    expect(api.GET.calls.mostRecent().args[0]).toBe('fingerscore/boma/1/csv');
    expect(api.GET.calls.mostRecent().args[3]?.responseType).toBe('blob');
  });

  it('flags only beneficiary scores below 40 as low, and any negative score as recapture', () => {
    const flags = householdFlags(household('001', [
      member('BENEFICIARY', { leftThumb: 0, leftIndex: 39, leftMiddle: 40, leftRing: -1 }),
      member('NOMINEE', { leftThumb: 10, rightThumb: -2 }),
    ]));
    expect(flags).toEqual({ low: 2, recapture: 2, scored: 6 });
  });

  it('exports all ten fingers per member, preserves zero, and escapes spreadsheet text', () => {
    const csv = householdsCsv([household('=HH, "1"', [member('BENEFICIARY', { leftThumb: 0, rightSmall: 42 })])]);
    expect(csv).toContain('"Left Thumb"');
    expect(csv).toContain('"Right Little"');
    expect(csv).toContain('"\'=HH, ""1""","Beneficiary","0"');
    expect(csv).toContain(',"42"');
    expect(memberTypeLabel('ALTERNATE_1')).toBe('Alternate 1');
  });

  it('ignores stale household pages after the boma changes', async () => {
    createResults();
    let resolveFirst!: (value: any) => void;
    spyOn(service, 'getBomaHouseholds').and.returnValues(new Promise(resolve => resolveFirst = resolve),
      Promise.resolve({ success: true, data: { content: [household('B', [])], totalElements: 1 } } as any));
    const first = results.load();
    fixture.componentRef.setInput('boma', { ...boma, id: 2 });
    await results.load();
    resolveFirst({ success: true, data: { content: [household('A', [])], totalElements: 1 } });
    await first;
    expect(results.households()[0].householdNumber).toBe('B');
  });

  it('pages households on the server', async () => {
    createResults();
    const page = spyOn(service, 'getBomaHouseholds').and.resolveTo({ success: true, data: { content: [], totalElements: 0 } } as any);
    results.onPageChange({ first: 40, rows: 20 });
    await Promise.resolve();
    expect(page).toHaveBeenCalledWith(1, 2, 20);
  });

  it('renders households grouped by member with low, recapture and missing states', async () => {
    createResults({ boma }, true);
    spyOn(service, 'getBomaHouseholds').and.resolveTo({ success: true, data: { totalElements: 1, content: [
      household('001', [
        member('BENEFICIARY', { leftThumb: 0, leftIndex: null, leftMiddle: -1, leftRing: 39, leftSmall: 40 }),
        member('NOMINEE', { leftThumb: 39 }),
      ]),
    ] } } as any);
    await render(fixture);
    const cells = fixture.nativeElement.querySelectorAll('.score-value');
    expect(cells.length).toBe(20);
    expect(cells[0].textContent.trim()).toBe('0');
    expect(cells[0].classList).toContain('is-low');
    expect(cells[1].textContent.trim()).toBe('—');
    expect(cells[1].classList).toContain('is-missing');
    expect(cells[2].textContent.trim()).toBe('Recapture');
    expect(cells[2].classList).toContain('is-recapture');
    expect(cells[3].classList).toContain('is-low');
    expect(cells[4].classList).toContain('is-ok');
    expect(cells[10].classList).toContain('is-ok');
    expect(fixture.nativeElement.querySelector('.household-column[rowspan="2"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.status-chip.is-recapture').textContent.trim()).toBe('1 recapture');
    expect(fixture.nativeElement.querySelector('.status-chip.is-low').textContent.trim()).toBe('2 low');
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeFalse();

    fixture.nativeElement.querySelector('.household-link').click();
    await render(fixture);
    expect(results.title()).toBe('Household 001');
    expect(fixture.nativeElement.querySelectorAll('.member-card').length).toBe(2);
    const lowTiles = fixture.nativeElement.querySelectorAll('.finger-tile.is-low .finger-score');
    expect(Array.from(lowTiles, (element: any) => element.textContent.trim())).toEqual(['0', '39']);
    fixture.nativeElement.querySelector('.back-link').click();
    await render(fixture);
    expect(fixture.nativeElement.querySelector('.score-table')).not.toBeNull();
  });

  it('keeps household CSV disabled until a household with members arrives', async () => {
    createResults({ household: '001' }, true);
    let finish!: (value: any) => void;
    const lookup = spyOn(service, 'getHousehold').and.returnValue(new Promise(resolve => finish = resolve));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeTrue();
    finish({ success: true, data: household('001', []) });
    await render(fixture);
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeTrue();
    lookup.and.resolveTo({ success: true, data: household('001', [member('BENEFICIARY', { leftThumb: 80 })]) } as any);
    await results.load();
    await render(fixture);
    expect(fixture.nativeElement.querySelector('.export-action button').disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.back-link')).toBeNull();
  });

  it('shows a not-found state for an unknown household', async () => {
    createResults({ household: 'missing' }, true);
    spyOn(service, 'getHousehold').and.resolveTo({ success: true, data: null } as any);
    await render(fixture);
    expect(fixture.nativeElement.textContent).toContain('No household found');
    expect(results.error()).toBe('');
  });

  it('debounces boma search and resets to the first page', async () => {
    jasmine.clock().install();
    try {
      const getBomas = spyOn(service, 'getBomas').and.resolveTo({ success: true, data: { content: [], totalElements: 0 } } as any);
      report.bomaFirst.set(20);
      report.onBomaSearchChange('ju');
      report.onBomaSearchChange('juba');
      jasmine.clock().tick(349);
      expect(getBomas).not.toHaveBeenCalled();
      jasmine.clock().tick(1);
      expect(getBomas).toHaveBeenCalledOnceWith(0, 10, 'juba');
      report.clearBomaSearch();
      expect(getBomas).toHaveBeenCalledWith(0, 10, '');
    } finally { jasmine.clock().uninstall(); }
  });

  it('opens results without losing the boma search or page', () => {
    report.bomaSearch.set('Test');
    report.bomaFirst.set(20);
    report.openBoma(boma);
    expect(report.resultsContext()).toEqual({ boma, household: '' });
    report.closeResults();
    expect(report.resultsContext()).toBeNull();
    expect(report.bomaSearch()).toBe('Test');
    expect(report.bomaFirst()).toBe(20);
    report.householdNumber.set(' A/B ');
    report.searchHousehold();
    expect(report.resultsContext()).toEqual({ boma: null, household: 'A/B' });
  });

  it('downloads one boma CSV at a time from the table', async () => {
    let complete!: () => void;
    const download = spyOn(service, 'downloadBomaCsv').and.returnValue(new Promise<void>(resolve => complete = resolve));
    const first = report.downloadBomaCsv(boma);
    await report.downloadBomaCsv({ ...boma, id: 2 });
    expect(download).toHaveBeenCalledTimes(1);
    expect(report.downloadingBomaId()).toBe(1);
    complete();
    await first;
    expect(report.downloadingBomaId()).toBeNull();
  });

  it('opens a boma in a modal without changing the URL', async () => {
    spyOn(service, 'getBomas').and.resolveTo({ success: true, data: { content: [boma], totalElements: 1 } } as any);
    spyOn(service, 'getBomaHouseholds').and.resolveTo({ success: true, data: {
      content: [household('HH-001', [member('BENEFICIARY', { leftThumb: 55 })])], totalElements: 1,
    } } as any);
    const page = TestBed.createComponent(ReportFingerScore);
    await render(page);
    expect(page.nativeElement.querySelector('.summary-grid')).toBeNull();
    expect(page.nativeElement.querySelector('[aria-label="Download CSV for Boma"]')).not.toBeNull();
    const url = window.location.href;
    page.nativeElement.querySelector('[aria-label="View households in Boma"]').click();
    await render(page);
    await render(page);
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('HH-001');
    expect(window.location.href).toBe(url);
    (document.querySelector('.p-dialog-close-button') as HTMLButtonElement).click();
    await render(page);
    expect(page.componentInstance.resultsContext()).toBeNull();
  });

  it('shows skeleton rows while loading and a retryable error when bomas fail', async () => {
    let fail!: (reason: unknown) => void;
    spyOn(service, 'getBomas').and.returnValue(new Promise((_, reject) => fail = reject));
    const page = TestBed.createComponent(ReportFingerScore);
    page.detectChanges();
    expect(page.nativeElement.querySelectorAll('.skeleton-row').length).toBe(5);
    fail(new Error('Unavailable'));
    await render(page);
    expect(page.nativeElement.querySelector('.skeleton-row')).toBeNull();
    expect(page.componentInstance.bomaError()).toContain('try again');
    expect(page.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
