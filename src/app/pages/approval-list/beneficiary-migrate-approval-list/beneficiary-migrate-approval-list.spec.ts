import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMigrateApprovalList } from './beneficiary-migrate-approval-list';

describe('BeneficiaryMigrateApproval', () => {
  let component: BeneficiaryMigrateApprovalList;
  let fixture: ComponentFixture<BeneficiaryMigrateApprovalList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMigrateApprovalList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMigrateApprovalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
