import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-043` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_043_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "alien-artifact-translation",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Codebreaker Substitution",
    patternTags: ["hash-map","string","strings","hashing"],
    signatureId: "fn:string,string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You work for a cybersecurity agency and need to decrypt a secret `message` using a provided `key`.\n\nThe `key` string acts as a substitution cipher for the standard lowercase alphabet. Reading the `key` from left to right, the first new letter you encounter stands for `'a'`, the second new letter stands for `'b'`, and so forth, continuing until you reach `'z'`. Any space characters in the `key` are skipped and not assigned a letter.\n\nWhen translating the `message`, any space characters are left exactly as they are in the final result.\n\nWrite a function that takes the `key` and `message` strings and outputs the decrypted message.\n\n**Constraints**\n- `26 <= key.length <= 2000`\n- `key` consists of lowercase English letters and spaces.\n- `key` contains every lowercase English letter at least once.\n- `1 <= message.length <= 2000`\n- `message` consists of lowercase English letters and spaces.\n\n**Example 1**\n```\ninput:\nthe quick brown fox jumps over the lazy dog\nvkbs bs t\noutput: this is a\n```\n*Explanation: 't' represents 'a', 'h' represents 'b', 'e' represents 'c'. The encoded word 'vkbs' becomes 'this'.*\n\n**Example 2**\n```\ninput:\neljuxhpwnyrdgtqkviszcfmabo\nzwx hnfx lqantp mnoeius ycgk vcnjrdb\noutput: the five boxing wizards jump quickly\n```\n*Explanation: The key perfectly maps each letter to the standard alphabet sequence.*\n\n**Example 3**\n```\ninput:\na b c d e f g h i j k l m n o p q r s t u v w x y z\na b c\noutput: a b c\n```\n*Explanation: The key is just the normal alphabet with spaces.*",
    editorialMarkdown: "## Alien Artifact Translation\nWe can iterate through the `key` and construct a mapping from the alien characters to our standard alphabet. We keep track of a counter starting at `'a'`, and every time we see a character we haven't mapped yet (and it's not a space), we add it to our hash map and increment the counter. Once the map is built, we simply iterate through the `message`, replacing each character using our map (and keeping spaces as spaces).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(K + M) where K is the length of the key and M is the length of the message.\n- **Space Complexity:** mathcal{O}(1) since the hash map stores at most 26 characters.\n\n**Common Trap:**\nForgetting to ignore spaces in the `key` when building the substitution map, or failing to preserve spaces in the `message`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(key, message) {\n    let m = {};\n    let curr = 97;\n    for (let i = 0; i < key.length; i++) {\n        if (key[i] !== ' ' && m[key[i]] === undefined) {\n            m[key[i]] = String.fromCharCode(curr);\n            curr++;\n        }\n    }\n    let res = '';\n    for (let i = 0; i < message.length; i++) {\n        if (message[i] === ' ') res += ' ';\n        else res += m[message[i]];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(key: string, message: string): string {\n    let m: { [key: string]: string } = {};\n    let curr = 97;\n    for (let i = 0; i < key.length; i++) {\n        if (key[i] !== ' ' && m[key[i]] === undefined) {\n            m[key[i]] = String.fromCharCode(curr);\n            curr++;\n        }\n    }\n    let res = '';\n    for (let i = 0; i < message.length; i++) {\n        if (message[i] === ' ') res += ' ';\n        else res += m[message[i]];\n    }\n    return res;\n}",
      PYTHON: "def solve(key, message):\n    m = {}\n    curr = 97\n    for c in key:\n        if c != ' ' and c not in m:\n            m[c] = chr(curr)\n            curr += 1\n    return ''.join(m.get(c, ' ') for c in message)",
      JAVA: "    static String solve(String key, String message) {\n        java.util.Map<Character, Character> m = new java.util.HashMap<>();\n        char curr = 'a';\n        for (char c : key.toCharArray()) {\n            if (c != ' ' && !m.containsKey(c)) {\n                m.put(c, curr++);\n            }\n        }\n        StringBuilder sb = new StringBuilder();\n        for (char c : message.toCharArray()) {\n            if (c == ' ') sb.append(' ');\n            else sb.append(m.get(c));\n        }\n        return sb.toString();\n    }",
      CPP: "#include <string>\n#include <unordered_map>\nusing namespace std;\nstring solve(string key, string message) {\n    unordered_map<char, char> m;\n    char curr = 'a';\n    for (char c : key) {\n        if (c != ' ' && m.find(c) == m.end()) {\n            m[c] = curr++;\n        }\n    }\n    string res = \"\";\n    for (char c : message) {\n        if (c == ' ') res += ' ';\n        else res += m[c];\n    }\n    return res;\n}",
      GO: "func solve(key string, message string) string {\n    m := make(map[rune]rune)\n    curr := rune('a')\n    for _, c := range key {\n        if c != ' ' && m[c] == 0 {\n            m[c] = curr\n            curr++\n        }\n    }\n    var res []rune\n    for _, c := range message {\n        if c == ' ' {\n            res = append(res, ' ')\n        } else {\n            res = append(res, m[c])\n        }\n    }\n    return string(res)\n}",
    },
    tests: [
      { stdin: "the quick brown fox jumps over the lazy dog\nvkbs bs t", expectedStdout: "this is a", isSample: true },
      { stdin: "eljuxhpwnyrdgtqkviszcfmabo\nzwx hnfx lqantp mnoeius ycgk vcnjrdb", expectedStdout: "the five boxing wizards jump quickly", isSample: true },
      { stdin: "a b c d e f g h i j k l m n o p q r s t u v w x y z\na b c", expectedStdout: "a b c" },
      { stdin: "z y x w v u t s r q p o n m l k j i h g f e d c b a\nz y x", expectedStdout: "a b c" },
      { stdin: "the quick brown fox jumps over the lazy dog\n ", expectedStdout: " " },
      { stdin: "a b c d e f g h i j k l m n o p q r s t u v w x y z\nhello", expectedStdout: "hello" },
      { stdin: "z y x w v u t s r q p o n m l k j i h g f e d c b a\nsvool", expectedStdout: "hello" },
      { stdin: "the quick brown fox jumps over the lazy dog\nvkbs", expectedStdout: "this" },
    ],
  }),

  p({
    ...base,
    slug: "recover-drone-coordinates",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Reconstruct Raster Line",
    patternTags: ["array","bit-manipulation","arrays","xor"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 450,
    promptMarkdown: "A graphics rendering engine compresses a 1D raster line's pixel intensities.\n\nInstead of saving the entire sequence of intensities, the engine produces an `encoded` array where each item is the bitwise XOR of two adjacent pixels: `encoded[i] = pixels[i] XOR pixels[i+1]`. You are given this array along with `first_coordinate`, which represents the intensity of the very first pixel.\n\nDetermine and return the original `pixels` array. The problem guarantees that a valid, single solution always exists.\n\n**Constraints**\n- `0 <= encoded.length <= 40`\n- `0 <= encoded[i] <= 10^5`\n- `0 <= first_coordinate <= 10^5`\n\n**Example 1**\n```\ninput:\n1 2 3\n1\noutput: 1 0 2 1\n```\n*Explanation: The first pixel is 1. The second is 1 XOR 1 = 0. The third is 0 XOR 2 = 2. The fourth is 2 XOR 3 = 1.*\n\n**Example 2**\n```\ninput:\n6 2 7 3\n4\noutput: 4 2 0 7 4\n```\n*Explanation: 4 XOR 6 = 2, 2 XOR 2 = 0, 0 XOR 7 = 7, 7 XOR 3 = 4.*\n\n**Example 3**\n```\ninput:\n\n5\noutput: 5\n```\n*Explanation: An empty encoded array means there is only a single pixel, which is the first_coordinate.*",
    editorialMarkdown: "## Recover Drone Coordinates\nBitwise XOR has the property that if `A XOR B = C`, then `A XOR C = B`. Since we are given `encoded[i] = coordinates[i] XOR coordinates[i+1]`, we can rearrange this to `coordinates[i+1] = coordinates[i] XOR encoded[i]`.\n\nWe can start with an array containing the `first_coordinate`, and iteratively compute the next coordinate by XORing the last known coordinate with the current element in the `encoded` array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the `encoded` array.\n- **Space Complexity:** mathcal{O}(N) to store the output array.\n\n**Common Trap:**\nFailing to handle an empty `encoded` array gracefully. It should return a single-element array containing only the `first_coordinate`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(encoded, first_coordinate) {\n    let res = [first_coordinate];\n    for (let i = 0; i < encoded.length; i++) {\n        res.push(res[i] ^ encoded[i]);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(encoded: number[], first_coordinate: number): number[] {\n    let res = [first_coordinate];\n    for (let i = 0; i < encoded.length; i++) {\n        res.push(res[i] ^ encoded[i]);\n    }\n    return res;\n}",
      PYTHON: "def solve(encoded, first_coordinate):\n    res = [first_coordinate]\n    for x in encoded:\n        res.append(res[-1] ^ x)\n    return res",
      JAVA: "    static int[] solve(int[] encoded, int first_coordinate) {\n        int[] res = new int[encoded.length + 1];\n        res[0] = first_coordinate;\n        for (int i = 0; i < encoded.length; i++) {\n            res[i+1] = res[i] ^ encoded[i];\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> encoded, int first_coordinate) {\n    vector<int> res;\n    res.push_back(first_coordinate);\n    for (int i = 0; i < encoded.size(); i++) {\n        res.push_back(res[i] ^ encoded[i]);\n    }\n    return res;\n}",
      GO: "func solve(encoded []int, first_coordinate int) []int {\n    res := make([]int, len(encoded) + 1)\n    res[0] = first_coordinate\n    for i, x := range encoded {\n        res[i+1] = res[i] ^ x\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3\n1", expectedStdout: "1 0 2 1", isSample: true },
      { stdin: "6 2 7 3\n4", expectedStdout: "4 2 0 7 4", isSample: true },
      { stdin: "\n5", expectedStdout: "5" },
      { stdin: "0 0 0\n1", expectedStdout: "1 1 1 1" },
      { stdin: "5\n3", expectedStdout: "3 6" },
      { stdin: "15 15\n10", expectedStdout: "10 5 10" },
      { stdin: "1 3 5 7 9\n0", expectedStdout: "0 1 2 7 0 9" },
      { stdin: "255 127 63\n0", expectedStdout: "0 255 128 191" },
    ],
  }),

  p({
    ...base,
    slug: "unpack-supply-cargo",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Unpack Supply Cargo",
    patternTags: ["array","run-length","arrays","simulation"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "A transport ship has delivered compressed cargo. The manifest is provided as a run-length encoded array of integers.\n\nThe `manifest` array contains pairs of adjacent integers. For each pair at indices `2*i` and `2*i+1` (where `0 <= i < manifest.length / 2`), the first integer represents the `quantity` of the item, and the second integer represents the `item_id`.\n\nReturn the decompressed list of items, where each `item_id` is repeated `quantity` times.\n\n**Constraints**\n- `0 <= manifest.length <= 40`\n- `manifest.length` is an even number.\n- `0 <= manifest[i] <= 100`\n- The total length of the decompressed list will not exceed `10^4`.\n\n**Example 1**\n```\ninput:\n2 5 3 9\noutput: 5 5 9 9 9\n```\n*Explanation: The first pair is [2, 5], meaning two 5s. The second pair is [3, 9], meaning three 9s. Combined, we get [5, 5, 9, 9, 9].*\n\n**Example 2**\n```\ninput:\n1 2 1 4 1 6\noutput: 2 4 6\n```\n*Explanation: One 2, one 4, and one 6.*\n\n**Example 3**\n```\ninput:\n0 5 2 8\noutput: 8 8\n```\n*Explanation: Zero 5s and two 8s.*",
    editorialMarkdown: "## Unpack Supply Cargo\nThe problem asks us to decompress a run-length encoded array. We can accomplish this by iterating through the `manifest` array two steps at a time. At each step `i`, `manifest[i]` is the quantity and `manifest[i+1]` is the value. We simply append the value to our result array `quantity` times.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the decompressed list.\n- **Space Complexity:** mathcal{O}(N) to store the decompressed list.\n\n**Common Trap:**\nConfusing the order of the pair (using `item_id` as the quantity and `quantity` as the `item_id`).",
    referenceSolution: {
      JAVASCRIPT: "function solve(manifest) {\n    let res = [];\n    for (let i = 0; i < manifest.length; i += 2) {\n        for (let j = 0; j < manifest[i]; j++) {\n            res.push(manifest[i+1]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(manifest: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 0; i < manifest.length; i += 2) {\n        for (let j = 0; j < manifest[i]; j++) {\n            res.push(manifest[i+1]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(manifest):\n    res = []\n    for i in range(0, len(manifest), 2):\n        res.extend([manifest[i+1]] * manifest[i])\n    return res",
      JAVA: "    static int[] solve(int[] manifest) {\n        int total = 0;\n        for (int i = 0; i < manifest.length; i += 2) {\n            total += manifest[i];\n        }\n        int[] res = new int[total];\n        int idx = 0;\n        for (int i = 0; i < manifest.length; i += 2) {\n            for (int j = 0; j < manifest[i]; j++) {\n                res[idx++] = manifest[i+1];\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> manifest) {\n    vector<int> res;\n    for (int i = 0; i < manifest.size(); i += 2) {\n        for (int j = 0; j < manifest[i]; j++) {\n            res.push_back(manifest[i+1]);\n        }\n    }\n    return res;\n}",
      GO: "func solve(manifest []int) []int {\n    var res []int\n    for i := 0; i < len(manifest); i += 2 {\n        for j := 0; j < manifest[i]; j++ {\n            res = append(res, manifest[i+1])\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2 5 3 9", expectedStdout: "5 5 9 9 9", isSample: true },
      { stdin: "1 2 1 4 1 6", expectedStdout: "2 4 6", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: "4 0", expectedStdout: "0 0 0 0" },
      { stdin: "1 100", expectedStdout: "100" },
      { stdin: "2 1 2 2 2 3", expectedStdout: "1 1 2 2 3 3" },
      { stdin: "3 7", expectedStdout: "7 7 7" },
      { stdin: "0 5 2 8", expectedStdout: "8 8" },
    ],
  }),

  p({
    ...base,
    slug: "stabilize-reactor-core",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Sensor Network Smoothing",
    patternTags: ["array","arrays","circular-array","simulation"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "A series of environmental sensors are arranged in a ring around a lake. You are provided with an array `readings` that records the latest measurement from each sensor, as well as a configuration integer `k`.\n\nTo smooth out the data, you need to update every sensor's reading at the exact same moment based on these conditions:\n- When `k > 0`, the `i`-th sensor's value becomes the sum of the **subsequent** `k` sensors' values.\n- When `k < 0`, the `i`-th sensor's value becomes the sum of the **preceding** `|k|` sensors' values.\n- When `k == 0`, the `i`-th sensor's value is set to `0`.\n\nSince the sensors form a closed loop, the sensor right after the final one in the array is the first sensor, and the sensor just before the first one is the final sensor.\n\nReturn the completely smoothed array of measurements.\n\n**Constraints**\n- `1 <= readings.length <= 40`\n- `0 <= readings[i] <= 100`\n- `-(readings.length - 1) <= k <= readings.length - 1`\n\n**Example 1**\n```\ninput:\n5 7 1 4\n3\noutput: 12 10 16 13\n```\n*Explanation: With k = 3, the value at index 0 is replaced by the sum of the next 3 sensors: 7, 1, 4, which equals 12. At index 1, the next 3 sensors are 1, 4, 5, which equals 10.*\n\n**Example 2**\n```\ninput:\n1 2 3 4\n0\noutput: 0 0 0 0\n```\n*Explanation: Because k is 0, all sensor readings become 0.*\n\n**Example 3**\n```\ninput:\n2 4 9 3\n-2\noutput: 12 5 6 13\n```\n*Explanation: With k = -2, the value at index 0 becomes the sum of the preceding 2 sensors: 9 and 3 (12). For index 1, the preceding 2 sensors are 3 and 2 (5).*",
    editorialMarkdown: "## Stabilize Reactor Core\nBecause the array size is very small, we can simulate the process directly. For each index `i`, we can use a loop to iterate exactly `|k|` times in the correct direction (forward if `k > 0`, backward if `k < 0`). To handle the circular nature of the array, we can use modulo arithmetic (`%`) to wrap around the boundaries.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N × |K|) where N is the number of elements and K is the calibration integer. Since N ≤ 40, this easily passes.\n- **Space Complexity:** mathcal{O}(N) for the resulting array.\n\n**Common Trap:**\nIncorrectly handling modulo arithmetic for negative indices in languages like C++, Java, or Go (where `-1 % N` is `-1`, not `N - 1`). It's safer to add N before applying modulo, e.g., `(index + N) % N`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings, k) {\n    let n = readings.length;\n    let res = new Array(n).fill(0);\n    if (k === 0) return res;\n    for (let i = 0; i < n; i++) {\n        let total = 0;\n        if (k > 0) {\n            for (let j = 1; j <= k; j++) {\n                total += readings[(i + j) % n];\n            }\n        } else {\n            for (let j = 1; j <= -k; j++) {\n                total += readings[(i - j + n) % n];\n            }\n        }\n        res[i] = total;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(readings: number[], k: number): number[] {\n    let n = readings.length;\n    let res = new Array(n).fill(0);\n    if (k === 0) return res;\n    for (let i = 0; i < n; i++) {\n        let total = 0;\n        if (k > 0) {\n            for (let j = 1; j <= k; j++) {\n                total += readings[(i + j) % n];\n            }\n        } else {\n            for (let j = 1; j <= -k; j++) {\n                total += readings[(i - j + n) % n];\n            }\n        }\n        res[i] = total;\n    }\n    return res;\n}",
      PYTHON: "def solve(readings, k):\n    n = len(readings)\n    res = [0] * n\n    if k == 0: return res\n    for i in range(n):\n        total = 0\n        if k > 0:\n            for j in range(1, k + 1):\n                total += readings[(i + j) % n]\n        else:\n            for j in range(1, -k + 1):\n                total += readings[(i - j + n) % n]\n        res[i] = total\n    return res",
      JAVA: "    static int[] solve(int[] readings, int k) {\n        int n = readings.length;\n        int[] res = new int[n];\n        if (k == 0) return res;\n        for (int i = 0; i < n; i++) {\n            int total = 0;\n            if (k > 0) {\n                for (int j = 1; j <= k; j++) {\n                    total += readings[(i + j) % n];\n                }\n            } else {\n                for (int j = 1; j <= -k; j++) {\n                    total += readings[(i - j + n) % n];\n                }\n            }\n            res[i] = total;\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> readings, int k) {\n    int n = readings.size();\n    vector<int> res(n, 0);\n    if (k == 0) return res;\n    for (int i = 0; i < n; i++) {\n        int total = 0;\n        if (k > 0) {\n            for (int j = 1; j <= k; j++) {\n                total += readings[(i + j) % n];\n            }\n        } else {\n            for (int j = 1; j <= -k; j++) {\n                total += readings[(i - j + n) % n];\n            }\n        }\n        res[i] = total;\n    }\n    return res;\n}",
      GO: "func solve(readings []int, k int) []int {\n    n := len(readings)\n    res := make([]int, n)\n    if k == 0 { return res }\n    for i := 0; i < n; i++ {\n        total := 0\n        if k > 0 {\n            for j := 1; j <= k; j++ {\n                total += readings[(i + j) % n]\n            }\n        } else {\n            for j := 1; j <= -k; j++ {\n                total += readings[(i - j + n) % n]\n            }\n        }\n        res[i] = total\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "5 7 1 4\n3", expectedStdout: "12 10 16 13", isSample: true },
      { stdin: "1 2 3 4\n0", expectedStdout: "0 0 0 0", isSample: true },
      { stdin: "2 4 9 3\n-2", expectedStdout: "12 5 6 13" },
      { stdin: "10 20\n1", expectedStdout: "20 10" },
      { stdin: "10 20\n-1", expectedStdout: "20 10" },
      { stdin: "1 1 1 1 1\n2", expectedStdout: "2 2 2 2 2" },
      { stdin: "1 1 1 1 1\n-2", expectedStdout: "2 2 2 2 2" },
      { stdin: "5 0 0 0\n2", expectedStdout: "0 0 5 5" },
    ],
  }),

  p({
    ...base,
    slug: "decipher-wall-glyphs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Legacy System Decoder",
    patternTags: ["string","strings","parsing","simulation"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 550,
    promptMarkdown: "You are migrating a legacy database where names were stored using a compact numeric format. The encoded text is provided as a string named `glyphs`.\n\nThe format uses a mix of numbers and the `'#'` character to stand for lowercase letters:\n- The letters `'a'` through `'i'` are encoded as the digits `'1'` through `'9'`, respectively.\n- The letters `'j'` through `'z'` are encoded as the strings `'10#'` through `'26#'`, respectively.\n\nWrite a function to convert the `glyphs` string back into standard lowercase letters. You may assume the input will always be perfectly formatted and decodable.\n\n**Constraints**\n- `1 <= glyphs.length <= 1000`\n- `glyphs` consists of digits and the `'#'` letter.\n- `glyphs` will be a valid string for mapping.\n\n**Example 1**\n```\ninput:\n10#11#12\noutput: jkab\n```\n*Explanation: \"10#\" is 'j', \"11#\" is 'k', \"1\" is 'a', \"2\" is 'b'.*\n\n**Example 2**\n```\ninput:\n1326#\noutput: acz\n```\n*Explanation: \"1\" is 'a', \"3\" is 'c', \"26#\" is 'z'.*\n\n**Example 3**\n```\ninput:\n123456789\noutput: abcdefghi\n```\n*Explanation: Since there are no '#' markers, each number is converted to a single letter individually.*",
    editorialMarkdown: "## Decipher Wall Glyphs\nWe need to parse the string from left to right, but since `'1'` could be `'a'` or the start of `'10#'`, looking ahead is necessary. Alternatively, parsing the string from right to left makes the choice unambiguous: if the current character is `'#'`, we know the next two characters to the left form a two-digit number. Otherwise, the current character is a single-digit number.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string.\n- **Space Complexity:** mathcal{O}(N) to store the resulting decoded string.\n\n**Common Trap:**\nParsing left-to-right and incorrectly treating the first digit of a two-digit number (e.g., `'1'` in `'10#'`) as a separate character.",
    referenceSolution: {
      JAVASCRIPT: "function solve(glyphs) {\n    let res = [];\n    let i = glyphs.length - 1;\n    while (i >= 0) {\n        if (glyphs[i] === '#') {\n            let val = parseInt(glyphs.substring(i - 2, i));\n            res.push(String.fromCharCode(96 + val));\n            i -= 3;\n        } else {\n            let val = parseInt(glyphs[i]);\n            res.push(String.fromCharCode(96 + val));\n            i -= 1;\n        }\n    }\n    return res.reverse().join('');\n}",
      TYPESCRIPT: "function solve(glyphs: string): string {\n    let res: string[] = [];\n    let i = glyphs.length - 1;\n    while (i >= 0) {\n        if (glyphs[i] === '#') {\n            let val = parseInt(glyphs.substring(i - 2, i));\n            res.push(String.fromCharCode(96 + val));\n            i -= 3;\n        } else {\n            let val = parseInt(glyphs[i]);\n            res.push(String.fromCharCode(96 + val));\n            i -= 1;\n        }\n    }\n    return res.reverse().join('');\n}",
      PYTHON: "def solve(glyphs):\n    res = []\n    i = len(glyphs) - 1\n    while i >= 0:\n        if glyphs[i] == '#':\n            val = int(glyphs[i-2:i])\n            res.append(chr(96 + val))\n            i -= 3\n        else:\n            val = int(glyphs[i])\n            res.append(chr(96 + val))\n            i -= 1\n    return \"\".join(res[::-1])",
      JAVA: "    static String solve(String glyphs) {\n        StringBuilder sb = new StringBuilder();\n        int i = glyphs.length() - 1;\n        while (i >= 0) {\n            if (glyphs.charAt(i) == '#') {\n                int val = Integer.parseInt(glyphs.substring(i - 2, i));\n                sb.append((char) (96 + val));\n                i -= 3;\n            } else {\n                int val = glyphs.charAt(i) - '0';\n                sb.append((char) (96 + val));\n                i -= 1;\n            }\n        }\n        return sb.reverse().toString();\n    }",
      CPP: "#include <string>\n#include <algorithm>\nusing namespace std;\nstring solve(string glyphs) {\n    string res = \"\";\n    int i = glyphs.length() - 1;\n    while (i >= 0) {\n        if (glyphs[i] == '#') {\n            int val = stoi(glyphs.substr(i - 2, 2));\n            res += (char)(96 + val);\n            i -= 3;\n        } else {\n            int val = glyphs[i] - '0';\n            res += (char)(96 + val);\n            i -= 1;\n        }\n    }\n    reverse(res.begin(), res.end());\n    return res;\n}",
      GO: "func solve(glyphs string) string {\n    var res []byte\n    i := len(glyphs) - 1\n    for i >= 0 {\n        if glyphs[i] == '#' {\n            val := (glyphs[i-2] - '0') * 10 + (glyphs[i-1] - '0')\n            res = append(res, byte(96 + val))\n            i -= 3\n        } else {\n            val := glyphs[i] - '0'\n            res = append(res, byte(96 + val))\n            i -= 1\n        }\n    }\n    for j := 0; j < len(res)/2; j++ {\n        res[j], res[len(res)-1-j] = res[len(res)-1-j], res[j]\n    }\n    return string(res)\n}",
    },
    tests: [
      { stdin: "10#11#12", expectedStdout: "jkab", isSample: true },
      { stdin: "1326#", expectedStdout: "acz", isSample: true },
      { stdin: "123456789", expectedStdout: "abcdefghi" },
      { stdin: "10#", expectedStdout: "j" },
      { stdin: "26#", expectedStdout: "z" },
      { stdin: "12#3412#6", expectedStdout: "lcdlf" },
      { stdin: "10#1", expectedStdout: "ja" },
      { stdin: "25#123", expectedStdout: "yabc" },
    ],
  }),
];
