/**
 * Rewritten statements and editorials for hand-authored problems, keyed by
 * slug. Generated and extended by `scripts/upgrade-statements.ts`; applied
 * by `upgrade.ts`. Do not edit by hand — rerun the script.
 */
export interface StatementUpgrade {
  promptMarkdown: string;
  editorialMarkdown: string;
  /** stdin of tests a new example draws on, made visible as samples. */
  promoteSamples: string[];
  model: string;
  date: string;
  /** Set when the reviewer would not pass a rewrite; the original statement stays. */
  skipped?: string;
}

export const UPGRADES: Record<string, StatementUpgrade> = {
  "absolute-values": {
    "promptMarkdown": "Given an array of integers, replace every number with its distance from zero.\n\n**Example 1**\n\n```\ninput:\n-3 2 -1\noutput: 3 2 1\n```\nNegative numbers become positive, while positive numbers remain unchanged.\n\n**Example 2**\n\n```\ninput:\n\noutput: \n```\nAn empty list comes back empty.\n\n**Example 3**\n\n```\ninput:\n0\noutput: 0\n```\nZero stays zero.\n\n**Constraints**\n- The input array can contain any integer.\n- The array can be empty.\n\n**Follow-up:** Can you do this in O(n) time without modifying the original array?",
    "editorialMarkdown": "The intended approach is to build a new list, appending one transformed value per input value. This follows the map pattern. Every language has a built-in absolute-value function, or you can write a simple conditional check to negate negative values.\n\nThe one trap most solvers hit is modifying the input list while iterating it in languages where that aliases the caller's data. Building a new list avoids the question entirely, and returning a new object rather than mutating the argument is a habit worth having by default.\n\nThe time complexity is O(n) to iterate through the array, and the space complexity is O(n) for the new output list.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "add-two-lists": {
    "promptMarkdown": "Given two arrays of integers of the same length, add them together position by position. Return a new array where each entry is the sum of the entries at that position from the two input arrays.\n\n**Example 1**\n\n```\ninput:\n1 2 3\n4 5 6\noutput: 5 7 9\n```\nThe elements at each index are added: 1+4=5, 2+5=7, 3+6=9.\n\n**Example 2**\n\n```\ninput:\n\n\noutput: \n```\nTwo empty lists result in an empty list.\n\n**Example 3**\n\n```\ninput:\n0\n0\noutput: 0\n```\nAdding two zeros results in zero.\n\n**Constraints**\n- Both input arrays will always have the exact same length.\n- The arrays can be empty.\n\n**Follow-up:** Can you solve this in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to use a single loop over the array positions, using the index to read from both lists concurrently. This pattern is parallel iteration. \n\nThe one trap most solvers hit is trying to use two nested loops, which pairs every element with every other element and yields a completely different result. Another trap is trying to handle differing list lengths, but the constraints guarantee equal lengths, simplifying the logic to a single bound.\n\nThe time complexity is O(n) since we visit each element once, and the space complexity is O(n) to store the output array.",
    "promoteSamples": [
      "0\n0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "alternating-sum": {
    "promptMarkdown": "Given an array of integers, compute the alternating sum. Add the first number, subtract the second, add the third, subtract the fourth, and so on to the end of the list.\n\n**Example 1**\n\n```\ninput:\n1 2 3 4\noutput: -2\n```\nThe sum is 1 - 2 + 3 - 4 = -2.\n\n**Example 2**\n\n```\ninput:\n\noutput: 0\n```\nAn empty list evaluates to 0.\n\n**Example 3**\n\n```\ninput:\n5\noutput: 5\n```\nA one-element list returns that element unchanged.\n\n**Constraints**\n- The array can be empty, in which case the result is 0.\n\n**Follow-up:** Can you perform this operation in O(1) space?",
    "editorialMarkdown": "The intended approach is to loop over the array by index rather than by value, using the index to decide whether to add or subtract. This is the accumulator pattern. Even indices are added to the total, and odd indices are subtracted.\n\nThe one trap most solvers hit is subtracting a negative number and expecting the total to decrease. For example, if the current total is -1 and the element to subtract is -2, the operation is `-1 - (-2) = 1`, which correctly results in a larger number. Solvers often try to take the absolute value of elements when they see this, which breaks the logic for negative inputs entirely. \n\nThe time complexity is O(n) for a single pass through the array, and the space complexity is O(1) as we only need a single running total.",
    "promoteSamples": [
      "5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "are-anagrams": {
    "promptMarkdown": "Given two words on separate lines, determine whether they use exactly the same letters. Two words are anagrams when one can be rearranged into the other, meaning they have the exact same letters and the exact same number of each letter, with order being irrelevant. Both words consist of lower-case letters with no spaces.\n\n**Example 1**\n\n```\ninput:\nlisten\nsilent\noutput: true\n```\nBoth words contain the same letters in the same frequencies.\n\n**Example 2**\n\n```\ninput:\nabc\nabd\noutput: false\n```\nThe first word has a 'c' while the second has a 'd'.\n\n**Example 3**\n\n```\ninput:\n\n\noutput: true\n```\nTwo empty strings are considered anagrams of each other.\n\n**Constraints**\n- The strings contain only lowercase English letters.\n- The strings can be empty.\n\n**Follow-up:** Can you determine if they are anagrams in O(n) time?",
    "editorialMarkdown": "The intended approach is to count the occurrences of each letter in both words and compare the counts. This uses the frequency count pattern. You can build a map of character counts for the first word, then decrement the counts for the second word, checking that all frequencies end up at zero.\n\nThe one trap most solvers hit is forgetting to check the lengths of the two words first. Words of different lengths cannot be anagrams, and if you only verify that every letter in the first word appears the right number of times in the second, you might incorrectly return true when the second word contains additional letters (e.g., \"abc\" and \"abcc\"). Comparing lengths first completely avoids this issue.\n\nThe time complexity is O(n) where n is the length of the words, and the space complexity is O(1) or O(k) where k is the size of the alphabet, since there are at most 26 lowercase English letters to store counts for.",
    "promoteSamples": [
      "\n"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "average-of-list": {
    "promptMarkdown": "Given a list of whole numbers, calculate and return their average. The answer is a decimal, printed to six decimal places.\n\n**Example 1**\n\n```\ninput:\n1 2 3 4\noutput: 2.500000\n```\nThe sum is 10 and there are 4 numbers; 10 / 4 = 2.5.\n\n**Example 2**\n\n```\ninput:\n5\noutput: 5.000000\n```\nThe average of a single number is the number itself.\n\n**Example 3**\n\n```\ninput:\n1 2\noutput: 1.500000\n```\nThe sum is 3, divided by 2 is 1.5.\n\n**Constraints**\n- The list always has at least one number.\n\n**Follow-up:** Can you do this in a single pass with O(1) extra space?",
    "editorialMarkdown": "The intended approach is to sum all the numbers in the list and divide by the count of elements. This is a basic aggregate pattern. \n\nThe one trap most solvers hit is integer division. In many strongly-typed languages, dividing an integer by an integer yields an integer, discarding the fractional part silently. To get the correct decimal result, you must cast at least one of the operands to a floating-point type before performing the division.\n\nThe time complexity is O(n) to iterate through the array to find the sum, and the space complexity is O(1).",
    "promoteSamples": [
      "1 2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-delete-leaf": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nImplement `remove(x)` when the target may be a leaf. Removing a leaf disconnects its parent link; removing a value not present changes nothing. Other operations must continue to work.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n7\nBST\ninsert 5\ninsert 3\ninsert 7\nremove 3\ninorder\ncontains 3\noutput:\nnull\nnull\nnull\nnull\nnull\n5 7\nfalse\n```\nThis tests removing a leaf node from a tree and verifying it is gone.\n\n**Example 2**\n```\ninput:\n3\nBST\nremove 4\ninorder\noutput:\nnull\nnull\n\n```\nThis tests removing a value from an empty tree.\n\n**Follow-up:** Can you perform the deletion in O(h) time, where h is the height of the tree?",
    "editorialMarkdown": "The intended approach uses the Recursive Deletion pattern. Deletion uses the same ordered descent as search, but the recursive call returns the new root of the subtree it changed. For a leaf, that returned root is null, so its parent reconnects the correct child pointer without needing a parent field. A missing target simply returns the untouched subtree.\n\nThe quiet mistake is returning null for a missing target after descending into it, which silently cuts off an entire valid subtree instead of making remove a no-op.\n\nSearch, insert, and remove take O(h) time where h is the tree height. Inorder traversal takes O(n) time. The nodes and traversal output use O(n) space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-delete-one-child": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nMake `remove(x)` handle a node with exactly one child: replace the removed node with that child. A remove for a missing number is a no-op, and removal from an empty tree stays empty.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n7\nBST\ninsert 8\ninsert 3\ninsert 1\nremove 3\ninorder\ncontains 1\noutput:\nnull\nnull\nnull\nnull\nnull\n1 8\ntrue\n```\nRemoving 3 replaces it with its only child 1.\n\n**Example 2**\n```\ninput:\n3\nBST\nremove 2\ninorder\noutput:\nnull\nnull\n\n```\nRemoving from an empty tree is a no-op.\n\n**Follow-up:** Can you ensure all operations except `inorder` run in O(h) time?",
    "editorialMarkdown": "The intended approach is to Splice the Only Child. The deletion pattern is local once the search path finds the target. If exactly one child exists, that child already obeys all bounds imposed by the target's ancestors, so returning it splices the subtree into place safely. Returning values from recursion makes even root deletion use the same rule.\n\nThe quiet mistake most solvers hit is always returning the left child, which is invisible for a left-only test but discards the subtree when the only child is on the right.\n\nInsert, contains, and remove take O(h) time for height h. Inorder takes O(n) time. The tree needs O(n) nodes and recursion uses O(h) stack space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-delete-successor": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nFor a node with two children, `remove(x)` must replace its value with its in-order successor: the smallest value in its right subtree, then remove that successor node. This replacement rule is required.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n9\nBST\ninsert 5\ninsert 3\ninsert 8\ninsert 6\ninsert 9\nremove 5\ninorder\ncontains 5\noutput:\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n3 6 8 9\nfalse\n```\nRemoving the root (5) replaces it with its in-order successor (6).\n\n**Example 2**\n```\ninput:\n3\nBST\nremove 4\ninorder\noutput:\nnull\nnull\n\n```\nRemoving from an empty tree does nothing.\n\n**Follow-up:** Does finding the successor require starting from the root of the entire tree?",
    "editorialMarkdown": "The intended approach uses Successor Replacement. For a two-child deletion, the inorder successor is the leftmost node of the right subtree. It is the smallest value still greater than the target, so copying it into the target preserves the BST ordering. The successor cannot have a left child, making its follow-up deletion one of the simpler zero-or-one-child cases.\n\nThe quiet mistake solvers hit is choosing an arbitrary right-subtree value, which can look sorted in a shallow example but violates an ancestor bound when that value has smaller descendants.\n\nFinding and deleting the successor remains O(h) time, as do insert and contains. Inorder is O(n). Node storage is O(n) and recursion uses O(h) stack space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-ignore-duplicate-inserts": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nUse this explicit duplicate policy: if `insert(x)` is called for an existing value, do nothing. The tree is a set of integers, not a multiset. `contains` still returns true and `inorder` lists the value once.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n7\nBST\ninsert 4\ninsert 4\ninsert 2\ninorder\ncontains 4\ncontains 9\noutput:\nnull\nnull\nnull\nnull\n2 4\ntrue\nfalse\n```\nInserting 4 a second time does nothing; inorder lists it only once.\n\n**Example 2**\n```\ninput:\n4\nBST\ninsert 1\ninsert 1\ninorder\noutput:\nnull\nnull\nnull\n1\n```\nDuplicate inserts are safely ignored.\n\n**Follow-up:** Can you handle duplicate insertions in O(h) time without scanning the whole tree?",
    "editorialMarkdown": "The intended approach maintains a Strict Ordering Invariant. A BST is easiest to reason about when every left value is strictly smaller and every right value strictly larger. The insertion descent detects equality and stops, making repeated operation logs idempotent. This makes inorder a sorted set representation and keeps deletion's comparison decisions unambiguous.\n\nThe quiet mistake is sending equals consistently to one side, which seems reasonable yet changes the stated set semantics and can make a long duplicate workload artificially tall.\n\nEach operation descends O(h) nodes, where h is tree height. Inorder is O(n). The tree stores O(n) distinct nodes and traversal recursion costs O(h) stack space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-inorder-sorted-output": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nAfter arbitrary inserts, make `inorder()` return all stored integers in ascending order. Traverse the left subtree, the node, then the right subtree. An empty BST returns an empty array, printed as a blank line.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n7\nBST\ninsert 5\ninsert 2\ninsert 7\ninsert 1\ninorder\ncontains 6\noutput:\nnull\nnull\nnull\nnull\nnull\n1 2 5 7\nfalse\n```\nThe inorder traversal correctly outputs elements in sorted order.\n\n**Example 2**\n```\ninput:\n2\nBST\ninorder\noutput:\nnull\n\n```\nAn empty tree prints a blank line for inorder.\n\n**Follow-up:** Can you implement the traversal iteratively using a stack instead of recursion?",
    "editorialMarkdown": "The intended approach applies the Inorder Traversal pattern. The inorder traversal works because every left subtree contains only smaller values and every right subtree only larger values. Visiting left, then the node, then right therefore emits a sorted sequence without calling a sorting library. A recursive helper naturally carries the node pointers.\n\nThe quiet mistake most solvers hit is visiting the node before its left child, which still returns every value but quietly changes the traversal into preorder and loses sorted output.\n\nInorder visits each node once, taking O(n) time and O(h) call-stack space, with O(n) output space. Insert is O(h) time.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-insert-contains-basics": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nImplement `insert(x)` and `contains(x)`. Values smaller than a node go left and larger values go right. `contains` is false for an empty tree and for a missing value.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n6\nBST\ninsert 8\ninsert 3\ncontains 3\ncontains 4\ninorder\noutput:\nnull\nnull\nnull\ntrue\nfalse\n3 8\n```\nBasic insertions and checks function correctly.\n\n**Example 2**\n```\ninput:\n3\nBST\ncontains 1\ninorder\noutput:\nnull\nfalse\n\n```\nChecking an empty tree returns false safely.\n\n**Follow-up:** Can you write `contains` iteratively to save stack space?",
    "editorialMarkdown": "The intended approach implements BST Descent. The binary-search-tree pattern stores one ordering decision at every node. That is why a lookup need only follow one child at each level rather than scan every stored number. Insert follows the identical descent until it finds a missing child pointer, where it creates a node.\n\nThe quiet mistake is forgetting to stop after an equal value, which creates duplicate nodes and makes the duplicate policy accidental. This batch ignores duplicate inserts.\n\nEach insert and contains call takes O(h) time where h is the tree height. Stored nodes use O(n) space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-mixed-workload": {
    "promptMarkdown": "Build a binary search tree yourself with nodes and pointers; do not wrap a built-in set or map.\n\nHandle a mixed operation log of inserts, removes, membership checks, and inorder snapshots. Keep the strict BST invariant after every operation, ignore duplicate inserts, and make missing removals no-ops.\n\n**Operation log**\n\nThe first operation is the constructor (`BST`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.\n\n**Constraints**\n- The number of operations will not exceed 100,000.\n- `x` will fit in a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n11\nBST\ninsert 6\ninsert 2\ninsert 9\nremove 2\ninsert 4\ninorder\ncontains 2\ncontains 4\nremove 6\ninorder\noutput:\nnull\nnull\nnull\nnull\nnull\nnull\n4 6 9\nfalse\ntrue\nnull\n4 9\n```\nDemonstrates a mix of operations maintaining the correct state.\n\n**Example 2**\n```\ninput:\n4\nBST\ninorder\nremove 1\ncontains 1\noutput:\nnull\n\nnull\nfalse\n```\nOperations on an empty tree do not crash.\n\n**Follow-up:** Does your deletion method cleanly re-balance or just preserve basic BST rules? (Balancing is not strictly required here).",
    "editorialMarkdown": "The intended approach is to Maintain One Invariant. A mixed workload tests whether every method protects the same ordered-node invariant. Insert and contains descend by comparisons, remove reconnects subtree roots, and inorder observes the result in sorted order. Treating inorder as an invariant check is useful: after every mutation it should still be strictly ascending with no duplicates.\n\nThe quiet mistake is implementing deletion as a special side path that does not reconnect the returned subtree root, which often passes when the target is a leaf but loses mutations below the root.\n\nEvery individual insert, contains, or remove is O(h). Each inorder snapshot is O(n). The pointer tree occupies O(n) space and recursive operations use O(h) stack space.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "bst-repeated-descent": {
    "promptMarkdown": "Implement a binary search tree (BST) to manage a collection of unique integer identifiers. You must implement the tree using custom node objects and pointers; do not use a built-in set or map data structure.\n\nThe system will perform a sequence of operations. You must implement the following methods:\n- `BST()`: Initializes an empty binary search tree.\n- `insert(value)`: Inserts an integer `value` into the tree. If the value already exists, do not insert a duplicate.\n- `contains(value)`: Returns `true` if the `value` exists in the tree, and `false` otherwise.\n- `remove(value)`: Removes the `value` from the tree. If the value does not exist, the tree remains unchanged.\n- `inorder()`: Returns an array of the elements currently in the tree, ordered from smallest to largest.\n\n**Operation log**\n\nThe operations are provided as a sequence of commands. The first command is the constructor `BST`. For the constructor and any void method (`insert` and `remove`), output `null`. For `contains`, output `true` or `false`. For `inorder`, output the elements separated by a space on a single line (an empty tree should output an empty line). Note that `remove` always outputs `null`, even if the target value is not found in the tree.\n\n**Constraints**\n- `-10^9 <= value <= 10^9`\n- A maximum of `10^4` operations will be performed.\n- `remove` operations on nodes with two children should replace the node's value with its in-order successor.\n\n**Example 1**\n```\ninput:\n10\nBST\ninsert 1\ninsert 2\ninsert 3\ninsert 4\ncontains 4\ncontains 0\nremove 3\ninorder\ncontains 3\noutput:\nnull\nnull\nnull\nnull\nnull\ntrue\nfalse\nnull\n1 2 4\nfalse\n```\nExplanation: We insert 1, 2, 3, 4 sequentially, which creates a skewed, one-sided tree. `contains 4` returns true, `contains 0` returns false. After removing 3, the inorder traversal yields 1 2 4, and `contains 3` returns false.\n\n**Example 2**\n```\ninput:\n3\nBST\ncontains 1\ninorder\noutput:\nnull\nfalse\n\n```\nExplanation: The tree is initially empty, so `contains 1` returns false. The `inorder` traversal of an empty tree yields an empty line.\n\n**Example 3**\n```\ninput:\n11\nBST\ninsert 8\ninsert 4\ninsert 12\ninsert 2\ninsert 6\ncontains 6\nremove 4\ninorder\ncontains 4\ncontains 2\noutput:\nnull\nnull\nnull\nnull\nnull\nnull\ntrue\nnull\n2 6 8 12\nfalse\ntrue\n```\nExplanation: After inserting several elements, we search for 6 (returns true). We then remove 4, which has two children (2 and 6). After removal, the tree contains 2, 6, 8, 12.\n\n**Follow-up:** Can you determine the time complexity of the `contains` operation when elements are inserted in strictly increasing order compared to a random order?",
    "editorialMarkdown": "## Height-sensitive descent\n\nThe core mechanism of a binary search tree is a repeated comparison that determines whether to descend to the left or right child at each node. This pattern allows us to locate targets for search, insertion, and deletion. The efficiency of this descent is governed by the tree's height, not the total number of elements. \n\nA common trap for most solvers is assuming that a standard BST automatically maintains itself in a balanced state. Without self-balancing mechanisms, inserting elements in a sorted or nearly sorted order—such as a strictly increasing sequence—causes the tree to degenerate into a linked list. In such cases, a structure that appears to offer logarithmic performance quietly degrades.\n\nFor operations like `insert`, `contains`, and `remove`, the time complexity is O(h), where h is the height of the tree. In a balanced tree, this is O(log n), but in a skewed tree formed by ordered inserts, it degrades to O(n). The `inorder` traversal visits every node exactly once, resulting in an O(n) time complexity. The space complexity is O(n) to store the nodes, and the recursive implementations of the operations require O(h) call stack space.",
    "promoteSamples": [
      "11\nBST\ninsert 8\ninsert 4\ninsert 12\ninsert 2\ninsert 6\ncontains 6\nremove 4\ninorder\ncontains 4\ncontains 2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "cap-at-maximum": {
    "promptMarkdown": "Given a list of integers and a maximum cap, replace every number that is above the cap with the cap itself. Numbers at or below the cap should be left alone.\n\n**Example 1**\n\n```\ninput:\n1 9 4 7\n5\noutput: 1 5 4 5\n```\nThe numbers 9 and 7 are above the cap of 5, so they are replaced by 5.\n\n**Example 2**\n\n```\ninput:\n5 5\n5\noutput: 5 5\n```\nNumbers exactly equal to the cap are unchanged.\n\n**Example 3**\n\n```\ninput:\n\n3\noutput: \n```\nAn empty list comes back empty.\n\n**Constraints**\n- The list can be empty.\n- The cap and the numbers in the list can be negative.\n\n**Follow-up:** Can you perform this operation in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to iterate over the array and apply a simple condition to each element: if the element exceeds the cap, emit the cap, otherwise emit the element itself. This is the clamping or transform pattern.\n\nThe one trap most solvers hit is treating this as a filter rather than a transform. They might write logic that skips appending numbers greater than the cap, effectively removing them from the array entirely. Another subtle bug is getting the boundary condition wrong by checking `>=` instead of `>`, which behaves incorrectly on values that equal the cap. \n\nThe time complexity is O(n) as we examine each element once, and the space complexity is O(n) for the new array containing the clamped values.",
    "promoteSamples": [
      "\n3"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "capitalise-each-word": {
    "promptMarkdown": "Given a string of lower-case words separated by single spaces, make the first letter of every word upper case. The rest of each word should remain lower case. There are no leading or trailing spaces.\n\n**Example 1**\n\n```\ninput:\nhello world\noutput: Hello World\n```\nThe first letter of each word is capitalised.\n\n**Example 2**\n\n```\ninput:\n\noutput: \n```\nAn empty line comes back empty.\n\n**Example 3**\n\n```\ninput:\na b\noutput: A B\n```\nSingle-letter words are fully capitalised.\n\n**Constraints**\n- The string consists of lowercase letters and spaces.\n- Words are separated by exactly one space.\n- The string can be empty.\n\n**Follow-up:** Can you solve this in O(n) time?",
    "editorialMarkdown": "The intended approach is to break the input string into individual words, capitalise the first letter of each word while keeping the rest unchanged, and then join them back together with spaces. This utilizes the split-transform-join pattern.\n\nThe one trap most solvers hit is dealing with one-letter words. When slicing the rest of the string after the first character, some languages might throw an out-of-bounds error if the string is only one character long. Additionally, splitting an empty string can produce an array with one empty string, which causes an error when trying to access the first character. Handing the empty input as a special case upfront is usually required.\n\nThe time complexity is O(n) based on the length of the string, and the space complexity is O(n) to store the pieces and the result string.",
    "promoteSamples": [
      "a b"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "contains-word": {
    "promptMarkdown": "Given two lines of text containing lower-case letters and spaces, determine whether the first line contains the second line somewhere inside it as a substring.\n\n**Example 1**\n\n```\ninput:\nhello world\nlo w\noutput: true\n```\nThe substring \"lo w\" appears directly inside \"hello world\".\n\n**Example 2**\n\n```\ninput:\nhello\nxyz\noutput: false\n```\nThe substring \"xyz\" does not appear in \"hello\".\n\n**Example 3**\n\n```\ninput:\nabc\n\noutput: true\n```\nEvery string contains the empty string as a substring.\n\n**Constraints**\n- Both strings contain only lowercase English letters and spaces.\n- The strings can be empty.\n\n**Follow-up:** Can you determine this without using built-in substring search functions?",
    "editorialMarkdown": "The intended approach is to use your language's built-in substring or \"contains\" functionality, which is heavily optimized for this operation. This is a basic substring search pattern.\n\nThe one trap most solvers hit is getting confused by the problem title and trying to split the text into words to check for word inclusion. A substring can span across spaces and partial words, so breaking the text apart by spaces will give incorrect results. It is important to read the example cases, which clearly show a partial word match succeeding.\n\nThe time complexity is O(n * m) in the worst case with a naive search, where n is the length of the first string and m is the length of the second string, but built-in functions often achieve better performance in practice. The space complexity is O(1).",
    "promoteSamples": [
      "abc\n"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-characters-appearing-once": {
    "promptMarkdown": "Given a string of lowercase English letters, count the number of characters that appear exactly once.\n\n**Constraints**\n- The input string consists of only lowercase English letters.\n- The length of the string is between 0 and 10^5.\n\n**Example 1**\n```\ninput:\naabbc\noutput: 1\n```\nOnly `c` appears exactly once in the string.\n\n**Example 2**\n```\ninput:\nabc\noutput: 3\n```\nAll three characters `a`, `b`, and `c` appear exactly once.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains no characters.\n\n**Follow-up:** Can you do this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach is to use the gather and decide pattern with a hash map or array.\n\nBecause you cannot know whether a character is unique until you have seen the entire string, the solution requires two passes. In the first pass, iterate through the string and build a frequency map of the characters. In the second pass, iterate through the values in the frequency map and count how many characters have a frequency of exactly 1. \n\nA common trap is iterating over the string during the second pass instead of the frequency map. Doing so would count a character multiple times if you're not careful (though for unique characters, it wouldn't matter, but iterating the map avoids this completely and is cleaner). \n\nThe time complexity is O(n) where n is the length of the string, as we do a constant amount of work for each character. The space complexity is O(k) where k is the size of the alphabet. Since there are only 26 lowercase English letters, this is bounded by O(1) space.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-distinct-values": {
    "promptMarkdown": "Given a list of integers, determine the total number of distinct integers present in the list.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer in the list fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 2 3 1\noutput: 3\n```\nThe distinct values in the list are 1, 2, and 3.\n\n**Example 2**\n```\ninput:\n4 4 4\noutput: 1\n```\nThe only distinct value in the list is 4.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 distinct values.\n\n**Follow-up:** Can you solve this in O(n) time complexity?",
    "editorialMarkdown": "The most straightforward approach uses the hashing pattern by employing a set data structure. \n\nYou can iterate through the list and insert each number into a set. A set inherently discards duplicate values, so after processing all elements, the size of the set will exactly equal the number of distinct integers. \n\nThe trap most solvers hit is trying to sort the list first and counting adjacent differences, or just counting positions where a value differs from the previous one without sorting. The latter fails on lists like `1 2 1`. While sorting and counting works, it requires O(n log n) time. \n\nUsing a set achieves an average time complexity of O(n) because hash set insertions take O(1) on average. The space complexity is O(k) where k is the number of unique integers in the list, bounded by O(n) in the worst case.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-even-numbers": {
    "promptMarkdown": "Given a list of integers, count the number of even integers. An integer is even if it is divisible by 2 with no remainder. This includes zero and negative numbers.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 2\n```\nThe numbers 2 and 4 are even.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 even numbers.\n\n**Example 3**\n```\ninput:\n2 4 6\noutput: 3\n```\nAll three numbers 2, 4, and 6 are even.\n\n**Follow-up:** Can you accomplish this with a single pass and O(1) extra space?",
    "editorialMarkdown": "The intended approach uses the accumulator pattern along with the modulo operator.\n\nInitialize a counter to 0. Iterate over each integer in the list, and use the condition `n % 2 == 0` to check if it is even. If the condition is met, increment the counter.\n\nThe common trap in this problem and similar parity checks is testing for oddness to imply not-evenness using `n % 2 == 1`. In many programming languages, the modulo operator on a negative odd number (like `-3 % 2`) returns `-1`, not `1`, causing valid odd numbers to be missed, or logic bugs if used inverted. Testing `n % 2 == 0` avoids this negative modulo issue entirely because `0` is consistently returned for all even numbers.\n\nThe time complexity is O(n) where n is the number of integers, as each integer is examined exactly once. The space complexity is O(1) because only a single counter variable is maintained.",
    "promoteSamples": [
      "2 4 6"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-greater-than": {
    "promptMarkdown": "Given a list of integers and a threshold integer, count the number of elements in the list that are strictly greater than the threshold.\n\n**Constraints**\n- The list length is between 0 and 10^5.\n- The integers in the list and the threshold fit within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 5 3 9\n3\noutput: 2\n```\nThe numbers 5 and 9 are strictly greater than 3.\n\n**Example 2**\n```\ninput:\n3 3 3\n3\noutput: 0\n```\nNo numbers are strictly greater than 3.\n\n**Example 3**\n```\ninput:\n\n0\noutput: 0\n```\nAn empty list contains 0 numbers greater than 0.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach relies on a simple filtering and accumulator pattern.\n\nSet up a counter variable initialized to zero. Iterate through the elements of the list one by one. For each element, compare it against the threshold using the strictly greater than operator `>`. If the element is strictly greater, increment the counter by one. \n\nA frequent trap solvers encounter is the off-by-one error regarding the boundary condition. The prompt specifies \"strictly greater than\", meaning an element equal to the threshold should not be counted. Using `>=` instead of `>` will incorrectly count elements that match the threshold, failing tests like Example 2.\n\nThe time complexity for this approach is O(n), where n is the number of elements in the list, as it takes a single pass. The space complexity is O(1), since the only extra space required is for the counter variable.",
    "promoteSamples": [
      "\n0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-multiples": {
    "promptMarkdown": "Given a list of integers and a non-zero divisor, count the number of elements in the list that are exact multiples of the divisor.\n\n**Constraints**\n- The list length is between 0 and 10^5.\n- The integers in the list and the divisor fit within a standard 32-bit signed integer.\n- The divisor is never zero.\n\n**Example 1**\n```\ninput:\n3 6 7 9\n3\noutput: 3\n```\nThe numbers 3, 6, and 9 divide exactly by 3.\n\n**Example 2**\n```\ninput:\n1 2 4\n5\noutput: 0\n```\nNone of the numbers are exact multiples of 5.\n\n**Example 3**\n```\ninput:\n\n2\noutput: 0\n```\nAn empty list contains 0 exact multiples.\n\n**Follow-up:** Can you achieve a single-pass O(n) time complexity?",
    "editorialMarkdown": "The intended approach utilizes the accumulator pattern combined with the modulo operator.\n\nInitialize a counter to zero. Loop through each integer in the given list and check if it divides exactly by the divisor. You can determine this by checking if the remainder is zero using the modulo operator `n % d == 0`. If true, increment the counter.\n\nThe primary trap here is overlooking edge cases involving negative numbers and zero itself. Fortunately, the check `n % d == 0` correctly handles negative numbers since a zero remainder correctly signifies divisibility regardless of the sign. Another potential trap is dividing by zero, which causes a crash in most languages, but the problem constraints explicitly guarantee the divisor is non-zero, removing this risk.\n\nThe time complexity is O(n) because the algorithm processes each element of the list exactly once. The space complexity is O(1) as only a single integer is needed to store the count.",
    "promoteSamples": [
      "\n2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-occurrences": {
    "promptMarkdown": "Given a list of integers and a target integer, count the total number of times the target integer appears in the list.\n\n**Constraints**\n- The length of the list is between 0 and 10^5.\n- The integers in the list and the target fit within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 2 3\n2\noutput: 2\n```\nThe number 2 appears exactly 2 times in the list.\n\n**Example 2**\n```\ninput:\n1 2 3\n9\noutput: 0\n```\nThe number 9 does not appear in the list.\n\n**Example 3**\n```\ninput:\n5 5 5 5\n5\noutput: 4\n```\nThe number 5 appears 4 times.\n\n**Follow-up:** What are the time and space complexities of your approach?",
    "editorialMarkdown": "The intended approach involves a simple accumulator pattern with an equality check.\n\nTo solve this, declare a counter variable initialized to zero. Loop through the elements of the list and use the `==` operator to test if the current element matches the target number. If it does, increment the counter. Once the loop concludes, return the counter.\n\nA common trap is inadvertently returning early from the loop. If a solver writes a `return` statement as soon as they find the first match, their function will effectively answer the question \"does this number exist?\" instead of \"how many times does it appear?\". It is crucial to let the loop process the entire list. Another slight pitfall is writing special case logic for when the element is not found, which is unnecessary since the counter naturally starts at zero.\n\nThe time complexity is O(n) as we must iterate over the entire array of n elements. The space complexity is O(1) since we only use a single counter variable.",
    "promoteSamples": [
      "5 5 5 5\n5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-odd-numbers": {
    "promptMarkdown": "Given a list of integers, count the number of odd integers. An integer is odd if dividing it by 2 leaves a non-zero remainder, which applies to both positive and negative integers.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 2\n```\nThe numbers 1 and 3 are odd.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 odd numbers.\n\n**Example 3**\n```\ninput:\n2 4 6\noutput: 0\n```\nThere are no odd numbers in this list.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach uses the accumulator pattern combined with a modulo check for oddness.\n\nCreate a counter starting at zero. Iterate over the provided list and test each number. An odd number is defined as not being evenly divisible by 2. Therefore, you should test `n % 2 != 0`. When this condition evaluates to true, increment the counter. \n\nThe biggest trap here is attempting to check for oddness by testing if the remainder equals one, like `n % 2 == 1`. In many programming languages, taking the modulo of a negative number yields a negative remainder, so `-3 % 2` evaluates to `-1`. Using `== 1` silently misses all negative odd numbers. Testing for `!= 0` correctly captures both `1` and `-1` remainders and is much safer.\n\nThe time complexity is O(n), where n is the number of elements in the list, as every element is visited once. The space complexity is O(1) since only one accumulator variable is needed.",
    "promoteSamples": [
      "2 4 6"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-spaces": {
    "promptMarkdown": "Given a string, count the total number of space characters it contains.\n\n**Constraints**\n- The string length is between 0 and 10^5.\n- The string may contain English letters, digits, punctuation, and spaces.\n\n**Example 1**\n```\ninput:\na b c\noutput: 2\n```\nThere are exactly 2 spaces in the string.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains 0 spaces.\n\n**Example 3**\n```\ninput:\nabc\noutput: 0\n```\nThere are no spaces in the string.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach requires iterating through the string and counting specific characters.\n\nCharacters in a string can be compared just like any other values. You can initialize a counter to zero and loop through every character in the string. If the current character is equal to the space character `' '`, increment the counter. Alternatively, many languages offer built-in functions to count occurrences of a substring which optimize this loop under the hood.\n\nA trap that some solvers fall into is trying to be too clever by splitting the string into words and counting the words minus one. While this might work on clean input with single spaces between words, it completely fails on strings that have multiple consecutive spaces, leading or trailing spaces, or just spaces with no words at all. It is always safer to directly count the target characters.\n\nThe time complexity is O(n) where n is the length of the string, as it involves a single pass over the characters. The space complexity is O(1) because we only keep track of a single counter value.",
    "promoteSamples": [
      "abc"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-substring-occurrences": {
    "promptMarkdown": "Given two strings, a text and a pattern, count how many times the pattern appears inside the text. Matches are counted **without overlapping**: after a match, the search resumes at the character right after it.\n\n**Example 1**\n```\ninput:\naaaa\naa\noutput: 2\n```\nThe pattern `aa` appears twice without overlapping.\n\n**Example 2**\n```\ninput:\nbanana\nana\noutput: 1\n```\nThe pattern `ana` appears once. A second match would overlap the first.\n\n**Example 3**\n```\ninput:\nhello\nz\noutput: 0\n```\nThe pattern `z` does not appear in the text.\n\n**Constraints**\n- The text length is between 0 and 10,000 characters.\n- The pattern length is between 1 and 10,000 characters.\n- The pattern is never empty.\n\n**Follow-up:** Can you solve this in O(n + m) time where n and m are the lengths of the strings?",
    "editorialMarkdown": "The intended approach is to search for the pattern starting from the beginning of the text, and jump past the match. \n\nThis pattern is a non-overlapping substring search. On a hit, add one to the count and move the start position to the end of the match. When the search finds nothing, stop.\n\nThe one trap most solvers hit is advancing the start index by one instead of by the pattern's length. That counts overlapping matches instead, which gives incorrect results for strings like `aaaa` with `aa` or `banana` with `ana`. Another trap is forgetting to advance the start index at all, resulting in an infinite loop.\n\nThe time complexity is O(n * m) in the worst case for a basic search, where n is the text length and m is the pattern length. The space complexity is O(1).",
    "promoteSamples": [
      "hello\nz"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-uppercase-letters": {
    "promptMarkdown": "Given a string, count how many characters in the string are uppercase English letters, `A` through `Z`. Digits, spaces, and punctuation are not considered letters and should not be counted.\n\n**Example 1**\n```\ninput:\nHello World\noutput: 2\n```\nThere are two uppercase letters: 'H' and 'W'.\n\n**Example 2**\n```\ninput:\nA1b2C\noutput: 2\n```\nThe uppercase letters are 'A' and 'C'.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero uppercase letters.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- The string may contain letters, digits, spaces, and punctuation.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach is to iterate through each character in the string and perform a range check to see if it falls between 'A' and 'Z' inclusive. \n\nThis pattern is a simple linear scan with a conditional check. Because character codes are contiguous and alphabetical, a single range test correctly identifies all uppercase letters.\n\nThe one trap most solvers hit is testing if a character is equal to its own uppercase form (e.g., checking if `ch == toUpperCase(ch)`). This is incorrect because digits, spaces, and punctuation marks are equal to their uppercase forms as well, leading to an overcount. The correct condition requires checking that the character is both a letter and uppercase, which the range check handles perfectly.\n\nThe time complexity is O(n), where n is the length of the string, since we inspect each character exactly once. The space complexity is O(1) as we only need a single counter variable.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-vowels": {
    "promptMarkdown": "Given a string of lowercase letters and spaces, count how many vowels it contains. The vowels are considered to be `a`, `e`, `i`, `o`, and `u`. Spaces and punctuation are not vowels.\n\n**Example 1**\n```\ninput:\nhello world\noutput: 3\n```\nThe vowels are 'e', 'o', and 'o'.\n\n**Example 2**\n```\ninput:\nxyz\noutput: 0\n```\nThere are no vowels in this string.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero vowels.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- All letters in the string are lowercase.\n\n**Follow-up:** Can you determine the count in O(n) time complexity?",
    "editorialMarkdown": "The intended approach is to iterate through the string and check if each character is present in a set of vowels. \n\nThis pattern uses hash set membership for fast lookups. By defining a set containing 'a', 'e', 'i', 'o', and 'u', we can check each character against it in constant time. \n\nThe one trap most solvers hit is writing out a long chain of equality checks with boolean OR operators. While functionally correct, it makes the code brittle and harder to read. The set membership approach scales better if the definition of what to count ever changes.\n\nThe time complexity is O(n), where n is the length of the string, as we check each character once. The space complexity is O(1) because the size of the vowel set is fixed at 5 characters regardless of the input size.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-words": {
    "promptMarkdown": "Given a line of text, count the number of words it contains. Words are separated by single spaces. There are no leading or trailing spaces.\n\n**Example 1**\n```\ninput:\nhello world\noutput: 2\n```\nThere are two words: \"hello\" and \"world\".\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero words.\n\n**Example 3**\n```\ninput:\na\noutput: 1\n```\nThere is one word: \"a\".\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- Words consist of printable characters separated by a single space.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) auxiliary space without creating a new array of words?",
    "editorialMarkdown": "The intended approach is to split the line on spaces and count the resulting pieces. \n\nThis pattern is basic string parsing or tokenization. Many languages offer a built-in split function that makes this a one-line operation. \n\nThe one trap most solvers hit is failing to handle the empty string correctly. Splitting an empty string on a space often returns an array containing a single empty string element, which incorrectly gives a word count of 1 instead of 0. To avoid this, you must either explicitly check for an empty string before splitting, or use a splitting function that automatically discards empty tokens.\n\nThe time complexity is O(n), where n is the length of the string, because splitting requires a full pass over the characters. The space complexity is O(n) if an array of words is constructed, or O(1) if you count spaces manually.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "countdown-list": {
    "promptMarkdown": "Given an integer `n`, return a list of integers counting down from `n` to 1. If `n` is `0`, return an empty list.\n\n**Example 1**\n```\ninput:\n5\noutput: 5 4 3 2 1\n```\nThe numbers count down from 5 to 1.\n\n**Example 2**\n```\ninput:\n0\noutput: \n```\nWhen n is 0, the output is empty.\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\nThe countdown from 1 contains just 1.\n\n**Constraints**\n- `n` is between 0 and 10,000.\n\n**Follow-up:** Can you solve this iteratively without recursion?",
    "editorialMarkdown": "The intended approach is to write a loop that counts backward, starting from the given number down to 1, appending each value to a list. \n\nThis pattern relies on a descending loop. The loop initializes at the target number, runs as long as the counter is strictly greater than 0, and decrements by 1 on each iteration.\n\nThe one trap most solvers hit is getting the stopping condition wrong. Using a condition like greater than 1 instead of greater than 0 will incorrectly drop the final 1 from the output. Additionally, if the loop condition isn't checked before the first iteration, an input of 0 might erroneously produce an element instead of returning an empty list.\n\nThe time complexity is O(n), where n is the given number, as the loop runs n times. The space complexity is O(n) to store the resulting list.",
    "promoteSamples": [
      "1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "double-each-number": {
    "promptMarkdown": "Given a list of integers, return a new list where every number has been multiplied by two.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 2 4 6\n```\nEach number in the input list is doubled.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty list results in an empty list.\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\nDoubling 0 gives 0.\n\n**Constraints**\n- The list length is between 0 and 10,000.\n- Each integer in the list is between -10,000 and 10,000.\n\n**Follow-up:** Can you modify the input list in-place to achieve O(1) extra space?",
    "editorialMarkdown": "The intended approach is to iterate over each element in the array, multiply it by two, and append the result to a new array. \n\nThis pattern is a one-to-one transformation, often referred to as a map operation. The resulting array will always have the exact same length as the original input.\n\nThe one trap most solvers hit is inadvertently treating this as a filter rather than a pure transformation by conditionally skipping elements. If elements are conditionally skipped or appended, the output length won't match the input length, violating the core requirement of a map operation.\n\nThe time complexity is O(n), where n is the length of the list, since we visit every element once. The space complexity is O(n) to construct the new output list.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "factorial-of-n": {
    "promptMarkdown": "Given a whole number `n`, calculate its factorial. The factorial of a number is the product of all positive integers less than or equal to `n`. For example, the factorial of 5 is `1 * 2 * 3 * 4 * 5 = 120`.\n\n**Example 1**\n```\ninput:\n5\noutput: 120\n```\nThe product of 1 through 5 is 120.\n\n**Example 2**\n```\ninput:\n0\noutput: 1\n```\nThe factorial of 0 is defined as 1.\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\nThe factorial of 1 is 1.\n\n**Constraints**\n- `n` is between 0 and 12.\n- The input is small enough that the answer will always fit in a standard 32-bit integer.\n\n**Follow-up:** Can you write both an iterative and a recursive solution for this problem?",
    "editorialMarkdown": "The intended approach is to iterate from 2 up to the given number, multiplying each integer into a running total. \n\nThis pattern uses a multiplicative accumulator. A variable is initialized to 1 and updated iteratively with the product of the current index and the accumulator.\n\nThe one trap most solvers hit is initializing the accumulator to 0 instead of 1. Since 1 is the multiplicative identity, starting at 1 correctly accumulates the product, whereas starting at 0 guarantees the result will incorrectly be 0. Another subtle issue in similar problems is integer overflow due to the rapid growth of factorials, though the constraint of `n <= 12` avoids that here.\n\nThe time complexity is O(n), where n is the given number, as the loop runs proportionally to n. The space complexity is O(1) since we only use a single integer variable to track the product.",
    "promoteSamples": [
      "1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "first-character": {
    "promptMarkdown": "Given a string, return just the first character as a new string of length one. If the string is empty, return an empty string.\n\n**Example 1**\n```\ninput:\nhello\noutput: h\n```\nThe first character is 'h'.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty string returns an empty string.\n\n**Example 3**\n```\ninput:\na\noutput: a\n```\nThe first character is 'a'.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n\n**Follow-up:** Can you solve this in O(1) time and space?",
    "editorialMarkdown": "The intended approach is to check if the string is empty, and if not, return the character at the zeroth index. \n\nThis pattern is about guarding array or string indexing. You must explicitly verify that an element exists before attempting to access it to prevent out-of-bounds errors.\n\nThe one trap most solvers hit is immediately indexing into the string at position zero without first checking its length. Different programming languages handle out-of-bounds indexing differently—some throw exceptions, some return null or undefined, and some return empty values. Relying on language-specific boundary behavior is fragile; explicitly guarding the index ensures the logic is safe everywhere.\n\nThe time complexity is O(1) as finding the first character is an immediate lookup. The space complexity is O(1) since we only create a one-character string.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "first-repeated-number": {
    "promptMarkdown": "Given an array of integers, identify the first integer that occurs more than once. Read the array from left to right and return the first element that you have already encountered previously in the array. If all integers are unique or the array is empty, return `-1`.\n\n**Constraints**\n- The array may be empty.\n- Elements are integers.\n\n**Example 1**\n```\ninput:\n1 2 3 2 1\noutput: 2\n```\nThe number `2` is the first element whose second appearance is encountered.\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: -1\n```\nAll elements are unique.\n\n**Example 3**\n```\ninput:\n\noutput: -1\n```\nThe array is empty.\n\n**Follow-up:** Can you solve this in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to use the \"seen-before\" pattern utilizing a hash set. You iterate through the elements of the list one by one. For each element, you check if it already exists in your hash set of previously seen elements. If it does, you have found the first repeated number and can return it immediately. If it does not, you add the element to the hash set and continue. If the loop finishes without finding any duplicates, you return -1.\n\nThis approach operates in O(n) time because checking for existence and adding to a hash set both take O(1) time on average. The space complexity is O(n) because in the worst case (no duplicates), you will store every element in the hash set. The one trap most solvers hit is using two nested loops to compare every element with every previous element, which results in an inefficient O(n^2) time complexity. Using a hash set trades memory for speed, a fundamental concept in algorithm design.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "fizzbuzz-list": {
    "promptMarkdown": "The classic.\n\nGiven a number `n`, return the list of words for `1` through `n`:\n\n- a multiple of both 3 and 5 becomes `FizzBuzz`\n- a multiple of 3 becomes `Fizz`\n- a multiple of 5 becomes `Buzz`\n- anything else becomes the number itself\n\n**Example**\n\n```\ninput:  5\noutput: 1 2 Fizz 4 Buzz\n```",
    "editorialMarkdown": "## Order the conditions from most specific to least\n\nThe entire difficulty of FizzBuzz is the overlap at 15. Check\n`divisible by 3 and 5` **first**: if you check `divisible by 3` first, then\n15 matches it, you append `Fizz`, and you never reach the case you wanted.\n\nThat is a general rule worth keeping — when conditions overlap, the most\nspecific one goes first, or it is unreachable.\n\nThe other common way to write it builds the word by concatenation:\n\n```\nword = (n % 3 == 0 ? \"Fizz\" : \"\") + (n % 5 == 0 ? \"Buzz\" : \"\")\nif word is empty, use the number\n```\n\nThat version has no overlap problem at all, because 15 simply matches both\nhalves. Either is fine; the second generalises if a third rule arrives.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16",
    "skipped": "review: closely follows the classic FizzBuzz problem statement, with only a manufacturing-line narrative wrapper added around the identical divisibility rules and outpu"
  },
  "index-of-target": {
    "promptMarkdown": "Given an array of integers and a target integer, find the zero-based index of the first occurrence of the target in the array.\nThe input consists of two lines: the first line contains the space-separated integers of the array, and the second line contains the target integer. Return the index of the target. If the target is not found in the array, return `-1`.\n\n**Constraints**\n- The array can be empty.\n- The array can contain duplicates.\n\n**Example 1**\n```\ninput:\n5 3 7\n7\noutput: 2\n```\nThe target `7` is found at index 2.\n\n**Example 2**\n```\ninput:\n1 2\n9\noutput: -1\n```\nThe target `9` is not in the array.\n\n**Example 3**\n```\ninput:\n\n1\noutput: -1\n```\nThe array is empty, so the target cannot be found.\n\n**Follow-up:** Could you solve this with a single pass through the array?",
    "editorialMarkdown": "The optimal approach is a linear search. Iterate through the array while keeping track of the current index. At each step, compare the current element with the target. If they match, return the current index immediately. This early exit ensures you find the *first* occurrence and avoids unnecessary work. If the loop completes without finding a match, return -1.\n\nThe time complexity is O(n), where n is the length of the array, as you may need to inspect every element. The space complexity is O(1) since no additional data structures are required. A common trap is using an `else` branch inside the loop to return -1 when the current element does not match the target, which incorrectly terminates the search on the very first element if it's not a match. Another detail is using -1 as a sentinel value, which is safe because valid indices are non-negative.",
    "promoteSamples": [
      "\n1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-even-number": {
    "promptMarkdown": "Determine if a given integer is even. An even number is an integer that is exactly divisible by 2. Return `true` if the number is even, and `false` otherwise.\n\n**Constraints**\n- The input integer can be positive, negative, or zero.\n\n**Example 1**\n```\ninput:\n4\noutput: true\n```\n4 is divisible by 2.\n\n**Example 2**\n```\ninput:\n7\noutput: false\n```\n7 is not exactly divisible by 2.\n\n**Example 3**\n```\ninput:\n0\noutput: true\n```\n0 is considered an even number.\n\n**Follow-up:** Is it possible to evaluate this without conditional branching?",
    "editorialMarkdown": "The direct approach is to use the modulo operator to check if the remainder of dividing the number by 2 is zero (`n % 2 == 0`). This expression naturally evaluates to a boolean value.\n\nThe time complexity is O(1) and the space complexity is O(1). The trap most solvers hit is explicitly writing out an if-else statement to return `true` or `false` based on the condition, which is overly verbose. Returning the result of the boolean expression directly is cleaner and more idiomatic. Another common stumbling block is the handling of negative numbers, but in most languages, `-n % 2` correctly evaluates to 0 for even numbers, making the simple modulo check robust for all integers.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-prime": {
    "promptMarkdown": "Determine whether a given non-negative integer is a prime number. A prime number is a number greater than 1 that has no positive divisors other than 1 and itself. Return `true` if the number is prime, and `false` otherwise.\n\n**Constraints**\n- The input integer is greater than or equal to 0.\n\n**Example 1**\n```\ninput:\n17\noutput: true\n```\n17 has exactly two divisors: 1 and 17.\n\n**Example 2**\n```\ninput:\n1\noutput: false\n```\n1 is not a prime number as it does not have two distinct divisors.\n\n**Example 3**\n```\ninput:\n2\noutput: true\n```\n2 is the smallest prime number.\n\n**Follow-up:** Can you optimize your algorithm to run faster than O(n) time?",
    "editorialMarkdown": "The standard approach to primality testing involves checking for factors up to the square root of the number. If a number `n` is composite, it can be factored into two integers, at least one of which must be less than or equal to the square root of `n`. Therefore, iterating a potential divisor `i` from 2 up to the square root of `n` is sufficient. If `n` is divisible by `i`, it is not prime.\n\nThis yields a time complexity of O(sqrt n) and a space complexity of O(1). The trap most solvers hit is testing all numbers up to `n`, which works but is drastically slower, resulting in an O(n) time complexity. Another common mistake is failing to handle small edge cases like 0 and 1, which are not prime but might incorrectly return `true` if a loop starting at 2 is skipped without an explicit guard. A best practice is to write the loop condition as `i * i <= n` to avoid floating-point inaccuracies from computing a square root.",
    "promoteSamples": [
      "2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-sorted-ascending": {
    "promptMarkdown": "Determine if a given array of integers is sorted in ascending order. An array is sorted in ascending order if every element is greater than or equal to the preceding element.\n\n**Constraints**\n- The array may contain duplicate elements.\n- The array can be empty or have a single element.\n\n**Example 1**\n```\ninput:\n1 2 2 5\noutput: true\n```\nEvery element is greater than or equal to the one before it.\n\n**Example 2**\n```\ninput:\n3 1\noutput: false\n```\nThe second element (1) is less than the first (3).\n\n**Example 3**\n```\ninput:\n\noutput: true\n```\nAn empty array is considered sorted.\n\n**Follow-up:** Can you implement the check using a single pass with O(1) auxiliary space?",
    "editorialMarkdown": "The intended approach compares adjacent pairs of elements in a single pass. You can iterate through the array starting from the second element (index 1) and compare each element to the one immediately preceding it. If you find any element that is strictly less than its predecessor, the array is not sorted, and you can immediately return `false`. If the loop finishes without finding any out-of-order pairs, the array is sorted, and you return `true`.\n\nThe time complexity is O(n), where n is the number of elements in the array, and the space complexity is O(1). The trap most solvers hit is starting the loop at index 0 and trying to access index -1, which leads to an out-of-bounds error or undefined behavior depending on the language. Starting at index 1 avoids this issue and gracefully handles empty or single-element arrays by completely skipping the loop body and correctly returning `true`.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "join-with-dashes": {
    "promptMarkdown": "Given a list of words provided as a single string of space-separated tokens, join the words together using dashes (`-`) as separators and return the resulting string.\n\n**Constraints**\n- The input string may be empty.\n- Words do not contain spaces.\n\n**Example 1**\n```\ninput:\nred green blue\noutput: red-green-blue\n```\nThe three words are joined by two dashes.\n\n**Example 2**\n```\ninput:\nsolo\noutput: solo\n```\nA single word is returned as is without any dashes.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty input yields an empty output.\n\n**Follow-up:** What is the time complexity of your string concatenation approach?",
    "editorialMarkdown": "The optimal approach is to use the standard library's built-in string join method if available, parsing the space-separated string into an array of words and then joining them with a dash. If implementing it manually, one should iterate over the list of words and append each word to a result builder. The separator should be inserted only between words, meaning it is added before the current word only if the result builder is not currently empty.\n\nThe time complexity is O(n), where n is the total length of the input string. Space complexity is also O(n) to store the resulting string. The trap most solvers hit when writing the loop by hand is appending a dash after every word, which leaves an unwanted trailing dash at the end of the final string that must then be manually stripped. Proper conditional insertion avoids this off-by-one error altogether.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "largest-number": {
    "promptMarkdown": "Given an array of integers, find and return the largest integer in the array.\n\n**Constraints**\n- The array will contain at least one integer.\n- The integers can be negative, zero, or positive.\n\n**Example 1**\n```\ninput:\n3 9 2 7\noutput: 9\n```\n9 is the largest number in the array.\n\n**Example 2**\n```\ninput:\n-5 -2 -9\noutput: -2\n```\nAmong negative numbers, -2 is the largest.\n\n**Example 3**\n```\ninput:\n4\noutput: 4\n```\nFor a single-element array, that element is the largest.\n\n**Follow-up:** Can you solve this in O(n) time using O(1) space?",
    "editorialMarkdown": "The standard approach involves maintaining a \"running best\" variable. You initialize this variable with the first element of the array. Then, iterate through the rest of the array elements. For each element, compare it against the running best. If the current element is strictly greater, update the running best to this new value.\n\nThe time complexity is O(n) and the space complexity is O(1). The trap most solvers hit is initializing the running best variable to 0. While this works for arrays with positive numbers, it completely fails if the array contains only negative numbers, as 0 will be erroneously returned despite never being in the array. Starting with the first element of the array ensures the baseline comparison is a valid data point.",
    "promoteSamples": [
      "4"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "last-digit": {
    "promptMarkdown": "Given a non-negative integer, return its last digit.\n\n**Constraints**\n- The input is an integer greater than or equal to `0`.\n\n**Example 1**\n```\ninput:\n1234\noutput: 4\n```\nThe last digit of 1234 is 4.\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\nThe last digit of 0 is 0.\n\n**Follow-up:** Can you solve this in O(1) time and O(1) space without converting the number to a string?",
    "editorialMarkdown": "The intended approach is to use the modulo operator to extract the final digit of the integer. The pattern's name is basic arithmetic manipulation. The time complexity is O(1) and the space complexity is O(1). The one trap most solvers hit is converting the number to a string and reading the last character, which works but takes the data out of the numeric domain and requires extra time and space overhead. Taking the remainder by 10 mathematically isolates the lowest place value in base 10, completely avoiding the need for type conversions.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "length-of-string": {
    "promptMarkdown": "Given a string, determine the number of characters it contains. Note that spaces are considered valid characters.\n\n**Constraints**\n- The string length is between `0` and `10^5`.\n\n**Example 1**\n```\ninput:\nhello\noutput: 5\n```\nThe word \"hello\" consists of 5 characters.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains 0 characters.\n\n**Example 3**\n```\ninput:\na\noutput: 1\n```\nA single character string has a length of 1.\n\n**Follow-up:** What is the time complexity of finding a string's length in your chosen programming language?",
    "editorialMarkdown": "The intended approach is to simply use the built-in length property or function provided by your language. This demonstrates the pattern of utilizing Built-in Methods.\n\nThe one trap most solvers hit is overthinking the problem and trying to manually iterate through the string to count characters, or mishandling whitespace characters. A space is a standard character and contributes to the total length.\n\nThe time complexity is typically O(1) in most modern languages because the length is stored as metadata with the string. If a language requires traversing the string to find a null terminator (like C), the time complexity would be O(n). The space complexity is O(1) as no additional memory is required.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "longest-word": {
    "promptMarkdown": "Given a string containing a sequence of words separated by single spaces, return the longest word in the string.\n\nIf there are multiple words that tie for the longest length, return the one that appears first in the string. If the input string is empty, return an empty string.\n\n**Constraints**\n- The input string consists of words separated by single spaces.\n- The input string may be empty.\n\n**Example 1**\n```\ninput:\nthe quick brown fox\noutput: quick\n```\nBoth \"quick\" and \"brown\" have a length of 5, but \"quick\" appears first.\n\n**Example 2**\n```\ninput:\naa bb\noutput: aa\n```\nBoth words have a length of 2, so the first word is chosen.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty input yields an empty output.\n\n**Follow-up:** Can you solve this with a single pass through the string without splitting it into an intermediate list of words?",
    "editorialMarkdown": "The intended approach is to parse the string into words and maintain a running maximum for the longest word seen so far. This uses the running best pattern over sequences.\n\nThe time complexity is O(n) where n is the length of the string, as we must examine every character. The space complexity is O(n) if the string is split into an array of words, or O(1) if parsing character by character.\n\nThe one trap most solvers hit is the tie-breaking condition. Using a strictly greater than operator (`>`) correctly preserves the first longest word found, whereas a greater than or equal to operator (`>=`) would incorrectly overwrite the running best with a later word of the same length.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "min-and-max": {
    "promptMarkdown": "Given a list of integers, return two numbers: the smallest number in the list followed by the largest number in the list.\n\n**Constraints**\n- The list will always contain at least one integer.\n- The integers can be negative, zero, or positive.\n\n**Example 1**\n```\ninput:\n3 1 4 1 5\noutput: 1 5\n```\nThe smallest number is 1 and the largest is 5.\n\n**Example 2**\n```\ninput:\n7\noutput: 7 7\n```\nSince 7 is the only element, it is both the smallest and the largest.\n\n**Follow-up:** Can you solve this in a single pass with O(1) auxiliary space?",
    "editorialMarkdown": "The intended approach is to initialize both the minimum and maximum trackers to the first element of the list, then iterate through the rest of the list once, updating the bounds as needed. The pattern's name is running best. Time complexity is O(n) and space complexity is O(1). The one trap most solvers hit is initializing the minimum value to 0 or another arbitrary constant. If the list contains only numbers greater than 0, a starting minimum of 0 will be incorrectly returned as the answer. By seeding the starting values directly from the input array, the logic safely accommodates negatives.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "most-frequent-character": {
    "promptMarkdown": "Find the character that appears most often in a given string and return it as a one-character string. If two or more characters tie for the most frequent, return the one that appears first in the original string.\n\n**Constraints**\n- The input string contains only lowercase English letters and no spaces.\n- The input string is never empty.\n\n**Example 1**\n```\ninput:\naabbbcc\noutput: b\n```\nThe character b appears 3 times, which is more than a or c.\n\n**Example 2**\n```\ninput:\nabc\noutput: a\n```\nAll characters appear once, so the first character in the string is returned.\n\n**Follow-up:** Can you solve this in O(n) time complexity?",
    "editorialMarkdown": "The intended approach involves two passes: one to count the frequencies of each character using a hash map, and a second pass over the original string to find the character with the highest count. The pattern's name is frequency counting. Time complexity is O(n) and space complexity is O(k) where k is the size of the alphabet. The one trap most solvers hit is iterating over the hash map to find the maximum count instead of the original string. Because hash maps do not preserve order in many languages, iterating over the map will return an arbitrary character in the event of a tie. By iterating over the original string to find the maximum frequency, we guarantee that the first character to reach that frequency in the text is chosen.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "nth-character": {
    "promptMarkdown": "Given a string and an integer index, return the character at that specific zero-based index as a string. If the index is out of bounds (greater than or equal to the length of the string), return an empty string.\n\n**Constraints**\n- The string length is between `0` and `10^4`.\n- The index is a non-negative integer.\n\n**Example 1**\n```\ninput:\nhello\n1\noutput: e\n```\nThe character at index 1 is 'e', since indices are zero-based.\n\n**Example 2**\n```\ninput:\nhello\n9\noutput: \n```\nThe index 9 is beyond the length of the string, so an empty string is returned.\n\n**Follow-up:** Can you solve this with O(1) time complexity?",
    "editorialMarkdown": "The optimal approach is to directly access the character at the given index after explicitly verifying that the index is within the valid bounds of the string. This reflects a simple Array/String Indexing pattern.\n\nThe one trap most solvers hit is the off-by-one error when checking bounds. The valid indices for a string of length `L` are `0` through `L - 1`. If the condition is written as `index <= length` instead of `index < length`, an out-of-bounds index will slip through, potentially causing a runtime exception depending on the language.\n\nThe time complexity is O(1) because accessing a character by index and checking the length of a string take constant time. The space complexity is O(1) as we only return a single character string.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "palindrome-check": {
    "promptMarkdown": "Determine whether a given string reads the same forwards and backwards. Return `true` if it is a palindrome, and `false` otherwise. Compare the characters exactly as they are provided, without removing spaces.\n\n**Constraints**\n- The input string will consist of lowercase letters and spaces.\n- The string length is between 0 and 100,000.\n\n**Example 1**\n```\ninput:\nracecar\noutput: true\n```\nThe string racecar reads the same forwards and backwards.\n\n**Example 2**\n```\ninput:\nhello\noutput: false\n```\nThe string hello is not a palindrome.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) extra space without allocating a reversed string?",
    "editorialMarkdown": "The intended approach is to initialize two pointers, one at the beginning of the string and one at the end, and walk them inwards towards the center. The pattern's name is two pointers. Time complexity is O(n) and space complexity is O(1). The one trap most solvers hit is building a completely reversed string in memory and then comparing it to the original. While technically correct, this approach allocates O(n) extra space and always processes the entire string, even if the mismatch occurs immediately on the first character. The two-pointer approach avoids this and halts on the first discrepancy.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "product-of-list": {
    "promptMarkdown": "Given a list of integers, compute and return the product of all the numbers in the list. If the list is empty, return `1`.\n\n**Constraints**\n- The list length is between `0` and `100`.\n- The elements are small enough that the final product fits within a standard integer type.\n\n**Example 1**\n```\ninput:\n2 3 4\noutput: 24\n```\nThe product is 2 * 3 * 4 = 24.\n\n**Example 2**\n```\ninput:\n\noutput: 1\n```\nThe product of an empty list is 1.\n\n**Follow-up:** Can you compute the product in O(n) time and O(1) extra space?",
    "editorialMarkdown": "The standard approach is to initialize an accumulator variable and multiply it by each element in the list as you iterate through it. This is a classic Accumulator pattern.\n\nThe one trap most solvers hit is initializing the accumulator to `0` instead of `1`. Because `1` is the multiplicative identity, initializing to `0` will cause all subsequent multiplications to yield `0`, leading to an incorrect result for any input. Furthermore, returning `1` for an empty list gracefully aligns with this identity.\n\nThe time complexity is O(n), where n is the number of elements in the list, since we must visit each element once. The space complexity is O(1) because we only need a single variable to store the running product.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "range-from-one": {
    "promptMarkdown": "Given an integer `n`, return a list containing all the numbers from `1` up to and including `n` in ascending order. If `n` is `0`, return an empty list.\n\n**Constraints**\n- `0 <= n <= 10^4`\n\n**Example 1**\n```\ninput:\n4\noutput: 1 2 3 4\n```\nThe list contains integers from 1 up to 4, inclusive.\n\n**Example 2**\n```\ninput:\n0\noutput: \n```\nSince n is 0, the resulting list is empty.\n\n**Follow-up:** What is the space complexity of your solution?",
    "editorialMarkdown": "The straightforward approach is to use a loop that starts at 1 and increments until it reaches `n`, appending each number to a list. This demonstrates a standard Sequence Generation pattern.\n\nThe one trap most solvers hit is writing the loop continuation condition incorrectly, specifically by using `< n` instead of `<= n`. Because the problem requires the sequence to include `n` itself, stopping strictly before `n` drops the final element.\n\nThe time complexity is O(n) because we execute the loop `n` times to generate the sequence. The space complexity is O(n) since we need to store all `n` integers in the output list.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "remove-duplicates-in-order": {
    "promptMarkdown": "Given a list of integers, remove any duplicate values while preserving the original order of their first appearance.\n\n**Constraints**\n- The list length is between `0` and `10^4`.\n- The elements are integers between `-10^5` and `10^5`.\n\n**Example 1**\n```\ninput:\n1 2 1 3\noutput: 1 2 3\n```\nThe second appearance of 1 is removed, and the initial order of 1, 2, and 3 is maintained.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty list remains empty.\n\n**Follow-up:** Can you solve this in O(n) time complexity?",
    "editorialMarkdown": "The optimal approach is to iterate through the list and maintain a hash set of the items we've seen so far. For each item, if it is not in the set, we add it to the set and append it to our result list. This combines the Seen-Before pattern with an order-preserving data structure.\n\nThe one trap most solvers hit is converting the list directly into a set and back into a list to remove duplicates. While this takes only one line of code in many languages, it destroys the original order because sets are inherently unordered collections. The problem explicitly demands that the first appearance order is preserved.\n\nThe time complexity is O(n) since we iterate through the `n` elements in the list once, and hash set lookups and insertions take O(1) time on average. The space complexity is O(n) to store the seen elements in the hash set and the unique elements in the output list.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "repeat-a-string": {
    "promptMarkdown": "Given a string and a non-negative integer representing a count, return a new string that repeats the original string the specified number of times with no characters in between.\n\n**Constraints**\n- The string length is between `0` and `1000`.\n- The repeat count is between `0` and `1000`.\n\n**Example 1**\n```\ninput:\nab\n3\noutput: ababab\n```\nThe string \"ab\" is repeated 3 times.\n\n**Example 2**\n```\ninput:\nx\n0\noutput: \n```\nRepeating any string 0 times results in an empty string.\n\n**Follow-up:** Are strings mutable or immutable in your programming language, and how does this affect performance?",
    "editorialMarkdown": "The standard approach is to start with an empty string and repeatedly append or concatenate the target string in a loop. This falls under the String Concatenation pattern.\n\nThe one trap most solvers hit is poor performance caused by naive string concatenation. In languages where strings are immutable (like Java, Python, or C#), appending to a string in a loop creates a completely new string in memory during each iteration. This leads to an O(n^2) time complexity. Using a built-in string repeat function or a specialized string builder class avoids this issue.\n\nAssuming an efficient built-in function or a string builder is used, the time complexity is O(n * k), where n is the length of the string and k is the repetition count. The space complexity is also O(n * k) to hold the final resulting string.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "reverse-a-list": {
    "promptMarkdown": "Given a list of integers, return a new list with the elements in the opposite order.\n\nRepeated values should keep their relative reversed order. If the input list is empty, return an empty list.\n\n**Constraints**\n- The list can contain duplicate integers.\n- The list can be empty.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 3 2 1\n```\nThe entire list is reversed.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty list is returned as empty.\n\n**Example 3**\n```\ninput:\n7\noutput: 7\n```\nA single-element list remains the same.\n\n**Follow-up:** Can you reverse the list in-place?",
    "editorialMarkdown": "The standard approach is to build a new list by iterating backward through the input list and appending each element to the result. This leverages the array indexing pattern.\n\nThe time complexity is O(n) where n is the length of the list, as each element is visited once. The space complexity is O(n) since a new list is constructed to hold the reversed elements.\n\nThe one trap most solvers hit when attempting an in-place swap is iterating over the entire list instead of stopping at the midpoint. If the loop runs all the way to the end, every pair of elements is swapped twice, causing the list to return to its original order.",
    "promoteSamples": [
      "7"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "reverse-a-string": {
    "promptMarkdown": "Given a string, return a new string with its characters in the exact opposite order.\n\nSpaces and all other characters are treated identically and must be reversed. If the input string is empty, return an empty string.\n\n**Constraints**\n- The string may contain spaces and any standard characters.\n- The string may be empty.\n\n**Example 1**\n```\ninput:\nhello\noutput: olleh\n```\nThe characters of the string are reversed.\n\n**Example 2**\n```\ninput:\na\noutput: a\n```\nA single-character string remains the same.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty string returns an empty string.\n\n**Follow-up:** Can you implement this manually using a loop without relying on built-in string reversal functions?",
    "editorialMarkdown": "The intended approach, while often achievable with standard library functions, is to iterate backward over the indices of the string from the last index down to zero, constructing a new string or list of characters along the way. This employs a reverse iteration pattern.\n\nThe time complexity is O(n) because every character is processed exactly once. The space complexity is O(n) since a new string must be allocated to hold the result, especially in languages where strings are immutable.\n\nThe one trap most solvers hit is an off-by-one error with the loop boundaries. Starting the loop at the string's length rather than length minus one causes an out-of-bounds error, while stopping the loop strictly greater than zero silently skips the first character of the original string.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "running-totals": {
    "promptMarkdown": "Given a list of integers, return a list where each element at a given position is the cumulative sum of all elements up to and including that position in the input list.\n\n**Constraints**\n- The input list may contain negative and positive integers.\n- The input list may be empty.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 1 3 6\n```\nThe running sums are 1, 1+2=3, and 1+2+3=6.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty input list yields an empty output list.\n\n**Example 3**\n```\ninput:\n5\noutput: 5\n```\nA single-element list yields a list with just that element.\n\n**Follow-up:** Can you compute the totals without a nested loop?",
    "editorialMarkdown": "The intended approach is to maintain a single running accumulator variable that keeps a tally as you iterate through the list, appending the current sum to the output at each step. This is known as the prefix sum pattern.\n\nThe time complexity is O(n) since we iterate through the list exactly once. The space complexity is O(n) to store the output list of running totals.\n\nThe one trap most solvers hit is calculating the sum from scratch for every index using nested loops. This recomputation unnecessarily raises the time complexity to O(n^2), defeating the efficiency of carrying the running total forward.",
    "promoteSamples": [
      "5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "second-largest-number": {
    "promptMarkdown": "Given a list of integers, find the second largest distinct value in the list.\n\nIf there is no second distinct value, return `-1`. This can happen if the list contains fewer than two distinct numbers.\n\n**Constraints**\n- The list may contain duplicate numbers.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 2\n```\nThe largest distinct value is 3, and the second largest is 2.\n\n**Example 2**\n```\ninput:\n5 5\noutput: -1\n```\nThere is no second distinct value, so -1 is returned.\n\n**Example 3**\n```\ninput:\n3\noutput: -1\n```\nThe list contains only one number, so there is no second distinct value.\n\n**Follow-up:** Can you find the answer in a single pass without sorting the list?",
    "editorialMarkdown": "The intended approach is to track both the largest and second-largest values simultaneously in a single pass through the list. This relies on the pattern of maintaining multiple running bests.\n\nThe time complexity is O(n) because each number in the list is examined exactly once. The space complexity is O(1) as only a few variables are needed to store the current best values.\n\nThe one trap most solvers hit is mismanaging the update logic when a new maximum is found. If you overwrite the current maximum before assigning its previous value to the second maximum, the previous best value is lost entirely. Another common pitfall is forgetting to enforce distinctness, which can cause the second-largest value to equal the largest when duplicates are present.",
    "promoteSamples": [
      "3"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "shout-the-line": {
    "promptMarkdown": "Given a string consisting of lowercase letters and spaces, return the exact same string with all lowercase letters converted to uppercase.\n\nSpaces should be left completely unchanged.\n\n**Constraints**\n- The string may be empty.\n- Only lowercase English letters and spaces are expected.\n\n**Example 1**\n```\ninput:\nhello world\noutput: HELLO WORLD\n```\nAll letters are converted to uppercase while the space remains untouched.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty string is returned empty.\n\n**Example 3**\n```\ninput:\na\noutput: A\n```\nA single letter is converted to uppercase.\n\n**Follow-up:** What edge cases occur when relying on character arithmetic rather than built-in string methods?",
    "editorialMarkdown": "The intended approach is to use the standard library's uppercase conversion function, relying on built-in tools for case manipulation. This represents a direct case-conversion pattern.\n\nThe time complexity is O(n) since every character in the string must be evaluated and potentially modified. The space complexity is O(n) to store the new uppercase string.\n\nThe one trap most solvers hit is attempting to write manual character arithmetic by subtracting an offset from ASCII values. While this works for basic English alphabets, it breaks entirely on symbols, unexpected characters, and non-English alphabets with complex casing rules. Relying on library functions avoids this fragility.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "smallest-number": {
    "promptMarkdown": "Given a list of integers, find and return the smallest number present in the list.\n\nThe numbers can be positive, zero, or negative.\n\n**Constraints**\n- The input list will always contain at least one number.\n\n**Example 1**\n```\ninput:\n3 1 2\noutput: 1\n```\nThe smallest number in the list is 1.\n\n**Example 2**\n```\ninput:\n-5 -2\noutput: -5\n```\nAmong the negative numbers, -5 is the smallest.\n\n**Example 3**\n```\ninput:\n7\noutput: 7\n```\nWhen there is only one element, it is the smallest.\n\n**Follow-up:** Does your approach work safely for negative numbers without arbitrary constants?",
    "editorialMarkdown": "The intended approach is to initialize a variable with the first element of the list and then iterate through the remaining elements, updating the variable whenever a smaller value is encountered. This is the running minimum pattern.\n\nThe time complexity is O(n) because each number in the list must be checked against the current minimum. The space complexity is O(1) since only a single variable is maintained for the state.\n\nThe one trap most solvers hit is initializing the running minimum to zero or a hardcoded large constant. If all numbers in the list are greater than zero, initializing with zero will wrongly output zero instead of the true minimum. Always initialize the running best with the first actual element of the data.",
    "promoteSamples": [
      "7"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "starts-with-vowel": {
    "promptMarkdown": "Determine if a given string begins with a lowercase vowel (`a`, `e`, `i`, `o`, `u`). If the string is empty, it does not start with a vowel.\n\n**Constraints**\n- `0 <= length of string <= 10^4`\n- The string consists only of lowercase English letters.\n\n**Example 1**\n```\ninput:\napple\noutput: true\n```\nThe first character is 'a', which is a vowel.\n\n**Example 2**\n```\ninput:\nbanana\noutput: false\n```\nThe first character is 'b', which is not a vowel.\n\n**Example 3**\n```\ninput:\n\noutput: false\n```\nAn empty string has no first character, so it does not start with a vowel.\n\n**Follow-up:** Can you determine the answer in O(1) time and O(1) space complexity?",
    "editorialMarkdown": "The intended approach requires checking two conditions: whether the string has any characters at all, and whether its first character is a vowel. This pattern is fundamental when dealing with sequence indexing, as you must guarantee a character exists before attempting to read it.\n\nMost programming languages use short-circuit evaluation for logical AND operations. Checking if the length is greater than zero before checking the first character is safe because if the string is empty, the second condition is never evaluated. The common trap solvers hit is reversing the order of these checks, or omitting the length check entirely, which results in an out-of-bounds error when reading the first character of an empty string.\n\nThe time complexity is O(1) because we only check the first character, and the space complexity is O(1) as no additional memory is required.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-comma-separated": {
    "promptMarkdown": "You are given a raw text string containing comma-separated numbers. Add up the numbers and return the total sum. There are no spaces in the string, and numbers may be negative. If the string is empty, the sum should be `0`.\n\n**Constraints**\n- `0 <= length of string <= 10^4`\n- The string consists of comma-separated integers without spaces.\n\n**Example 1**\n```\ninput:\n3,4,5\noutput: 12\n```\nThe sum of 3, 4, and 5 is 12.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty line has no numbers, so the sum is 0.\n\n**Example 3**\n```\ninput:\n42\noutput: 42\n```\nThe only number is 42, which is the sum.\n\n**Follow-up:** Can you process the string and calculate the sum in O(n) time, where n is the length of the string?",
    "editorialMarkdown": "The intended approach involves two distinct steps: parsing the raw string into individual pieces and then converting those pieces into integers to be summed. This split-then-convert pattern is essential for handling real-world text input.\n\nYou can split the input string by commas to get an array of string tokens, iterate over them, convert each to an integer, and accumulate the total. The most common trap solvers hit is not handling the empty string correctly. In many languages, splitting an empty string by a comma results in an array containing a single empty string, rather than an empty array. Attempting to convert an empty string into a number will crash the program. To avoid this, explicitly check if the input string is empty before attempting to split it.\n\nThis approach operates in O(n) time complexity, where n is the length of the string, since both splitting and iterating take linear time. The space complexity is O(n) to store the split string pieces.",
    "promoteSamples": [
      "42"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-a-digit-string": {
    "promptMarkdown": "You are given a string consisting entirely of digit characters. Treat each character as a separate number, add them up, and return the total sum. There are no spaces, signs, or other characters in the string. If the string is empty, the total should be `0`.\n\n**Constraints**\n- `0 <= length of string <= 10^4`\n- The string contains only digits from `0` to `9`.\n\n**Example 1**\n```\ninput:\n1234\noutput: 10\n```\nThe digits 1, 2, 3, and 4 sum up to 10.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string evaluates to a sum of 0.\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\nThe only digit is 0, so the sum is 0.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space complexity?",
    "editorialMarkdown": "The intended approach is to iterate over each character in the string, explicitly convert it to its numeric value, and add it to a running total. This is a classic accumulator pattern applied to character parsing.\n\nA digit character like '7' is stored as a numeric code, not as the number 7 itself. The most common trap solvers hit is either adding the character codes directly, resulting in a massively inflated sum, or inadvertently concatenating the characters as strings instead of performing mathematical addition. By deliberately converting each character to an integer before adding it to the accumulator, you ensure mathematically correct behavior.\n\nThe time complexity is O(n), where n is the length of the string, as you must process each character exactly once. The space complexity is O(1) because you only need a single variable to maintain the running total.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-array": {
    "promptMarkdown": "You are given a list of whole numbers. Add up every number in the list and return their total sum. If the list is empty, the sum should be `0`.\n\n**Constraints**\n- `0 <= length of list <= 10^4`\n- `-10^4 <= elements in the list <= 10^4`\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 10\n```\nThe numbers 1, 2, 3, and 4 add up to 10.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list evaluates to a total of 0.\n\n**Example 3**\n```\ninput:\n-5 5\noutput: 0\n```\nThe positive and negative numbers cancel each other out to 0.\n\n**Follow-up:** Can you find the sum in O(n) time and O(1) space complexity?",
    "editorialMarkdown": "The intended approach uses the accumulator pattern. You initialize a variable to hold the running total before starting a loop, then iterate through the list and add each element to this total.\n\nThere are two common traps that solvers hit. The first is declaring the accumulator variable inside the loop, which causes it to reset on every iteration and ultimately return only the last element. The second trap is initializing the accumulator to something other than zero. Zero is the identity value for addition, meaning it will perfectly handle an empty list without needing any special edge-case conditions—the loop simply won't execute, and the function correctly returns zero.\n\nThe time complexity is O(n), where n is the number of elements in the array, as you have to visit every element once. The space complexity is O(1) since only a single accumulator variable is needed.",
    "promoteSamples": [
      "-5 5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-digits": {
    "promptMarkdown": "You are given a single whole number, zero or greater. Add up the individual digits of this number and return the sum.\n\n**Constraints**\n- `0 <= number <= 10^9`\n\n**Example 1**\n```\ninput:\n123\noutput: 6\n```\nThe digits 1, 2, and 3 sum up to 6.\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\nThe only digit is 0, so the sum is 0.\n\n**Example 3**\n```\ninput:\n9\noutput: 9\n```\nThe only digit is 9, so the sum is 9.\n\n**Follow-up:** Can you solve this mathematically without converting the number to a string?",
    "editorialMarkdown": "The intended approach extracts each digit mathematically using the modulo and integer division operators, which is a core pattern for base conversion and numerical manipulation.\n\nIn a loop, you can extract the last digit of the number using modulo 10 (`% 10`), add it to a running total, and then remove the last digit by performing integer division by 10 (`/ 10`). A frequent trap solvers hit is writing a loop condition like `while n > 0` but forgetting to handle an input of exactly `0`. If the running total is initialized to `0`, this works out correctly, but relying on this behavior blindly without understanding it can lead to bugs in similar algorithms where zero should be processed inside the loop.\n\nThe time complexity is O(d), where d is the number of digits in the integer, and the space complexity is O(1) since it uses only a few variables.",
    "promoteSamples": [
      "9"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-even-numbers": {
    "promptMarkdown": "You are given a list of whole numbers. Add together only the even numbers in the list, completely ignoring the odd ones, and return the total. Zero is considered even.\n\n**Constraints**\n- `0 <= length of list <= 10^4`\n- `-10^4 <= elements in the list <= 10^4`\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 6\n```\nThe even numbers are 2 and 4, which add up to 6.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list evaluates to a total of 0.\n\n**Example 3**\n```\ninput:\n1 3 5\noutput: 0\n```\nThere are no even numbers, so the sum is 0.\n\n**Follow-up:** Can you filter and sum the numbers in a single pass with O(1) extra space?",
    "editorialMarkdown": "The intended approach combines filtering and the accumulator pattern in a single loop. You maintain a running total outside the loop and use an `if` statement inside to check whether the current number is even before adding it.\n\nThe condition to check if a number is even is `n % 2 == 0`. The trap solvers frequently hit is using a condition like `n % 2 == 1` or `n % 2 != 1` to define odd and then inverting it. In many languages, the modulo operator retains the sign of the dividend, meaning `-3 % 2` evaluates to `-1`. If you check against `1`, an odd negative number will slip through and mistakenly be treated as even. Checking against `0` directly is mathematically safer since zero has no sign.\n\nThe time complexity is O(n), requiring one pass over the array, and the space complexity is O(1) since it only needs a running total variable.",
    "promoteSamples": [
      "1 3 5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-positives": {
    "promptMarkdown": "You are given a list of whole numbers. Add up only the numbers that are strictly greater than zero and return the total. Negative numbers and zero are ignored.\n\n**Constraints**\n- `0 <= length of list <= 10^4`\n- `-10^4 <= elements in the list <= 10^4`\n\n**Example 1**\n```\ninput:\n1 -2 3\noutput: 4\n```\nThe positive numbers are 1 and 3, which sum up to 4.\n\n**Example 2**\n```\ninput:\n-1 -2\noutput: 0\n```\nThere are no positive numbers, so the total is 0.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty list has no positive numbers, so the total is 0.\n\n**Follow-up:** Can you accomplish this with O(1) space complexity?",
    "editorialMarkdown": "This approach utilizes filtering within an accumulator loop. As you iterate through each element, you only add it to the running total if it satisfies the condition of being positive.\n\nA common trap solvers hit is misunderstanding the boundary definition—specifically, whether zero counts as a positive number. In mathematics, zero is neither positive nor negative. Therefore, the filtering condition must be `n > 0`, rather than `n >= 0`. Additionally, solvers sometimes try to write a separate edge case for arrays containing no positive numbers, which is unnecessary. By initializing the running total to zero, an empty or all-negative list safely bypasses the addition and correctly returns zero.\n\nThe time complexity is O(n), as the algorithm inspects every element exactly once. The space complexity is O(1) since no extra memory is needed beyond the accumulator variable.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "sum-of-squares": {
    "promptMarkdown": "You are given a list of whole numbers. Square every number, then add the results together and return the total sum.\n\n**Constraints**\n- `0 <= length of list <= 10^4`\n- `-10^4 <= elements in the list <= 10^4`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 14\n```\nThe squares are 1, 4, and 9, which add up to 14.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list evaluates to a total of 0.\n\n**Example 3**\n```\ninput:\n-3\noutput: 9\n```\nThe square of -3 is 9, which is the total sum.\n\n**Follow-up:** Can you calculate the total in a single loop without creating a new array?",
    "editorialMarkdown": "The intended approach transforms and accumulates the elements in a single pass. Rather than allocating a new array to store the squared values and then summing them, you can directly add the square of each element to a running total as you iterate through the input array.\n\nA minor trap solvers hit involves the handling of negative numbers. Because the square of any real number is always non-negative (e.g., `-3 * -3 = 9`), there is no need to take the absolute value of the numbers before squaring them. Attempting to use an absolute value function first is redundant and adds unnecessary computational steps without changing the result.\n\nThe time complexity is O(n), as you process each number once. The space complexity is O(1) if computed in a single pass with an accumulator.",
    "promoteSamples": [
      "-3"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "swap-first-and-last": {
    "promptMarkdown": "Given a list of integers, swap the first and last elements in the list and return the modified list. \n\nAll other elements must remain in their original positions. If the list contains fewer than two elements, return it unchanged.\n\n**Constraints**\n- `0 <= list.length <= 10^5`\n- Elements are valid integers.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 3 2 1\n```\nThe first element 1 and the last element 3 are swapped.\n\n**Example 2**\n```\ninput:\n1\noutput: 1\n```\nA single-element list is returned unchanged.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty list is returned unchanged.\n\n**Follow-up:** Can you perform this swap in-place?",
    "editorialMarkdown": "The intended approach is to use multiple assignment or a temporary variable to swap the elements at index `0` and `length - 1`. The pattern here is basic array indexing. Time complexity is O(1) and space complexity is O(1) since the swap can be done in-place. The one trap most solvers hit is failing to check if the list has fewer than two elements before attempting to access the first and last indices, which can lead to out-of-bounds or undefined behavior errors depending on the language.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "swap-letter-case": {
    "promptMarkdown": "Given a string of characters, return a new string with every uppercase letter converted to lowercase, and every lowercase letter converted to uppercase.\n\nAny characters that are not letters, such as spaces, digits, or punctuation, must be copied to the output unchanged.\n\n**Constraints**\n- `0 <= string.length <= 10^5`\n- The string consists of printable ASCII characters.\n\n**Example 1**\n```\ninput:\nHello World\noutput: hELLO wORLD\n```\nThe uppercase 'H' and 'W' become lowercase, while the lowercase letters become uppercase. The space remains unchanged.\n\n**Example 2**\n```\ninput:\nA1b2\noutput: a1B2\n```\nThe digits '1' and '2' remain unchanged while the letters flip their case.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty string returns an empty string.\n\n**Follow-up:** Can you solve this in a single pass?",
    "editorialMarkdown": "The intended approach is to iterate through the string and build a new result by checking the case of each character. The pattern is string traversal and character transformation. Time complexity is O(n) and space complexity is O(n) where n is the length of the string. The one trap most solvers hit is using a simple if/else with only two branches (e.g., if uppercase then lowercase, else uppercase) without realizing that this will incorrectly attempt to uppercase non-letter characters. An explicit third branch is needed to pass non-letter characters through unmodified.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "to-snake-case": {
    "promptMarkdown": "Given a string of lowercase words separated by single spaces, convert the string to snake case by replacing all spaces with underscores. \n\nThe input string will not contain leading or trailing spaces.\n\n**Constraints**\n- `0 <= string.length <= 10^5`\n- The string consists of lowercase English letters and single spaces.\n- There are no leading or trailing spaces.\n\n**Example 1**\n```\ninput:\nhello world here\noutput: hello_world_here\n```\nThe spaces between the words are replaced by underscores.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty string is returned unchanged.\n\n**Example 3**\n```\ninput:\na\noutput: a\n```\nA single word without spaces is returned unchanged.\n\n**Follow-up:** Can you solve this with time and space complexity proportional to the string length?",
    "editorialMarkdown": "The intended approach is to either perform a direct string replacement of spaces with underscores, or to split the string into words and join them back together using underscores as the delimiter. The pattern is string manipulation and delimiter replacement. Time complexity is O(n) and space complexity is O(n) to store the new string. The one trap most solvers hit is attempting to manually construct the string character-by-character without recognizing that simple built-in replace or split-and-join methods handle empty strings and single words cleanly without needing edge-case guards.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
};
