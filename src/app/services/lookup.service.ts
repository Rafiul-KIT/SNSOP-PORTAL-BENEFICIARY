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
  private countyList: LookupItem[] = [];
  private payamList: LookupItem[] = [];
  private bomaList: LookupItem[] = [];

  constructor(private api: ApiService) { }

  // ---------- State ----------
  setStateList(states: LookupItem[]) {
    this.stateList = states;
  }
  getStateList() {
    return this.stateList;
  }
  getStateNameById(stateId: string) {
    const state = this.stateList.find((sl) => String(sl.id) === String(stateId));
    return state ? state.name : '--';
  }

  getOrFetchStateList(): Promise<LookupItem[]> {
    if (this.stateList.length) return Promise.resolve(this.stateList);
    return this.fetchLookup({ lookupType: 'STATE', size: -1 }).then((list) => {
      this.setStateList(list);
      return list;
    });
  }

  // ---------- County ----------
  setCountyList(counties: LookupItem[]) {
    this.countyList = counties;
  }
  getCountyList() {
    return this.countyList;
  }
  getCountyNameById(countyId: string) {
    const county = this.countyList.find((sl) => String(sl.id) === String(countyId));
    return county ? county.name : '--';
  }

  getCountyListByStateId(stateId: string): Promise<LookupItem[]> {
    return this.fetchLookup({ lookupType: 'COUNTY', parentId: stateId, size: -1 }).then((list) => {
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
    const payam = this.payamList.find((sl) => String(sl.id) === String(payamId));
    return payam ? payam.name : '--';
  }

  getPayamListByCountyId(countyId: string): Promise<LookupItem[]> {
    return this.fetchLookup({ lookupType: 'PAYAM', parentId: countyId, size: -1 }).then((list) => {
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
    return this.fetchLookup({ lookupType: 'BOMA', parentId: payamId, size: -1 }).then((list) => {
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
      { id: '0', name: 'Male' },
      { id: '1', name: 'Female' },
    ];
  }

  getRegistrationPhaseList(): LookupItem[] {
    return [
      { id: 'PARENT', name: 'Parent' },
      { id: 'AF', name: 'AF' },
    ];
  }

}
