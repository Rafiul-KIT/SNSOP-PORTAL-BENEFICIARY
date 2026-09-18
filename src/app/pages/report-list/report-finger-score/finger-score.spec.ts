import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { BomaProgress, FingerScore, FingerScoreService } from './finger-score.service';
import { ReportFingerScore } from './report-finger-score';

describe('Fingerprint quality report', () => {
  const boma: BomaProgress = { id: 1, name: 'Boma', payam: '', county: '', state: '' };
  let api: jasmine.SpyObj<ApiService>;
  let service: FingerScoreService;
  let report: ReportFingerScore;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['GET', 'POST']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: ApiService, useValue: api }, MessageService],
    });
    service = TestBed.inject(FingerScoreService);
    report = TestBed.runInInjectionContext(() => new ReportFingerScore());
  });

  it('rejects HTTP 200 failure envelopes', async () => {
    api.GET.and.resolveTo({ data: { success: false, message: 'Failed' } } as any);
    await expectAsync(service.getBomaCount()).toBeRejectedWithError('Failed');
  });

  it('uploads wsqFile as FormData and preserves a zero score', async () => {
    api.POST.and.resolveTo({ data: { success: true, data: 0 } } as any);
    const file = new File(['wsq'], 'sample.wsq');
    const result = await service.uploadWsq(file);
    expect(result.data).toBe(0);
    const args = api.POST.calls.mostRecent().args;
    expect(args[0]).toBe('https://gwapp.southsudansafetynet.info/fingerquality/api/v1/finger-score');
    expect((args[1] as FormData).get('wsqFile')).toEqual(file);
    expect(args[3]?.headers?.['Content-Type']).toBeUndefined();
  });

  it('uses page pagination without assuming the meaning of optional start', async () => {
    api.GET.and.resolveTo({ data: { success: true, data: {} } } as any);
    await service.getBomas(2, 10, ' test ');
    expect(api.GET.calls.mostRecent().args[1]).toEqual({
      search: 'test', page: 2, size: 10, sort: 'name,asc',
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
    let resolveFirst!: (value: any) => void;
    const pending = new Promise<any>(resolve => resolveFirst = resolve);
    spyOn(service, 'getBomaSubjects').and.returnValues(pending,
      Promise.resolve({ success: true, data: { content: [{ id: 2 }], totalElements: 1 } } as any));
    report.selectedBoma.set(boma);
    const first = report.loadSubjects();
    report.selectedBoma.set({ ...boma, id: 2 });
    await report.loadSubjects();
    resolveFirst({ success: true, data: { content: [{ id: 1 }], totalElements: 1 } });
    await first;
    expect(report.subjects()[0].id).toBe(2);
  });

  it('deduplicates each pending CSV download without waiting for report data', async () => {
    let complete!: () => void;
    const pending = new Promise<void>(resolve => complete = resolve);
    const download = spyOn(service, 'downloadBomaCsv').and.returnValue(pending);
    const first = report.downloadCsv(boma);
    await report.downloadCsv(boma);
    expect(download).toHaveBeenCalledTimes(1);
    expect(api.GET).not.toHaveBeenCalled();
    expect(report.downloadingBomas().has(boma.id)).toBeTrue();
    complete();
    await first;
    expect(report.downloadingBomas().size).toBe(0);
  });

  it('limits rendered score rows and preserves an empty scores view', async () => {
    report.bomaScores.set(Array.from({ length: 10000 }, (_, id) => ({ id } as FingerScore)));
    expect(report.visibleBomaScores().length).toBe(20);
    spyOn(service, 'getBomaScores').and.resolveTo({ success: true, data: [] } as any);
    await report.loadBomaScores(boma);
    expect(report.bomaView()).toBe('scores');
    expect(report.bomaScores()).toEqual([]);
  });
});
