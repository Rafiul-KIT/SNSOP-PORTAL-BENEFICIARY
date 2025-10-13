import { BiometricDto } from './biometric.dto';
import { Gender, Occupation, RelationshipWithHead } from './enums';

export interface NomineeDto {
  id: number;
  applicationId: string;
  nomineeFirstName: string;
  nomineeMiddleName?: string;
  nomineeLastName: string;
  nomineeNickName?: string;
  relationshipWithHouseholdHead: RelationshipWithHead;
  relationshipOther?: string;
  nomineeAge: number;
  nomineeGender: Gender;
  isReadWrite?: boolean;
  nomineeOccupation: Occupation;
  otherOccupation?: string;
  biometric?: BiometricDto;
}
