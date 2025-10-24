import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewRegistration } from './new-registration';

describe('NewRegistration', () => {
  let component: NewRegistration;
  let fixture: ComponentFixture<NewRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
