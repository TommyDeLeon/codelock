/**
 * Seed the problem bank.
 *
 * Each problem ships a per-language *driver*: a full program with a
 * `{{SOLUTION}}` slot. The driver owns stdin parsing and stdout formatting so
 * test cases stay language-agnostic and nobody has to write scanf under a lock
 * screen. Adding a language to a problem = adding one driver entry.
 *
 * Run: npm run db:seed
 */
import { Difficulty, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- drivers ---------------------------------------------------------------
// Note: "\\n" in these template literals is a literal backslash-n in the
// generated source, which is what the target language needs to see.

/** stdin: line 1 = comma/space separated ints, line 2 = target. stdout: "i j" */
const arrayAndTargetDrivers: Record<string, string> = {
  JAVASCRIPT: `{{SOLUTION}}
const __lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const __nums = __lines[0].trim().split(/[ ,]+/).map(Number);
const __target = Number(__lines[1]);
console.log(solve(__nums, __target).join(' '));`,

  // Node 24 strips the annotations at run time, so the driver is the JavaScript
  // one with types added — no build step and no separate image.
  TYPESCRIPT: `{{SOLUTION}}
const __lines: string[] = require('fs').readFileSync(0, 'utf8').split('\\n');
const __nums: number[] = __lines[0].trim().split(/[ ,]+/).map(Number);
const __target: number = Number(__lines[1]);
console.log(solve(__nums, __target).join(' '));`,

  PYTHON: `import sys
{{SOLUTION}}
__data = sys.stdin.read().split('\\n')
__nums = [int(x) for x in __data[0].replace(',', ' ').split()]
__target = int(__data[1])
print(' '.join(str(v) for v in solve(__nums, __target)))`,

  JAVA: `import java.util.*;
public class Main {
{{SOLUTION}}
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().trim().split("[ ,]+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = Integer.parseInt(sc.nextLine().trim());
        int[] r = solve(nums, target);
        System.out.println(r[0] + " " + r[1]);
    }
}`,

  CPP: `#include <bits/stdc++.h>
using namespace std;
{{SOLUTION}}
int main() {
    string line;
    getline(cin, line);
    for (auto &c : line) if (c == ',') c = ' ';
    istringstream ss(line);
    vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int target; cin >> target;
    vector<int> r = solve(nums, target);
    cout << r[0] << " " << r[1] << endl;
}`,

  GO: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strconv"
    "strings"
)

{{SOLUTION}}

func main() {
    rd := bufio.NewReader(os.Stdin)
    l1, _ := rd.ReadString('\\n')
    l2, _ := rd.ReadString('\\n')
    fields := strings.FieldsFunc(strings.TrimSpace(l1), func(r rune) bool { return r == ' ' || r == ',' })
    nums := make([]int, len(fields))
    for i, s := range fields {
        nums[i], _ = strconv.Atoi(s)
    }
    target, _ := strconv.Atoi(strings.TrimSpace(l2))
    r := solve(nums, target)
    fmt.Printf("%d %d\\n", r[0], r[1])
}`,
};

/** stdin: one line of text. stdout: whatever solve() returns, printed plainly. */
const singleStringDrivers = (print: {
  js: string;
  py: string;
  java: string;
  cpp: string;
  go: string;
}): Record<string, string> => ({
  JAVASCRIPT: `{{SOLUTION}}
const __input = require('fs').readFileSync(0, 'utf8').split('\\n')[0];
console.log(${print.js});`,

  TYPESCRIPT: `{{SOLUTION}}
const __input: string = require('fs').readFileSync(0, 'utf8').split('\\n')[0];
console.log(${print.js});`,

  PYTHON: `import sys
{{SOLUTION}}
__input = sys.stdin.readline().rstrip('\\n')
print(${print.py})`,

  JAVA: `import java.util.*;
public class Main {
{{SOLUTION}}
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(${print.java});
    }
}`,

  CPP: `#include <bits/stdc++.h>
using namespace std;
{{SOLUTION}}
int main() {
    string input;
    getline(cin, input);
    cout << ${print.cpp} << endl;
}`,

  GO: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

{{SOLUTION}}

func main() {
    rd := bufio.NewReader(os.Stdin)
    line, _ := rd.ReadString('\\n')
    input := strings.TrimRight(line, "\\r\\n")
    fmt.Println(${print.go})
}`,
});

/**
 * 60,000 characters built from a repeating 95-character alphabet, so the answer
 * is exactly 95 and the input is large enough that complexity dominates
 * interpreter start-up in the measured runtime.
 */
const LONG_UNIQUE_INPUT = (() => {
  const alphabet = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
  return alphabet.repeat(Math.ceil(60_000 / alphabet.length)).slice(0, 60_000);
})();

// --- problems --------------------------------------------------------------

const problems = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-map'],
    avgSolveSeconds: 420,
    promptMarkdown: `Given an array of integers \`nums\` and an integer \`target\`, return the
**indices** of the two numbers that add up to \`target\`.

Exactly one valid answer exists, and you may not use the same element twice.
Return the indices in ascending order.

**Input**
- Line 1: the array, comma separated
- Line 2: the target

**Output**
- The two indices, space separated

**Example**
\`\`\`
Input:  2,7,11,15
        9
Output: 0 1
\`\`\``,
    starterCode: {
      JAVASCRIPT: 'function solve(nums, target) {\n  // return [i, j]\n}',
      TYPESCRIPT:
        'function solve(nums: number[], target: number): number[] {\n  // return [i, j]\n  return [0, 0];\n}',
      PYTHON: 'def solve(nums, target):\n    # return [i, j]\n    pass',
      JAVA: '    static int[] solve(int[] nums, int target) {\n        // return new int[]{i, j};\n        return new int[]{0, 0};\n    }',
      CPP: 'vector<int> solve(vector<int>& nums, int target) {\n    // return {i, j};\n    return {0, 0};\n}',
      GO: 'func solve(nums []int, target int) []int {\n    // return []int{i, j}\n    return []int{0, 0}\n}',
    },
    // Measured from the canonical optimal solution on the reference judge.
    // Regenerate with scripts/calibrate.ts after changing judge hardware.
    referenceRuntimeMs: { JAVASCRIPT: 95, PYTHON: 60, JAVA: 190, CPP: 12, GO: 8 },
    driverCode: arrayAndTargetDrivers,
    testCases: [
      { stdin: '2,7,11,15\n9', expectedStdout: '0 1', isSample: true },
      { stdin: '3,2,4\n6', expectedStdout: '1 2', isSample: true },
      { stdin: '3,3\n6', expectedStdout: '0 1', isSample: false },
      { stdin: '-1,-2,-3,-4,-5\n-8', expectedStdout: '2 4', isSample: false },
      { stdin: '0,4,3,0\n0', expectedStdout: '0 3', isSample: false },
    ],
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: Difficulty.EASY,
    tags: ['string', 'stack'],
    avgSolveSeconds: 360,
    promptMarkdown: `Given a string containing only \`()[]{}\`, decide whether it is valid.

A string is valid when every bracket is closed by the same type, in the correct
order, and every closing bracket has a matching opener.

**Input**: one line, the bracket string (possibly empty).
**Output**: \`true\` or \`false\`.

**Example**
\`\`\`
Input:  ([]{})
Output: true
\`\`\``,
    starterCode: {
      JAVASCRIPT: 'function solve(s) {\n  // return true or false\n}',
      TYPESCRIPT:
        'function solve(s: string): boolean {\n  // return true or false\n  return false;\n}',
      PYTHON: 'def solve(s):\n    # return True or False\n    pass',
      JAVA: '    static boolean solve(String s) {\n        return false;\n    }',
      CPP: 'bool solve(string s) {\n    return false;\n}',
      GO: 'func solve(s string) bool {\n    return false\n}',
    },
    // Measured from the canonical optimal solution on the reference judge.
    // Regenerate with scripts/calibrate.ts after changing judge hardware.
    referenceRuntimeMs: { JAVASCRIPT: 92, PYTHON: 55, JAVA: 185, CPP: 10, GO: 7 },
    driverCode: singleStringDrivers({
      js: 'solve(__input)',
      py: "'true' if solve(__input) else 'false'",
      java: 'solve(input)',
      cpp: '(solve(input) ? "true" : "false")',
      go: 'solve(input)',
    }),
    testCases: [
      { stdin: '()', expectedStdout: 'true', isSample: true },
      { stdin: '([]{})', expectedStdout: 'true', isSample: true },
      { stdin: '(]', expectedStdout: 'false', isSample: false },
      { stdin: '([)]', expectedStdout: 'false', isSample: false },
      { stdin: '{{[[(())]]}}', expectedStdout: 'true', isSample: false },
      { stdin: ']', expectedStdout: 'false', isSample: false },
    ],
  },
  {
    slug: 'longest-unique-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: Difficulty.MEDIUM,
    tags: ['string', 'sliding-window'],
    avgSolveSeconds: 780,
    promptMarkdown: `Given a string \`s\`, return the length of the longest substring that
contains no repeated characters.

**Input**: one line, the string (may be empty).
**Output**: a single integer.

**Example**
\`\`\`
Input:  abcabcbb
Output: 3          // "abc"
\`\`\`

A correct O(n) sliding-window solution is expected; O(n^2) may exceed the limit
on the largest hidden case.`,
    starterCode: {
      JAVASCRIPT: 'function solve(s) {\n  // return a number\n}',
      TYPESCRIPT: 'function solve(s: string): number {\n  // return a number\n  return 0;\n}',
      PYTHON: 'def solve(s):\n    # return an int\n    pass',
      JAVA: '    static int solve(String s) {\n        return 0;\n    }',
      CPP: 'int solve(string s) {\n    return 0;\n}',
      GO: 'func solve(s string) int {\n    return 0\n}',
    },
    // Measured from the canonical optimal solution on the reference judge.
    // Regenerate with scripts/calibrate.ts after changing judge hardware.
    referenceRuntimeMs: { JAVASCRIPT: 100, PYTHON: 70, JAVA: 200, CPP: 14, GO: 9 },
    driverCode: singleStringDrivers({
      js: 'solve(__input)',
      py: 'solve(__input)',
      java: 'solve(input)',
      cpp: 'solve(input)',
      go: 'solve(input)',
    }),
    testCases: [
      { stdin: 'abcabcbb', expectedStdout: '3', isSample: true },
      { stdin: 'bbbbb', expectedStdout: '1', isSample: true },
      { stdin: 'pwwkew', expectedStdout: '3', isSample: false },
      { stdin: '', expectedStdout: '0', isSample: false },
      { stdin: 'dvdf', expectedStdout: '3', isSample: false },
      { stdin: 'abcdefghijklmnopqrstuvwxyz', expectedStdout: '26', isSample: false },
      // 60k chars. This is the case that separates O(n) from O(n^2) — without
      // it, the performance gate would have nothing to measure.
      { stdin: LONG_UNIQUE_INPUT, expectedStdout: '95', isSample: false },
    ],
  },
];

async function main(): Promise<void> {
  for (const p of problems) {
    const { testCases, ...fields } = p;
    // Upsert keeps the seed idempotent; re-running it will not duplicate rows
    // or reset the community solve statistics on an existing problem.
    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      create: fields,
      update: {
        title: fields.title,
        difficulty: fields.difficulty,
        promptMarkdown: fields.promptMarkdown,
        tags: fields.tags,
        starterCode: fields.starterCode,
        driverCode: fields.driverCode,
        referenceRuntimeMs: fields.referenceRuntimeMs,
      },
    });

    await prisma.testCase.deleteMany({ where: { problemId: problem.id } });
    await prisma.testCase.createMany({
      data: testCases.map((tc, i) => ({ ...tc, problemId: problem.id, ordinal: i })),
    });

    // eslint-disable-next-line no-console
    console.log(`seeded ${p.slug} (${testCases.length} cases)`);
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
