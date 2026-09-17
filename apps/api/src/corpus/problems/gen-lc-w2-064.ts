import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-064` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_064_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "heaviest-cargo-container",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Heaviest Cargo Container",
    patternTags: ["strings","array","counting"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are managing a spaceport loading dock. Each cargo container has a tracking ID. The weight of a container is determined by its ID based on the following rules:\n- If the ID consists **only of digits**, its weight is the numeric value of the ID.\n- Otherwise, its weight is the **length** of the ID string.\n\nGiven an array of strings `strs` representing the container IDs, return the weight of the heaviest container.\n\n**Constraints**\n- `1 <= strs.length <= 50`\n- `1 <= strs[i].length <= 9`\n- `strs[i]` consists only of lowercase English letters and digits.\n\n**Example 1**\n```\ninput:\n12 abc 03 b\noutput:\n12\n```\n*Explanation: The weights are: \"12\" -> 12, \"abc\" -> 3, \"03\" -> 3, \"b\" -> 1. The maximum weight is 12.*\n\n**Example 2**\n```\ninput:\n123a 99\noutput:\n99\n```\n*Explanation: \"123a\" has length 4, so its weight is 4. \"99\" is all digits, so its weight is 99. The max is 99.*\n\n**Example 3**\n```\ninput:\n0009\noutput:\n9\n```\n*Explanation: \"0009\" is purely numeric, its value is 9.*\n\n**Follow-up**\nCan you find a way to quickly check for non-digits without manually scanning if your language provides built-in utilities?",
    editorialMarkdown: "## Heaviest Cargo Container\n\nThis problem asks us to evaluate each string in an array according to a specific rule and find the maximum resulting value. The rule distinguishes between strings that consist entirely of digits and those that contain at least one non-digit character.\n\nThe simplest approach is to iterate through each string, check if all characters are digits (e.g., using a loop or a regular expression). If they are, parse the string as an integer to determine its weight. Otherwise, take the length of the string as its weight. Finally, track the maximum weight encountered so far.\n\n**Trap**: Make sure your language's integer parsing doesn't struggle with leading zeros, or inadvertently parse hex if you use loose methods. Also, remember that empty strings are not tested here based on constraints, but safely handling them is good practice.\n\n**Complexity:**\n- **Time:** O(N * M) where N is the number of strings and M is the maximum length of a string, as we inspect each character.\n- **Space:** O(1) beyond the input storage, since we evaluate strings sequentially without creating large auxiliary data structures.",
    referenceSolution: {
      JAVASCRIPT: "function solve(strs) {\n    let max = 0;\n    for (let s of strs) {\n        let isNum = true;\n        for (let i = 0; i < s.length; i++) {\n            let code = s.charCodeAt(i);\n            if (code < 48 || code > 57) {\n                isNum = false;\n                break;\n            }\n        }\n        let val = isNum ? parseInt(s, 10) : s.length;\n        if (val > max) max = val;\n    }\n    return max;\n}",
      TYPESCRIPT: "function solve(strs: string[]): number {\n    let max = 0;\n    for (let s of strs) {\n        let isNum = true;\n        for (let i = 0; i < s.length; i++) {\n            let code = s.charCodeAt(i);\n            if (code < 48 || code > 57) {\n                isNum = false;\n                break;\n            }\n        }\n        let val = isNum ? parseInt(s, 10) : s.length;\n        if (val > max) max = val;\n    }\n    return max;\n}",
      PYTHON: "def solve(strs):\n    max_val = 0\n    for s in strs:\n        if s.isdigit():\n            val = int(s)\n        else:\n            val = len(s)\n        if val > max_val:\n            max_val = val\n    return max_val",
      JAVA: "    static int solve(String[] strs) {\n        int maxVal = 0;\n        for (String s : strs) {\n            boolean isNum = true;\n            for (char c : s.toCharArray()) {\n                if (c < '0' || c > '9') {\n                    isNum = false;\n                    break;\n                }\n            }\n            int val = isNum ? Integer.parseInt(s) : s.length();\n            if (val > maxVal) maxVal = val;\n        }\n        return maxVal;\n    }",
      CPP: "#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<string> strs) {\n    int maxVal = 0;\n    for (const string& s : strs) {\n        bool isNum = true;\n        for (char c : s) {\n            if (c < '0' || c > '9') {\n                isNum = false;\n                break;\n            }\n        }\n        int val = isNum ? stoi(s) : s.length();\n        if (val > maxVal) maxVal = val;\n    }\n    return maxVal;\n}",
      GO: "func solve(strs []string) int {\n\tmaxVal := 0\n\tfor _, s := range strs {\n\t\tisNum := true\n\t\tfor i := 0; i < len(s); i++ {\n\t\t\tif s[i] < '0' || s[i] > '9' {\n\t\t\t\tisNum = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tval := 0\n\t\tif isNum {\n\t\t\tval, _ = strconv.Atoi(s)\n\t\t} else {\n\t\t\tval = len(s)\n\t\t}\n\t\tif val > maxVal {\n\t\t\tmaxVal = val\n\t\t}\n\t}\n\treturn maxVal\n}",
    },
    tests: [
      { stdin: "12 abc 03 b", expectedStdout: "12", isSample: true },
      { stdin: "123a 99", expectedStdout: "99", isSample: true },
      { stdin: "0009", expectedStdout: "9", isSample: true },
      { stdin: "z", expectedStdout: "1" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "a1 b2 c3", expectedStdout: "2" },
      { stdin: "123456789", expectedStdout: "123456789" },
      { stdin: "abcdefghi", expectedStdout: "9" },
    ],
  }),

  p({
    ...base,
    slug: "interleave-alien-signals",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Weaving Threads",
    patternTags: ["strings","two-pointers"],
    signatureId: "fn:string,string->string",
    avgSolveSeconds: 400,
    promptMarkdown: "You are tasked with weaving two colored threads, represented by strings `s1` and `s2`. To create the woven pattern, you must alternate taking one segment from `s1` and one segment from `s2`, starting with `s1`.\n\nIf one thread is longer than the other, simply attach the remaining segments of the longer thread to the end of the woven pattern.\n\nGiven two strings `s1` and `s2`, return the final woven string.\n\n**Constraints**\n- `1 <= s1.length, s2.length <= 100`\n- `s1` and `s2` consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabc\npqr\noutput:\napbqcr\n```\n*Explanation: Alternating characters gives 'a', 'p', 'b', 'q', 'c', 'r'.*\n\n**Example 2**\n```\ninput:\nab\npqrs\noutput:\napbqrs\n```\n*Explanation: Alternate characters until `s1` is exhausted, then append the rest of `s2` (\"rs\").*\n\n**Example 3**\n```\ninput:\nabcd\npq\noutput:\napbqcd\n```\n*Explanation: Alternate characters until `s2` is exhausted, then append the rest of `s1` (\"cd\").*\n\n**Follow-up**\nCan you build the string efficiently without repetitive string allocations?",
    editorialMarkdown: "## Interleave Alien Signals\n\nThis problem requires us to combine two strings by alternately picking characters from each. If one string is longer than the other, the remaining characters of the longer string should be appended to the end of the combined string.\n\nThe most direct solution is to use two pointers (or a single index) to iterate through both strings simultaneously. At each step `i`, if `i` is within the bounds of the first string, append its character. Then, if `i` is within the bounds of the second string, append its character. We continue this until we have exhausted both strings.\n\n**Trap**: Make sure to check bounds properly. Trying to access an out-of-bounds index might return null characters, undefined, or throw an exception depending on the language.\n\n**Complexity:**\n- **Time:** O(N + M) where N and M are the lengths of the two strings, as we append each character exactly once.\n- **Space:** O(N + M) to store the resulting interleaved string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s1, s2) {\n    let res = \"\";\n    let len = Math.max(s1.length, s2.length);\n    for (let i = 0; i < len; i++) {\n        if (i < s1.length) res += s1[i];\n        if (i < s2.length) res += s2[i];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(s1: string, s2: string): string {\n    let res = \"\";\n    let len = Math.max(s1.length, s2.length);\n    for (let i = 0; i < len; i++) {\n        if (i < s1.length) res += s1[i];\n        if (i < s2.length) res += s2[i];\n    }\n    return res;\n}",
      PYTHON: "def solve(s1, s2):\n    res = []\n    max_len = max(len(s1), len(s2))\n    for i in range(max_len):\n        if i < len(s1):\n            res.append(s1[i])\n        if i < len(s2):\n            res.append(s2[i])\n    return \"\".join(res)",
      JAVA: "    static String solve(String s1, String s2) {\n        StringBuilder sb = new StringBuilder();\n        int len = Math.max(s1.length(), s2.length());\n        for (int i = 0; i < len; i++) {\n            if (i < s1.length()) sb.append(s1.charAt(i));\n            if (i < s2.length()) sb.append(s2.charAt(i));\n        }\n        return sb.toString();\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nstring solve(string s1, string s2) {\n    string res = \"\";\n    int len = max(s1.length(), s2.length());\n    for (int i = 0; i < len; i++) {\n        if (i < s1.length()) res += s1[i];\n        if (i < s2.length()) res += s2[i];\n    }\n    return res;\n}",
      GO: "func solve(s1 string, s2 string) string {\n    res := \"\"\n    len1 := len(s1)\n    len2 := len(s2)\n    maxLen := len1\n    if len2 > maxLen {\n        maxLen = len2\n    }\n    for i := 0; i < maxLen; i++ {\n        if i < len1 {\n            res += string(s1[i])\n        }\n        if i < len2 {\n            res += string(s2[i])\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "abc\npqr", expectedStdout: "apbqcr", isSample: true },
      { stdin: "ab\npqrs", expectedStdout: "apbqrs", isSample: true },
      { stdin: "abcd\npq", expectedStdout: "apbqcd", isSample: true },
      { stdin: "a\nb", expectedStdout: "ab" },
      { stdin: "a\nbcde", expectedStdout: "abcde" },
      { stdin: "abcde\nf", expectedStdout: "afbcde" },
      { stdin: "z\nz", expectedStdout: "zz" },
      { stdin: "hello\nworld", expectedStdout: "hweolrllod" },
    ],
  }),

  p({
    ...base,
    slug: "weakest-runic-stone",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Weakest Runic Stone",
    patternTags: ["array","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are studying a wall of ancient runic stones. Each stone is inscribed with a number. However, the true \"power value\" of a stone is not its inscribed number, but rather the **sum of its digits**.\n\nGiven an array of integers `nums` representing the numbers on the stones, calculate the true power value of each stone and return the minimum power value found on the wall.\n\n**Constraints**\n- `1 <= nums.length <= 100`\n- `1 <= nums[i] <= 10^4`\n\n**Example 1**\n```\ninput:\n10 12 13 14\noutput:\n1\n```\n*Explanation: The power values are 1+0=1, 1+2=3, 1+3=4, 1+4=5. The minimum is 1.*\n\n**Example 2**\n```\ninput:\n1 2 3 4\noutput:\n1\n```\n*Explanation: The power values are simply the digits themselves. The minimum is 1.*\n\n**Example 3**\n```\ninput:\n9999 999\noutput:\n27\n```\n*Explanation: 9999 -> 36, 999 -> 27. The minimum is 27.*\n\n**Follow-up**\nCould you process the array in-place without creating a new one?",
    editorialMarkdown: "## Weakest Runic Stone\n\nThis problem tasks us with calculating a new value for every integer in an array—specifically, the sum of its digits—and then finding the minimum of these new values.\n\nThe straightforward way is to loop over each integer. For each one, use modulo `10` and division by `10` in a while loop to extract and sum its digits. Then, track the smallest digit sum encountered so far. Once all integers have been processed, return the minimum.\n\n**Trap**: Remember to use integer division when shrinking the number, as floating-point division can lead to incorrect digit extraction in dynamically typed languages.\n\n**Complexity:**\n- **Time:** O(N * D) where N is the number of integers and D is the number of digits in the maximum integer. Here, D is at most 4, so it's effectively O(N).\n- **Space:** O(1) extra space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(nums) {\n    let min = Infinity;\n    for (let n of nums) {\n        let sum = 0;\n        let temp = n;\n        while (temp > 0) {\n            sum += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n        if (sum < min) min = sum;\n    }\n    return min;\n}",
      TYPESCRIPT: "function solve(nums: number[]): number {\n    let min = Infinity;\n    for (let n of nums) {\n        let sum = 0;\n        let temp = n;\n        while (temp > 0) {\n            sum += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n        if (sum < min) min = sum;\n    }\n    return min;\n}",
      PYTHON: "def solve(nums):\n    min_val = float('inf')\n    for n in nums:\n        digit_sum = sum(int(d) for d in str(n))\n        if digit_sum < min_val:\n            min_val = digit_sum\n    return min_val",
      JAVA: "    static int solve(int[] nums) {\n        int minVal = Integer.MAX_VALUE;\n        for (int n : nums) {\n            int sum = 0;\n            int temp = n;\n            while (temp > 0) {\n                sum += temp % 10;\n                temp /= 10;\n            }\n            if (sum < minVal) minVal = sum;\n        }\n        return minVal;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> nums) {\n    int min_val = 1e9;\n    for (int n : nums) {\n        int sum = 0;\n        int temp = n;\n        while (temp > 0) {\n            sum += temp % 10;\n            temp /= 10;\n        }\n        if (sum < min_val) min_val = sum;\n    }\n    return min_val;\n}",
      GO: "func solve(nums []int) int {\n    minVal := 1000000000\n    for _, n := range nums {\n        sum := 0\n        temp := n\n        for temp > 0 {\n            sum += temp % 10\n            temp /= 10\n        }\n        if sum < minVal {\n            minVal = sum\n        }\n    }\n    return minVal\n}",
    },
    tests: [
      { stdin: "10 12 13 14", expectedStdout: "1", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "1", isSample: true },
      { stdin: "9999 999", expectedStdout: "27", isSample: true },
      { stdin: "1000", expectedStdout: "1" },
      { stdin: "13 22 31", expectedStdout: "4" },
      { stdin: "8 17 26 35", expectedStdout: "8" },
      { stdin: "9 99 999", expectedStdout: "9" },
      { stdin: "100 10 1", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "gladiator-robot-pairing",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Gladiator Robot Pairing",
    patternTags: ["array","sorting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are the matchmaker for an arena of gladiator robots. Each robot has a power level. The rules of the tournament dictate a unique pairing sequence to balance the matches:\n\nIn every round, you must locate the two weakest robots currently available. The slightly stronger of these two is sent into the arena first, followed immediately by the weaker one. This process repeats until all robots have been sent.\n\nGiven an array `nums` of even length representing the initial power levels of the robots, return the final sequence in which they enter the arena.\n\n**Constraints**\n- `2 <= nums.length <= 100`\n- `nums.length` is even.\n- `1 <= nums[i] <= 100`\n\n**Example 1**\n```\ninput:\n5 4 2 3\noutput:\n3 2 5 4\n```\n*Explanation: Weakest two are 2 and 3. The 3 enters first, then 2. The remaining are 4 and 5. The 5 enters, then 4.*\n\n**Example 2**\n```\ninput:\n2 5\noutput:\n5 2\n```\n*Explanation: Only two robots. 5 goes in before 2.*\n\n**Example 3**\n```\ninput:\n10 20 30 40\noutput:\n20 10 40 30\n```\n*Explanation: First pair is 10 and 20, they enter as 20 then 10. Next pair 30 and 40, they enter as 40 then 30.*\n\n**Follow-up**\nCan you do this by sorting the array first and then modifying it in-place?",
    editorialMarkdown: "## Gladiator Robot Pairing\n\nThis problem describes a process where we repeatedly take the two smallest remaining elements, placing the second one into our result array first, followed by the first one.\n\nA clever insight is that this is mathematically identical to sorting the entire array and then swapping every adjacent pair! Thus, you can simply sort the array in ascending order, iterate through it in steps of two, and swap `nums[i]` with `nums[i+1]`.\n\n**Trap**: Make sure your loop increments by 2 to swap distinct pairs rather than re-swapping already processed items. Also, ensure your sorting function treats items as integers, not strings (a common pitfall in some languages).\n\n**Complexity:**\n- **Time:** O(N log N) dominated by the sorting step. The subsequent swapping takes O(N).\n- **Space:** O(1) extra space if sorted in place, or O(N) if building a new array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(nums) {\n    nums.sort((a, b) => a - b);\n    for (let i = 0; i < nums.length; i += 2) {\n        let temp = nums[i];\n        nums[i] = nums[i+1];\n        nums[i+1] = temp;\n    }\n    return nums;\n}",
      TYPESCRIPT: "function solve(nums: number[]): number[] {\n    nums.sort((a, b) => a - b);\n    for (let i = 0; i < nums.length; i += 2) {\n        let temp = nums[i];\n        nums[i] = nums[i+1];\n        nums[i+1] = temp;\n    }\n    return nums;\n}",
      PYTHON: "def solve(nums):\n    nums.sort()\n    for i in range(0, len(nums), 2):\n        nums[i], nums[i+1] = nums[i+1], nums[i]\n    return nums",
      JAVA: "    static int[] solve(int[] nums) {\n        java.util.Arrays.sort(nums);\n        for (int i = 0; i < nums.length; i += 2) {\n            int temp = nums[i];\n            nums[i] = nums[i+1];\n            nums[i+1] = temp;\n        }\n        return nums;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nvector<int> solve(vector<int> nums) {\n    sort(nums.begin(), nums.end());\n    for (int i = 0; i < nums.size(); i += 2) {\n        swap(nums[i], nums[i+1]);\n    }\n    return nums;\n}",
      GO: "func solve(nums []int) []int {\n    // Custom bubble sort for simplicity since we can't import sort\n    for i := 0; i < len(nums); i++ {\n        for j := 0; j < len(nums)-1-i; j++ {\n            if nums[j] > nums[j+1] {\n                nums[j], nums[j+1] = nums[j+1], nums[j]\n            }\n        }\n    }\n    for i := 0; i < len(nums); i += 2 {\n        nums[i], nums[i+1] = nums[i+1], nums[i]\n    }\n    return nums\n}",
    },
    tests: [
      { stdin: "5 4 2 3", expectedStdout: "3 2 5 4", isSample: true },
      { stdin: "2 5", expectedStdout: "5 2", isSample: true },
      { stdin: "10 20 30 40", expectedStdout: "20 10 40 30", isSample: true },
      { stdin: "1 1 1 1", expectedStdout: "1 1 1 1" },
      { stdin: "8 1 9 2 7 3", expectedStdout: "2 1 7 3 9 8" },
      { stdin: "100 99 98 97", expectedStdout: "98 97 100 99" },
      { stdin: "1 2", expectedStdout: "2 1" },
      { stdin: "5 5 6 6", expectedStdout: "5 5 6 6" },
    ],
  }),

  p({
    ...base,
    slug: "airlock-chamber-capacity",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Elevator Occupancy",
    patternTags: ["simulation","counting","string"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing the usage of an elevator in a building. The sensor system outputs a log string `s` containing only the characters `'E'` and `'L'`.\n\n- `'E'` signifies a person has boarded (Entered) the elevator.\n- `'L'` signifies a person has exited (Left) the elevator.\n\nThe elevator starts out empty. Given the log `s`, compute the maximum number of people that were inside the elevator at any given time. Assume nobody exits when the elevator is empty.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `s` consists only of `'E'` and `'L'`.\n\n**Example 1**\n```\ninput:\nEEEEEEE\noutput:\n7\n```\n*Explanation: Seven people board consecutively. The maximum occupancy is 7.*\n\n**Example 2**\n```\ninput:\nELELEL\noutput:\n1\n```\n*Explanation: A person boards and exits repeatedly. The maximum concurrent occupancy is 1.*\n\n**Example 3**\n```\ninput:\nEELL\noutput:\n2\n```\n*Explanation: Two people board, bringing the count to 2. Both then exit. The maximum is 2.*\n\n**Follow-up**\nCan you do this in a single pass with O(1) additional space?",
    editorialMarkdown: "## Airlock Chamber Capacity\n\nThis problem tracks a running total and requires us to find its maximum value over time. Each `'E'` increases the total by 1, and each `'L'` decreases it by 1.\n\nWe can iterate through the string, maintaining a variable for the `current` number of people in the airlock, and a variable for the `max_people` seen so far. For each character, we update `current`, and then update `max_people = max(max_people, current)`. This is a classic application of calculating a prefix sum and taking the maximum.\n\n**Trap**: Make sure to check if you need to initialize your running total to 0. It's guaranteed that people won't leave if the room is empty, so `current` will never go negative.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, traversing the string exactly once.\n- **Space:** O(1) space, as we only need two integer variables for tracking the state.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let current = 0;\n    let max = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === 'E') current++;\n        else current--;\n        if (current > max) max = current;\n    }\n    return max;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let current = 0;\n    let max = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === 'E') current++;\n        else current--;\n        if (current > max) max = current;\n    }\n    return max;\n}",
      PYTHON: "def solve(s):\n    current = 0\n    max_people = 0\n    for c in s:\n        if c == 'E':\n            current += 1\n        else:\n            current -= 1\n        max_people = max(max_people, current)\n    return max_people",
      JAVA: "    static int solve(String s) {\n        int current = 0;\n        int maxPeople = 0;\n        for (char c : s.toCharArray()) {\n            if (c == 'E') current++;\n            else current--;\n            if (current > maxPeople) maxPeople = current;\n        }\n        return maxPeople;\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string s) {\n    int current = 0;\n    int max_people = 0;\n    for (char c : s) {\n        if (c == 'E') current++;\n        else current--;\n        if (current > max_people) max_people = current;\n    }\n    return max_people;\n}",
      GO: "func solve(s string) int {\n    current := 0\n    maxPeople := 0\n    for i := 0; i < len(s); i++ {\n        if s[i] == 'E' {\n            current++\n        } else {\n            current--\n        }\n        if current > maxPeople {\n            maxPeople = current\n        }\n    }\n    return maxPeople\n}",
    },
    tests: [
      { stdin: "EEEEEEE", expectedStdout: "7", isSample: true },
      { stdin: "ELELEL", expectedStdout: "1", isSample: true },
      { stdin: "EELL", expectedStdout: "2", isSample: true },
      { stdin: "E", expectedStdout: "1" },
      { stdin: "EL", expectedStdout: "1" },
      { stdin: "EELE", expectedStdout: "2" },
      { stdin: "EEELLLEE", expectedStdout: "3" },
      { stdin: "EEEELLL", expectedStdout: "4" },
    ],
  }),
];
