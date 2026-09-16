import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-053` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_053_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "next-available-docking-bay",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BINARY_SEARCH",
    title: "Next Available Docking Bay",
    patternTags: ["binary-search","array","circular","upper-bound"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 360,
    promptMarkdown: "A space station's docking bays are numbered with integers and sorted in strictly increasing order in an array `bays`. A ship arrives requesting docking at bay `target`.\n\nThe docking protocol states that the ship must dock at the smallest bay number that is *strictly greater* than `target`. If no such bay exists (because `target` is greater than or equal to the largest available bay), the station's layout wraps around circularly, and the ship must dock at the smallest bay number overall (which is simply the first element in `bays`).\n\nReturn the bay number where the ship will dock.\n\n**Constraints**\n- `2 <= bays.length <= 10^4`\n- `1 <= bays[i] <= 10^5`\n- `bays` is sorted in strictly increasing order.\n- `1 <= target <= 10^5`\n\n**Example 1**\n```\ninput:\n10 20 30\n15\noutput: 20\n```\n*Explanation: The smallest bay strictly greater than 15 is 20.*\n\n**Example 2**\n```\ninput:\n10 20 30\n30\noutput: 10\n```\n*Explanation: There is no bay strictly greater than 30, so it wraps around to the first bay, 10.*\n\n**Example 3**\n```\ninput:\n5 8\n2\noutput: 5\n```\n*Explanation: The smallest bay strictly greater than 2 is 5.*\n\n**Follow-up**\nCan you solve this in mathcal{O}(log N) time using binary search?",
    editorialMarkdown: "## Next Available Docking Bay\nThis problem requires finding the smallest integer in a sorted array `bays` that is strictly greater than `target`. If no such integer exists (meaning `target` is greater than or equal to the largest element in the array), the array wraps around cyclically, and we return the first element.\n\nWe can achieve this with a binary search. We look for the upper bound of the target. If the upper bound index is equal to the length of the array, it means no element is strictly greater, so we wrap around to index 0.\n\n**Trap**: Make sure to check for strict inequality. An element equal to `target` does not count.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(log N), where N is the number of docking bays, since the array is sorted and we can use binary search.\n- **Space Complexity:** mathcal{O}(1), as we only use a few pointers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(bays, target) {\n    let left = 0, right = bays.length - 1;\n    let ans = bays[0];\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (bays[mid] > target) {\n            ans = bays[mid];\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(bays: number[], target: number): number {\n    let left = 0, right = bays.length - 1;\n    let ans = bays[0];\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (bays[mid] > target) {\n            ans = bays[mid];\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(bays, target):\n    left, right = 0, len(bays) - 1\n    ans = bays[0]\n    while left <= right:\n        mid = (left + right) // 2\n        if bays[mid] > target:\n            ans = bays[mid]\n            right = mid - 1\n        else:\n            left = mid + 1\n    return ans",
      JAVA: "    static int solve(int[] bays, int target) {\n        int left = 0, right = bays.length - 1;\n        int ans = bays[0];\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (bays[mid] > target) {\n                ans = bays[mid];\n                right = mid - 1;\n            } else {\n                left = mid + 1;\n            }\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nint solve(vector<int> bays, int target) {\n    int left = 0, right = bays.size() - 1;\n    int ans = bays[0];\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (bays[mid] > target) {\n            ans = bays[mid];\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      GO: "func solve(bays []int, target int) int {\n    left, right := 0, len(bays)-1\n    ans := bays[0]\n    for left <= right {\n        mid := left + (right - left) / 2\n        if bays[mid] > target {\n            ans = bays[mid]\n            right = mid - 1\n        } else {\n            left = mid + 1\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "10 20 30\n15", expectedStdout: "20", isSample: true },
      { stdin: "10 20 30\n30", expectedStdout: "10", isSample: true },
      { stdin: "5 8\n2", expectedStdout: "5", isSample: true },
      { stdin: "100 200\n50", expectedStdout: "100" },
      { stdin: "100 200\n200", expectedStdout: "100" },
      { stdin: "100 200\n100", expectedStdout: "200" },
      { stdin: "1 3 5 7 9\n1", expectedStdout: "3" },
      { stdin: "10 100 1000\n999", expectedStdout: "1000" },
    ],
  }),

  p({
    ...base,
    slug: "locate-wandering-maintenance-robot",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Locate Wandering Maintenance Robot",
    patternTags: ["math","simulation","modulo"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A maintenance robot operates in a linear corridor of a spaceship. The corridor has `n` maintenance stations numbered `0` to `n - 1` from left to right.\n\nThe robot starts at station `0` and moves to the right at a speed of 1 station per second. When it reaches the last station (`n - 1`), it immediately reverses direction and moves left. When it reaches station `0`, it reverses again and moves right, continuing this bouncing pattern indefinitely.\n\nGiven the number of stations `n` and the elapsed time `time` in seconds, return the station number where the robot is currently located.\n\n**Constraints**\n- `2 <= n <= 10^5`\n- `1 <= time <= 10^9`\n\n**Example 1**\n```\ninput:\n3\n2\noutput: 2\n```\n*Explanation: At time 0, it's at 0. At 1s, it's at 1. At 2s, it's at 2.*\n\n**Example 2**\n```\ninput:\n5\n6\noutput: 2\n```\n*Explanation: 0s: 0 -> 1s: 1 -> 2s: 2 -> 3s: 3 -> 4s: 4 (reverses) -> 5s: 3 -> 6s: 2.*\n\n**Example 3**\n```\ninput:\n4\n2\noutput: 2\n```\n*Explanation: 0s: 0 -> 1s: 1 -> 2s: 2.*\n\n**Follow-up**\nCan you determine the robot's location in mathcal{O}(1) time?",
    editorialMarkdown: "## Locate Wandering Maintenance Robot\nThis problem involves calculating the final position of a robot bouncing back and forth along a 1D corridor. The corridor has n stations, numbered 0 to n-1. The robot moves 1 station per second.\nA full round trip from one end to the other and back takes 2 × (n - 1) seconds.\n\nWe can solve this by taking `time` modulo `2 * (n - 1)`. Let this remainder be rem.\nIf rem < n, the robot is moving forward, and its position is simply rem.\nIf rem ≥ n, the robot is on its way back, and its position is (2 × (n - 1)) - rem.\n\n**Trap**: Make sure to handle the bouncing correctly. It takes n - 1 steps to reach the other end, not n steps!\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(1), using modular arithmetic.\n- **Space Complexity:** mathcal{O}(1), as only a few variables are used.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n, time) {\n    let cycle = 2 * (n - 1);\n    let rem = time % cycle;\n    if (rem < n) return rem;\n    return cycle - rem;\n}",
      TYPESCRIPT: "function solve(n: number, time: number): number {\n    let cycle = 2 * (n - 1);\n    let rem = time % cycle;\n    if (rem < n) return rem;\n    return cycle - rem;\n}",
      PYTHON: "def solve(n, time):\n    cycle = 2 * (n - 1)\n    rem = time % cycle\n    if rem < n:\n        return rem\n    return cycle - rem",
      JAVA: "    static int solve(int n, int time) {\n        int cycle = 2 * (n - 1);\n        int rem = time % cycle;\n        if (rem < n) {\n            return rem;\n        }\n        return cycle - rem;\n    }",
      CPP: "int solve(int n, int time) {\n    int cycle = 2 * (n - 1);\n    int rem = time % cycle;\n    if (rem < n) {\n        return rem;\n    }\n    return cycle - rem;\n}",
      GO: "func solve(n int, time int) int {\n    cycle := 2 * (n - 1)\n    rem := time % cycle\n    if rem < n {\n        return rem\n    }\n    return cycle - rem\n}",
    },
    tests: [
      { stdin: "3\n2", expectedStdout: "2", isSample: true },
      { stdin: "5\n6", expectedStdout: "2", isSample: true },
      { stdin: "4\n2", expectedStdout: "2", isSample: true },
      { stdin: "10\n18", expectedStdout: "0" },
      { stdin: "10\n9", expectedStdout: "9" },
      { stdin: "2\n101", expectedStdout: "1" },
      { stdin: "1000\n3", expectedStdout: "3" },
      { stdin: "10\n19", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "most-frequent-cargo-types",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TREES",
    title: "Most Common Plant Species",
    patternTags: ["tree","binary-search-tree","frequency","in-order"],
    signatureId: "fn:tree->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are an ecologist analyzing plant species in a nature reserve. The sightings are recorded and organized into a Binary Search Tree (BST) based on each species' ID (an integer). Duplicates are allowed, indicating multiple sightings of the same species.\n\nGiven the `root` of this BST, find the most frequently sighted species ID(s) (the mode). If multiple species share the highest sighting frequency, return all of them in any order.\n\n**Constraints**\n- The number of nodes in the tree is in the range `[1, 10^4]`.\n- `-10^5 <= Node.val <= 10^5`\n\n**Example 1**\n```\ninput:\n1 null 2 2\noutput: 2\n```\n*Explanation: Species 2 is sighted twice, while 1 is sighted once. 2 is the most common.*\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\n*Explanation: Only one species is present.*\n\n**Example 3**\n```\ninput:\n5 3 7 3 5 7 7\noutput: 7\n```\n*Explanation: 7 appears three times, making it the most frequently sighted.*\n\n**Follow-up**\nCan you solve this in mathcal{O}(1) extra space (not counting the space required for the implicit recursive call stack)?",
    editorialMarkdown: "## Most Frequent Cargo Types\nWe traverse the BST (in-order is a good choice to visit elements in sorted order, though any traversal works if we use a hash map). We count the frequencies of each cargo type. Then, we find the maximum frequency and collect all cargo types that have this maximum frequency.\n\n**Trap**: Since there could be multiple cargo types with the same maximum frequency, make sure you clear or append to your result list appropriately, and don't assume there is only one mode.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the number of nodes in the BST, as we visit each node exactly once.\n- **Space Complexity:** mathcal{O}(N) to store the frequencies in a hash map (or implicitly on the call stack if doing an in-order traversal counting contiguous elements).",
    referenceSolution: {
      JAVASCRIPT: "function solve(root) {\n    let counts = new Map();\n    function dfs(node) {\n        if (!node) return;\n        counts.set(node.val, (counts.get(node.val) || 0) + 1);\n        dfs(node.left);\n        dfs(node.right);\n    }\n    dfs(root);\n    let maxFreq = 0;\n    for (let count of counts.values()) {\n        if (count > maxFreq) maxFreq = count;\n    }\n    let res = [];\n    for (let [val, count] of counts.entries()) {\n        if (count === maxFreq) res.push(val);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      TYPESCRIPT: "function solve(root: TreeNode | null): number[] {\n    let counts = new Map<number, number>();\n    function dfs(node: TreeNode | null) {\n        if (!node) return;\n        counts.set(node.val, (counts.get(node.val) || 0) + 1);\n        dfs(node.left);\n        dfs(node.right);\n    }\n    dfs(root);\n    let maxFreq = 0;\n    for (let count of counts.values()) {\n        if (count > maxFreq) maxFreq = count;\n    }\n    let res: number[] = [];\n    for (let [val, count] of counts.entries()) {\n        if (count === maxFreq) res.push(val);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      PYTHON: "def solve(root):\n    counts = {}\n    def dfs(node):\n        if not node: return\n        counts[node.val] = counts.get(node.val, 0) + 1\n        dfs(node.left)\n        dfs(node.right)\n    dfs(root)\n    if not counts: return []\n    max_freq = max(counts.values())\n    res = [k for k, v in counts.items() if v == max_freq]\n    return sorted(res)",
      JAVA: "    static void dfs(TreeNode node, java.util.Map<Integer, Integer> counts) {\n        if (node == null) return;\n        counts.put(node.val, counts.getOrDefault(node.val, 0) + 1);\n        dfs(node.left, counts);\n        dfs(node.right, counts);\n    }\n    static int[] solve(TreeNode root) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        dfs(root, counts);\n        int maxFreq = 0;\n        for (int v : counts.values()) {\n            if (v > maxFreq) maxFreq = v;\n        }\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (java.util.Map.Entry<Integer, Integer> e : counts.entrySet()) {\n            if (e.getValue() == maxFreq) {\n                list.add(e.getKey());\n            }\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for(int i=0; i<list.size(); i++) res[i] = list.get(i);\n        return res;\n    }",
      CPP: "void dfs(TreeNode* node, unordered_map<int, int>& counts) {\n    if (!node) return;\n    counts[node->val]++;\n    dfs(node->left, counts);\n    dfs(node->right, counts);\n}\n\nvector<int> solve(TreeNode* root) {\n    unordered_map<int, int> counts;\n    dfs(root, counts);\n    int maxFreq = 0;\n    for (auto& p : counts) {\n        maxFreq = max(maxFreq, p.second);\n    }\n    vector<int> res;\n    for (auto& p : counts) {\n        if (p.second == maxFreq) {\n            res.push_back(p.first);\n        }\n    }\n    sort(res.begin(), res.end());\n    return res;\n}",
      GO: "func dfs(node *TreeNode, counts map[int]int) {\n    if node == nil { return }\n    counts[node.Val]++\n    dfs(node.Left, counts)\n    dfs(node.Right, counts)\n}\n\nfunc solve(root *TreeNode) []int {\n    counts := make(map[int]int)\n    dfs(root, counts)\n    maxFreq := 0\n    for _, v := range counts {\n        if v > maxFreq {\n            maxFreq = v\n        }\n    }\n    res := []int{}\n    for k, v := range counts {\n        if v == maxFreq {\n            res = append(res, k)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 null 2 2", expectedStdout: "2", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "5 3 7 3 5 7 7", expectedStdout: "7", isSample: true },
      { stdin: "4 -2 5 -2 null 4", expectedStdout: "-2 4" },
      { stdin: "2 1 3", expectedStdout: "1 2 3" },
      { stdin: "-10 -10 -10 -10 -10", expectedStdout: "-10" },
      { stdin: "100 50 150 50 100 100 200", expectedStdout: "100" },
      { stdin: "5", expectedStdout: "5" },
    ],
  }),

  p({
    ...base,
    slug: "count-even-length-serial-codes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Stable Star Luminosity",
    patternTags: ["array","counting","digits","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 420,
    promptMarkdown: "An astronomical observatory is cataloging stars based on their luminosity index, represented by integers. A star is classified as having a \"stable\" output if its luminosity index consists of an even number of digits.\n\nGiven an array of integers `indexes` representing the luminosity indices of observed stars, return the total number of stars that have a stable output (an even number of digits).\n\n**Constraints**\n- `1 <= indexes.length <= 500`\n- `1 <= indexes[i] <= 10^5`\n\n**Example 1**\n```\ninput:\n12 345 2 6 7896\noutput: 2\n```\n*Explanation: 12 has 2 digits (even). 345 has 3 digits (odd). 2 has 1 digit (odd). 6 has 1 digit (odd). 7896 has 4 digits (even). There are 2 stable stars.*\n\n**Example 2**\n```\ninput:\n555 901 482 1771\noutput: 1\n```\n*Explanation: Only 1771 has an even number of digits (4).*\n\n**Example 3**\n```\ninput:\n10 100 1000\noutput: 2\n```\n*Explanation: 10 has 2 digits and 1000 has 4 digits. 100 has 3.*\n\n**Follow-up**\nCan you determine the number of digits using mathematical operations (like logarithms or repeated division) instead of string conversion?",
    editorialMarkdown: "## Count Even Length Serial Codes\nThis problem asks us to count how many integers in an array have an even number of digits. We can solve this by converting each integer to a string and checking if its length is even. Alternatively, we could repeatedly divide by 10 or use base-10 logarithms to find the digit count mathmatically.\n\n**Trap**: Converting to a string is perfectly fine for most languages, but some edge cases (like negatives, if they were permitted) would require you to handle the minus sign. Here the constraints ensure numbers are strictly positive. \n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N × D), where N is the length of the array and D is the maximum number of digits in an element (at most 6 based on constraints). So practically mathcal{O}(N).\n- **Space Complexity:** mathcal{O}(D) per element to store the string representation, so mathcal{O}(1) auxiliary space overall.",
    referenceSolution: {
      JAVASCRIPT: "function solve(codes) {\n    let count = 0;\n    for (let code of codes) {\n        if (String(code).length % 2 === 0) count++;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(codes: number[]): number {\n    let count = 0;\n    for (let code of codes) {\n        if (String(code).length % 2 === 0) count++;\n    }\n    return count;\n}",
      PYTHON: "def solve(codes):\n    return sum(1 for code in codes if len(str(code)) % 2 == 0)",
      JAVA: "    static int solve(int[] codes) {\n        int count = 0;\n        for (int code : codes) {\n            if (String.valueOf(code).length() % 2 == 0) {\n                count++;\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> codes) {\n    int count = 0;\n    for (int code : codes) {\n        if (to_string(code).length() % 2 == 0) {\n            count++;\n        }\n    }\n    return count;\n}",
      GO: "func solve(codes []int) int {\n    count := 0\n    for _, code := range codes {\n        digits := 0\n        temp := code\n        if temp == 0 {\n            digits = 1\n        }\n        for temp > 0 {\n            digits++\n            temp /= 10\n        }\n        if digits % 2 == 0 {\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "12 345 2 6 7896", expectedStdout: "2", isSample: true },
      { stdin: "555 901 482 1771", expectedStdout: "1", isSample: true },
      { stdin: "10 100 1000", expectedStdout: "2", isSample: true },
      { stdin: "100000", expectedStdout: "1" },
      { stdin: "1", expectedStdout: "0" },
      { stdin: "10 10 10 10 10", expectedStdout: "5" },
      { stdin: "1 2 3 4 5", expectedStdout: "0" },
      { stdin: "12 34 56 78", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "filter-redundant-encrypted-messages",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Filter Redundant Encrypted Messages",
    patternTags: ["array","strings","anagram","adjacent-pairs"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 480,
    promptMarkdown: "A communication relay intercepts an array of strings `messages`, representing encrypted packets. Often, due to relay echoes, consecutive packets contain the exact same characters in a different order (i.e., they are anagrams).\n\nTo filter out the redundancy, you must iterate from the beginning of the `messages` array and remove any message that is an anagram of its immediately preceding message. Keep doing this until no consecutive anagrams remain.\n\nReturn the final array of filtered messages. Two strings are anagrams if they have the same characters with the same frequencies.\n\n**Constraints**\n- `1 <= messages.length <= 100`\n- `1 <= messages[i].length <= 10`\n- `messages[i]` consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabba bbaa bcaa bac aca\noutput: abba bcaa bac aca\n```\n*Explanation: `messages[1]` (\"bbaa\") is an anagram of `messages[0]` (\"abba\"), so it's removed. The result is \"abba bcaa bac aca\". Then \"bcaa\" and \"bac\" are not anagrams, and so on.*\n\n**Example 2**\n```\ninput:\na b c d e\noutput: a b c d e\n```\n*Explanation: No adjacent strings are anagrams of each other.*\n\n**Example 3**\n```\ninput:\nz z z\noutput: z\n```\n*Explanation: The second \"z\" is an anagram of the first, and is removed. The third \"z\" is then an anagram of the first, and is removed.*\n\n**Follow-up**\nCan you determine if two strings are anagrams in mathcal{O}(L) time without sorting, where L is the length of the string?",
    editorialMarkdown: "## Filter Redundant Encrypted Messages\nWe need to iterate through an array of strings and keep a string only if it is not an anagram of the previously kept string. Two strings are anagrams if their sorted character arrays are identical. \n\n**Trap**: Make sure to check the anagram condition against the *last retained* string in your result array, or simply the immediate previous string in the original array (because if A is an anagram of B, and B is an anagram of C, A is an anagram of C, so you can just check adjacent elements in the original array). \n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N × L log L), where N is the number of strings and L is the maximum length of a string, since we sort each string (or character count array) to check for anagrams.\n- **Space Complexity:** mathcal{O}(L) or mathcal{O}(N × L) depending on whether we store sorted representations explicitly for the result array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(messages) {\n    let res = [];\n    let prev = \"\";\n    for (let m of messages) {\n        let sorted = m.split('').sort().join('');\n        if (res.length === 0 || sorted !== prev) {\n            res.push(m);\n            prev = sorted;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(messages: string[]): string[] {\n    let res: string[] = [];\n    let prev = \"\";\n    for (let m of messages) {\n        let sorted = m.split('').sort().join('');\n        if (res.length === 0 || sorted !== prev) {\n            res.push(m);\n            prev = sorted;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(messages):\n    res = []\n    prev = \"\"\n    for m in messages:\n        sorted_m = \"\".join(sorted(m))\n        if not res or sorted_m != prev:\n            res.append(m)\n            prev = sorted_m\n    return res",
      JAVA: "    static String sortStr(String s) {\n        char[] c = s.toCharArray();\n        java.util.Arrays.sort(c);\n        return new String(c);\n    }\n    static String[] solve(String[] messages) {\n        java.util.List<String> res = new java.util.ArrayList<>();\n        String prev = \"\";\n        for (String m : messages) {\n            String sorted = sortStr(m);\n            if (res.isEmpty() || !sorted.equals(prev)) {\n                res.add(m);\n                prev = sorted;\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "vector<string> solve(vector<string> messages) {\n    vector<string> res;\n    string prev = \"\";\n    for (string m : messages) {\n        string sorted_m = m;\n        sort(sorted_m.begin(), sorted_m.end());\n        if (res.empty() || sorted_m != prev) {\n            res.push_back(m);\n            prev = sorted_m;\n        }\n    }\n    return res;\n}",
      GO: "func sortString(w string) string {\n    s := []rune(w)\n    for i := 0; i < len(s); i++ {\n        for j := i+1; j < len(s); j++ {\n            if s[i] > s[j] {\n                s[i], s[j] = s[j], s[i]\n            }\n        }\n    }\n    return string(s)\n}\n\nfunc solve(messages []string) []string {\n    var res []string\n    prev := \"\"\n    for _, m := range messages {\n        sorted := sortString(m)\n        if len(res) == 0 || sorted != prev {\n            res = append(res, m)\n            prev = sorted\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "abba bbaa bcaa bac aca", expectedStdout: "abba bcaa bac aca", isSample: true },
      { stdin: "a b c d e", expectedStdout: "a b c d e", isSample: true },
      { stdin: "z z z", expectedStdout: "z", isSample: true },
      { stdin: "abc bca def fed abc cba", expectedStdout: "abc def abc" },
      { stdin: "hello", expectedStdout: "hello" },
      { stdin: "a a a a a", expectedStdout: "a" },
      { stdin: "ab ba cd dc ef fe", expectedStdout: "ab cd ef" },
      { stdin: "test tset estt", expectedStdout: "test" },
    ],
  }),
];
