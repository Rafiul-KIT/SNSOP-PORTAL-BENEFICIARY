import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryRestoreDetails } from './beneficiary-restore-details';

describe('BeneficiaryRestoreDetails', () => {
  let component: BeneficiaryRestoreDetails;
  let fixture: ComponentFixture<BeneficiaryRestoreDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryRestoreDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryRestoreDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
