import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingBeneficiaryManage } from './pending-beneficiary-manage';

describe('PendingBeneficiaryManage', () => {
  let component: PendingBeneficiaryManage;
  let fixture: ComponentFixture<PendingBeneficiaryManage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingBeneficiaryManage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingBeneficiaryManage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
