import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryDetailsView } from './beneficiary-details-view';

describe('BeneficiaryDetailsView', () => {
  let component: BeneficiaryDetailsView;
  let fixture: ComponentFixture<BeneficiaryDetailsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryDetailsView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryDetailsView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
