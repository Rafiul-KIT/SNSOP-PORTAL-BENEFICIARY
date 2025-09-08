import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryMigration } from './beneficiary-migration';

describe('BeneficiaryMigration', () => {
  let component: BeneficiaryMigration;
  let fixture: ComponentFixture<BeneficiaryMigration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryMigration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMigration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
