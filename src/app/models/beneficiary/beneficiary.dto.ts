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
  respondentMiddleName?: string;
  respondentLastName: string;
  respondentNickName?: string;

  spouseFirstName?: string;
  spouseMiddleName?: string;
  spouseLastName?: string;
  spouseNickName?: string;

  relationshipWithHouseholdHead: RelationshipWithHead;
  relationshipOther?: string;

  respondentAge: number;
  respondentGender: Gender;
  respondentMaritalStatus: MaritalStatus;
  respondentLegalStatus: LegalStatus;

  documentType: DocumentType;
  documentTypeOther?: string;
  respondentId: string;
  respondentPhoneNo: string;

  householdIncomeSource: HouseholdIncomeSource;
  incomeSourceOther?: string;
  householdMonthlyAvgIncome: number;
  currency: Currency;

  selectionCriteria: SelectionCriteria;
  selectionReason: SelectionReason[];

  address?: {
    stateId: number;
    countyId: number;
    payam: number;
    boma: string;
    location?: {
      lat: number;
      lon: number;
    };
  };

  householdSize: number;
  householdMember2?: HouseholdMemberGroup;
  householdMember5?: HouseholdMemberGroup;
  householdMember17?: HouseholdMemberGroup;
  householdMember35?: HouseholdMemberGroup;
  householdMember64?: HouseholdMemberGroup;
  householdMember65?: HouseholdMemberGroup;

  isReadWrite: boolean;
  memberReadWrite: number;
  isOtherMemberPerticipating: boolean;
  notPerticipationReason?: NotParticipationReason;
  notPerticipationOtherReason?: string;

  nominees: NomineeDto[];
  alternatePayee1?: AlternatePayeeDto;
  alternatePayee2?: AlternatePayeeDto;

  biometric?: BiometricDto;

  createdBy: number;
  updatedBy: number;
  created: string; // ISO date-time
  updated: string; // ISO date-time

  registrationPhase: RegPhase;
  hasMobileWallet: boolean;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileWalletNumber?: string;

  requestId: string;
}
