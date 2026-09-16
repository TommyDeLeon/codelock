/**
 * Rewritten statements and editorials for hand-authored problems, keyed by
 * slug. Generated and extended by `scripts/upgrade-statements.ts`; applied
 * by `upgrade.ts`. Do not edit by hand — rerun the script.
 */
export interface StatementUpgrade {
  promptMarkdown: string;
  editorialMarkdown: string;
  /** stdin of tests a new example draws on, made visible as samples. */
  promoteSamples: string[];
  model: string;
  date: string;
  /** Set when the reviewer would not pass a rewrite; the original statement stays. */
  skipped?: string;
}

export const UPGRADES: Record<string, StatementUpgrade> = {
  "absolute-values": {
    "promptMarkdown": "Given an array of integers, replace every number with its distance from zero.\n\n**Example 1**\n\n```\ninput:\n-3 2 -1\noutput: 3 2 1\n```\nNegative numbers become positive, while positive numbers remain unchanged.\n\n**Example 2**\n\n```\ninput:\n\noutput: \n```\nAn empty list comes back empty.\n\n**Example 3**\n\n```\ninput:\n0\noutput: 0\n```\nZero stays zero.\n\n**Constraints**\n- The input array can contain any integer.\n- The array can be empty.\n\n**Follow-up:** Can you do this in O(n) time without modifying the original array?",
    "editorialMarkdown": "The intended approach is to build a new list, appending one transformed value per input value. This follows the map pattern. Every language has a built-in absolute-value function, or you can write a simple conditional check to negate negative values.\n\nThe one trap most solvers hit is modifying the input list while iterating it in languages where that aliases the caller's data. Building a new list avoids the question entirely, and returning a new object rather than mutating the argument is a habit worth having by default.\n\nThe time complexity is O(n) to iterate through the array, and the space complexity is O(n) for the new output list.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "add-two-lists": {
    "promptMarkdown": "Given two arrays of integers of the same length, add them together position by position. Return a new array where each entry is the sum of the entries at that position from the two input arrays.\n\n**Example 1**\n\n```\ninput:\n1 2 3\n4 5 6\noutput: 5 7 9\n```\nThe elements at each index are added: 1+4=5, 2+5=7, 3+6=9.\n\n**Example 2**\n\n```\ninput:\n\n\noutput: \n```\nTwo empty lists result in an empty list.\n\n**Example 3**\n\n```\ninput:\n0\n0\noutput: 0\n```\nAdding two zeros results in zero.\n\n**Constraints**\n- Both input arrays will always have the exact same length.\n- The arrays can be empty.\n\n**Follow-up:** Can you solve this in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to use a single loop over the array positions, using the index to read from both lists concurrently. This pattern is parallel iteration. \n\nThe one trap most solvers hit is trying to use two nested loops, which pairs every element with every other element and yields a completely different result. Another trap is trying to handle differing list lengths, but the constraints guarantee equal lengths, simplifying the logic to a single bound.\n\nThe time complexity is O(n) since we visit each element once, and the space complexity is O(n) to store the output array.",
    "promoteSamples": [
      "0\n0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "alternating-sum": {
    "promptMarkdown": "Given an array of integers, compute the alternating sum. Add the first number, subtract the second, add the third, subtract the fourth, and so on to the end of the list.\n\n**Example 1**\n\n```\ninput:\n1 2 3 4\noutput: -2\n```\nThe sum is 1 - 2 + 3 - 4 = -2.\n\n**Example 2**\n\n```\ninput:\n\noutput: 0\n```\nAn empty list evaluates to 0.\n\n**Example 3**\n\n```\ninput:\n5\noutput: 5\n```\nA one-element list returns that element unchanged.\n\n**Constraints**\n- The array can be empty, in which case the result is 0.\n\n**Follow-up:** Can you perform this operation in O(1) space?",
    "editorialMarkdown": "The intended approach is to loop over the array by index rather than by value, using the index to decide whether to add or subtract. This is the accumulator pattern. Even indices are added to the total, and odd indices are subtracted.\n\nThe one trap most solvers hit is subtracting a negative number and expecting the total to decrease. For example, if the current total is -1 and the element to subtract is -2, the operation is `-1 - (-2) = 1`, which correctly results in a larger number. Solvers often try to take the absolute value of elements when they see this, which breaks the logic for negative inputs entirely. \n\nThe time complexity is O(n) for a single pass through the array, and the space complexity is O(1) as we only need a single running total.",
    "promoteSamples": [
      "5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "are-anagrams": {
    "promptMarkdown": "Given two words on separate lines, determine whether they use exactly the same letters. Two words are anagrams when one can be rearranged into the other, meaning they have the exact same letters and the exact same number of each letter, with order being irrelevant. Both words consist of lower-case letters with no spaces.\n\n**Example 1**\n\n```\ninput:\nlisten\nsilent\noutput: true\n```\nBoth words contain the same letters in the same frequencies.\n\n**Example 2**\n\n```\ninput:\nabc\nabd\noutput: false\n```\nThe first word has a 'c' while the second has a 'd'.\n\n**Example 3**\n\n```\ninput:\n\n\noutput: true\n```\nTwo empty strings are considered anagrams of each other.\n\n**Constraints**\n- The strings contain only lowercase English letters.\n- The strings can be empty.\n\n**Follow-up:** Can you determine if they are anagrams in O(n) time?",
    "editorialMarkdown": "The intended approach is to count the occurrences of each letter in both words and compare the counts. This uses the frequency count pattern. You can build a map of character counts for the first word, then decrement the counts for the second word, checking that all frequencies end up at zero.\n\nThe one trap most solvers hit is forgetting to check the lengths of the two words first. Words of different lengths cannot be anagrams, and if you only verify that every letter in the first word appears the right number of times in the second, you might incorrectly return true when the second word contains additional letters (e.g., \"abc\" and \"abcc\"). Comparing lengths first completely avoids this issue.\n\nThe time complexity is O(n) where n is the length of the words, and the space complexity is O(1) or O(k) where k is the size of the alphabet, since there are at most 26 lowercase English letters to store counts for.",
    "promoteSamples": [
      "\n"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "average-of-list": {
    "promptMarkdown": "Given a list of whole numbers, calculate and return their average. The answer is a decimal, printed to six decimal places.\n\n**Example 1**\n\n```\ninput:\n1 2 3 4\noutput: 2.500000\n```\nThe sum is 10 and there are 4 numbers; 10 / 4 = 2.5.\n\n**Example 2**\n\n```\ninput:\n5\noutput: 5.000000\n```\nThe average of a single number is the number itself.\n\n**Example 3**\n\n```\ninput:\n1 2\noutput: 1.500000\n```\nThe sum is 3, divided by 2 is 1.5.\n\n**Constraints**\n- The list always has at least one number.\n\n**Follow-up:** Can you do this in a single pass with O(1) extra space?",
    "editorialMarkdown": "The intended approach is to sum all the numbers in the list and divide by the count of elements. This is a basic aggregate pattern. \n\nThe one trap most solvers hit is integer division. In many strongly-typed languages, dividing an integer by an integer yields an integer, discarding the fractional part silently. To get the correct decimal result, you must cast at least one of the operands to a floating-point type before performing the division.\n\nThe time complexity is O(n) to iterate through the array to find the sum, and the space complexity is O(1).",
    "promoteSamples": [
      "1 2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "cap-at-maximum": {
    "promptMarkdown": "Given a list of integers and a maximum cap, replace every number that is above the cap with the cap itself. Numbers at or below the cap should be left alone.\n\n**Example 1**\n\n```\ninput:\n1 9 4 7\n5\noutput: 1 5 4 5\n```\nThe numbers 9 and 7 are above the cap of 5, so they are replaced by 5.\n\n**Example 2**\n\n```\ninput:\n5 5\n5\noutput: 5 5\n```\nNumbers exactly equal to the cap are unchanged.\n\n**Example 3**\n\n```\ninput:\n\n3\noutput: \n```\nAn empty list comes back empty.\n\n**Constraints**\n- The list can be empty.\n- The cap and the numbers in the list can be negative.\n\n**Follow-up:** Can you perform this operation in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to iterate over the array and apply a simple condition to each element: if the element exceeds the cap, emit the cap, otherwise emit the element itself. This is the clamping or transform pattern.\n\nThe one trap most solvers hit is treating this as a filter rather than a transform. They might write logic that skips appending numbers greater than the cap, effectively removing them from the array entirely. Another subtle bug is getting the boundary condition wrong by checking `>=` instead of `>`, which behaves incorrectly on values that equal the cap. \n\nThe time complexity is O(n) as we examine each element once, and the space complexity is O(n) for the new array containing the clamped values.",
    "promoteSamples": [
      "\n3"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "capitalise-each-word": {
    "promptMarkdown": "Given a string of lower-case words separated by single spaces, make the first letter of every word upper case. The rest of each word should remain lower case. There are no leading or trailing spaces.\n\n**Example 1**\n\n```\ninput:\nhello world\noutput: Hello World\n```\nThe first letter of each word is capitalised.\n\n**Example 2**\n\n```\ninput:\n\noutput: \n```\nAn empty line comes back empty.\n\n**Example 3**\n\n```\ninput:\na b\noutput: A B\n```\nSingle-letter words are fully capitalised.\n\n**Constraints**\n- The string consists of lowercase letters and spaces.\n- Words are separated by exactly one space.\n- The string can be empty.\n\n**Follow-up:** Can you solve this in O(n) time?",
    "editorialMarkdown": "The intended approach is to break the input string into individual words, capitalise the first letter of each word while keeping the rest unchanged, and then join them back together with spaces. This utilizes the split-transform-join pattern.\n\nThe one trap most solvers hit is dealing with one-letter words. When slicing the rest of the string after the first character, some languages might throw an out-of-bounds error if the string is only one character long. Additionally, splitting an empty string can produce an array with one empty string, which causes an error when trying to access the first character. Handing the empty input as a special case upfront is usually required.\n\nThe time complexity is O(n) based on the length of the string, and the space complexity is O(n) to store the pieces and the result string.",
    "promoteSamples": [
      "a b"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "contains-word": {
    "promptMarkdown": "Given two lines of text containing lower-case letters and spaces, determine whether the first line contains the second line somewhere inside it as a substring.\n\n**Example 1**\n\n```\ninput:\nhello world\nlo w\noutput: true\n```\nThe substring \"lo w\" appears directly inside \"hello world\".\n\n**Example 2**\n\n```\ninput:\nhello\nxyz\noutput: false\n```\nThe substring \"xyz\" does not appear in \"hello\".\n\n**Example 3**\n\n```\ninput:\nabc\n\noutput: true\n```\nEvery string contains the empty string as a substring.\n\n**Constraints**\n- Both strings contain only lowercase English letters and spaces.\n- The strings can be empty.\n\n**Follow-up:** Can you determine this without using built-in substring search functions?",
    "editorialMarkdown": "The intended approach is to use your language's built-in substring or \"contains\" functionality, which is heavily optimized for this operation. This is a basic substring search pattern.\n\nThe one trap most solvers hit is getting confused by the problem title and trying to split the text into words to check for word inclusion. A substring can span across spaces and partial words, so breaking the text apart by spaces will give incorrect results. It is important to read the example cases, which clearly show a partial word match succeeding.\n\nThe time complexity is O(n * m) in the worst case with a naive search, where n is the length of the first string and m is the length of the second string, but built-in functions often achieve better performance in practice. The space complexity is O(1).",
    "promoteSamples": [
      "abc\n"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-characters-appearing-once": {
    "promptMarkdown": "Given a string of lowercase English letters, count the number of characters that appear exactly once.\n\n**Constraints**\n- The input string consists of only lowercase English letters.\n- The length of the string is between 0 and 10^5.\n\n**Example 1**\n```\ninput:\naabbc\noutput: 1\n```\nOnly `c` appears exactly once in the string.\n\n**Example 2**\n```\ninput:\nabc\noutput: 3\n```\nAll three characters `a`, `b`, and `c` appear exactly once.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains no characters.\n\n**Follow-up:** Can you do this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach is to use the gather and decide pattern with a hash map or array.\n\nBecause you cannot know whether a character is unique until you have seen the entire string, the solution requires two passes. In the first pass, iterate through the string and build a frequency map of the characters. In the second pass, iterate through the values in the frequency map and count how many characters have a frequency of exactly 1. \n\nA common trap is iterating over the string during the second pass instead of the frequency map. Doing so would count a character multiple times if you're not careful (though for unique characters, it wouldn't matter, but iterating the map avoids this completely and is cleaner). \n\nThe time complexity is O(n) where n is the length of the string, as we do a constant amount of work for each character. The space complexity is O(k) where k is the size of the alphabet. Since there are only 26 lowercase English letters, this is bounded by O(1) space.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-distinct-values": {
    "promptMarkdown": "Given a list of integers, determine the total number of distinct integers present in the list.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer in the list fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 2 3 1\noutput: 3\n```\nThe distinct values in the list are 1, 2, and 3.\n\n**Example 2**\n```\ninput:\n4 4 4\noutput: 1\n```\nThe only distinct value in the list is 4.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 distinct values.\n\n**Follow-up:** Can you solve this in O(n) time complexity?",
    "editorialMarkdown": "The most straightforward approach uses the hashing pattern by employing a set data structure. \n\nYou can iterate through the list and insert each number into a set. A set inherently discards duplicate values, so after processing all elements, the size of the set will exactly equal the number of distinct integers. \n\nThe trap most solvers hit is trying to sort the list first and counting adjacent differences, or just counting positions where a value differs from the previous one without sorting. The latter fails on lists like `1 2 1`. While sorting and counting works, it requires O(n log n) time. \n\nUsing a set achieves an average time complexity of O(n) because hash set insertions take O(1) on average. The space complexity is O(k) where k is the number of unique integers in the list, bounded by O(n) in the worst case.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-even-numbers": {
    "promptMarkdown": "Given a list of integers, count the number of even integers. An integer is even if it is divisible by 2 with no remainder. This includes zero and negative numbers.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 2\n```\nThe numbers 2 and 4 are even.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 even numbers.\n\n**Example 3**\n```\ninput:\n2 4 6\noutput: 3\n```\nAll three numbers 2, 4, and 6 are even.\n\n**Follow-up:** Can you accomplish this with a single pass and O(1) extra space?",
    "editorialMarkdown": "The intended approach uses the accumulator pattern along with the modulo operator.\n\nInitialize a counter to 0. Iterate over each integer in the list, and use the condition `n % 2 == 0` to check if it is even. If the condition is met, increment the counter.\n\nThe common trap in this problem and similar parity checks is testing for oddness to imply not-evenness using `n % 2 == 1`. In many programming languages, the modulo operator on a negative odd number (like `-3 % 2`) returns `-1`, not `1`, causing valid odd numbers to be missed, or logic bugs if used inverted. Testing `n % 2 == 0` avoids this negative modulo issue entirely because `0` is consistently returned for all even numbers.\n\nThe time complexity is O(n) where n is the number of integers, as each integer is examined exactly once. The space complexity is O(1) because only a single counter variable is maintained.",
    "promoteSamples": [
      "2 4 6"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-greater-than": {
    "promptMarkdown": "Given a list of integers and a threshold integer, count the number of elements in the list that are strictly greater than the threshold.\n\n**Constraints**\n- The list length is between 0 and 10^5.\n- The integers in the list and the threshold fit within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 5 3 9\n3\noutput: 2\n```\nThe numbers 5 and 9 are strictly greater than 3.\n\n**Example 2**\n```\ninput:\n3 3 3\n3\noutput: 0\n```\nNo numbers are strictly greater than 3.\n\n**Example 3**\n```\ninput:\n\n0\noutput: 0\n```\nAn empty list contains 0 numbers greater than 0.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach relies on a simple filtering and accumulator pattern.\n\nSet up a counter variable initialized to zero. Iterate through the elements of the list one by one. For each element, compare it against the threshold using the strictly greater than operator `>`. If the element is strictly greater, increment the counter by one. \n\nA frequent trap solvers encounter is the off-by-one error regarding the boundary condition. The prompt specifies \"strictly greater than\", meaning an element equal to the threshold should not be counted. Using `>=` instead of `>` will incorrectly count elements that match the threshold, failing tests like Example 2.\n\nThe time complexity for this approach is O(n), where n is the number of elements in the list, as it takes a single pass. The space complexity is O(1), since the only extra space required is for the counter variable.",
    "promoteSamples": [
      "\n0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-multiples": {
    "promptMarkdown": "Given a list of integers and a non-zero divisor, count the number of elements in the list that are exact multiples of the divisor.\n\n**Constraints**\n- The list length is between 0 and 10^5.\n- The integers in the list and the divisor fit within a standard 32-bit signed integer.\n- The divisor is never zero.\n\n**Example 1**\n```\ninput:\n3 6 7 9\n3\noutput: 3\n```\nThe numbers 3, 6, and 9 divide exactly by 3.\n\n**Example 2**\n```\ninput:\n1 2 4\n5\noutput: 0\n```\nNone of the numbers are exact multiples of 5.\n\n**Example 3**\n```\ninput:\n\n2\noutput: 0\n```\nAn empty list contains 0 exact multiples.\n\n**Follow-up:** Can you achieve a single-pass O(n) time complexity?",
    "editorialMarkdown": "The intended approach utilizes the accumulator pattern combined with the modulo operator.\n\nInitialize a counter to zero. Loop through each integer in the given list and check if it divides exactly by the divisor. You can determine this by checking if the remainder is zero using the modulo operator `n % d == 0`. If true, increment the counter.\n\nThe primary trap here is overlooking edge cases involving negative numbers and zero itself. Fortunately, the check `n % d == 0` correctly handles negative numbers since a zero remainder correctly signifies divisibility regardless of the sign. Another potential trap is dividing by zero, which causes a crash in most languages, but the problem constraints explicitly guarantee the divisor is non-zero, removing this risk.\n\nThe time complexity is O(n) because the algorithm processes each element of the list exactly once. The space complexity is O(1) as only a single integer is needed to store the count.",
    "promoteSamples": [
      "\n2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-occurrences": {
    "promptMarkdown": "Given a list of integers and a target integer, count the total number of times the target integer appears in the list.\n\n**Constraints**\n- The length of the list is between 0 and 10^5.\n- The integers in the list and the target fit within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 2 3\n2\noutput: 2\n```\nThe number 2 appears exactly 2 times in the list.\n\n**Example 2**\n```\ninput:\n1 2 3\n9\noutput: 0\n```\nThe number 9 does not appear in the list.\n\n**Example 3**\n```\ninput:\n5 5 5 5\n5\noutput: 4\n```\nThe number 5 appears 4 times.\n\n**Follow-up:** What are the time and space complexities of your approach?",
    "editorialMarkdown": "The intended approach involves a simple accumulator pattern with an equality check.\n\nTo solve this, declare a counter variable initialized to zero. Loop through the elements of the list and use the `==` operator to test if the current element matches the target number. If it does, increment the counter. Once the loop concludes, return the counter.\n\nA common trap is inadvertently returning early from the loop. If a solver writes a `return` statement as soon as they find the first match, their function will effectively answer the question \"does this number exist?\" instead of \"how many times does it appear?\". It is crucial to let the loop process the entire list. Another slight pitfall is writing special case logic for when the element is not found, which is unnecessary since the counter naturally starts at zero.\n\nThe time complexity is O(n) as we must iterate over the entire array of n elements. The space complexity is O(1) since we only use a single counter variable.",
    "promoteSamples": [
      "5 5 5 5\n5"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-odd-numbers": {
    "promptMarkdown": "Given a list of integers, count the number of odd integers. An integer is odd if dividing it by 2 leaves a non-zero remainder, which applies to both positive and negative integers.\n\n**Constraints**\n- The number of elements in the list is between 0 and 10^5.\n- Each integer fits within a standard 32-bit signed integer.\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 2\n```\nThe numbers 1 and 3 are odd.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty list contains 0 odd numbers.\n\n**Example 3**\n```\ninput:\n2 4 6\noutput: 0\n```\nThere are no odd numbers in this list.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach uses the accumulator pattern combined with a modulo check for oddness.\n\nCreate a counter starting at zero. Iterate over the provided list and test each number. An odd number is defined as not being evenly divisible by 2. Therefore, you should test `n % 2 != 0`. When this condition evaluates to true, increment the counter. \n\nThe biggest trap here is attempting to check for oddness by testing if the remainder equals one, like `n % 2 == 1`. In many programming languages, taking the modulo of a negative number yields a negative remainder, so `-3 % 2` evaluates to `-1`. Using `== 1` silently misses all negative odd numbers. Testing for `!= 0` correctly captures both `1` and `-1` remainders and is much safer.\n\nThe time complexity is O(n), where n is the number of elements in the list, as every element is visited once. The space complexity is O(1) since only one accumulator variable is needed.",
    "promoteSamples": [
      "2 4 6"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-spaces": {
    "promptMarkdown": "Given a string, count the total number of space characters it contains.\n\n**Constraints**\n- The string length is between 0 and 10^5.\n- The string may contain English letters, digits, punctuation, and spaces.\n\n**Example 1**\n```\ninput:\na b c\noutput: 2\n```\nThere are exactly 2 spaces in the string.\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains 0 spaces.\n\n**Example 3**\n```\ninput:\nabc\noutput: 0\n```\nThere are no spaces in the string.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach requires iterating through the string and counting specific characters.\n\nCharacters in a string can be compared just like any other values. You can initialize a counter to zero and loop through every character in the string. If the current character is equal to the space character `' '`, increment the counter. Alternatively, many languages offer built-in functions to count occurrences of a substring which optimize this loop under the hood.\n\nA trap that some solvers fall into is trying to be too clever by splitting the string into words and counting the words minus one. While this might work on clean input with single spaces between words, it completely fails on strings that have multiple consecutive spaces, leading or trailing spaces, or just spaces with no words at all. It is always safer to directly count the target characters.\n\nThe time complexity is O(n) where n is the length of the string, as it involves a single pass over the characters. The space complexity is O(1) because we only keep track of a single counter value.",
    "promoteSamples": [
      "abc"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-substring-occurrences": {
    "promptMarkdown": "Given two strings, a text and a pattern, count how many times the pattern appears inside the text. Matches are counted **without overlapping**: after a match, the search resumes at the character right after it.\n\n**Example 1**\n```\ninput:\naaaa\naa\noutput: 2\n```\nThe pattern `aa` appears twice without overlapping.\n\n**Example 2**\n```\ninput:\nbanana\nana\noutput: 1\n```\nThe pattern `ana` appears once. A second match would overlap the first.\n\n**Example 3**\n```\ninput:\nhello\nz\noutput: 0\n```\nThe pattern `z` does not appear in the text.\n\n**Constraints**\n- The text length is between 0 and 10,000 characters.\n- The pattern length is between 1 and 10,000 characters.\n- The pattern is never empty.\n\n**Follow-up:** Can you solve this in O(n + m) time where n and m are the lengths of the strings?",
    "editorialMarkdown": "The intended approach is to search for the pattern starting from the beginning of the text, and jump past the match. \n\nThis pattern is a non-overlapping substring search. On a hit, add one to the count and move the start position to the end of the match. When the search finds nothing, stop.\n\nThe one trap most solvers hit is advancing the start index by one instead of by the pattern's length. That counts overlapping matches instead, which gives incorrect results for strings like `aaaa` with `aa` or `banana` with `ana`. Another trap is forgetting to advance the start index at all, resulting in an infinite loop.\n\nThe time complexity is O(n * m) in the worst case for a basic search, where n is the text length and m is the pattern length. The space complexity is O(1).",
    "promoteSamples": [
      "hello\nz"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-uppercase-letters": {
    "promptMarkdown": "Given a string, count how many characters in the string are uppercase English letters, `A` through `Z`. Digits, spaces, and punctuation are not considered letters and should not be counted.\n\n**Example 1**\n```\ninput:\nHello World\noutput: 2\n```\nThere are two uppercase letters: 'H' and 'W'.\n\n**Example 2**\n```\ninput:\nA1b2C\noutput: 2\n```\nThe uppercase letters are 'A' and 'C'.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero uppercase letters.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- The string may contain letters, digits, spaces, and punctuation.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) space?",
    "editorialMarkdown": "The intended approach is to iterate through each character in the string and perform a range check to see if it falls between 'A' and 'Z' inclusive. \n\nThis pattern is a simple linear scan with a conditional check. Because character codes are contiguous and alphabetical, a single range test correctly identifies all uppercase letters.\n\nThe one trap most solvers hit is testing if a character is equal to its own uppercase form (e.g., checking if `ch == toUpperCase(ch)`). This is incorrect because digits, spaces, and punctuation marks are equal to their uppercase forms as well, leading to an overcount. The correct condition requires checking that the character is both a letter and uppercase, which the range check handles perfectly.\n\nThe time complexity is O(n), where n is the length of the string, since we inspect each character exactly once. The space complexity is O(1) as we only need a single counter variable.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-vowels": {
    "promptMarkdown": "Given a string of lowercase letters and spaces, count how many vowels it contains. The vowels are considered to be `a`, `e`, `i`, `o`, and `u`. Spaces and punctuation are not vowels.\n\n**Example 1**\n```\ninput:\nhello world\noutput: 3\n```\nThe vowels are 'e', 'o', and 'o'.\n\n**Example 2**\n```\ninput:\nxyz\noutput: 0\n```\nThere are no vowels in this string.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero vowels.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- All letters in the string are lowercase.\n\n**Follow-up:** Can you determine the count in O(n) time complexity?",
    "editorialMarkdown": "The intended approach is to iterate through the string and check if each character is present in a set of vowels. \n\nThis pattern uses hash set membership for fast lookups. By defining a set containing 'a', 'e', 'i', 'o', and 'u', we can check each character against it in constant time. \n\nThe one trap most solvers hit is writing out a long chain of equality checks with boolean OR operators. While functionally correct, it makes the code brittle and harder to read. The set membership approach scales better if the definition of what to count ever changes.\n\nThe time complexity is O(n), where n is the length of the string, as we check each character once. The space complexity is O(1) because the size of the vowel set is fixed at 5 characters regardless of the input size.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "count-words": {
    "promptMarkdown": "Given a line of text, count the number of words it contains. Words are separated by single spaces. There are no leading or trailing spaces.\n\n**Example 1**\n```\ninput:\nhello world\noutput: 2\n```\nThere are two words: \"hello\" and \"world\".\n\n**Example 2**\n```\ninput:\n\noutput: 0\n```\nAn empty string contains zero words.\n\n**Example 3**\n```\ninput:\na\noutput: 1\n```\nThere is one word: \"a\".\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n- Words consist of printable characters separated by a single space.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) auxiliary space without creating a new array of words?",
    "editorialMarkdown": "The intended approach is to split the line on spaces and count the resulting pieces. \n\nThis pattern is basic string parsing or tokenization. Many languages offer a built-in split function that makes this a one-line operation. \n\nThe one trap most solvers hit is failing to handle the empty string correctly. Splitting an empty string on a space often returns an array containing a single empty string element, which incorrectly gives a word count of 1 instead of 0. To avoid this, you must either explicitly check for an empty string before splitting, or use a splitting function that automatically discards empty tokens.\n\nThe time complexity is O(n), where n is the length of the string, because splitting requires a full pass over the characters. The space complexity is O(n) if an array of words is constructed, or O(1) if you count spaces manually.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "countdown-list": {
    "promptMarkdown": "Given an integer `n`, return a list of integers counting down from `n` to 1. If `n` is `0`, return an empty list.\n\n**Example 1**\n```\ninput:\n5\noutput: 5 4 3 2 1\n```\nThe numbers count down from 5 to 1.\n\n**Example 2**\n```\ninput:\n0\noutput: \n```\nWhen n is 0, the output is empty.\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\nThe countdown from 1 contains just 1.\n\n**Constraints**\n- `n` is between 0 and 10,000.\n\n**Follow-up:** Can you solve this iteratively without recursion?",
    "editorialMarkdown": "The intended approach is to write a loop that counts backward, starting from the given number down to 1, appending each value to a list. \n\nThis pattern relies on a descending loop. The loop initializes at the target number, runs as long as the counter is strictly greater than 0, and decrements by 1 on each iteration.\n\nThe one trap most solvers hit is getting the stopping condition wrong. Using a condition like greater than 1 instead of greater than 0 will incorrectly drop the final 1 from the output. Additionally, if the loop condition isn't checked before the first iteration, an input of 0 might erroneously produce an element instead of returning an empty list.\n\nThe time complexity is O(n), where n is the given number, as the loop runs n times. The space complexity is O(n) to store the resulting list.",
    "promoteSamples": [
      "1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "double-each-number": {
    "promptMarkdown": "Given a list of integers, return a new list where every number has been multiplied by two.\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 2 4 6\n```\nEach number in the input list is doubled.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty list results in an empty list.\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\nDoubling 0 gives 0.\n\n**Constraints**\n- The list length is between 0 and 10,000.\n- Each integer in the list is between -10,000 and 10,000.\n\n**Follow-up:** Can you modify the input list in-place to achieve O(1) extra space?",
    "editorialMarkdown": "The intended approach is to iterate over each element in the array, multiply it by two, and append the result to a new array. \n\nThis pattern is a one-to-one transformation, often referred to as a map operation. The resulting array will always have the exact same length as the original input.\n\nThe one trap most solvers hit is inadvertently treating this as a filter rather than a pure transformation by conditionally skipping elements. If elements are conditionally skipped or appended, the output length won't match the input length, violating the core requirement of a map operation.\n\nThe time complexity is O(n), where n is the length of the list, since we visit every element once. The space complexity is O(n) to construct the new output list.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "factorial-of-n": {
    "promptMarkdown": "Given a whole number `n`, calculate its factorial. The factorial of a number is the product of all positive integers less than or equal to `n`. For example, the factorial of 5 is `1 * 2 * 3 * 4 * 5 = 120`.\n\n**Example 1**\n```\ninput:\n5\noutput: 120\n```\nThe product of 1 through 5 is 120.\n\n**Example 2**\n```\ninput:\n0\noutput: 1\n```\nThe factorial of 0 is defined as 1.\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\nThe factorial of 1 is 1.\n\n**Constraints**\n- `n` is between 0 and 12.\n- The input is small enough that the answer will always fit in a standard 32-bit integer.\n\n**Follow-up:** Can you write both an iterative and a recursive solution for this problem?",
    "editorialMarkdown": "The intended approach is to iterate from 2 up to the given number, multiplying each integer into a running total. \n\nThis pattern uses a multiplicative accumulator. A variable is initialized to 1 and updated iteratively with the product of the current index and the accumulator.\n\nThe one trap most solvers hit is initializing the accumulator to 0 instead of 1. Since 1 is the multiplicative identity, starting at 1 correctly accumulates the product, whereas starting at 0 guarantees the result will incorrectly be 0. Another subtle issue in similar problems is integer overflow due to the rapid growth of factorials, though the constraint of `n <= 12` avoids that here.\n\nThe time complexity is O(n), where n is the given number, as the loop runs proportionally to n. The space complexity is O(1) since we only use a single integer variable to track the product.",
    "promoteSamples": [
      "1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "first-character": {
    "promptMarkdown": "Given a string, return just the first character as a new string of length one. If the string is empty, return an empty string.\n\n**Example 1**\n```\ninput:\nhello\noutput: h\n```\nThe first character is 'h'.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty string returns an empty string.\n\n**Example 3**\n```\ninput:\na\noutput: a\n```\nThe first character is 'a'.\n\n**Constraints**\n- The string length is between 0 and 10,000 characters.\n\n**Follow-up:** Can you solve this in O(1) time and space?",
    "editorialMarkdown": "The intended approach is to check if the string is empty, and if not, return the character at the zeroth index. \n\nThis pattern is about guarding array or string indexing. You must explicitly verify that an element exists before attempting to access it to prevent out-of-bounds errors.\n\nThe one trap most solvers hit is immediately indexing into the string at position zero without first checking its length. Different programming languages handle out-of-bounds indexing differently—some throw exceptions, some return null or undefined, and some return empty values. Relying on language-specific boundary behavior is fragile; explicitly guarding the index ensures the logic is safe everywhere.\n\nThe time complexity is O(1) as finding the first character is an immediate lookup. The space complexity is O(1) since we only create a one-character string.",
    "promoteSamples": [
      "a"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "first-repeated-number": {
    "promptMarkdown": "Given an array of integers, identify the first integer that occurs more than once. Read the array from left to right and return the first element that you have already encountered previously in the array. If all integers are unique or the array is empty, return `-1`.\n\n**Constraints**\n- The array may be empty.\n- Elements are integers.\n\n**Example 1**\n```\ninput:\n1 2 3 2 1\noutput: 2\n```\nThe number `2` is the first element whose second appearance is encountered.\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: -1\n```\nAll elements are unique.\n\n**Example 3**\n```\ninput:\n\noutput: -1\n```\nThe array is empty.\n\n**Follow-up:** Can you solve this in O(n) time and O(n) space?",
    "editorialMarkdown": "The intended approach is to use the \"seen-before\" pattern utilizing a hash set. You iterate through the elements of the list one by one. For each element, you check if it already exists in your hash set of previously seen elements. If it does, you have found the first repeated number and can return it immediately. If it does not, you add the element to the hash set and continue. If the loop finishes without finding any duplicates, you return -1.\n\nThis approach operates in O(n) time because checking for existence and adding to a hash set both take O(1) time on average. The space complexity is O(n) because in the worst case (no duplicates), you will store every element in the hash set. The one trap most solvers hit is using two nested loops to compare every element with every previous element, which results in an inefficient O(n^2) time complexity. Using a hash set trades memory for speed, a fundamental concept in algorithm design.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "index-of-target": {
    "promptMarkdown": "Given an array of integers and a target integer, find the zero-based index of the first occurrence of the target in the array.\nThe input consists of two lines: the first line contains the space-separated integers of the array, and the second line contains the target integer. Return the index of the target. If the target is not found in the array, return `-1`.\n\n**Constraints**\n- The array can be empty.\n- The array can contain duplicates.\n\n**Example 1**\n```\ninput:\n5 3 7\n7\noutput: 2\n```\nThe target `7` is found at index 2.\n\n**Example 2**\n```\ninput:\n1 2\n9\noutput: -1\n```\nThe target `9` is not in the array.\n\n**Example 3**\n```\ninput:\n\n1\noutput: -1\n```\nThe array is empty, so the target cannot be found.\n\n**Follow-up:** Could you solve this with a single pass through the array?",
    "editorialMarkdown": "The optimal approach is a linear search. Iterate through the array while keeping track of the current index. At each step, compare the current element with the target. If they match, return the current index immediately. This early exit ensures you find the *first* occurrence and avoids unnecessary work. If the loop completes without finding a match, return -1.\n\nThe time complexity is O(n), where n is the length of the array, as you may need to inspect every element. The space complexity is O(1) since no additional data structures are required. A common trap is using an `else` branch inside the loop to return -1 when the current element does not match the target, which incorrectly terminates the search on the very first element if it's not a match. Another detail is using -1 as a sentinel value, which is safe because valid indices are non-negative.",
    "promoteSamples": [
      "\n1"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-even-number": {
    "promptMarkdown": "Determine if a given integer is even. An even number is an integer that is exactly divisible by 2. Return `true` if the number is even, and `false` otherwise.\n\n**Constraints**\n- The input integer can be positive, negative, or zero.\n\n**Example 1**\n```\ninput:\n4\noutput: true\n```\n4 is divisible by 2.\n\n**Example 2**\n```\ninput:\n7\noutput: false\n```\n7 is not exactly divisible by 2.\n\n**Example 3**\n```\ninput:\n0\noutput: true\n```\n0 is considered an even number.\n\n**Follow-up:** Is it possible to evaluate this without conditional branching?",
    "editorialMarkdown": "The direct approach is to use the modulo operator to check if the remainder of dividing the number by 2 is zero (`n % 2 == 0`). This expression naturally evaluates to a boolean value.\n\nThe time complexity is O(1) and the space complexity is O(1). The trap most solvers hit is explicitly writing out an if-else statement to return `true` or `false` based on the condition, which is overly verbose. Returning the result of the boolean expression directly is cleaner and more idiomatic. Another common stumbling block is the handling of negative numbers, but in most languages, `-n % 2` correctly evaluates to 0 for even numbers, making the simple modulo check robust for all integers.",
    "promoteSamples": [
      "0"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-prime": {
    "promptMarkdown": "Determine whether a given non-negative integer is a prime number. A prime number is a number greater than 1 that has no positive divisors other than 1 and itself. Return `true` if the number is prime, and `false` otherwise.\n\n**Constraints**\n- The input integer is greater than or equal to 0.\n\n**Example 1**\n```\ninput:\n17\noutput: true\n```\n17 has exactly two divisors: 1 and 17.\n\n**Example 2**\n```\ninput:\n1\noutput: false\n```\n1 is not a prime number as it does not have two distinct divisors.\n\n**Example 3**\n```\ninput:\n2\noutput: true\n```\n2 is the smallest prime number.\n\n**Follow-up:** Can you optimize your algorithm to run faster than O(n) time?",
    "editorialMarkdown": "The standard approach to primality testing involves checking for factors up to the square root of the number. If a number `n` is composite, it can be factored into two integers, at least one of which must be less than or equal to the square root of `n`. Therefore, iterating a potential divisor `i` from 2 up to the square root of `n` is sufficient. If `n` is divisible by `i`, it is not prime.\n\nThis yields a time complexity of O(sqrt n) and a space complexity of O(1). The trap most solvers hit is testing all numbers up to `n`, which works but is drastically slower, resulting in an O(n) time complexity. Another common mistake is failing to handle small edge cases like 0 and 1, which are not prime but might incorrectly return `true` if a loop starting at 2 is skipped without an explicit guard. A best practice is to write the loop condition as `i * i <= n` to avoid floating-point inaccuracies from computing a square root.",
    "promoteSamples": [
      "2"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "is-sorted-ascending": {
    "promptMarkdown": "Determine if a given array of integers is sorted in ascending order. An array is sorted in ascending order if every element is greater than or equal to the preceding element.\n\n**Constraints**\n- The array may contain duplicate elements.\n- The array can be empty or have a single element.\n\n**Example 1**\n```\ninput:\n1 2 2 5\noutput: true\n```\nEvery element is greater than or equal to the one before it.\n\n**Example 2**\n```\ninput:\n3 1\noutput: false\n```\nThe second element (1) is less than the first (3).\n\n**Example 3**\n```\ninput:\n\noutput: true\n```\nAn empty array is considered sorted.\n\n**Follow-up:** Can you implement the check using a single pass with O(1) auxiliary space?",
    "editorialMarkdown": "The intended approach compares adjacent pairs of elements in a single pass. You can iterate through the array starting from the second element (index 1) and compare each element to the one immediately preceding it. If you find any element that is strictly less than its predecessor, the array is not sorted, and you can immediately return `false`. If the loop finishes without finding any out-of-order pairs, the array is sorted, and you return `true`.\n\nThe time complexity is O(n), where n is the number of elements in the array, and the space complexity is O(1). The trap most solvers hit is starting the loop at index 0 and trying to access index -1, which leads to an out-of-bounds error or undefined behavior depending on the language. Starting at index 1 avoids this issue and gracefully handles empty or single-element arrays by completely skipping the loop body and correctly returning `true`.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "join-with-dashes": {
    "promptMarkdown": "Given a list of words provided as a single string of space-separated tokens, join the words together using dashes (`-`) as separators and return the resulting string.\n\n**Constraints**\n- The input string may be empty.\n- Words do not contain spaces.\n\n**Example 1**\n```\ninput:\nred green blue\noutput: red-green-blue\n```\nThe three words are joined by two dashes.\n\n**Example 2**\n```\ninput:\nsolo\noutput: solo\n```\nA single word is returned as is without any dashes.\n\n**Example 3**\n```\ninput:\n\noutput: \n```\nAn empty input yields an empty output.\n\n**Follow-up:** What is the time complexity of your string concatenation approach?",
    "editorialMarkdown": "The optimal approach is to use the standard library's built-in string join method if available, parsing the space-separated string into an array of words and then joining them with a dash. If implementing it manually, one should iterate over the list of words and append each word to a result builder. The separator should be inserted only between words, meaning it is added before the current word only if the result builder is not currently empty.\n\nThe time complexity is O(n), where n is the total length of the input string. Space complexity is also O(n) to store the resulting string. The trap most solvers hit when writing the loop by hand is appending a dash after every word, which leaves an unwanted trailing dash at the end of the final string that must then be manually stripped. Proper conditional insertion avoids this off-by-one error altogether.",
    "promoteSamples": [
      ""
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "largest-number": {
    "promptMarkdown": "Given an array of integers, find and return the largest integer in the array.\n\n**Constraints**\n- The array will contain at least one integer.\n- The integers can be negative, zero, or positive.\n\n**Example 1**\n```\ninput:\n3 9 2 7\noutput: 9\n```\n9 is the largest number in the array.\n\n**Example 2**\n```\ninput:\n-5 -2 -9\noutput: -2\n```\nAmong negative numbers, -2 is the largest.\n\n**Example 3**\n```\ninput:\n4\noutput: 4\n```\nFor a single-element array, that element is the largest.\n\n**Follow-up:** Can you solve this in O(n) time using O(1) space?",
    "editorialMarkdown": "The standard approach involves maintaining a \"running best\" variable. You initialize this variable with the first element of the array. Then, iterate through the rest of the array elements. For each element, compare it against the running best. If the current element is strictly greater, update the running best to this new value.\n\nThe time complexity is O(n) and the space complexity is O(1). The trap most solvers hit is initializing the running best variable to 0. While this works for arrays with positive numbers, it completely fails if the array contains only negative numbers, as 0 will be erroneously returned despite never being in the array. Starting with the first element of the array ensures the baseline comparison is a valid data point.",
    "promoteSamples": [
      "4"
    ],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "last-digit": {
    "promptMarkdown": "Given a non-negative integer, return its last digit.\n\n**Constraints**\n- The input is an integer greater than or equal to `0`.\n\n**Example 1**\n```\ninput:\n1234\noutput: 4\n```\nThe last digit of 1234 is 4.\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\nThe last digit of 0 is 0.\n\n**Follow-up:** Can you solve this in O(1) time and O(1) space without converting the number to a string?",
    "editorialMarkdown": "The intended approach is to use the modulo operator to extract the final digit of the integer. The pattern's name is basic arithmetic manipulation. The time complexity is O(1) and the space complexity is O(1). The one trap most solvers hit is converting the number to a string and reading the last character, which works but takes the data out of the numeric domain and requires extra time and space overhead. Taking the remainder by 10 mathematically isolates the lowest place value in base 10, completely avoiding the need for type conversions.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "min-and-max": {
    "promptMarkdown": "Given a list of integers, return two numbers: the smallest number in the list followed by the largest number in the list.\n\n**Constraints**\n- The list will always contain at least one integer.\n- The integers can be negative, zero, or positive.\n\n**Example 1**\n```\ninput:\n3 1 4 1 5\noutput: 1 5\n```\nThe smallest number is 1 and the largest is 5.\n\n**Example 2**\n```\ninput:\n7\noutput: 7 7\n```\nSince 7 is the only element, it is both the smallest and the largest.\n\n**Follow-up:** Can you solve this in a single pass with O(1) auxiliary space?",
    "editorialMarkdown": "The intended approach is to initialize both the minimum and maximum trackers to the first element of the list, then iterate through the rest of the list once, updating the bounds as needed. The pattern's name is running best. Time complexity is O(n) and space complexity is O(1). The one trap most solvers hit is initializing the minimum value to 0 or another arbitrary constant. If the list contains only numbers greater than 0, a starting minimum of 0 will be incorrectly returned as the answer. By seeding the starting values directly from the input array, the logic safely accommodates negatives.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "most-frequent-character": {
    "promptMarkdown": "Find the character that appears most often in a given string and return it as a one-character string. If two or more characters tie for the most frequent, return the one that appears first in the original string.\n\n**Constraints**\n- The input string contains only lowercase English letters and no spaces.\n- The input string is never empty.\n\n**Example 1**\n```\ninput:\naabbbcc\noutput: b\n```\nThe character b appears 3 times, which is more than a or c.\n\n**Example 2**\n```\ninput:\nabc\noutput: a\n```\nAll characters appear once, so the first character in the string is returned.\n\n**Follow-up:** Can you solve this in O(n) time complexity?",
    "editorialMarkdown": "The intended approach involves two passes: one to count the frequencies of each character using a hash map, and a second pass over the original string to find the character with the highest count. The pattern's name is frequency counting. Time complexity is O(n) and space complexity is O(k) where k is the size of the alphabet. The one trap most solvers hit is iterating over the hash map to find the maximum count instead of the original string. Because hash maps do not preserve order in many languages, iterating over the map will return an arbitrary character in the event of a tie. By iterating over the original string to find the maximum frequency, we guarantee that the first character to reach that frequency in the text is chosen.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
  "palindrome-check": {
    "promptMarkdown": "Determine whether a given string reads the same forwards and backwards. Return `true` if it is a palindrome, and `false` otherwise. Compare the characters exactly as they are provided, without removing spaces.\n\n**Constraints**\n- The input string will consist of lowercase letters and spaces.\n- The string length is between 0 and 100,000.\n\n**Example 1**\n```\ninput:\nracecar\noutput: true\n```\nThe string racecar reads the same forwards and backwards.\n\n**Example 2**\n```\ninput:\nhello\noutput: false\n```\nThe string hello is not a palindrome.\n\n**Follow-up:** Can you solve this in O(n) time and O(1) extra space without allocating a reversed string?",
    "editorialMarkdown": "The intended approach is to initialize two pointers, one at the beginning of the string and one at the end, and walk them inwards towards the center. The pattern's name is two pointers. Time complexity is O(n) and space complexity is O(1). The one trap most solvers hit is building a completely reversed string in memory and then comparing it to the original. While technically correct, this approach allocates O(n) extra space and always processes the entire string, even if the mismatch occurs immediately on the first character. The two-pointer approach avoids this and halts on the first discrepancy.",
    "promoteSamples": [],
    "model": "gemini-3.1-pro-low",
    "date": "2026-09-16"
  },
};
