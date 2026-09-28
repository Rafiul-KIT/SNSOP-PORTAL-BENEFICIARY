import {
  HouseholdComposition,
  MemberCounts,
  MODEL_AGE_GROUPS,
  ModelAgeGroup,
  SupportType,
  SupportTypeModelService,
} from './support-type-model.service';

type Member = [
  gender: 'male' | 'female',
  ageGroup: ModelAgeGroup,
  counts: Partial<MemberCounts>,
];

function household(...members: Member[]): HouseholdComposition {
  const empty = (): MemberCounts => ({
    total: 0,
    disabled: 0,
    chronicallyIll: 0,
    both: 0,
  });
  const composition = Object.fromEntries(
    MODEL_AGE_GROUPS.map((age) => [age, { male: empty(), female: empty() }]),
  ) as HouseholdComposition;
  for (const [gender, age, counts] of members) {
    Object.assign(composition[age][gender], counts);
  }
  return composition;
}

// Runs the real public/support_type_model.tflite through TfliteMlp.
// Expected classes match the same model run with the Python LiteRT interpreter
// (TfliteMlp was checked against LiteRT.js on 3,000 random households: identical classes).
describe('SupportTypeModelService', () => {
  // No dependencies, so no TestBed; one instance keeps the compiled model across cases.
  const service = new SupportTypeModelService();

  const cases: [string, HouseholdComposition, SupportType][] = [
    ['an empty household', household(), 'DIS'],
    [
      'elderly and disabled / chronically ill adults only',
      household(
        ['male', '65_plus', { total: 1 }],
        ['female', '36_64', { total: 1, disabled: 1 }],
        ['male', '18_35', { total: 1, chronicallyIll: 1 }],
      ),
      'DIS',
    ],
    [
      'an able-bodied man with children',
      household(
        ['male', '18_35', { total: 1 }],
        ['female', '6_17', { total: 2 }],
        ['male', '0_2', { total: 1 }],
      ),
      'LIPW',
    ],
    [
      'an able-bodied man and woman',
      household(
        ['male', '36_64', { total: 1 }],
        ['female', '18_35', { total: 1 }],
      ),
      'LIPW',
    ],
    [
      'an able-bodied woman as the only working-age adult',
      household(
        ['female', '36_64', { total: 1 }],
        ['male', '3_5', { total: 1 }],
      ),
      'OTHER',
    ],
  ];

  for (const [name, input, expected] of cases) {
    it(`recommends ${expected} for ${name}`, async () => {
      const result = await service.predict(input);
      expect(result.supportType).toBe(expected);
      expect(result.confidence).toBeGreaterThan(0.99);
    }, 30_000);
  }
});
