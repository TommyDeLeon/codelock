import { Language } from '@prisma/client';
const LANGUAGES = Object.values(Language) as readonly Language[];
import { CATALOG, TASK_CPU_SECONDS, validateCatalog } from '../src/services/learn/catalog.js';
import { runBatch } from '../src/services/judge0.js';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';

/**
 * Run every lesson program on the real judge and compare what it prints.
 *
 * Three programs per lesson per language: the worked example, the task's
 * reference solution, and the task's starter. The first two must print
 * exactly their declared stdout. The starter must NOT — a starter that
 * already passes would let "Run and check" succeed with no work done.
 *
 * Needs the judge on JUDGE0_URL (`npm run judge:host -w @codelock/api`
 * publishes it on 127.0.0.1:2358). Exits non-zero on any mismatch, so a
 * variant that stops matching its runtime fails here before it teaches
 * anything false.
 *
 *   npx tsx --env-file-if-exists=.env scripts/verify-lessons.ts [LANGUAGE ...]
 */

const only = process.argv.slice(2).map((s) => s.toUpperCase()) as Language[];
const languages = only.length > 0 ? LANGUAGES.filter((l) => only.includes(l)) : LANGUAGES;

const structural = validateCatalog(CATALOG, undefined, ALL_PROBLEMS);
if (structural.length > 0) {
  console.error('catalog does not validate:\n' + structural.map((p) => '  ' + p).join('\n'));
  process.exit(2);
}

interface Row {
  lesson: string;
  language: Language;
  program: 'example' | 'solution' | 'starter';
  ok: boolean;
  status: string;
  stdout: string | null;
  note: string | null;
}

const rows: Row[] = [];

async function run(language: Language, code: string, expected: string) {
  const { results } = await runBatch({
    language,
    sourceCode: code,
    cases: [{ stdin: '', expectedOutput: expected }],
    cpuTimeLimit: TASK_CPU_SECONDS[language],
    memoryLimitKb: 512_000,
    priority: 'bulk',
  });
  return results[0]!;
}

async function main(): Promise<void> {
  for (const lesson of CATALOG) {
    for (const language of languages) {
      const variant = lesson.variants[language];
      const checks: Array<['example' | 'solution' | 'starter', string, string, boolean]> = [
        ['example', variant.example.code, variant.example.stdout, true],
        ['solution', variant.task.solution, variant.task.stdout, true],
        ['starter', variant.task.starter, variant.task.stdout, false],
      ];
      for (const [program, code, expected, mustPass] of checks) {
        try {
          const r = await run(language, code, expected);
          const ok = mustPass ? r.passed : !r.passed;
          rows.push({
            lesson: lesson.id,
            language,
            program,
            ok,
            status: r.statusDescription,
            stdout: r.stdout,
            note: ok ? null : mustPass ? (r.compileOutput ?? r.stderr ?? 'output differs') : 'starter already passes',
          });
        } catch (err) {
          rows.push({ lesson: lesson.id, language, program, ok: false, status: 'error', stdout: null, note: String(err) });
        }
        process.stdout.write(rows[rows.length - 1]!.ok ? '.' : 'F');
      }
    }
  }
  process.stdout.write('\n');

  const failed = rows.filter((r) => !r.ok);
  const byLanguage = Object.fromEntries(
    languages.map((l) => [l, `${rows.filter((r) => r.language === l && r.ok).length}/${rows.filter((r) => r.language === l).length}`]),
  );
  console.log(`checked ${rows.length} programs across ${CATALOG.length} lessons; per language ok/total:`, byLanguage);
  for (const f of failed) {
    console.log(`\nFAIL ${f.lesson} ${f.language} ${f.program}: ${f.status}`);
    if (f.stdout !== null) console.log('  stdout: ' + JSON.stringify(f.stdout));
    if (f.note) console.log('  ' + f.note.split('\n').slice(0, 6).join('\n  '));
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

void main();
