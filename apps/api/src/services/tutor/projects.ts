import type { ProjectRunView } from '@codelock/shared';

/**
 * One small, runnable project that the starter problems build.
 *
 * Each problem's solution is a real component of it: the scoreboard calls the
 * learner's own accepted function, for both players, and shows the result.
 * That makes the consequence of a solve visible — and the same function
 * scoring both players is the point about reuse, made by running it rather
 * than by saying it.
 *
 *   variables + loops   → each player's total
 *   comparisons         → best round
 *   conditions          → bonus rounds (strictly above 6, so a 6 does not count)
 *   search + validation → the first round that reached 10, or "never"
 *
 * The data is fixed and public. Nothing here is a test, and running it never
 * affects grading or progress.
 */

export interface ArcStep {
  slug: string;
  title: string;
  concept: string;
  adds: string;
  label: string;
  stdinFor(rounds: readonly number[]): string;
  format(output: string): string;
}

export const BONUS_THRESHOLD = 6;
export const TARGET_SCORE = 10;

const STEPS: readonly ArcStep[] = [
  {
    slug: 'sum-of-array',
    title: 'Sum of an Array',
    concept: 'A variable and a loop keep a running score.',
    adds: 'Each player’s total score',
    label: 'Total',
    stdinFor: (rounds) => rounds.join(' '),
    format: (output) => output,
  },
  {
    slug: 'largest-number',
    title: 'Largest Number',
    concept: 'A comparison keeps the best round so far.',
    adds: 'Each player’s best round',
    label: 'Best round',
    stdinFor: (rounds) => rounds.join(' '),
    format: (output) => output,
  },
  {
    slug: 'count-greater-than',
    title: 'Count Greater Than',
    concept: 'A condition decides which rounds earn a bonus.',
    adds: `Bonus rounds (scores strictly above ${BONUS_THRESHOLD})`,
    label: 'Bonus rounds',
    stdinFor: (rounds) => `${rounds.join(' ')}\n${BONUS_THRESHOLD}`,
    format: (output) => output,
  },
  {
    slug: 'index-of-target',
    title: 'Index of Target',
    concept: 'A search that gives a safe answer when nothing matches.',
    adds: `The first round a player scored ${TARGET_SCORE}`,
    label: `First ${TARGET_SCORE}`,
    stdinFor: (rounds) => `${rounds.join(' ')}\n${TARGET_SCORE}`,
    format: (output) => {
      if (output === '-1') return 'never';
      const n = Number(output);
      return Number.isInteger(n) && n >= 0 ? `round ${n + 1}` : output;
    },
  },
];

export const SCOREBOARD_ARC = {
  id: 'game-night-scoreboard',
  title: 'Game Night Scoreboard',
  blurb:
    'A scoreboard for a five-round game between two players. Each problem you solve adds one working feature, and the scoreboard runs your own code to fill it in.',
  players: [
    { name: 'Ada', rounds: [4, 9, 2, 7, 10] },
    { name: 'Lin', rounds: [6, 6, 8, -3, 5] },
  ],
  steps: STEPS,
} as const;

export function arcStepFor(slug: string): { step: ArcStep; index: number } | null {
  const index = SCOREBOARD_ARC.steps.findIndex((s) => s.slug === slug);
  return index === -1 ? null : { step: SCOREBOARD_ARC.steps[index]!, index };
}

/** What one step's run produced, per player, in player order. */
export interface StepOutput {
  slug: string;
  outputs: Array<{ stdout: string | null; error: string | null }>;
}

/**
 * Build the scoreboard from real outputs. Pure.
 *
 * A step with no accepted solution yet shows as not built. A step whose code
 * errored shows the error rather than a guess, and the winner is only named
 * when both totals came from the learner's code and both were numbers.
 */
export function composeScoreboard(results: readonly StepOutput[], message: string): ProjectRunView {
  const bySlug = new Map(results.map((r) => [r.slug, r]));
  const players = SCOREBOARD_ARC.players.map((player, p) => ({
    name: player.name,
    rounds: [...player.rounds],
    cells: SCOREBOARD_ARC.steps.map((step) => {
      const result = bySlug.get(step.slug);
      if (!result) {
        return { slug: step.slug, label: step.label, value: null, note: `Solve ${step.title} to add this.` };
      }
      const out = result.outputs[p];
      if (!out || out.error) {
        return {
          slug: step.slug,
          label: step.label,
          value: null,
          note: out?.error ? `Your code stopped: ${out.error}` : 'No output.',
        };
      }
      const raw = (out.stdout ?? '').trim();
      return { slug: step.slug, label: step.label, value: raw === '' ? '(nothing)' : step.format(raw), note: null };
    }),
  }));

  let winner: string | null = null;
  const totalCells = players.map((pl) => pl.cells.find((c) => c.slug === 'sum-of-array')?.value ?? null);
  const totals = totalCells.map((v) => (v === null ? Number.NaN : Number(v)));
  if (totals.every((t) => Number.isFinite(t))) {
    const [a, b] = totals as [number, number];
    winner = a === b ? 'Tie' : a > b ? players[0]!.name : players[1]!.name;
  }

  return { ran: results.length > 0, message, players, winner };
}
