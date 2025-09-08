import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMigrateApproval } from './beneficiary-migrate-approval';

describe('BeneficiaryMigrateApproval', () => {
  let component: BeneficiaryMigrateApproval;
  let fixture: ComponentFixture<BeneficiaryMigrateApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMigrateApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMigrateApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
