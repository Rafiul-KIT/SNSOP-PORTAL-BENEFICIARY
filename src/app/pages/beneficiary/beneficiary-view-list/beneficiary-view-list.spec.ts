import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryViewList } from './beneficiary-view-list';

describe('BeneficiaryViewList', () => {
  let component: BeneficiaryViewList;
  let fixture: ComponentFixture<BeneficiaryViewList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryViewList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryViewList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
