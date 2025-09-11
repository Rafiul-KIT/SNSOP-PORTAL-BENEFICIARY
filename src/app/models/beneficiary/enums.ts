export type Gender = 'MALE' | 'FEMALE';
export type RegPhase = 'PARENT' | 'AF';

export type RelationshipWithHead =
  | 'HOUSEHOLD_HEAD'
  | 'SPOUSE'
  | 'SON_DAUGHTER'
  | 'SON_DAUGHTER_IN_LAW'
  | 'GRANDCHILD'
  | 'PARENT'
  | 'PARENT_IN_LAW'
  | 'SIBLING'
  | 'SIBLING_IN_LAW'
  | 'OTHER'
  | 'DOMESTIC_WORKER'
  | 'NO_RELATION'
  | 'UNKNOWN';

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOW' | 'SEPARATED' | 'DIVORCE';
export type LegalStatus = 'HOST' | 'RETURNEE' | 'REFUGEE' | 'IDP';
export type DocumentType = 'PASSPORT' | 'NATIONAL_ID' | 'OTHER' | 'NONE';

export type HouseholdIncomeSource =
  | 'NONE'
  | 'SELLING_OF_FARM'
  | 'SELLING_OF_NON_FARM'
  | 'CAUSAL_LABOUR'
  | 'FORMAL_EMPLOYMENT'
  | 'REMITTANCES'
  | 'GIFT'
  | 'FROM_GOVT'
  | 'FROM_NGO'
  | 'PENSION'
  | 'OTHER';

export type Currency = 'SUDANESE_POUND' | 'USD' | 'POUND' | 'EURO';
export type SelectionCriteria = 'LIPW' | 'DIS' | 'ALL';
export type SelectionReason =
  | 'LIPW_REASON_1'
  | 'LIPW_REASON_2'
  | 'LIPW_REASON_3'
  | 'LIPW_REASON_4'
  | 'LIPW_REASON_5'
  | 'DIS_REASON_1'
  | 'DIS_REASON_2'
  | 'DIS_REASON_3'
  | 'DIS_REASON_4'
  | 'DIS_REASON_5';

export type NotParticipationReason =
  | 'REASON_1'
  | 'REASON_2'
  | 'REASON_3'
  | 'REASON_4'
  | 'REASON_5'
  | 'REASON_6'
  | 'REASON_OTHER';

export type MobileMoneyProvider = 'MOMO' | 'MGURUSH' | 'DIGICASH';
export type Occupation =
  | 'FORMAL_JOB'
  | 'CASUAL_WORK'
  | 'SELF_EMPLOYED'
  | 'AGRICULTURAL_WORK'
  | 'HOMEMAKER'
  | 'UNEMPLOYED'
  | 'STUDENT'
  | 'DISABLED'
  | 'RETIRED'
  | 'OTHER'
  | 'SELECT';
