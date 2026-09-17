import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-061` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_061_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "identify-faulty-sensors",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Identify Faulty Sensors",
    patternTags: ["array","filtering","math"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing the performance of a batch of network sensors. Each sensor logs its successful and failed data transmissions.\n\nYou are given a 2D integer array `sensors` where each element is `[sensorId, successes, failures]`. \nA sensor is considered **faulty** if its success rate is strictly less than 60%. The success rate is the number of successes divided by the total number of transmissions (successes + failures).\n\nReturn an array of `sensorId`s of all faulty sensors, in the order they appear in the input.\n\n**Constraints**\n- `0 <= sensors.length <= 100`\n- `sensors[i].length == 3`\n- `1 <= sensors[i][0] <= 1000`\n- `0 <= sensors[i][1], sensors[i][2] <= 1000`\n- `sensors[i][1] + sensors[i][2] > 0`\n\n**Example 1**\n```\ninput:\n1 5 4;2 10 0;3 2 4\noutput:\n1 3\n```\n*Explanation: Sensor 1 has a 55.5% success rate (5/9). Sensor 2 has a 100% success rate (10/10). Sensor 3 has a 33.3% success rate (2/6). Sensors 1 and 3 are faulty.*\n\n**Example 2**\n```\ninput:\n10 6 4;11 5 5\noutput:\n11\n```\n*Explanation: Sensor 10 has a 60% success rate (6/10), which is not strictly less than 60%. Sensor 11 has a 50% success rate (5/10), which is faulty.*\n\n**Example 3**\n```\ninput:\n99 100 0\noutput:\n\n```\n*Explanation: Sensor 99 has a 100% success rate. No sensors are faulty, so the output is empty.*\n\n**Follow-up**\nCan you perform the check without using any floating-point arithmetic to avoid precision issues?",
    editorialMarkdown: "## Identify Faulty Sensors\n\nWe are tasked with finding the IDs of sensors that have a success rate strictly less than 60%. The success rate is given by `successes / (successes + failures)`.\nInstead of dealing with floating-point division which can lead to precision errors, we can rearrange the inequality:\n`successes / (successes + failures) < 0.6`\n`successes / (successes + failures) < 3 / 5`\n`5 * successes < 3 * (successes + failures)`\n`2 * successes < 3 * failures`\n\nWe can iterate through the given matrix, and for each sensor, we evaluate this integer arithmetic condition. If it is true, we add the sensor's ID to our result list.\n\n**Trap**: A common pitfall is using floating-point division (e.g., `successes / (successes + failures)`) without casting to float, which truncates in many languages, or dealing with float imprecision. Cross-multiplication avoids floats entirely.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of sensors.\n- **Space:** O(1) auxiliary space (excluding the output array).",
    referenceSolution: {
      JAVASCRIPT: "function solve(sensors) {\n    const res = [];\n    for (const sensor of sensors) {\n        if (sensor[1] * 2 < sensor[2] * 3) {\n            res.push(sensor[0]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(sensors: number[][]): number[] {\n    const res: number[] = [];\n    for (const sensor of sensors) {\n        if (sensor[1] * 2 < sensor[2] * 3) {\n            res.push(sensor[0]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(sensors):\n    res = []\n    for sensor in sensors:\n        if sensor[1] * 2 < sensor[2] * 3:\n            res.append(sensor[0])\n    return res",
      JAVA: "    static int[] solve(int[][] sensors) {\n        int count = 0;\n        for (int[] s : sensors) {\n            if (s[1] * 2 < s[2] * 3) count++;\n        }\n        int[] res = new int[count];\n        int idx = 0;\n        for (int[] s : sensors) {\n            if (s[1] * 2 < s[2] * 3) res[idx++] = s[0];\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<vector<int>> sensors) {\n    vector<int> res;\n    for (int i = 0; i < sensors.size(); i++) {\n        if (sensors[i][1] * 2 < sensors[i][2] * 3) {\n            res.push_back(sensors[i][0]);\n        }\n    }\n    return res;\n}",
      GO: "func solve(sensors [][]int) []int {\n    res := []int{}\n    for _, sensor := range sensors {\n        if sensor[1] * 2 < sensor[2] * 3 {\n            res = append(res, sensor[0])\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 5 4;2 10 0;3 2 4", expectedStdout: "1 3", isSample: true },
      { stdin: "10 6 4;11 5 5", expectedStdout: "11", isSample: true },
      { stdin: "99 100 0", expectedStdout: "" },
      { stdin: "", expectedStdout: "" },
      { stdin: "1 0 10;2 0 1;3 5 100", expectedStdout: "1 2 3" },
      { stdin: "1 3 2", expectedStdout: "" },
      { stdin: "5 0 1", expectedStdout: "5" },
      { stdin: "10 2 4;11 6 4;12 5 9", expectedStdout: "10 12" },
    ],
  }),

  p({
    ...base,
    slug: "primary-faction-leader",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Dominant Species",
    patternTags: ["array","majority","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A group of biologists is surveying a local habitat and recording the species of each animal they encounter. You are given an array `species` of size `n` where each integer denotes a unique species ID.\n\nA species is considered **Dominant** if it accounts for strictly more than half of the total observations (i.e., its frequency is greater than `n / 2`).\n\nGiven that the habitat is known to always have exactly one Dominant species, determine and return its species ID.\n\n**Constraints**\n- `1 <= species.length <= 100000`\n- `0 <= species[i] <= 10^9`\n\n**Example 1**\n```\ninput:\n3 2 3\noutput:\n3\n```\n*Explanation: Species 3 appears 2 times, which is strictly more than 3 / 2 (1.5) times.*\n\n**Example 2**\n```\ninput:\n2 2 1 1 1 2 2\noutput:\n2\n```\n*Explanation: Species 2 appears 4 times, which is strictly more than 7 / 2 (3.5) times.*\n\n**Example 3**\n```\ninput:\n5\noutput:\n5\n```\n*Explanation: Species 5 is the only species observed.*\n\n**Follow-up**\nCan you solve this in O(1) auxiliary space?",
    editorialMarkdown: "## Primary Faction Leader\n\nThe problem requires us to find the faction ID that appears strictly more than `n / 2` times in the array.\nWe can solve this easily by using a hash map to count occurrences. However, a more optimal approach in terms of space is the Boyer-Moore Voting Algorithm.\nThe algorithm maintains a `candidate` faction and a `count`. When we see a faction ID, if `count` is 0, we set this ID as the new `candidate` and set `count` to 1. If it matches the current `candidate`, we increment `count`; otherwise, we decrement `count`.\nBecause the primary faction is guaranteed to exist and makes up more than half of the population, it will always be the `candidate` remaining at the end.\n\n**Trap**: A common pitfall is allocating memory for a hash map which uses O(N) space, rather than taking advantage of the property that the majority element appears more than `N/2` times.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, since we iterate through the array once.\n- **Space:** O(1) as we only use a couple of variables to keep track of the current candidate and its count.",
    referenceSolution: {
      JAVASCRIPT: "function solve(factions) {\n    let candidate = -1;\n    let count = 0;\n    for (const faction of factions) {\n        if (count === 0) {\n            candidate = faction;\n            count = 1;\n        } else if (candidate === faction) {\n            count++;\n        } else {\n            count--;\n        }\n    }\n    return candidate;\n}",
      TYPESCRIPT: "function solve(factions: number[]): number {\n    let candidate = -1;\n    let count = 0;\n    for (const faction of factions) {\n        if (count === 0) {\n            candidate = faction;\n            count = 1;\n        } else if (candidate === faction) {\n            count++;\n        } else {\n            count--;\n        }\n    }\n    return candidate;\n}",
      PYTHON: "def solve(factions):\n    candidate = -1\n    count = 0\n    for faction in factions:\n        if count == 0:\n            candidate = faction\n            count = 1\n        elif candidate == faction:\n            count += 1\n        else:\n            count -= 1\n    return candidate",
      JAVA: "    static int solve(int[] factions) {\n        int candidate = -1;\n        int count = 0;\n        for (int faction : factions) {\n            if (count == 0) {\n                candidate = faction;\n                count = 1;\n            } else if (candidate == faction) {\n                count++;\n            } else {\n                count--;\n            }\n        }\n        return candidate;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> factions) {\n    int candidate = -1;\n    int count = 0;\n    for (int faction : factions) {\n        if (count == 0) {\n            candidate = faction;\n            count = 1;\n        } else if (candidate == faction) {\n            count++;\n        } else {\n            count--;\n        }\n    }\n    return candidate;\n}",
      GO: "func solve(factions []int) int {\n    candidate := -1\n    count := 0\n    for _, faction := range factions {\n        if count == 0 {\n            candidate = faction\n            count = 1\n        } else if candidate == faction {\n            count++\n        } else {\n            count--\n        }\n    }\n    return candidate\n}",
    },
    tests: [
      { stdin: "3 2 3", expectedStdout: "3", isSample: true },
      { stdin: "2 2 1 1 1 2 2", expectedStdout: "2", isSample: true },
      { stdin: "5", expectedStdout: "5" },
      { stdin: "9999999 9999999 1 2 9999999", expectedStdout: "9999999" },
      { stdin: "0 0 0 1 2 3 0 0", expectedStdout: "0" },
      { stdin: "42 42 42 42 42", expectedStdout: "42" },
      { stdin: "1 10 10 10 2", expectedStdout: "10" },
      { stdin: "1 2 1 3 1 4 1 5 1", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "laser-asteroid-destruction",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Laser Asteroid Destruction",
    patternTags: ["array","hash-set","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are commanding a space station equipped with a wide-beam laser to clear a field of approaching asteroids.\n\nYou are given an integer array `healths`, representing the structural integrity (health) of each asteroid.\nIn a single blast, your wide-beam laser hits all remaining asteroids simultaneously, dealing damage equal to the *lowest* health of any asteroid that has not yet been destroyed. When an asteroid's health drops to 0 or below, it is destroyed.\n\nReturn the minimum number of blasts required to destroy all the asteroids.\n\n**Constraints**\n- `0 <= healths.length <= 1000`\n- `0 <= healths[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 5 0 3 5\noutput:\n3\n```\n*Explanation:*\n*Blast 1: The lowest non-zero health is 1. Asteroids become [0, 4, 0, 2, 4].*\n*Blast 2: The lowest non-zero health is 2. Asteroids become [0, 2, 0, 0, 2].*\n*Blast 3: The lowest non-zero health is 2. Asteroids become [0, 0, 0, 0, 0].*\n*It takes 3 blasts.*\n\n**Example 2**\n```\ninput:\n0\noutput:\n0\n```\n*Explanation: There are no asteroids with positive health.*\n\n**Example 3**\n```\ninput:\n4 4 4 4\noutput:\n1\n```\n*Explanation: The lowest non-zero health is 4. One blast destroys all asteroids.*\n\n**Follow-up**\nCan you determine the answer in O(N) time without modifying the array?",
    editorialMarkdown: "## Laser Asteroid Destruction\n\nThe problem asks for the minimum number of laser blasts needed to destroy all asteroids. In each blast, all remaining asteroids take damage equal to the lowest health of any remaining asteroid.\nThis means that in every step, the asteroids with the minimum current health will drop to exactly 0 health and be destroyed. Every other remaining asteroid will lose that exact amount of health but survive. \nConsequently, all asteroids that originally had the same health will be destroyed in the same blast, and the number of blasts exactly equals the number of distinct non-zero starting healths in the array.\n\nWe can solve this efficiently by keeping track of the unique positive health values we encounter.\n\n**Trap**: A common pitfall is actually simulating the process step-by-step by finding the minimum, subtracting it from all elements, and repeating. This takes O(N^2) time, which is unnecessary when we can just count the unique non-zero elements in O(N) time.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of asteroids, since we only need one pass to record unique values.\n- **Space:** O(1) or O(K) where K is the number of unique health values. Given the small constraint on health values (up to 100), we can use a small boolean array taking O(1) space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(healths) {\n    const seen = new Array(101).fill(false);\n    let blasts = 0;\n    for (const h of healths) {\n        if (h > 0 && !seen[h]) {\n            seen[h] = true;\n            blasts++;\n        }\n    }\n    return blasts;\n}",
      TYPESCRIPT: "function solve(healths: number[]): number {\n    const seen: boolean[] = new Array(101).fill(false);\n    let blasts = 0;\n    for (const h of healths) {\n        if (h > 0 && !seen[h]) {\n            seen[h] = true;\n            blasts++;\n        }\n    }\n    return blasts;\n}",
      PYTHON: "def solve(healths):\n    seen = [False] * 101\n    blasts = 0\n    for h in healths:\n        if h > 0 and not seen[h]:\n            seen[h] = True\n            blasts += 1\n    return blasts",
      JAVA: "    static int solve(int[] healths) {\n        boolean[] seen = new boolean[101];\n        int blasts = 0;\n        for (int h : healths) {\n            if (h > 0 && !seen[h]) {\n                seen[h] = true;\n                blasts++;\n            }\n        }\n        return blasts;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> healths) {\n    vector<bool> seen(101, false);\n    int blasts = 0;\n    for (int h : healths) {\n        if (h > 0 && !seen[h]) {\n            seen[h] = true;\n            blasts++;\n        }\n    }\n    return blasts;\n}",
      GO: "func solve(healths []int) int {\n    seen := make([]bool, 101)\n    blasts := 0\n    for _, h := range healths {\n        if h > 0 && !seen[h] {\n            seen[h] = true\n            blasts++\n        }\n    }\n    return blasts\n}",
    },
    tests: [
      { stdin: "1 5 0 3 5", expectedStdout: "3", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "4 4 4 4", expectedStdout: "1" },
      { stdin: "10 20 30 40 50", expectedStdout: "5" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "100", expectedStdout: "1" },
      { stdin: "1 2 2 3 3 3 4 4 4 4", expectedStdout: "4" },
      { stdin: "99 100 0 0 99", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "optimal-solar-panels",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Optimal Solar Panels",
    patternTags: ["array","math","geometry","maximum"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are designing a solar power array and must select the best model of solar panel from a catalog.\n\nYou are given a 2D integer array `dimensions`, where `dimensions[i] = [width, height]` represents the width and height of the `i`-th solar panel model.\n\nTo maximize structural integrity across the frame, you prioritize panels with the longest diagonal. If there are multiple panels with the longest diagonal, you select the one with the maximum surface area to maximize energy capture.\n\nReturn the area of the selected solar panel model.\n\n**Constraints**\n- `1 <= dimensions.length <= 100`\n- `dimensions[i].length == 2`\n- `1 <= dimensions[i][0], dimensions[i][1] <= 100`\n\n**Example 1**\n```\ninput:\n9 3;8 6\noutput:\n48\n```\n*Explanation:*\n*For panel 1: diagonal squared = 9^2 + 3^2 = 81 + 9 = 90. Area = 9 * 3 = 27.*\n*For panel 2: diagonal squared = 8^2 + 6^2 = 64 + 36 = 100. Area = 8 * 6 = 48.*\n*Panel 2 has the longest diagonal, so we return its area, 48.*\n\n**Example 2**\n```\ninput:\n3 4;4 3\noutput:\n12\n```\n*Explanation:*\n*Both panels have the same diagonal squared of 3^2 + 4^2 = 25.*\n*Both panels have the same area of 12.*\n*We return the area, 12.*\n\n**Example 3**\n```\ninput:\n6 5;8 3;3 4\noutput:\n24\n```\n*Explanation:*\n*Panel 1 diagonal squared: 36 + 25 = 61. Area = 30.*\n*Panel 2 diagonal squared: 64 + 9 = 73. Area = 24.*\n*Panel 3 diagonal squared: 9 + 16 = 25. Area = 12.*\n*Panel 2 has the longest diagonal, so its area 24 is returned.*\n\n**Follow-up**\nCan you determine the best panel without ever computing a square root?",
    editorialMarkdown: "## Optimal Solar Panels\n\nWe need to iterate through a list of panels and find the one that has the longest diagonal. If multiple panels have the same maximum diagonal length, we must break the tie by choosing the panel with the largest area. Finally, we output the area of this optimal panel.\n\nFor a rectangle with width `w` and height `h`, the length of the diagonal is `sqrt(w^2 + h^2)`. Because the square root function is strictly increasing for positive inputs, we don't actually need to compute the square root. We can simply compare `w^2 + h^2` directly, which saves computation time and avoids floating-point precision issues.\nSimilarly, the area is simply `w * h`.\nWe can track the maximum `diagonalSquared` and the corresponding `area` in two variables as we loop through the panels.\n\n**Trap**: Computing the square root using `Math.sqrt()` involves floating-point numbers, which may result in precision loss and incorrect tie-breaking. Comparing the squared values directly using integers is completely safe.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of solar panels.\n- **Space:** O(1) auxiliary space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(dimensions) {\n    let maxDiagSq = 0;\n    let maxArea = 0;\n    for (const dim of dimensions) {\n        const w = dim[0];\n        const h = dim[1];\n        const diagSq = w * w + h * h;\n        const area = w * h;\n        if (diagSq > maxDiagSq) {\n            maxDiagSq = diagSq;\n            maxArea = area;\n        } else if (diagSq === maxDiagSq && area > maxArea) {\n            maxArea = area;\n        }\n    }\n    return maxArea;\n}",
      TYPESCRIPT: "function solve(dimensions: number[][]): number {\n    let maxDiagSq = 0;\n    let maxArea = 0;\n    for (const dim of dimensions) {\n        const w = dim[0];\n        const h = dim[1];\n        const diagSq = w * w + h * h;\n        const area = w * h;\n        if (diagSq > maxDiagSq) {\n            maxDiagSq = diagSq;\n            maxArea = area;\n        } else if (diagSq === maxDiagSq && area > maxArea) {\n            maxArea = area;\n        }\n    }\n    return maxArea;\n}",
      PYTHON: "def solve(dimensions):\n    max_diag_sq = 0\n    max_area = 0\n    for w, h in dimensions:\n        diag_sq = w * w + h * h\n        area = w * h\n        if diag_sq > max_diag_sq:\n            max_diag_sq = diag_sq\n            max_area = area\n        elif diag_sq == max_diag_sq and area > max_area:\n            max_area = area\n    return max_area",
      JAVA: "    static int solve(int[][] dimensions) {\n        int maxDiagSq = 0;\n        int maxArea = 0;\n        for (int[] dim : dimensions) {\n            int w = dim[0];\n            int h = dim[1];\n            int diagSq = w * w + h * h;\n            int area = w * h;\n            if (diagSq > maxDiagSq) {\n                maxDiagSq = diagSq;\n                maxArea = area;\n            } else if (diagSq == maxDiagSq && area > maxArea) {\n                maxArea = area;\n            }\n        }\n        return maxArea;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<vector<int>> dimensions) {\n    int maxDiagSq = 0;\n    int maxArea = 0;\n    for (int i = 0; i < dimensions.size(); i++) {\n        int w = dimensions[i][0];\n        int h = dimensions[i][1];\n        int diagSq = w * w + h * h;\n        int area = w * h;\n        if (diagSq > maxDiagSq) {\n            maxDiagSq = diagSq;\n            maxArea = area;\n        } else if (diagSq == maxDiagSq && area > maxArea) {\n            maxArea = area;\n        }\n    }\n    return maxArea;\n}",
      GO: "func solve(dimensions [][]int) int {\n    maxDiagSq := 0\n    maxArea := 0\n    for _, dim := range dimensions {\n        w := dim[0]\n        h := dim[1]\n        diagSq := w*w + h*h\n        area := w * h\n        if diagSq > maxDiagSq {\n            maxDiagSq = diagSq\n            maxArea = area\n        } else if diagSq == maxDiagSq && area > maxArea {\n            maxArea = area\n        }\n    }\n    return maxArea\n}",
    },
    tests: [
      { stdin: "9 3;8 6", expectedStdout: "48", isSample: true },
      { stdin: "3 4;4 3", expectedStdout: "12", isSample: true },
      { stdin: "6 5;8 3;3 4", expectedStdout: "24", isSample: true },
      { stdin: "10 10", expectedStdout: "100" },
      { stdin: "3 4;1 2;2 1", expectedStdout: "12" },
      { stdin: "6 6;2 8", expectedStdout: "36" },
      { stdin: "99 99;100 1", expectedStdout: "9801" },
      { stdin: "2 12;3 8;4 6", expectedStdout: "24" },
    ],
  }),
];
