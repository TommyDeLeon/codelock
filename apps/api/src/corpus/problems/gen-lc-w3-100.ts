import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-100` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_100_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "alien-language-translation",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Magical Spell Encoding",
    patternTags: ["string","strings","simulation"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are an apprentice wizard tasked with encoding a sequence of words into a magical incantation.\n\nYou are given a string `sentence` consisting of lowercase English letters and spaces. Words are separated by a single space, and the string contains no leading or trailing spaces.\n\nEncode the sentence by applying the following rules to each word:\n1. If the word begins with a vowel (`'a'`, `'e'`, `'i'`, `'o'`, or `'u'`), append `\"xy\"` to the end of the word.\n2. If the word begins with a consonant, remove its first letter, place it at the end of the word, and then append `\"xy\"`.\n3. Finally, append the letter `'z'` to the end of the word exactly `i` times, where `i` is the 1-based index of the word within the sentence.\n\nReturn the fully encoded incantation as a single string.\n\n**Constraints**\n- `1 <= sentence.length <= 150`\n- `sentence` consists of lowercase English letters and spaces.\n- There are no leading or trailing spaces.\n- All words are separated by a single space.\n\n**Example 1**\n```\ninput:\napple bat cat\noutput:\napplexyz atbxyzz atcxyzzz\n```\n*Explanation: \"apple\" begins with a vowel, becoming \"applexy\" + \"z\". \"bat\" begins with a consonant, becoming \"atbxy\" + \"zz\". \"cat\" becomes \"atcxy\" + \"zzz\".*\n\n**Example 2**\n```\ninput:\ndog\noutput:\nogdxyz\n```\n*Explanation: \"dog\" begins with a consonant, becoming \"ogdxy\" + \"z\".*\n\n**Example 3**\n```\ninput:\nelephant\noutput:\nelephantxyz\n```\n*Explanation: \"elephant\" begins with a vowel, becoming \"elephantxy\" + \"z\".*\n\n**Follow-up**\nCan you perform the encoding in a single pass without using an array to store all intermediate words?",
    editorialMarkdown: "## Alien Language Translation\n\nWe process the sentence word by word. For each word, we check its first character to determine if it is a vowel or a consonant.\nIf it is a vowel, we simply append `\"xy\"`. If it is a consonant, we extract the first character, append it to the end of the remaining substring, and then append `\"xy\"`.\nFinally, we append a sequence of `'z'`s corresponding to the 1-based index of the word in the sentence.\n\n**Trap**: A common mistake is using a 0-based index instead of a 1-based index when generating the suffix of `'z'`s, or mishandling the string reconstruction in languages where strings are immutable.\n\n**Complexity:**\n- **Time:** O(N^2) in the worst case where N is the length of the sentence, because appending `'z'`s for each word grows quadratically with the number of words.\n- **Space:** O(N) to store the split words and build the resulting string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(sentence) {\n    if (!sentence) return \"\";\n    const words = sentence.split(\" \");\n    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);\n    return words.map((word, i) => {\n        let mod = \"\";\n        if (vowels.has(word[0])) {\n            mod = word + \"xy\";\n        } else {\n            mod = word.slice(1) + word[0] + \"xy\";\n        }\n        return mod + \"z\".repeat(i + 1);\n    }).join(\" \");\n}",
      TYPESCRIPT: "function solve(sentence: string): string {\n    if (!sentence) return \"\";\n    const words: string[] = sentence.split(\" \");\n    const vowels: Set<string> = new Set(['a', 'e', 'i', 'o', 'u']);\n    return words.map((word, i) => {\n        let mod = \"\";\n        if (vowels.has(word[0])) {\n            mod = word + \"xy\";\n        } else {\n            mod = word.slice(1) + word[0] + \"xy\";\n        }\n        return mod + \"z\".repeat(i + 1);\n    }).join(\" \");\n}",
      PYTHON: "def solve(sentence):\n    if not sentence:\n        return \"\"\n    words = sentence.split()\n    res = []\n    vowels = set(\"aeiou\")\n    for i, word in enumerate(words):\n        if word[0] in vowels:\n            mod = word + \"xy\"\n        else:\n            mod = word[1:] + word[0] + \"xy\"\n        mod += \"z\" * (i + 1)\n        res.append(mod)\n    return \" \".join(res)",
      JAVA: "    static String solve(String sentence) {\n        if (sentence == null || sentence.isEmpty()) return \"\";\n        String[] words = sentence.split(\" \");\n        StringBuilder res = new StringBuilder();\n        for (int i = 0; i < words.length; i++) {\n            String w = words[i];\n            if (w.isEmpty()) continue;\n            char first = w.charAt(0);\n            if (first == 'a' || first == 'e' || first == 'i' || first == 'o' || first == 'u') {\n                res.append(w).append(\"xy\");\n            } else {\n                res.append(w.substring(1)).append(first).append(\"xy\");\n            }\n            for (int j = 0; j <= i; j++) {\n                res.append('z');\n            }\n            if (i < words.length - 1) {\n                res.append(\" \");\n            }\n        }\n        return res.toString();\n    }",
      CPP: "#include <vector>\n#include <string>\nusing namespace std;\n\nstring solve(string s) {\n    if (s.empty()) return \"\";\n    string res = \"\";\n    string word = \"\";\n    int index = 1;\n    for (int i = 0; i <= s.length(); i++) {\n        if (i == s.length() || s[i] == ' ') {\n            if (word.length() > 0) {\n                if (word[0] == 'a' || word[0] == 'e' || word[0] == 'i' || word[0] == 'o' || word[0] == 'u') {\n                    word += \"xy\";\n                } else {\n                    word = word.substr(1) + word[0] + \"xy\";\n                }\n                for (int j = 0; j < index; j++) word += \"z\";\n                if (res.length() > 0) res += \" \";\n                res += word;\n                index++;\n                word = \"\";\n            }\n        } else {\n            word += s[i];\n        }\n    }\n    return res;\n}",
      GO: "func solve(s string) string {\n    if s == \"\" {\n        return \"\"\n    }\n    words := strings.Split(s, \" \")\n    var res []string\n    for i, word := range words {\n        if len(word) == 0 {\n            continue\n        }\n        first := word[0]\n        var mod string\n        if first == 'a' || first == 'e' || first == 'i' || first == 'o' || first == 'u' {\n            mod = word + \"xy\"\n        } else {\n            mod = word[1:] + string(first) + \"xy\"\n        }\n        mod += strings.Repeat(\"z\", i+1)\n        res = append(res, mod)\n    }\n    return strings.Join(res, \" \")\n}",
    },
    tests: [
      { stdin: "apple bat cat", expectedStdout: "applexyz atbxyzz atcxyzzz", isSample: true },
      { stdin: "dog", expectedStdout: "ogdxyz", isSample: true },
      { stdin: "elephant", expectedStdout: "elephantxyz" },
      { stdin: "a a a", expectedStdout: "axyz axyzz axyzzz" },
      { stdin: "i am alien", expectedStdout: "ixyz amxyzz alienxyzzz" },
      { stdin: "i", expectedStdout: "ixyz" },
      { stdin: "xyb", expectedStdout: "ybxxyz" },
      { stdin: "a e i o u", expectedStdout: "axyz exyzz ixyzzz oxyzzzz uxyzzzzz" },
    ],
  }),

  p({
    ...base,
    slug: "energy-core-stability",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Energy Core Stability",
    patternTags: ["math","digits"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are building diagnostics software for futuristic energy cores.\n\nEach energy core generates a constant integer `power` level. A core is designated as **stable** if its `power` level is perfectly divisible by the sum of its own digits. \nIf the core is stable, return the sum of its digits. Otherwise, return `-1`.\n\n**Constraints**\n- `1 <= power <= 10^5`\n\n**Example 1**\n```\ninput:\n18\noutput:\n9\n```\n*Explanation: The sum of digits of 18 is 1 + 8 = 9. 18 is perfectly divisible by 9, so it is stable. We return the sum of its digits, which is 9.*\n\n**Example 2**\n```\ninput:\n19\noutput:\n-1\n```\n*Explanation: The sum of digits of 19 is 1 + 9 = 10. 19 is not divisible by 10, so the core is unstable.*\n\n**Example 3**\n```\ninput:\n1\noutput:\n1\n```\n*Explanation: 1 is perfectly divisible by 1.*\n\n**Follow-up**\nCan you write this using a mathematical loop rather than converting the integer to a string?",
    editorialMarkdown: "## Energy Core Stability\n\nWe are looking for numbers that are evenly divisible by the sum of their own base-10 digits. \nTo extract the sum of digits, we repeatedly apply the modulo 10 operation (`number % 10`) to extract the lowest digit, and then integer division by 10 (`number / 10`) to shift the digits right, until the number becomes zero. We accumulate the sum.\nOnce we have the sum, we simply check if `power % sum == 0`.\n\n**Trap**: A trap to avoid is modifying the original variable `power` while calculating the digit sum. The original `power` must be preserved so we can perform the final modulo check.\n\n**Complexity:**\n- **Time:** O(log_10(N)) where N is the `power`. The number of digits in N is bounded by its logarithm.\n- **Space:** O(1) as we only require a few integer variables.",
    referenceSolution: {
      JAVASCRIPT: "function solve(power) {\n    let sum = 0;\n    let temp = power;\n    while (temp > 0) {\n        sum += temp % 10;\n        temp = Math.floor(temp / 10);\n    }\n    if (power % sum === 0) return sum;\n    return -1;\n}",
      TYPESCRIPT: "function solve(power: number): number {\n    let sum = 0;\n    let temp = power;\n    while (temp > 0) {\n        sum += temp % 10;\n        temp = Math.floor(temp / 10);\n    }\n    if (power % sum === 0) return sum;\n    return -1;\n}",
      PYTHON: "def solve(power):\n    digit_sum = sum(int(d) for d in str(power))\n    if power % digit_sum == 0:\n        return digit_sum\n    return -1",
      JAVA: "    static int solve(int power) {\n        int sum = 0;\n        int temp = power;\n        while (temp > 0) {\n            sum += temp % 10;\n            temp /= 10;\n        }\n        if (power % sum == 0) return sum;\n        return -1;\n    }",
      CPP: "int solve(int power) {\n    int sum = 0;\n    int temp = power;\n    while (temp > 0) {\n        sum += temp % 10;\n        temp /= 10;\n    }\n    if (power % sum == 0) return sum;\n    return -1;\n}",
      GO: "func solve(power int) int {\n    sum := 0\n    temp := power\n    for temp > 0 {\n        sum += temp % 10\n        temp /= 10\n    }\n    if power % sum == 0 {\n        return sum\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "18", expectedStdout: "9", isSample: true },
      { stdin: "19", expectedStdout: "-1", isSample: true },
      { stdin: "1", expectedStdout: "1", isSample: true },
      { stdin: "10", expectedStdout: "1" },
      { stdin: "100", expectedStdout: "1" },
      { stdin: "21", expectedStdout: "3" },
      { stdin: "999", expectedStdout: "27" },
      { stdin: "7954", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "processor-instruction-chain",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Processor Instruction Chain",
    patternTags: ["array","arrays","simulation","string"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 450,
    promptMarkdown: "You are developing an interpreter for a very basic processor architecture.\n\nThe processor maintains a single integer register `x` initialized to `0`. It processes an array of string `commands` sequentially.\nThe commands mutate the register according to the following rules:\n- `\"INC\"`: Increments `x` by 1.\n- `\"DEC\"`: Decrements `x` by 1.\n- `\"DBL\"`: Multiplies `x` by 2.\n- `\"HLF\"`: Divides `x` by 2 (using integer division, dropping any remainder).\n\nReturn the final value of the register `x` after evaluating all the commands.\n\n**Constraints**\n- `0 <= commands.length <= 100`\n- `commands[i]` is one of `\"INC\"`, `\"DEC\"`, `\"DBL\"`, or `\"HLF\"`.\n- The value of `x` will comfortably fit in a standard 32-bit signed integer at all times.\n\n**Example 1**\n```\ninput:\nINC INC DBL DEC\noutput:\n3\n```\n*Explanation: The register starts at 0. INC makes it 1. INC makes it 2. DBL makes it 4. DEC makes it 3.*\n\n**Example 2**\n```\ninput:\nINC DBL HLF\noutput:\n1\n```\n*Explanation: The register starts at 0. INC makes it 1. DBL makes it 2. HLF makes it 1.*\n\n**Example 3**\n```\ninput:\nDEC DEC DEC\noutput:\n-3\n```\n*Explanation: The register decreases three times ending at -3.*\n\n**Follow-up**\nHow would you scale this architecture to support arbitrary object method chains containing parameters?",
    editorialMarkdown: "## Processor Instruction Chain\n\nThis problem requires us to simulate the state of a processor as a sequence of string commands is executed.\nWe initialize a variable `x` to `0` and iterate through the array of instructions. Based on the value of the instruction (`\"INC\"`, `\"DEC\"`, `\"DBL\"`, or `\"HLF\"`), we update `x` accordingly.\nIt represents an infinite-method object design, where methods sequentially update an underlying numerical state.\n\n**Trap**: A common pitfall is misunderstanding the integer division requirement for the `\"HLF\"` instruction. In languages like Python and JavaScript, a standard division `/` might yield a float, so a specific integer division (e.g. `//` or `Math.floor`) is needed. Wait! Note: integer division towards zero for negative numbers requires caution, but the problem states integer division. If `x` can be negative, integer division towards zero is standard in C++/Java. Let's make sure our operations align. Since the constraints state `x` doesn't exceed 32-bit bounds, a simple sequential if-else covers it perfectly.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the command array.\n- **Space:** O(1) auxiliary space, as only a single integer `x` is maintained.",
    referenceSolution: {
      JAVASCRIPT: "function solve(commands) {\n    let x = 0;\n    for (const cmd of commands) {\n        if (cmd === \"INC\") x++;\n        else if (cmd === \"DEC\") x--;\n        else if (cmd === \"DBL\") x *= 2;\n        else if (cmd === \"HLF\") x = Math.trunc(x / 2);\n    }\n    return x;\n}",
      TYPESCRIPT: "function solve(commands: string[]): number {\n    let x = 0;\n    for (const cmd of commands) {\n        if (cmd === \"INC\") x++;\n        else if (cmd === \"DEC\") x--;\n        else if (cmd === \"DBL\") x *= 2;\n        else if (cmd === \"HLF\") x = Math.trunc(x / 2);\n    }\n    return x;\n}",
      PYTHON: "def solve(commands):\n    x = 0\n    for cmd in commands:\n        if cmd == \"INC\":\n            x += 1\n        elif cmd == \"DEC\":\n            x -= 1\n        elif cmd == \"DBL\":\n            x *= 2\n        elif cmd == \"HLF\":\n            x = int(x / 2)\n    return x",
      JAVA: "    static int solve(String[] commands) {\n        int x = 0;\n        for (String cmd : commands) {\n            if (cmd.equals(\"INC\")) x++;\n            else if (cmd.equals(\"DEC\")) x--;\n            else if (cmd.equals(\"DBL\")) x *= 2;\n            else if (cmd.equals(\"HLF\")) x /= 2;\n        }\n        return x;\n    }",
      CPP: "#include <vector>\n#include <string>\nusing namespace std;\n\nint solve(vector<string> commands) {\n    int x = 0;\n    for (int i = 0; i < commands.size(); i++) {\n        if (commands[i] == \"INC\") x++;\n        else if (commands[i] == \"DEC\") x--;\n        else if (commands[i] == \"DBL\") x *= 2;\n        else if (commands[i] == \"HLF\") x /= 2;\n    }\n    return x;\n}",
      GO: "func solve(commands []string) int {\n    x := 0\n    for _, cmd := range commands {\n        if cmd == \"INC\" {\n            x++\n        } else if cmd == \"DEC\" {\n            x--\n        } else if cmd == \"DBL\" {\n            x *= 2\n        } else if cmd == \"HLF\" {\n            x /= 2\n        }\n    }\n    return x\n}",
    },
    tests: [
      { stdin: "INC INC DBL DEC", expectedStdout: "3", isSample: true },
      { stdin: "INC DBL HLF", expectedStdout: "1", isSample: true },
      { stdin: "DEC DEC DEC", expectedStdout: "-3", isSample: true },
      { stdin: "", expectedStdout: "0" },
      { stdin: "INC", expectedStdout: "1" },
      { stdin: "INC INC DEC DBL DBL HLF", expectedStdout: "2" },
      { stdin: "INC DBL DBL DBL DBL", expectedStdout: "16" },
      { stdin: "DEC DEC DBL HLF HLF HLF", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "mirror-solar-system",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TREES",
    title: "Holographic Schematic Reversal",
    patternTags: ["tree","trees","dfs","recursion"],
    signatureId: "fn:tree->tree",
    avgSolveSeconds: 400,
    promptMarkdown: "You are calibrating a 3D holographic display that renders structural schematics as binary trees. Due to a persistent optics glitch, the device is projecting everything as a mirror image.\n\nGiven the `root` of a binary tree representing the projection, you must correct the display by completely inverting the tree. Specifically, for every node in the tree, you need to swap its left and right subtrees.\n\nReturn the `root` of the correctly inverted binary tree.\n\n*Note on tree serialization in examples:* The provided sample inputs and outputs use space-separated values to represent the level-order traversal (BFS) of the binary trees. If any nodes were missing, they would be denoted by `null`. An empty tree is simply an empty string.\n\n**Constraints**\n- The number of nodes in the tree is in the range `[0, 100]`.\n- `-100 <= Node.val <= 100`\n\n**Example 1**\n```\ninput:\n4 2 7 1 3 6 9\noutput:\n4 7 2 9 6 3 1\n```\n*Explanation: The root 4's left and right subtrees (2 and 7) are swapped. For the subtree rooted at 2, children 1 and 3 are swapped. For the subtree rooted at 7, children 6 and 9 are swapped. The level-order traversal of the resulting tree is 4 7 2 9 6 3 1.*\n\n**Example 2**\n```\ninput:\n2 1 3\noutput:\n2 3 1\n```\n*Explanation: The root 2 has its left child (1) and right child (3) swapped.*\n\n**Example 3**\n```\ninput:\n\noutput:\n\n```\n*Explanation: An empty tree input results in an empty tree output.*\n\n**Follow-up**\nCan you implement this using an iterative queue instead of recursion?",
    editorialMarkdown: "## Mirror Solar System\n\nThis problem requires us to traverse a binary tree and swap the left and right children of every single node in the tree.\nA recursive Depth-First Search (DFS) is an elegant way to approach this. For a given node, we recursively call our function on the left child and the right child, and then swap the two children references.\nAlternatively, a Breadth-First Search (BFS) using a queue can visit every node level by level, swapping children along the way. Both approaches yield exactly the same mirrored tree.\n\n**Trap**: A common trap is swapping the children before making the recursive calls, but then passing the already-swapped references into the recursive calls, which technically still works as long as both children are processed! A real failure occurs if you overwrite a child reference without caching the other one first.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of nodes in the tree, because we visit every single node exactly once.\n- **Space:** O(H) where H is the height of the tree. This is the space used by the call stack during the recursive DFS. In the worst case (a skewed tree), this is O(N).",
    referenceSolution: {
      JAVASCRIPT: "function solve(root) {\n    if (!root) return null;\n    let temp = root.left;\n    root.left = solve(root.right);\n    root.right = solve(temp);\n    return root;\n}",
      TYPESCRIPT: "function solve(root: any): any {\n    if (!root) return null;\n    let temp = root.left;\n    root.left = solve(root.right);\n    root.right = solve(temp);\n    return root;\n}",
      PYTHON: "def solve(root):\n    if not root:\n        return None\n    root.left, root.right = solve(root.right), solve(root.left)\n    return root",
      JAVA: "    static TreeNode solve(TreeNode root) {\n        if (root == null) return null;\n        TreeNode temp = root.left;\n        root.left = solve(root.right);\n        root.right = solve(temp);\n        return root;\n    }",
      CPP: "TreeNode* solve(TreeNode* root) {\n    if (!root) return nullptr;\n    TreeNode* temp = root->left;\n    root->left = solve(root->right);\n    root->right = solve(temp);\n    return root;\n}",
      GO: "func solve(root *TreeNode) *TreeNode {\n    if root == nil {\n        return nil\n    }\n    temp := root.Left\n    root.Left = solve(root.Right)\n    root.Right = solve(temp)\n    return root\n}",
    },
    tests: [
      { stdin: "4 2 7 1 3 6 9", expectedStdout: "4 7 2 9 6 3 1", isSample: true },
      { stdin: "2 1 3", expectedStdout: "2 3 1", isSample: true },
      { stdin: "", expectedStdout: "", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 2 null", expectedStdout: "1 null 2" },
      { stdin: "1 null 2 null 3", expectedStdout: "1 2 null 3" },
      { stdin: "1 3 2", expectedStdout: "1 2 3" },
      { stdin: "5 6 7 null null 8 9", expectedStdout: "5 7 6 9 8" },
    ],
  }),
];
