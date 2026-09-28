import { Injectable } from '@angular/core';
import { TfliteMlp } from './tflite-mlp';

/**
 * Support type recommendation, run in the browser from the TFLite model's weights.
 *
 * The model is a ~23 KB MLP, so TfliteMlp evaluates it directly in well under a millisecond
 * instead of downloading a ~9 MB TFLite Wasm runtime.
 * The constants below are the contract with the model's training pipeline.
 * When `public/support_type_model.tflite` is retrained, re-check them together.
 */
const MODEL_PATH = 'support_type_model.tflite';

export const MODEL_AGE_GROUPS = [
  '0_2',
  '3_5',
  '6_17',
  '18_35',
  '36_64',
  '65_plus',
] as const;
export type ModelAgeGroup = (typeof MODEL_AGE_GROUPS)[number];

/**
 * Input layout: per gender, per age group -> [normal, disabled, chronically ill, both].
 * Inferred from the model's weights (no feature list shipped with it); male-first is unconfirmed.
 */
const MODEL_GENDERS = ['male', 'female'] as const;
const FEATURE_COUNT = MODEL_GENDERS.length * MODEL_AGE_GROUPS.length * 4;

/** Output classes, index-aligned with the model's softmax output. */
export const SUPPORT_TYPES = ['DIS', 'LIPW', 'OTHER'] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export interface MemberCounts {
  total: number;
  disabled: number;
  chronicallyIll: number;
  both: number;
}

export type HouseholdComposition = Record<
  ModelAgeGroup,
  Record<(typeof MODEL_GENDERS)[number], MemberCounts>
>;

export interface SupportTypePrediction {
  supportType: SupportType;
  /** Softmax probability of the predicted class (0-1). */
  confidence: number;
}

@Injectable({ providedIn: 'root' })
export class SupportTypeModelService {
  private model: Promise<TfliteMlp> | null = null;

  /** Starts fetching the model in the background, so a later predict() doesn't wait on the network. */
  preload(): void {
    this.getModel().catch(() => {
      // Ignored here: predict() retries the load and surfaces the error.
    });
  }

  async predict(
    household: HouseholdComposition,
  ): Promise<SupportTypePrediction> {
    const model = await this.getModel();
    const probabilities = Array.from(model.run(toFeatureVector(household)));
    const best = probabilities.indexOf(Math.max(...probabilities));
    return { supportType: SUPPORT_TYPES[best], confidence: probabilities[best] };
  }

  /** Loads the model once; a failed load is retried on the next call. */
  private getModel(): Promise<TfliteMlp> {
    this.model ??= this.loadModel().catch((error) => {
      this.model = null;
      throw error;
    });
    return this.model;
  }

  private async loadModel(): Promise<TfliteMlp> {
    // 'no-cache' revalidates with the server, so a redeployed model is picked up.
    const response = await fetch(resolveAppUrl(MODEL_PATH), {
      cache: 'no-cache',
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${MODEL_PATH}: HTTP ${response.status}`);
    }
    const model = TfliteMlp.parse(new Uint8Array(await response.arrayBuffer()));
    assertModelShape(model);
    return model;
  }
}

function toFeatureVector(household: HouseholdComposition): Float32Array {
  const features: number[] = [];
  for (const gender of MODEL_GENDERS) {
    for (const ageGroup of MODEL_AGE_GROUPS) {
      const counts = household[ageGroup][gender];
      const disabled = toCount(counts.disabled);
      const chronicallyIll = toCount(counts.chronicallyIll);
      const both = toCount(counts.both);
      // Able-bodied members: those not flagged disabled, chronically ill or both.
      const normal = Math.max(
        toCount(counts.total) - disabled - chronicallyIll - both,
        0,
      );
      features.push(normal, disabled, chronicallyIll, both);
    }
  }
  return Float32Array.from(features);
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Fails fast if the deployed model no longer matches the contract above. */
function assertModelShape(model: TfliteMlp): void {
  const { inputSize, outputSize } = model;
  if (inputSize !== FEATURE_COUNT || outputSize !== SUPPORT_TYPES.length) {
    throw new Error(
      `${MODEL_PATH} has shape ${inputSize} -> ${outputSize}, ` +
        `expected ${FEATURE_COUNT} -> ${SUPPORT_TYPES.length}.`,
    );
  }
}

/** Resolves against <base href> so assets load under /v2/beneficiary/ etc. */
function resolveAppUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}
