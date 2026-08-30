import { describe, expect, it } from 'vitest';
import { buildDrivers, buildStubs } from './drivers.js';
import { SIGNATURES, SIGNATURE_IDS, driversFor, getSignature, isClassSignature, stubsFor } from './signatures.js';
import { LANGUAGES, type ClassSignature } from './types.js';

/**
 * Structural tests for the generator.
 *
 * These prove the shape, not the semantics: that every signature yields six
 * drivers, that each is a whole program with exactly one solution slot, that no
 * id is duplicated. Whether the generated C++ actually compiles is a question
 * only a compiler can answer — that is `scripts/verify-drivers.ts`, which runs
 * the real thing in the real sandbox. Both matter, and this is the one that can
 * run on a laptop with no toolchains installed.
 */

describe('the registry', () => {
  it('has no duplicate ids', () => {
    expect(new Set(SIGNATURE_IDS).size).toBe(SIGNATURE_IDS.length);
  });

  it('covers both driver families', () => {
    expect(SIGNATURES.some((s) => s.kind === 'function')).toBe(true);
    expect(SIGNATURES.some((s) => s.kind === 'class')).toBe(true);
  });

  it('names the unknown id and the known ones when a lookup fails', () => {
    // The importer is the caller. A silent undefined here becomes an INACTIVE
    // row nobody notices until the corpus is mysteriously short.
    expect(() => getSignature('fn:nope->nope')).toThrowError(/Unknown signatureId "fn:nope->nope"/);
    expect(() => getSignature('fn:nope->nope')).toThrowError(/fn:ints->int/);
  });

  it('classifies the Tier 0.5 signatures as class-shaped', () => {
    expect(isClassSignature('cls:lru-cache')).toBe(true);
    expect(isClassSignature('fn:ints->int')).toBe(false);
  });
});

describe.each(SIGNATURES.map((s) => [s.id, s] as const))('%s', (_id, sig) => {
  const drivers = buildDrivers(sig);
  const stubs = buildStubs(sig);

  it.each(LANGUAGES)('generates a %s driver with a solution slot', (lang) => {
    const src = drivers[lang];
    expect(src.length).toBeGreaterThan(0);
    // Exactly one slot: grading.ts does a single replace, so a second slot
    // would survive into the submitted source and fail to compile.
    expect(src.split('{{SOLUTION}}')).toHaveLength(2);
  });

  it.each(LANGUAGES)('generates a %s stub', (lang) => {
    expect(stubs[lang].length).toBeGreaterThan(0);
    expect(stubs[lang]).not.toContain('undefined');
  });

  it('never emits an undefined codec name into any language', () => {
    // A missing entry in PARSER/FORMATTER/TYPE_NAMES stringifies to "undefined"
    // and produces source that fails at the judge rather than here.
    for (const lang of LANGUAGES) {
      expect(drivers[lang]).not.toContain('undefined(');
      expect(drivers[lang]).not.toContain('__undefined');
    }
  });
});

describe('function drivers', () => {
  it('reads one parameter per stdin line, in order', () => {
    const js = driversFor('fn:ints,int->ints').JAVASCRIPT;
    expect(js).toContain('__ints(__LINES[0])');
    expect(js).toContain('__int(__LINES[1])');
    expect(js).toContain('__fInts(solve(__a0, __a1))');
  });

  it('gives Java its parameters with declared types', () => {
    const java = driversFor('fn:tree->ints').JAVA;
    expect(java).toContain('TreeNode __a0 = __tree(__LINES.get(0));');
    expect(java).toContain('System.out.println(__fInts(solve(__a0)));');
  });

  it('puts public class Main first, ahead of the node types', () => {
    // The judge runs Java in single-file source mode, which executes the FIRST
    // class in the file. With TreeNode on top it looks for main() there and
    // refuses to run — verified against the sandbox, not assumed.
    const java = driversFor('fn:list->list').JAVA;
    expect(java.match(/public class Main/g)).toHaveLength(1);
    expect(java.indexOf('public class Main')).toBeLessThan(java.indexOf('class ListNode'));
  });
});

describe('the operation-log driver', () => {
  const sig = getSignature('cls:lru-cache') as ClassSignature;

  it('constructs the user class from the first operation', () => {
    const js = driversFor('cls:lru-cache').JAVASCRIPT;
    expect(js).toContain("if (__op === 'LRUCache')");
    expect(js).toContain('__obj = new LRUCache(__int((__tok[1] || \'\')));');
  });

  it('dispatches every declared method explicitly, in every language', () => {
    // No reflection anywhere: C++ has none, and a driver that works in five
    // languages and not the sixth excludes C++ users from a whole tier.
    const drivers = buildDrivers(sig);
    for (const lang of LANGUAGES) {
      for (const m of sig.methods) {
        const name = lang === 'GO' ? m.name.charAt(0).toUpperCase() + m.name.slice(1) : m.name;
        expect(drivers[lang]).toContain(name);
      }
    }
  });

  it('reports null for void methods and a value for the rest', () => {
    const py = driversFor('cls:lru-cache').PYTHON;
    expect(py).toContain("__out.append(__fInt(__obj.get(");
    // `put` is void: it is called for its effect, then reports null.
    expect(py).toMatch(/__obj\.put\(.*\)\n\s+__out\.append\('null'\)/);
  });

  it('gives Go a Constructor and capitalised methods, since lowercase is unexported', () => {
    const go = driversFor('cls:union-find').GO;
    expect(go).toContain('__obj = Constructor(');
    // `unite`, not `union`: the latter is a reserved word in C++, so a method
    // named `union` generates a driver that cannot compile. Found by the
    // sandbox — C++ failed every case while the other five languages passed.
    expect(go).toContain('__obj.Unite(');
    expect(go).toContain('__obj.Connected(');
  });

  it('emits a class stub, not a function stub, for every Tier 0.5 signature', () => {
    for (const s of SIGNATURES.filter((x) => x.kind === 'class')) {
      const className = (s as ClassSignature).className;
      const stubs = stubsFor(s.id);
      expect(stubs.JAVASCRIPT).toContain(`class ${className} {`);
      expect(stubs.PYTHON).toContain(`class ${className}:`);
      // Go has no classes; the equivalent contract is a struct plus Constructor.
      expect(stubs.GO).toContain(`type ${className} struct`);
      expect(stubs.GO).toContain('func Constructor(');
    }
  });

  it('lists every method in the stub, so nobody has to guess the contract', () => {
    // A beginner handed an empty editor under a lock screen will spend the lock
    // guessing method names. The stub is the contract.
    const stub = stubsFor('cls:min-heap').JAVASCRIPT;
    for (const m of (getSignature('cls:min-heap') as ClassSignature).methods) {
      expect(stub).toContain(`${m.name}(`);
    }
  });
});
