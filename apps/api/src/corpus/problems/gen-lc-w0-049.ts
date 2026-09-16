import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-049` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_049_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "stuttering-audio-sensor",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Stuttering Audio Sensor",
    patternTags: ["array","arrays","in-place","shifting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "An audio sensor captures a digital `signal` represented by an array of integers. Due to a hardware glitch, every time it encounters a `0`, it stutters and duplicates the `0`, pushing the rest of the signal to the right. \n\nTo maintain synchronization, the sensor truncates the end of the modified signal so that the output array always has the exact same length as the original `signal`.\n\nGiven an integer array `signal`, return the resulting array after the stutter effect is applied and truncated.\n\n**Constraints**\n- `0 <= signal.length <= 40`\n- `0 <= signal[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 0 2 3 0 4 5 0\noutput: 1 0 0 2 3 0 0 4\n```\n*Explanation: The first 0 is duplicated, pushing 2 and 3 right. The second 0 is duplicated. The elements 5 and 0 at the end fall off because the length is kept at 8.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: 1 2 3\n```\n*Explanation: There are no zeros to duplicate.*\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\n*Explanation: The zero is duplicated but truncated to match the original length of 1.*\n\n**Follow-up**\nCan you think of a way to do this in-place if you were modifying the array directly?",
    editorialMarkdown: "## Stuttering Audio Sensor\nWe need to iterate through the input signal and construct a new array. For every element, we append it to our result array. If the element is 0, we append it a second time, provided we haven't reached the original array's length.\n\n**Trap**: Make sure the output array has exactly the same length as the input array. Stop appending once the limit is reached.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the signal array, since we iterate through the array once and generate an output of the same size.\n- **Space Complexity:** mathcal{O}(N) for the result array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signal) {\n    const res = [];\n    for (let i = 0; i < signal.length && res.length < signal.length; i++) {\n        res.push(signal[i]);\n        if (signal[i] === 0 && res.length < signal.length) {\n            res.push(0);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(signal: number[]): number[] {\n    const res: number[] = [];\n    for (let i = 0; i < signal.length && res.length < signal.length; i++) {\n        res.push(signal[i]);\n        if (signal[i] === 0 && res.length < signal.length) {\n            res.push(0);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(signal):\n    res = []\n    for x in signal:\n        if len(res) >= len(signal):\n            break\n        res.append(x)\n        if x == 0 and len(res) < len(signal):\n            res.append(0)\n    return res",
      JAVA: "    static int[] solve(int[] signal) {\n        int[] res = new int[signal.length];\n        int j = 0;\n        for (int i = 0; i < signal.length && j < signal.length; i++) {\n            res[j++] = signal[i];\n            if (signal[i] == 0 && j < signal.length) {\n                res[j++] = 0;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int> signal) {\n    vector<int> res;\n    for (int i = 0; i < signal.size() && res.size() < signal.size(); i++) {\n        res.push_back(signal[i]);\n        if (signal[i] == 0 && res.size() < signal.size()) {\n            res.push_back(0);\n        }\n    }\n    return res;\n}",
      GO: "func solve(signal []int) []int {\n    res := []int{}\n    for i := 0; i < len(signal) && len(res) < len(signal); i++ {\n        res = append(res, signal[i])\n        if signal[i] == 0 && len(res) < len(signal) {\n            res = append(res, 0)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 0 2 3 0 4 5 0", expectedStdout: "1 0 0 2 3 0 0 4", isSample: true },
      { stdin: "1 2 3", expectedStdout: "1 2 3", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "", expectedStdout: "" },
      { stdin: "0 0 0 0", expectedStdout: "0 0 0 0" },
      { stdin: "1 0 2 0 3 0 4", expectedStdout: "1 0 0 2 0 0 3" },
      { stdin: "0 1 0 2 0 3 4", expectedStdout: "0 0 1 0 0 2 0" },
      { stdin: "5 5 5 0 5 0 5", expectedStdout: "5 5 5 0 0 5 0" },
    ],
  }),

  p({
    ...base,
    slug: "high-performing-workers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Valuable Cargo Transports",
    patternTags: ["array","arrays","linear-scan"],
    signatureId: "fn:matrix,int->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "A logistics company determines the value of transport shipments based on the cargo weight and the rate per kilogram.\n\nYou are given a 2D array `shipments` where each row represents a transport in the format `[shipment_id, weight, rate_per_kg]`. You are also provided with an integer `threshold`.\n\nReturn a list of `shipment_id`s for transports whose total value (calculated as `weight * rate_per_kg`) is strictly greater than the `threshold`. The order of IDs in the returned list should match the order they appeared in the input.\n\n**Constraints**\n- `0 <= shipments.length <= 40`\n- `shipments[i].length == 3`\n- `1 <= shipments[i][0] <= 1000`\n- `0 <= shipments[i][1], shipments[i][2] <= 100`\n- `0 <= threshold <= 10000`\n\n**Example 1**\n```\ninput:\n1 10 5;2 20 2;3 5 10\n45\noutput: 1 3\n```\n*Explanation: Shipment 1 has a value of 10 \\* 5 = 50. Shipment 2 has a value of 20 \\* 2 = 40. Shipment 3 has a value of 5 \\* 10 = 50. The threshold is 45, so only shipments 1 and 3 exceed it.*\n\n**Example 2**\n```\ninput:\n101 0 10;102 10 0\n0\noutput: \n```\n*Explanation: Both shipments evaluate to a total value of 0, which is not strictly greater than the threshold 0.*\n\n**Example 3**\n```\ninput:\n55 10 10\n99\noutput: 55\n```\n*Explanation: The only shipment has a value of 100, which is strictly greater than 99.*\n\n**Follow-up**\nHow would you adapt your approach if the list of shipments could not fit entirely into memory?",
    editorialMarkdown: "## High Performing Workers\nWe need to evaluate each worker's total bonus and select the IDs of those who exceed a specific threshold. Iterate over the matrix rows; each row represents a worker's details: ID, performance score, and multiplier. Calculate the product of the score and the multiplier, and if it is strictly greater than the threshold, add the ID to the result list.\n\n**Trap**: Make sure to check for strictly greater than (`>`) rather than greater than or equal to (`>=`).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of workers.\n- **Space Complexity:** mathcal{O}(N) to store the result list, or mathcal{O}(1) auxiliary space if we disregard the output structure.",
    referenceSolution: {
      JAVASCRIPT: "function solve(workers, threshold) {\n    const res = [];\n    for (let w of workers) {\n        if (w[1] * w[2] > threshold) {\n            res.push(w[0]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(workers: number[][], threshold: number): number[] {\n    const res: number[] = [];\n    for (const w of workers) {\n        if (w[1] * w[2] > threshold) {\n            res.push(w[0]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(workers, threshold):\n    return [w[0] for w in workers if w[1] * w[2] > threshold]",
      JAVA: "    static int[] solve(int[][] workers, int threshold) {\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (int[] w : workers) {\n            if (w[1] * w[2] > threshold) {\n                list.add(w[0]);\n            }\n        }\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) res[i] = list.get(i);\n        return res;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> workers, int threshold) {\n    vector<int> res;\n    for (auto& w : workers) {\n        if (w[1] * w[2] > threshold) {\n            res.push_back(w[0]);\n        }\n    }\n    return res;\n}",
      GO: "func solve(workers [][]int, threshold int) []int {\n    res := []int{}\n    for _, w := range workers {\n        if w[1] * w[2] > threshold {\n            res = append(res, w[0])\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 10 5;2 20 2;3 5 10\n45", expectedStdout: "1 3", isSample: true },
      { stdin: "101 0 10;102 10 0\n0", expectedStdout: "", isSample: true },
      { stdin: "55 10 10\n99", expectedStdout: "55" },
      { stdin: "\n100", expectedStdout: "" },
      { stdin: "10 100 100\n9999", expectedStdout: "10" },
      { stdin: "10 100 100\n10000", expectedStdout: "" },
      { stdin: "1 5 5;2 10 10;3 2 10;4 20 5\n30", expectedStdout: "2 4" },
      { stdin: "1 10 10;2 10 10;3 10 10\n99", expectedStdout: "1 2 3" },
    ],
  }),

  p({
    ...base,
    slug: "filter-corrupted-readings",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Filter Corrupted Readings",
    patternTags: ["array","arrays","filtering"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "A weather station records a series of temperature `readings`. Occasionally, the sensor malfunctions and outputs a corrupted value represented by `-1`.\n\nGiven an array of integers `readings`, return a new array containing only the valid temperature readings, preserving their original order.\n\n**Constraints**\n- `0 <= readings.length <= 40`\n- `-100 <= readings[i] <= 100`\n\n**Example 1**\n```\ninput:\n25 26 -1 28 -1 30\noutput: 25 26 28 30\n```\n*Explanation: We drop the -1 values and keep the rest.*\n\n**Example 2**\n```\ninput:\n-1 -1\noutput: \n```\n*Explanation: All readings are corrupted, so the output is an empty array.*\n\n**Example 3**\n```\ninput:\n15 20\noutput: 15 20\n```\n*Explanation: There are no corrupted readings.*\n\n**Follow-up**\nCan you do this in one pass?",
    editorialMarkdown: "## Filter Corrupted Readings\nWe simply need to iterate through the given `readings` array and collect all values that are not equal to `-1`. This can be done by appending valid values to a new list or array.\n\n**Trap**: Make sure to return an empty array if all elements are corrupted, rather than returning `null` or the original array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of elements in the array, as we process each element exactly once.\n- **Space Complexity:** mathcal{O}(N) to store the filtered results in the worst case (when no elements are corrupted).",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings) {\n    return readings.filter(r => r !== -1);\n}",
      TYPESCRIPT: "function solve(readings: number[]): number[] {\n    return readings.filter(r => r !== -1);\n}",
      PYTHON: "def solve(readings):\n    return [r for r in readings if r != -1]",
      JAVA: "    static int[] solve(int[] readings) {\n        int count = 0;\n        for (int r : readings) {\n            if (r != -1) count++;\n        }\n        int[] res = new int[count];\n        int idx = 0;\n        for (int r : readings) {\n            if (r != -1) {\n                res[idx++] = r;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int> readings) {\n    vector<int> res;\n    for (int r : readings) {\n        if (r != -1) {\n            res.push_back(r);\n        }\n    }\n    return res;\n}",
      GO: "func solve(readings []int) []int {\n    res := []int{}\n    for _, r := range readings {\n        if r != -1 {\n            res = append(res, r)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "25 26 -1 28 -1 30", expectedStdout: "25 26 28 30", isSample: true },
      { stdin: "-1 -1", expectedStdout: "", isSample: true },
      { stdin: "15 20", expectedStdout: "15 20" },
      { stdin: "", expectedStdout: "" },
      { stdin: "-1", expectedStdout: "" },
      { stdin: "5 -1 5 -1 5", expectedStdout: "5 5 5" },
      { stdin: "1 2 3 4 5 -1", expectedStdout: "1 2 3 4 5" },
      { stdin: "0 -1 0 -1 0", expectedStdout: "0 0 0" },
    ],
  }),

  p({
    ...base,
    slug: "drone-delivery-distance",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Drone Delivery Distance",
    patternTags: ["simulation","array","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "An automated delivery drone starts at a warehouse located at position `0` on a long straight road. It is given a list of delivery `destinations`, representing the positions it needs to visit in order.\n\nCalculate the total distance the drone travels to complete all its deliveries.\n\n**Constraints**\n- `0 <= destinations.length <= 40`\n- `-100 <= destinations[i] <= 100`\n\n**Example 1**\n```\ninput:\n10 5 15\noutput: 25\n```\n*Explanation: Drone starts at 0, moves to 10 (dist 10). Then moves to 5 (dist 5). Then moves to 15 (dist 10). Total = 10 + 5 + 10 = 25.*\n\n**Example 2**\n```\ninput:\n-5 -2\noutput: 8\n```\n*Explanation: Drone starts at 0, moves to -5 (dist 5). Then moves to -2 (dist 3). Total = 5 + 3 = 8.*\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\n*Explanation: There are no destinations, so it travels 0 distance.*\n\n**Follow-up**\nCan you compute this with mathcal{O}(1) space complexity?",
    editorialMarkdown: "## Drone Delivery Distance\nTo find the total distance traveled by the drone, we keep track of its current location, which starts at `0`. For each destination in the input array, we add the absolute difference between the current location and the destination to our total distance, and then update our current location to the new destination.\n\n**Trap**: Make sure to use the absolute value function so that moving to a smaller coordinate doesn't subtract from your total distance!\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of destinations.\n- **Space Complexity:** mathcal{O}(1) since we only need variables to track the distance and current position.",
    referenceSolution: {
      JAVASCRIPT: "function solve(destinations) {\n    let totalDist = 0;\n    let curr = 0;\n    for (let d of destinations) {\n        totalDist += Math.abs(d - curr);\n        curr = d;\n    }\n    return totalDist;\n}",
      TYPESCRIPT: "function solve(destinations: number[]): number {\n    let totalDist = 0;\n    let curr = 0;\n    for (const d of destinations) {\n        totalDist += Math.abs(d - curr);\n        curr = d;\n    }\n    return totalDist;\n}",
      PYTHON: "def solve(destinations):\n    total_dist = 0\n    curr = 0\n    for d in destinations:\n        total_dist += abs(d - curr)\n        curr = d\n    return total_dist",
      JAVA: "    static int solve(int[] destinations) {\n        int totalDist = 0;\n        int curr = 0;\n        for (int d : destinations) {\n            totalDist += Math.abs(d - curr);\n            curr = d;\n        }\n        return totalDist;\n    }",
      CPP: "#include <vector>\n#include <cmath>\n\nusing namespace std;\n\nint solve(vector<int> destinations) {\n    int totalDist = 0;\n    int curr = 0;\n    for (int d : destinations) {\n        totalDist += abs(d - curr);\n        curr = d;\n    }\n    return totalDist;\n}",
      GO: "func solve(destinations []int) int {\n    totalDist := 0\n    curr := 0\n    for _, d := range destinations {\n        diff := d - curr\n        if diff < 0 {\n            diff = -diff\n        }\n        totalDist += diff\n        curr = d\n    }\n    return totalDist\n}",
    },
    tests: [
      { stdin: "10 5 15", expectedStdout: "25", isSample: true },
      { stdin: "-5 -2", expectedStdout: "8", isSample: true },
      { stdin: "", expectedStdout: "0" },
      { stdin: "100", expectedStdout: "100" },
      { stdin: "100 -100", expectedStdout: "300" },
      { stdin: "0 0 0 0", expectedStdout: "0" },
      { stdin: "2 4 6 8 10 8 6 4 2 0", expectedStdout: "20" },
      { stdin: "1 -2 3 -4", expectedStdout: "16" },
    ],
  }),

  p({
    ...base,
    slug: "evaluate-logic-circuit",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TREES",
    title: "Command Chain Execution",
    patternTags: ["tree","trees","dfs","recursion"],
    signatureId: "fn:tree->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "A strategic operation is structured as a full binary tree of command nodes. Each node dictates the success or failure of a segment of the operation:\n- A leaf node contains an immediate outcome: `0` denotes a Failure, and `1` denotes a Success.\n- An internal node dictates an aggregation requirement: `2` represents an **ANY** condition (returns Success if at least one child is a Success), and `3` represents an **ALL** condition (returns Success only if both children are a Success).\n\nDetermine the operation's outcome by resolving the conditions from the leaf nodes up to the root, and return the final boolean result (`true` for Success, `false` for Failure).\n\n**Constraints**\n- The number of nodes is between `1` and `100`.\n- The tree is a full binary tree (every node has `0` or `2` children).\n- Node values are `0`, `1`, `2`, or `3`.\n- Leaf nodes always have values `0` or `1`.\n- Internal nodes always have values `2` or `3`.\n\n**Example 1**\n```\ninput:\n2 1 3 null null 0 1\noutput: true\n```\n*Explanation: The root is an ANY condition (2). Its left child is Success (1). Its right child is an ALL condition (3) which evaluates its children Failure (0) and Success (1) to Failure. Finally, Success ANY Failure results in true.*\n\n**Example 2**\n```\ninput:\n0\noutput: false\n```\n*Explanation: The tree consists of a single leaf node indicating Failure (0).*\n\n**Example 3**\n```\ninput:\n3 1 1\noutput: true\n```\n*Explanation: The root is an ALL condition (3) with two Success (1) children. Success ALL Success evaluates to true.*\n\n**Follow-up**\nIs there a way to short-circuit the evaluation so that you do not evaluate parts of the tree that are unnecessary?",
    editorialMarkdown: "## Evaluate Logic Circuit\nWe can use a recursive depth-first search to evaluate the tree. Base cases are leaf nodes which are either `0` (false) or `1` (true). For internal nodes, we evaluate the left and right subtrees and combine their results using `OR` (if the node's value is `2`) or `AND` (if the node's value is `3`).\n\n**Trap**: Make sure to apply the boolean operations properly and return primitive boolean values. You don't need to check for `null` if the problem guarantees a valid full binary tree, but it's safe to do so.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of nodes in the tree, because we visit each node exactly once.\n- **Space Complexity:** mathcal{O}(H) where H is the height of the tree, due to the recursion stack.",
    referenceSolution: {
      JAVASCRIPT: "function solve(root) {\n    if (!root) return false;\n    if (!root.left && !root.right) {\n        return root.val === 1;\n    }\n    const left = solve(root.left);\n    const right = solve(root.right);\n    if (root.val === 2) {\n        return left || right;\n    }\n    return left && right;\n}",
      TYPESCRIPT: "function solve(root: any): boolean {\n    if (!root) return false;\n    if (!root.left && !root.right) {\n        return root.val === 1;\n    }\n    const left = solve(root.left);\n    const right = solve(root.right);\n    if (root.val === 2) {\n        return left || right;\n    }\n    return left && right;\n}",
      PYTHON: "def solve(root):\n    if not root: return False\n    if not root.left and not root.right:\n        return root.val == 1\n    left = solve(root.left)\n    right = solve(root.right)\n    if root.val == 2:\n        return left or right\n    return left and right",
      JAVA: "    static boolean solve(TreeNode root) {\n        if (root == null) return false;\n        if (root.left == null && root.right == null) {\n            return root.val == 1;\n        }\n        boolean left = solve(root.left);\n        boolean right = solve(root.right);\n        if (root.val == 2) {\n            return left || right;\n        }\n        return left && right;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nbool solve(TreeNode* root) {\n    if (!root) return false;\n    if (!root->left && !root->right) return root->val == 1;\n    bool left = solve(root->left);\n    bool right = solve(root->right);\n    if (root->val == 2) return left || right;\n    return left && right;\n}",
      GO: "func solve(root *TreeNode) bool {\n    if root == nil {\n        return false\n    }\n    if root.Left == nil && root.Right == nil {\n        return root.Val == 1\n    }\n    left := solve(root.Left)\n    right := solve(root.Right)\n    if root.Val == 2 {\n        return left || right\n    }\n    return left && right\n}",
    },
    tests: [
      { stdin: "2 1 3 null null 0 1", expectedStdout: "true", isSample: true },
      { stdin: "0", expectedStdout: "false", isSample: true },
      { stdin: "3 1 1", expectedStdout: "true", isSample: true },
      { stdin: "3 1 0", expectedStdout: "false" },
      { stdin: "1", expectedStdout: "true" },
      { stdin: "2 0 3 null null 1 0", expectedStdout: "false" },
      { stdin: "3 1 2 null null 0 1", expectedStdout: "true" },
      { stdin: "3 3 2 1 0 0 1", expectedStdout: "false" },
    ],
  }),
];
