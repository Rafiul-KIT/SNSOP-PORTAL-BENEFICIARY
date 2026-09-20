import { Injectable, inject } from '@angular/core';
import { saveAs } from 'file-saver';

import { ApiService } from '../../../services/api.service';

export interface ApiEnvelope<T> {
  success: boolean;
  status: number;
  data: T;
  message: string;
}

export interface SubjectStats {
  total: number;
  beneficiaries: number;
  alternates: number;
}

export interface BomaProgress {
  id: number;
  name: string;
  payam: string;
  county: string;
  state: string;
}

export interface FingerScore {
  householdNumber: string;
  name: string;
  id: number;
  bomaId: number;
  type: 'BENEFICIARY' | 'ALTERNATE' | string;
  leftIndex: number | null;
  leftMiddle: number | null;
  leftRing: number | null;
  leftSmall: number | null;
  leftThumb: number | null;
  rightIndex: number | null;
  rightMiddle: number | null;
  rightRing: number | null;
  rightSmall: number | null;
  rightThumb: number | null;
}

export interface PageResult<T> {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({ providedIn: 'root' })
export class FingerScoreService {
  private readonly api = inject(ApiService);
  // This controller is hosted outside the MIS server context.
  private readonly baseUrl = 'https://gwapp.southsudansafetynet.info/fingerquality';

  private endpoint(path: string): string {
    return `${this.baseUrl}/${path}`;
  }

  private checkResponse<T>(response: ApiEnvelope<T>): ApiEnvelope<T> {
    if (!response || response.success !== true) {
      throw new Error(response?.message || 'The fingerprint quality request failed.');
    }
    return response;
  }

  async getSubjectStats(): Promise<ApiEnvelope<SubjectStats>> {
    const response = await this.api.GET<ApiEnvelope<SubjectStats>>(this.endpoint('api/v1/progress/subject-stats'));
    return this.checkResponse(response.data);
  }

  async getBomas(page: number, size: number, search = ''): Promise<ApiEnvelope<PageResult<BomaProgress>>> {
    const response = await this.api.GET<ApiEnvelope<PageResult<BomaProgress>>>(this.endpoint('api/v1/progress/bomas'), {
      search: search.trim() || undefined,
      page,
      size,
      sort: 'name,asc',
    });
    return this.checkResponse(response.data);
  }

  async getBomaCount(): Promise<ApiEnvelope<number>> {
    const response = await this.api.GET<ApiEnvelope<number>>(this.endpoint('api/v1/progress/boma-count'));
    return this.checkResponse(response.data);
  }

  async getIndividualScore(id: number): Promise<ApiEnvelope<FingerScore>> {
    const response = await this.api.GET<ApiEnvelope<FingerScore>>(this.endpoint(`api/v1/individual/${id}/finger-score`));
    return this.checkResponse(response.data);
  }

  async getHouseholdScores(householdNumber: string): Promise<ApiEnvelope<FingerScore[]>> {
    const household = encodeURIComponent(householdNumber.trim());
    const response = await this.api.GET<ApiEnvelope<FingerScore[]>>(
      this.endpoint(`api/v1/household/${household}/finger-scores`)
    );
    return this.checkResponse(response.data);
  }

  async getBomaSubjects(
    bomaId: number,
    page: number,
    size: number,
    search = ''
  ): Promise<ApiEnvelope<PageResult<FingerScore>>> {
    const response = await this.api.GET<ApiEnvelope<PageResult<FingerScore>>>(
      this.endpoint(`api/v1/boma/${bomaId}/subjects`),
      {
        search: search.trim() || undefined,
        page,
        size,
        sort: 'name,asc',
      }
    );
    return this.checkResponse(response.data);
  }

  async getBomaScores(bomaId: number): Promise<ApiEnvelope<FingerScore[]>> {
    const response = await this.api.GET<ApiEnvelope<FingerScore[]>>(
      this.endpoint(`api/v1/boma/${bomaId}/finger-scores`)
    );
    return this.checkResponse(response.data);
  }

  async downloadBomaCsv(boma: BomaProgress): Promise<void> {
    const response = await this.api.GET<Blob>(
      this.endpoint(`api/v1/boma/${boma.id}/finger-scores/csv`),
      undefined,
      'global',
      { responseType: 'blob', headers: { Accept: 'text/csv' } }
    );
    // Error envelopes can arrive with HTTP 200 even on a blob request.
    if (response.data.type.includes('json')) {
      const error = JSON.parse(await response.data.text());
      throw new Error(error.message || 'Could not download the boma CSV file.');
    }
    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'text/csv;charset=utf-8' });
    const safeName = boma.name.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');
    saveAs(blob, `${safeName || `boma_${boma.id}`}_finger_scores.csv`);
  }
}
