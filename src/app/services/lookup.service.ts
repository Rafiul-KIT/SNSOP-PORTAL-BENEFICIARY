import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface GetLookupRequest {
  lookupType: 'STATE' | 'COUNTY' | 'PAYAM' | 'BOMA';
  id?: string;
  parentId?: string;
  name?: string;
  from?: number;
  size?: number;
}

export interface LookupItem {
  id: string;
  name: string;
}

export interface GetLookupResponse {
  operationResult: boolean;
  errorMsg?: string;
  errorCode?: number;
  lookups: LookupItem[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private stateList: LookupItem[] = [];
  private allCountyList: LookupItem[] = [];
  private allPayamList: LookupItem[] = [];
  private allBomaList: LookupItem[] = [];
  private countyList: LookupItem[] = [];
  private payamList: LookupItem[] = [];
  private bomaList: LookupItem[] = [];

  constructor(private api: ApiService) {}

  // ---------- State ----------
  setStateList(states: LookupItem[]) {
    this.stateList = states;
  }
  getStateList() {
    return this.stateList;
  }
  getStateNameById(stateId: string) {
    const state = this.stateList.find(
      (sl) => String(sl.id) === String(stateId)
    );
    return state ? state.name : '--';
  }

  getOrFetchStateList(): Promise<LookupItem[]> {
    if (this.stateList.length) return Promise.resolve(this.stateList);
    return this.fetchLookup({ lookupType: 'STATE', size: -1 }).then((list) => {
      this.setStateList(list);
      return list;
    });
  }

  fetchAllCountyList(): Promise<LookupItem[]> {
    if (this.allCountyList.length) return Promise.resolve(this.allCountyList);
    return this.fetchLookup({ lookupType: 'COUNTY', size: -1 }).then((list) => {
      this.allCountyList = list;
      return list;
    });
  }

  fetchAllPayamList(): Promise<LookupItem[]> {
    if (this.allPayamList.length) return Promise.resolve(this.allPayamList);
    return this.fetchLookup({ lookupType: 'PAYAM', size: -1 }).then((list) => {
      this.allPayamList = list;
      return list;
    });
  }

  fetchAllBomaList(): Promise<LookupItem[]> {
    if (this.allBomaList.length) return Promise.resolve(this.allBomaList);
    return this.fetchLookup({ lookupType: 'BOMA', size: -1 }).then((list) => {
      this.allBomaList = list;
      return list;
    });
  }

  getAllCountyList = () => {
    return this.allCountyList;
  };
  getAllPayamList = () => {
    return this.allPayamList;
  };
  getAllBomaList = () => {
    return this.allBomaList;
  };

  // ---------- County ----------
  setCountyList(counties: LookupItem[]) {
    this.countyList = counties;
  }
  getCountyList() {
    return this.countyList;
  }
  getCountyNameById(countyId: string) {
    const county = this.countyList.find(
      (sl) => String(sl.id) === String(countyId)
    );
    return county ? county.name : '--';
  }

  getCountyListByStateId(stateId: string): Promise<LookupItem[]> {
    return this.fetchLookup({
      lookupType: 'COUNTY',
      parentId: stateId,
      size: -1,
    }).then((list) => {
      this.setCountyList(list);
      return list;
    });
  }

  // ---------- Payam ----------
  setPayamList(payams: LookupItem[]) {
    this.payamList = payams;
  }
  getPayamList() {
    return this.payamList;
  }
  getPayamNameById(payamId: string) {
    const payam = this.payamList.find(
      (sl) => String(sl.id) === String(payamId)
    );
    return payam ? payam.name : '--';
  }

  getPayamListByCountyId(countyId: string): Promise<LookupItem[]> {
    return this.fetchLookup({
      lookupType: 'PAYAM',
      parentId: countyId,
      size: -1,
    }).then((list) => {
      this.setPayamList(list);
      return list;
    });
  }

  // ---------- Boma ----------
  setBomaList(bomas: LookupItem[]) {
    this.bomaList = bomas;
  }
  getBomaList() {
    return this.bomaList;
  }
  getBomaNameById(bomaId: string) {
    const boma = this.bomaList.find((sl) => String(sl.id) === String(bomaId));
    return boma ? boma.name : '--';
  }

  getBomaListByPayamId(payamId: string): Promise<LookupItem[]> {
    return this.fetchLookup({
      lookupType: 'BOMA',
      parentId: payamId,
      size: -1,
    }).then((list) => {
      this.setBomaList(list);
      return list;
    });
  }

  // ---------- Central fetcher ----------
  private fetchLookup(req: GetLookupRequest): Promise<LookupItem[]> {
    return this.api
      .POST('api/lookup/geo/search', req)
      .then((res: any) => {
        const data: GetLookupResponse = res?.data;
        if (data?.operationResult) {
          return data.lookups ?? [];
        }
        return [];
      })
      .catch(() => {
        return [];
      });
  }

  getGenderList(): LookupItem[] {
    return [
      { id: 'MALE', name: 'Male' },
      { id: 'FEMALE', name: 'Female' },
    ];
  }

  getRegistrationPhaseList(): LookupItem[] {
    return [
      { id: 'PARENT', name: 'Parent' },
      { id: 'AF', name: 'AF' },
    ];
  }

  SelectionCriteriaEnum = [
    { id: 0, value: 'LIPW', label: 'Public Works' },
    { id: 1, value: 'DIS', label: 'Direct Income Support' },
  ];
  getSelectionCriteriaEnum = () => {
    return this.SelectionCriteriaEnum;
  };

  getSelectionCriteriaEnumByValue = (value: any) => {
    const dataFpund = this.SelectionCriteriaEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  NotParticipationReasonEnum = [
    {
      id: 1,
      value: 'REASON_1',
      label:
        'All other eligible household members have other commitments that occupy their time',
    },
    {
      id: 2,
      value: 'REASON_2',
      label:
        "I am uncertain about the ability of the other household members to comply with the program's expectations or conditions",
    },
    {
      id: 3,
      value: 'REASON_3',
      label:
        'The health or physical condition of the other eligible household members prevents me from participating',
    },
    {
      id: 4,
      value: 'REASON_4',
      label:
        'I am not convinced that the program will provide meaningful benefits',
    },
    {
      id: 5,
      value: 'REASON_5',
      label: "The program activities don't align with my interests",
    },
    {
      id: 6,
      value: 'REASON_6',
      label: 'All eligible household members have already been nominated',
    },
    { id: 7, value: 'REASON_OTHER', label: 'Other' },
  ];
  getNotParticipationReasonEnum = () => {
    return this.NotParticipationReasonEnum;
  };
  getNotParticipationReasonEnumByValue = (value: any) => {
    const dataFpund = this.NotParticipationReasonEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  SelectionReasonEnum = [
    {
      id: 1,
      value: 'LIPW_REASON_1',
      label:
        'Poor household with no sufficient income to sustain the household',
    },
    {
      id: 2,
      value: 'LIPW_REASON_2',
      label: 'Household contain able bodied youth member (18-35)',
    },
    {
      id: 3,
      value: 'LIPW_REASON_3',
      label:
        'Household headed by young men and women between the ages of 18 and 35',
    },
    {
      id: 4,
      value: 'LIPW_REASON_4',
      label:
        'Many members who are dependents (HH with dependants greater than 3)',
    },
    {
      id: 5,
      value: 'LIPW_REASON_5',
      label: 'Poor household which have persons with severe disabilities',
    },
    {
      id: 6,
      value: 'DIS_REASON_1',
      label: 'Child headed households with no alternate income support',
    },
    {
      id: 7,
      value: 'DIS_REASON_2',
      label:
        'Elderly headed household lacking alternate income support and able bodied member',
    },
    {
      id: 8,
      value: 'DIS_REASON_3',
      label:
        'Persons with disability headed household lacking alternate income support and able bodied member',
    },
    {
      id: 9,
      value: 'DIS_REASON_4',
      label:
        'Chronically ill headed household lacking alternate income and able bodied member',
    },
    {
      id: 10,
      value: 'DIS_REASON_5',
      label:
        'Female headed household lacking alternate income support and able-bodied member',
    },
  ];
  getSelectionReasonEnum = () => {
    return this.SelectionReasonEnum;
  };
  getSelectionReasonEnumByValue = (value: any) => {
    const dataFound = this.SelectionReasonEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFound) {
      return dataFound.label;
    } else {
      return '--';
    }
  };

  PublicWorkEnum = [
    {
      id: 1,
      value: 'POOR_HOUSEHOLD',
      label:
        'Poor household with no sufficient income to sustain the household',
    },
    {
      id: 2,
      value: 'BODIED_YOUTH_MEMBER',
      label: 'Household contain able bodied youth member (18–35)',
    },
    {
      id: 3,
      value: 'HEADED_YOUNG_MEMBER',
      label:
        'Household headed by young men and women between the ages of 18 and 35',
    },
    {
      id: 4,
      value: 'HOUSEHOLD_THREE_OR_MORE_DEPENDENTS',
      label: 'Household has three or more dependents',
    },
    {
      id: 5,
      value: 'POOR_HOUSEHOLD_WITH_SEVERE_DISABILITIES',
      label: 'Poor household which have persons with severe disabilities',
    },
  ];
  getPublicWorkEnum = () => {
    return this.PublicWorkEnum;
  };
  getPublicWorkEnumByValue = (value: any) => {
    const dataFpund = this.PublicWorkEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  RelationshipEnum = [
    { id: 1, value: 'HOUSEHOLD_HEAD', label: 'Household Head' },
    { id: 2, value: 'SPOUSE', label: 'Spouse' },
    { id: 3, value: 'SON_DAUGHTER', label: 'Son/Daughter' },
    { id: 4, value: 'SON_DAUGHTER_IN_LAW', label: 'Son/daughter in law' },
    { id: 5, value: 'GRANDCHILD', label: 'Grandchild' },
    { id: 6, value: 'PARENT', label: 'Parent' },
    { id: 7, value: 'PARENT_IN_LAW', label: 'Parent-in-law' },
    { id: 8, value: 'SIBLING_IN_LAW', label: 'Sibling-in-law' },
    { id: 9, value: 'SIBLING', label: 'Sibling' },
    { id: 10, value: 'OTHER', label: 'Other' },
    { id: 11, value: 'DOMESTIC_WORKER', label: 'Domestic Worker' },
    { id: 12, value: 'NO_RELATION', label: 'No Relation' },
  ];
  getRelationshipEnum = () => {
    return this.RelationshipEnum;
  };
  getRelationshipEnumByValue = (value: any) => {
    const dataFpund = this.RelationshipEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  MaritalStatusEnum = [
    { id: 0, value: 'SINGLE', label: 'Single' },
    { id: 1, value: 'MARRIED', label: 'Married' },
    { id: 2, value: 'WIDOW', label: 'Widow' },
    { id: 3, value: 'SEPARATED', label: 'Separated' },
    { id: 4, value: 'DIVORCE', label: 'Divorce' },
  ];
  getMaritalStatusEnum = () => {
    return this.MaritalStatusEnum;
  };
  getMaritalStatusEnumByValue = (value: any) => {
    const dataFpund = this.MaritalStatusEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  LegalStatusEnum = [
    { id: 0, value: 'HOST', label: 'Host' },
    { id: 1, value: 'RETURNEE', label: 'Returnee' },
    { id: 2, value: 'REFUGEE', label: 'Refugee' },
    { id: 3, value: 'IDP', label: 'IDP' },
  ];
  getLegalStatusEnum = () => {
    return this.LegalStatusEnum;
  };
  getLegalStatusEnumByValue = (value: any) => {
    const dataFpund = this.LegalStatusEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  BiometricTypeEnum = [
    { id: 1, value: 'PHOTO', label: 'Photo' },
    { id: 2, value: 'LT', label: 'Left Thumb' },
    { id: 3, value: 'LI', label: 'Left Index' },
    { id: 4, value: 'LM', label: 'Left Middle' },
    { id: 5, value: 'LR', label: 'Left Ring' },
    { id: 6, value: 'LL', label: 'Left Little' },
    { id: 7, value: 'RT', label: 'Right Thumb' },
    { id: 8, value: 'RI', label: 'Right Index' },
    { id: 9, value: 'RM', label: 'Right Middle' },
    { id: 10, value: 'RR', label: 'Right Ring' },
    { id: 11, value: 'RL', label: 'Right Little' },
    { id: 12, value: 'NA', label: 'NA' },
  ];
  getBiometricTypeEnum = () => {
    return this.BiometricTypeEnum;
  };
  getBiometricTypeEnumByValue = (value: any) => {
    const dataFpund = this.BiometricTypeEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  BiometricUserTypeEnum = [
    { id: 1, value: 'BENEFICIARY', label: 'BENEFICIARY' },
    { id: 2, value: 'NOMINEE', label: 'NOMINEE' },
    { id: 3, value: 'ALTERNATE', label: 'ALTERNATE' },
  ];
  getBiometricUserTypeEnum = () => {
    return this.BiometricUserTypeEnum;
  };
  getBiometricUserTypeEnumByValue = (value: any) => {
    const dataFpund = this.BiometricUserTypeEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  CurrencyEnum = [
    { id: 0, value: 'SUDANESE_POUND', label: 'SDG' },
    { id: 1, value: 'USD', label: 'USD' },
    { id: 1, value: 'POUND', label: 'POUND' },
    { id: 1, value: 'EURO', label: 'EURO' },
  ];
  getCurrencyEnum = () => {
    return this.CurrencyEnum;
  };
  getCurrencyEnumByValue = (value: any) => {
    const dataFpund = this.CurrencyEnum.find((sce: any) => sce.value == value);
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  DocumentTypeEnum = [
    { id: 0, value: 'PASSPORT', label: 'Passport' },
    { id: 1, value: 'NATIONAL_ID', label: 'National Id' },
    { id: 2, value: 'OTHER', label: 'Other' },
    { id: 3, value: 'NONE', label: 'None' },
    { id: 4, value: 'REFUGEE_RATION_CARD', label: 'Refugee Ration Card' },
    { id: 5, value: 'REFUGEE_ID_CARD', label: 'Refugee Id Card' },
    {
      id: 6,
      value: 'REFUGEE_PROOF_OF_REGISTRATION',
      label: 'Refugee Proof of Registration',
    },
  ];
  getDocumentTypeEnum = () => {
    return this.DocumentTypeEnum;
  };
  getDocumentTypeEnumByValue = (value: any) => {
    const dataFpund = this.DocumentTypeEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  OccupationEnum = [
    { id: 1, value: 'FORMAL_JOB', label: 'Formal Job' },
    { id: 2, value: 'CASUAL_WORK', label: 'Casual Word' },
    { id: 3, value: 'SELF_EMPLOYED', label: 'Self Employed' },
    { id: 4, value: 'AGRICULTURAL_WORK', label: 'Agricultural Work' },
    { id: 5, value: 'HOMEMAKER', label: 'Homemaker' },
    { id: 6, value: 'UNEMPLOYED', label: 'Unemployed' },
    { id: 7, value: 'STUDENT', label: 'Student' },
    { id: 8, value: 'DISABLED', label: 'Disabled' },
    { id: 9, value: 'RETIRED', label: 'Retired' },
    { id: 10, value: 'OTHER', label: 'Other' },
  ];
  getOccupationEnum = () => {
    return this.OccupationEnum;
  };
  getOccupationEnumByValue = (value: any) => {
    const dataFpund = this.OccupationEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  NomineeOccupationEnum = [
    { id: 0, value: 'FORMAL_JOB', label: 'Employed in a formal job' },
    {
      id: 1,
      value: 'CASUAL_WORK_OR_DAILY_WAGE_LABOR',
      label: 'Casual work or daily wage labor',
    },
    {
      id: 2,
      value: 'SELF_EMPLOYED_BUSINESS_TRADE',
      label: 'Self-employed in a business or trade',
    },
    {
      id: 3,
      value: 'AGRICULTURAL_WORK_OR_FARMING',
      label: 'Agricultural work or farming',
    },
    {
      id: 4,
      value: 'HOMEMAKER',
      label: 'Homemaker (manages household activities)',
    },
    {
      id: 5,
      value: 'UNEMPLOYED_AND_ACTIVELY_SEEKING_WORK',
      label: 'Unemployed and actively seeking work',
    },
    { id: 6, value: 'STUDENT', label: 'Student or in education' },
    { id: 7, value: 'DISABLE', label: 'Disabled or chronically ill' },
    { id: 8, value: 'RETIRED', label: 'Retired or not working' },
    { id: 9, value: 'OTHERS', label: 'Other (specify)' },
  ];
  getNomineeOccupationEnum = () => {
    return this.NomineeOccupationEnum;
  };
  getNomineeOccupationEnumByValue = (value: any) => {
    const dataFpund = this.NomineeOccupationEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };

  NoFingerprintImpressionEnum = [
    { id: 0, value: 'NoFingerprintImpression', label: 'No Fingerprint' },
    { id: 1, value: 'NoFinger', label: 'Missing Finger' },
    { id: 2, value: 'NoLeftHand', label: 'Missing Left Hand' },
    { id: 3, value: 'NoRightHand', label: 'Missing Right Hand' },
    { id: 4, value: 'NoBothHand', label: 'Missing Both Hand' },
    { id: 5, value: 'Other', label: 'Other' },
  ];
  getNoFingerprintImpressionEnum = () => {
    return this.NoFingerprintImpressionEnum;
  };
  getNoFingerprintImpressionEnumByValue = (value: any) => {
    const dataFpund = this.NoFingerprintImpressionEnum.find(
      (sce: any) => sce.value == value
    );
    if (dataFpund) {
      return dataFpund.label;
    } else {
      return '--';
    }
  };
}
