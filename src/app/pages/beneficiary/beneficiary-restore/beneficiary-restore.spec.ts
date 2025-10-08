import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryRestore } from './beneficiary-restore';

describe('BeneficiaryRestore', () => {
  let component: BeneficiaryRestore;
  let fixture: ComponentFixture<BeneficiaryRestore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryRestore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryRestore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
