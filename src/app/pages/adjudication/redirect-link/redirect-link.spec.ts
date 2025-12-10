import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedirectLink } from './redirect-link';

describe('RedirectLink', () => {
  let component: RedirectLink;
  let fixture: ComponentFixture<RedirectLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectLink]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedirectLink);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
