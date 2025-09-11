import { Gender } from './enums';

export interface BiometricDto {
  applicationId: string;
  biometricUserType: 'BENEFICIARY' | 'NOMINEE' | 'ALTERNATE';
  noFingerPrint: boolean;
  noFingerprintReason?: string;
  noFingerprintReasonText?: string;
  photo?: string;

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
}
