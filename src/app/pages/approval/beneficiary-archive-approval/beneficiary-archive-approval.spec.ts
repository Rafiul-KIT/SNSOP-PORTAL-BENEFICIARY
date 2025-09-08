import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryArchiveApproval } from './beneficiary-archive-approval';

describe('BeneficiaryArchiveApproval', () => {
  let component: BeneficiaryArchiveApproval;
  let fixture: ComponentFixture<BeneficiaryArchiveApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryArchiveApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryArchiveApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
