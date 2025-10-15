import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAuditDetails } from './beneficiary-audit-details';

describe('BeneficiaryAuditDetails', () => {
  let component: BeneficiaryAuditDetails;
  let fixture: ComponentFixture<BeneficiaryAuditDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAuditDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAuditDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
