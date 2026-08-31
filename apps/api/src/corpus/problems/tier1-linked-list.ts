import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Linked List.
 *
 * A child of Two Pointers on the roadmap and a parent of Trees, so this family
 * unblocks a large part of the graph. Every statement here is written from the
 * task rather than from anyone's prose — see the non-negotiable at the top of
 * docs/AUTHORING.md.
 *
 * The `list` signatures already exist in the registry, so these problems are
 * genuine linked-list problems: the driver builds the nodes from a line of
 * numbers and prints the chain that comes back. The one exception is
 * `has-a-cycle`, which cannot use `fn:list->bool` because the driver's list
 * parser can only build an acyclic chain — that problem hands the solver the
 * next-pointers as indices instead, which is the same graph in a form the wire
 * format can carry.
 *
 * The through-line across the nine: a linked list gives you no random access,
 * so every answer has to come from pointers that walk. Two pointers with a
 * fixed gap turn "count from the end" into one pass; two pointers at different
 * speeds turn "find the middle" and "is there a cycle" into one pass; and a
 * dummy node in front of the head turns "the head is special" into "the head is
 * not special", which is where most of these problems actually go wrong.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'LINKED_LIST',
  provenance: AUTHORED,
} as const;

export const TIER_1_LINKED_LIST_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'reverse-a-sequence',
    title: 'Point Every Arrow Backwards',
    difficulty: 'EASY',
    patternTags: ['linked-list', 'pointer-reversal', 'in-place'],
    signatureId: 'fn:list->list',
    avgSolveSeconds: 420,
    promptMarkdown: [
      'You are given a chain of nodes, each holding a number and a pointer to the',
      'next node. Return the chain with the order of its numbers reversed.',
      '',
      'Reverse it by re-pointing the existing nodes, not by copying the numbers',
      'into an array and building a new chain — re-pointing is the exercise.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 4 5',
      'output: 5 4 3 2 1',
      '```',
      '',
      'The chain always has at least one node. A single-node chain comes back',
      'unchanged, and so does a chain whose numbers are all equal.',
    ].join('\n'),
    editorialMarkdown: [
      '## Pointer reversal, one node at a time',
      '',
      'Walk the chain with three names in play: the node you are on, the node',
      'behind you, and the node in front of you.',
      '',
      '```',
      'prev = null',
      'cur  = head',
      'while cur != null:',
      '    next = cur.next     # save the rest of the chain FIRST',
      '    cur.next = prev     # flip this one arrow',
      '    prev = cur',
      '    cur  = next',
      'return prev',
      '```',
      '',
      'Why this is correct: the invariant at the top of every iteration is that',
      '`prev` is the head of a fully reversed chain containing every node you have',
      'already passed, and `cur` is the head of the untouched remainder. Flipping',
      'one arrow moves exactly one node from the second group to the first, and the',
      'two groups always partition the original nodes. When `cur` runs off the end',
      'the untouched remainder is empty, so `prev` is the whole list, reversed.',
      '',
      'The quiet mistake is the ordering of those two assignments. Writing',
      '`cur.next = prev` before saving `cur.next` destroys the only pointer that',
      'reaches the rest of the chain, and the walk terminates one node later with',
      'everything after `cur` silently lost. It is quiet because it does not crash:',
      'you get back a short list, and on a one- or two-node input you get back the',
      'correct answer, so it survives the examples you are most likely to try by',
      'hand. Save `next` first, always.',
      '',
      'O(n) time — every node is visited once and its pointer written once — and',
      'O(1) extra space, which is what re-pointing buys you over collecting the',
      'values into an array. The space is bounded by the three pointers, not by n.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  let prev = null;
  let cur = a;
  while (cur !== null) {
    const nxt = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let cur: ListNode | null = a;
  while (cur !== null) {
    const nxt: ListNode | null = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}`,
      PYTHON: `def solve(a):
    prev = None
    cur = a
    while cur is not None:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`,
      JAVA: `    static ListNode solve(ListNode a) {
        ListNode prev = null;
        ListNode cur = a;
        while (cur != null) {
            ListNode nxt = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }`,
      CPP: `ListNode* solve(ListNode* a) {
    ListNode* prev = nullptr;
    ListNode* cur = a;
    while (cur != nullptr) {
        ListNode* nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
    }
    return prev;
}`,
      GO: `func solve(a *ListNode) *ListNode {
	var prev *ListNode
	cur := a
	for cur != nil {
		nxt := cur.Next
		cur.Next = prev
		prev = cur
		cur = nxt
	}
	return prev
}`,
    },
    tests: [
      { stdin: '1 2 3 4 5', expectedStdout: '5 4 3 2 1', isSample: true },
      { stdin: '1 2', expectedStdout: '2 1', isSample: true },
      { stdin: '7', expectedStdout: '7' },
      { stdin: '-3 -1 4', expectedStdout: '4 -1 -3' },
      { stdin: '5 5 5', expectedStdout: '5 5 5' },
      { stdin: '10 20 30 40', expectedStdout: '40 30 20 10' },
    ],
  }),

  p({
    ...base,
    slug: 'middle-of-sequence',
    title: 'Stop Halfway',
    difficulty: 'EASY',
    patternTags: ['linked-list', 'fast-slow-pointers', 'one-pass'],
    signatureId: 'fn:list->int',
    avgSolveSeconds: 420,
    promptMarkdown: [
      'You are given a chain of nodes, each holding a number and a pointer to the',
      'next node. Return the number stored in the middle node.',
      '',
      'When the chain has an even number of nodes there are two middles; return the',
      '**second** of them.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 4 5',
      'output: 3',
      '',
      'input:  1 2 3 4 5 6',
      'output: 4',
      '```',
      '',
      'The chain always has at least one node. A single-node chain is its own',
      'middle, so the answer is that node’s number.',
      '',
      'You are not told the length in advance, and you should not need two passes',
      'to find it.',
    ].join('\n'),
    editorialMarkdown: [
      '## Fast and slow pointers',
      '',
      'The obvious solution walks the chain once to count the nodes, then walks it',
      'again to node `n / 2`. That is correct and it is two passes. One pass is',
      'available, and it is the reason this pattern is worth learning.',
      '',
      'Start two pointers at the head. Move `slow` one node per step and `fast` two',
      'nodes per step.',
      '',
      '```',
      'slow = fast = head',
      'while fast != null and fast.next != null:',
      '    slow = slow.next',
      '    fast = fast.next.next',
      'return slow.val',
      '```',
      '',
      'Why the gap gives the answer: after `k` steps, `slow` has covered `k` nodes',
      'and `fast` has covered `2k`. The loop stops as soon as `fast` cannot take a',
      'full double step, which happens the moment `2k` reaches the end of the',
      'chain — that is, when `k` is about half the length. `slow` is therefore',
      'sitting at the halfway mark without anyone ever having counted. The one',
      'pointer measures the list while the other one indexes into it.',
      '',
      'The quiet mistake is the loop condition, and it decides which of the two',
      'middles you get on an even-length chain. `while fast != null and fast.next',
      '!= null` lands on the second middle; `while fast.next != null and',
      'fast.next.next != null` lands on the first. Both look reasonable and neither',
      'is wrong in general — but only one matches what the statement asked for, and',
      'on odd lengths they agree, so a test set of odd-length lists will not tell',
      'you which one you wrote. Check the order of the two guards too: testing',
      '`fast.next` before `fast` dereferences null on an even-length chain.',
      '',
      'O(n) time, bounded by the fast pointer’s single traversal, and O(1) extra',
      'space — two pointers, whatever the length.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  let slow = a;
  let fast = a;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.val;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null): number {
  let slow: ListNode = a as ListNode;
  let fast: ListNode | null = a;
  while (fast !== null && fast.next !== null) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  return slow.val;
}`,
      PYTHON: `def solve(a):
    slow = a
    fast = a
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow.val`,
      JAVA: `    static int solve(ListNode a) {
        ListNode slow = a;
        ListNode fast = a;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow.val;
    }`,
      CPP: `int solve(ListNode* a) {
    ListNode* slow = a;
    ListNode* fast = a;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow->val;
}`,
      GO: `func solve(a *ListNode) int {
	slow := a
	fast := a
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	return slow.Val
}`,
    },
    tests: [
      { stdin: '1 2 3 4 5', expectedStdout: '3', isSample: true },
      { stdin: '1 2 3 4 5 6', expectedStdout: '4', isSample: true },
      { stdin: '9', expectedStdout: '9' },
      { stdin: '1 2', expectedStdout: '2' },
      { stdin: '4 8 15 16 23 42', expectedStdout: '16' },
      { stdin: '-1 -2 -3', expectedStdout: '-2' },
    ],
  }),

  p({
    ...base,
    slug: 'last-n-of-the-chain',
    title: 'Counting Backwards In One Pass',
    difficulty: 'MEDIUM',
    patternTags: ['linked-list', 'two-pointers', 'fixed-gap', 'one-pass'],
    signatureId: 'fn:list,int->list',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a chain of nodes and a number `n`. Return the final `n` nodes',
      'of the chain — everything from the node that is `n` positions from the end',
      'onwards.',
      '',
      '`n = 1` means just the last node, `n = 2` the last two, and so on.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 4 5',
      '        2',
      'output: 4 5',
      '```',
      '',
      'The second node from the end of `1 2 3 4 5` holds `4`, so the last two',
      'nodes are `4 5`.',
      '',
      'Guarantees you may rely on: the chain has at least one node, and `n` is',
      'between `1` and the length of the chain inclusive. When `n` equals the',
      'length the answer is the whole chain — that case is in the tests, so make',
      'sure your walk can reach the first node.',
      '',
      'You cannot index into a chain, and you should not need two passes.',
    ].join('\n'),
    editorialMarkdown: [
      '## Two pointers held a fixed distance apart',
      '',
      'A chain has no length you can ask for, so "n from the end" looks like it',
      'needs a counting pass followed by a walking pass. It does not. Freeze the',
      'distance between two pointers instead.',
      '',
      '```',
      'lead = head',
      'repeat n times: lead = lead.next',
      'trail = head',
      'while lead != null:',
      '    lead  = lead.next',
      '    trail = trail.next',
      'return trail',
      '```',
      '',
      'Why the gap gives the answer: after the first loop, `lead` is exactly `n`',
      'nodes ahead of `trail`. The second loop advances both by the same amount, so',
      'that gap of `n` never changes. The loop ends when `lead` has fallen off the',
      'end — it is one past the last node — and since `trail` is `n` behind a',
      'position that is one past the end, `trail` is sitting on the node that is `n`',
      'from the end. The gap is doing the counting, and nothing was counted.',
      '',
      'Returning `trail` itself rather than its value costs nothing extra: the',
      'node already points at everything that follows it, so the suffix is simply',
      'the node you landed on.',
      '',
      'The quiet mistake is the off-by-one, and it is exactly the case where `n`',
      'equals the length. Advance `lead` `n` times and it lands on null precisely',
      'then, which is fine — the second loop simply does not run and `trail` stays',
      'on the head, so the whole chain comes back, which is right. But advance `lead` `n` times and then write',
      'the second loop as `while lead.next != null`, and that same case dereferences',
      'null and crashes; write `repeat n - 1 times` and every answer shifts by one.',
      'Both variants are correct on a long chain with a small `n`, which is the',
      'shape of every example anyone tries first. Trace `n = length` on paper before',
      'you submit.',
      '',
      'O(n) time — `lead` traverses the chain once and `trail` covers a suffix of',
      'it — and O(1) extra space, bounded by the two pointers.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, b) {
  let lead = a;
  for (let i = 0; i < b; i++) lead = lead.next;
  let trail = a;
  while (lead !== null) {
    lead = lead.next;
    trail = trail.next;
  }
  return trail;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null, b: number): ListNode | null {
  let lead: ListNode | null = a;
  for (let i = 0; i < b; i++) lead = (lead as ListNode).next;
  let trail: ListNode = a as ListNode;
  while (lead !== null) {
    lead = lead.next;
    trail = trail.next as ListNode;
  }
  return trail;
}`,
      PYTHON: `def solve(a, b):
    lead = a
    for _ in range(b):
        lead = lead.next
    trail = a
    while lead is not None:
        lead = lead.next
        trail = trail.next
    return trail`,
      JAVA: `    static ListNode solve(ListNode a, int b) {
        ListNode lead = a;
        for (int i = 0; i < b; i++) lead = lead.next;
        ListNode trail = a;
        while (lead != null) {
            lead = lead.next;
            trail = trail.next;
        }
        return trail;
    }`,
      CPP: `ListNode* solve(ListNode* a, int b) {
    ListNode* lead = a;
    for (int i = 0; i < b; i++) lead = lead->next;
    ListNode* trail = a;
    while (lead != nullptr) {
        lead = lead->next;
        trail = trail->next;
    }
    return trail;
}`,
      GO: `func solve(a *ListNode, b int) *ListNode {
	lead := a
	for i := 0; i < b; i++ {
		lead = lead.Next
	}
	trail := a
	for lead != nil {
		lead = lead.Next
		trail = trail.Next
	}
	return trail
}`,
    },
    tests: [
      { stdin: '1 2 3 4 5\n2', expectedStdout: '4 5', isSample: true },
      { stdin: '10 20 30\n3', expectedStdout: '10 20 30', isSample: true },
      { stdin: '7\n1', expectedStdout: '7' },
      { stdin: '1 2 3 4 5\n1', expectedStdout: '5' },
      { stdin: '5 4 3 2 1\n5', expectedStdout: '5 4 3 2 1' },
      { stdin: '-1 -2 -3 -4\n2', expectedStdout: '-3 -4' },
    ],
  }),

  p({
    ...base,
    slug: 'has-a-cycle',
    title: 'Does The Trail Loop Back',
    difficulty: 'MEDIUM',
    patternTags: ['linked-list', 'fast-slow-pointers', 'cycle-detection'],
    signatureId: 'fn:ints->bool',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a list of next-pointers written as indices. Position `i` points',
      'at position `a[i]`, and the value `-1` means "nothing follows".',
      '',
      'Start at position `0` and keep following the pointers. Decide whether you',
      'ever arrive at a position you have already stood on. Print `true` if you do',
      'and `false` if the trail runs off the end at some `-1`.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 1',
      'output: true',
      '```',
      '',
      'The trail is `0 -> 1 -> 2 -> 3 -> 1`, and position `1` comes round again.',
      '',
      '```',
      'input:  1 2 3 -1',
      'output: false',
      '```',
      '',
      'Guarantees you may rely on: there is at least one position, and every value',
      'is either `-1` or a valid index into the list. A single position pointing at',
      'itself (`0`) is a cycle, and a single position holding `-1` is not — both of',
      'those are in the tests.',
      '',
      'Solve it in constant extra space: no set of visited positions.',
    ].join('\n'),
    editorialMarkdown: [
      '## Floyd’s cycle detection — the tortoise and the hare',
      '',
      'The easy solution keeps a set of positions already visited and stops when it',
      'sees a repeat. That is O(n) time and O(n) memory. Floyd gets the same answer',
      'in O(1) memory, and the reason it works is worth having.',
      '',
      'Run two walkers from position `0`. The slow one takes one step per round; the',
      'fast one takes two. If either walker steps onto `-1`, the trail ends and the',
      'answer is `false`. If they ever stand on the same position, the answer is',
      '`true`.',
      '',
      '```',
      'slow = fast = 0',
      'loop:',
      '    fast = step(fast); if fast < 0: return false',
      '    fast = step(fast); if fast < 0: return false',
      '    slow = step(slow)',
      '    if slow == fast: return true',
      '```',
      '',
      'Why the two pointers *must* meet inside a cycle: once both walkers are inside',
      'the loop, look at the distance from the fast one round to the slow one,',
      'measured forwards along the cycle. Each round the fast walker gains exactly',
      'one position on the slow one, so that distance shrinks by exactly one every',
      'round. A quantity that is a non-negative integer and strictly decreases by',
      'one each round must reach zero, and distance zero means they are standing on',
      'the same position. It cannot be stepped over, because the gap changes by one,',
      'never by two — that is precisely why the speeds are 1 and 2 and not 1 and 3.',
      'And if there is no cycle, the fast walker reaches a `-1` first, because it is',
      'always ahead.',
      '',
      'The quiet mistake is checking `slow == fast` before taking any steps. Both',
      'start at position `0`, so that test fires immediately and every input comes',
      'back `true` — including the `-1` case, which is why it is quiet: the code',
      'looks like textbook Floyd and passes every input that genuinely has a cycle.',
      'Move first, compare second. The other quiet one is checking the fast',
      'walker’s `-1` only after both of its steps, which follows a pointer out of',
      'a position that had already ended.',
      '',
      'O(n) time — the slow walker enters the cycle after at most n steps and then',
      'closes a gap of at most the cycle length, so the total is bounded by a',
      'constant times n — and O(1) extra space, bounded by the two indices.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  let slow = 0;
  let fast = 0;
  while (true) {
    fast = fast < 0 ? -1 : a[fast];
    if (fast < 0) return false;
    fast = fast < 0 ? -1 : a[fast];
    if (fast < 0) return false;
    slow = a[slow];
    if (slow === fast) return true;
  }
}`,
      TYPESCRIPT: `function solve(a: number[]): boolean {
  let slow = 0;
  let fast = 0;
  while (true) {
    fast = a[fast];
    if (fast < 0) return false;
    fast = a[fast];
    if (fast < 0) return false;
    slow = a[slow];
    if (slow === fast) return true;
  }
}`,
      PYTHON: `def solve(a):
    slow = 0
    fast = 0
    while True:
        fast = a[fast]
        if fast < 0:
            return False
        fast = a[fast]
        if fast < 0:
            return False
        slow = a[slow]
        if slow == fast:
            return True`,
      JAVA: `    static boolean solve(int[] a) {
        int slow = 0;
        int fast = 0;
        while (true) {
            fast = a[fast];
            if (fast < 0) return false;
            fast = a[fast];
            if (fast < 0) return false;
            slow = a[slow];
            if (slow == fast) return true;
        }
    }`,
      CPP: `bool solve(vector<int> a) {
    int slow = 0;
    int fast = 0;
    while (true) {
        fast = a[fast];
        if (fast < 0) return false;
        fast = a[fast];
        if (fast < 0) return false;
        slow = a[slow];
        if (slow == fast) return true;
    }
}`,
      GO: `func solve(a []int) bool {
	slow := 0
	fast := 0
	for {
		fast = a[fast]
		if fast < 0 {
			return false
		}
		fast = a[fast]
		if fast < 0 {
			return false
		}
		slow = a[slow]
		if slow == fast {
			return true
		}
	}
}`,
    },
    tests: [
      { stdin: '1 2 3 1', expectedStdout: 'true', isSample: true },
      { stdin: '1 2 3 -1', expectedStdout: 'false', isSample: true },
      { stdin: '0', expectedStdout: 'true' },
      { stdin: '-1', expectedStdout: 'false' },
      { stdin: '1 2 3 4 2', expectedStdout: 'true' },
      { stdin: '3 -1 -1 1', expectedStdout: 'false' },
    ],
  }),

  p({
    ...base,
    slug: 'merge-two-ordered-sequences',
    title: 'Zip Two Sorted Chains Together',
    difficulty: 'MEDIUM',
    patternTags: ['linked-list', 'two-pointers', 'merge', 'dummy-head'],
    signatureId: 'fn:list,list->list',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given two chains of nodes, each already sorted in non-decreasing',
      'order. Return one chain containing all of the nodes, also sorted in',
      'non-decreasing order.',
      '',
      'Build the result by re-pointing the nodes you were given rather than by',
      'concatenating and sorting.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 3 5',
      '        2 4 6',
      'output: 1 2 3 4 5 6',
      '```',
      '',
      'Either chain may be **empty**, which on the wire is an empty line. If one is',
      'empty the answer is the other one; if both are empty the answer is empty,',
      'which prints as an empty line. Both of those are in the tests.',
      '',
      'Duplicate numbers may appear, including the same number in both chains.',
    ].join('\n'),
    editorialMarkdown: [
      '## Two pointers and a dummy head',
      '',
      'Walk both chains at once. At each step look at the two front nodes and detach',
      'the smaller one, appending it to the result. When one chain runs out, the',
      'other is already sorted and already linked, so it can be attached whole.',
      '',
      '```',
      'dummy = new Node(0); tail = dummy',
      'while x != null and y != null:',
      '    if x.val <= y.val: tail.next = x; x = x.next',
      '    else:              tail.next = y; y = y.next',
      '    tail = tail.next',
      'tail.next = (x != null) ? x : y',
      'return dummy.next',
      '```',
      '',
      'Why the greedy choice is safe: both inputs are sorted, so the smallest number',
      'remaining anywhere is one of the two front nodes. Taking that one can never',
      'strand a smaller number behind it, because everything behind a front node is',
      'at least as large. Repeat the argument on what is left and the whole output',
      'comes out ordered.',
      '',
      'The dummy head is not decoration. Without it, the first append is a special',
      'case — you have no `tail` to write through until you have chosen the result',
      'head — and that special case is where the empty-input bugs live. With a dummy',
      'in front, the head is not special: every append is `tail.next = node`, and',
      'the answer is `dummy.next`, which is correctly `null` when nothing was ever',
      'appended.',
      '',
      'The quiet mistake is forgetting the final `tail.next = leftovers`. The loop',
      'exits the moment one chain empties, and the other chain’s remaining nodes',
      'are still hanging off whatever they pointed at before — usually correct by',
      'accident, because the last node you appended from that chain still points at',
      'them. It is correct by accident until it is not: the case where a chain is',
      'empty from the start, or where the loop ends with the *other* chain having',
      'the leftovers, produces truncated output. Attach the remainder explicitly.',
      'The second quiet one is using `<` instead of `<=`: it still sorts correctly,',
      'but it reverses the relative order of equal values, which matters the moment',
      'a merge has to be stable.',
      '',
      'O(m + n) time — every node is looked at once and re-pointed once — and O(1)',
      'extra space beyond the dummy node, since no new nodes are allocated for the',
      'values themselves.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  let x = a;
  let y = b;
  while (x !== null && y !== null) {
    if (x.val <= y.val) {
      tail.next = x;
      x = x.next;
    } else {
      tail.next = y;
      y = y.next;
    }
    tail = tail.next;
  }
  tail.next = x !== null ? x : y;
  return dummy.next;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy: ListNode = new (ListNode as any)(0);
  let tail: ListNode = dummy;
  let x: ListNode | null = a;
  let y: ListNode | null = b;
  while (x !== null && y !== null) {
    if (x.val <= y.val) {
      tail.next = x;
      x = x.next;
    } else {
      tail.next = y;
      y = y.next;
    }
    tail = tail.next as ListNode;
  }
  tail.next = x !== null ? x : y;
  return dummy.next;
}`,
      PYTHON: `def solve(a, b):
    dummy = ListNode(0)
    tail = dummy
    x = a
    y = b
    while x is not None and y is not None:
        if x.val <= y.val:
            tail.next = x
            x = x.next
        else:
            tail.next = y
            y = y.next
        tail = tail.next
    tail.next = x if x is not None else y
    return dummy.next`,
      JAVA: `    static ListNode solve(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        ListNode x = a;
        ListNode y = b;
        while (x != null && y != null) {
            if (x.val <= y.val) {
                tail.next = x;
                x = x.next;
            } else {
                tail.next = y;
                y = y.next;
            }
            tail = tail.next;
        }
        tail.next = (x != null) ? x : y;
        return dummy.next;
    }`,
      CPP: `ListNode* solve(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    ListNode* x = a;
    ListNode* y = b;
    while (x != nullptr && y != nullptr) {
        if (x->val <= y->val) {
            tail->next = x;
            x = x->next;
        } else {
            tail->next = y;
            y = y->next;
        }
        tail = tail->next;
    }
    tail->next = (x != nullptr) ? x : y;
    return dummy.next;
}`,
      GO: `func solve(a *ListNode, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	x := a
	y := b
	for x != nil && y != nil {
		if x.Val <= y.Val {
			tail.Next = x
			x = x.Next
		} else {
			tail.Next = y
			y = y.Next
		}
		tail = tail.Next
	}
	if x != nil {
		tail.Next = x
	} else {
		tail.Next = y
	}
	return dummy.Next
}`,
    },
    tests: [
      { stdin: '1 3 5\n2 4 6', expectedStdout: '1 2 3 4 5 6', isSample: true },
      { stdin: '1 2 3\n', expectedStdout: '1 2 3', isSample: true },
      { stdin: '\n', expectedStdout: '' },
      { stdin: '1 1 2\n1 3', expectedStdout: '1 1 1 2 3' },
      { stdin: '5\n1 2 3', expectedStdout: '1 2 3 5' },
      { stdin: '-5 0\n-3 7', expectedStdout: '-5 -3 0 7' },
    ],
  }),

  p({
    ...base,
    slug: 'remove-nth-from-end',
    title: 'Cut Out The Node You Counted Backwards To',
    difficulty: 'MEDIUM',
    patternTags: ['linked-list', 'two-pointers', 'fixed-gap', 'dummy-head'],
    signatureId: 'fn:list,int->list',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a chain of nodes and a number `n`. Remove the node that is `n`',
      'positions from the end and return what remains.',
      '',
      '`n = 1` is the last node, `n = 2` the one before it, and so on.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 4 5',
      '        2',
      'output: 1 2 3 5',
      '```',
      '',
      'The second node from the end holds `4`, so `4` is what disappears.',
      '',
      'Guarantees you may rely on: the chain has at least one node, and `n` is',
      'between `1` and the length inclusive. Two cases are in the tests and neither',
      'is a trick: when `n` equals the length you are removing the **first** node,',
      'and when the chain has one node the answer is **empty**, which prints as an',
      'empty line.',
      '',
      'Do it in one pass.',
    ].join('\n'),
    editorialMarkdown: [
      '## A fixed gap, plus a dummy head so the first node is not special',
      '',
      'To unlink a node from a singly linked chain you need its **predecessor**, not',
      'the node itself — you have to write `prev.next = prev.next.next`. So the',
      'target of the walk is the node `n + 1` from the end.',
      '',
      'Put a dummy node in front of the head, then hold two pointers a fixed `n`',
      'apart, exactly as in the one-pass "nth from the end" walk:',
      '',
      '```',
      'dummy = new Node(0, head)',
      'lead = dummy',
      'repeat n times: lead = lead.next',
      'trail = dummy',
      'while lead.next != null:',
      '    lead  = lead.next',
      '    trail = trail.next',
      'trail.next = trail.next.next',
      'return dummy.next',
      '```',
      '',
      'Why the gap gives the answer: `lead` stays `n` ahead of `trail` because both',
      'advance together. The loop stops with `lead` **on** the last node, so `trail`',
      'is `n` behind the last node — which is the predecessor of the node that is',
      '`n` from the end. Re-pointing that predecessor past its successor removes',
      'exactly the right node.',
      '',
      'The dummy is what makes `n = length` work. Without it there is no predecessor',
      'for the head, so removing the first node needs its own branch — and that',
      'branch is easy to forget because it only triggers on one value of `n`. With',
      'the dummy, the head has a predecessor like everything else, and `dummy.next`',
      'is the answer even when the chain becomes empty.',
      '',
      'The quiet mistake is the off-by-one between the two conditions. `lead` starts',
      'on the dummy and advances `n` times, and the second loop runs while',
      '`lead.next != null`; start `lead` on the head instead, or run the loop while',
      '`lead != null`, and `trail` lands on the node to remove rather than on its',
      'predecessor — so you delete its neighbour. That bug is quiet because the',
      'output is still a well-formed chain of the right length; only one value is',
      'wrong, and on a chain of equal values it is not wrong at all.',
      '',
      'O(n) time, bounded by the single traversal `lead` makes, and O(1) extra',
      'space.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, b) {
  const dummy = new ListNode(0, a);
  let lead = dummy;
  for (let i = 0; i < b; i++) lead = lead.next;
  let trail = dummy;
  while (lead.next !== null) {
    lead = lead.next;
    trail = trail.next;
  }
  trail.next = trail.next.next;
  return dummy.next;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null, b: number): ListNode | null {
  const dummy: ListNode = new (ListNode as any)(0, a);
  let lead: ListNode = dummy;
  for (let i = 0; i < b; i++) lead = lead.next as ListNode;
  let trail: ListNode = dummy;
  while (lead.next !== null) {
    lead = lead.next;
    trail = trail.next as ListNode;
  }
  trail.next = (trail.next as ListNode).next;
  return dummy.next;
}`,
      PYTHON: `def solve(a, b):
    dummy = ListNode(0, a)
    lead = dummy
    for _ in range(b):
        lead = lead.next
    trail = dummy
    while lead.next is not None:
        lead = lead.next
        trail = trail.next
    trail.next = trail.next.next
    return dummy.next`,
      JAVA: `    static ListNode solve(ListNode a, int b) {
        ListNode dummy = new ListNode(0, a);
        ListNode lead = dummy;
        for (int i = 0; i < b; i++) lead = lead.next;
        ListNode trail = dummy;
        while (lead.next != null) {
            lead = lead.next;
            trail = trail.next;
        }
        trail.next = trail.next.next;
        return dummy.next;
    }`,
      CPP: `ListNode* solve(ListNode* a, int b) {
    ListNode dummy(0, a);
    ListNode* lead = &dummy;
    for (int i = 0; i < b; i++) lead = lead->next;
    ListNode* trail = &dummy;
    while (lead->next != nullptr) {
        lead = lead->next;
        trail = trail->next;
    }
    trail->next = trail->next->next;
    return dummy.next;
}`,
      GO: `func solve(a *ListNode, b int) *ListNode {
	dummy := &ListNode{Next: a}
	lead := dummy
	for i := 0; i < b; i++ {
		lead = lead.Next
	}
	trail := dummy
	for lead.Next != nil {
		lead = lead.Next
		trail = trail.Next
	}
	trail.Next = trail.Next.Next
	return dummy.Next
}`,
    },
    tests: [
      { stdin: '1 2 3 4 5\n2', expectedStdout: '1 2 3 5', isSample: true },
      { stdin: '1 2 3\n3', expectedStdout: '2 3', isSample: true },
      { stdin: '7\n1', expectedStdout: '' },
      { stdin: '1 2\n1', expectedStdout: '1' },
      { stdin: '10 20 30 40\n4', expectedStdout: '20 30 40' },
      { stdin: '1 2 3 4 5\n1', expectedStdout: '1 2 3 4' },
    ],
  }),

  p({
    ...base,
    slug: 'remove-all-with-value',
    title: 'Delete Every Node That Says That',
    difficulty: 'MEDIUM',
    patternTags: ['linked-list', 'dummy-head', 'in-place', 'filtering'],
    signatureId: 'fn:list,int->list',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a chain of nodes and a number `v`. Remove **every** node whose',
      'number equals `v` and return what remains, with the surviving nodes in their',
      'original order.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 6 3 4 6 6',
      '        6',
      'output: 1 2 3 4',
      '```',
      '',
      'Note the two `6`s at the end: consecutive matches must both go, not just the',
      'first of them.',
      '',
      'Guarantees and named edge cases, all of which are in the tests: the chain has',
      'at least one node; `v` may be **absent**, in which case the chain comes back',
      'unchanged; and `v` may match **every** node, in which case the answer is',
      'empty and prints as an empty line. Matches at the front of the chain are',
      'ordinary, not special.',
    ].join('\n'),
    editorialMarkdown: [
      '## A dummy head turns "the first node is special" into nothing at all',
      '',
      'Unlinking a node from a singly linked chain means writing through its',
      'predecessor. The head has no predecessor, so a naive loop needs a separate',
      'phase — "first, skip matching nodes at the front; then, walk" — and that',
      'phase is a second place for the same bug to live.',
      '',
      'Give the head a predecessor instead:',
      '',
      '```',
      'dummy = new Node(0, head)',
      'cur = dummy',
      'while cur.next != null:',
      '    if cur.next.val == v: cur.next = cur.next.next   # unlink, do NOT advance',
      '    else:                 cur = cur.next',
      'return dummy.next',
      '```',
      '',
      'Why this catches runs of matches: the pointer `cur` only moves forward when',
      'it has just confirmed that `cur.next` is a keeper. After an unlink, `cur`',
      'stays put and `cur.next` is a node it has never examined, so the very next',
      'iteration inspects it. A run of five consecutive `v`s is five unlinks from',
      'the same `cur`. And because `cur` starts on the dummy, a match at the head is',
      'handled by the identical line of code as a match in the middle.',
      '',
      'The quiet mistake is advancing unconditionally — writing `cur = cur.next` at',
      'the bottom of the loop regardless of which branch ran. That skips the node',
      'that was just pulled forward into the `next` slot, so every second element of',
      'a consecutive run survives. It is quiet because it is completely correct on',
      'any input where no two matches are adjacent, which is what a hand-written',
      'example almost always looks like. The other quiet one is returning `head`',
      'instead of `dummy.next`: `head` may itself have been unlinked, and then you',
      'return a chain that still begins with a deleted node.',
      '',
      'O(n) time — one pass, each node inspected once — and O(1) extra space beyond',
      'the single dummy node.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, b) {
  const dummy = new ListNode(0, a);
  let cur = dummy;
  while (cur.next !== null) {
    if (cur.next.val === b) {
      cur.next = cur.next.next;
    } else {
      cur = cur.next;
    }
  }
  return dummy.next;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null, b: number): ListNode | null {
  const dummy: ListNode = new (ListNode as any)(0, a);
  let cur: ListNode = dummy;
  while (cur.next !== null) {
    if (cur.next.val === b) {
      cur.next = cur.next.next;
    } else {
      cur = cur.next;
    }
  }
  return dummy.next;
}`,
      PYTHON: `def solve(a, b):
    dummy = ListNode(0, a)
    cur = dummy
    while cur.next is not None:
        if cur.next.val == b:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return dummy.next`,
      JAVA: `    static ListNode solve(ListNode a, int b) {
        ListNode dummy = new ListNode(0, a);
        ListNode cur = dummy;
        while (cur.next != null) {
            if (cur.next.val == b) {
                cur.next = cur.next.next;
            } else {
                cur = cur.next;
            }
        }
        return dummy.next;
    }`,
      CPP: `ListNode* solve(ListNode* a, int b) {
    ListNode dummy(0, a);
    ListNode* cur = &dummy;
    while (cur->next != nullptr) {
        if (cur->next->val == b) {
            cur->next = cur->next->next;
        } else {
            cur = cur->next;
        }
    }
    return dummy.next;
}`,
      GO: `func solve(a *ListNode, b int) *ListNode {
	dummy := &ListNode{Next: a}
	cur := dummy
	for cur.Next != nil {
		if cur.Next.Val == b {
			cur.Next = cur.Next.Next
		} else {
			cur = cur.Next
		}
	}
	return dummy.Next
}`,
    },
    tests: [
      { stdin: '1 2 6 3 4 6 6\n6', expectedStdout: '1 2 3 4', isSample: true },
      { stdin: '7 7 7\n7', expectedStdout: '', isSample: true },
      { stdin: '1 2 3\n9', expectedStdout: '1 2 3' },
      { stdin: '6 1 6\n6', expectedStdout: '1' },
      { stdin: '5\n5', expectedStdout: '' },
      { stdin: '-1 2 -1\n-1', expectedStdout: '2' },
    ],
  }),

  p({
    ...base,
    slug: 'reorder-first-last-alternating',
    title: 'Fold The Chain Onto Itself',
    difficulty: 'HARD',
    patternTags: ['linked-list', 'fast-slow-pointers', 'pointer-reversal', 'interleave'],
    signatureId: 'fn:list->list',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'You are given a chain of nodes. Reorder it so that it reads: first node,',
      'last node, second node, second-to-last node, third node, and so on inwards',
      'until every node has been placed exactly once.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 2 3 4 5 6',
      'output: 1 6 2 5 3 4',
      '```',
      '',
      'Written as letters, `a b c d e f` becomes `a f b e c d`.',
      '',
      'When the length is odd the middle node ends up last:',
      '',
      '```',
      'input:  1 2 3 4 5',
      'output: 1 5 2 4 3',
      '```',
      '',
      'Reorder by re-pointing the existing nodes, not by reading the numbers into an',
      'array. The chain always has at least one node; a chain of one node and a',
      'chain of two nodes both come back unchanged, and both are in the tests.',
    ].join('\n'),
    editorialMarkdown: [
      '## Three known patterns, composed: find the middle, reverse, interleave',
      '',
      'The output alternates between walking forwards from the front and backwards',
      'from the back — and a singly linked chain cannot walk backwards. So make it',
      'able to. Split the chain in half, reverse the second half so that it now runs',
      'back-to-front, and then zip the two halves together one node each.',
      '',
      '```',
      '1. slow/fast walk to the end of the first half',
      '2. second = slow.next ; slow.next = null      # sever the two halves',
      '3. reverse `second` in place  (prev / cur / next)',
      '4. while second != null:',
      '       f = first.next ; s = second.next',
      '       first.next = second ; second.next = f',
      '       first = f ; second = s',
      '```',
      '',
      'Why this produces exactly the required order: after step 3, the first half',
      'is `a b c` and the reversed second half is `f e d`. Step 4 takes one node',
      'alternately from each, which is `a f b e c d` — the definition of the',
      'answer. The fast/slow walk is what makes step 1 one pass: `fast` moves two',
      'nodes for every one that `slow` moves, so when `fast` can no longer take a',
      'full double step, `slow` has covered half the chain. Nothing was counted, and',
      'the length was never needed.',
      '',
      'Use the `while fast.next != null and fast.next.next != null` form here, so',
      '`slow` stops at the **end of the first half**. That leaves the first half no',
      'shorter than the second, which is what puts the middle node last on an odd',
      'length and what makes the interleave terminate cleanly.',
      '',
      'The quiet mistake is skipping step 2. If you reverse the second half without',
      'first setting `slow.next = null`, the last node of the first half still',
      'points into the second half, which now runs the other way — you have built a',
      'cycle, and the interleave loop never ends or the printer loops forever. It is',
      'quiet because nothing about the reversal itself is wrong; the damage is a',
      'pointer you did not touch. The other quiet one is the same trap as plain',
      'reversal in step 4: `first.next = second` overwrites the pointer to the rest',
      'of the first half, so both `f` and `s` must be saved before either',
      'assignment.',
      '',
      'O(n) time — three passes, each linear, so a constant times n — and O(1) extra',
      'space, bounded by the handful of pointers. That is the whole reason to do it',
      'with pointers instead of an array of the nodes, which would be O(n) memory.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  if (a === null || a.next === null) return a;
  let slow = a;
  let fast = a;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second !== null) {
    const nxt = second.next;
    second.next = prev;
    prev = second;
    second = nxt;
  }
  let first = a;
  second = prev;
  while (second !== null) {
    const f = first.next;
    const s = second.next;
    first.next = second;
    second.next = f;
    first = f;
    second = s;
  }
  return a;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null): ListNode | null {
  if (a === null || a.next === null) return a;
  let slow: ListNode = a;
  let fast: ListNode = a;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next as ListNode;
    fast = fast.next.next;
  }
  let second: ListNode | null = slow.next;
  slow.next = null;
  let prev: ListNode | null = null;
  while (second !== null) {
    const nxt: ListNode | null = second.next;
    second.next = prev;
    prev = second;
    second = nxt;
  }
  let first: ListNode | null = a;
  second = prev;
  while (second !== null) {
    const f: ListNode | null = (first as ListNode).next;
    const s: ListNode | null = second.next;
    (first as ListNode).next = second;
    second.next = f;
    first = f;
    second = s;
  }
  return a;
}`,
      PYTHON: `def solve(a):
    if a is None or a.next is None:
        return a
    slow = a
    fast = a
    while fast.next is not None and fast.next.next is not None:
        slow = slow.next
        fast = fast.next.next
    second = slow.next
    slow.next = None
    prev = None
    while second is not None:
        nxt = second.next
        second.next = prev
        prev = second
        second = nxt
    first = a
    second = prev
    while second is not None:
        f = first.next
        s = second.next
        first.next = second
        second.next = f
        first = f
        second = s
    return a`,
      JAVA: `    static ListNode solve(ListNode a) {
        if (a == null || a.next == null) return a;
        ListNode slow = a;
        ListNode fast = a;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode second = slow.next;
        slow.next = null;
        ListNode prev = null;
        while (second != null) {
            ListNode nxt = second.next;
            second.next = prev;
            prev = second;
            second = nxt;
        }
        ListNode first = a;
        second = prev;
        while (second != null) {
            ListNode f = first.next;
            ListNode s = second.next;
            first.next = second;
            second.next = f;
            first = f;
            second = s;
        }
        return a;
    }`,
      CPP: `ListNode* solve(ListNode* a) {
    if (a == nullptr || a->next == nullptr) return a;
    ListNode* slow = a;
    ListNode* fast = a;
    while (fast->next != nullptr && fast->next->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    ListNode* second = slow->next;
    slow->next = nullptr;
    ListNode* prev = nullptr;
    while (second != nullptr) {
        ListNode* nxt = second->next;
        second->next = prev;
        prev = second;
        second = nxt;
    }
    ListNode* first = a;
    second = prev;
    while (second != nullptr) {
        ListNode* f = first->next;
        ListNode* s = second->next;
        first->next = second;
        second->next = f;
        first = f;
        second = s;
    }
    return a;
}`,
      GO: `func solve(a *ListNode) *ListNode {
	if a == nil || a.Next == nil {
		return a
	}
	slow := a
	fast := a
	for fast.Next != nil && fast.Next.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	second := slow.Next
	slow.Next = nil
	var prev *ListNode
	for second != nil {
		nxt := second.Next
		second.Next = prev
		prev = second
		second = nxt
	}
	first := a
	second = prev
	for second != nil {
		f := first.Next
		s := second.Next
		first.Next = second
		second.Next = f
		first = f
		second = s
	}
	return a
}`,
    },
    tests: [
      { stdin: '1 2 3 4 5 6', expectedStdout: '1 6 2 5 3 4', isSample: true },
      { stdin: '1 2 3 4 5', expectedStdout: '1 5 2 4 3', isSample: true },
      { stdin: '1', expectedStdout: '1' },
      { stdin: '1 2', expectedStdout: '1 2' },
      { stdin: '1 2 3 4', expectedStdout: '1 4 2 3' },
      { stdin: '10 20 30', expectedStdout: '10 30 20' },
    ],
  }),

  p({
    ...base,
    slug: 'add-two-reversed-numbers',
    title: 'Add Two Numbers Written Backwards',
    difficulty: 'HARD',
    patternTags: ['linked-list', 'carry-propagation', 'dummy-head', 'two-pointers'],
    signatureId: 'fn:list,list->list',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'Two chains of nodes each hold the digits of a whole number, **least',
      'significant digit first**. Return a chain holding the digits of their sum,',
      'written the same way.',
      '',
      '**Example**',
      '',
      '```',
      'input:  2 4 3',
      '        5 6 4',
      'output: 7 0 8',
      '```',
      '',
      'The first chain is `342`, the second is `465`, and `342 + 465 = 807`, which',
      'written backwards is `7 0 8`.',
      '',
      'Guarantees you may rely on: each chain has at least one node, every digit is',
      'between `0` and `9`, and the number `0` is written as the single digit `0`.',
      'The two chains may have **different lengths**. A carry out of the most',
      'significant digit produces one extra node, so `9 9` plus `1` is `0 0 1` — that',
      'case is in the tests.',
      '',
      'The numbers can be longer than a 64-bit integer, so add digit by digit rather',
      'than converting to a number.',
    ].join('\n'),
    editorialMarkdown: [
      '## Carry propagation over two walking pointers',
      '',
      'Least-significant-digit-first is not an obstacle, it is the gift: it is',
      'exactly the order in which long addition is done by hand. Walk both chains',
      'from their heads with one carry variable, and the columns line up for free.',
      '',
      '```',
      'dummy = new Node(0); tail = dummy; carry = 0',
      'while x != null or y != null or carry != 0:',
      '    sum = carry',
      '    if x != null: sum += x.val ; x = x.next',
      '    if y != null: sum += y.val ; y = y.next',
      '    carry = sum / 10',
      '    tail.next = new Node(sum % 10)',
      '    tail = tail.next',
      'return dummy.next',
      '```',
      '',
      'Why the carry is always `0` or `1`: the largest a column can be is',
      '`9 + 9 + 1 = 19`, so `sum / 10` is at most one. That is what makes a single',
      'carry variable sufficient — the overflow can never reach two columns ahead,',
      'so nothing has to be revisited and one forward pass is enough.',
      '',
      'The three-part loop condition is the whole trick. Stopping when both chains',
      'run out drops a final carry, so `99 + 1` comes back as `0 0` instead of',
      '`0 0 1` — the leading `1` of the answer is silently missing. Requiring both',
      'chains to be non-null (`and` instead of `or`) truncates the sum to the length',
      'of the shorter input. Both bugs are quiet in the same way: they produce a',
      'well-formed chain of digits, so nothing crashes and nothing looks wrong until',
      'you check the arithmetic, and both are correct on two equal-length inputs',
      'that happen not to carry at the top — which is what the first example you',
      'write by hand usually is. Keep all three clauses.',
      '',
      'The dummy head earns its place again: the result chain is built from nothing,',
      'and without a dummy the first `tail.next = ...` needs a special case for',
      '"there is no tail yet".',
      '',
      'O(max(m, n)) time — one node of output per column, and the number of columns',
      'is the longer input plus at most one for the final carry — and O(1) extra',
      'space beyond the output chain itself, which is bounded by the same count.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy;
  let x = a;
  let y = b;
  let carry = 0;
  while (x !== null || y !== null || carry !== 0) {
    let sum = carry;
    if (x !== null) {
      sum += x.val;
      x = x.next;
    }
    if (y !== null) {
      sum += y.val;
      y = y.next;
    }
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
  }
  return dummy.next;
}`,
      TYPESCRIPT: `function solve(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy: ListNode = new (ListNode as any)(0);
  let tail: ListNode = dummy;
  let x: ListNode | null = a;
  let y: ListNode | null = b;
  let carry = 0;
  while (x !== null || y !== null || carry !== 0) {
    let sum = carry;
    if (x !== null) {
      sum += x.val;
      x = x.next;
    }
    if (y !== null) {
      sum += y.val;
      y = y.next;
    }
    carry = Math.floor(sum / 10);
    tail.next = new (ListNode as any)(sum % 10);
    tail = tail.next as ListNode;
  }
  return dummy.next;
}`,
      PYTHON: `def solve(a, b):
    dummy = ListNode(0)
    tail = dummy
    x = a
    y = b
    carry = 0
    while x is not None or y is not None or carry != 0:
        total = carry
        if x is not None:
            total += x.val
            x = x.next
        if y is not None:
            total += y.val
            y = y.next
        carry = total // 10
        tail.next = ListNode(total % 10)
        tail = tail.next
    return dummy.next`,
      JAVA: `    static ListNode solve(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        ListNode x = a;
        ListNode y = b;
        int carry = 0;
        while (x != null || y != null || carry != 0) {
            int sum = carry;
            if (x != null) {
                sum += x.val;
                x = x.next;
            }
            if (y != null) {
                sum += y.val;
                y = y.next;
            }
            carry = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
        }
        return dummy.next;
    }`,
      CPP: `ListNode* solve(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    ListNode* x = a;
    ListNode* y = b;
    int carry = 0;
    while (x != nullptr || y != nullptr || carry != 0) {
        int sum = carry;
        if (x != nullptr) {
            sum += x->val;
            x = x->next;
        }
        if (y != nullptr) {
            sum += y->val;
            y = y->next;
        }
        carry = sum / 10;
        tail->next = new ListNode(sum % 10);
        tail = tail->next;
    }
    return dummy.next;
}`,
      GO: `func solve(a *ListNode, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	x := a
	y := b
	carry := 0
	for x != nil || y != nil || carry != 0 {
		sum := carry
		if x != nil {
			sum += x.Val
			x = x.Next
		}
		if y != nil {
			sum += y.Val
			y = y.Next
		}
		carry = sum / 10
		tail.Next = &ListNode{Val: sum % 10}
		tail = tail.Next
	}
	return dummy.Next
}`,
    },
    tests: [
      { stdin: '2 4 3\n5 6 4', expectedStdout: '7 0 8', isSample: true },
      { stdin: '9 9\n1', expectedStdout: '0 0 1', isSample: true },
      { stdin: '0\n0', expectedStdout: '0' },
      { stdin: '9 9 9\n9 9 9 9', expectedStdout: '8 9 9 0 1' },
      { stdin: '5\n5', expectedStdout: '0 1' },
      { stdin: '1 2 3\n9', expectedStdout: '0 3 3' },
    ],
  }),
];
