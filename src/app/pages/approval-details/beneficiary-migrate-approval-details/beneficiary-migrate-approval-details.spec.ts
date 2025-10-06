import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMigrateApprovalDetails } from './beneficiary-migrate-approval-details';

describe('BeneficiaryMigrateApprovalDetails', () => {
  let component: BeneficiaryMigrateApprovalDetails;
  let fixture: ComponentFixture<BeneficiaryMigrateApprovalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMigrateApprovalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMigrateApprovalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
