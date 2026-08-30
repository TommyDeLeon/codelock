/**
 * Reachability: is the corpus actually servable, not merely imported?
 *
 * "Imported as ACTIVE" and "reachable in the app" are different claims and the
 * first does not imply the second. The corpus has been live and 100% active
 * while the app served almost none of it — twice — so this drives the real
 * selection path against the real database and asserts what a user would
 * actually be handed.
 *
 * It runs the service path rather than HTTP on purpose. The route handler is
 * three lines; every way this has broken so far lived below it, in the seam
 * between the progression gate and the query that is supposed to honour it.
 * The most recent example: `availableFamilies` was computed, unit-tested, and
 * then never passed to `pickProblem`, so the family gate did nothing at all.
 *
 *   npm run verify:reachability -w @codelock/api
 */
import { PatternFamily, Tier } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  emptyProgress,
  ROADMAP_UNLOCK_SOLVES,
  type ProgressSnapshot,
} from '../src/services/progression.js';
import { pickProblem } from '../src/services/problemSelector.js';
import { toPublicProblem } from '../src/services/lockSessions.js';

const DRAWS = 60;

/** A user id that owns no submissions, so every draw is a first draw. */
const GHOST = '00000000-0000-0000-0000-0000000000ff';

let failures = 0;

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  PASS  ${label}`);
    return;
  }
  failures++;
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}

const snapshot = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  ...emptyProgress(),
  ...over,
});

/**
 * Draw repeatedly through the real selector.
 *
 * The ghost user has no submission history, so the 21-day cooldown never
 * engages and every draw sees the same pool — which is what makes "how many
 * distinct problems can this user reach" a meaningful count rather than an
 * artefact of exclusion.
 */
async function draw(progress: ProgressSnapshot, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
  const tiers = availableTiers(progress);
  const families = availableFamiliesForTiers(progress, tiers);
  const seen = new Map<string, { tier: Tier; family: PatternFamily }>();

  for (let i = 0; i < DRAWS; i++) {
    const problem = await pickProblem(GHOST, difficulty, tiers, families);
    seen.set(problem.slug, { tier: problem.tier, family: problem.patternFamily });
  }
  return { tiers, families, seen };
}

async function main(): Promise<void> {
  const total = await prisma.problem.count({ where: { isActive: true } });
  console.log(`Reachability against ${total} active problems, ${DRAWS} draws per scenario.\n`);

  // ---- A brand-new user ------------------------------------------------
  console.log('a brand-new user');
  {
    const { tiers, families, seen } = await draw(snapshot(), 'EASY');

    check('is gated to Tier 0 alone', tiers.length === 1 && tiers[0] === Tier.TIER_0, tiers.join());
    check(
      'is gated to Foundations alone',
      families.length === 1 && families[0] === PatternFamily.FOUNDATIONS,
      families.join(),
    );

    const tiersSeen = [...new Set([...seen.values()].map((v) => v.tier))];
    check(
      `every one of ${DRAWS} served problems is Tier 0`,
      tiersSeen.length === 1 && tiersSeen[0] === Tier.TIER_0,
      `saw ${tiersSeen.join()}`,
    );
    check('reaches more than one distinct problem', seen.size > 1, `${seen.size} distinct`);
    console.log(`        ${seen.size} distinct problems reached`);
  }

  // ---- Tier 0.5 opens, Tier 1 does not ---------------------------------
  console.log('\nafter five Tier 0 solves');
  {
    const p = snapshot({ locksServed: 6, solvesByTier: { TIER_0: 5 } });
    const { tiers, seen } = await draw(p, 'EASY');

    check('opens Tier 0.5', tiers.includes(Tier.TIER_0_5));
    check('still withholds Tier 1', !tiers.includes(Tier.TIER_1));

    const bad = [...seen.entries()].filter(([, v]) => v.tier === Tier.TIER_1);
    check('serves no Tier 1 problem', bad.length === 0, bad.map(([s]) => s).join());
    console.log(`        ${seen.size} distinct problems reached`);
  }

  // ---- The roadmap root is the only way in -----------------------------
  console.log('\nafter building the three Arrays & Hashing structures');
  {
    const p = snapshot({
      locksServed: 20,
      solvesByTier: { TIER_0: 9, TIER_0_5: 3 },
      builtStructures: ['cls:dynamic-array', 'cls:hash-map', 'cls:hash-set'],
    });
    const { tiers, families } = await draw(p, 'EASY');

    check('opens Tier 1', tiers.includes(Tier.TIER_1));
    check(
      'opens Arrays & Hashing and no other Tier 1 family',
      families.includes(PatternFamily.ARRAYS_HASHING) &&
        !families.includes(PatternFamily.TWO_POINTERS) &&
        !families.includes(PatternFamily.DP_2D),
      families.join(),
    );
  }

  // ---- One structure must not open the world ---------------------------
  console.log('\nafter building only a dynamic array');
  {
    const p = snapshot({
      locksServed: 20,
      solvesByTier: { TIER_0: 9, TIER_0_5: 1 },
      builtStructures: ['cls:dynamic-array'],
    });
    const { families, seen } = await draw(p, 'EASY');

    // The defect the roadmap gate was added for: nine families at once,
    // two-dimensional DP among them, six hops below the root.
    check(
      'opens no Tier 1 family at all',
      !families.some((f) => f !== PatternFamily.FOUNDATIONS && f !== PatternFamily.DATA_STRUCTURES),
      families.join(),
    );
    const leaked = [...seen.entries()].filter(([, v]) => v.tier === Tier.TIER_1);
    check('serves nothing from Tier 1', leaked.length === 0, leaked.map(([s]) => s).join());
  }

  // ---- The far side of the roadmap stays shut --------------------------
  console.log('\nafter three Arrays & Hashing solves');
  {
    const p = snapshot({
      locksServed: 30,
      solvesByTier: { TIER_0: 9, TIER_0_5: 5, TIER_1: 3 },
      solvesByFamily: { ARRAYS_HASHING: ROADMAP_UNLOCK_SOLVES },
      builtStructures: ['cls:dynamic-array', 'cls:hash-map', 'cls:hash-set', 'cls:stack'],
    });
    const { families } = await draw(p, 'EASY');

    check('opens Two Pointers', families.includes(PatternFamily.TWO_POINTERS));
    check('opens Stack', families.includes(PatternFamily.STACK));
    check('keeps Trees shut', !families.includes(PatternFamily.TREES));
    check('keeps Math & Geometry shut', !families.includes(PatternFamily.MATH_GEOMETRY));
  }

  // ---- The payload must not carry the answer ---------------------------
  console.log('\nthe served payload');
  {
    const problem = await pickProblem(GHOST, 'EASY', [Tier.TIER_0], [PatternFamily.FOUNDATIONS]);
    const shown = JSON.stringify(await toPublicProblem(problem));

    // A debrief field on the lock screen is the whole product defeated.
    check('carries no editorial', !shown.includes('editorial'));
    check('carries no reference solution', !shown.includes('referenceSolution'));
    check('carries no pattern name', !shown.includes('patternFamily'));
    check('carries no pattern tags', !shown.includes('patternTags'));
  }

  // ---- Nothing unservable ----------------------------------------------
  console.log('\nthe corpus itself');
  {
    const inactive = await prisma.problem.count({ where: { isActive: false } });
    check('holds no INACTIVE problem', inactive === 0, `${inactive} inactive`);

    // `referenceRuntimeMs` is a Json column, so this is a raw SQL null test —
    // Prisma's Json filters cannot express "IS NULL" without Prisma.DbNull and
    // read far worse than the SQL does.
    const [{ unmeasured }] = await prisma.$queryRaw<{ unmeasured: bigint }[]>`
      SELECT count(*) AS unmeasured
      FROM problems
      WHERE "isActive" = true AND "referenceRuntimeMs" IS NULL
    `;
    check('has measured every active problem', unmeasured === 0n, `${unmeasured} unmeasured`);
  }

  console.log(failures === 0 ? '\nreachable.' : `\n${failures} FAILED`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
