import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryArchiveApprovalDetails } from './beneficiary-archive-approval-details';

describe('BeneficiaryArchiveApprovalDetails', () => {
  let component: BeneficiaryArchiveApprovalDetails;
  let fixture: ComponentFixture<BeneficiaryArchiveApprovalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryArchiveApprovalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryArchiveApprovalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
