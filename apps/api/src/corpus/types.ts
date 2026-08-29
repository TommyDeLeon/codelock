/**
 * Vocabulary for the I/O signature registry.
 *
 * The whole point of Phase 2: 695 problems authored naively is 695 hand-written
 * harnesses in six languages, and the project dies under its own weight. Authored
 * by *signature* it is a couple of dozen — because almost every problem in the
 * corpus is one of a small number of shapes: "takes an int array, returns an
 * int", "takes a tree, returns an int array".
 *
 * So a problem does not carry a driver. It carries a `signatureId`, and the
 * driver is generated from the signature. Drivers are still *stored* on the row
 * (grading.ts reads `problem.driverCode`), but they are generated, never typed.
 */

/** Languages the judge runs. Mirrors the Prisma `Language` enum. */
export const LANGUAGES = ['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO'] as const;
export type Lang = (typeof LANGUAGES)[number];

/**
 * The types a solution can take or return.
 *
 * Deliberately small. Every addition costs six codec implementations, so a type
 * earns its place by being needed across a whole pattern family, not by one
 * problem finding it convenient.
 *
 * `tree` is a binary tree given in level order with `null` for absent children.
 * `list` is a singly linked list given as its values in order. Both arrive as
 * one line of text and are materialised into nodes by the driver, so the user
 * writes `solve(root)` and never parses anything.
 */
export type ValueType =
  | 'int'
  | 'double'
  | 'bool'
  | 'string'
  | 'int[]'
  | 'string[]'
  | 'int[][]'
  | 'tree'
  | 'list'
  | 'void';

/**
 * A free-function signature: `solve(params...) -> returns`.
 *
 * Wire format is one parameter per stdin line, in order. Within a line:
 * scalars bare, 1-D arrays space-separated, 2-D arrays space-separated within a
 * row and `;` between rows. Output is a single line in the same encoding.
 *
 * Chosen over JSON because a driver has to parse it in C++ and Go without
 * pulling in a JSON library, and because a test case a human can read is a test
 * case a human can debug.
 */
export interface FunctionSignature {
  kind: 'function';
  id: string;
  /** One line, for the registry table in the docs. */
  description: string;
  params: readonly ValueType[];
  returns: ValueType;
}

/** One method on a Tier 0.5 class, as the operation-log driver needs to see it. */
export interface OpMethod {
  name: string;
  params: readonly ValueType[];
  /** `void` methods report `null`, matching the shape of the canonical logs. */
  returns: ValueType;
}

/**
 * A class signature — the Tier 0.5 shape.
 *
 * This is the only driver that instantiates a user-defined class rather than
 * calling a free function, and it alone unlocks all ~55 "implement the data
 * structure" problems. The user writes `class LRUCache { ... }`; the driver
 * constructs it and replays a command list against it, comparing per operation.
 *
 * Note what is *not* here: reflection. Java and Go could reflect over method
 * names; C++ cannot, and a driver that works in five languages and not the
 * sixth quietly excludes C++ users from an entire tier. So the method table is
 * declared here and the dispatch is *generated* — an explicit `if (op == "put")`
 * chain per language. Same mechanism in all six.
 */
export interface ClassSignature {
  kind: 'class';
  id: string;
  description: string;
  className: string;
  ctorParams: readonly ValueType[];
  methods: readonly OpMethod[];
}

export type Signature = FunctionSignature | ClassSignature;

/** Generated per-language source, keyed the way `Problem.driverCode` is. */
export type PerLanguage = Record<Lang, string>;
