import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryEditApproval } from './beneficiary-edit-approval';

describe('BeneficiaryEditApproval', () => {
  let component: BeneficiaryEditApproval;
  let fixture: ComponentFixture<BeneficiaryEditApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryEditApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryEditApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
