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

  wsqLt?: string;
  wsqLi?: string;
  wsqLm?: string;
  wsqLr?: string;
  wsqLs?: string;
  wsqRt?: string;
  wsqRi?: string;
  wsqRm?: string;
  wsqRr?: string;
  wsqRs?: string;

  tickImageForLt?: boolean;
  tickImageForLi?: boolean;
  tickImageForLm?: boolean;
  tickImageForLr?: boolean;
  tickImageForLs?: boolean;
  tickImageForRt?: boolean;
  tickImageForRi?: boolean;
  tickImageForRm?: boolean;
  tickImageForRr?: boolean;
  tickImageForRs?: boolean;
}
