import { BiometricDto } from './biometric.dto';
import { DocumentType, Gender, RelationshipWithHead } from './enums';

export interface AlternatePayeeDto {
  id: number;
  payeeFirstName: string;
  payeeMiddleName?: string;
  payeeLastName: string;
  payeeNickName?: string;
  payeeGender: Gender;
  payeeAge: number;
  relationshipWithHouseholdHead: RelationshipWithHead;
  relationshipOther?: string;
  documentType: DocumentType;
  documentTypeOther?: string| null;
  nationalId?: string | null;
  payeePhoneNo: string;
  biometrics?: BiometricDto;
}
