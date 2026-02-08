import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMomoWalletUpdate } from './beneficiary-momo-wallet-update';

describe('BeneficiaryMomoWalletUpdate', () => {
  let component: BeneficiaryMomoWalletUpdate;
  let fixture: ComponentFixture<BeneficiaryMomoWalletUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMomoWalletUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMomoWalletUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
