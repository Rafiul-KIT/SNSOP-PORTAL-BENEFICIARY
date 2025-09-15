import { Gender } from './enums';

export interface BiometricDto {
  applicationId: string;
  biometricUserType: 'BENEFICIARY' | 'NOMINEE' | 'ALTERNATE';
  noFingerPrint: boolean;
  noFingerprintReason?: string;
  noFingerprintReasonText?: string;
  photoData?: string;

  ltFingerData?: string;
  liFingerData?: string;
  lmFingerData?: string;
  lrFingerData?: string;
  lsFingerData?: string;
  rtFingerData?: string;
  riFingerData?: string;
  rmFingerData?: string;
  rrFingerData?: string;
  rsFingerData?: string;
}
