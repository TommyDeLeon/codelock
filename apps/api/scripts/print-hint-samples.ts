/**
 * Print real hint ladders for a few evaluation cases, as markdown.
 *
 * For reviewers — people or other tools — who should judge the hints by what a
 * learner would actually see, not by the design. Evidence comes from the
 * recorded judge runs in `src/services/tutor/fixtures/eval-runs.json`.
 *
 *   npm run hints:samples -w @codelock/api -- out.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { HintLevel, HintRequestKind, HintView, Language } from '@codelock/shared';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { driversFor } from '../src/corpus/signatures.js';
import { BY_FAMILY } from '../src/services/hints.js';
import { diagnose, type Evidence } from '../src/services/tutor/diagnose.js';
import { EVAL_CASES } from '../src/services/tutor/evalset.js';
import { buildHint, hashCode, type HintHistoryItem } from '../src/services/tutor/ladder.js';

interface RecordedRun {
  compileError: string | null;
  cases: Array<{
    ordinal: number | null;
    stdin: string;
    stdout: string | null;
    stderr: string | null;
    status: string;
    expectedStdout: string | null;
    matched: boolean | null;
  }>;
}

const runs = (
  JSON.parse(readFileSync('src/services/tutor/fixtures/eval-runs.json', 'utf8')) as {
    runs: Record<string, RecordedRun>;
  }
).runs;

const PLAN: Array<[string, Array<[HintRequestKind, HintLevel?]>]> = [
  ['nth-unguarded-py', [['next'], ['didnt_help'], ['didnt_help'], ['level', 3], ['level', 4], ['level', 5]]],
  ['sum-reset-in-loop-py', [['next'], ['step_by_step'], ['smaller_example'], ['level', 3], ['different_explanation']]],
  ['index-else-return-py', [['next'], ['didnt_help']]],
  ['sum-print-py', [['next']]],
  ['count-gt-inclusive-py', [['next']]],
  ['sum-missing-colon-py', [['next']]],
  ['sum-builtin-py', [['next']]],
];

function render(label: string, h: HintView): string {
  const lines = [`### ${label} → level ${h.level} (${h.levelLabel}), strategy \`${h.strategy}\``];
  if (h.escalationNote) lines.push(`_${h.escalationNote}_`);
  if (h.resolvedNote) lines.push(`_${h.resolvedNote}_`);
  if (h.notice) lines.push(`**Notice:** ${h.notice}`);
  if (h.explain) lines.push(`**Explain:** ${h.explain}`);
  if (h.tryThis) lines.push(`**Try:** ${h.tryThis}`);
  if (h.body) lines.push(h.body);
  if (h.code) lines.push(`${h.code.label}:\n\`\`\`\n${h.code.text}\n\`\`\``);
  if (h.trace) {
    lines.push(`Trace (${h.trace.grounding}) — ${h.trace.title}`);
    lines.push(
      [`| ${h.trace.columns.join(' | ')} |`, `| ${h.trace.columns.map(() => '---').join(' | ')} |`, ...h.trace.rows.map((r) => `| ${r.join(' | ')} |`)].join('\n'),
    );
    if (h.trace.divergence) lines.push(`**Where it differs:** ${h.trace.divergence}`);
    lines.push(`_${h.trace.groundingNote}_`);
  }
  const suspected = h.evidence.suspicion ? ` Suspected: ${h.evidence.suspicion.text} (${h.evidence.suspicion.confidence}).` : '';
  lines.push(`Evidence: ${h.evidence.summary}${suspected}`);
  lines.push(`Words offered for "Explain this word": ${h.terms.map((t) => t.term).join(', ') || 'none'}`);
  return lines.join('\n\n');
}

let out = '# CodeLock hints, generated from real judge runs\n';
for (const [id, steps] of PLAN) {
  const kase = EVAL_CASES.find((c) => c.id === id)!;
  const def = ALL_PROBLEMS.find((p) => p.slug === kase.slug)!;
  const run = runs[id]!;
  const evidence: Evidence = {
    ran: true,
    compileError: run.compileError,
    hiddenFailure: null,
    cases: run.cases.map((c) => ({
      ordinal: c.ordinal,
      stdin: c.stdin,
      expected: c.expectedStdout,
      actual: c.stdout,
      stderr: c.stderr,
      status: c.status,
      passed: c.matched === true,
      hidden: false,
    })),
  };
  const driver = (driversFor(def.signatureId) as Record<string, string>)[kase.language] ?? '';
  const lineOffset = driver.includes('{{SOLUTION}}') ? driver.split('{{SOLUTION}}')[0]!.split('\n').length - 1 : 0;
  const diagnoses = diagnose({
    language: kase.language,
    code: kase.code,
    starterCode: null,
    signatureId: def.signatureId,
    promptMarkdown: def.promptMarkdown,
    patternTags: def.patternTags,
    evidence,
    lineOffset,
  });

  out += `\n## ${id} — ${def.title} (${kase.language})\n\nThe problem:\n\n> ${def.promptMarkdown.split('\n').join('\n> ')}\n\nThe learner's code:\n\n\`\`\`\n${kase.code}\n\`\`\`\n`;
  const history: HintHistoryItem[] = [];
  for (const [request, level] of steps) {
    const hint = buildHint({
      problem: {
        slug: def.slug,
        title: def.title,
        signatureId: def.signatureId,
        promptMarkdown: def.promptMarkdown,
        patternTags: def.patternTags,
        editorialMarkdown: def.editorialMarkdown ?? null,
        referenceSolution: def.referenceSolution as Partial<Record<Language, string>>,
        sampleCases: def.tests.filter((t) => t.isSample).map((t) => ({ stdin: t.stdin, expectedStdout: t.expectedStdout })),
        familyConcept: BY_FAMILY[def.patternFamily][1],
      },
      language: kase.language,
      code: kase.code,
      codeHash: hashCode(kase.code),
      evidence,
      diagnoses,
      request,
      level,
      history: [...history],
      prerequisiteNote: null,
    });
    history.push({ level: hint.level, strategy: hint.strategy, diagnosis: hint.diagnosis, codeHash: hashCode(kase.code) });
    out += `\n${render(request === 'level' ? `asked for level ${level}` : request, hint)}\n`;
  }
}

const target = process.argv[2];
if (target) {
  writeFileSync(target, out);
  console.log(`Wrote ${out.length} characters to ${target}`);
} else {
  console.log(out);
}
