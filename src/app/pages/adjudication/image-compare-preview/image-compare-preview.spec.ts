import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageComparePreview } from './image-compare-preview';

describe('ImageComparePreview', () => {
  let component: ImageComparePreview;
  let fixture: ComponentFixture<ImageComparePreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageComparePreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageComparePreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
