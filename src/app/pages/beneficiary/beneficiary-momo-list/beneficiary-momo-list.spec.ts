import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMomoList } from './beneficiary-momo-list';

describe('BeneficiaryMomoList', () => {
  let component: BeneficiaryMomoList;
  let fixture: ComponentFixture<BeneficiaryMomoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMomoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMomoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
