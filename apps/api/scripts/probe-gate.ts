/**
 * What the skill gate would serve this learner right now.
 *
 * A diagnostic, not a test: it reads the real database, so it answers the one
 * question unit tests cannot — whether the rules produce a sane pool against
 * the actual 695-problem corpus and a real solve history. It found the defect
 * the tests had missed, that a skill met once with help counted as practised
 * and opened the whole corpus.
 *
 * Reads only. Needs `DATABASE_URL`:
 *
 *   DATABASE_URL=... npx tsx scripts/probe-gate.ts
 */
import { prisma } from '../src/lib/prisma.js';
import { loadSkillSnapshot } from '../src/services/skillState.js';
import { pickProblem } from '../src/services/problemSelector.js';
import { SKILLS, fitForLearner, nextSkillToLearn, skillsRequiredBy } from '../src/services/skills.js';

async function main() {
  const user = await prisma.user.findFirstOrThrow();
  const snap = await loadSkillSnapshot(user.id);
  console.log('skills:', SKILLS.map((s) => `${s}=${snap[s].state}(${snap[s].unaidedSolves}u/${snap[s].assistedSolves}a)`).join(' '));
  console.log('next skill:', nextSkillToLearn(snap));

  const all = await prisma.problem.findMany({ where: { isActive: true }, select: { signatureId: true, patternTags: true, tier: true, patternFamily: true, slug: true } });
  const fair = all.filter((p) => fitForLearner(p, snap).eligible);
  console.log(`eligible corpus: ${fair.length} of ${all.length}`);
  console.log('sample eligible:', fair.slice(0, 6).map((p) => p.slug).join(', '));

  for (let i = 0; i < 5; i++) {
    const sel = await pickProblem(user.id, 'EASY');
    console.log(`pick ${i + 1}: ${sel.problem.slug} [${sel.problem.tier}] eligible=${sel.skillEligible} note="${sel.skillNote}" needs=${skillsRequiredBy(sel.problem).join('+')}`);
  }
  await prisma.$disconnect();
}
main();
