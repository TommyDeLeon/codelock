import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-051` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_051_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "missing-product-ids",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Unreported Sensor Logs",
    patternTags: ["array","hash-set","counting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 420,
    promptMarkdown: "You are auditing a network of `n` sensors, which are supposed to report their statuses sequentially from 1 to `n`. You are given an array `logs` of length `n` representing the sensor IDs that successfully reported back. Due to intermittent network failures, some sensors might have reported multiple times, while others failed to report at all.\n\nWrite a function to return an array of all sensor IDs that failed to report, sorted in ascending order.\n\n**Constraints**\n- `1 <= logs.length <= 100`\n- `1 <= logs[i] <= logs.length`\n\n**Example 1**\n```\ninput:\n4 3 2 7 8 2 3 1\noutput: 5 6\n```\n*Explanation: There are 8 sensors in total. Sensors 5 and 6 did not report.*\n\n**Example 2**\n```\ninput:\n1 1\noutput: 2\n```\n*Explanation: With 2 sensors expected, sensor 2 failed to report.*\n\n**Example 3**\n```\ninput:\n1 2 3 4\noutput: \n```\n*Explanation: All sensors successfully reported, so the missing list is empty.*\n\n**Follow-up**\nCan you accomplish this task using mathcal{O}(N) time complexity and mathcal{O}(1) auxiliary space (ignoring the space used by the output array)?",
    editorialMarkdown: "## Missing Product IDs\nThe problem asks us to find which numbers in the range `[1, n]` are missing from the array, where `n` is the array's length. We can use a hash set to store all the unique numbers present in the array. Then, we iterate from `1` to `n` and check which numbers are not in the set, adding them to our result array. Alternatively, we can use an in-place modification technique by marking the index corresponding to each number as negative.\n\n**Trap**: Make sure to check numbers up to exactly `n` (the length of the array), not just the maximum value found in the array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), as we can insert all elements into a hash set and then iterate from `1` to `N`.\n- **Space Complexity:** mathcal{O}(N) to store the hash set, or mathcal{O}(1) auxiliary space if we use the in-place negation trick.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ids) {\n    for (let i = 0; i < ids.length; i++) {\n        let index = Math.abs(ids[i]) - 1;\n        if (ids[index] > 0) {\n            ids[index] = -ids[index];\n        }\n    }\n    let res = [];\n    for (let i = 0; i < ids.length; i++) {\n        if (ids[i] > 0) {\n            res.push(i + 1);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(ids: number[]): number[] {\n    for (let i = 0; i < ids.length; i++) {\n        let index = Math.abs(ids[i]) - 1;\n        if (ids[index] > 0) {\n            ids[index] = -ids[index];\n        }\n    }\n    let res: number[] = [];\n    for (let i = 0; i < ids.length; i++) {\n        if (ids[i] > 0) {\n            res.push(i + 1);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(ids):\n    for i in range(len(ids)):\n        index = abs(ids[i]) - 1\n        if ids[index] > 0:\n            ids[index] = -ids[index]\n    res = []\n    for i in range(len(ids)):\n        if ids[i] > 0:\n            res.append(i + 1)\n    return res",
      JAVA: "    static int[] solve(int[] ids) {\n        for (int i = 0; i < ids.length; i++) {\n            int index = Math.abs(ids[i]) - 1;\n            if (ids[index] > 0) {\n                ids[index] = -ids[index];\n            }\n        }\n        int count = 0;\n        for (int i = 0; i < ids.length; i++) {\n            if (ids[i] > 0) count++;\n        }\n        int[] res = new int[count];\n        int j = 0;\n        for (int i = 0; i < ids.length; i++) {\n            if (ids[i] > 0) {\n                res[j++] = i + 1;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <cmath>\nusing namespace std;\n\nvector<int> solve(vector<int> ids) {\n    for (int i = 0; i < ids.size(); i++) {\n        int index = abs(ids[i]) - 1;\n        if (ids[index] > 0) {\n            ids[index] = -ids[index];\n        }\n    }\n    vector<int> res;\n    for (int i = 0; i < ids.size(); i++) {\n        if (ids[i] > 0) {\n            res.push_back(i + 1);\n        }\n    }\n    return res;\n}",
      GO: "func solve(ids []int) []int {\n    for i := 0; i < len(ids); i++ {\n        val := ids[i]\n        if val < 0 {\n            val = -val\n        }\n        index := val - 1\n        if ids[index] > 0 {\n            ids[index] = -ids[index]\n        }\n    }\n    var res []int\n    for i := 0; i < len(ids); i++ {\n        if ids[i] > 0 {\n            res = append(res, i+1)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "4 3 2 7 8 2 3 1", expectedStdout: "5 6", isSample: true },
      { stdin: "1 1", expectedStdout: "2", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "", isSample: true },
      { stdin: "1 3 3", expectedStdout: "2" },
      { stdin: "2 2", expectedStdout: "1" },
      { stdin: "1 1 1 1 1 1 1 1 1 1", expectedStdout: "2 3 4 5 6 7 8 9 10" },
      { stdin: "4 4 4 4", expectedStdout: "1 2 3" },
      { stdin: "1 2 4 4", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "find-apex-predator",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GRAPHS",
    title: "Find Apex Predator",
    patternTags: ["matrix","graph","degree"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 480,
    promptMarkdown: "You are a biologist studying the food chain of an alien ecosystem with n species. \n\nYou are given an n × n binary matrix `grid` where `grid[i][j] = 1` indicates that species i eats species j, and `grid[i][j] = 0` indicates it does not. \n\nThe ecosystem is known to have exactly one **apex predator**, which is a species that eats all other species in the ecosystem. Return the index of the apex predator species (0-indexed).\n\n**Constraints**\n- `n == grid.length == grid[i].length`\n- `2 <= n <= 100`\n- `grid[i][j]` is either `0` or `1`.\n- `grid[i][i] == 0` for all i.\n- There is exactly one species i for which `grid[i][j] == 1` for all j neq i.\n\n**Example 1**\n```\ninput:\n0 1;0 0\noutput: 0\n```\n*Explanation: Species 0 eats species 1, but species 1 does not eat species 0. Species 0 is the apex predator.*\n\n**Example 2**\n```\ninput:\n0 0 0;1 0 0;1 1 0\noutput: 2\n```\n*Explanation: Species 2 eats both species 0 and species 1. It is the apex predator.*\n\n**Example 3**\n```\ninput:\n0 1 0;0 0 0;1 1 0\noutput: 2\n```\n*Explanation: Species 2 eats species 0 and 1, making it the apex predator.*\n\n**Follow-up**\nCan you find the apex predator by examining only mathcal{O}(N) elements of the matrix?",
    editorialMarkdown: "## Find Apex Predator\nThe problem asks us to find a species that eats every other species. This means in our `grid` representation, the row for the apex predator will consist entirely of `1`s (except for its own column, `grid[i][i]`, which is `0`). Since there's guaranteed to be exactly one apex predator, we can find it by calculating the sum of elements in each row. The row that sums to n-1 corresponds to the apex predator.\n\n**Trap**: Make sure to check the row sum equals n-1 and not n, because a species doesn't eat itself.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N^2) to traverse the entire matrix, where N is the number of species.\n- **Space Complexity:** mathcal{O}(1) auxiliary space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(grid) {\n    let n = grid.length;\n    for (let i = 0; i < n; i++) {\n        let sum = 0;\n        for (let j = 0; j < n; j++) {\n            sum += grid[i][j];\n        }\n        if (sum === n - 1) return i;\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(grid: number[][]): number {\n    let n = grid.length;\n    for (let i = 0; i < n; i++) {\n        let sum = 0;\n        for (let j = 0; j < n; j++) {\n            sum += grid[i][j];\n        }\n        if (sum === n - 1) return i;\n    }\n    return -1;\n}",
      PYTHON: "def solve(grid):\n    n = len(grid)\n    for i in range(n):\n        if sum(grid[i]) == n - 1:\n            return i\n    return -1",
      JAVA: "    static int solve(int[][] grid) {\n        int n = grid.length;\n        for (int i = 0; i < n; i++) {\n            int sum = 0;\n            for (int j = 0; j < n; j++) {\n                sum += grid[i][j];\n            }\n            if (sum == n - 1) return i;\n        }\n        return -1;\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nint solve(vector<vector<int>> grid) {\n    int n = grid.size();\n    for (int i = 0; i < n; i++) {\n        int sum = 0;\n        for (int j = 0; j < n; j++) {\n            sum += grid[i][j];\n        }\n        if (sum == n - 1) return i;\n    }\n    return -1;\n}",
      GO: "func solve(grid [][]int) int {\n    n := len(grid)\n    for i := 0; i < n; i++ {\n        sum := 0\n        for j := 0; j < n; j++ {\n            sum += grid[i][j]\n        }\n        if sum == n-1 {\n            return i\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "0 1;0 0", expectedStdout: "0", isSample: true },
      { stdin: "0 0 0;1 0 0;1 1 0", expectedStdout: "2", isSample: true },
      { stdin: "0 1 0;0 0 0;1 1 0", expectedStdout: "2", isSample: true },
      { stdin: "0 0 0;1 0 1;0 0 0", expectedStdout: "1" },
      { stdin: "0 0 0 0;1 0 0 0;0 1 0 0;1 1 1 0", expectedStdout: "3" },
      { stdin: "0 1 1 1;0 0 0 0;0 0 0 0;0 0 0 0", expectedStdout: "0" },
      { stdin: "0 0 0 0 0;1 0 0 0 0;0 1 0 0 0;0 0 1 0 0;1 1 1 1 0", expectedStdout: "4" },
      { stdin: "0 0;1 0", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "employees-not-reporting-to-manager",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Employees Not Reporting to Manager",
    patternTags: ["array","filtering","linear-scan"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are reviewing the organizational structure of a small company. You are given an integer array `managers`, where `managers[i]` is the ID of the manager that employee `i` reports to. If `managers[i] == 0`, it means employee `i` has no manager.\n\nReturn an array of the employee IDs (their indices in the `managers` array) who **do not** report to manager ID `2`. The returned array must be sorted in ascending order.\n\n**Constraints**\n- `1 <= managers.length <= 100`\n- `0 <= managers[i] <= 100`\n\n**Example 1**\n```\ninput:\n3 0 2 2 1 0\noutput: 0 1 4 5\n```\n*Explanation: Employees 2 and 3 report to manager 2. Employees 0, 1, 4, and 5 do not.*\n\n**Example 2**\n```\ninput:\n2 2 2\noutput: \n```\n*Explanation: All employees report to manager 2, so the result is empty.*\n\n**Example 3**\n```\ninput:\n0 1 4\noutput: 0 1 2\n```\n*Explanation: No one reports to manager 2.*\n\n**Follow-up**\nCan you accomplish this in a single scan of the array?",
    editorialMarkdown: "## Employees Not Reporting to Manager\nThis problem is a basic filtering task on an array. We iterate through the array of managers. If the value at index `i` is not equal to `2`, we add the index `i` to our result array. Since we iterate from `0` to the end of the array, the output will automatically be in ascending order.\n\n**Trap**: Pay attention to the fact that you need to return the *indices* of the employees, not the manager IDs.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the array, since we check each element once.\n- **Space Complexity:** mathcal{O}(1) auxiliary space, not counting the output array which could be up to size N.",
    referenceSolution: {
      JAVASCRIPT: "function solve(managers) {\n    let res = [];\n    for (let i = 0; i < managers.length; i++) {\n        if (managers[i] !== 2) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(managers: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 0; i < managers.length; i++) {\n        if (managers[i] !== 2) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(managers):\n    res = []\n    for i in range(len(managers)):\n        if managers[i] != 2:\n            res.append(i)\n    return res",
      JAVA: "    static int[] solve(int[] managers) {\n        int count = 0;\n        for (int m : managers) {\n            if (m != 2) count++;\n        }\n        int[] res = new int[count];\n        int j = 0;\n        for (int i = 0; i < managers.length; i++) {\n            if (managers[i] != 2) {\n                res[j++] = i;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> managers) {\n    vector<int> res;\n    for (int i = 0; i < managers.size(); i++) {\n        if (managers[i] != 2) {\n            res.push_back(i);\n        }\n    }\n    return res;\n}",
      GO: "func solve(managers []int) []int {\n    var res []int\n    for i := 0; i < len(managers); i++ {\n        if managers[i] != 2 {\n            res = append(res, i)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "3 0 2 2 1 0", expectedStdout: "0 1 4 5", isSample: true },
      { stdin: "2 2 2", expectedStdout: "", isSample: true },
      { stdin: "0 1 4", expectedStdout: "0 1 2", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "2", expectedStdout: "" },
      { stdin: "2 0 2 1 2 4", expectedStdout: "1 3 5" },
      { stdin: "0 0 0 0 0 0 0 0 0 0", expectedStdout: "0 1 2 3 4 5 6 7 8 9" },
      { stdin: "1 2 3", expectedStdout: "0 2" },
    ],
  }),

  p({
    ...base,
    slug: "first-magic-incantation",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Earliest Symmetrical Code",
    patternTags: ["array","string","palindrome"],
    signatureId: "fn:strings->string",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a sequence of transmission codes intercepted from a secure channel. A valid transmission code must have perfect symmetry, meaning it reads identically from left to right and from right to left.\n\nGiven an array of strings `words` representing the intercepted codes, identify and return the first valid transmission code encountered in the array. If no such symmetrical code exists in the sequence, return an empty string `\"\"`.\n\n**Constraints**\n- `1 <= words.length <= 100`\n- `1 <= words[i].length <= 100`\n- `words[i]` consists only of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabc def racecar xyz\noutput: racecar\n```\n*Explanation: \"racecar\" is the first symmetrical code in the array.*\n\n**Example 2**\n```\ninput:\nnot magic spell\noutput: \n```\n*Explanation: None of the provided strings have perfect symmetry.*\n\n**Example 3**\n```\ninput:\nada level kayak\noutput: ada\n```\n*Explanation: While \"ada\", \"level\", and \"kayak\" are all valid codes, \"ada\" appears first.*\n\n**Follow-up**\nIs it possible to verify the symmetry of each code using mathcal{O}(1) extra space with two pointers?",
    editorialMarkdown: "## First Magic Incantation\nWe must iterate over the given array of strings in order, check each string to see if it is a palindrome, and return the first one that is. A palindrome reads the same backwards as forwards. The palindrome check can be done by using two pointers starting from the ends of the string and moving inwards, comparing characters until they meet. Alternatively, most languages provide built-in ways to reverse strings which can be compared to the original string.\n\n**Trap**: Make sure to return an empty string if no such string exists in the array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N · M) where N is the number of strings and M is the maximum length of a string, as we might need to check every character of every string.\n- **Space Complexity:** mathcal{O}(M) if reversing the string creates a new string, or mathcal{O}(1) if using two pointers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(words) {\n    for (let w of words) {\n        let left = 0, right = w.length - 1;\n        let isPal = true;\n        while (left < right) {\n            if (w[left] !== w[right]) {\n                isPal = false;\n                break;\n            }\n            left++; right--;\n        }\n        if (isPal) return w;\n    }\n    return \"\";\n}",
      TYPESCRIPT: "function solve(words: string[]): string {\n    for (let w of words) {\n        let left = 0, right = w.length - 1;\n        let isPal = true;\n        while (left < right) {\n            if (w[left] !== w[right]) {\n                isPal = false;\n                break;\n            }\n            left++; right--;\n        }\n        if (isPal) return w;\n    }\n    return \"\";\n}",
      PYTHON: "def solve(words):\n    for w in words:\n        if w == w[::-1]:\n            return w\n    return \"\"",
      JAVA: "    static String solve(String[] words) {\n        for (String w : words) {\n            int left = 0, right = w.length() - 1;\n            boolean isPal = true;\n            while (left < right) {\n                if (w.charAt(left) != w.charAt(right)) {\n                    isPal = false;\n                    break;\n                }\n                left++; right--;\n            }\n            if (isPal) return w;\n        }\n        return \"\";\n    }",
      CPP: "#include <vector>\n#include <string>\nusing namespace std;\n\nbool isPalindrome(const string& s) {\n    int left = 0, right = s.length() - 1;\n    while (left < right) {\n        if (s[left] != s[right]) return false;\n        left++; right--;\n    }\n    return true;\n}\n\nstring solve(vector<string> words) {\n    for (const string& w : words) {\n        if (isPalindrome(w)) return w;\n    }\n    return \"\";\n}",
      GO: "func solve(words []string) string {\n    for _, w := range words {\n        left, right := 0, len(w)-1\n        isPal := true\n        for left < right {\n            if w[left] != w[right] {\n                isPal = false\n                break\n            }\n            left++\n            right--\n        }\n        if isPal {\n            return w\n        }\n    }\n    return \"\"\n}",
    },
    tests: [
      { stdin: "abc def racecar xyz", expectedStdout: "racecar", isSample: true },
      { stdin: "not magic spell", expectedStdout: "", isSample: true },
      { stdin: "ada level kayak", expectedStdout: "ada", isSample: true },
      { stdin: "a", expectedStdout: "a" },
      { stdin: "bb", expectedStdout: "bb" },
      { stdin: "hello world madam sir", expectedStdout: "madam" },
      { stdin: "abcd efg aabaa foo", expectedStdout: "aabaa" },
      { stdin: "abcdefghijklmnopqrstuvwxyz zyxwvutsrqponmlkjihgfedcba", expectedStdout: "" },
    ],
  }),
];
