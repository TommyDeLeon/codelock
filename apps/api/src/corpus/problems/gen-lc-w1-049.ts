import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-049` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_049_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "identify-duplicate-transmissions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Repeated Package Scans",
    patternTags: ["hash-map","duplicates","counting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "A warehouse worker logs the ID numbers of incoming crates into an array called `transmissions`. Due to a scanner glitch, some crates are logged multiple times. \n\nYour task is to determine which crate IDs were recorded more than once. Provide the list of these IDs arranged from lowest to highest.\n\n**Constraints**\n- `1 <= transmissions.length <= 100`\n- `1 <= transmissions[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3 1 2 4\noutput: 1 2\n```\n*Explanation: IDs 1 and 2 are logged twice, while 3 and 4 are logged only once.*\n\n**Example 2**\n```\ninput:\n10 10 10\noutput: 10\n```\n*Explanation: ID 10 is logged three times, so it is a repeated scan. It should be output once.*\n\n**Example 3**\n```\ninput:\n1 2 3\noutput: \n```\n*Explanation: No IDs are logged multiple times.*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time and mathcal{O}(N) space?",
    editorialMarkdown: "## Identify Duplicate Transmissions\nCount the frequencies of each ID using a hash map or an array. Then, filter the keys to keep only those with a count strictly greater than 1. Finally, sort the resulting list of duplicates in ascending order.\n\n**Trap**: Make sure to return each duplicate ID exactly once, even if it appears three or more times in the input.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N log N) due to sorting the final list, where N is the number of transmissions.\n- **Space Complexity:** mathcal{O}(N) to store the frequencies in a hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmissions) {\n    const counts = new Map();\n    for (const t of transmissions) {\n        counts.set(t, (counts.get(t) || 0) + 1);\n    }\n    const res = [];\n    for (const [k, v] of counts.entries()) {\n        if (v > 1) res.push(k);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      TYPESCRIPT: "function solve(transmissions: number[]): number[] {\n    const counts = new Map<number, number>();\n    for (const t of transmissions) {\n        counts.set(t, (counts.get(t) || 0) + 1);\n    }\n    const res: number[] = [];\n    for (const [k, v] of counts.entries()) {\n        if (v > 1) res.push(k);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      PYTHON: "def solve(transmissions):\n    counts = {}\n    for t in transmissions:\n        counts[t] = counts.get(t, 0) + 1\n    res = [k for k, v in counts.items() if v > 1]\n    res.sort()\n    return res",
      JAVA: "    static int[] solve(int[] transmissions) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int t : transmissions) {\n            counts.put(t, counts.getOrDefault(t, 0) + 1);\n        }\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (java.util.Map.Entry<Integer, Integer> entry : counts.entrySet()) {\n            if (entry.getValue() > 1) {\n                list.add(entry.getKey());\n            }\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) {\n            res[i] = list.get(i);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <map>\n#include <algorithm>\nusing namespace std;\n\nvector<int> solve(vector<int> transmissions) {\n    map<int, int> counts;\n    for (int t : transmissions) {\n        counts[t]++;\n    }\n    vector<int> res;\n    for (auto const& [k, v] : counts) {\n        if (v > 1) {\n            res.push_back(k);\n        }\n    }\n    return res;\n}",
      GO: "func solve(transmissions []int) []int {\n    counts := make(map[int]int)\n    for _, t := range transmissions {\n        counts[t]++\n    }\n    var res []int\n    for k, v := range counts {\n        if v > 1 {\n            res = append(res, k)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3 1 2 4", expectedStdout: "1 2", isSample: true },
      { stdin: "10 10 10", expectedStdout: "10", isSample: true },
      { stdin: "1 2 3", expectedStdout: "", isSample: true },
      { stdin: "5", expectedStdout: "" },
      { stdin: "100 200 300 400 500 100", expectedStdout: "100" },
      { stdin: "15 15 25 25 35 35", expectedStdout: "15 25 35" },
      { stdin: "2 1 1 2", expectedStdout: "1 2" },
      { stdin: "9 8 7 6 5 9 7", expectedStdout: "7 9" },
    ],
  }),

  p({
    ...base,
    slug: "abandoned-guild-members",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Abandoned Guild Members",
    patternTags: ["hash-set","filtering","arrays"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "In a video game, players can form mentor-apprentice relationships within a guild. You are given a 2D integer array `members`, where each `members[i] = [memberId, mentorId, rankScore]`.\n\n- `memberId` is the unique ID of the player.\n- `mentorId` is the ID of the player's mentor. (If `mentorId` is 0, it means they don't have a mentor).\n- `rankScore` is the player's current rank in the guild.\n\nSome mentors have left the guild, meaning their `memberId` no longer exists in the `members` array.\nFind the `memberId`s of all players who have a `rankScore` strictly less than 50 AND whose mentor has left the guild (i.e., their `mentorId` is not 0, but the `mentorId` does not appear as a `memberId` in the array).\n\nReturn the list of such `memberId`s sorted in ascending order.\n\n**Constraints**\n- `1 <= members.length <= 100`\n- `members[i].length == 3`\n- `1 <= memberId <= 1000`\n- `0 <= mentorId <= 1000`\n- `1 <= rankScore <= 100`\n- All `memberId`s are unique.\n\n**Example 1**\n```\ninput:\n1 0 10;2 1 40;3 99 20;4 99 60\noutput: 3\n```\n*Explanation: Member 3 has rank 20 < 50 and their mentor 99 is not in the guild. Member 4's mentor 99 also left, but member 4's rank is 60 >= 50.*\n\n**Example 2**\n```\ninput:\n10 20 30;20 0 100\noutput: \n```\n*Explanation: Member 10's mentor is 20, who is still in the guild. Member 20 has no mentor.*\n\n**Example 3**\n```\ninput:\n5 6 10;7 8 49;9 10 50\noutput: 5 7\n```\n*Explanation: Member 5 and 7 have missing mentors and rank strictly less than 50. Member 9 has a missing mentor, but a score of 50.*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time if we assume the maximum `memberId` is very small?",
    editorialMarkdown: "## Abandoned Guild Members\nFirst, collect all existing `memberId`s into a hash set for quick mathcal{O}(1) lookup. Then, iterate through the `members` array again. For each member, check if their `rankScore` is less than 50, their `mentorId` is not 0, and their `mentorId` is not in the set of active members. If all conditions are met, add their `memberId` to a result list. Finally, sort the result list in ascending order.\n\n**Trap**: Be careful to handle the case where a player has no mentor (`mentorId == 0`) – they should not be included in the result.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N log N) time due to sorting, where N is the number of members.\n- **Space Complexity:** mathcal{O}(N) space to store the hash set of active members.",
    referenceSolution: {
      JAVASCRIPT: "function solve(members) {\n    const active = new Set();\n    for (const m of members) {\n        active.add(m[0]);\n    }\n    const res = [];\n    for (const m of members) {\n        if (m[2] < 50 && m[1] !== 0 && !active.has(m[1])) {\n            res.push(m[0]);\n        }\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      TYPESCRIPT: "function solve(members: number[][]): number[] {\n    const active = new Set<number>();\n    for (const m of members) {\n        active.add(m[0]);\n    }\n    const res: number[] = [];\n    for (const m of members) {\n        if (m[2] < 50 && m[1] !== 0 && !active.has(m[1])) {\n            res.push(m[0]);\n        }\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      PYTHON: "def solve(members):\n    active = set(m[0] for m in members)\n    res = []\n    for m in members:\n        if m[2] < 50 and m[1] != 0 and m[1] not in active:\n            res.append(m[0])\n    res.sort()\n    return res",
      JAVA: "    static int[] solve(int[][] members) {\n        java.util.Set<Integer> active = new java.util.HashSet<>();\n        for (int[] m : members) {\n            active.add(m[0]);\n        }\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (int[] m : members) {\n            if (m[2] < 50 && m[1] != 0 && !active.contains(m[1])) {\n                list.add(m[0]);\n            }\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) {\n            res[i] = list.get(i);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n#include <algorithm>\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> members) {\n    unordered_set<int> active;\n    for (auto const& m : members) {\n        active.insert(m[0]);\n    }\n    vector<int> res;\n    for (auto const& m : members) {\n        if (m[2] < 50 && m[1] != 0 && active.find(m[1]) == active.end()) {\n            res.push_back(m[0]);\n        }\n    }\n    sort(res.begin(), res.end());\n    return res;\n}",
      GO: "func solve(members [][]int) []int {\n    active := make(map[int]bool)\n    for _, m := range members {\n        active[m[0]] = true\n    }\n    var res []int\n    for _, m := range members {\n        if m[2] < 50 && m[1] != 0 && !active[m[1]] {\n            res = append(res, m[0])\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 0 10;2 1 40;3 99 20;4 99 60", expectedStdout: "3", isSample: true },
      { stdin: "10 20 30;20 0 100", expectedStdout: "", isSample: true },
      { stdin: "5 6 10;7 8 49;9 10 50", expectedStdout: "5 7", isSample: true },
      { stdin: "1 0 10", expectedStdout: "" },
      { stdin: "100 200 1", expectedStdout: "100" },
      { stdin: "1 5 99;2 5 49;3 5 49", expectedStdout: "2 3" },
      { stdin: "10 0 20;20 10 40;30 20 40;40 99 80", expectedStdout: "" },
      { stdin: "5 2 10;4 3 20;3 2 30;2 1 40", expectedStdout: "2" },
      { stdin: "1 2 10;3 4 20;5 6 30", expectedStdout: "1 3 5" },
    ],
  }),

  p({
    ...base,
    slug: "unmatched-checkpoint-badges",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Exclusive Conference Attendees",
    patternTags: ["hash-set","set-difference","counting"],
    signatureId: "fn:ints,ints->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "Two separate seminars were held at a convention, and the organizers recorded the attendee ID numbers for each seminar in two arrays, `checkpointA` and `checkpointB`. \n\nIdentify the attendees who were present at only one of the two seminars. The final list of these exclusive attendee IDs must be ordered from smallest to largest.\n\n**Constraints**\n- `1 <= checkpointA.length, checkpointB.length <= 100`\n- `1 <= checkpointA[i], checkpointB[i] <= 1000`\n- All elements in `checkpointA` are unique.\n- All elements in `checkpointB` are unique.\n\n**Example 1**\n```\ninput:\n1 2 3\n2 3 4\noutput: 1 4\n```\n*Explanation: Attendee 1 went only to the first seminar. Attendee 4 went only to the second seminar.*\n\n**Example 2**\n```\ninput:\n10 20\n10 20\noutput: \n```\n*Explanation: Both attendees were present at both seminars, leaving no one who attended just one.*\n\n**Example 3**\n```\ninput:\n5\n6\noutput: 5 6\n```\n*Explanation: Attendee 5 was only at the first seminar, and 6 was only at the second.*\n\n**Follow-up**\nCan you solve it in mathcal{O}(N) time if you know the maximum attendee ID is small?",
    editorialMarkdown: "## Unmatched Checkpoint Badges\nThis problem asks for the symmetric difference of two sets. We can insert all elements of `checkpointA` into a frequency map, then add all elements of `checkpointB`. Any element that has a final frequency of exactly 1 appeared in only one of the checkpoints. Alternatively, you can use two hash sets and check for presence in the other set. Finally, we sort the result list in ascending order.\n\n**Trap**: You must sort the final output. Sets or hash maps inherently do not maintain sorted order.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N log N) time due to sorting, where N is the total number of badges across both checkpoints.\n- **Space Complexity:** mathcal{O}(N) space to store the frequencies in a hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(checkpointA, checkpointB) {\n    const counts = new Map();\n    for (const a of checkpointA) {\n        counts.set(a, (counts.get(a) || 0) + 1);\n    }\n    for (const b of checkpointB) {\n        counts.set(b, (counts.get(b) || 0) + 1);\n    }\n    const res = [];\n    for (const [k, v] of counts.entries()) {\n        if (v === 1) res.push(k);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      TYPESCRIPT: "function solve(checkpointA: number[], checkpointB: number[]): number[] {\n    const counts = new Map<number, number>();\n    for (const a of checkpointA) counts.set(a, (counts.get(a) || 0) + 1);\n    for (const b of checkpointB) counts.set(b, (counts.get(b) || 0) + 1);\n    const res: number[] = [];\n    for (const [k, v] of counts.entries()) {\n        if (v === 1) res.push(k);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      PYTHON: "def solve(checkpointA, checkpointB):\n    counts = {}\n    for a in checkpointA:\n        counts[a] = counts.get(a, 0) + 1\n    for b in checkpointB:\n        counts[b] = counts.get(b, 0) + 1\n    res = [k for k, v in counts.items() if v == 1]\n    res.sort()\n    return res",
      JAVA: "    static int[] solve(int[] checkpointA, int[] checkpointB) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int a : checkpointA) counts.put(a, counts.getOrDefault(a, 0) + 1);\n        for (int b : checkpointB) counts.put(b, counts.getOrDefault(b, 0) + 1);\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (java.util.Map.Entry<Integer, Integer> entry : counts.entrySet()) {\n            if (entry.getValue() == 1) {\n                list.add(entry.getKey());\n            }\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) {\n            res[i] = list.get(i);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <map>\n#include <algorithm>\nusing namespace std;\n\nvector<int> solve(vector<int> checkpointA, vector<int> checkpointB) {\n    map<int, int> counts;\n    for (int a : checkpointA) counts[a]++;\n    for (int b : checkpointB) counts[b]++;\n    vector<int> res;\n    for (auto const& [k, v] : counts) {\n        if (v == 1) res.push_back(k);\n    }\n    return res;\n}",
      GO: "func solve(checkpointA []int, checkpointB []int) []int {\n    counts := make(map[int]int)\n    for _, a := range checkpointA {\n        counts[a]++\n    }\n    for _, b := range checkpointB {\n        counts[b]++\n    }\n    var res []int\n    for k, v := range counts {\n        if v == 1 {\n            res = append(res, k)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3\n2 3 4", expectedStdout: "1 4", isSample: true },
      { stdin: "10 20\n10 20", expectedStdout: "", isSample: true },
      { stdin: "5\n6", expectedStdout: "5 6", isSample: true },
      { stdin: "100 200 300\n", expectedStdout: "100 200 300" },
      { stdin: "\n42 73", expectedStdout: "42 73" },
      { stdin: "1 3 5 7\n2 4 6 8", expectedStdout: "1 2 3 4 5 6 7 8" },
      { stdin: "5 4 3\n3 2 1", expectedStdout: "1 2 4 5" },
      { stdin: "10\n10", expectedStdout: "" },
    ],
  }),

  p({
    ...base,
    slug: "deal-cards-to-two-players",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Deal Cards to Two Players",
    patternTags: ["arrays","simulation"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are simulating a card dealing process. You are given an array of unique integers `cards` representing the values of a deck of cards. You must distribute these cards into two hands, `hand1` and `hand2`, according to the following rules:\n\n1. Deal the first card `cards[0]` to `hand1`.\n2. Deal the second card `cards[1]` to `hand2`.\n3. For each subsequent card `cards[i]` (from index 2 onwards), compare the last card added to `hand1` with the last card added to `hand2`. Add `cards[i]` to the hand with the greater last card.\n\nAfter all cards are dealt, return the final array of cards formed by concatenating `hand1` followed by `hand2`.\n\n**Constraints**\n- `3 <= cards.length <= 100`\n- `1 <= cards[i] <= 1000`\n- All elements in `cards` are unique.\n\n**Example 1**\n```\ninput:\n5 4 3 8\noutput: 5 3 4 8\n```\n*Explanation: `hand1` gets 5, `hand2` gets 4. The next card 3 is added to `hand1` (5 > 4). Now `hand1` is [5, 3]. The next card 8 is added to `hand2` (4 > 3). Final hands: [5, 3] and [4, 8]. Concatenated: 5 3 4 8.*\n\n**Example 2**\n```\ninput:\n2 1 3\noutput: 2 3 1\n```\n*Explanation: `hand1` gets 2, `hand2` gets 1. Card 3: 2 > 1, so `hand1` gets 3. Final: 2 3 1.*\n\n**Example 3**\n```\ninput:\n10 20 30\noutput: 10 20 30\n```\n*Explanation: `hand1` gets 10, `hand2` gets 20. Card 30: 10 < 20, `hand2` gets 30. Final: 10 20 30.*\n\n**Follow-up**\nCan you optimize the solution if you only needed to return the last card dealt to `hand1`?",
    editorialMarkdown: "## Deal Cards to Two Players\nSimulate the dealing process exactly as described. Maintain two arrays or lists, `hand1` and `hand2`. Initialize them with the first two elements. For the rest of the array, compare the last elements `hand1[hand1.length - 1]` and `hand2[hand2.length - 1]` and append the current element to the one that is larger. Finally, concatenate the two arrays.\n\n**Trap**: Ensure you are comparing the *last element* added to the arrays, not the maximum element or the sum of elements.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the cards array.\n- **Space Complexity:** mathcal{O}(N) because we store all the elements into two separate hands before concatenating them.",
    referenceSolution: {
      JAVASCRIPT: "function solve(cards) {\n    if (cards.length <= 2) return cards;\n    const hand1 = [cards[0]];\n    const hand2 = [cards[1]];\n    for (let i = 2; i < cards.length; i++) {\n        if (hand1[hand1.length - 1] > hand2[hand2.length - 1]) {\n            hand1.push(cards[i]);\n        } else {\n            hand2.push(cards[i]);\n        }\n    }\n    return hand1.concat(hand2);\n}",
      TYPESCRIPT: "function solve(cards: number[]): number[] {\n    if (cards.length <= 2) return cards;\n    const hand1 = [cards[0]];\n    const hand2 = [cards[1]];\n    for (let i = 2; i < cards.length; i++) {\n        if (hand1[hand1.length - 1] > hand2[hand2.length - 1]) {\n            hand1.push(cards[i]);\n        } else {\n            hand2.push(cards[i]);\n        }\n    }\n    return hand1.concat(hand2);\n}",
      PYTHON: "def solve(cards):\n    if len(cards) <= 2:\n        return cards\n    hand1 = [cards[0]]\n    hand2 = [cards[1]]\n    for i in range(2, len(cards)):\n        if hand1[-1] > hand2[-1]:\n            hand1.append(cards[i])\n        else:\n            hand2.append(cards[i])\n    return hand1 + hand2",
      JAVA: "    static int[] solve(int[] cards) {\n        if (cards.length <= 2) return cards;\n        int[] hand1 = new int[cards.length];\n        int[] hand2 = new int[cards.length];\n        hand1[0] = cards[0];\n        hand2[0] = cards[1];\n        int size1 = 1, size2 = 1;\n        for (int i = 2; i < cards.length; i++) {\n            if (hand1[size1 - 1] > hand2[size2 - 1]) {\n                hand1[size1++] = cards[i];\n            } else {\n                hand2[size2++] = cards[i];\n            }\n        }\n        int[] res = new int[cards.length];\n        for (int i = 0; i < size1; i++) res[i] = hand1[i];\n        for (int i = 0; i < size2; i++) res[size1 + i] = hand2[i];\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> cards) {\n    if (cards.size() <= 2) return cards;\n    vector<int> hand1 = {cards[0]};\n    vector<int> hand2 = {cards[1]};\n    for (int i = 2; i < cards.size(); i++) {\n        if (hand1.back() > hand2.back()) {\n            hand1.push_back(cards[i]);\n        } else {\n            hand2.push_back(cards[i]);\n        }\n    }\n    hand1.insert(hand1.end(), hand2.begin(), hand2.end());\n    return hand1;\n}",
      GO: "func solve(cards []int) []int {\n    if len(cards) <= 2 {\n        return cards\n    }\n    hand1 := []int{cards[0]}\n    hand2 := []int{cards[1]}\n    for i := 2; i < len(cards); i++ {\n        if hand1[len(hand1)-1] > hand2[len(hand2)-1] {\n            hand1 = append(hand1, cards[i])\n        } else {\n            hand2 = append(hand2, cards[i])\n        }\n    }\n    return append(hand1, hand2...)\n}",
    },
    tests: [
      { stdin: "5 4 3 8", expectedStdout: "5 3 4 8", isSample: true },
      { stdin: "2 1 3", expectedStdout: "2 3 1", isSample: true },
      { stdin: "10 20 30", expectedStdout: "10 20 30", isSample: true },
      { stdin: "1 2 3 4 5 6", expectedStdout: "1 2 3 4 5 6" },
      { stdin: "6 5 4 3 2 1", expectedStdout: "6 4 2 5 3 1" },
      { stdin: "50 40", expectedStdout: "50 40" },
      { stdin: "100 101 102", expectedStdout: "100 101 102" },
      { stdin: "3 1 4 2 5 9", expectedStdout: "3 4 2 5 9 1" },
    ],
  }),
];
