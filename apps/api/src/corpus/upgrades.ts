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
};
