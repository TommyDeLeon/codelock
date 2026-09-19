import type { Language } from '@codelock/shared';
import type { LanguageVariant, Lesson, LessonSource } from './catalog.js';

/**
 * The foundation lessons: one per skill in `skills.ts`, each in every
 * supported language.
 *
 * Every program below is run on the real judge by `scripts/verify-lessons.ts`
 * and must print exactly its `stdout`. The shared explanation and trace are
 * written to be true in all six languages; anything that is only true in one
 * of them is said in that variant's `note`, and nothing else claims it.
 *
 * Sources are the official manuals for the runtimes the judge actually uses:
 * Node 24 (JavaScript, and TypeScript by type stripping), Python 3.13, Java
 * 21, GCC 14 as C++20, Go 1.23. Each variant cites the page and section that
 * says what its example relies on. Nothing is copied from those pages.
 */

const REVIEWED = '2026-09-18';

const src = (
  publisher: string,
  title: string,
  url: string,
  section: string,
  runtime: string,
): LessonSource => ({
  publisher,
  title,
  url,
  section,
  runtime,
  reviewedOn: REVIEWED,
  adaptation: 'original',
  permission: 'link-only',
});

// Runtimes as the judge configures them (apps/judge/src/languages.ts).
const NODE = 'Node 24';
const TS = 'Node 24, type stripping';
const PY = 'Python 3.13';
const JAVA = 'Java 21';
const CPP = 'GCC 14, -std=c++20';
const GO = 'Go 1.23';

const mdn = (title: string, path: string, section: string) =>
  src('MDN Web Docs', title, `https://developer.mozilla.org/en-US/docs/Web/JavaScript/${path}`, section, NODE);
const tsdoc = (title: string, url: string, section: string) => src('TypeScript', title, url, section, TS);
const nodeTs = src(
  'Node.js',
  'Modules: TypeScript',
  'https://nodejs.org/docs/latest-v24.x/api/typescript.html',
  'Type stripping — only erasable syntax runs; no type checking at runtime',
  TS,
);
const py = (title: string, path: string, section: string, runtime: string = PY) =>
  src('Python Software Foundation', title, `https://docs.python.org/3.13/${path}`, section, runtime);
const devjava = (title: string, path: string, section: string) =>
  src('Oracle, dev.java', title, `https://dev.java/learn/${path}`, section, JAVA);
const cppref = (title: string, path: string, section: string) =>
  src('cppreference.com', title, `https://en.cppreference.com/w/cpp/${path}`, section, CPP);
const gospec = (title: string, anchor: string, section: string) =>
  src('The Go Authors', `The Go Programming Language Specification — ${title}`, `https://go.dev/ref/spec#${anchor}`, section, GO);
const goblog = (title: string, path: string, section: string) => src('The Go Authors', title, `https://go.dev/blog/${path}`, section, GO);

type Variants = Record<Language, Omit<LanguageVariant, 'language'>>;

function variants(v: Variants): Record<Language, LanguageVariant> {
  const out = {} as Record<Language, LanguageVariant>;
  for (const language of Object.keys(v) as Language[]) out[language] = { language, ...v[language] };
  return out;
}

const trim = (code: string) => code.replace(/^\n/, '').replace(/\n[ \t]*$/, '\n');

// ---------------------------------------------------------------------------
// values
// ---------------------------------------------------------------------------

const VALUES: Lesson = {
  id: 'values-arithmetic',
  refresher:
    'Three operations on whole numbers: whole-part division, fractional division and the remainder. The detail people miss is which one their language gives for a plain / (the variant below says), and that the remainder is what answers evenness and last-digit questions.',
  family: null,
  tags: ['modulo'],
  skill: 'values',
  title: 'Whole numbers, division and remainders',
  objective: 'Predict what a line of integer arithmetic prints, including the remainder.',
  prerequisites: [],
  misconceptions: [],
  explanation:
    'A program keeps values in named places. Whole numbers and numbers with a decimal point are different kinds of value, and the operations on them can differ. Three things come up in nearly every early problem: dividing and keeping only the whole part, dividing and keeping the fraction, and the remainder — what is left after dividing into equal groups. 7 divided into groups of 2 makes 3 groups with 1 left over: whole part 3, fraction 3.5, remainder 1. Every language has all three; what differs is how you ask for each, and the variant below shows the exact spelling for yours.',
  alternate:
    'Think of sharing 7 biscuits between 2 people. Each person gets 3 whole biscuits (whole-part division), the last one is left on the plate (remainder 1), and if you were allowed to break it, each would get 3.5 (fractional division). The remainder is the one people forget exists, and it is the one that answers “is this number even?” and “what is the last digit?”.',
  trace: [
    { label: 'Set up', text: 'a holds 7 and b holds 2.' },
    { label: 'Whole-part division', text: '7 divided by 2 is 3 with something left over, so the whole part is 3.' },
    { label: 'Fractional division', text: 'Allowing a fraction, 7 divided by 2 is 3.5.' },
    { label: 'Remainder', text: 'After taking 3 groups of 2 from 7, 1 is left. The remainder is 1.' },
    { label: 'Print', text: 'The three results are printed on one line: 3 3.5 1.' },
  ],
  smaller: {
    description: 'The same three operations with a = 5 and b = 2.',
    trace: [
      { label: 'Whole part', text: '5 divided by 2 is 2 with 1 left, so the whole part is 2.' },
      { label: 'Fraction', text: '5 divided by 2 with a fraction allowed is 2.5.' },
      { label: 'Remainder', text: 'Taking 2 groups of 2 from 5 leaves 1.' },
    ],
  },
  check: {
    id: 'values-remainder',
    question: 'What is the remainder when 9 is divided into groups of 4?',
    options: ['2', '1', '2.25', '0'],
    answer: 1,
    explanation: 'Two groups of 4 make 8, and 9 − 8 = 1. The remainder is what is left after the largest whole number of groups, not the fraction and not the number of groups.',
  },
  practiceSkill: 'values',
  sources: [
    py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#numbers', 'Numbers: /, // and % on integers', 'concept'),
  ],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const a = 7;
const b = 2;
console.log(Math.trunc(a / b), a / b, a % b);
`),
        stdout: '3 3.5 1\n',
      },
      note: 'JavaScript has one number type, so a / b already gives 3.5. To keep the whole part you ask for it with Math.trunc.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
console.log(17 / 5);
`),
        solution: trim(`
console.log(17 % 5);
`),
        stdout: '2\n',
      },
      sources: [
        mdn('Expressions and operators', 'Guide/Expressions_and_operators', 'Arithmetic operators — remainder (%)'),
        mdn('Math.trunc()', 'Reference/Global_Objects/Math/trunc', 'Description'),
      ],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const a: number = 7;
const b: number = 2;
console.log(Math.trunc(a / b), a / b, a % b);
`),
        stdout: '3 3.5 1\n',
      },
      note: 'TypeScript adds the annotation : number; at run time this is JavaScript, so a / b is 3.5 and Math.trunc keeps the whole part.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
const n: number = 17;
console.log(n / 5);
`),
        solution: trim(`
const n: number = 17;
console.log(n % 5);
`),
        stdout: '2\n',
      },
      sources: [
        tsdoc('Everyday Types', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', 'The primitives: string, number, and boolean'),
        nodeTs,
      ],
    },
    PYTHON: {
      example: {
        code: trim(`
a = 7
b = 2
print(a // b, a / b, a % b)
`),
        stdout: '3 3.5 1\n',
      },
      note: 'In Python, / always gives a float and // gives the whole part.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
print(17 / 5)
`),
        solution: trim(`
print(17 % 5)
`),
        stdout: '2\n',
      },
      sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#numbers', 'Numbers: / returns a float, // floors, % gives the remainder')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    public static void main(String[] args) {
        int a = 7;
        int b = 2;
        System.out.println(a / b + " " + a / 2.0 + " " + a % b);
    }
}
`),
        stdout: '3 3.5 1\n',
      },
      note: 'In Java, dividing two int values keeps the whole part. Writing 2.0 makes one side a double, so the division keeps the fraction.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
public class Main {
    public static void main(String[] args) {
        System.out.println(17 / 5);
    }
}
`),
        solution: trim(`
public class Main {
    public static void main(String[] args) {
        System.out.println(17 % 5);
    }
}
`),
        stdout: '2\n',
      },
      sources: [
        devjava('Using Operators in Your Programs', 'language-basics/using-operators/', 'The Arithmetic Operators — %'),
        devjava('Creating Primitive Type Variables in Your Programs', 'language-basics/primitive-types/', 'int and double'),
      ],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>

int main() {
    int a = 7;
    int b = 2;
    std::cout << a / b << " " << a / 2.0 << " " << a % b << "\\n";
}
`),
        stdout: '3 3.5 1\n',
      },
      note: 'In C++, dividing two int values keeps the whole part. Writing 2.0 makes the division floating-point.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
#include <iostream>

int main() {
    std::cout << 17 / 5 << "\\n";
}
`),
        solution: trim(`
#include <iostream>

int main() {
    std::cout << 17 % 5 << "\\n";
}
`),
        stdout: '2\n',
      },
      sources: [cppref('Arithmetic operators', 'language/operator_arithmetic', 'Multiplicative operators — integer division truncates; % is the remainder')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    a := 7
    b := 2
    fmt.Println(a/b, float64(a)/float64(b), a%b)
}
`),
        stdout: '3 3.5 1\n',
      },
      note: 'In Go, dividing two int values keeps the whole part. Converting with float64 keeps the fraction.',
      task: {
        prompt: 'The program should print how many are left over when 17 is split into groups of 5. It prints the wrong thing. Change one operator.',
        starter: trim(`
package main

import "fmt"

func main() {
    fmt.Println(17 / 5)
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    fmt.Println(17 % 5)
}
`),
        stdout: '2\n',
      },
      sources: [gospec('Arithmetic operators', 'Arithmetic_operators', 'Integer operators — quotient truncates, % is the remainder')],
    },
  }),
};

// ---------------------------------------------------------------------------
// comparisons
// ---------------------------------------------------------------------------

const COMPARISONS: Lesson = {
  id: 'comparisons-boundaries',
  refresher:
    'In a chain of conditions the first true branch wins and the rest are never asked, so order the strictest first. On the boundary value, "at least" is >= and "more than" is >; they differ on exactly one number.',
  family: null,
  tags: [],
  skill: 'comparisons',
  title: 'Conditions and the boundary value',
  objective: 'Write a condition that is true exactly on the boundary the problem states, and say which branch runs.',
  prerequisites: ['values'],
  misconceptions: ['strictness', 'assignment_in_condition'],
  explanation:
    'A condition is a question with a yes-or-no answer, and a branch runs only when its question is answered yes. When several branches are chained, they are asked in order and the first yes wins; the later questions are never asked. Most mistakes live on the boundary: “30 or more” is a different question from “more than 30”, and the difference is exactly one value. Read the problem for words like “at least”, “more than”, “up to” and translate each into the comparison that includes or excludes the boundary.',
  alternate:
    'A chain of conditions is a set of doors in a corridor. You try the first door; if it opens you go through and never see the rest. So the order matters as much as the questions: put the strictest check first. And every door has a threshold — a number where the answer flips — and “≥ 30” and “> 30” disagree only when you stand exactly on 30.',
  trace: [
    { label: 'Set up', text: 't holds 20.' },
    { label: 'First question', text: 'Is t at least 30? 20 is not, so this branch is skipped.' },
    { label: 'Second question', text: 'Is t at least 20? 20 is exactly 20, and “at least” includes the boundary, so yes.' },
    { label: 'Print', text: 'The second branch runs and prints warm. The third branch is never considered.' },
  ],
  smaller: {
    description: 'The same chain with t = 35.',
    trace: [
      { label: 'First question', text: 'Is 35 at least 30? Yes.' },
      { label: 'Stop', text: 'The first branch prints hot, and nothing after it is asked.' },
    ],
  },
  check: {
    id: 'comparisons-boundary',
    question: 'With t = 30, which word does the example print?',
    options: ['hot', 'warm', 'cool', 'nothing'],
    answer: 0,
    explanation: 'The first question is “at least 30”, which includes 30 itself, so the first branch runs and the chain stops there.',
  },
  practiceSkill: 'comparisons',
  sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#if-statements', 'if statements: the elif chain', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const t = 20;
if (t >= 30) {
  console.log("hot");
} else if (t >= 20) {
  console.log("warm");
} else {
  console.log("cool");
}
`),
        stdout: 'warm\n',
      },
      note: null,
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
const score = 50;
if (score > 50) {
  console.log("pass");
} else {
  console.log("fail");
}
`),
        solution: trim(`
const score = 50;
if (score >= 50) {
  console.log("pass");
} else {
  console.log("fail");
}
`),
        stdout: 'pass\n',
      },
      sources: [mdn('Control flow and error handling', 'Guide/Control_flow_and_error_handling', 'if...else statement'), mdn('Expressions and operators', 'Guide/Expressions_and_operators', 'Comparison operators')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const t: number = 20;
if (t >= 30) {
  console.log("hot");
} else if (t >= 20) {
  console.log("warm");
} else {
  console.log("cool");
}
`),
        stdout: 'warm\n',
      },
      note: null,
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
const score: number = 50;
if (score > 50) {
  console.log("pass");
} else {
  console.log("fail");
}
`),
        solution: trim(`
const score: number = 50;
if (score >= 50) {
  console.log("pass");
} else {
  console.log("fail");
}
`),
        stdout: 'pass\n',
      },
      sources: [tsdoc('Narrowing', 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html', 'Equality narrowing and truthiness'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
t = 20
if t >= 30:
    print("hot")
elif t >= 20:
    print("warm")
else:
    print("cool")
`),
        stdout: 'warm\n',
      },
      note: 'Python uses elif for the middle branches and indentation, not braces, to mark what belongs to each.',
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
score = 50
if score > 50:
    print("pass")
else:
    print("fail")
`),
        solution: trim(`
score = 50
if score >= 50:
    print("pass")
else:
    print("fail")
`),
        stdout: 'pass\n',
      },
      sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#if-statements', 'if statements')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    public static void main(String[] args) {
        int t = 20;
        if (t >= 30) {
            System.out.println("hot");
        } else if (t >= 20) {
            System.out.println("warm");
        } else {
            System.out.println("cool");
        }
    }
}
`),
        stdout: 'warm\n',
      },
      note: null,
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
public class Main {
    public static void main(String[] args) {
        int score = 50;
        if (score > 50) {
            System.out.println("pass");
        } else {
            System.out.println("fail");
        }
    }
}
`),
        solution: trim(`
public class Main {
    public static void main(String[] args) {
        int score = 50;
        if (score >= 50) {
            System.out.println("pass");
        } else {
            System.out.println("fail");
        }
    }
}
`),
        stdout: 'pass\n',
      },
      sources: [devjava('Control Flow Statements', 'language-basics/controlling-flow/', 'The If-Then-Else Statement'), devjava('Using Operators in Your Programs', 'language-basics/using-operators/', 'The Equality and Relational Operators')],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>

int main() {
    int t = 20;
    if (t >= 30) {
        std::cout << "hot\\n";
    } else if (t >= 20) {
        std::cout << "warm\\n";
    } else {
        std::cout << "cool\\n";
    }
}
`),
        stdout: 'warm\n',
      },
      note: null,
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
#include <iostream>

int main() {
    int score = 50;
    if (score > 50) {
        std::cout << "pass\\n";
    } else {
        std::cout << "fail\\n";
    }
}
`),
        solution: trim(`
#include <iostream>

int main() {
    int score = 50;
    if (score >= 50) {
        std::cout << "pass\\n";
    } else {
        std::cout << "fail\\n";
    }
}
`),
        stdout: 'pass\n',
      },
      sources: [cppref('if statement', 'language/if', 'Explanation'), cppref('Comparison operators', 'language/operator_comparison', 'Relational operators')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    t := 20
    if t >= 30 {
        fmt.Println("hot")
    } else if t >= 20 {
        fmt.Println("warm")
    } else {
        fmt.Println("cool")
    }
}
`),
        stdout: 'warm\n',
      },
      note: 'Go writes conditions without parentheses, and the opening brace must be on the same line as the if.',
      task: {
        prompt: 'A score of 50 or more passes. The program says a score of exactly 50 fails. Fix the condition.',
        starter: trim(`
package main

import "fmt"

func main() {
    score := 50
    if score > 50 {
        fmt.Println("pass")
    } else {
        fmt.Println("fail")
    }
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    score := 50
    if score >= 50 {
        fmt.Println("pass")
    } else {
        fmt.Println("fail")
    }
}
`),
        stdout: 'pass\n',
      },
      sources: [gospec('If statements', 'If_statements', 'If statements'), gospec('Comparison operators', 'Comparison_operators', 'Comparison operators')],
    },
  }),
};

// ---------------------------------------------------------------------------
// strings
// ---------------------------------------------------------------------------

const STRINGS: Lesson = {
  id: 'strings-build',
  refresher:
    'Joining strings makes a new string and leaves the originals unchanged; length counts every character, spaces included. Reading a character by position is the next lesson, not this one.',
  family: null,
  tags: ['split', 'join', 'case-conversion', 'characters'],
  skill: 'strings',
  title: 'Text values and building new ones',
  objective: 'Build a new string from an existing one and read its length, and say why the original is unchanged.',
  prerequisites: ['values'],
  misconceptions: [],
  explanation:
    'Text is a value like a number is, written inside quotes. Joining two pieces of text makes a new, longer piece; the originals are not changed by it. Every string knows its own length. Those two facts are enough for many first problems: build the answer from parts, and ask how long something is. Later lessons add reading one character by position; this one deliberately does not.',
  alternate:
    'A string is a word on a sticky note. Joining two notes gives you a third note with both words on it, and the two you started with are still on the desk, unchanged. Asking for the length is counting the characters on a note, spaces and punctuation included.',
  trace: [
    { label: 'Set up', text: 'word holds the five characters of hello.' },
    { label: 'Build', text: 'loud is made by joining word with an exclamation mark: hello! — six characters.' },
    { label: 'Original', text: 'word is still hello. Joining read it; it did not change it.' },
    { label: 'Print', text: 'hello hello! 6' },
  ],
  smaller: {
    description: 'The same steps with word = "hi".',
    trace: [
      { label: 'Build', text: 'loud becomes hi! — three characters.' },
      { label: 'Print', text: 'hi hi! 3' },
    ],
  },
  check: {
    id: 'strings-original',
    question: 'After loud is built from word, what does word hold?',
    options: ['hello!', 'hello', 'nothing', 'loud'],
    answer: 1,
    explanation: 'Joining makes a new string and leaves the ones it read alone. word is still hello; only loud is new.',
  },
  practiceSkill: 'strings',
  sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: concatenation with + and len()', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const word = "hello";
const loud = word + "!";
console.log(word, loud, loud.length);
`),
        stdout: 'hello hello! 6\n',
      },
      note: null,
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
const name = "ada";
const greeting = "Hi, " + name;
console.log(greeting);
`),
        solution: trim(`
const name = "ada";
const greeting = "Hi, " + name + "!";
console.log(greeting);
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [mdn('Text formatting', 'Guide/Text_formatting', 'String literals and String objects'), mdn('String: length', 'Reference/Global_Objects/String/length', 'Description')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const word: string = "hello";
const loud: string = word + "!";
console.log(word, loud, loud.length);
`),
        stdout: 'hello hello! 6\n',
      },
      note: null,
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
const name: string = "ada";
const greeting: string = "Hi, " + name;
console.log(greeting);
`),
        solution: trim(`
const name: string = "ada";
const greeting: string = "Hi, " + name + "!";
console.log(greeting);
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [tsdoc('Everyday Types', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', 'The primitives: string'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
word = "hello"
loud = word + "!"
print(word, loud, len(loud))
`),
        stdout: 'hello hello! 6\n',
      },
      note: 'Python strings cannot be changed in place at all; every operation that looks like a change gives you a new string.',
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
name = "ada"
greeting = "Hi, " + name
print(greeting)
`),
        solution: trim(`
name = "ada"
greeting = "Hi, " + name + "!"
print(greeting)
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: strings are immutable; + concatenates; len()')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    public static void main(String[] args) {
        String word = "hello";
        String loud = word + "!";
        System.out.println(word + " " + loud + " " + loud.length());
    }
}
`),
        stdout: 'hello hello! 6\n',
      },
      note: 'Java String objects are immutable: + always builds a new one, and length() is a method call with parentheses.',
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
public class Main {
    public static void main(String[] args) {
        String name = "ada";
        String greeting = "Hi, " + name;
        System.out.println(greeting);
    }
}
`),
        solution: trim(`
public class Main {
    public static void main(String[] args) {
        String name = "ada";
        String greeting = "Hi, " + name + "!";
        System.out.println(greeting);
    }
}
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [devjava('Strings', 'numbers-strings/strings/', 'Creating Strings; Concatenating Strings; String Length')],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>
#include <string>

int main() {
    std::string word = "hello";
    std::string loud = word + "!";
    std::cout << word << " " << loud << " " << loud.size() << "\\n";
}
`),
        stdout: 'hello hello! 6\n',
      },
      note: 'std::string is a value: + makes a new string, and size() is its length. Unlike Java and Python, a C++ string can also be changed in place later — this example does not.',
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
#include <iostream>
#include <string>

int main() {
    std::string name = "ada";
    std::string greeting = "Hi, " + name;
    std::cout << greeting << "\\n";
}
`),
        solution: trim(`
#include <iostream>
#include <string>

int main() {
    std::string name = "ada";
    std::string greeting = "Hi, " + name + "!";
    std::cout << greeting << "\\n";
}
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [cppref('std::basic_string', 'string/basic_string', 'operator+ and size()')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    word := "hello"
    loud := word + "!"
    fmt.Println(word, loud, len(loud))
}
`),
        stdout: 'hello hello! 6\n',
      },
      note: 'Go strings are immutable and len counts bytes, not characters. For the plain letters here that is the same number; for accented or non-Latin text it is not.',
      task: {
        prompt: 'The greeting should end with an exclamation mark: Hi, ada! Add it.',
        starter: trim(`
package main

import "fmt"

func main() {
    name := "ada"
    greeting := "Hi, " + name
    fmt.Println(greeting)
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    name := "ada"
    greeting := "Hi, " + name + "!"
    fmt.Println(greeting)
}
`),
        stdout: 'Hi, ada!\n',
      },
      sources: [goblog('Strings, bytes, runes and characters in Go', 'strings', 'What is a string? — len is in bytes'), gospec('String concatenation', 'String_concatenation', 'String concatenation')],
    },
  }),
};

// ---------------------------------------------------------------------------
// indexing
// ---------------------------------------------------------------------------

const INDEXING: Lesson = {
  id: 'indexing-bounds',
  refresher:
    'Positions start at 0, so the last valid position is length - 1. Asking for the position equal to the length is the classic crash; write length - 1 for the last item, never the length.',
  family: null,
  tags: ['substring'],
  skill: 'indexing',
  title: 'Positions start at zero and stop one before the length',
  objective: 'Name the valid positions of a sequence of a given length, and read its first and last item without going out of bounds.',
  prerequisites: ['strings'],
  misconceptions: ['index_bound', 'unguarded_index', 'index_crash'],
  explanation:
    'Every item in a string has a position, and the first position is 0, not 1. That makes the last position one less than the length: four characters live at positions 0, 1, 2 and 3. Asking for position 4 in a four-character string is asking for something that is not there, and every supported language treats that as a mistake — some by stopping the program, some by handing back a meaningless value. The habit that prevents it is to write length − 1 for the last item, and never the length itself.',
  alternate:
    'Picture the characters in numbered boxes with the numbering starting at 0. The count of boxes and the number on the last box always differ by one. Whenever you write a position, ask which box it names; if the answer is “the one after the last box”, the position is wrong.',
  trace: [
    { label: 'Set up', text: 'word holds code. Its length is 4.' },
    { label: 'Positions', text: 'c is at 0, o at 1, d at 2, e at 3. There is no position 4.' },
    { label: 'First', text: 'Position 0 gives c.' },
    { label: 'Last', text: 'length − 1 is 3, and position 3 gives e.' },
    { label: 'Print', text: 'c e 4' },
  ],
  smaller: {
    description: 'The same with word = "go", length 2.',
    trace: [
      { label: 'Positions', text: 'g at 0, o at 1. No position 2.' },
      { label: 'Print', text: 'g o 2' },
    ],
  },
  check: {
    id: 'indexing-last',
    question: 'A string has 4 characters. What is the position of its last character?',
    options: ['4', '3', '5', '0'],
    answer: 1,
    explanation: 'Positions start at 0, so four characters occupy 0 through 3. The last position is the length minus one.',
  },
  practiceSkill: 'indexing',
  sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: indexing; “Attempting to use an index that is too large will result in an error”', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const word = "code";
console.log(word[0], word[word.length - 1], word.length);
`),
        stdout: 'c e 4\n',
      },
      note: 'JavaScript does not stop the program for a position past the end; it gives undefined, which then prints as the word undefined. The mistake is quieter here, not absent.',
      task: {
        prompt: 'The program should print the last letter of the word. It prints something else. Fix the position.',
        starter: trim(`
const word = "code";
console.log(word[word.length]);
`),
        solution: trim(`
const word = "code";
console.log(word[word.length - 1]);
`),
        stdout: 'e\n',
      },
      sources: [mdn('Text formatting', 'Guide/Text_formatting', 'Accessing characters — bracket notation'), mdn('String: length', 'Reference/Global_Objects/String/length', 'Description')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const word: string = "code";
console.log(word[0], word[word.length - 1], word.length);
`),
        stdout: 'c e 4\n',
      },
      note: 'At run time this is JavaScript: a position past the end gives undefined rather than an error. TypeScript’s checker does not run on the judge, so it cannot warn you either.',
      task: {
        prompt: 'The program should print the last letter of the word. It prints something else. Fix the position.',
        starter: trim(`
const word: string = "code";
console.log(word[word.length]);
`),
        solution: trim(`
const word: string = "code";
console.log(word[word.length - 1]);
`),
        stdout: 'e\n',
      },
      sources: [mdn('Text formatting', 'Guide/Text_formatting', 'Accessing characters — bracket notation'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
word = "code"
print(word[0], word[len(word) - 1], len(word))
`),
        stdout: 'c e 4\n',
      },
      note: 'Python also allows negative positions counted from the end, so word[-1] is the last character. This lesson uses len(word) - 1 because that form is what the other languages need.',
      task: {
        prompt: 'The program should print the last letter of the word. It crashes instead. Fix the position.',
        starter: trim(`
word = "code"
print(word[len(word)])
`),
        solution: trim(`
word = "code"
print(word[len(word) - 1])
`),
        stdout: 'e\n',
      },
      sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: indexing and IndexError')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    public static void main(String[] args) {
        String word = "code";
        System.out.println(word.charAt(0) + " " + word.charAt(word.length() - 1) + " " + word.length());
    }
}
`),
        stdout: 'c e 4\n',
      },
      note: 'Java reads one character with charAt(position), and a position past the end throws StringIndexOutOfBoundsException.',
      task: {
        prompt: 'The program should print the last letter of the word. It crashes instead. Fix the position.',
        starter: trim(`
public class Main {
    public static void main(String[] args) {
        String word = "code";
        System.out.println(word.charAt(word.length()));
    }
}
`),
        solution: trim(`
public class Main {
    public static void main(String[] args) {
        String word = "code";
        System.out.println(word.charAt(word.length() - 1));
    }
}
`),
        stdout: 'e\n',
      },
      sources: [src('Oracle', 'Java SE 21 API — String', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html', 'charAt(int index) — throws IndexOutOfBoundsException', JAVA)],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>
#include <string>

int main() {
    std::string word = "code";
    std::cout << word.at(0) << " " << word.at(word.size() - 1) << " " << word.size() << "\\n";
}
`),
        stdout: 'c e 4\n',
      },
      note: 'C++ has two ways to read a position: at(i) checks the bound and throws std::out_of_range; word[i] does not check at all and can silently read memory that is not yours. This lesson uses at() on purpose.',
      task: {
        prompt: 'The program should print the last letter of the word. It crashes instead. Fix the position.',
        starter: trim(`
#include <iostream>
#include <string>

int main() {
    std::string word = "code";
    std::cout << word.at(word.size()) << "\\n";
}
`),
        solution: trim(`
#include <iostream>
#include <string>

int main() {
    std::string word = "code";
    std::cout << word.at(word.size() - 1) << "\\n";
}
`),
        stdout: 'e\n',
      },
      sources: [cppref('std::basic_string::at', 'string/basic_string/at', 'Exceptions — std::out_of_range if pos >= size()')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    word := "code"
    fmt.Println(string(word[0]), string(word[len(word)-1]), len(word))
}
`),
        stdout: 'c e 4\n',
      },
      note: 'In Go, word[i] is a byte, not a character, so it is wrapped in string(...) to print it. That is only right for plain ASCII letters like these; a multi-byte character such as é would need []rune(word) first. A position at or past len(word) is a run-time panic.',
      task: {
        prompt: 'The program should print the last letter of the word. It panics instead. Fix the position.',
        starter: trim(`
package main

import "fmt"

func main() {
    word := "code"
    fmt.Println(string(word[len(word)]))
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    word := "code"
    fmt.Println(string(word[len(word)-1]))
}
`),
        stdout: 'e\n',
      },
      sources: [gospec('Index expressions', 'Index_expressions', 'For a of string type: the index must be in range, a[x] is the byte at index x'), goblog('Strings, bytes, runes and characters in Go', 'strings', 'Indexing a string yields bytes')],
    },
  }),
};

// ---------------------------------------------------------------------------
// lists
// ---------------------------------------------------------------------------

const LISTS: Lesson = {
  id: 'lists-append',
  refresher:
    'Adding to the end grows the list by one and puts the new item at position length - 1. An empty list has length 0 and no valid position, so check before reading position 0.',
  family: null,
  tags: ['linear-search'],
  skill: 'lists',
  title: 'A list holds many values in order',
  objective: 'Add a value to the end of a list, then read its length and its last item.',
  prerequisites: ['indexing'],
  misconceptions: ['empty_input'],
  explanation:
    'A list is one value that holds many, in order, each at a position counted from 0 exactly as in a string. Adding to the end makes the list one longer, and the new item is at the last position, length − 1. A list can also be empty, with length 0 and no valid position at all; many first problems are exactly about noticing that case before reading position 0.',
  alternate:
    'A list is a row of numbered boxes that can grow. Adding an item nails a new box on the end and gives it the next number. The count of boxes is the length; the newest box is always numbered one less than that count. An empty row has no boxes, so there is nothing to open.',
  trace: [
    { label: 'Set up', text: 'nums holds 4 and 8: length 2, positions 0 and 1.' },
    { label: 'Add', text: '15 is added to the end. Now length is 3 and 15 sits at position 2.' },
    { label: 'Read', text: 'The length is 3; position length − 1 = 2 gives 15.' },
    { label: 'Print', text: '3 15' },
  ],
  smaller: {
    description: 'Start from an empty list and add one value, 7.',
    trace: [
      { label: 'Set up', text: 'The list is empty: length 0, no positions.' },
      { label: 'Add', text: '7 goes at position 0; length becomes 1.' },
      { label: 'Print', text: '1 7' },
    ],
  },
  check: {
    id: 'lists-after-add',
    question: 'A list has 2 items and one more is added at the end. What are its length and the position of the new item?',
    options: ['length 3, position 3', 'length 3, position 2', 'length 2, position 2', 'length 3, position 0'],
    answer: 1,
    explanation: 'Adding makes the length 3. Positions run 0, 1, 2, so the newest item is at 2 — the length minus one.',
  },
  practiceSkill: 'lists',
  sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#lists', 'Lists: indexing, len(), append()', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const nums = [4, 8];
nums.push(15);
console.log(nums.length, nums[nums.length - 1]);
`),
        stdout: '3 15\n',
      },
      note: 'JavaScript calls the list an array; push adds to the end.',
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
const nums = [10, 20];
console.log(nums.length, nums[nums.length - 1]);
`),
        solution: trim(`
const nums = [10, 20];
nums.push(30);
console.log(nums.length, nums[nums.length - 1]);
`),
        stdout: '3 30\n',
      },
      sources: [mdn('Indexed collections', 'Guide/Indexed_collections', 'Array object — creating, referring to elements, length'), mdn('Array.prototype.push()', 'Reference/Global_Objects/Array/push', 'Description')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const nums: number[] = [4, 8];
nums.push(15);
console.log(nums.length, nums[nums.length - 1]);
`),
        stdout: '3 15\n',
      },
      note: 'number[] says what the array holds; at run time it is a plain JavaScript array.',
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
const nums: number[] = [10, 20];
console.log(nums.length, nums[nums.length - 1]);
`),
        solution: trim(`
const nums: number[] = [10, 20];
nums.push(30);
console.log(nums.length, nums[nums.length - 1]);
`),
        stdout: '3 30\n',
      },
      sources: [tsdoc('Everyday Types', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', 'Arrays'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
nums = [4, 8]
nums.append(15)
print(len(nums), nums[len(nums) - 1])
`),
        stdout: '3 15\n',
      },
      note: null,
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
nums = [10, 20]
print(len(nums), nums[len(nums) - 1])
`),
        solution: trim(`
nums = [10, 20]
nums.append(30)
print(len(nums), nums[len(nums) - 1])
`),
        stdout: '3 30\n',
      },
      sources: [py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#lists', 'Lists: append(), len()')],
    },
    JAVA: {
      example: {
        code: trim(`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(4, 8));
        nums.add(15);
        System.out.println(nums.size() + " " + nums.get(nums.size() - 1));
    }
}
`),
        stdout: '3 15\n',
      },
      note: 'A Java array has a fixed length, so a growable list is an ArrayList: add() appends, size() is the length, get(i) reads a position.',
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(10, 20));
        System.out.println(nums.size() + " " + nums.get(nums.size() - 1));
    }
}
`),
        solution: trim(`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(10, 20));
        nums.add(30);
        System.out.println(nums.size() + " " + nums.get(nums.size() - 1));
    }
}
`),
        stdout: '3 30\n',
      },
      sources: [devjava('Storing Elements in a List', 'api/collections-framework/lists/', 'Adding and Getting Elements'), devjava('Arrays', 'language-basics/arrays/', 'Arrays have a fixed length')],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {4, 8};
    nums.push_back(15);
    std::cout << nums.size() << " " << nums.at(nums.size() - 1) << "\\n";
}
`),
        stdout: '3 15\n',
      },
      note: 'The growable list in C++ is std::vector: push_back appends, size() is the length, at(i) reads a position with a bounds check.',
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20};
    std::cout << nums.size() << " " << nums.at(nums.size() - 1) << "\\n";
}
`),
        solution: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20};
    nums.push_back(30);
    std::cout << nums.size() << " " << nums.at(nums.size() - 1) << "\\n";
}
`),
        stdout: '3 30\n',
      },
      sources: [cppref('std::vector', 'container/vector', 'Member functions — push_back, size, at')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    nums := []int{4, 8}
    nums = append(nums, 15)
    fmt.Println(len(nums), nums[len(nums)-1])
}
`),
        stdout: '3 15\n',
      },
      note: 'Go’s growable list is a slice. append returns the grown slice, so the result must be assigned back: nums = append(nums, 15).',
      task: {
        prompt: 'The list should hold 10, 20 and 30 before it is printed. Add the missing value to the end.',
        starter: trim(`
package main

import "fmt"

func main() {
    nums := []int{10, 20}
    fmt.Println(len(nums), nums[len(nums)-1])
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    nums := []int{10, 20}
    nums = append(nums, 30)
    fmt.Println(len(nums), nums[len(nums)-1])
}
`),
        stdout: '3 30\n',
      },
      sources: [goblog('Go Slices: usage and internals', 'slices-intro', 'Growing slices (the copy and append functions)'), gospec('Appending to and copying slices', 'Appending_and_copying_slices', 'append')],
    },
  }),
};

// ---------------------------------------------------------------------------
// loops (the cross-language pilot)
// ---------------------------------------------------------------------------

const LOOPS: Lesson = {
  id: 'loops-running-total',
  refresher:
    'Create the total once, before the loop, at 0; add to it on every pass; read it after the loop. Created inside the loop it is remade every pass and keeps only the last item.',
  family: null,
  tags: ['accumulator', 'counting', 'running-best'],
  skill: 'loops',
  title: 'A running total across a loop',
  objective: 'Keep one total that survives every pass of a loop, and say what it holds after each pass.',
  prerequisites: ['lists', 'comparisons'],
  misconceptions: ['accumulator_reset', 'running_best_start', 'unnecessary_loop', 'return_in_loop'],
  explanation:
    'A loop runs the same few lines once for each item. To add the items up, you need one place that remembers what has been added so far, and it has to be created before the loop, not inside it: anything created inside the loop is created afresh on every pass and forgets the earlier ones. Start the total at 0, add the current item to it on each pass, and read it once the loop is over. An empty list is handled for free — the loop runs zero times and the total is still 0.',
  alternate:
    'Counting coins into a jar. You put the empty jar down once, before you start. Each coin goes into the same jar. If you swapped in a fresh empty jar for every coin, you would end with only the last coin in it — which is exactly what happens when the total is created inside the loop.',
  trace: [
    { label: 'Before the loop', text: 'total is created and holds 0. nums holds 3, 5, 2.' },
    { label: 'Pass 1', text: 'The item is 3. total becomes 0 + 3 = 3.' },
    { label: 'Pass 2', text: 'The item is 5. total becomes 3 + 5 = 8. It remembered the 3.' },
    { label: 'Pass 3', text: 'The item is 2. total becomes 8 + 2 = 10.' },
    { label: 'After the loop', text: 'No items are left. total holds 10 and is printed.' },
  ],
  smaller: {
    description: 'The same loop over a one-item list, [4].',
    trace: [
      { label: 'Before', text: 'total is 0.' },
      { label: 'Pass 1', text: 'The item is 4. total becomes 4.' },
      { label: 'After', text: 'The loop ends; 4 is printed.' },
    ],
  },
  check: {
    id: 'loops-third-pass',
    question: 'If nums were 3, 5, 2, 4, what would total hold right after the third pass?',
    options: ['2', '10', '14', '0'],
    answer: 1,
    explanation: 'After the passes for 3, 5 and 2 the total is 3 + 5 + 2 = 10. The fourth item has not been added yet; and if the total were recreated each pass it would be only 2.',
  },
  practiceSkill: 'loops',
  sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#for-statements', 'for statements: iterating over the items of a sequence', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const nums = [3, 5, 2];
let total = 0;
for (const n of nums) {
  total = total + n;
}
console.log(total);
`),
        stdout: '10\n',
      },
      note: 'total is declared with let because it changes; each n is const because a new one is made on every pass.',
      task: {
        prompt: 'The program should print the sum of the list, 10, once. It prints something else. Move the total outside the loop and print it once after the loop.',
        starter: trim(`
const nums = [3, 5, 2];
for (const n of nums) {
  let total = 0;
  total = total + n;
  console.log(total);
}
`),
        solution: trim(`
const nums = [3, 5, 2];
let total = 0;
for (const n of nums) {
  total = total + n;
}
console.log(total);
`),
        stdout: '10\n',
      },
      sources: [mdn('Loops and iteration', 'Guide/Loops_and_iteration', 'for...of statement'), mdn('Grammar and types', 'Guide/Grammar_and_types', 'Variable scope — block-scoped let')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const nums: number[] = [3, 5, 2];
let total: number = 0;
for (const n of nums) {
  total = total + n;
}
console.log(total);
`),
        stdout: '10\n',
      },
      note: null,
      task: {
        prompt: 'The program should print the sum of the list, 10, once. It prints something else. Move the total outside the loop and print it once after the loop.',
        starter: trim(`
const nums: number[] = [3, 5, 2];
for (const n of nums) {
  let total: number = 0;
  total = total + n;
  console.log(total);
}
`),
        solution: trim(`
const nums: number[] = [3, 5, 2];
let total: number = 0;
for (const n of nums) {
  total = total + n;
}
console.log(total);
`),
        stdout: '10\n',
      },
      sources: [mdn('Loops and iteration', 'Guide/Loops_and_iteration', 'for...of statement'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
nums = [3, 5, 2]
total = 0
for n in nums:
    total = total + n
print(total)
`),
        stdout: '10\n',
      },
      note: 'The indented line is the body of the loop; the print is not indented, so it runs once, after the loop.',
      task: {
        prompt: 'The program should print the sum of the list, 10. It prints 2. One line is in the wrong place — move it.',
        starter: trim(`
nums = [3, 5, 2]
for n in nums:
    total = 0
    total = total + n
print(total)
`),
        solution: trim(`
nums = [3, 5, 2]
total = 0
for n in nums:
    total = total + n
print(total)
`),
        stdout: '10\n',
      },
      sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#for-statements', 'for statements')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 5, 2};
        int total = 0;
        for (int n : nums) {
            total = total + n;
        }
        System.out.println(total);
    }
}
`),
        stdout: '10\n',
      },
      note: 'This is the enhanced for statement: n takes each element in turn. A variable declared inside the braces exists only for that pass.',
      task: {
        prompt: 'The program should print the sum of the array, 10. It prints 2. One line is in the wrong place — move it.',
        starter: trim(`
public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 5, 2};
        int total = 0;
        for (int n : nums) {
            total = 0;
            total = total + n;
        }
        System.out.println(total);
    }
}
`),
        solution: trim(`
public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 5, 2};
        int total = 0;
        for (int n : nums) {
            total = total + n;
        }
        System.out.println(total);
    }
}
`),
        stdout: '10\n',
      },
      sources: [devjava('Control Flow Statements', 'language-basics/controlling-flow/', 'The For Statement — the enhanced for')],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {3, 5, 2};
    int total = 0;
    for (int n : nums) {
        total = total + n;
    }
    std::cout << total << "\\n";
}
`),
        stdout: '10\n',
      },
      note: 'This is the range-based for: n is a copy of each element in turn.',
      task: {
        prompt: 'The program should print the sum of the vector, 10. It prints 2. One line is in the wrong place — move it.',
        starter: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {3, 5, 2};
    int total = 0;
    for (int n : nums) {
        total = 0;
        total = total + n;
    }
    std::cout << total << "\\n";
}
`),
        solution: trim(`
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {3, 5, 2};
    int total = 0;
    for (int n : nums) {
        total = total + n;
    }
    std::cout << total << "\\n";
}
`),
        stdout: '10\n',
      },
      sources: [cppref('Range-based for loop', 'language/range-for', 'Explanation')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func main() {
    nums := []int{3, 5, 2}
    total := 0
    for _, n := range nums {
        total = total + n
    }
    fmt.Println(total)
}
`),
        stdout: '10\n',
      },
      note: 'range gives two values per pass, the position and the item; the underscore discards the position because only the item is needed.',
      task: {
        prompt: 'The program should print the sum of the slice, 10. It prints 2. One line is in the wrong place — move it.',
        starter: trim(`
package main

import "fmt"

func main() {
    nums := []int{3, 5, 2}
    total := 0
    for _, n := range nums {
        total = 0
        total = total + n
    }
    fmt.Println(total)
}
`),
        solution: trim(`
package main

import "fmt"

func main() {
    nums := []int{3, 5, 2}
    total := 0
    for _, n := range nums {
        total = total + n
    }
    fmt.Println(total)
}
`),
        stdout: '10\n',
      },
      sources: [gospec('For statements', 'For_statements', 'For statements with range clause')],
    },
  }),
};

// ---------------------------------------------------------------------------
// functions
// ---------------------------------------------------------------------------

const FUNCTIONS: Lesson = {
  id: 'functions-return',
  refresher:
    'return hands the value to the caller; print only shows it. Every problem here is graded on the returned value, so a function that prints the right number and returns nothing is wrong.',
  family: null,
  tags: [],
  skill: 'functions',
  title: 'A function returns a value to whoever called it',
  objective: 'Write a function that returns a value, and use the returned value in a further calculation.',
  prerequisites: ['values', 'comparisons'],
  misconceptions: ['missing_return', 'print_not_return', 'stray_print'],
  explanation:
    'A function is a named piece of code that takes inputs, called parameters, and hands back one result with a return statement. Returning is not the same as printing: printing shows a value on the screen and gives the caller nothing, while returning hands the value to the line that called the function so it can be used in an expression, stored, or passed along. Every problem in this app is graded on what your function returns, so a function that prints the right number and returns nothing is marked wrong.',
  alternate:
    'Think of a function as a helper at a counter. You hand over a number, and the helper hands one back — that is return. A helper who shouts the answer across the room instead of handing it to you has told everyone but given you nothing to carry on with. That is print.',
  trace: [
    { label: 'Define', text: 'twice takes x and returns x times 2. Nothing runs yet.' },
    { label: 'Call', text: 'twice(4) runs the function with x holding 4.' },
    { label: 'Return', text: 'The function computes 8 and hands 8 back to the calling line.' },
    { label: 'Use', text: 'The calling line adds 1 to what came back: 8 + 1 = 9.' },
    { label: 'Print', text: '9' },
  ],
  smaller: {
    description: 'The same function called with 1.',
    trace: [
      { label: 'Call', text: 'twice(1) runs with x holding 1 and returns 2.' },
      { label: 'Use', text: '2 + 1 = 3 is printed.' },
    ],
  },
  check: {
    id: 'functions-value',
    question: 'What does twice(4) + 1 evaluate to?',
    options: ['8', '9', '5', 'It prints 8 and the addition has nothing to add to'],
    answer: 1,
    explanation: 'twice(4) returns 8, and the calling line adds 1. The last option describes what happens when a function prints instead of returning.',
  },
  practiceSkill: 'functions',
  sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#defining-functions', 'Defining Functions: the return statement', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
function twice(x) {
  return x * 2;
}

console.log(twice(4) + 1);
`),
        stdout: '9\n',
      },
      note: 'A function with no return statement returns undefined, and undefined + 1 is NaN — the quiet version of this mistake.',
      task: {
        prompt: 'The function prints instead of returning, so the program shows 8 and then NaN. Make it return, so the program prints 9.',
        starter: trim(`
function twice(x) {
  console.log(x * 2);
}

console.log(twice(4) + 1);
`),
        solution: trim(`
function twice(x) {
  return x * 2;
}

console.log(twice(4) + 1);
`),
        stdout: '9\n',
      },
      sources: [mdn('Functions', 'Guide/Functions', 'Defining functions; calling functions; the return statement')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
function twice(x: number): number {
  return x * 2;
}

console.log(twice(4) + 1);
`),
        stdout: '9\n',
      },
      note: 'The : number after the parameter list is the declared return type. It is stripped before running, so a missing return is only caught if you typecheck separately.',
      task: {
        prompt: 'The function prints instead of returning, so the program shows 8 and then NaN. Make it return, so the program prints 9.',
        starter: trim(`
function twice(x: number): void {
  console.log(x * 2);
}

console.log(twice(4) + 1);
`),
        solution: trim(`
function twice(x: number): number {
  return x * 2;
}

console.log(twice(4) + 1);
`),
        stdout: '9\n',
      },
      sources: [tsdoc('More on Functions', 'https://www.typescriptlang.org/docs/handbook/2/functions.html', 'Return type annotations'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
def twice(x):
    return x * 2


print(twice(4) + 1)
`),
        stdout: '9\n',
      },
      note: 'A Python function with no return statement returns None, and None + 1 is a TypeError.',
      task: {
        prompt: 'The function prints instead of returning, so the program crashes after showing 8. Make it return, so the program prints 9.',
        starter: trim(`
def twice(x):
    print(x * 2)


print(twice(4) + 1)
`),
        solution: trim(`
def twice(x):
    return x * 2


print(twice(4) + 1)
`),
        stdout: '9\n',
      },
      sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#defining-functions', 'Defining Functions: return; functions without return return None')],
    },
    JAVA: {
      example: {
        code: trim(`
public class Main {
    static int twice(int x) {
        return x * 2;
    }

    public static void main(String[] args) {
        System.out.println(twice(4) + 1);
    }
}
`),
        stdout: '9\n',
      },
      note: 'In Java the return type is written before the name: int twice(...) must return an int, and a method declared void cannot be used in an expression at all — the compiler refuses it.',
      task: {
        prompt: 'The method prints instead of returning, so the program does not compile. Give it a return type of int and return the value, so the program prints 9.',
        starter: trim(`
public class Main {
    static void twice(int x) {
        System.out.println(x * 2);
    }

    public static void main(String[] args) {
        System.out.println(twice(4) + 1);
    }
}
`),
        solution: trim(`
public class Main {
    static int twice(int x) {
        return x * 2;
    }

    public static void main(String[] args) {
        System.out.println(twice(4) + 1);
    }
}
`),
        stdout: '9\n',
      },
      sources: [devjava('Defining Methods', 'classes-objects/defining-methods/', 'Defining Methods; Returning a Value from a Method')],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>

int twice(int x) {
    return x * 2;
}

int main() {
    std::cout << twice(4) + 1 << "\\n";
}
`),
        stdout: '9\n',
      },
      note: 'The return type comes first: int twice(int x). A void function cannot be used in an expression, and the compiler says so.',
      task: {
        prompt: 'The function prints instead of returning, so the program does not compile. Give it a return type of int and return the value, so the program prints 9.',
        starter: trim(`
#include <iostream>

void twice(int x) {
    std::cout << x * 2 << "\\n";
}

int main() {
    std::cout << twice(4) + 1 << "\\n";
}
`),
        solution: trim(`
#include <iostream>

int twice(int x) {
    return x * 2;
}

int main() {
    std::cout << twice(4) + 1 << "\\n";
}
`),
        stdout: '9\n',
      },
      sources: [cppref('Function declaration', 'language/function', 'Function declaration — return type'), cppref('return statement', 'language/return', 'Explanation')],
    },
    GO: {
      example: {
        code: trim(`
package main

import "fmt"

func twice(x int) int {
    return x * 2
}

func main() {
    fmt.Println(twice(4) + 1)
}
`),
        stdout: '9\n',
      },
      note: 'Go writes the return type after the parameters: func twice(x int) int. A function with no result cannot be used as a value, and a function that declares a result must return on every path.',
      task: {
        prompt: 'The function prints instead of returning, so the program does not compile. Declare an int result and return the value, so the program prints 9.',
        starter: trim(`
package main

import "fmt"

func twice(x int) {
    fmt.Println(x * 2)
}

func main() {
    fmt.Println(twice(4) + 1)
}
`),
        solution: trim(`
package main

import "fmt"

func twice(x int) int {
    return x * 2
}

func main() {
    fmt.Println(twice(4) + 1)
}
`),
        stdout: '9\n',
      },
      sources: [gospec('Function declarations', 'Function_declarations', 'Function declarations — result parameters'), gospec('Return statements', 'Return_statements', 'Return statements')],
    },
  }),
};

// ---------------------------------------------------------------------------
// combining
// ---------------------------------------------------------------------------

const COMBINING: Lesson = {
  id: 'combining-count-map',
  refresher:
    'Count with a map: look up the current count treating absent as 0, add one, store it back. Storing 1 instead of adding 1 discards earlier sightings; sort the keys before printing because maps promise no order.',
  family: null,
  tags: ['frequency-count', 'hash-set'],
  skill: 'combining',
  title: 'Counting with a map inside a loop',
  objective: 'Count how many times each value appears by updating a map inside a loop, then print the counts in a fixed order.',
  prerequisites: ['loops', 'functions'],
  misconceptions: [],
  explanation:
    'Many problems combine a loop with a place to remember something per value. A map (also called a dictionary or hash map) stores a value under a key. To count occurrences, loop over the items; for each one, look up its current count — treating “not there yet” as 0 — add one, and store it back under that key. The mistake to watch for is storing 1 instead of adding 1, which throws away every earlier sighting. Maps do not promise an order, so to print the counts predictably the keys are sorted first.',
  alternate:
    'A tally sheet. Each different word gets its own row; each time you see a word, you find its row and add a stroke. If you rubbed the row out and drew one stroke every time, every word would end on one. The map is the sheet, the key is the row label, and the count is the strokes.',
  trace: [
    { label: 'Before the loop', text: 'counts is empty. words holds a, b, a.' },
    { label: 'Pass 1', text: 'The item is a. It is not in counts, so its count is taken as 0; 0 + 1 = 1 is stored under a.' },
    { label: 'Pass 2', text: 'The item is b. Not there: stored as 1 under b.' },
    { label: 'Pass 3', text: 'The item is a. Its count is 1; 1 + 1 = 2 is stored under a.' },
    { label: 'Print', text: 'Keys sorted: a then b. Output is a 2 and b 1 on two lines.' },
  ],
  smaller: {
    description: 'The same over a single word, [a].',
    trace: [
      { label: 'Pass 1', text: 'a is not in counts; 1 is stored under a.' },
      { label: 'Print', text: 'a 1' },
    ],
  },
  check: {
    id: 'combining-count-a',
    question: 'After the loop over a, b, a, what is stored under a?',
    options: ['1', '2', '3', 'Nothing — a was replaced by b'],
    answer: 1,
    explanation: 'a is seen on pass 1 (count becomes 1) and again on pass 3 (1 + 1 = 2). Storing 1 each time instead of adding would have left it at 1.',
  },
  practiceSkill: 'combining',
  sources: [
    py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#dictionaries', 'Dictionaries', 'concept'),
    src('MIT OpenCourseWare', '6.006 Introduction to Algorithms, Spring 2020', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', 'Lecture 4: Hashing', 'concept'),
  ],
  variants: variants({
    JAVASCRIPT: {
      example: {
        code: trim(`
const words = ["a", "b", "a"];
const counts = new Map();
for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'get on a missing key gives undefined; ?? 0 turns that into 0 before adding.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
const words = ["a", "b", "a"];
const counts = new Map();
for (const w of words) {
  counts.set(w, 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        solution: trim(`
const words = ["a", "b", "a"];
const counts = new Map();
for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [mdn('Keyed collections', 'Guide/Keyed_collections', 'Map object'), mdn('Nullish coalescing operator (??)', 'Reference/Operators/Nullish_coalescing', 'Description')],
    },
    TYPESCRIPT: {
      example: {
        code: trim(`
const words: string[] = ["a", "b", "a"];
const counts = new Map<string, number>();
for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'Map<string, number> names the key and value types; the checker would refuse a non-number value, but only when you typecheck.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
const words: string[] = ["a", "b", "a"];
const counts = new Map<string, number>();
for (const w of words) {
  counts.set(w, 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        solution: trim(`
const words: string[] = ["a", "b", "a"];
const counts = new Map<string, number>();
for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}
for (const key of [...counts.keys()].sort()) {
  console.log(key, counts.get(key));
}
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [mdn('Keyed collections', 'Guide/Keyed_collections', 'Map object'), nodeTs],
    },
    PYTHON: {
      example: {
        code: trim(`
words = ["a", "b", "a"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
for key in sorted(counts):
    print(key, counts[key])
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'counts.get(w, 0) reads the count or gives 0 when the key is not there; counts[w] alone would raise KeyError on the first sighting.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
words = ["a", "b", "a"]
counts = {}
for w in words:
    counts[w] = 1
for key in sorted(counts):
    print(key, counts[key])
`),
        solution: trim(`
words = ["a", "b", "a"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
for key in sorted(counts):
    print(key, counts[key])
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#dictionaries', 'Dictionaries'), py('Built-in Types', 'library/stdtypes.html#dict.get', 'dict.get(key, default)')],
    },
    JAVA: {
      example: {
        code: trim(`
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String[] words = {"a", "b", "a"};
        Map<String, Integer> counts = new TreeMap<>();
        for (String w : words) {
            counts.put(w, counts.getOrDefault(w, 0) + 1);
        }
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            System.out.println(e.getKey() + " " + e.getValue());
        }
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'A TreeMap keeps its keys sorted, which is why no separate sort is needed here. A HashMap would count the same but print in no promised order.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String[] words = {"a", "b", "a"};
        Map<String, Integer> counts = new TreeMap<>();
        for (String w : words) {
            counts.put(w, 1);
        }
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            System.out.println(e.getKey() + " " + e.getValue());
        }
    }
}
`),
        solution: trim(`
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String[] words = {"a", "b", "a"};
        Map<String, Integer> counts = new TreeMap<>();
        for (String w : words) {
            counts.put(w, counts.getOrDefault(w, 0) + 1);
        }
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            System.out.println(e.getKey() + " " + e.getValue());
        }
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [devjava('Using Maps to Store Key Value Pairs', 'api/collections-framework/maps/', 'Introducing the Map Interface; getOrDefault'), src('Oracle', 'Java SE 21 API — TreeMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html', 'Class description — sorted according to the natural ordering of its keys', JAVA)],
    },
    CPP: {
      example: {
        code: trim(`
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words = {"a", "b", "a"};
    std::map<std::string, int> counts;
    for (const std::string& w : words) {
        counts[w] = counts[w] + 1;
    }
    for (const auto& [key, n] : counts) {
        std::cout << key << " " << n << "\\n";
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'std::map keeps keys sorted, and counts[w] on a missing key inserts it with the value 0 before reading, so the first sighting becomes 0 + 1 with no special case.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words = {"a", "b", "a"};
    std::map<std::string, int> counts;
    for (const std::string& w : words) {
        counts[w] = 1;
    }
    for (const auto& [key, n] : counts) {
        std::cout << key << " " << n << "\\n";
    }
}
`),
        solution: trim(`
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words = {"a", "b", "a"};
    std::map<std::string, int> counts;
    for (const std::string& w : words) {
        counts[w] = counts[w] + 1;
    }
    for (const auto& [key, n] : counts) {
        std::cout << key << " " << n << "\\n";
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [cppref('std::map', 'container/map', 'Class description — sorted by key; operator[] inserts a value-initialized element'), cppref('Structured binding declaration', 'language/structured_binding', 'Explanation')],
    },
    GO: {
      example: {
        code: trim(`
package main

import (
    "fmt"
    "sort"
)

func main() {
    words := []string{"a", "b", "a"}
    counts := map[string]int{}
    for _, w := range words {
        counts[w] = counts[w] + 1
    }
    keys := []string{}
    for k := range counts {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    for _, k := range keys {
        fmt.Println(k, counts[k])
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      note: 'Reading a missing key from a Go map gives the zero value, 0 for int, so the first sighting is 0 + 1. Iteration order over a map is deliberately unspecified, which is why the keys are collected and sorted.',
      task: {
        prompt: 'Each word should be counted every time it appears. The program stores 1 instead of adding 1, so a is counted once. Fix the update.',
        starter: trim(`
package main

import (
    "fmt"
    "sort"
)

func main() {
    words := []string{"a", "b", "a"}
    counts := map[string]int{}
    for _, w := range words {
        counts[w] = 1
    }
    keys := []string{}
    for k := range counts {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    for _, k := range keys {
        fmt.Println(k, counts[k])
    }
}
`),
        solution: trim(`
package main

import (
    "fmt"
    "sort"
)

func main() {
    words := []string{"a", "b", "a"}
    counts := map[string]int{}
    for _, w := range words {
        counts[w] = counts[w] + 1
    }
    keys := []string{}
    for k := range counts {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    for _, k := range keys {
        fmt.Println(k, counts[k])
    }
}
`),
        stdout: 'a 2\nb 1\n',
      },
      sources: [goblog('Go maps in action', 'maps', 'Working with maps — zero value on missing key; Iteration order'), gospec('For statements', 'For_statements', 'For statements with range clause — iteration order over maps is not specified')],
    },
  }),
};

/** Teaching order, which is also the tie-break order for the recommender. */
export const LESSONS: readonly Lesson[] = [VALUES, COMPARISONS, STRINGS, INDEXING, LISTS, LOOPS, FUNCTIONS, COMBINING];
