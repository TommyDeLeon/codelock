import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-141` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_141_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "common-elements-in-multiple-datasets",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Loyal Event Attendees",
    patternTags: ["arrays","hash-map","counting","sorting"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "A marketing agency tracks the IDs of visitors who attend their events. You are provided with a 2D array of integers `events`, where each sub-array contains the visitor IDs for a distinct event. Every ID within a single event's list is guaranteed to be distinct.\n\nYour objective is to find the IDs of attendees who participated in all recorded events. Return these IDs in a single array, ordered from lowest to highest.\n\n**Constraints**\n- `1 <= events.length <= 100`\n- `1 <= events[i].length <= 100`\n- `1 <= events[i][j] <= 1000`\n\n**Example 1**\n```\ninput:\n  3 1 2 4 5;1 2 3 4;3 4 5 6\noutput:\n  3 4\n```\n*Explanation: Visitor IDs 3 and 4 are present in the attendance logs of all three events. They are output in ascending order.*\n\n**Example 2**\n```\ninput:\n  1 2 3;4 5 6\noutput:\n  \n```\n*Explanation: There are no IDs that appear in every event log, resulting in an empty array.*\n\n**Example 3**\n```\ninput:\n  10 20 30;20;20 10\noutput:\n  20\n```\n*Explanation: Only visitor ID 20 attended all the events.*\n\n**Follow-up**\nCan you figure out an in-place approach that reuses the memory of the provided arrays to lower your space overhead?",
    editorialMarkdown: "## Common Elements in Multiple Datasets\n\nThe problem asks us to find all integers that appear in every provided dataset (array) and return them in sorted order.\n\nA straightforward and optimal approach is to count the frequency of each integer across all datasets. We can use a hash map or an array (since the constraints might be small) to keep track of how many datasets each integer appears in. Because the problem states that integers within a single dataset are unique, an integer will appear exactly `datasets.length` times in total if and only if it is present in every single dataset.\n\nAfter counting, we collect all integers whose frequency equals the number of datasets, and then sort this result array.\n\n**Trap**: A common trap is forgetting to sort the final result, or assuming the hash map's iteration order is inherently sorted. While some languages preserve insertion order or sort integer keys automatically, explicitly sorting the final array guarantees correctness.\n\n**Complexity:**\n- **Time:** O(N + K log K) where N is the total number of elements across all datasets, and K is the number of common elements. We iterate through all elements once to count them, then sort the K common elements.\n- **Space:** O(U) where U is the number of unique elements across all datasets, required for the frequency map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(datasets) {\n    // Count how many datasets each value appears in.\n    let counts = {};\n    for (let arr of datasets) {\n        for (let num of arr) {\n            counts[num] = (counts[num] || 0) + 1;\n        }\n    }\n    let res = [];\n    for (let key in counts) {\n        if (counts[key] === datasets.length) {\n            res.push(Number(key));\n        }\n    }\n    // Insertion sort, ascending.\n    for (let i = 1; i < res.length; i++) {\n        let value = res[i];\n        let j = i - 1;\n        while (j >= 0 && res[j] > value) {\n            res[j + 1] = res[j];\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(datasets: number[][]): number[] {\n    // Count how many datasets each value appears in.\n    let counts: Record<number, number> = {};\n    for (let arr of datasets) {\n        for (let num of arr) {\n            counts[num] = (counts[num] || 0) + 1;\n        }\n    }\n    let res: number[] = [];\n    for (let key in counts) {\n        if (counts[key] === datasets.length) {\n            res.push(Number(key));\n        }\n    }\n    // Insertion sort, ascending.\n    for (let i = 1; i < res.length; i++) {\n        const value = res[i]!;\n        let j = i - 1;\n        while (j >= 0 && res[j]! > value) {\n            res[j + 1] = res[j]!;\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      PYTHON: "def solve(datasets):\n    # Count how many datasets each value appears in.\n    counts = {}\n    for arr in datasets:\n        for num in arr:\n            counts[num] = counts.get(num, 0) + 1\n    res = []\n    for k, v in counts.items():\n        if v == len(datasets):\n            res.append(k)\n    # Insertion sort, ascending.\n    for i in range(1, len(res)):\n        value = res[i]\n        j = i - 1\n        while j >= 0 and res[j] > value:\n            res[j + 1] = res[j]\n            j -= 1\n        res[j + 1] = value\n    return res",
      JAVA: "    static int[] solve(int[][] datasets) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int[] arr : datasets) {\n            for (int num : arr) {\n                counts.put(num, counts.getOrDefault(num, 0) + 1);\n            }\n        }\n        java.util.List<Integer> res = new java.util.ArrayList<>();\n        for (java.util.Map.Entry<Integer, Integer> entry : counts.entrySet()) {\n            if (entry.getValue() == datasets.length) {\n                res.add(entry.getKey());\n            }\n        }\n        int[] out = new int[res.size()];\n        for (int i = 0; i < res.size(); i++) out[i] = res.get(i);\n        // Insertion sort, ascending.\n        for (int i = 1; i < out.length; i++) {\n            int value = out[i];\n            int j = i - 1;\n            while (j >= 0 && out[j] > value) {\n                out[j + 1] = out[j];\n                j--;\n            }\n            out[j + 1] = value;\n        }\n        return out;\n    }",
      CPP: "#include <vector>\n#include <map>\n\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> datasets) {\n    // Count how many datasets each value appears in.\n    map<int, int> counts;\n    for (const vector<int>& arr : datasets) {\n        for (int num : arr) {\n            counts[num] += 1;\n        }\n    }\n    vector<int> res;\n    for (const auto& entry : counts) {\n        if (entry.second == (int)datasets.size()) {\n            res.push_back(entry.first);\n        }\n    }\n    // Insertion sort, ascending.\n    for (size_t i = 1; i < res.size(); i++) {\n        int value = res[i];\n        int j = (int)i - 1;\n        while (j >= 0 && res[j] > value) {\n            res[j + 1] = res[j];\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      GO: "func solve(datasets [][]int) []int {\n    counts := make(map[int]int)\n    for _, arr := range datasets {\n        for _, num := range arr {\n            counts[num]++\n        }\n    }\n    res := []int{}\n    for key, val := range counts {\n        if val == len(datasets) {\n            res = append(res, key)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "3 1 2 4 5;1 2 3 4;3 4 5 6", expectedStdout: "3 4", isSample: true },
      { stdin: "1 2 3;4 5 6", expectedStdout: "", isSample: true },
      { stdin: "10 20 30;20;20 10", expectedStdout: "20" },
      { stdin: "1 2 3;1 2 3;1 2 3", expectedStdout: "1 2 3" },
      { stdin: "999", expectedStdout: "999" },
      { stdin: "1;1", expectedStdout: "1" },
      { stdin: "1;2;3", expectedStdout: "" },
      { stdin: "5 10 15;10 5;10 5 20", expectedStdout: "5 10" },
    ],
  }),

  p({
    ...base,
    slug: "synchronized-data-streams",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "LINKED_LIST",
    title: "Synchronized Data Streams",
    patternTags: ["linked-list","two-pointers","arrays"],
    signatureId: "fn:list,list->list",
    avgSolveSeconds: 720,
    promptMarkdown: "You are given two linked lists, `list1` and `list2`, representing two separate data streams that eventually merge and produce identical sequences of values until the end. \n\nHowever, one stream might start earlier or have a longer independent prefix than the other. Find the sublist starting from the point where the two streams merge (i.e., the start of their longest common suffix of values). Return the merged sublist. \n\nIf they never merge (they do not share any common suffix of values), return an empty list.\n\n**Constraints**\n- The number of nodes in `list1` and `list2` is between `0` and `100`.\n- `1 <= node.val <= 1000`\n- It is guaranteed that there is no ambiguity: the longest common suffix is the only sequence of matching values that reaches the end of both lists.\n\n**Example 1**\n```\ninput:\n  4 2 8 4 5\n  5 6 1 8 4 5\noutput:\n  8 4 5\n```\n*Explanation: The longest common suffix of the two streams is 8 -> 4 -> 5.*\n\n**Example 2**\n```\ninput:\n  1 9 1 2 4\n  3 2 4\noutput:\n  2 4\n```\n*Explanation: The longest common suffix is 2 -> 4.*\n\n**Example 3**\n```\ninput:\n  2 6 4\n  1 5\noutput:\n  \n```\n*Explanation: The streams do not share a common suffix.*\n\n**Follow-up**\nCould you write a solution that runs in `O(n + m)` time and uses only `O(1)` memory?",
    editorialMarkdown: "## Synchronized Data Streams\n\nThis problem asks us to find the longest common suffix of two linked lists (representing the merged path). Because the input linked lists only have equal values at the end (and don't strictly share memory in the serialization context), we can find this by comparing the lists from the back.\n\nThe optimal approach, avoiding recursion and using O(1) auxiliary space (if we had doubly linked lists), would involve length measurement. Since these are singly linked lists, a robust and simple approach is to read both lists into two arrays or stacks, and then compare elements starting from the end of both arrays. We traverse backwards as long as the values match. The last matching node we encounter (going backwards) is the start of the shared path.\n\n**Trap**: A common trap is comparing from the front, assuming the lists are the same length, or failing to return the actual node from the list (instead creating a new disconnected list which might fail strict identity checks in some environments). Reading them into arrays avoids these pitfalls smoothly.\n\n**Complexity:**\n- **Time:** O(N + M) where N and M are the lengths of the two linked lists, to traverse them and then compare backwards.\n- **Space:** O(N + M) to store the lists in arrays. (O(1) space is possible if we measure lengths first, advance the longer list's pointer by the difference, and then step through them simultaneously).",
    referenceSolution: {
      JAVASCRIPT: "function solve(l1, l2) {\n    let a = [];\n    let curr = l1;\n    while(curr) { a.push(curr); curr = curr.next; }\n    let b = [];\n    curr = l2;\n    while(curr) { b.push(curr); curr = curr.next; }\n    let i = a.length - 1;\n    let j = b.length - 1;\n    let res = null;\n    while(i >= 0 && j >= 0 && a[i].val === b[j].val) {\n        res = a[i];\n        i--;\n        j--;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(l1: any, l2: any): any {\n    let a: any[] = [];\n    let curr = l1;\n    while(curr) { a.push(curr); curr = curr.next; }\n    let b: any[] = [];\n    curr = l2;\n    while(curr) { b.push(curr); curr = curr.next; }\n    let i = a.length - 1;\n    let j = b.length - 1;\n    let res = null;\n    while(i >= 0 && j >= 0 && a[i].val === b[j].val) {\n        res = a[i];\n        i--;\n        j--;\n    }\n    return res;\n}",
      PYTHON: "def solve(l1, l2):\n    a = []\n    curr = l1\n    while curr:\n        a.append(curr)\n        curr = curr.next\n    b = []\n    curr = l2\n    while curr:\n        b.append(curr)\n        curr = curr.next\n    i = len(a) - 1\n    j = len(b) - 1\n    res = None\n    while i >= 0 and j >= 0 and a[i].val == b[j].val:\n        res = a[i]\n        i -= 1\n        j -= 1\n    return res",
      JAVA: "    static ListNode solve(ListNode l1, ListNode l2) {\n        java.util.List<ListNode> a = new java.util.ArrayList<>();\n        ListNode curr = l1;\n        while(curr != null) { a.add(curr); curr = curr.next; }\n        java.util.List<ListNode> b = new java.util.ArrayList<>();\n        curr = l2;\n        while(curr != null) { b.add(curr); curr = curr.next; }\n        int i = a.size() - 1;\n        int j = b.size() - 1;\n        ListNode res = null;\n        while(i >= 0 && j >= 0 && a.get(i).val == b.get(j).val) {\n            res = a.get(i);\n            i--;\n            j--;\n        }\n        return res;\n    }",
      CPP: "ListNode* solve(ListNode* l1, ListNode* l2) {\n    vector<ListNode*> a;\n    ListNode* curr = l1;\n    while(curr) { a.push_back(curr); curr = curr->next; }\n    vector<ListNode*> b;\n    curr = l2;\n    while(curr) { b.push_back(curr); curr = curr->next; }\n    int i = a.size() - 1;\n    int j = b.size() - 1;\n    ListNode* res = nullptr;\n    while(i >= 0 && j >= 0 && a[i]->val == b[j]->val) {\n        res = a[i];\n        i--;\n        j--;\n    }\n    return res;\n}",
      GO: "func solve(l1 *ListNode, l2 *ListNode) *ListNode {\n    a := []*ListNode{}\n    curr := l1\n    for curr != nil {\n        a = append(a, curr)\n        curr = curr.Next\n    }\n    b := []*ListNode{}\n    curr = l2\n    for curr != nil {\n        b = append(b, curr)\n        curr = curr.Next\n    }\n    i := len(a) - 1\n    j := len(b) - 1\n    var res *ListNode = nil\n    for i >= 0 && j >= 0 && a[i].Val == b[j].Val {\n        res = a[i]\n        i--\n        j--\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "4 2 8 4 5\n5 6 1 8 4 5", expectedStdout: "8 4 5", isSample: true },
      { stdin: "1 9 1 2 4\n3 2 4", expectedStdout: "2 4", isSample: true },
      { stdin: "2 6 4\n1 5", expectedStdout: "" },
      { stdin: "10 20 30\n10 20 30", expectedStdout: "10 20 30" },
      { stdin: "10\n10", expectedStdout: "10" },
      { stdin: "10\n20", expectedStdout: "" },
      { stdin: "\n10 20", expectedStdout: "" },
      { stdin: "\n", expectedStdout: "" },
    ],
  }),

  p({
    ...base,
    slug: "filter-long-transmissions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Filter Long Transmissions",
    patternTags: ["strings","arrays","filtering"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 400,
    promptMarkdown: "You are given an array of strings `transmissions`. A transmission is considered invalid if its length is strictly greater than 15 characters. \n\nReturn an array containing all invalid transmissions in their original order.\n\n**Constraints**\n- `1 <= transmissions.length <= 1000`\n- `0 <= transmissions[i].length <= 100`\n- `transmissions[i]` consists of printable characters without spaces.\n\n**Example 1**\n```\ninput:\n  Hello_World This_is_a_very_long_transmission Short_one\noutput:\n  This_is_a_very_long_transmission\n```\n*Explanation: The second string has 32 characters, which is greater than 15. The others are valid.*\n\n**Example 2**\n```\ninput:\n  Exactly_fifteen Sixteen_characts\noutput:\n  Sixteen_characts\n```\n*Explanation: \"Exactly_fifteen\" is exactly 15 characters long, so it is valid. The second string is 16 characters and thus invalid.*\n\n**Example 3**\n```\ninput:\n  Small Tiny\noutput:\n  \n```\n*Explanation: None of the transmissions exceed 15 characters, so an empty array is returned.*\n\n**Follow-up**\nCould you implement this filter without allocating a new array, by modifying the input array in-place?",
    editorialMarkdown: "## Filter Long Transmissions\n\nThis problem asks us to filter an array of strings, retaining only the strings whose length exceeds a specific threshold (15 characters).\n\nThe solution requires iterating over each element in the array and checking its length. If `string.length > 15`, we append it to our result array. Most modern programming languages offer built-in filtering operations (like `.filter()` in JavaScript or list comprehensions in Python) which allow this logic to be expressed concisely.\n\n**Trap**: A common trap is using `>= 15` instead of `> 15`. The problem explicitly states that a transmission is invalid if its length is *strictly greater* than 15.\n\n**Complexity:**\n- **Time:** O(N * L) where N is the number of strings and L is the maximum length of a string. We must scan each string to determine its length (though many languages cache string lengths, making it O(N)).\n- **Space:** O(N * L) to construct and store the resulting array of invalid transmissions.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmissions) {\n    return transmissions.filter(t => t.length > 15);\n}",
      TYPESCRIPT: "function solve(transmissions: string[]): string[] {\n    return transmissions.filter(t => t.length > 15);\n}",
      PYTHON: "def solve(transmissions):\n    return [t for t in transmissions if len(t) > 15]",
      JAVA: "    static String[] solve(String[] transmissions) {\n        java.util.List<String> res = new java.util.ArrayList<>();\n        for (String t : transmissions) {\n            if (t.length() > 15) {\n                res.add(t);\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "#include <vector>\n#include <string>\n\nusing namespace std;\n\nvector<string> solve(vector<string> transmissions) {\n    vector<string> res;\n    for (const string& t : transmissions) {\n        if (t.length() > 15) {\n            res.push_back(t);\n        }\n    }\n    return res;\n}",
      GO: "func solve(transmissions []string) []string {\n    res := []string{}\n    for _, t := range transmissions {\n        if len(t) > 15 {\n            res = append(res, t)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "Hello_World This_is_a_very_long_transmission Short_one", expectedStdout: "This_is_a_very_long_transmission", isSample: true },
      { stdin: "Exactly_fifteen Sixteen_characts", expectedStdout: "Sixteen_characts", isSample: true },
      { stdin: "Small Tiny", expectedStdout: "" },
      { stdin: "Fifteen_charact This_is_exactly_sixteen.", expectedStdout: "This_is_exactly_sixteen." },
      { stdin: "A_very_long_transmission_that_exceeds_the_limit", expectedStdout: "A_very_long_transmission_that_exceeds_the_limit" },
      { stdin: "", expectedStdout: "" },
      { stdin: "123456789012345 1234567890123456", expectedStdout: "1234567890123456" },
      { stdin: "abcdefghijklmnop abcdefghijklmnop", expectedStdout: "abcdefghijklmnop abcdefghijklmnop" },
    ],
  }),

  p({
    ...base,
    slug: "check-empty-storage",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Detect Empty Containers",
    patternTags: ["strings","parsing"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing string representations of data containers. The input string `container` will always be formatted as either a dictionary wrapped in `{}` or a list wrapped in `[]`, and may include any amount of whitespace characters (such as spaces, tabs, and newlines).\n\nYour task is to determine whether the container is completely devoid of elements or entries. Return `true` if the container holds no items, and `false` if it does.\n\nFor instance, `\"{}\"`, `\"[]\"`, and `\"{  }\"` indicate empty containers, whereas `\"[1]\"` and `\"{\\\"key\\\": 2}\"` do not.\n\n**Constraints**\n- `2 <= container.length <= 1000`\n- `container` is structurally valid in the form of a list or dictionary.\n\n**Example 1**\n```\ninput:\n  \"{}\"\noutput:\n  true\n```\n*Explanation: This dictionary has no elements inside.*\n\n**Example 2**\n```\ninput:\n  \"[1, 2, 3]\"\noutput:\n  false\n```\n*Explanation: This list has three elements, thus it is not empty.*\n\n**Example 3**\n```\ninput:\n  \"{  \\n  }\"\noutput:\n  true\n```\n*Explanation: Despite the whitespace, there are no actual entries, making it empty.*\n\n**Follow-up**\nWhat modifications would your check require if a string literal like `\"\"` was considered a valid item inside the container?",
    editorialMarkdown: "## Check Empty Storage\n\nThis problem simulates checking whether a serialized JSON-like payload represents an empty object or array. We know the input is well-formed and represents either an array `[]` or an object `{}`.\n\nBecause an empty structure will solely contain the bracket or brace characters and optionally some whitespace, any character outside of `{}[] \\t\\n\\r` indicates the presence of an element or a key-value pair. We can solve this efficiently by iterating through the characters of the string. If we find any character that isn't a bracket, brace, or whitespace, we can immediately return `false`. If we reach the end of the string without finding such a character, the structure is empty, and we return `true`.\n\n**Trap**: A common trap is just checking `storage.length <= 2`. This fails because whitespace is allowed (e.g., `\"{  }\"`). Another trap is using a complex parser when simple character checking suffices.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string. We look at each character at most once.\n- **Space:** O(1) auxiliary space, as we only need to keep track of the current character.",
    referenceSolution: {
      JAVASCRIPT: "function solve(storage) {\n    for (let i = 0; i < storage.length; i++) {\n        let c = storage[i];\n        if (c !== '{' && c !== '}' && c !== '[' && c !== ']' && c !== ' ' && c !== '\\t' && c !== '\\n' && c !== '\\r') {\n            return false;\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(storage: string): boolean {\n    for (let i = 0; i < storage.length; i++) {\n        let c = storage[i];\n        if (c !== '{' && c !== '}' && c !== '[' && c !== ']' && c !== ' ' && c !== '\\t' && c !== '\\n' && c !== '\\r') {\n            return false;\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(storage):\n    for c in storage:\n        if c not in \"{}[] \\t\\n\\r\":\n            return False\n    return True",
      JAVA: "    static boolean solve(String storage) {\n        for (int i = 0; i < storage.length(); i++) {\n            char c = storage.charAt(i);\n            if (c != '{' && c != '}' && c != '[' && c != ']' && c != ' ' && c != '\\t' && c != '\\n' && c != '\\r') {\n                return false;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <string>\n\nusing namespace std;\n\nbool solve(string storage) {\n    for (char c : storage) {\n        if (c != '{' && c != '}' && c != '[' && c != ']' && c != ' ' && c != '\\t' && c != '\\n' && c != '\\r') {\n            return false;\n        }\n    }\n    return true;\n}",
      GO: "func solve(storage string) bool {\n    for _, c := range storage {\n        if c != '{' && c != '}' && c != '[' && c != ']' && c != ' ' && c != '\\t' && c != '\\n' && c != '\\r' {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "{}", expectedStdout: "true", isSample: true },
      { stdin: "[1, 2, 3]", expectedStdout: "false", isSample: true },
      { stdin: "{  \n  }", expectedStdout: "true" },
      { stdin: "[]", expectedStdout: "true" },
      { stdin: "{\"\": 1}", expectedStdout: "false" },
      { stdin: "[\"a\"]", expectedStdout: "false" },
      { stdin: "[0]", expectedStdout: "false" },
      { stdin: "[ \t]", expectedStdout: "true" },
    ],
  }),
];
