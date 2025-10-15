import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjudicationList } from './adjudication-list';

describe('AdjudicationList', () => {
  let component: AdjudicationList;
  let fixture: ComponentFixture<AdjudicationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjudicationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdjudicationList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
