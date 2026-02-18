import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportPaymentMethodWiseBeneficiaryList } from './report-payment-method-wise-beneficiary-list';

describe('ReportPaymentMethodWiseBeneficiaryList', () => {
  let component: ReportPaymentMethodWiseBeneficiaryList;
  let fixture: ComponentFixture<ReportPaymentMethodWiseBeneficiaryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportPaymentMethodWiseBeneficiaryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportPaymentMethodWiseBeneficiaryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
