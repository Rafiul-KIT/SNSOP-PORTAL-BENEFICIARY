import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';


@Injectable({
   providedIn: 'root'
})
export class QrScannerService {
   private html5QrCode: Html5Qrcode | null = null;
   private scanningSubject = new BehaviorSubject<boolean>(false);
   public isScanning$: Observable<boolean> = this.scanningSubject.asObservable();


   constructor() { }


   async startScanning(
       elementId: string,
       onSuccess: (decodedText: string) => void,
       onError?: (error: string) => void
   ): Promise<void> {
       try {
           this.html5QrCode = new Html5Qrcode(elementId);


           const config = {
               fps: 10,
               qrbox: { width: 250, height: 250 },
               aspectRatio: 1.0
           };


           await this.html5QrCode.start(
               { facingMode: 'environment' },
               config,
               (decodedText: string) => {
                   onSuccess(decodedText);
                   this.stopScanning();
               },
               (errorMessage: string) => {
                   if (onError && !errorMessage.includes('NotFoundException')) {
                       onError(errorMessage);
                   }
               }
           );


           this.scanningSubject.next(true);


       } catch (err) {
           console.error('Error starting QR scanner:', err);
           if (onError) onError('Failed to start camera');
       }
   }


   async stopScanning(): Promise<void> {
       if (this.html5QrCode && this.scanningSubject.value) {
           try {
               await this.html5QrCode.stop();
               await this.html5QrCode.clear();
           } catch (err) {
               console.error('Error stopping QR scanner:', err);
           }
       }


       this.scanningSubject.next(false);
       this.html5QrCode = null;
   }


   isCurrentlyScanning(): boolean {
       return this.scanningSubject.value;
   }
}
