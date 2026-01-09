import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LoadingSpinner } from '../../../components/loading-spinner/loading-spinner';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-image-compare-preview',
  standalone: true,
  imports: [LoadingSpinner, CommonModule, Button],
  templateUrl: './image-compare-preview.html',
  styleUrls: ['./image-compare-preview.scss'],
})
export class ImageComparePreview implements OnInit {
  isLoading: boolean = true;
  primaryImages: string[] = [];
  secondaryImage: string = '';
  activePrimaryImage: string = '';

  fingerprintNames: string[] = [
    'R-Thumb',
    'R-Index',
    'R-Middle',
    'R-Ring',
    'R-Little',
    'L-Thumb',
    'L-Index',
    'L-Middle',
    'L-Ring',
    'L-Little',
  ];

  constructor(
    private conf: DynamicDialogConfig,
    private ref: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    this.primaryImages = this.conf.data.primary;
    this.secondaryImage = this.conf.data.secondary;

    if (this.primaryImages && this.primaryImages.length > 0) {
      this.activePrimaryImage = this.primaryImages[0];
    }

    this.isLoading = false;
  }

  setActivePrimaryImage(image: string): void {
    this.activePrimaryImage = image;
  }

  closeDialog() {
    this.ref.close();
  }
}

