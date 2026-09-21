import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-055` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_055_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "kth-ancient-rune-inorder",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TREES",
    title: "Kth Book In The Catalog",
    patternTags: ["tree","trees","in-order","dfs"],
    signatureId: "fn:tree,int->int",
    avgSolveSeconds: 480,
    promptMarkdown: "You are organizing a catalog of books represented as a binary tree, where each node contains an integer `val` representing a book's identification number. The tree is provided as a level-order traversal, where `null` means a missing child node.\n\nGiven the root of this binary tree `root` and an integer `k`, find the value located at the `k`-th position (1-indexed) during an **in-order traversal** of the tree.\n\n**Constraints**\n- The number of nodes in the tree is between `1` and `1000`.\n- `1 <= k <= Number of nodes`\n- `0 <= Node.val <= 10^5`\n\n**Example 1**\n```\ninput:\n3 1 4 null 2\n2\noutput: 2\n```\n*Explanation: The in-order traversal yields [1, 2, 3, 4]. The 2nd value is 2.*\n\n**Example 2**\n```\ninput:\n5 3 6 2 4 null null 1\n3\noutput: 3\n```\n*Explanation: The in-order traversal yields [1, 2, 3, 4, 5, 6]. The 3rd value is 3.*\n\n**Example 3**\n```\ninput:\n10\n1\noutput: 10\n```\n*Explanation: The tree only has one node. The 1st value is 10.*\n\n**Follow-up**\nCan you reduce the space complexity to O(1) if you are allowed to temporarily modify the tree structure?",
    editorialMarkdown: "## Kth Ancient Rune\n\nAn inorder traversal of a binary tree visits the nodes in the order: Left Subtree, Current Node, Right Subtree. \n\nWe can solve this by performing a standard depth-first search (DFS) to traverse the tree inorder. As we visit each node, we append its value to a list. Finally, we return the `k-1` indexed element from this list. \n\n**Trap**: Be careful with 1-based indexing! The problem asks for the `k`-th node, which corresponds to index `k - 1` in our flattened array. \n\n**Complexity:**\n- **Time:** O(N), where N is the number of nodes in the tree. We visit every node once.\n- **Space:** O(N), for the array to store the inorder traversal, and the recursion stack. (Can be optimized to O(H) space by just keeping a counter instead of a full array).",
    referenceSolution: {
      JAVASCRIPT: "function solve(root, k) {\n    let res = [];\n    function inorder(node) {\n        if (!node) return;\n        inorder(node.left);\n        res.push(node.val);\n        inorder(node.right);\n    }\n    inorder(root);\n    return res[k - 1];\n}",
      TYPESCRIPT: "function solve(root: any, k: number): number {\n    let res: number[] = [];\n    function inorder(node: any) {\n        if (!node) return;\n        inorder(node.left);\n        res.push(node.val);\n        inorder(node.right);\n    }\n    inorder(root);\n    return res[k - 1];\n}",
      PYTHON: "def solve(root, k):\n    res = []\n    def inorder(node):\n        if node:\n            inorder(node.left)\n            res.append(node.val)\n            inorder(node.right)\n    inorder(root)\n    return res[k-1]",
      JAVA: "    static int solve(TreeNode root, int k) {\n        List<Integer> res = new ArrayList<>();\n        inorder(root, res);\n        return res.get(k - 1);\n    }\n    static void inorder(TreeNode node, List<Integer> res) {\n        if (node != null) {\n            inorder(node.left, res);\n            res.add(node.val);\n            inorder(node.right, res);\n        }\n    }",
      CPP: "void inorder(TreeNode* node, vector<int>& res) {\n    if (node) {\n        inorder(node->left, res);\n        res.push_back(node->val);\n        inorder(node->right, res);\n    }\n}\nint solve(TreeNode* root, int k) {\n    vector<int> res;\n    inorder(root, res);\n    return res[k - 1];\n}",
      GO: "func solve(root *TreeNode, k int) int {\n    var res []int\n    var inorder func(node *TreeNode)\n    inorder = func(node *TreeNode) {\n        if node != nil {\n            inorder(node.Left)\n            res = append(res, node.Val)\n            inorder(node.Right)\n        }\n    }\n    inorder(root)\n    return res[k-1]\n}",
    },
    tests: [
      { stdin: "3 1 4 null 2\n2", expectedStdout: "2", isSample: true },
      { stdin: "5 3 6 2 4 null null 1\n3", expectedStdout: "3", isSample: true },
      { stdin: "10\n1", expectedStdout: "10" },
      { stdin: "1 2 3 4 5 6 7\n4", expectedStdout: "1" },
      { stdin: "1 2 3 4 5 6 7\n1", expectedStdout: "4" },
      { stdin: "1 2 3 4 5 6 7\n7", expectedStdout: "7" },
      { stdin: "1 null 2 null 3\n2", expectedStdout: "2" },
      { stdin: "1 2 null 3 null 4 null\n1", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "suspicious-transmission-logs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Suspicious Transmission Logs",
    patternTags: ["array","arrays","string","digits"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 360,
    promptMarkdown: "You are analyzing an array of positive integer `logs` from a communication array. A log is deemed **suspicious** if its decimal representation contains at least three consecutive identical digits.\n\nReturn a list of all suspicious logs in the same order they appeared in the input.\n\n**Constraints**\n- `1 <= logs.length <= 1000`\n- `1 <= logs[i] <= 10^9`\n\n**Example 1**\n```\ninput:\n123 12223 456 999 1001\noutput:\n12223 999\n```\n*Explanation: '12223' contains three '2's in a row. '999' contains three '9's in a row.*\n\n**Example 2**\n```\ninput:\n1122 3344 5566\noutput:\n\n```\n*Explanation: No log contains three consecutive identical digits. We return an empty list.*\n\n**Example 3**\n```\ninput:\n111 2111 31114\noutput:\n111 2111 31114\n```\n*Explanation: All logs contain at least three '1's in a row.*\n\n**Follow-up**\nHow would your solution perform if the numbers were arbitrarily large strings instead of 32-bit integers?",
    editorialMarkdown: "## Suspicious Transmission Logs\n\nTo check if an integer contains three consecutive identical digits, the easiest approach is to convert the integer into a string. \n\nOnce converted, we can simply iterate through the characters of the string and check if `s[i] == s[i-1]` and `s[i] == s[i-2]` for any index `i >= 2`. If we find such a sequence, we add the original integer to our result and immediately move to the next log.\n\n**Trap**: Make sure to break out of the inner loop or return early once you find a valid triplet within a single log, to avoid adding the same log multiple times.\n\n**Complexity:**\n- **Time:** O(N * L), where N is the number of logs and L is the maximum number of digits in a log (at most 10). This is effectively O(N).\n- **Space:** O(L) to store the string representation of each log.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let ans = [];\n    for (let x of logs) {\n        let s = String(x);\n        for (let i = 2; i < s.length; i++) {\n            if (s[i] === s[i-1] && s[i] === s[i-2]) {\n                ans.push(x);\n                break;\n            }\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(logs: number[]): number[] {\n    let ans: number[] = [];\n    for (let x of logs) {\n        let s = String(x);\n        for (let i = 2; i < s.length; i++) {\n            if (s[i] === s[i-1] && s[i] === s[i-2]) {\n                ans.push(x);\n                break;\n            }\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(logs):\n    ans = []\n    for x in logs:\n        s = str(x)\n        for i in range(2, len(s)):\n            if s[i] == s[i-1] == s[i-2]:\n                ans.append(x)\n                break\n    return ans",
      JAVA: "    static int[] solve(int[] logs) {\n        List<Integer> ans = new ArrayList<>();\n        for (int x : logs) {\n            String s = String.valueOf(x);\n            for (int i = 2; i < s.length(); i++) {\n                if (s.charAt(i) == s.charAt(i-1) && s.charAt(i) == s.charAt(i-2)) {\n                    ans.add(x);\n                    break;\n                }\n            }\n        }\n        int[] res = new int[ans.size()];\n        for (int i = 0; i < ans.size(); i++) res[i] = ans.get(i);\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> logs) {\n    vector<int> ans;\n    for (int x : logs) {\n        string s = to_string(x);\n        for (int i = 2; i < s.size(); i++) {\n            if (s[i] == s[i-1] && s[i] == s[i-2]) {\n                ans.push_back(x);\n                break;\n            }\n        }\n    }\n    return ans;\n}",
      GO: "func solve(logs []int) []int {\n    var ans []int\n    for _, x := range logs {\n        s := strconv.Itoa(x)\n        for i := 2; i < len(s); i++ {\n            if s[i] == s[i-1] && s[i] == s[i-2] {\n                ans = append(ans, x)\n                break\n            }\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "123 12223 456 999 1001", expectedStdout: "12223 999", isSample: true },
      { stdin: "1122 3344 5566", expectedStdout: "", isSample: true },
      { stdin: "111 2111 31114", expectedStdout: "111 2111 31114" },
      { stdin: "1", expectedStdout: "" },
      { stdin: "1000 10000 100000 1000000", expectedStdout: "1000 10000 100000 1000000" },
      { stdin: "22", expectedStdout: "" },
      { stdin: "123456 111222 333", expectedStdout: "111222 333" },
      { stdin: "7777", expectedStdout: "7777" },
    ],
  }),

  p({
    ...base,
    slug: "equilibrium-energy-zone",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Sensor Balancing Point",
    patternTags: ["array","arrays","prefix-sum"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 420,
    promptMarkdown: "You are processing data from a line of mechanical sensors, given as an array of integer `readings`.\n\nYour task is to identify the **balance point**, which is the lowest index `i` where the sum of the readings strictly to the left of `i` is identical to the sum of the readings strictly to its right.\n\nIf `i` is at the very beginning of the array, the left sum is considered `0`. If `i` is at the very end of the array, the right sum is considered `0`.\n\nReturn the balance point index. If no such index exists, return `-1`.\n\n**Constraints**\n- `1 <= readings.length <= 10^4`\n- `-1000 <= readings[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 7 3 6 5 6\noutput: 3\n```\n*Explanation: The sum of elements to the left of index 3 is 1 + 7 + 3 = 11. The sum to the right is 5 + 6 = 11.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: -1\n```\n*Explanation: There is no index that satisfies the balance condition.*\n\n**Example 3**\n```\ninput:\n2 1 -1\noutput: 0\n```\n*Explanation: The left sum of index 0 is 0. The right sum is 1 + -1 = 0.*\n\n**Follow-up**\nCan you find this index in O(N) time and O(1) space?",
    editorialMarkdown: "## Equilibrium Energy Zone\n\nInstead of recalculating the sum of the left and right sides for every index (which would take O(N²) time), we can use a prefix sum approach.\n\nFirst, calculate the total sum of all elements in the array. Then, iterate through the array while maintaining a running `leftSum` (initially 0). For each index, the `rightSum` can be deduced as `totalSum - leftSum - readings[i]`. If `leftSum == rightSum`, we've found our equilibrium index. Otherwise, we add `readings[i]` to `leftSum` and continue.\n\n**Trap**: Remember that negative numbers are valid energy readings! An equilibrium point can still exist even if the total sum fluctuates.\n\n**Complexity:**\n- **Time:** O(N) — one pass to compute the total sum and a second pass to find the index.\n- **Space:** O(1) — we only use integer variables for tracking sums.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings) {\n    let total = readings.reduce((a, b) => a + b, 0);\n    let leftSum = 0;\n    for (let i = 0; i < readings.length; i++) {\n        if (leftSum === total - leftSum - readings[i]) return i;\n        leftSum += readings[i];\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(readings: number[]): number {\n    let total = readings.reduce((a, b) => a + b, 0);\n    let leftSum = 0;\n    for (let i = 0; i < readings.length; i++) {\n        if (leftSum === total - leftSum - readings[i]) return i;\n        leftSum += readings[i];\n    }\n    return -1;\n}",
      PYTHON: "def solve(readings):\n    total = sum(readings)\n    left_sum = 0\n    for i, x in enumerate(readings):\n        if left_sum == total - left_sum - x:\n            return i\n        left_sum += x\n    return -1",
      JAVA: "    static int solve(int[] readings) {\n        int total = 0;\n        for (int x : readings) total += x;\n        int leftSum = 0;\n        for (int i = 0; i < readings.length; i++) {\n            if (leftSum == total - leftSum - readings[i]) return i;\n            leftSum += readings[i];\n        }\n        return -1;\n    }",
      CPP: "int solve(vector<int> readings) {\n    int total = 0;\n    for (int x : readings) total += x;\n    int left_sum = 0;\n    for (int i = 0; i < readings.size(); i++) {\n        if (left_sum == total - left_sum - readings[i]) return i;\n        left_sum += readings[i];\n    }\n    return -1;\n}",
      GO: "func solve(readings []int) int {\n    total := 0\n    for _, x := range readings {\n        total += x\n    }\n    leftSum := 0\n    for i, x := range readings {\n        if leftSum == total - leftSum - x {\n            return i\n        }\n        leftSum += x\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "1 7 3 6 5 6", expectedStdout: "3", isSample: true },
      { stdin: "1 2 3", expectedStdout: "-1", isSample: true },
      { stdin: "2 1 -1", expectedStdout: "0" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "-1 -1 -1 -1 -1 0", expectedStdout: "2" },
      { stdin: "-1 -1 -1 0 1 1", expectedStdout: "0" },
      { stdin: "1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1", expectedStdout: "-1" },
      { stdin: "0 0 0", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "duplicate-thermal-signatures",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Recurring Climate Patterns",
    patternTags: ["array","arrays","hash-set","sliding-window"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing historical climate data provided as an array of integer `temperatures`. A \"climate pattern\" is determined by calculating the sum of any two consecutive temperature values.\n\nYour goal is to check if the exact same climate pattern occurs more than once in the data. Return `true` if you can find at least two distinct pairs of consecutive days that yield the same sum. These pairs may share a day (overlap). If every consecutive two-day sum is unique, return `false`.\n\n**Constraints**\n- `2 <= temperatures.length <= 1000`\n- `-10^9 <= temperatures[i] <= 10^9`\n\n**Example 1**\n```\ninput:\n4 2 4\noutput: true\n```\n*Explanation: The sums are 4+2 = 6, and 2+4 = 6. Since 6 appears twice, we return true.*\n\n**Example 2**\n```\ninput:\n1 2 3 4 5\noutput: false\n```\n*Explanation: The consecutive sums are 3, 5, 7, and 9. All are distinct, returning false.*\n\n**Example 3**\n```\ninput:\n0 0 0\noutput: true\n```\n*Explanation: The sum 0+0 = 0 occurs twice.*\n\n**Follow-up**\nCan you solve this by iterating through the array exactly once?",
    editorialMarkdown: "## Duplicate Thermal Signatures\n\nWe need to calculate the sum of every two adjacent elements and check if we've seen this exact sum before. \n\nA `HashSet` is the perfect data structure for this. We can iterate through the array, compute the sum of the current element and the next element, and check if it already exists in our set. If it does, we return `true`. If not, we add it to the set and continue.\n\n**Trap**: Make sure to iterate up to the second-to-last element to avoid an array out of bounds error when accessing the `i+1` element!\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the temperatures array. Set lookups take O(1) time on average.\n- **Space:** O(N), for the hash set to store up to N-1 distinct thermal signatures.",
    referenceSolution: {
      JAVASCRIPT: "function solve(temperatures) {\n    let seen = new Set();\n    for (let i = 0; i < temperatures.length - 1; i++) {\n        let s = temperatures[i] + temperatures[i+1];\n        if (seen.has(s)) return true;\n        seen.add(s);\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(temperatures: number[]): boolean {\n    let seen = new Set<number>();\n    for (let i = 0; i < temperatures.length - 1; i++) {\n        let s = temperatures[i] + temperatures[i+1];\n        if (seen.has(s)) return true;\n        seen.add(s);\n    }\n    return false;\n}",
      PYTHON: "def solve(temperatures):\n    seen = set()\n    for i in range(len(temperatures) - 1):\n        s = temperatures[i] + temperatures[i+1]\n        if s in seen:\n            return True\n        seen.add(s)\n    return False",
      JAVA: "    static boolean solve(int[] temperatures) {\n        Set<Integer> seen = new HashSet<>();\n        for (int i = 0; i < temperatures.length - 1; i++) {\n            int s = temperatures[i] + temperatures[i+1];\n            if (seen.contains(s)) return true;\n            seen.add(s);\n        }\n        return false;\n    }",
      CPP: "bool solve(vector<int> temperatures) {\n    unordered_set<int> seen;\n    for (int i = 0; i + 1 < temperatures.size(); i++) {\n        int s = temperatures[i] + temperatures[i+1];\n        if (seen.count(s)) return true;\n        seen.insert(s);\n    }\n    return false;\n}",
      GO: "func solve(temperatures []int) bool {\n    seen := make(map[int]bool)\n    for i := 0; i < len(temperatures)-1; i++ {\n        s := temperatures[i] + temperatures[i+1]\n        if seen[s] {\n            return true\n        }\n        seen[s] = true\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "4 2 4", expectedStdout: "true", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "false", isSample: true },
      { stdin: "0 0 0", expectedStdout: "true" },
      { stdin: "1 2", expectedStdout: "false" },
      { stdin: "1000 -1000 1000 -1000 1000", expectedStdout: "true" },
      { stdin: "-1 -2 -3 -4 -1 -2", expectedStdout: "true" },
      { stdin: "1 100 2 100 3", expectedStdout: "true" },
      { stdin: "5 5 10 0 20", expectedStdout: "true" },
    ],
  }),
];
