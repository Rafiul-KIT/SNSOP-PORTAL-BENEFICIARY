import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { LoadingSpinner } from "../../../components/loading-spinner/loading-spinner";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-compare-preview',
  standalone: true,                               
  imports: [LoadingSpinner,CommonModule],                        
  templateUrl: './image-compare-preview.html',
  styleUrls: ['./image-compare-preview.scss']       
})
export class ImageComparePreview implements OnInit {

  isLoading: boolean = true;
  primaryImage: string = '';
  secondaryImage: string = '';

  constructor(
    private conf: DynamicDialogConfig
  ) { }

  ngOnInit(): void {
    // console.log(this.conf.data);
    this.primaryImage = this.conf.data.primary;
    this.secondaryImage = this.conf.data.secondary;
    this.isLoading = false;
  }

}
