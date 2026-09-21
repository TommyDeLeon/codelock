import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-t1-arrays-hashing-a` — ARRAYS_HASHING, TIER_1, EASY.
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_T1_ARRAYS_HASHING_A_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "first-solo-guest",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "First Solo Guest",
    patternTags: ["hash-map","frequency-count","two-pass"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing a guest log for an event. Each guest is recorded as an integer representing their invitation ID. Many guests bring a plus-one, which is recorded by logging their invitation ID a second time.\n\nFind the first invitation ID in the log that appears exactly once. If every invitation ID appears more than once, return `-1`.\n\n**Constraints**\n- `0 <= guest_log.length <= 10^5`\n- `1 <= guest_log[i] <= 10^9`\n\n**Example 1**\n```\ninput: 4 2 4 1 2 8\noutput: 1\n```\n`4` and `2` appear twice. `1` is the first ID to appear once.\n\n**Example 2**\n```\ninput: 7 7 3 3\noutput: -1\n```\nAll IDs appear multiple times.\n\n**Example 3**\n```\ninput: 9 8 7\noutput: 9\n```\n`9` is the first ID in the list, and it only appears once.\n\n**Follow-up:** Can you solve this in O(n) time and O(n) space complexity?",
    editorialMarkdown: "## Two Passes with a Hash Map\n\nTo find the first element that appears exactly once, we need to know the total frequency of each element before we can make a decision about any single element. This requires two passes over the array.\n\nIn the first pass, we populate a hash map where the keys are the invitation IDs and the values are their occurrence counts.\n\nIn the second pass, we iterate through the array *in its original order*. For each element, we check its count in the hash map. The first element we encounter with a count of 1 is our answer. If we finish the loop without finding any, we return `-1`.\n\nTime complexity is O(n) and space complexity is O(n).\n\nThe one trap most solvers hit is iterating over the keys of the hash map during the second pass instead of the original array. Hash map key order is not guaranteed in all languages, which can lead to returning a solo guest who wasn't actually the *first* one in the log.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  const seen = new Map();\n  for (let n of a) seen.set(n, (seen.get(n) || 0) + 1);\n  for (let n of a) if (seen.get(n) === 1) return n;\n  return -1;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n  const seen = new Map<number, number>();\n  for (let n of a) seen.set(n, (seen.get(n) || 0) + 1);\n  for (let n of a) if (seen.get(n) === 1) return n;\n  return -1;\n}",
      PYTHON: "def solve(a):\n    seen = {}\n    for n in a:\n        seen[n] = seen.get(n, 0) + 1\n    for n in a:\n        if seen[n] == 1:\n            return n\n    return -1",
      JAVA: "    static int solve(int[] a) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int n : a) seen.put(n, seen.getOrDefault(n, 0) + 1);\n        for (int n : a) if (seen.get(n) == 1) return n;\n        return -1;\n    }",
      CPP: "int solve(vector<int> a) {\n    unordered_map<int, int> seen;\n    for (int n : a) seen[n]++;\n    for (int n : a) if (seen[n] == 1) return n;\n    return -1;\n}",
      GO: "func solve(a []int) int {\n\tseen := map[int]int{}\n\tfor _, n := range a {\n\t\tseen[n]++\n\t}\n\tfor _, n := range a {\n\t\tif seen[n] == 1 {\n\t\t\treturn n\n\t\t}\n\t}\n\treturn -1\n}",
    },
    tests: [
      { stdin: "4 2 4 1 2 8", expectedStdout: "1", isSample: true },
      { stdin: "7 7 3 3", expectedStdout: "-1", isSample: true },
      { stdin: "9 8 7", expectedStdout: "9" },
      { stdin: "", expectedStdout: "-1" },
      { stdin: "42", expectedStdout: "42" },
      { stdin: "1 1 1 1", expectedStdout: "-1" },
      { stdin: "10 20 30 10 20 30 40", expectedStdout: "40" },
      { stdin: "5 5 2 2 3 3 1", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "election-winner",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Election Winner",
    patternTags: ["hash-map","frequency-count","tie-breaking"],
    signatureId: "fn:strings->string",
    avgSolveSeconds: 800,
    promptMarkdown: "You are writing a program to tally votes in a local election. You are given a list of strings `votes`, where each string represents a vote for a candidate's name.\n\nThe winner of the election is the candidate who receives the most votes. If two or more candidates tie for the most votes, the winner is the candidate whose name comes first alphabetically among those tied.\n\nReturn the name of the winning candidate.\n\n**Constraints**\n- `1 <= votes.length <= 10^4`\n- `1 <= votes[i].length <= 50`\n- Candidate names consist of lowercase English letters.\n\n**Example 1**\n```\ninput: alice bob alice charlie\noutput: alice\n```\n`alice` has 2 votes, which is more than `bob` (1) and `charlie` (1).\n\n**Example 2**\n```\ninput: zara yusuf zara yusuf\noutput: yusuf\n```\nBoth `zara` and `yusuf` have 2 votes. `yusuf` comes before `zara` alphabetically.\n\n**Example 3**\n```\ninput: dave\noutput: dave\n```\n`dave` has the only vote and wins.\n\n**Follow-up:** Can you solve this in one pass, without storing all names? (Hint: you still need a map for counts, but could you track the winner on the fly?)",
    editorialMarkdown: "## Tally and Tie-Break\n\nWe need to count the votes for each candidate and then determine the winner based on the highest count and alphabetical order.\n\nFirst, use a hash map to tally the votes, where the keys are candidate names and the values are their vote counts.\n\nThen, iterate through the entries in the hash map. Maintain a `max_votes` variable (initialized to 0) and a `winner` variable (initialized to an empty string). For each candidate, if their vote count is greater than `max_votes`, they become the new `winner` and we update `max_votes`. If their vote count equals `max_votes`, we compare their name with the current `winner` alphabetically and update `winner` if the new name comes first.\n\nTime complexity is O(n * L), where n is the number of votes and L is the maximum length of a name (for hashing and string comparisons). Space complexity is O(n * L) to store the distinct candidates in the map.\n\nThe one trap most solvers hit is forgetting to handle the alphabetical tie-breaker correctly, or doing it backwards (choosing the one that comes last alphabetically instead of first).",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  if (a.length === 0) return \"\";\n  const counts = new Map();\n  for (let s of a) counts.set(s, (counts.get(s) || 0) + 1);\n  let maxV = 0;\n  let winner = \"\";\n  for (let [cand, v] of counts.entries()) {\n    if (v > maxV || (v === maxV && cand < winner)) {\n      maxV = v;\n      winner = cand;\n    }\n  }\n  return winner;\n}",
      TYPESCRIPT: "function solve(a: string[]): string {\n  if (a.length === 0) return \"\";\n  const counts = new Map<string, number>();\n  for (let s of a) counts.set(s, (counts.get(s) || 0) + 1);\n  let maxV = 0;\n  let winner = \"\";\n  for (let [cand, v] of counts.entries()) {\n    if (v > maxV || (v === maxV && cand < winner)) {\n      maxV = v;\n      winner = cand;\n    }\n  }\n  return winner;\n}",
      PYTHON: "def solve(a):\n    if not a:\n        return \"\"\n    counts = {}\n    for s in a:\n        counts[s] = counts.get(s, 0) + 1\n    max_v = 0\n    winner = \"\"\n    for cand, v in counts.items():\n        if v > max_v or (v == max_v and (winner == \"\" or cand < winner)):\n            max_v = v\n            winner = cand\n    return winner",
      JAVA: "    static String solve(String[] a) {\n        if (a.length == 0) return \"\";\n        Map<String, Integer> counts = new HashMap<>();\n        for (String s : a) counts.put(s, counts.getOrDefault(s, 0) + 1);\n        int maxV = 0;\n        String winner = \"\";\n        for (Map.Entry<String, Integer> e : counts.entrySet()) {\n            String cand = e.getKey();\n            int v = e.getValue();\n            if (v > maxV || (v == maxV && cand.compareTo(winner) < 0)) {\n                maxV = v;\n                winner = cand;\n            }\n        }\n        return winner;\n    }",
      CPP: "string solve(vector<string> a) {\n    if (a.empty()) return \"\";\n    unordered_map<string, int> counts;\n    for (const string& s : a) counts[s]++;\n    int maxV = 0;\n    string winner = \"\";\n    for (auto const& [cand, v] : counts) {\n        if (v > maxV || (v == maxV && cand < winner)) {\n            maxV = v;\n            winner = cand;\n        }\n    }\n    return winner;\n}",
      GO: "func solve(a []string) string {\n\tif len(a) == 0 {\n\t\treturn \"\"\n\t}\n\tcounts := map[string]int{}\n\tfor _, s := range a {\n\t\tcounts[s]++\n\t}\n\tmaxV := 0\n\twinner := \"\"\n\tfor cand, v := range counts {\n\t\tif v > maxV || (v == maxV && cand < winner) {\n\t\t\tmaxV = v\n\t\t\twinner = cand\n\t\t}\n\t}\n\treturn winner\n}",
    },
    tests: [
      { stdin: "alice bob alice charlie", expectedStdout: "alice", isSample: true },
      { stdin: "zara yusuf zara yusuf", expectedStdout: "yusuf", isSample: true },
      { stdin: "dave", expectedStdout: "dave" },
      { stdin: "", expectedStdout: "" },
      { stdin: "b b a a c c", expectedStdout: "a" },
      { stdin: "z y x w v", expectedStdout: "v" },
      { stdin: "apple banana apple orange banana", expectedStdout: "apple" },
      { stdin: "one one two two three three three", expectedStdout: "three" },
    ],
  }),

  p({
    ...base,
    slug: "count-vip-customers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Count VIP Customers",
    patternTags: ["hash-map","frequency-count","counting"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A coffee shop runs a loyalty program where customers earn one point for each visit. Customers are identified by their email addresses.\n\nYou are given a list of strings `visits`, where each string is the email address of a customer who visited the shop. A customer is upgraded to \"VIP\" status the moment they accumulate exactly 3 visits.\n\nReturn the total number of customers who have achieved VIP status (i.e., those who have visited 3 or more times).\n\n**Constraints**\n- `0 <= visits.length <= 10^5`\n- `1 <= visits[i].length <= 50`\n- Emails contain lowercase letters, numbers, and the `@` symbol.\n\n**Example 1**\n```\ninput: a@mail b@mail a@mail a@mail c@mail\noutput: 1\n```\nCustomer `a@mail` visited 3 times and is a VIP. Others visited fewer times.\n\n**Example 2**\n```\ninput: x@mail x@mail x@mail x@mail y@mail y@mail y@mail\noutput: 2\n```\nBoth `x@mail` (4 visits) and `y@mail` (3 visits) have visited at least 3 times.\n\n**Example 3**\n```\ninput: z@mail\noutput: 0\n```\nNo one has 3 visits.\n\n**Follow-up:** Can you solve this efficiently with O(n) space complexity?",
    editorialMarkdown: "## Frequency Threshold\n\nThis problem asks us to count how many distinct elements appear at least a certain number of times (a threshold of 3).\n\nWe can solve this by building a frequency map (hash map) where the keys are email addresses and the values are the number of visits. We iterate through the `visits` list and increment the count for each email.\n\nOnce the hash map is built, we can iterate through its values. We keep a `vip_count` starting at 0, and increment it for every value that is greater than or equal to 3.\n\nTime complexity is O(n * L) where n is the number of visits and L is the length of the email strings. Space complexity is O(n * L) to store the hash map.\n\nThe one trap most solvers hit is accidentally counting a customer multiple times if they visit 4 or 5 times. Iterating through the unique keys in the hash map, rather than the original array, cleanly avoids this.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  const counts = new Map();\n  for (let s of a) counts.set(s, (counts.get(s) || 0) + 1);\n  let vip = 0;\n  for (let v of counts.values()) {\n    if (v >= 3) vip++;\n  }\n  return vip;\n}",
      TYPESCRIPT: "function solve(a: string[]): number {\n  const counts = new Map<string, number>();\n  for (let s of a) counts.set(s, (counts.get(s) || 0) + 1);\n  let vip = 0;\n  for (let v of counts.values()) {\n    if (v >= 3) vip++;\n  }\n  return vip;\n}",
      PYTHON: "def solve(a):\n    counts = {}\n    for s in a:\n        counts[s] = counts.get(s, 0) + 1\n    vip = 0\n    for v in counts.values():\n        if v >= 3:\n            vip += 1\n    return vip",
      JAVA: "    static int solve(String[] a) {\n        Map<String, Integer> counts = new HashMap<>();\n        for (String s : a) counts.put(s, counts.getOrDefault(s, 0) + 1);\n        int vip = 0;\n        for (int v : counts.values()) {\n            if (v >= 3) vip++;\n        }\n        return vip;\n    }",
      CPP: "int solve(vector<string> a) {\n    unordered_map<string, int> counts;\n    for (const string& s : a) counts[s]++;\n    int vip = 0;\n    for (auto const& [k, v] : counts) {\n        if (v >= 3) vip++;\n    }\n    return vip;\n}",
      GO: "func solve(a []string) int {\n\tcounts := map[string]int{}\n\tfor _, s := range a {\n\t\tcounts[s]++\n\t}\n\tvip := 0\n\tfor _, v := range counts {\n\t\tif v >= 3 {\n\t\t\tvip++\n\t\t}\n\t}\n\treturn vip\n}",
    },
    tests: [
      { stdin: "a@mail b@mail a@mail a@mail c@mail", expectedStdout: "1", isSample: true },
      { stdin: "x@mail x@mail x@mail x@mail y@mail y@mail y@mail", expectedStdout: "2", isSample: true },
      { stdin: "z@mail", expectedStdout: "0" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "a a a b b b c c c", expectedStdout: "3" },
      { stdin: "x y z x y z", expectedStdout: "0" },
      { stdin: "hello hello hello hello", expectedStdout: "1" },
      { stdin: "one two three one two three one two three", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "inventory-restock-needed",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Inventory Restock Needed",
    patternTags: ["hash-map","frequency-count","counting"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 800,
    promptMarkdown: "A warehouse manages its inventory using item IDs. You are given an array of integers `inventory`, representing the IDs of items currently in stock. You are also given an integer `target_stock`, representing the desired quantity for each unique item.\n\nCalculate the total number of items that need to be ordered so that every unique item in the current inventory reaches exactly the `target_stock`. If an item's current quantity is already equal to or greater than `target_stock`, no new units of that item need to be ordered.\n\n**Constraints**\n- `0 <= inventory.length <= 10^5`\n- `1 <= inventory[i] <= 10^6`\n- `1 <= target_stock <= 100`\n\n**Example 1**\n```\ninput:  101 102 101\n        3\noutput: 3\n```\nItem `101` appears 2 times; it needs 1 more to reach 3. Item `102` appears 1 time; it needs 2 more. Total to order: 1 + 2 = 3.\n\n**Example 2**\n```\ninput:  50 50 50 50\n        2\noutput: 0\n```\nItem `50` appears 4 times, which is at least 2. No restock needed.\n\n**Example 3**\n```\ninput:  7 8 9\n        5\noutput: 12\n```\nItems `7`, `8`, and `9` each appear 1 time. They each need 4 more. Total: 12.\n\n**Follow-up:** Can you solve this in O(n) time and O(u) space, where u is the number of unique items in the inventory?",
    editorialMarkdown: "## Frequency Counts and Deficits\n\nWe need to count the frequency of each unique item in the inventory and compare it to the target stock to find the deficit.\n\nFirst, we populate a hash map with the frequency of each item ID.\nThen, we initialize a `total_orders` counter to 0.\nWe iterate through the values (frequencies) in our hash map. For each frequency, if it is less than `target_stock`, we add the difference (`target_stock - frequency`) to our `total_orders`.\nIf the frequency is already greater than or equal to `target_stock`, we add nothing.\n\nFinally, we return the `total_orders`.\n\nTime complexity is O(n), where n is the length of the inventory array, as we iterate through it once to build the map, and then iterate through the map's values. Space complexity is O(u), where u is the number of unique items, to store the hash map.\n\nThe one trap most solvers hit is adding to the total even when the current frequency exceeds the target stock (resulting in negative order quantities that decrease the total instead of leaving it alone).",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n  const counts = new Map();\n  for (let n of a) counts.set(n, (counts.get(n) || 0) + 1);\n  let total = 0;\n  for (let v of counts.values()) {\n    if (v < b) total += (b - v);\n  }\n  return total;\n}",
      TYPESCRIPT: "function solve(a: number[], b: number): number {\n  const counts = new Map<number, number>();\n  for (let n of a) counts.set(n, (counts.get(n) || 0) + 1);\n  let total = 0;\n  for (let v of counts.values()) {\n    if (v < b) total += (b - v);\n  }\n  return total;\n}",
      PYTHON: "def solve(a, b):\n    counts = {}\n    for n in a:\n        counts[n] = counts.get(n, 0) + 1\n    total = 0\n    for v in counts.values():\n        if v < b:\n            total += (b - v)\n    return total",
      JAVA: "    static int solve(int[] a, int b) {\n        Map<Integer, Integer> counts = new HashMap<>();\n        for (int n : a) counts.put(n, counts.getOrDefault(n, 0) + 1);\n        int total = 0;\n        for (int v : counts.values()) {\n            if (v < b) total += (b - v);\n        }\n        return total;\n    }",
      CPP: "int solve(vector<int> a, int b) {\n    unordered_map<int, int> counts;\n    for (int n : a) counts[n]++;\n    int total = 0;\n    for (auto const& [k, v] : counts) {\n        if (v < b) total += (b - v);\n    }\n    return total;\n}",
      GO: "func solve(a []int, b int) int {\n\tcounts := map[int]int{}\n\tfor _, n := range a {\n\t\tcounts[n]++\n\t}\n\ttotal := 0\n\tfor _, v := range counts {\n\t\tif v < b {\n\t\t\ttotal += (b - v)\n\t\t}\n\t}\n\treturn total\n}",
    },
    tests: [
      { stdin: "101 102 101\n3", expectedStdout: "3", isSample: true },
      { stdin: "50 50 50 50\n2", expectedStdout: "0", isSample: true },
      { stdin: "7 8 9\n5", expectedStdout: "12" },
      { stdin: "\n10", expectedStdout: "0" },
      { stdin: "1 1 1 1 1\n5", expectedStdout: "0" },
      { stdin: "1 1 1 1 1\n10", expectedStdout: "5" },
      { stdin: "2 2 3 3\n1", expectedStdout: "0" },
      { stdin: "10 20\n2", expectedStdout: "2" },
    ],
  }),
];
