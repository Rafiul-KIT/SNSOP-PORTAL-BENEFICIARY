import {
  Currency,
  DocumentType,
  Gender,
  LegalStatus,
  MaritalStatus,
  MobileMoneyProvider,
  NotParticipationReason,
  RegPhase,
  RelationshipWithHead,
  SelectionCriteria,
  SelectionReason,
  HouseholdIncomeSource,
} from './enums';
import { HouseholdMemberGroup } from './household.dto';
import { NomineeDto } from './nominee.dto';
import { AlternatePayeeDto } from './alternate.dto';
import { BiometricDto } from './biometric.dto';

export interface BeneficiaryDto {
  applicationId: string;

  respondentFirstName: string;
  respondentMiddleName?: string | null;
  respondentLastName: string;
  respondentNickName?: string | null;

  spouseFirstName?: string | null;
  spouseMiddleName?: string | null;
  spouseLastName?: string | null;
  spouseNickName?: string | null;

  relationshipWithHouseholdHead: RelationshipWithHead;
  relationshipOther?: string | null;

  respondentAge: number;
  respondentGender: Gender;
  respondentMaritalStatus: MaritalStatus;
  respondentLegalStatus: LegalStatus;

  documentType: DocumentType;
  documentTypeOther?: string | null;
  respondentId?: string | null;
  respondentPhoneNo?: string | null;

  householdIncomeSource: HouseholdIncomeSource;
  incomeSourceOther?: string | null;
  householdMonthlyAvgIncome: number;
  currency: Currency;

  selectionCriteria: SelectionCriteria;
  selectionReason: SelectionReason[];

  address?: {
    stateId: number;
    countyId: number;
    payam: number;
    boma: string;
    lat: number;
    lon: number;
  };
  location?: {
      lat: number;
      lon: number;
    };

  householdSize: number;
  householdMember2?: HouseholdMemberGroup;
  householdMember5?: HouseholdMemberGroup;
  householdMember17?: HouseholdMemberGroup;
  householdMember35?: HouseholdMemberGroup;
  householdMember64?: HouseholdMemberGroup;
  householdMember65?: HouseholdMemberGroup;
  householdMemberLactating35?: HouseholdMemberGroup;
  householdMemberLactating64?: HouseholdMemberGroup;

  isReadWrite: boolean;
  memberReadWrite: number;
  isOtherMemberPerticipating: boolean;
  notPerticipationReason?: NotParticipationReason;
  notPerticipationOtherReason?: string;

  nominees: NomineeDto[];
  alternatePayee1?: AlternatePayeeDto;
  alternatePayee2?: AlternatePayeeDto;

  biometrics?: BiometricDto;

  createdBy: number;
  updatedBy: number;
  created: string; // ISO date-time
  updated: string; // ISO date-time

  registrationPhase: RegPhase;
  hasMobileWallet: boolean;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileWalletNumber?: string | null;

  requestId: string;
  comment: string;
  activeStatus: number;
}
