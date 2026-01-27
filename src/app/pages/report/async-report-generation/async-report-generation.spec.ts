import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncReportGeneration } from './async-report-generation';

describe('AsyncReportGeneration', () => {
  let component: AsyncReportGeneration;
  let fixture: ComponentFixture<AsyncReportGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsyncReportGeneration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsyncReportGeneration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
