import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncReportGenerationList } from './async-report-generation-list';

describe('AsyncReportGenerationList', () => {
  let component: AsyncReportGenerationList;
  let fixture: ComponentFixture<AsyncReportGenerationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsyncReportGenerationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsyncReportGenerationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
