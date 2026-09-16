import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-025` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_025_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "robot-step-climb",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "DP_1D",
    title: "Cargo Ship Loadouts",
    patternTags: ["dynamic-programming","fibonacci","math"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 480,
    promptMarkdown: "You are tasked with planning the loading of a cargo ship that must carry exactly `n` tons of cargo. The loading cranes are equipped to load crates that weigh either 1 ton or 2 tons each, one at a time.\n\nGiven the total required weight `n`, calculate the total number of unique sequences of crates that sum to exactly `n` tons.\n\n**Constraints**\n- `1 <= n <= 45`\n\n**Example 1**\n```\ninput:\n2\noutput: 2\n```\nExplanation: The ship can be loaded with two 1-ton crates (1+1) or one 2-ton crate (2).\n\n**Example 2**\n```\ninput:\n3\noutput: 3\n```\nExplanation: There are three valid sequences: (1+1+1), (1+2), and (2+1).\n\n**Example 3**\n```\ninput:\n4\noutput: 5\n```\nExplanation: The valid sequences are (1+1+1+1), (1+1+2), (1+2+1), (2+1+1), and (2+2).\n\n**Follow-up:** Can you implement a solution that uses only \\mathcal{O}(1) extra space?",
    editorialMarkdown: "## Robot Step Climb\n\nThis is a classic dynamic programming problem that reduces to the Fibonacci sequence. To reach step `n`, the robot must have come from either step `n-1` (by taking a 1-unit hop) or step `n-2` (by taking a 2-unit hop). Therefore, the number of ways to reach step `n` is the sum of the ways to reach step `n-1` and step `n-2`.\n\nWe can optimize the space complexity by only keeping track of the last two calculated values instead of storing the entire sequence in an array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) since we iterate from 2 to `n`.\n- **Space Complexity:** mathcal{O}(1) because we only use two variables to store previous states.\n\n**Common Trap:**\nA common mistake is using naive recursion without memoization, which results in an exponential mathcal{O}(2^N) time complexity and will cause a Time Limit Exceeded error on larger inputs.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    if (n <= 1) return 1;\n    let a = 1, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    if (n <= 1) return 1;\n    let a = 1, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      PYTHON: "def solve(n):\n    if n <= 1: return 1\n    a, b = 1, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b",
      JAVA: "    static int solve(int n) {\n        if (n <= 1) return 1;\n        int a = 1, b = 1;\n        for (int i = 2; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }",
      CPP: "int solve(int n) {\n    if (n <= 1) return 1;\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      GO: "func solve(n int) int {\n    if n <= 1 {\n        return 1\n    }\n    a, b := 1, 1\n    for i := 2; i <= n; i++ {\n        a, b = b, a+b\n    }\n    return b\n}",
    },
    tests: [
      { stdin: "2", expectedStdout: "2", isSample: true },
      { stdin: "3", expectedStdout: "3", isSample: true },
      { stdin: "4", expectedStdout: "5", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "5", expectedStdout: "8" },
      { stdin: "10", expectedStdout: "89" },
      { stdin: "20", expectedStdout: "10946" },
      { stdin: "45", expectedStdout: "1836311903" },
    ],
  }),

  p({
    ...base,
    slug: "flip-sensor-bits",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Flip Sensor Bits",
    patternTags: ["bit-manipulation","math"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 420,
    promptMarkdown: "You are calibrating a binary sensor for a robotics platform. Due to a hardware inversion flaw, the sensor is reporting the exact opposite state for each of its active bits.\n\nGiven an integer `n` representing the sensor's current read, calculate its true value by flipping all the bits in its binary representation. The bits to flip start from the most significant bit that is set to `1` down to the least significant bit. If the sensor reads `0`, its true value is `1`.\n\n**Constraints**\n- `0 <= n < 10^9`\n\n**Example 1**\n```\ninput:\n5\noutput: 2\n```\nExplanation: 5 is \"101\" in binary. Flipping all the bits gives \"010\", which is 2.\n\n**Example 2**\n```\ninput:\n7\noutput: 0\n```\nExplanation: 7 is \"111\" in binary. Flipping all the bits gives \"000\", which is 0.\n\n**Example 3**\n```\ninput:\n0\noutput: 1\n```\nExplanation: 0 in binary has a complement of 1.\n\n**Follow-up:** Can you solve this without using any loops or string conversions, purely through bitwise operations?",
    editorialMarkdown: "## Flip Sensor Bits\n\nThe problem asks for the bitwise complement of a number, but restricted strictly to its meaningful binary representation (without leading zeroes). \n\nWe can solve this by constructing a bitmask of all `1`s that is exactly the same length as the binary representation of `n`. For example, if `n` is `5` (binary `101`), the mask should be `7` (binary `111`). Once we have the mask, we can simply use the XOR operator (`^`) between `n` and the mask to flip exactly those bits. \n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(1) or mathcal{O}(log N) depending on how we construct the mask. By repeatedly setting bits using bitwise OR and shifts, it takes constant time.\n- **Space Complexity:** mathcal{O}(1) since we only use a few integer variables.\n\n**Common Trap:**\nA common mistake is to return `~n`, which flips all 32 bits (including leading zeroes), rather than only flipping up to the most significant bit. Another edge case is when `n` is `0`, which requires a special check to return `1`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    if (n === 0) return 1;\n    let mask = n;\n    mask |= mask >> 1;\n    mask |= mask >> 2;\n    mask |= mask >> 4;\n    mask |= mask >> 8;\n    mask |= mask >> 16;\n    return n ^ mask;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    if (n === 0) return 1;\n    let mask = n;\n    mask |= mask >> 1;\n    mask |= mask >> 2;\n    mask |= mask >> 4;\n    mask |= mask >> 8;\n    mask |= mask >> 16;\n    return n ^ mask;\n}",
      PYTHON: "def solve(n):\n    if n == 0: return 1\n    mask = n\n    mask |= mask >> 1\n    mask |= mask >> 2\n    mask |= mask >> 4\n    mask |= mask >> 8\n    mask |= mask >> 16\n    return n ^ mask",
      JAVA: "    static int solve(int n) {\n        if (n == 0) return 1;\n        int mask = n;\n        mask |= mask >> 1;\n        mask |= mask >> 2;\n        mask |= mask >> 4;\n        mask |= mask >> 8;\n        mask |= mask >> 16;\n        return n ^ mask;\n    }",
      CPP: "int solve(int n) {\n    if (n == 0) return 1;\n    int mask = n;\n    mask |= mask >> 1;\n    mask |= mask >> 2;\n    mask |= mask >> 4;\n    mask |= mask >> 8;\n    mask |= mask >> 16;\n    return n ^ mask;\n}",
      GO: "func solve(n int) int {\n    if n == 0 {\n        return 1\n    }\n    mask := n\n    mask |= mask >> 1\n    mask |= mask >> 2\n    mask |= mask >> 4\n    mask |= mask >> 8\n    mask |= mask >> 16\n    return n ^ mask\n}",
    },
    tests: [
      { stdin: "5", expectedStdout: "2", isSample: true },
      { stdin: "7", expectedStdout: "0", isSample: true },
      { stdin: "0", expectedStdout: "1", isSample: true },
      { stdin: "10", expectedStdout: "5" },
      { stdin: "1", expectedStdout: "0" },
      { stdin: "15", expectedStdout: "0" },
      { stdin: "27", expectedStdout: "4" },
      { stdin: "536870912", expectedStdout: "536870911" },
    ],
  }),

  p({
    ...base,
    slug: "clean-corrupted-logs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "STACK",
    title: "Potion Ingredient Neutralization",
    patternTags: ["stack","string","simulation"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are brewing a complex potion using a recipe described by a string `s`, which contains lowercase English letters (ingredients) and digits (neutralizers).\n\nAs you read the recipe from left to right, you add ingredients to your cauldron. Whenever you encounter a digit, it represents a drop of neutralizer that instantly dissolves the most recently added ingredient in the cauldron, as well as the neutralizer drop itself. \n\nDetermine the final sequence of ingredients remaining in the cauldron after following the entire recipe.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `s` consists only of lowercase English letters and digits.\n- The input is guaranteed to be valid, meaning there is always at least one ingredient in the cauldron to dissolve when a neutralizer is added.\n\n**Example 1**\n```\ninput:\nabc\noutput: abc\n```\nExplanation: No neutralizers are added, so all ingredients remain.\n\n**Example 2**\n```\ninput:\nserver1log2\noutput: servelo\n```\nExplanation: The neutralizer '1' dissolves 'r', and '2' dissolves 'g'. The remaining ingredients are \"servelo\".\n\n**Example 3**\n```\ninput:\nab98\noutput: \n```\nExplanation: The neutralizer '9' dissolves 'b', and '8' dissolves 'a'. The cauldron is left empty.\n\n**Follow-up:** Can you solve this in \\mathcal{O}(N) time complexity?",
    editorialMarkdown: "## Clean Corrupted Logs\n\nThe optimal approach is to simulate the process using a stack. We iterate through the log string character by character. When we encounter a regular letter, we push it onto the stack. When we encounter a digit, it means the most recent uncorrupted letter was actually corrupted, so we pop the top element from the stack (if it is not empty). Finally, we join the characters remaining in the stack to form the cleaned log.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string. We process each character exactly once.\n- **Space Complexity:** mathcal{O}(N) to store the characters in the stack.\n\n**Common Trap:**\nA common mistake is using repeated string replacement or modifying the string in place using loops and splices, which degrades the time complexity to mathcal{O}(N^2) due to string immutability or shifting elements.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    const stack = [];\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] >= '0' && s[i] <= '9') {\n            if (stack.length > 0) stack.pop();\n        } else {\n            stack.push(s[i]);\n        }\n    }\n    return stack.join('');\n}",
      TYPESCRIPT: "function solve(s: string): string {\n    const stack: string[] = [];\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] >= '0' && s[i] <= '9') {\n            if (stack.length > 0) stack.pop();\n        } else {\n            stack.push(s[i]);\n        }\n    }\n    return stack.join('');\n}",
      PYTHON: "def solve(s):\n    stack = []\n    for c in s:\n        if '0' <= c <= '9':\n            if stack:\n                stack.pop()\n        else:\n            stack.append(c)\n    return \"\".join(stack)",
      JAVA: "    static String solve(String s) {\n        StringBuilder sb = new StringBuilder();\n        for (char c : s.toCharArray()) {\n            if (c >= '0' && c <= '9') {\n                if (sb.length() > 0) {\n                    sb.deleteCharAt(sb.length() - 1);\n                }\n            } else {\n                sb.append(c);\n            }\n        }\n        return sb.toString();\n    }",
      CPP: "#include <string>\n#include <vector>\n\nstd::string solve(std::string s) {\n    std::vector<char> stack;\n    for (char c : s) {\n        if (c >= '0' && c <= '9') {\n            if (!stack.empty()) {\n                stack.pop_back();\n            }\n        } else {\n            stack.push_back(c);\n        }\n    }\n    return std::string(stack.begin(), stack.end());\n}",
      GO: "func solve(s string) string {\n    stack := []rune{}\n    for _, c := range s {\n        if c >= '0' && c <= '9' {\n            if len(stack) > 0 {\n                stack = stack[:len(stack)-1]\n            }\n        } else {\n            stack = append(stack, c)\n        }\n    }\n    return string(stack)\n}",
    },
    tests: [
      { stdin: "abc", expectedStdout: "abc", isSample: true },
      { stdin: "server1log2", expectedStdout: "servelo", isSample: true },
      { stdin: "ab98", expectedStdout: "", isSample: true },
      { stdin: "ab1c2", expectedStdout: "a" },
      { stdin: "x", expectedStdout: "x" },
      { stdin: "a1", expectedStdout: "" },
      { stdin: "aa1", expectedStdout: "a" },
      { stdin: "hello", expectedStdout: "hello" },
    ],
  }),

  p({
    ...base,
    slug: "merge-salary-data",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Merge Salary Data",
    patternTags: ["hash-map","array","hash-set"],
    signatureId: "fn:ints,ints->ints",
    avgSolveSeconds: 750,
    promptMarkdown: "You are migrating HR records for a company and need to combine two flat datasets into a single unified payroll report. \n\nArray `a` contains pairs of integers representing `[employeeId, baseSalary]`. Array `b` contains pairs of integers representing `[employeeId, bonusAmount]`. Not all employees have a bonus.\n\nYou need to produce a single flattened array containing `[employeeId, baseSalary, bonusAmount]` for every employee listed in array `a`, maintaining the exact order of employees as they appear in array `a`. \n\nIf an employee in `a` does not appear in `b`, their bonus amount should be reported as `0`. Employees appearing in `b` but not in `a` should be ignored.\n\n**Constraints**\n- `a.length` and `b.length` are even integers between `0` and `2000`.\n- `1 <= employeeId <= 10^5`\n- `0 <= baseSalary, bonusAmount <= 10^6`\n- Employee IDs within array `a` are distinct. Employee IDs within array `b` are distinct.\n\n**Example 1**\n```\ninput:\n1 5000 2 6000\n2 1000 3 500\noutput: 1 5000 0 2 6000 1000\n```\nExplanation: Employee 1 has no bonus, so it is 0. Employee 2 has a bonus of 1000. Employee 3 is ignored because they are not in array `a`.\n\n**Example 2**\n```\ninput:\n10 4000\n10 200\noutput: 10 4000 200\n```\nExplanation: Employee 10 has a base salary of 4000 and a bonus of 200.\n\n**Example 3**\n```\ninput:\n5 3000\n4 500\noutput: 5 3000 0\n```\nExplanation: Employee 5 has no bonus, so 0 is added.\n\n**Follow-up:** How does your solution handle extremely sparse bonus records where only a fraction of employees receive one?",
    editorialMarkdown: "## Merge Salary Data\n\nThis problem asks us to perform an operation equivalent to a SQL Left Join on two datasets represented as 1D arrays of key-value pairs.\n\nThe optimal approach is to process the secondary data array (`b`) first. We iterate through it by pairs and store the mappings from employee ID to bonus in a Hash Map. Then, we construct the result array by iterating through the primary data array (`a`) by pairs. For each employee ID, we append the ID and base salary to the result array. We then look up the ID in our Hash Map; if a bonus is found, we append it, otherwise we append 0.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N + M) where N and M are the lengths of array `a` and array `b`. We traverse both arrays once.\n- **Space Complexity:** mathcal{O}(M) to store the key-value mappings of array `b` in a Hash Map.\n\n**Common Trap:**\nA common mistake is repeatedly scanning array `b` for every element in array `a`, resulting in an mathcal{O}(N × M) time complexity, which is highly inefficient. Using a Hash Map ensures constant-time lookups.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n    const bonusMap = new Map();\n    for (let i = 0; i < b.length; i += 2) {\n        bonusMap.set(b[i], b[i+1]);\n    }\n    const res = [];\n    for (let i = 0; i < a.length; i += 2) {\n        res.push(a[i]);\n        res.push(a[i+1]);\n        res.push(bonusMap.has(a[i]) ? bonusMap.get(a[i]) : 0);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: number[], b: number[]): number[] {\n    const bonusMap = new Map<number, number>();\n    for (let i = 0; i < b.length; i += 2) {\n        bonusMap.set(b[i], b[i+1]);\n    }\n    const res: number[] = [];\n    for (let i = 0; i < a.length; i += 2) {\n        res.push(a[i]);\n        res.push(a[i+1]);\n        res.push(bonusMap.has(a[i]) ? bonusMap.get(a[i])! : 0);\n    }\n    return res;\n}",
      PYTHON: "def solve(a, b):\n    bonus = {}\n    for i in range(0, len(b), 2):\n        bonus[b[i]] = b[i+1]\n    res = []\n    for i in range(0, len(a), 2):\n        res.append(a[i])\n        res.append(a[i+1])\n        res.append(bonus.get(a[i], 0))\n    return res",
      JAVA: "    static int[] solve(int[] a, int[] b) {\n        java.util.Map<Integer, Integer> bonusMap = new java.util.HashMap<>();\n        for (int i = 0; i < b.length; i += 2) {\n            bonusMap.put(b[i], b[i+1]);\n        }\n        int[] res = new int[(a.length / 2) * 3];\n        int idx = 0;\n        for (int i = 0; i < a.length; i += 2) {\n            res[idx++] = a[i];\n            res[idx++] = a[i+1];\n            res[idx++] = bonusMap.getOrDefault(a[i], 0);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n\nstd::vector<int> solve(std::vector<int> a, std::vector<int> b) {\n    std::unordered_map<int, int> bonusMap;\n    for (size_t i = 0; i < b.size(); i += 2) {\n        bonusMap[b[i]] = b[i+1];\n    }\n    std::vector<int> res;\n    for (size_t i = 0; i < a.size(); i += 2) {\n        res.push_back(a[i]);\n        res.push_back(a[i+1]);\n        if (bonusMap.count(a[i])) {\n            res.push_back(bonusMap[a[i]]);\n        } else {\n            res.push_back(0);\n        }\n    }\n    return res;\n}",
      GO: "func solve(a []int, b []int) []int {\n    bonus := make(map[int]int)\n    for i := 0; i < len(b); i += 2 {\n        bonus[b[i]] = b[i+1]\n    }\n    var res []int\n    for i := 0; i < len(a); i += 2 {\n        res = append(res, a[i])\n        res = append(res, a[i+1])\n        if val, ok := bonus[a[i]]; ok {\n            res = append(res, val)\n        } else {\n            res = append(res, 0)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 5000 2 6000\n2 1000 3 500", expectedStdout: "1 5000 0 2 6000 1000", isSample: true },
      { stdin: "10 4000\n10 200", expectedStdout: "10 4000 200", isSample: true },
      { stdin: "5 3000\n4 500", expectedStdout: "5 3000 0", isSample: true },
      { stdin: "\n", expectedStdout: "" },
      { stdin: "\n1 100", expectedStdout: "" },
      { stdin: "1 100\n", expectedStdout: "1 100 0" },
      { stdin: "1 100 2 200 3 300\n3 100 1 50 4 500", expectedStdout: "1 100 50 2 200 0 3 300 100" },
      { stdin: "1 500 2 500\n10 100", expectedStdout: "1 500 0 2 500 0" },
    ],
  }),

  p({
    ...base,
    slug: "net-energy-flux",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Net Energy Flux",
    patternTags: ["array","math","simulation"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are developing a dashboard to display the net energy flux of an experimental generator. The generator operates in phases, recording energy spikes sequentially in an array `a`.\n\nDue to the internal alternating currents, the net energy flux is calculated by adding the value of the first phase, subtracting the second, adding the third, subtracting the fourth, and so on.\n\nGiven an array of integers `a`, return the total net energy flux.\n\n**Constraints**\n- `1 <= a.length <= 1000`\n- `-100 <= a[i] <= 100`\n\n**Example 1**\n```\ninput:\n5 2 1 6\noutput: -2\n```\nExplanation: We add the first (5), subtract the second (2), add the third (1), and subtract the fourth (6). The calculation is 5 - 2 + 1 - 6 = -2.\n\n**Example 2**\n```\ninput:\n1 1 1 1 1\noutput: 1\n```\nExplanation: The calculation is 1 - 1 + 1 - 1 + 1 = 1.\n\n**Example 3**\n```\ninput:\n10\noutput: 10\n```\nExplanation: There is only one phase, so the net flux is just its value.\n\n**Follow-up:** Could you implement this recursively instead of iteratively?",
    editorialMarkdown: "## Net Energy Flux\n\nTo find the net energy flux, we can iterate through the elements in the input array one by one. By checking the index of each element, we know whether to add or subtract its value from our running total.\n\nSpecifically, for elements at even indices (`0`, `2`, `4`...), we add the value to the sum. For elements at odd indices (`1`, `3`, `5`...), we subtract the value from the sum. \n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of elements in the array. We scan through the array exactly once.\n- **Space Complexity:** mathcal{O}(1) since we only need a single integer variable to accumulate the result.\n\n**Common Trap:**\nA common mistake is starting the index count at 1 instead of 0, which would reverse the additions and subtractions. Another error is failing to initialize the running sum at 0, or mutating the array instead of computing the result directly.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let sum = 0;\n    for (let i = 0; i < a.length; i++) {\n        if (i % 2 === 0) {\n            sum += a[i];\n        } else {\n            sum -= a[i];\n        }\n    }\n    return sum;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let sum = 0;\n    for (let i = 0; i < a.length; i++) {\n        if (i % 2 === 0) {\n            sum += a[i];\n        } else {\n            sum -= a[i];\n        }\n    }\n    return sum;\n}",
      PYTHON: "def solve(a):\n    sum = 0\n    for i in range(len(a)):\n        if i % 2 == 0:\n            sum += a[i]\n        else:\n            sum -= a[i]\n    return sum",
      JAVA: "    static int solve(int[] a) {\n        int sum = 0;\n        for (int i = 0; i < a.length; i++) {\n            if (i % 2 == 0) {\n                sum += a[i];\n            } else {\n                sum -= a[i];\n            }\n        }\n        return sum;\n    }",
      CPP: "#include <vector>\n\nint solve(std::vector<int> a) {\n    int sum = 0;\n    for (size_t i = 0; i < a.size(); i++) {\n        if (i % 2 == 0) {\n            sum += a[i];\n        } else {\n            sum -= a[i];\n        }\n    }\n    return sum;\n}",
      GO: "func solve(a []int) int {\n    sum := 0\n    for i := 0; i < len(a); i++ {\n        if i % 2 == 0 {\n            sum += a[i]\n        } else {\n            sum -= a[i]\n        }\n    }\n    return sum\n}",
    },
    tests: [
      { stdin: "5 2 1 6", expectedStdout: "-2", isSample: true },
      { stdin: "1 1 1 1 1", expectedStdout: "1", isSample: true },
      { stdin: "10", expectedStdout: "10", isSample: true },
      { stdin: "5 5", expectedStdout: "0" },
      { stdin: "10 -2", expectedStdout: "12" },
      { stdin: "0 -10 0 -10", expectedStdout: "20" },
      { stdin: "-50", expectedStdout: "-50" },
      { stdin: "-10 -10 -10 -10 -10 -10 -10", expectedStdout: "-10" },
    ],
  }),
];
