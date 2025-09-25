import { BiometricDto } from './biometric.dto';
import { DocumentType, Gender, RelationshipWithHead } from './enums';

export interface AlternatePayeeDto {
  payeeFirstName: string;
  payeeMiddleName?: string;
  payeeLastName: string;
  payeeNickName?: string;
  payeeGender: Gender;
  payeeAge: number;
  relationshipWithHouseholdHead: RelationshipWithHead;
  relationshipOther?: string;
  documentType: DocumentType;
  documentTypeOther?: string;
  nationalId: string;
  payeePhoneNo: string;
  biometrics?: BiometricDto;
}
