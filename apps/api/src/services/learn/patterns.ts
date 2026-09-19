import type { Language } from '@codelock/shared';
import type { LanguageVariant, Lesson, LessonSource } from './catalog.js';

/**
 * Pattern lessons: the first families beyond the foundations.
 *
 * Same shape and the same rule as `lessons.ts`: every program runs on the
 * judge and must print what it claims. These are reached by the problem the
 * learner just met (a lock problem tagged `hash-map` maps here) or from the
 * topic list, not by the skill frontier, so they carry a `family` and the
 * tags the corpus uses for them.
 */

const REVIEWED = '2026-09-18';

const src = (publisher: string, title: string, url: string, section: string, runtime: string): LessonSource => ({
  publisher, title, url, section, runtime, reviewedOn: REVIEWED, adaptation: 'original', permission: 'link-only',
});
const NODE = 'Node 24';
const TS = 'Node 24, type stripping';
const PY = 'Python 3.13';
const JAVA = 'Java 21';
const CPP = 'GCC 14, -std=c++20';
const GO = 'Go 1.23';
const mdn = (title: string, path: string, section: string) =>
  src('MDN Web Docs', title, `https://developer.mozilla.org/en-US/docs/Web/JavaScript/${path}`, section, NODE);
const nodeTs = src('Node.js', 'Modules: TypeScript', 'https://nodejs.org/docs/latest-v24.x/api/typescript.html', 'Type stripping', TS);
const py = (title: string, path: string, section: string, runtime: string = PY) =>
  src('Python Software Foundation', title, `https://docs.python.org/3.13/${path}`, section, runtime);
const devjava = (title: string, path: string, section: string) => src('Oracle, dev.java', title, `https://dev.java/learn/${path}`, section, JAVA);
const cppref = (title: string, path: string, section: string) => src('cppreference.com', title, `https://en.cppreference.com/w/cpp/${path}`, section, CPP);
const gospec = (title: string, anchor: string, section: string) =>
  src('The Go Authors', `The Go Programming Language Specification — ${title}`, `https://go.dev/ref/spec#${anchor}`, section, GO);
const goblog = (title: string, path: string, section: string) => src('The Go Authors', title, `https://go.dev/blog/${path}`, section, GO);
const ocw = (section: string) =>
  src('MIT OpenCourseWare', '6.006 Introduction to Algorithms, Spring 2020', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', section, 'concept');

type Variants = Record<Language, Omit<LanguageVariant, 'language'>>;
function variants(v: Variants): Record<Language, LanguageVariant> {
  const out = {} as Record<Language, LanguageVariant>;
  for (const language of Object.keys(v) as Language[]) out[language] = { language, ...v[language] };
  return out;
}
const trim = (code: string) => code.replace(/^\n/, '').replace(/\n[ \t]*$/, '\n');

// ---------------------------------------------------------------------------
// ARRAYS_HASHING: find a pair with a map, in one pass
// ---------------------------------------------------------------------------

const PAIR_PROMPT = 'The program should print the two positions whose values add to 9: 0 1. It never finds them because nothing is ever put into the map. Add the one line that remembers each value and its position.';

const HASH_MAP_PAIR: Lesson = {
  id: 'hash-map-pair',
  refresher:
    'At each item, ask the map for target minus the item; if present you have the pair, otherwise store the item with its position. Ask before you store, or an item can pair with itself.',
  skill: 'combining',
  family: 'ARRAYS_HASHING',
  tags: ['hash-map', 'two-sum', 'complement'],
  title: 'Find a pair with a map, in one pass',
  objective: 'Find two items that combine to a target in one pass, by asking a map "have I seen the partner?" before remembering the current item.',
  prerequisites: ['loops', 'functions'],
  misconceptions: [],
  explanation:
    'Checking every pair is two loops and slow. The one-pass version turns the question around: at each item, the partner it needs is known — target minus the item — so ask a map whether that partner has already been seen. If yes, you have the pair. If no, remember this item and its position in the map and move on. The order matters: ask first, remember second, or an item can pair with itself.',
  alternate:
    'Imagine walking through a room of people whose numbers you know, looking for two that add to 9. Instead of comparing everyone with everyone, you keep a notebook: at each person you check the notebook for "9 minus their number"; if it is there, done; if not, you write their number down and move on. The notebook is the map, and you only ever write after you have looked.',
  trace: [
    { label: 'Before the loop', text: 'seen is empty. nums is 2, 7, 11, 15 and the target is 9.' },
    { label: 'Position 0', text: 'Item 2 needs 7. Is 7 in seen? No. Remember 2 → 0.' },
    { label: 'Position 1', text: 'Item 7 needs 2. Is 2 in seen? Yes, at position 0. The pair is positions 0 and 1.' },
    { label: 'Stop', text: 'The answer is found; the remaining items are never visited. Output: 0 1.' },
  ],
  smaller: {
    description: 'The same over 3, 6 with target 9.',
    trace: [
      { label: 'Position 0', text: 'Item 3 needs 6. Not seen. Remember 3 → 0.' },
      { label: 'Position 1', text: 'Item 6 needs 3. Seen at 0. Output: 0 1.' },
    ],
  },
  check: {
    id: 'hash-map-pair-order',
    question: 'Why must the map be checked before the current item is added to it?',
    options: [
      'It is faster that way',
      'Otherwise an item could pair with itself when the target is twice its value',
      'The map cannot hold an item until it has been checked',
      'It makes no difference',
    ],
    answer: 1,
    explanation: 'With target 8 and item 4, adding 4 first and then asking for 8 − 4 finds the item itself. Asking first means only earlier items can answer.',
  },
  practiceSkill: 'combining',
  sources: [ocw('Lecture 4: Hashing'), py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#dictionaries', 'Dictionaries', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: { code: trim(`
const nums = [2, 7, 11, 15];
const target = 9;
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
`), stdout: '0 1\n' },
      note: 'Map keys are compared by value for numbers, so seen.has(7) finds the 7 that was stored. break leaves the loop once the pair is printed.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
const nums = [2, 7, 11, 15];
const target = 9;
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
}
`), solution: trim(`
const nums = [2, 7, 11, 15];
const target = 9;
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
`), stdout: '0 1\n' },
      sources: [mdn('Keyed collections', 'Guide/Keyed_collections', 'Map object'), mdn('Map.prototype.has()', 'Reference/Global_Objects/Map/has', 'Description')],
    },
    TYPESCRIPT: {
      example: { code: trim(`
const nums: number[] = [2, 7, 11, 15];
const target: number = 9;
const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
`), stdout: '0 1\n' },
      note: 'Map<number, number> says the keys are values and the entries are positions.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
const nums: number[] = [2, 7, 11, 15];
const target: number = 9;
const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
}
`), solution: trim(`
const nums: number[] = [2, 7, 11, 15];
const target: number = 9;
const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
`), stdout: '0 1\n' },
      sources: [mdn('Keyed collections', 'Guide/Keyed_collections', 'Map object'), nodeTs],
    },
    PYTHON: {
      example: { code: trim(`
nums = [2, 7, 11, 15]
target = 9
seen = {}
for i, n in enumerate(nums):
    need = target - n
    if need in seen:
        print(seen[need], i)
        break
    seen[n] = i
`), stdout: '0 1\n' },
      note: 'enumerate gives the position and the item together; "in" on a dict asks about keys.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
nums = [2, 7, 11, 15]
target = 9
seen = {}
for i, n in enumerate(nums):
    need = target - n
    if need in seen:
        print(seen[need], i)
        break
`), solution: trim(`
nums = [2, 7, 11, 15]
target = 9
seen = {}
for i, n in enumerate(nums):
    need = target - n
    if need in seen:
        print(seen[need], i)
        break
    seen[n] = i
`), stdout: '0 1\n' },
      sources: [py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#dictionaries', 'Dictionaries — the in keyword'), py('Built-in Functions', 'library/functions.html#enumerate', 'enumerate()')],
    },
    JAVA: {
      example: { code: trim(`
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                System.out.println(seen.get(need) + " " + i);
                break;
            }
            seen.put(nums[i], i);
        }
    }
}
`), stdout: '0 1\n' },
      note: 'A HashMap boxes the int keys to Integer; containsKey and get do the lookup.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                System.out.println(seen.get(need) + " " + i);
                break;
            }
        }
    }
}
`), solution: trim(`
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                System.out.println(seen.get(need) + " " + i);
                break;
            }
            seen.put(nums[i], i);
        }
    }
}
`), stdout: '0 1\n' },
      sources: [devjava('Using Maps to Store Key Value Pairs', 'api/collections-framework/maps/', 'containsKey, get, put')],
    },
    CPP: {
      example: { code: trim(`
#include <iostream>
#include <unordered_map>
#include <vector>

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int need = target - nums[i];
        if (seen.count(need)) {
            std::cout << seen[need] << " " << i << "\\n";
            break;
        }
        seen[nums[i]] = i;
    }
}
`), stdout: '0 1\n' },
      note: 'count(key) is 0 or 1 for an unordered_map, so it works as "is it there". Reading seen[need] after count is safe; reading it before would insert the key.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
#include <iostream>
#include <unordered_map>
#include <vector>

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int need = target - nums[i];
        if (seen.count(need)) {
            std::cout << seen[need] << " " << i << "\\n";
            break;
        }
    }
}
`), solution: trim(`
#include <iostream>
#include <unordered_map>
#include <vector>

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int need = target - nums[i];
        if (seen.count(need)) {
            std::cout << seen[need] << " " << i << "\\n";
            break;
        }
        seen[nums[i]] = i;
    }
}
`), stdout: '0 1\n' },
      sources: [cppref('std::unordered_map', 'container/unordered_map', 'count, operator[]')],
    },
    GO: {
      example: { code: trim(`
package main

import "fmt"

func main() {
    nums := []int{2, 7, 11, 15}
    target := 9
    seen := map[int]int{}
    for i, n := range nums {
        need := target - n
        if j, ok := seen[need]; ok {
            fmt.Println(j, i)
            break
        }
        seen[n] = i
    }
}
`), stdout: '0 1\n' },
      note: 'The two-value form j, ok := seen[need] tells presence apart from a stored zero.',
      task: { prompt: PAIR_PROMPT, starter: trim(`
package main

import "fmt"

func main() {
    nums := []int{2, 7, 11, 15}
    target := 9
    seen := map[int]int{}
    for i, n := range nums {
        need := target - n
        if j, ok := seen[need]; ok {
            fmt.Println(j, i)
            break
        }
    }
}
`), solution: trim(`
package main

import "fmt"

func main() {
    nums := []int{2, 7, 11, 15}
    target := 9
    seen := map[int]int{}
    for i, n := range nums {
        need := target - n
        if j, ok := seen[need]; ok {
            fmt.Println(j, i)
            break
        }
        seen[n] = i
    }
}
`), stdout: '0 1\n' },
      sources: [goblog('Go maps in action', 'maps', 'Working with maps — the two-value assignment'), gospec('Index expressions', 'Index_expressions', 'Map index with the comma-ok form')],
    },
  }),
};

// ---------------------------------------------------------------------------
// TWO_POINTERS: two indices closing in from both ends
// ---------------------------------------------------------------------------

const PAL_PROMPT = 'The program should print true for racecar. It prints false or crashes, because the right pointer starts one past the last position. Fix where right starts.';

const TWO_POINTERS_ENDS: Lesson = {
  id: 'two-pointers-ends',
  refresher:
    'left at 0, right at length - 1, loop while left < right, compare, move one or both inward. Starting right at the length reads past the end; stopping on left <= right compares the middle item with itself.',
  skill: 'combining',
  family: 'TWO_POINTERS',
  tags: ['two-pointers', 'palindrome'],
  title: 'Two pointers closing in from both ends',
  objective: 'Walk a sequence with one index from each end, decide which one moves at each step, and stop when they meet.',
  prerequisites: ['indexing', 'loops'],
  misconceptions: ['index_bound', 'unguarded_index'],
  explanation:
    'Some questions are about pairs at opposite ends: is this the same read backwards, do these two sum to the target in a sorted list. Two indices do it in one pass: left starts at 0, right at the last position, and the loop runs while left is before right. Each step compares the two items and moves one or both inward. The stopping condition is what people get wrong — left < right stops when they meet or cross, so the middle item of an odd-length sequence is never compared with itself.',
  alternate:
    'Two people start at opposite ends of a bookshelf and walk toward each other, comparing the books they are standing at. When they meet in the middle they stop; every pair has been checked exactly once. If either walked off the end of the shelf you would get an error, which is why right starts at the last book, not one past it.',
  trace: [
    { label: 'Set up', text: 's is racecar, length 7. left = 0, right = 6.' },
    { label: 'Step 1', text: 'r and r match. left 1, right 5.' },
    { label: 'Step 2', text: 'a and a match. left 2, right 4.' },
    { label: 'Step 3', text: 'c and c match. left 3, right 3.' },
    { label: 'Stop', text: 'left < right is false: they met. Nothing failed, so the answer is true.' },
  ],
  smaller: {
    description: 'The same with s = "ab".',
    trace: [
      { label: 'Set up', text: 'left = 0, right = 1.' },
      { label: 'Step 1', text: 'a and b differ: answer false, stop at once.' },
    ],
  },
  check: {
    id: 'two-pointers-start',
    question: 'For a string of length 7, where does the right pointer start?',
    options: ['7', '6', '3', '0'],
    answer: 1,
    explanation: 'The last valid position is length − 1, so 6. Starting at 7 reads past the end.',
  },
  practiceSkill: 'indexing',
  sources: [ocw('Lecture 2: Data Structures — sequence interface'), py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: indexing', 'concept')],
  variants: variants({
    JAVASCRIPT: {
      example: { code: trim(`
const s = "racecar";
let left = 0;
let right = s.length - 1;
let same = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), stdout: 'true\n' },
      note: null,
      task: { prompt: PAL_PROMPT, starter: trim(`
const s = "racecar";
let left = 0;
let right = s.length;
let same = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), solution: trim(`
const s = "racecar";
let left = 0;
let right = s.length - 1;
let same = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), stdout: 'true\n' },
      sources: [mdn('Loops and iteration', 'Guide/Loops_and_iteration', 'while statement'), mdn('Text formatting', 'Guide/Text_formatting', 'Accessing characters')],
    },
    TYPESCRIPT: {
      example: { code: trim(`
const s: string = "racecar";
let left: number = 0;
let right: number = s.length - 1;
let same: boolean = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), stdout: 'true\n' },
      note: null,
      task: { prompt: PAL_PROMPT, starter: trim(`
const s: string = "racecar";
let left: number = 0;
let right: number = s.length;
let same: boolean = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), solution: trim(`
const s: string = "racecar";
let left: number = 0;
let right: number = s.length - 1;
let same: boolean = true;
while (left < right) {
  if (s[left] !== s[right]) {
    same = false;
    break;
  }
  left++;
  right--;
}
console.log(same);
`), stdout: 'true\n' },
      sources: [mdn('Loops and iteration', 'Guide/Loops_and_iteration', 'while statement'), nodeTs],
    },
    PYTHON: {
      example: { code: trim(`
s = "racecar"
left = 0
right = len(s) - 1
same = True
while left < right:
    if s[left] != s[right]:
        same = False
        break
    left += 1
    right -= 1
print(str(same).lower())
`), stdout: 'true\n' },
      note: 'Python prints booleans as True and False; str(same).lower() prints the same word the other languages do.',
      task: { prompt: PAL_PROMPT, starter: trim(`
s = "racecar"
left = 0
right = len(s)
same = True
while left < right:
    if s[left] != s[right]:
        same = False
        break
    left += 1
    right -= 1
print(str(same).lower())
`), solution: trim(`
s = "racecar"
left = 0
right = len(s) - 1
same = True
while left < right:
    if s[left] != s[right]:
        same = False
        break
    left += 1
    right -= 1
print(str(same).lower())
`), stdout: 'true\n' },
      sources: [py('The Python Tutorial — More Control Flow Tools', 'tutorial/controlflow.html#break-and-continue-statements', 'break'), py('The Python Tutorial — An Informal Introduction to Python', 'tutorial/introduction.html#text', 'Text: indexing')],
    },
    JAVA: {
      example: { code: trim(`
public class Main {
    public static void main(String[] args) {
        String s = "racecar";
        int left = 0;
        int right = s.length() - 1;
        boolean same = true;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                same = false;
                break;
            }
            left++;
            right--;
        }
        System.out.println(same);
    }
}
`), stdout: 'true\n' },
      note: null,
      task: { prompt: PAL_PROMPT, starter: trim(`
public class Main {
    public static void main(String[] args) {
        String s = "racecar";
        int left = 0;
        int right = s.length();
        boolean same = true;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                same = false;
                break;
            }
            left++;
            right--;
        }
        System.out.println(same);
    }
}
`), solution: trim(`
public class Main {
    public static void main(String[] args) {
        String s = "racecar";
        int left = 0;
        int right = s.length() - 1;
        boolean same = true;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                same = false;
                break;
            }
            left++;
            right--;
        }
        System.out.println(same);
    }
}
`), stdout: 'true\n' },
      sources: [devjava('Control Flow Statements', 'language-basics/controlling-flow/', 'The while Statement; break')],
    },
    CPP: {
      example: { code: trim(`
#include <iostream>
#include <string>

int main() {
    std::string s = "racecar";
    int left = 0;
    int right = (int)s.size() - 1;
    bool same = true;
    while (left < right) {
        if (s.at(left) != s.at(right)) {
            same = false;
            break;
        }
        ++left;
        --right;
    }
    std::cout << (same ? "true" : "false") << "\\n";
}
`), stdout: 'true\n' },
      note: 'cout prints a bool as 1 or 0, so the word is chosen explicitly. at() is used so a wrong position throws instead of reading past the end.',
      task: { prompt: PAL_PROMPT, starter: trim(`
#include <iostream>
#include <string>

int main() {
    std::string s = "racecar";
    int left = 0;
    int right = (int)s.size();
    bool same = true;
    while (left < right) {
        if (s.at(left) != s.at(right)) {
            same = false;
            break;
        }
        ++left;
        --right;
    }
    std::cout << (same ? "true" : "false") << "\\n";
}
`), solution: trim(`
#include <iostream>
#include <string>

int main() {
    std::string s = "racecar";
    int left = 0;
    int right = (int)s.size() - 1;
    bool same = true;
    while (left < right) {
        if (s.at(left) != s.at(right)) {
            same = false;
            break;
        }
        ++left;
        --right;
    }
    std::cout << (same ? "true" : "false") << "\\n";
}
`), stdout: 'true\n' },
      sources: [cppref('while loop', 'language/while', 'Explanation'), cppref('std::basic_string::at', 'string/basic_string/at', 'Exceptions')],
    },
    GO: {
      example: { code: trim(`
package main

import "fmt"

func main() {
    s := "racecar"
    left := 0
    right := len(s) - 1
    same := true
    for left < right {
        if s[left] != s[right] {
            same = false
            break
        }
        left++
        right--
    }
    fmt.Println(same)
}
`), stdout: 'true\n' },
      note: 'Go has no while keyword; for with only a condition is the same loop. s[i] is a byte, fine for ASCII text like this.',
      task: { prompt: PAL_PROMPT, starter: trim(`
package main

import "fmt"

func main() {
    s := "racecar"
    left := 0
    right := len(s)
    same := true
    for left < right {
        if s[left] != s[right] {
            same = false
            break
        }
        left++
        right--
    }
    fmt.Println(same)
}
`), solution: trim(`
package main

import "fmt"

func main() {
    s := "racecar"
    left := 0
    right := len(s) - 1
    same := true
    for left < right {
        if s[left] != s[right] {
            same = false
            break
        }
        left++
        right--
    }
    fmt.Println(same)
}
`), stdout: 'true\n' },
      sources: [gospec('For statements', 'For_statements', 'For statements with single condition'), gospec('Index expressions', 'Index_expressions', 'String index')],
    },
  }),
};

export const PATTERN_LESSONS: readonly Lesson[] = [HASH_MAP_PAIR, TWO_POINTERS_ENDS];
