import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryEditApprovalDetails } from './beneficiary-edit-approval-details';

describe('BeneficiaryEditApprovalDetails', () => {
  let component: BeneficiaryEditApprovalDetails;
  let fixture: ComponentFixture<BeneficiaryEditApprovalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryEditApprovalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryEditApprovalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
