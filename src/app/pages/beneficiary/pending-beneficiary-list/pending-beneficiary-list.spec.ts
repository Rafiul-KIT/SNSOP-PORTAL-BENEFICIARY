import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingBeneficiaryList } from './pending-beneficiary-list';

describe('PendingBeneficiaryList', () => {
  let component: PendingBeneficiaryList;
  let fixture: ComponentFixture<PendingBeneficiaryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingBeneficiaryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingBeneficiaryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
