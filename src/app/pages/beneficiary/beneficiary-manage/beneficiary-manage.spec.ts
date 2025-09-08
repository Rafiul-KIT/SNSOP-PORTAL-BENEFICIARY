import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryManage } from './beneficiary-manage';

describe('BeneficiaryManage', () => {
  let component: BeneficiaryManage;
  let fixture: ComponentFixture<BeneficiaryManage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryManage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryManage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
