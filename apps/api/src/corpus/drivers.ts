/**
 * Driver generation — one harness per *signature*, not per problem.
 *
 * A driver is a complete program with a `{{SOLUTION}}` slot, exactly as
 * `seed.ts` has always shaped them and as `grading.ts` expects. The difference
 * is that these are composed from per-language type codecs instead of typed out
 * by hand, so adding the 400th problem costs a row, not a harness.
 *
 * Two families:
 *   - free function  — `solve(params...) -> value`, the Tier 0/1/2/3 shape.
 *   - operation log  — construct the user's class, replay a command list,
 *                      compare per operation. The Tier 0.5 shape.
 *
 * The wire format is text, one parameter per line, because a driver has to
 * parse it in C++ and Go without a JSON library, and because a test case a
 * human can read is a test case a human can debug.
 */
import {
  LANGUAGES,
  type ClassSignature,
  type FunctionSignature,
  type Lang,
  type OpMethod,
  type PerLanguage,
  type ValueType,
} from './types.js';

/**
 * Parse and format helpers, emitted once into every generated program.
 *
 * Emitted unconditionally rather than pruned per signature: an unused helper
 * costs nothing at run time, and a conditional preamble is one more thing that
 * can be wrong in exactly one of six languages. Go is the exception that shapes
 * the rule — it fails compilation on an unused *import*, so every package
 * imported below is used by some helper.
 */

// --- JavaScript / TypeScript ------------------------------------------------
// TypeScript reuses the JavaScript body verbatim: it is valid TypeScript, Node
// 24 strips annotations at run time anyway, and two near-identical copies would
// drift. Types belong in the *stub* the user reads, not the harness they never see.

const JS_HELPERS = `
const __LINES = require('fs').readFileSync(0, 'utf8').split('\\n').map((s) => s.replace(/\\r/g, ''));
const __int = (s) => parseInt(String(s).trim(), 10);
const __dbl = (s) => parseFloat(String(s).trim());
const __bool = (s) => String(s).trim() === 'true';
const __str = (s) => String(s);
const __ints = (s) => { const t = String(s).trim(); return t === '' ? [] : t.split(/[ ,]+/).map(Number); };
const __strs = (s) => { const t = String(s).trim(); return t === '' ? [] : t.split(/\\s+/); };
const __mat = (s) => { const t = String(s).trim(); return t === '' ? [] : t.split(';').map(__ints); };
function TreeNode(val, left, right) { this.val = val; this.left = left || null; this.right = right || null; }
function ListNode(val, next) { this.val = val; this.next = next || null; }
const __tree = (s) => {
  const t = String(s).trim();
  if (t === '') return null;
  const tok = t.split(/[ ,]+/);
  const root = new TreeNode(Number(tok[0]));
  const q = [root];
  let i = 1;
  while (q.length && i < tok.length) {
    const node = q.shift();
    if (i < tok.length && tok[i] !== 'null') { node.left = new TreeNode(Number(tok[i])); q.push(node.left); }
    i++;
    if (i < tok.length && tok[i] !== 'null') { node.right = new TreeNode(Number(tok[i])); q.push(node.right); }
    i++;
  }
  return root;
};
const __list = (s) => {
  const v = __ints(s);
  let head = null;
  for (let i = v.length - 1; i >= 0; i--) head = new ListNode(v[i], head);
  return head;
};
const __fInt = (v) => String(v);
const __fDbl = (v) => Number(v).toFixed(6);
const __fBool = (v) => (v ? 'true' : 'false');
const __fStr = (v) => String(v);
const __fInts = (v) => (v || []).join(' ');
const __fStrs = (v) => (v || []).join(' ');
const __fMat = (v) => (v || []).map((r) => r.join(' ')).join(';');
const __fList = (h) => { const out = []; while (h) { out.push(h.val); h = h.next; } return out.join(' '); };
const __fTree = (root) => {
  if (!root) return '';
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (n === null || n === undefined) { out.push('null'); continue; }
    out.push(String(n.val));
    q.push(n.left); q.push(n.right);
  }
  while (out.length && out[out.length - 1] === 'null') out.pop();
  return out.join(' ');
};
`;

const PY_HELPERS = `import sys
from collections import deque
__LINES = [s.replace('\\r', '') for s in sys.stdin.read().split('\\n')] + ['', '', '']
def __int(s): return int(str(s).strip())
def __dbl(s): return float(str(s).strip())
def __bool(s): return str(s).strip() == 'true'
def __str_(s): return str(s)
def __ints(s):
    t = str(s).replace(',', ' ').strip()
    return [] if t == '' else [int(x) for x in t.split()]
def __strs(s):
    t = str(s).strip()
    return [] if t == '' else t.split()
def __mat(s):
    t = str(s).strip()
    return [] if t == '' else [__ints(r) for r in t.split(';')]
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next
def __tree(s):
    t = str(s).replace(',', ' ').strip()
    if t == '': return None
    tok = t.split()
    root = TreeNode(int(tok[0]))
    q = deque([root]); i = 1
    while q and i < len(tok):
        node = q.popleft()
        if i < len(tok) and tok[i] != 'null':
            node.left = TreeNode(int(tok[i])); q.append(node.left)
        i += 1
        if i < len(tok) and tok[i] != 'null':
            node.right = TreeNode(int(tok[i])); q.append(node.right)
        i += 1
    return root
def __list(s):
    head = None
    for v in reversed(__ints(s)):
        head = ListNode(v, head)
    return head
def __fInt(v): return str(v)
def __fDbl(v): return '%.6f' % float(v)
def __fBool(v): return 'true' if v else 'false'
def __fStr(v): return str(v)
def __fInts(v): return ' '.join(str(x) for x in (v or []))
def __fStrs(v): return ' '.join(str(x) for x in (v or []))
def __fMat(v): return ';'.join(' '.join(str(x) for x in r) for r in (v or []))
def __fList(h):
    out = []
    while h: out.append(str(h.val)); h = h.next
    return ' '.join(out)
def __fTree(root):
    if root is None: return ''
    out = []; q = deque([root])
    while q:
        n = q.popleft()
        if n is None: out.append('null'); continue
        out.append(str(n.val)); q.append(n.left); q.append(n.right)
    while out and out[-1] == 'null': out.pop()
    return ' '.join(out)
`;

const JAVA_HELPERS = `
    static java.util.List<String> __LINES = new java.util.ArrayList<>();
    static void __readAll() throws Exception {
        java.io.BufferedReader __br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String __l;
        while ((__l = __br.readLine()) != null) __LINES.add(__l);
        for (int __i = 0; __i < 4; __i++) __LINES.add("");
    }
    static String __tokAt(String[] t, int i) { return i < t.length ? t[i] : ""; }
    static int __int(String s) { return Integer.parseInt(s.trim()); }
    static double __dbl(String s) { return Double.parseDouble(s.trim()); }
    static boolean __bool(String s) { return s.trim().equals("true"); }
    static String __str(String s) { return s; }
    static int[] __ints(String s) {
        String t = s.replace(',', ' ').trim();
        if (t.isEmpty()) return new int[0];
        String[] p = t.split("\\\\s+");
        int[] r = new int[p.length];
        for (int i = 0; i < p.length; i++) r[i] = Integer.parseInt(p[i]);
        return r;
    }
    static String[] __strs(String s) {
        String t = s.trim();
        if (t.isEmpty()) return new String[0];
        return t.split("\\\\s+");
    }
    static int[][] __mat(String s) {
        String t = s.trim();
        if (t.isEmpty()) return new int[0][];
        String[] rows = t.split(";");
        int[][] r = new int[rows.length][];
        for (int i = 0; i < rows.length; i++) r[i] = __ints(rows[i]);
        return r;
    }
    static TreeNode __tree(String s) {
        String t = s.replace(',', ' ').trim();
        if (t.isEmpty()) return null;
        String[] tok = t.split("\\\\s+");
        TreeNode root = new TreeNode(Integer.parseInt(tok[0]));
        java.util.ArrayDeque<TreeNode> q = new java.util.ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < tok.length) {
            TreeNode n = q.poll();
            if (i < tok.length && !tok[i].equals("null")) { n.left = new TreeNode(Integer.parseInt(tok[i])); q.add(n.left); }
            i++;
            if (i < tok.length && !tok[i].equals("null")) { n.right = new TreeNode(Integer.parseInt(tok[i])); q.add(n.right); }
            i++;
        }
        return root;
    }
    static ListNode __list(String s) {
        int[] v = __ints(s);
        ListNode head = null;
        for (int i = v.length - 1; i >= 0; i--) head = new ListNode(v[i], head);
        return head;
    }
    static String __fInt(int v) { return String.valueOf(v); }
    static String __fDbl(double v) { return String.format(java.util.Locale.ROOT, "%.6f", v); }
    static String __fBool(boolean v) { return v ? "true" : "false"; }
    static String __fStr(String v) { return v; }
    static String __fInts(int[] v) {
        if (v == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(' '); sb.append(v[i]); }
        return sb.toString();
    }
    static String __fStrs(String[] v) { return v == null ? "" : String.join(" ", v); }
    static String __fMat(int[][] v) {
        if (v == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(';'); sb.append(__fInts(v[i])); }
        return sb.toString();
    }
    static String __fList(ListNode h) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        while (h != null) { if (!first) sb.append(' '); sb.append(h.val); first = false; h = h.next; }
        return sb.toString();
    }
    static String __fTree(TreeNode root) {
        if (root == null) return "";
        java.util.List<String> out = new java.util.ArrayList<>();
        // LinkedList, not ArrayDeque: level order has to carry the absent
        // children so they can be printed as "null", and ArrayDeque throws on a
        // null element. Every non-empty tree returned from Java died here with
        // a NullPointerException the moment a leaf was reached.
        java.util.LinkedList<TreeNode> q = new java.util.LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            if (n == null) { out.add("null"); continue; }
            out.add(String.valueOf(n.val));
            q.add(n.left); q.add(n.right);
        }
        while (!out.isEmpty() && out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
        return String.join(" ", out);
    }
`;

/** Node types live outside `Main` so a user's solution can name them. */
const JAVA_NODES = `class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}
class ListNode {
    int val; ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
`;

const CPP_HELPERS = `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left; TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}
};
struct ListNode {
    int val; ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *n) : val(x), next(n) {}
};

static vector<string> __LINES;
static string __trim(const string &s) {
    size_t a = s.find_first_not_of(" \\t\\r\\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(a, b - a + 1);
}
static vector<string> __split(const string &s, char sep) {
    vector<string> out;
    if (sep == ' ') {
        string norm = s;
        for (auto &c : norm) if (c == ',') c = ' ';
        istringstream ss(norm);
        string t;
        while (ss >> t) out.push_back(t);
        return out;
    }
    string cur;
    for (char c : s) { if (c == sep) { out.push_back(cur); cur.clear(); } else cur.push_back(c); }
    out.push_back(cur);
    return out;
}
static string __tokAt(const vector<string> &t, size_t i) { return i < t.size() ? t[i] : string(""); }
static int __int(const string &s) { return stoi(__trim(s)); }
static double __dbl(const string &s) { return stod(__trim(s)); }
static bool __bool(const string &s) { return __trim(s) == "true"; }
static string __str(const string &s) { return s; }
static vector<int> __ints(const string &s) {
    vector<int> r;
    for (auto &t : __split(s, ' ')) r.push_back(stoi(t));
    return r;
}
static vector<string> __strs(const string &s) { return __split(s, ' '); }
static vector<vector<int>> __mat(const string &s) {
    vector<vector<int>> r;
    if (__trim(s).empty()) return r;
    for (auto &row : __split(s, ';')) r.push_back(__ints(row));
    return r;
}
static TreeNode *__tree(const string &s) {
    vector<string> tok = __split(s, ' ');
    if (tok.empty()) return nullptr;
    TreeNode *root = new TreeNode(stoi(tok[0]));
    queue<TreeNode *> q; q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tok.size()) {
        TreeNode *n = q.front(); q.pop();
        if (i < tok.size() && tok[i] != "null") { n->left = new TreeNode(stoi(tok[i])); q.push(n->left); }
        i++;
        if (i < tok.size() && tok[i] != "null") { n->right = new TreeNode(stoi(tok[i])); q.push(n->right); }
        i++;
    }
    return root;
}
static ListNode *__list(const string &s) {
    vector<int> v = __ints(s);
    ListNode *head = nullptr;
    for (int i = (int)v.size() - 1; i >= 0; i--) head = new ListNode(v[i], head);
    return head;
}
static string __fInt(int v) { return to_string(v); }
static string __fDbl(double v) { char buf[64]; snprintf(buf, sizeof(buf), "%.6f", v); return string(buf); }
static string __fBool(bool v) { return v ? "true" : "false"; }
static string __fStr(const string &v) { return v; }
static string __fInts(const vector<int> &v) {
    string out;
    for (size_t i = 0; i < v.size(); i++) { if (i) out += ' '; out += to_string(v[i]); }
    return out;
}
static string __fStrs(const vector<string> &v) {
    string out;
    for (size_t i = 0; i < v.size(); i++) { if (i) out += ' '; out += v[i]; }
    return out;
}
static string __fMat(const vector<vector<int>> &v) {
    string out;
    for (size_t i = 0; i < v.size(); i++) { if (i) out += ';'; out += __fInts(v[i]); }
    return out;
}
static string __fList(ListNode *h) {
    string out; bool first = true;
    while (h) { if (!first) out += ' '; out += to_string(h->val); first = false; h = h->next; }
    return out;
}
static string __fTree(TreeNode *root) {
    if (!root) return "";
    vector<string> out; queue<TreeNode *> q; q.push(root);
    while (!q.empty()) {
        TreeNode *n = q.front(); q.pop();
        if (!n) { out.push_back("null"); continue; }
        out.push_back(to_string(n->val));
        q.push(n->left); q.push(n->right);
    }
    while (!out.empty() && out.back() == "null") out.pop_back();
    string s;
    for (size_t i = 0; i < out.size(); i++) { if (i) s += ' '; s += out[i]; }
    return s;
}
static void __readAll() {
    string line;
    while (getline(cin, line)) __LINES.push_back(line);
    __LINES.push_back(""); __LINES.push_back(""); __LINES.push_back("");
}
`;

const GO_HELPERS = `package main

import (
\t"bufio"
\t"fmt"
\t"os"
\t"strconv"
\t"strings"
)

type TreeNode struct {
\tVal   int
\tLeft  *TreeNode
\tRight *TreeNode
}

type ListNode struct {
\tVal  int
\tNext *ListNode
}

var __LINES []string

func __readAll() {
\tsc := bufio.NewScanner(os.Stdin)
\tsc.Buffer(make([]byte, 1024*1024), 16*1024*1024)
\tfor sc.Scan() {
\t\t__LINES = append(__LINES, strings.ReplaceAll(sc.Text(), "\\r", ""))
\t}
\t__LINES = append(__LINES, "", "", "")
}

func __tokAt(t []string, i int) string {
\tif i < len(t) {
\t\treturn t[i]
\t}
\treturn ""
}

func __fields(s string) []string {
\tt := strings.TrimSpace(strings.ReplaceAll(s, ",", " "))
\tif t == "" {
\t\treturn []string{}
\t}
\treturn strings.Fields(t)
}

func __int(s string) int     { v, _ := strconv.Atoi(strings.TrimSpace(s)); return v }
func __dbl(s string) float64 { v, _ := strconv.ParseFloat(strings.TrimSpace(s), 64); return v }
func __bool(s string) bool   { return strings.TrimSpace(s) == "true" }
func __str(s string) string  { return s }

func __ints(s string) []int {
\tf := __fields(s)
\tr := make([]int, len(f))
\tfor i, t := range f {
\t\tr[i], _ = strconv.Atoi(t)
\t}
\treturn r
}

func __strs(s string) []string { return __fields(s) }

func __mat(s string) [][]int {
\tt := strings.TrimSpace(s)
\tif t == "" {
\t\treturn [][]int{}
\t}
\trows := strings.Split(t, ";")
\tr := make([][]int, len(rows))
\tfor i, row := range rows {
\t\tr[i] = __ints(row)
\t}
\treturn r
}

func __tree(s string) *TreeNode {
\ttok := __fields(s)
\tif len(tok) == 0 {
\t\treturn nil
\t}
\tv, _ := strconv.Atoi(tok[0])
\troot := &TreeNode{Val: v}
\tq := []*TreeNode{root}
\ti := 1
\tfor len(q) > 0 && i < len(tok) {
\t\tn := q[0]
\t\tq = q[1:]
\t\tif i < len(tok) && tok[i] != "null" {
\t\t\tcv, _ := strconv.Atoi(tok[i])
\t\t\tn.Left = &TreeNode{Val: cv}
\t\t\tq = append(q, n.Left)
\t\t}
\t\ti++
\t\tif i < len(tok) && tok[i] != "null" {
\t\t\tcv, _ := strconv.Atoi(tok[i])
\t\t\tn.Right = &TreeNode{Val: cv}
\t\t\tq = append(q, n.Right)
\t\t}
\t\ti++
\t}
\treturn root
}

func __list(s string) *ListNode {
\tv := __ints(s)
\tvar head *ListNode
\tfor i := len(v) - 1; i >= 0; i-- {
\t\thead = &ListNode{Val: v[i], Next: head}
\t}
\treturn head
}

func __fInt(v int) string     { return strconv.Itoa(v) }
func __fDbl(v float64) string { return fmt.Sprintf("%.6f", v) }
func __fBool(v bool) string {
\tif v {
\t\treturn "true"
\t}
\treturn "false"
}
func __fStr(v string) string { return v }

func __fInts(v []int) string {
\tparts := make([]string, len(v))
\tfor i, x := range v {
\t\tparts[i] = strconv.Itoa(x)
\t}
\treturn strings.Join(parts, " ")
}

func __fStrs(v []string) string { return strings.Join(v, " ") }

func __fMat(v [][]int) string {
\tparts := make([]string, len(v))
\tfor i, r := range v {
\t\tparts[i] = __fInts(r)
\t}
\treturn strings.Join(parts, ";")
}

func __fList(h *ListNode) string {
\tvar parts []string
\tfor h != nil {
\t\tparts = append(parts, strconv.Itoa(h.Val))
\t\th = h.Next
\t}
\treturn strings.Join(parts, " ")
}

func __fTree(root *TreeNode) string {
\tif root == nil {
\t\treturn ""
\t}
\tvar out []string
\tq := []*TreeNode{root}
\tfor len(q) > 0 {
\t\tn := q[0]
\t\tq = q[1:]
\t\tif n == nil {
\t\t\tout = append(out, "null")
\t\t\tcontinue
\t\t}
\t\tout = append(out, strconv.Itoa(n.Val))
\t\tq = append(q, n.Left, n.Right)
\t}
\tfor len(out) > 0 && out[len(out)-1] == "null" {
\t\tout = out[:len(out)-1]
\t}
\treturn strings.Join(out, " ")
}
`;

// --- codec name tables ------------------------------------------------------

type Concrete = Exclude<ValueType, 'void'>;

/** Parser helper name for each type. Identical across languages by design. */
const PARSER: Record<Concrete, string> = {
  int: '__int',
  double: '__dbl',
  bool: '__bool',
  string: '__str',
  'int[]': '__ints',
  'string[]': '__strs',
  'int[][]': '__mat',
  tree: '__tree',
  list: '__list',
};

const FORMATTER: Record<Concrete, string> = {
  int: '__fInt',
  double: '__fDbl',
  bool: '__fBool',
  string: '__fStr',
  'int[]': '__fInts',
  'string[]': '__fStrs',
  'int[][]': '__fMat',
  tree: '__fTree',
  list: '__fList',
};

/** Python's `str` shadows a builtin, so its parser is spelled `__str_`. */
function parser(lang: Lang, type: Concrete): string {
  if (lang === 'PYTHON' && type === 'string') return '__str_';
  return PARSER[type];
}

/** Declared types, for Java/C++/Go locals and for every language's stub. */
const TYPE_NAMES: Record<Lang, Record<Concrete, string>> = {
  JAVASCRIPT: {
    int: '', double: '', bool: '', string: '',
    'int[]': '', 'string[]': '', 'int[][]': '', tree: '', list: '',
  },
  TYPESCRIPT: {
    int: 'number', double: 'number', bool: 'boolean', string: 'string',
    'int[]': 'number[]', 'string[]': 'string[]', 'int[][]': 'number[][]',
    tree: 'TreeNode | null', list: 'ListNode | null',
  },
  PYTHON: {
    int: 'int', double: 'float', bool: 'bool', string: 'str',
    'int[]': 'list[int]', 'string[]': 'list[str]', 'int[][]': 'list[list[int]]',
    tree: 'TreeNode | None', list: 'ListNode | None',
  },
  JAVA: {
    int: 'int', double: 'double', bool: 'boolean', string: 'String',
    'int[]': 'int[]', 'string[]': 'String[]', 'int[][]': 'int[][]',
    tree: 'TreeNode', list: 'ListNode',
  },
  CPP: {
    int: 'int', double: 'double', bool: 'bool', string: 'string',
    'int[]': 'vector<int>', 'string[]': 'vector<string>', 'int[][]': 'vector<vector<int>>',
    tree: 'TreeNode*', list: 'ListNode*',
  },
  GO: {
    int: 'int', double: 'float64', bool: 'bool', string: 'string',
    'int[]': '[]int', 'string[]': '[]string', 'int[][]': '[][]int',
    tree: '*TreeNode', list: '*ListNode',
  },
};

const argName = (i: number): string => ['a', 'b', 'c', 'd', 'e'][i] ?? `p${i}`;

// --- free-function drivers --------------------------------------------------

function functionDriver(sig: FunctionSignature, lang: Lang): string {
  const names = sig.params.map((_, i) => `__a${i}`);
  const ret = sig.returns as Concrete;
  const call = `solve(${names.join(', ')})`;
  const read = (i: number) => parser(lang, sig.params[i] as Concrete);

  switch (lang) {
    case 'JAVASCRIPT':
    case 'TYPESCRIPT': {
      const decls = names.map((n, i) => `const ${n} = ${read(i)}(__LINES[${i}]);`).join('\n');
      return `{{SOLUTION}}
${JS_HELPERS}
${decls}
console.log(${FORMATTER[ret]}(${call}));`;
    }
    case 'PYTHON': {
      const decls = names.map((n, i) => `${n} = ${read(i)}(__LINES[${i}])`).join('\n');
      return `${PY_HELPERS}
{{SOLUTION}}
${decls}
print(${FORMATTER[ret]}(${call}))`;
    }
    case 'JAVA': {
      const decls = names
        .map((n, i) => `        ${TYPE_NAMES.JAVA[sig.params[i] as Concrete]} ${n} = ${read(i)}(__LINES.get(${i}));`)
        .join('\n');
      // `public class Main` must come FIRST. The judge runs Java in single-file
      // source mode (`java /work/Main.java`), which executes the first class in
      // the file — with the node types on top it looks for `main` in TreeNode
      // and refuses to run. The helper classes go underneath.
      return `import java.util.*;

public class Main {
{{SOLUTION}}
${JAVA_HELPERS}
    public static void main(String[] args) throws Exception {
        __readAll();
${decls}
        System.out.println(${FORMATTER[ret]}(${call}));
    }
}
${JAVA_NODES}`;
    }
    case 'CPP': {
      const decls = names
        .map((n, i) => `    ${TYPE_NAMES.CPP[sig.params[i] as Concrete]} ${n} = ${read(i)}(__LINES[${i}]);`)
        .join('\n');
      return `${CPP_HELPERS}
{{SOLUTION}}

int main() {
    __readAll();
${decls}
    cout << ${FORMATTER[ret]}(${call}) << endl;
    return 0;
}`;
    }
    case 'GO': {
      const decls = names.map((n, i) => `\t${n} := ${read(i)}(__LINES[${i}])`).join('\n');
      return `${GO_HELPERS}
{{SOLUTION}}

func main() {
\t__readAll()
\t_ = __LINES
${decls}
\tfmt.Println(${FORMATTER[ret]}(${call}))
}`;
    }
  }
}

// --- operation-log drivers --------------------------------------------------
//
// Wire format, deliberately not JSON:
//
//   line 1        N, the number of operations
//   lines 2..N+1  "<opName> <arg> <arg>..."  — array args comma-separated,
//                                              an empty array is an absent token
//   stdout        N lines, one result per operation, "null" for the
//                 constructor and for any void method
//
// The canonical shape is ["LRUCache","put","get"] with [[2],[1,1],[1]]; this is
// that, transposed onto lines so C++ and Go can read it without a JSON parser.
// The first operation is always the constructor and is named for the class.

/** Token `i` of the current operation line, in each language's syntax. */
function tokenExpr(lang: Lang, i: number): string {
  switch (lang) {
    case 'JAVASCRIPT':
    case 'TYPESCRIPT':
      return `(__tok[${i}] || '')`;
    case 'PYTHON':
      return `(__tok[${i}] if len(__tok) > ${i} else '')`;
    case 'JAVA':
      return `__tokAt(__tok, ${i})`;
    case 'CPP':
      return `__tokAt(__tok, ${i})`;
    case 'GO':
      return `__tokAt(__tok, ${i})`;
  }
}

/** Arguments for one operation, read from tokens 1..n of its line. */
function opArgs(lang: Lang, params: readonly ValueType[]): string[] {
  return params.map((t, i) => `${parser(lang, t as Concrete)}(${tokenExpr(lang, i + 1)})`);
}

function classDriver(sig: ClassSignature, lang: Lang): string {
  const ctorArgs = opArgs(lang, sig.ctorParams).join(', ');
  const goName = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

  switch (lang) {
    case 'JAVASCRIPT':
    case 'TYPESCRIPT': {
      const branches = sig.methods
        .map((m: OpMethod) => {
          const call = `__obj.${m.name}(${opArgs(lang, m.params).join(', ')})`;
          return m.returns === 'void'
            ? `  } else if (__op === '${m.name}') {\n    ${call};\n    __out.push('null');`
            : `  } else if (__op === '${m.name}') {\n    __out.push(${FORMATTER[m.returns as Concrete]}(${call}));`;
        })
        .join('\n');
      return `{{SOLUTION}}
${JS_HELPERS}
const __n = __int(__LINES[0]);
const __out = [];
let __obj = null;
for (let __i = 1; __i <= __n; __i++) {
  const __tok = String(__LINES[__i]).trim().split(/\\s+/);
  const __op = __tok[0];
  if (__op === '${sig.className}') {
    __obj = new ${sig.className}(${ctorArgs});
    __out.push('null');
${branches}
  } else {
    __out.push('null');
  }
}
console.log(__out.join('\\n'));`;
    }
    case 'PYTHON': {
      const branches = sig.methods
        .map((m: OpMethod) => {
          const call = `__obj.${m.name}(${opArgs(lang, m.params).join(', ')})`;
          return m.returns === 'void'
            ? `    elif __op == '${m.name}':\n        ${call}\n        __out.append('null')`
            : `    elif __op == '${m.name}':\n        __out.append(${FORMATTER[m.returns as Concrete]}(${call}))`;
        })
        .join('\n');
      return `${PY_HELPERS}
{{SOLUTION}}
__n = __int(__LINES[0])
__out = []
__obj = None
for __i in range(1, __n + 1):
    __tok = __LINES[__i].strip().split()
    __op = __tok[0] if __tok else ''
    if __op == '${sig.className}':
        __obj = ${sig.className}(${ctorArgs})
        __out.append('null')
${branches}
    else:
        __out.append('null')
print('\\n'.join(__out))`;
    }
    case 'JAVA': {
      const branches = sig.methods
        .map((m: OpMethod) => {
          const call = `__obj.${m.name}(${opArgs(lang, m.params).join(', ')})`;
          return m.returns === 'void'
            ? `            } else if (__op.equals("${m.name}")) {\n                ${call};\n                __out.add("null");`
            : `            } else if (__op.equals("${m.name}")) {\n                __out.add(${FORMATTER[m.returns as Concrete]}(${call}));`;
        })
        .join('\n');
      // `public class Main` first — see the note on the function driver above.
      return `import java.util.*;

public class Main {
${JAVA_HELPERS}
    public static void main(String[] args) throws Exception {
        __readAll();
        int __n = __int(__LINES.get(0));
        List<String> __out = new ArrayList<>();
        ${sig.className} __obj = null;
        for (int __i = 1; __i <= __n; __i++) {
            String[] __tok = __LINES.get(__i).trim().split("\\\\s+");
            String __op = __tok.length > 0 ? __tok[0] : "";
            if (__op.equals("${sig.className}")) {
                __obj = new ${sig.className}(${ctorArgs});
                __out.add("null");
${branches}
            } else {
                __out.add("null");
            }
        }
        System.out.println(String.join("\\n", __out));
    }
}
${JAVA_NODES}
{{SOLUTION}}`;
    }
    case 'CPP': {
      const branches = sig.methods
        .map((m: OpMethod) => {
          const call = `__obj->${m.name}(${opArgs(lang, m.params).join(', ')})`;
          return m.returns === 'void'
            ? `        } else if (__op == "${m.name}") {\n            ${call};\n            __out.push_back("null");`
            : `        } else if (__op == "${m.name}") {\n            __out.push_back(${FORMATTER[m.returns as Concrete]}(${call}));`;
        })
        .join('\n');
      return `${CPP_HELPERS}
{{SOLUTION}}

int main() {
    __readAll();
    int __n = __int(__LINES[0]);
    vector<string> __out;
    ${sig.className} *__obj = nullptr;
    for (int __i = 1; __i <= __n; __i++) {
        vector<string> __tok = __split(__LINES[__i], ' ');
        string __op = __tok.empty() ? "" : __tok[0];
        if (__op == "${sig.className}") {
            __obj = new ${sig.className}(${ctorArgs});
            __out.push_back("null");
${branches}
        } else {
            __out.push_back("null");
        }
    }
    for (size_t __i = 0; __i < __out.size(); __i++) {
        if (__i) cout << "\\n";
        cout << __out[__i];
    }
    cout << endl;
    return 0;
}`;
    }
    case 'GO': {
      const branches = sig.methods
        .map((m: OpMethod) => {
          const call = `__obj.${goName(m.name)}(${opArgs(lang, m.params).join(', ')})`;
          return m.returns === 'void'
            ? `\t\t} else if __op == "${m.name}" {\n\t\t\t${call}\n\t\t\t__out = append(__out, "null")`
            : `\t\t} else if __op == "${m.name}" {\n\t\t\t__out = append(__out, ${FORMATTER[m.returns as Concrete]}(${call}))`;
        })
        .join('\n');
      return `${GO_HELPERS}
{{SOLUTION}}

func main() {
\t__readAll()
\t__n := __int(__LINES[0])
\tvar __out []string
\tvar __obj ${sig.className}
\tfor __i := 1; __i <= __n; __i++ {
\t\t__tok := strings.Fields(strings.TrimSpace(__LINES[__i]))
\t\t__op := __tokAt(__tok, 0)
\t\tif __op == "${sig.className}" {
\t\t\t__obj = Constructor(${ctorArgs})
\t\t\t__out = append(__out, "null")
${branches}
\t\t} else {
\t\t\t__out = append(__out, "null")
\t\t}
\t}
\t_ = __obj
\tfmt.Println(strings.Join(__out, "\\n"))
}`;
    }
  }
}

// --- starter stubs ----------------------------------------------------------

function functionStub(sig: FunctionSignature, lang: Lang): string {
  const t = TYPE_NAMES[lang];
  const ret = sig.returns as Concrete;
  const args = (fmt: (name: string, type: string) => string) =>
    sig.params.map((p, i) => fmt(argName(i), t[p as Concrete])).join(', ');

  switch (lang) {
    case 'JAVASCRIPT':
      return `function solve(${sig.params.map((_, i) => argName(i)).join(', ')}) {\n  // your code here\n}`;
    case 'TYPESCRIPT':
      return `function solve(${args((n, ty) => `${n}: ${ty}`)}): ${t[ret]} {\n  // your code here\n}`;
    case 'PYTHON':
      return `def solve(${args((n, ty) => `${n}: ${ty}`)}) -> ${t[ret]}:\n    # your code here\n    pass`;
    case 'JAVA':
      return `    static ${t[ret]} solve(${args((n, ty) => `${ty} ${n}`)}) {\n        // your code here\n    }`;
    case 'CPP':
      return `${t[ret]} solve(${args((n, ty) => `${ty} ${n}`)}) {\n    // your code here\n}`;
    case 'GO':
      return `func solve(${args((n, ty) => `${n} ${ty}`)}) ${t[ret]} {\n\t// your code here\n}`;
  }
}

/**
 * Tier 0.5 needs a *class* stub, not a function stub.
 *
 * A beginner told to "implement an LRU cache" and handed an empty editor will
 * spend their lock guessing at the method names the judge wants. The stub is
 * the contract: every method, right arity, body that compiles.
 */
function classStub(sig: ClassSignature, lang: Lang): string {
  const t = TYPE_NAMES[lang];
  const ctor = sig.ctorParams.map((p, i) => ({ n: argName(i), ty: t[p as Concrete] }));
  const ps = (m: OpMethod) => m.params.map((p, i) => ({ n: argName(i), ty: t[p as Concrete] }));
  const ret = (m: OpMethod) => (m.returns === 'void' ? null : t[m.returns as Concrete]);

  switch (lang) {
    case 'JAVASCRIPT':
      return `class ${sig.className} {
  constructor(${ctor.map((c) => c.n).join(', ')}) {
    // your code here
  }
${sig.methods.map((m) => `\n  ${m.name}(${ps(m).map((p) => p.n).join(', ')}) {\n    // your code here\n  }`).join('')}
}`;
    case 'TYPESCRIPT':
      return `class ${sig.className} {
  constructor(${ctor.map((c) => `${c.n}: ${c.ty}`).join(', ')}) {
    // your code here
  }
${sig.methods
  .map(
    (m) =>
      `\n  ${m.name}(${ps(m).map((p) => `${p.n}: ${p.ty}`).join(', ')}): ${ret(m) ?? 'void'} {\n    // your code here\n  }`,
  )
  .join('')}
}`;
    case 'PYTHON':
      return `class ${sig.className}:
    def __init__(self${ctor.map((c) => `, ${c.n}: ${c.ty}`).join('')}):
        # your code here
        pass
${sig.methods
  .map(
    (m) =>
      `\n    def ${m.name}(self${ps(m).map((p) => `, ${p.n}: ${p.ty}`).join('')})${
        ret(m) ? ` -> ${ret(m)}` : ''
      }:\n        # your code here\n        pass`,
  )
  .join('')}`;
    case 'JAVA':
      return `class ${sig.className} {
    ${sig.className}(${ctor.map((c) => `${c.ty} ${c.n}`).join(', ')}) {
        // your code here
    }
${sig.methods
  .map(
    (m) =>
      `\n    ${ret(m) ?? 'void'} ${m.name}(${ps(m).map((p) => `${p.ty} ${p.n}`).join(', ')}) {\n        // your code here\n    }`,
  )
  .join('')}
}`;
    case 'CPP':
      return `class ${sig.className} {
public:
    ${sig.className}(${ctor.map((c) => `${c.ty} ${c.n}`).join(', ')}) {
        // your code here
    }
${sig.methods
  .map(
    (m) =>
      `\n    ${ret(m) ?? 'void'} ${m.name}(${ps(m).map((p) => `${p.ty} ${p.n}`).join(', ')}) {\n        // your code here\n    }`,
  )
  .join('')}
};`;
    case 'GO': {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      return `type ${sig.className} struct {
\t// your fields here
}

func Constructor(${ctor.map((c) => `${c.n} ${c.ty}`).join(', ')}) ${sig.className} {
\t// your code here
\treturn ${sig.className}{}
}
${sig.methods
  .map(
    (m) =>
      `\nfunc (this *${sig.className}) ${cap(m.name)}(${ps(m).map((p) => `${p.n} ${p.ty}`).join(', ')})${
        ret(m) ? ` ${ret(m)}` : ''
      } {\n\t// your code here\n${ret(m) ? `\treturn ${ZERO[m.returns as Concrete]}\n` : ''}}`,
  )
  .join('')}`;
    }
  }
}

/** Go needs a returnable zero value in a stub that must still compile. */
const ZERO: Record<Concrete, string> = {
  int: '0',
  double: '0',
  bool: 'false',
  string: '""',
  'int[]': 'nil',
  'string[]': 'nil',
  'int[][]': 'nil',
  tree: 'nil',
  list: 'nil',
};

// --- public API -------------------------------------------------------------

/** Generate the six drivers for one signature. */
export function buildDrivers(sig: FunctionSignature | ClassSignature): PerLanguage {
  const out = {} as PerLanguage;
  for (const lang of LANGUAGES) {
    out[lang] = sig.kind === 'function' ? functionDriver(sig, lang) : classDriver(sig, lang);
  }
  return out;
}

/** Generate the six starter stubs for one signature. */
export function buildStubs(sig: FunctionSignature | ClassSignature): PerLanguage {
  const out = {} as PerLanguage;
  for (const lang of LANGUAGES) {
    out[lang] = sig.kind === 'function' ? functionStub(sig, lang) : classStub(sig, lang);
  }
  return out;
}
