import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiaryArchive } from './beneficiary-archive';

describe('BeneficiaryArchive', () => {
  let component: BeneficiaryArchive;
  let fixture: ComponentFixture<BeneficiaryArchive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiaryArchive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryArchive);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
