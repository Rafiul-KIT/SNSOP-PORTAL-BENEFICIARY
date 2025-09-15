import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryArchiveApprovalList } from './beneficiary-archive-approval-list';

describe('BeneficiaryArchiveApproval', () => {
  let component: BeneficiaryArchiveApprovalList;
  let fixture: ComponentFixture<BeneficiaryArchiveApprovalList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryArchiveApprovalList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryArchiveApprovalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
