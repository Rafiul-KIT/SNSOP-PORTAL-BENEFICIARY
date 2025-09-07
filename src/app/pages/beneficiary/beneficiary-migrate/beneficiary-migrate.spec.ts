import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMigrate } from './beneficiary-migrate';

describe('BeneficiaryMigrate', () => {
  let component: BeneficiaryMigrate;
  let fixture: ComponentFixture<BeneficiaryMigrate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMigrate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMigrate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
