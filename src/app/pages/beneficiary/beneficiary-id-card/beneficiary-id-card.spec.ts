import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryIdCard } from './beneficiary-id-card';

describe('BeneficiaryIdCard', () => {
  let component: BeneficiaryIdCard;
  let fixture: ComponentFixture<BeneficiaryIdCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryIdCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryIdCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
