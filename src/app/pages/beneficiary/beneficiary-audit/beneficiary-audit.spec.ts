import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryAudit } from './beneficiary-audit';

describe('BeneficiaryAudit', () => {
  let component: BeneficiaryAudit;
  let fixture: ComponentFixture<BeneficiaryAudit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryAudit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAudit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
