import { Injectable, inject } from '@angular/core';
import { saveAs } from 'file-saver';

import { ApiService } from '../../../services/api.service';
import { FINGER_COLUMNS, FingerField, MEMBER_TYPE_ORDER, toScore } from './finger-score.utils';

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  path: string;
  data: T;

  success: boolean;
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

export interface BomaSummary {
  id: number;
  name: string;
  payam: string;
  county: string;
  state: string;
}

export type MemberType = 'BENEFICIARY' | 'NOMINEE' | 'ALTERNATE_1' | 'ALTERNATE_2';

/** One household member's scores; the API sends them as strings, so they are parsed to numbers on arrival. */
export type MemberScores = { type: MemberType | string } & Record<FingerField, number | null>;

export interface HouseholdScores {
  householdNumber: string;
  bomaId: number;
  members: MemberScores[];
}

type RawHousehold = Omit<HouseholdScores, 'members'> & {
  members?: ({ type: string } & Partial<Record<FingerField, unknown>>)[] | null;
};

@Injectable({ providedIn: 'root' })
export class FingerScoreService {
  private readonly api = inject(ApiService);

  private checkResponse<T>(response: ApiEnvelope<T>): ApiEnvelope<T> {
    if (!response || response.success !== true) {
      throw new Error(response?.message || 'The fingerprint quality request failed.');
    }
    return response;
  }

  async getBomas(page: number, size: number, search = ''): Promise<ApiEnvelope<PageResult<BomaSummary>>> {
    const response = await this.api.GET<ApiEnvelope<PageResult<BomaSummary>>>('fingerscore/bomas', {
      search: search.trim() || undefined,
      page,
      size,
    });
    return this.checkResponse(response.data);
  }

  async getBomaHouseholds(bomaId: number, page: number, size: number): Promise<ApiEnvelope<PageResult<HouseholdScores>>> {
    const response = await this.api.GET<ApiEnvelope<PageResult<RawHousehold>>>(`fingerscore/boma/${bomaId}`, { page, size });
    const envelope = this.checkResponse(response.data);
    const data = envelope.data && { ...envelope.data, content: (envelope.data.content ?? []).map(normalizeHousehold) };
    return { ...envelope, data };
  }

  async getHousehold(householdNumber: string): Promise<ApiEnvelope<HouseholdScores | null>> {
    const household = encodeURIComponent(householdNumber.trim());
    const response = await this.api.GET<ApiEnvelope<RawHousehold | null>>(`fingerscore/household/${household}`);
    const envelope = this.checkResponse(response.data);
    return { ...envelope, data: envelope.data ? normalizeHousehold(envelope.data) : null };
  }

  async downloadBomaCsv(boma: BomaSummary): Promise<void> {
    const response = await this.api.GET<Blob>(
      `fingerscore/boma/${boma.id}/csv`,
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

function normalizeHousehold(household: RawHousehold): HouseholdScores {
  const rank = (type: string) => {
    const index = MEMBER_TYPE_ORDER.indexOf(type as MemberType);
    return index < 0 ? MEMBER_TYPE_ORDER.length : index;
  };
  const members = (household.members ?? [])
    .map(member => {
      const scores = Object.fromEntries(FINGER_COLUMNS.map(f => [f.field, toScore(member[f.field])]));
      return { type: member.type, ...scores } as MemberScores;
    })
    .sort((a, b) => rank(a.type) - rank(b.type));
  return { householdNumber: household.householdNumber, bomaId: household.bomaId, members };
}
