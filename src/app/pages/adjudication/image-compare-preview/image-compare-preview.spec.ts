import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ImageComparePreview } from './image-compare-preview';

describe('ImageComparePreview', () => {
  let component: ImageComparePreview;
  let fixture: ComponentFixture<ImageComparePreview>;
  const mockPrimaryImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
  const mockSecondaryImage = 'secondary.jpg';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageComparePreview],
      providers: [
        { provide: DynamicDialogRef, useValue: { close: () => {} } },
        { 
          provide: DynamicDialogConfig, 
          useValue: { 
            data: { 
              primary: mockPrimaryImages, 
              secondary: mockSecondaryImage 
            } 
          } 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageComparePreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the first primary image as active', () => {
    expect(component.activePrimaryImage).toBe(mockPrimaryImages[0]);
  });

  it('should have all primary images', () => {
    expect(component.primaryImages).toEqual(mockPrimaryImages);
  });

  it('should have the secondary image', () => {
    expect(component.secondaryImage).toBe(mockSecondaryImage);
  });

  it('should change the active primary image on click', () => {
    component.setActivePrimaryImage(mockPrimaryImages[1]);
    expect(component.activePrimaryImage).toBe(mockPrimaryImages[1]);
  });
});
