import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryEdit } from './beneficiary-edit';

describe('BeneficiaryEdit', () => {
  let component: BeneficiaryEdit;
  let fixture: ComponentFixture<BeneficiaryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
