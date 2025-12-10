
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { QrScannerService } from '../../services/qr-scanner.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [modal]="true" 
      [closable]="true" 
      [closeOnEscape]="true"
      [draggable]="false"
      [resizable]="false"
      [header]="dialogHeader"
      [style]="dialogStyle"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()">
      
      <div class="qr-scanner-container">
        <div id="qr-reader" class="qr-reader"></div>
        <p class="text-center mt-3 text-muted scan-instruction">
          <i class="fas fa-camera me-2"></i>
          {{ instructionText }}
        </p>
      </div>

      <ng-template pTemplate="footer">
        <p-button 
          [label]="cancelButtonLabel" 
          icon="fas fa-times" 
          severity="secondary" 
          (onClick)="close()"
          [outlined]="true">
        </p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .qr-scanner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
    }

    .qr-reader {
      width: 100%;
      max-width: 400px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      min-height: 300px;
    }

    .qr-reader ::ng-deep #qr-shaded-region {
      border: 50px solid rgba(0, 0, 0, 0.5) !important;
    }

    .qr-reader ::ng-deep video {
      width: 100% !important;
      height: auto !important;
      display: block;
    }

    .qr-reader ::ng-deep img[alt="Info icon"],
    .qr-reader ::ng-deep img[alt="Camera scan"],
    .qr-reader ::ng-deep #qr-shaded-region img {
      display: none !important;
    }

    .qr-reader ::ng-deep div[style*="text-align: center"] {
      display: none !important;
    }

    .scan-instruction {
      margin-top: 1rem;
      color: #6c757d;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .scan-instruction i {
      color: #007bff;
    }

    @media (max-width: 768px) {
      .qr-scanner-container {
        padding: 0.5rem;
      }

      .qr-reader {
        max-width: 100%;
        min-height: 250px;
      }

      .scan-instruction {
        font-size: 0.85rem;
      }
    }

    .text-center {
      text-align: center !important;
    }

    .text-muted {
      color: #6c757d !important;
    }

    .mt-3 {
      margin-top: 1rem !important;
    }

    .me-2 {
      margin-right: 0.5rem !important;
    }
  `],
  providers: [QrScannerService]
})
export class QrScannerComponent implements OnDestroy {
  @Input() visible: boolean = false;
  @Input() dialogHeader: string = 'Scan QR Code';
  @Input() dialogStyle: any = { width: '90vw', maxWidth: '500px' };
  @Input() instructionText: string = 'Position the QR code within the frame';
  @Input() cancelButtonLabel: string = 'Cancel';
  @Input() autoClose: boolean = true;
  @Input() scannerConfig: any = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onScanSuccess = new EventEmitter<string>();
  @Output() onScanError = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();

  isScanning = false;

  constructor(
    private qrScanner: QrScannerService,
    private cdr: ChangeDetectorRef
  ) {}

  onDialogShow() {
    setTimeout(() => {
      this.startScanner();
    }, 300);
  }

  onDialogHide() {
    this.stopScanner();
    this.onClose.emit();
  }

  async startScanner() {
    this.isScanning = true;
    
    try {
      await this.qrScanner.startScanning(
        'qr-reader',
        (decodedText) => this.handleScanSuccess(decodedText),
        (error) => this.handleScanError(error)
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      this.handleScanError('Failed to access camera');
      this.close();
    }
  }

  handleScanSuccess(decodedText: string) {
    console.log('QR Code scanned:', decodedText);
    this.onScanSuccess.emit(decodedText);
    
    if (this.autoClose) {
      this.close();
    }
  }

  handleScanError(error: string) {
    if (!error.includes('NotFoundException')) {
      console.warn('QR Scan Error:', error);
      this.onScanError.emit(error);
    }
  }

  async stopScanner() {
    if (this.isScanning) {
      await this.qrScanner.stopScanning();
      this.isScanning = false;
      this.cdr.detectChanges();
    }
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  ngOnDestroy() {
    this.stopScanner();
  }
}