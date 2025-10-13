import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryEditApprovalList } from './beneficiary-edit-approval-list';

describe('BeneficiaryEditApproval', () => {
  let component: BeneficiaryEditApprovalList;
  let fixture: ComponentFixture<BeneficiaryEditApprovalList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryEditApprovalList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryEditApprovalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
