import { AUTHORED, type ProblemDefinition } from '../problem.js';

/** Tier 0.5 — pointer-built search trees and prefix trees. */
const p = (d: ProblemDefinition): ProblemDefinition => d;

const bst = {
  JAVASCRIPT: `class BST {
  constructor() { this.root = null; }
  insert(x) { const add = n => { if (!n) return { x, left:null, right:null }; if (x < n.x) n.left = add(n.left); else if (x > n.x) n.right = add(n.right); return n; }; this.root = add(this.root); }
  contains(x) { let n=this.root; while(n) { if(n.x===x) return true; n=x<n.x?n.left:n.right; } return false; }
  remove(x) { const cut = n => { if(!n) return null; if(x<n.x) n.left=cut(n.left); else if(x>n.x) n.right=cut(n.right); else { if(!n.left) return n.right; if(!n.right) return n.left; let s=n.right; while(s.left) s=s.left; n.x=s.x; const erase = (q,v) => { if(v<q.x) q.left=erase(q.left,v); else if(v>q.x) q.right=erase(q.right,v); else return q.right; return q; }; n.right=erase(n.right,s.x); } return n; }; this.root=cut(this.root); }
  inorder() { const out=[]; const walk=n=>{if(n){walk(n.left);out.push(n.x);walk(n.right);}}; walk(this.root); return out; }
}`,
  TYPESCRIPT: `class BST {
  private root: Node | null = null;
  insert(x: number): void { const add = (n: Node | null): Node => { if (!n) return new Node(x); if (x < n.x) n.left = add(n.left); else if (x > n.x) n.right = add(n.right); return n; }; this.root = add(this.root); }
  contains(x: number): boolean { let n=this.root; while(n) { if(n.x===x) return true; n=x<n.x?n.left:n.right; } return false; }
  remove(x: number): void { const cut=(n:Node|null):Node|null=>{if(!n)return null;if(x<n.x)n.left=cut(n.left);else if(x>n.x)n.right=cut(n.right);else{if(!n.left)return n.right;if(!n.right)return n.left;let s=n.right;while(s.left)s=s.left;n.x=s.x;const erase=(q:Node,v:number):Node|null=>{if(v<q.x)q.left=erase(q.left,v);else if(v>q.x)q.right=erase(q.right,v);else return q.right;return q;};n.right=erase(n.right,s.x);}return n;};this.root=cut(this.root); }
  inorder(): number[] { const out:number[]=[]; const walk=(n:Node|null):void=>{if(n){walk(n.left);out.push(n.x);walk(n.right);}};walk(this.root);return out; }
}
class Node { x: number; left: Node | null = null; right: Node | null = null; constructor(x: number) { this.x=x; } }`,
  PYTHON: `class Node:
    def __init__(self, x): self.x, self.left, self.right = x, None, None
class BST:
    def __init__(self): self.root = None
    def insert(self, x):
        def add(n):
            if not n: return Node(x)
            if x < n.x: n.left = add(n.left)
            elif x > n.x: n.right = add(n.right)
            return n
        self.root = add(self.root)
    def contains(self, x):
        n = self.root
        while n:
            if n.x == x: return True
            n = n.left if x < n.x else n.right
        return False
    def remove(self, x):
        def cut(n):
            if not n: return None
            if x < n.x: n.left = cut(n.left)
            elif x > n.x: n.right = cut(n.right)
            else:
                if not n.left: return n.right
                if not n.right: return n.left
                s = n.right
                while s.left: s = s.left
                n.x = s.x
                n.right = erase(n.right, s.x)
            return n
        def erase(n, v):
            if v < n.x: n.left = erase(n.left, v)
            elif v > n.x: n.right = erase(n.right, v)
            else: return n.right
            return n
        self.root = cut(self.root)
    def inorder(self):
        out = []
        def walk(n):
            if n: walk(n.left); out.append(n.x); walk(n.right)
        walk(self.root); return out`,
  JAVA: `class BST {
    static class Node { int x; Node left, right; Node(int x) { this.x=x; } }
    private Node root;
    public void insert(int x) { root=add(root,x); }
    private Node add(Node n,int x) { if(n==null)return new Node(x); if(x<n.x)n.left=add(n.left,x); else if(x>n.x)n.right=add(n.right,x); return n; }
    public boolean contains(int x) { Node n=root; while(n!=null){if(n.x==x)return true;n=x<n.x?n.left:n.right;}return false; }
    public void remove(int x) { root=cut(root,x); }
    private Node cut(Node n,int x) { if(n==null)return null; if(x<n.x)n.left=cut(n.left,x); else if(x>n.x)n.right=cut(n.right,x); else { if(n.left==null)return n.right; if(n.right==null)return n.left; Node s=n.right; while(s.left!=null)s=s.left; n.x=s.x; n.right=cut(n.right,s.x); } return n; }
    public int[] inorder() { ArrayList<Integer> a=new ArrayList<>(); walk(root,a); int[] out=new int[a.size()]; for(int i=0;i<out.length;i++)out[i]=a.get(i); return out; }
    private void walk(Node n,ArrayList<Integer> a){if(n!=null){walk(n.left,a);a.add(n.x);walk(n.right,a);}}
}`,
  CPP: `class BST {
    struct Node { int x; Node *left,*right; Node(int v):x(v),left(nullptr),right(nullptr){} }; Node* root=nullptr;
    Node* add(Node* n,int x){if(!n)return new Node(x);if(x<n->x)n->left=add(n->left,x);else if(x>n->x)n->right=add(n->right,x);return n;}
    Node* cut(Node* n,int x){if(!n)return nullptr;if(x<n->x)n->left=cut(n->left,x);else if(x>n->x)n->right=cut(n->right,x);else{if(!n->left)return n->right;if(!n->right)return n->left;Node* s=n->right;while(s->left)s=s->left;n->x=s->x;n->right=cut(n->right,s->x);}return n;}
    void walk(Node* n,vector<int>& a){if(n){walk(n->left,a);a.push_back(n->x);walk(n->right,a);}}
  public:
    void insert(int x){root=add(root,x);} bool contains(int x){Node* n=root;while(n){if(n->x==x)return true;n=x<n->x?n->left:n->right;}return false;} void remove(int x){root=cut(root,x);} vector<int> inorder(){vector<int>a;walk(root,a);return a;}
};`,
  GO: `type bstNode struct { x int; left, right *bstNode }
type BST struct { root *bstNode }
func Constructor() BST { return BST{} }
func (b *BST) Insert(x int) { var add func(*bstNode) *bstNode; add = func(n *bstNode) *bstNode { if n == nil { return &bstNode{x:x} }; if x < n.x { n.left=add(n.left) } else if x > n.x { n.right=add(n.right) }; return n }; b.root=add(b.root) }
func (b *BST) Contains(x int) bool { for n:=b.root; n!=nil; { if n.x==x{return true}; if x<n.x {n=n.left} else {n=n.right} }; return false }
func (b *BST) Remove(x int) { var cut func(*bstNode) *bstNode; cut = func(n *bstNode) *bstNode { if n==nil{return nil}; if x<n.x {n.left=cut(n.left)} else if x>n.x {n.right=cut(n.right)} else {if n.left==nil{return n.right};if n.right==nil{return n.left};s:=n.right;for s.left!=nil{s=s.left};n.x=s.x;var erase func(*bstNode,int)*bstNode;erase=func(q *bstNode,v int)*bstNode{if v<q.x{q.left=erase(q.left,v)}else if v>q.x{q.right=erase(q.right,v)}else{return q.right};return q};n.right=erase(n.right,s.x)};return n }; b.root=cut(b.root) }
func (b *BST) Inorder() []int { out:=[]int{}; var walk func(*bstNode); walk=func(n *bstNode){if n!=nil{walk(n.left);out=append(out,n.x);walk(n.right)}};walk(b.root);return out }`,
};

const trie = {
  JAVASCRIPT: `class Trie { constructor(){this.root={next:new Array(26),word:false};} insert(word){let n=this.root;for(const c of word){const i=c.charCodeAt(0)-97;if(!n.next[i])n.next[i]={next:new Array(26),word:false};n=n.next[i];}n.word=true;} node(s){let n=this.root;for(const c of s){n=n.next[c.charCodeAt(0)-97];if(!n)return null;}return n;} search(word){const n=this.node(word);return !!n&&n.word;} startsWith(prefix){return this.node(prefix)!==null;} }`,
  TYPESCRIPT: `class Trie { private root: TrieNode = new TrieNode(); insert(word: string): void { let n=this.root;for(let k=0;k<word.length;k++){const i=word.charCodeAt(k)-97;if(!n.next[i])n.next[i]=new TrieNode();n=n.next[i]!;}n.word=true; } private node(s:string):TrieNode|null{let n:TrieNode|null=this.root;for(let k=0;k<s.length;k++){n=n.next[s.charCodeAt(k)-97];if(!n)return null;}return n;} search(word:string):boolean{const n=this.node(word);return n!==null&&n.word;} startsWith(prefix:string):boolean{return this.node(prefix)!==null;} }
class TrieNode { next: Array<TrieNode | undefined> = new Array(26); word=false; }`,
  PYTHON: `class TrieNode:
    def __init__(self): self.next, self.word = [None] * 26, False
class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, word):
        n = self.root
        for c in word:
            i = ord(c) - ord('a')
            if not n.next[i]: n.next[i] = TrieNode()
            n = n.next[i]
        n.word = True
    def _node(self, s):
        n = self.root
        for c in s:
            n = n.next[ord(c) - ord('a')]
            if not n: return None
        return n
    def search(self, word):
        n = self._node(word); return bool(n and n.word)
    def startsWith(self, prefix): return self._node(prefix) is not None`,
  JAVA: `class Trie { static class Node { Node[] next=new Node[26]; boolean word; } private Node root=new Node(); public void insert(String word){Node n=root;for(int k=0;k<word.length();k++){int i=word.charAt(k)-'a';if(n.next[i]==null)n.next[i]=new Node();n=n.next[i];}n.word=true;} private Node node(String s){Node n=root;for(int k=0;k<s.length();k++){n=n.next[s.charAt(k)-'a'];if(n==null)return null;}return n;} public boolean search(String word){Node n=node(word);return n!=null&&n.word;} public boolean startsWith(String prefix){return node(prefix)!=null;} }`,
  CPP: `class Trie { struct Node { Node* next[26]{}; bool word=false; }; Node* root=new Node(); Node* node(string s){Node* n=root;for(char c:s){n=n->next[c-'a'];if(!n)return nullptr;}return n;} public: void insert(string word){Node* n=root;for(char c:word){int i=c-'a';if(!n->next[i])n->next[i]=new Node();n=n->next[i];}n->word=true;} bool search(string word){Node* n=node(word);return n&&n->word;} bool startsWith(string prefix){return node(prefix)!=nullptr;} };`,
  GO: `type trieNode struct { next [26]*trieNode; word bool }
type Trie struct { root *trieNode }
func Constructor() Trie { return Trie{root:&trieNode{}} }
func (t *Trie) Insert(word string) { n:=t.root;for _,c:=range word{i:=int(c-'a');if n.next[i]==nil{n.next[i]=&trieNode{}};n=n.next[i]};n.word=true }
func (t *Trie) node(s string) *trieNode { n:=t.root;for _,c:=range s{n=n.next[int(c-'a')];if n==nil{return nil}};return n }
func (t *Trie) Search(word string) bool { n:=t.node(word);return n!=nil&&n.word }
func (t *Trie) StartsWith(prefix string) bool { return t.node(prefix)!=nil }`,
};

const prompt = (name: string, text: string) => [
  `Build a ${name} yourself with nodes and pointers; do not wrap a built-in set or map.`, '', text, '',
  '**Operation log**', '', 'The first operation is the constructor (`BST` or `Trie`). Print `null` for it and for every void method. Every other operation prints its return value. `inorder` prints its integer array space-separated, including a blank line for an empty tree.',
].join('\n');

const editorial = (heading: string, body: string, mistake: string, complexity: string) => [
  `## ${heading}`, '', body, '', `The quiet mistake is ${mistake}`, '', complexity,
].join('\n');

export const TIER_05_TREES_PROBLEMS: ProblemDefinition[] = [
  p({ slug:'bst-insert-contains-basics', title:'BST Insert and Contains', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','insertion','search'], signatureId:'cls:bst', avgSolveSeconds:420,
    promptMarkdown:prompt('binary search tree', 'Implement `insert(x)` and `contains(x)`. Values smaller than a node go left and larger values go right. `contains` is false for an empty tree and for a missing value. **Example:** insert 8, 3, 10; contains 3 prints true and contains 4 prints false.'),
    editorialMarkdown:editorial('BST descent', 'The binary-search-tree pattern stores one ordering decision at every node. That is why a lookup need only follow one child at each level rather than scan every stored number. Insert follows the identical descent until it finds a missing child pointer, where it creates a node.', 'forgetting to stop after an equal value, which creates duplicate nodes and makes the duplicate policy accidental. This batch ignores duplicate inserts.', 'Each insert and contains call takes O(h) time where h is tree height; stored nodes use O(n) space.'), referenceSolution:bst,
    tests:[{stdin:'6\nBST\ninsert 8\ninsert 3\ncontains 3\ncontains 4\ninorder',expectedStdout:'null\nnull\nnull\ntrue\nfalse\n3 8',isSample:true},{stdin:'3\nBST\ncontains 1\ninorder',expectedStdout:'null\nfalse\n',isSample:true},{stdin:'7\nBST\ninsert -2\ninsert 5\ninsert 0\ncontains -2\ncontains 9\ninorder',expectedStdout:'null\nnull\nnull\nnull\ntrue\nfalse\n-2 0 5'},{stdin:'5\nBST\ninsert 1\nremove 1\ncontains 1\ninorder',expectedStdout:'null\nnull\nnull\nfalse\n'}], provenance:AUTHORED }),
  p({ slug:'bst-inorder-sorted-output', title:'BST Inorder Sorted Output', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','inorder','traversal'], signatureId:'cls:bst', avgSolveSeconds:460,
    promptMarkdown:prompt('binary search tree', 'After arbitrary inserts, make `inorder()` return all stored integers in ascending order. Traverse left subtree, node, then right subtree. An empty BST returns an empty array, printed as a blank line. **Example:** inserting 5, 2, 7, 1 makes inorder print `1 2 5 7`.'),
    editorialMarkdown:editorial('Inorder traversal', 'The inorder traversal pattern works because every left subtree contains only smaller values and every right subtree only larger values. Visiting left, then the node, then right therefore emits a sorted sequence without calling a sorting library. A recursive helper naturally carries the node pointers.', 'visiting the node before its left child, which still returns every value but quietly changes the traversal into preorder and loses sorted output.', 'inorder visits each node once: O(n) time and O(h) call-stack space, with O(n) output space. Insert is O(h).'), referenceSolution:bst,
    tests:[{stdin:'7\nBST\ninsert 5\ninsert 2\ninsert 7\ninsert 1\ninorder\ncontains 6',expectedStdout:'null\nnull\nnull\nnull\nnull\n1 2 5 7\nfalse',isSample:true},{stdin:'2\nBST\ninorder',expectedStdout:'null\n',isSample:true},{stdin:'8\nBST\ninsert 0\ninsert -3\ninsert 4\ninsert -1\ninorder\ncontains -1\ncontains 2',expectedStdout:'null\nnull\nnull\nnull\nnull\n-3 -1 0 4\ntrue\nfalse'},{stdin:'5\nBST\ninsert 9\ninsert 9\ninorder\ncontains 9',expectedStdout:'null\nnull\nnull\n9\ntrue'}], provenance:AUTHORED }),
  p({ slug:'bst-delete-leaf', title:'BST Delete a Leaf', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','deletion','leaf'], signatureId:'cls:bst', avgSolveSeconds:650,
    promptMarkdown:prompt('binary search tree', 'Implement `remove(x)` when the target may be a leaf. Removing a leaf disconnects its parent link; removing a value not present changes nothing. Other operations must continue to work. **Example:** after inserting 5, 3, 7, removing 3 leaves inorder `5 7`.'),
    editorialMarkdown:editorial('Recursive deletion', 'Deletion uses the same ordered descent as search, but the recursive call returns the new root of the subtree it changed. For a leaf that returned root is null, so its parent reconnects the correct child pointer without needing a parent field. A missing target simply returns the untouched subtree.', 'returning null for a missing target after descending into it, which silently cuts off an entire valid subtree instead of making remove a no-op.', 'Search, insert, and remove take O(h) time where h is height. inorder is O(n), and nodes plus traversal output use O(n) space.'), referenceSolution:bst,
    tests:[{stdin:'7\nBST\ninsert 5\ninsert 3\ninsert 7\nremove 3\ninorder\ncontains 3',expectedStdout:'null\nnull\nnull\nnull\nnull\n5 7\nfalse',isSample:true},{stdin:'3\nBST\nremove 4\ninorder',expectedStdout:'null\nnull\n',isSample:true},{stdin:'9\nBST\ninsert 8\ninsert 4\ninsert 12\ninsert 2\nremove 2\ninorder\ncontains 4\ncontains 2',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\n4 8 12\ntrue\nfalse'},{stdin:'6\nBST\ninsert 1\nremove 9\ninorder\ncontains 1\ncontains 9',expectedStdout:'null\nnull\nnull\n1\ntrue\nfalse'}], provenance:AUTHORED }),
  p({ slug:'bst-delete-one-child', title:'BST Delete One Child', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','deletion','pointers'], signatureId:'cls:bst', avgSolveSeconds:720,
    promptMarkdown:prompt('binary search tree', 'Make `remove(x)` handle a node with exactly one child: replace the removed node with that child. A remove for a missing number is a no-op, and removal from an empty tree stays empty. **Example:** insert 8, 3, 1; remove 3; inorder is `1 8`.'),
    editorialMarkdown:editorial('Splice the only child', 'The deletion pattern is local once the search path finds the target. If exactly one child exists, that child already obeys all bounds imposed by the target’s ancestors, so returning it splices the subtree into place safely. Returning values from recursion makes even root deletion use the same rule.', 'always returning the left child, which is invisible for a left-only test but discards the subtree when the only child is on the right.', 'insert, contains, and remove are O(h) time for height h. inorder is O(n) time; the tree needs O(n) nodes and recursion uses O(h) stack space.'), referenceSolution:bst,
    tests:[{stdin:'7\nBST\ninsert 8\ninsert 3\ninsert 1\nremove 3\ninorder\ncontains 1',expectedStdout:'null\nnull\nnull\nnull\nnull\n1 8\ntrue',isSample:true},{stdin:'3\nBST\nremove 2\ninorder',expectedStdout:'null\nnull\n',isSample:true},{stdin:'8\nBST\ninsert 5\ninsert 9\ninsert 12\nremove 9\ninorder\ncontains 12\ncontains 9',expectedStdout:'null\nnull\nnull\nnull\nnull\n5 12\ntrue\nfalse'},{stdin:'6\nBST\ninsert 4\ninsert 2\nremove 4\ninorder\ncontains 2',expectedStdout:'null\nnull\nnull\nnull\n2\ntrue'}], provenance:AUTHORED }),
  p({ slug:'bst-delete-successor', title:'BST Delete with Successor', difficulty:'HARD', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','deletion','inorder-successor'], signatureId:'cls:bst', avgSolveSeconds:1100,
    promptMarkdown:prompt('binary search tree', 'For a node with two children, `remove(x)` must replace its value with its **in-order successor**: the smallest value in its right subtree, then remove that successor node. This replacement rule is required. **Example:** insert 5, 3, 8, 6, 9; remove 5; inorder becomes `3 6 8 9`.'),
    editorialMarkdown:editorial('Successor replacement', 'For a two-child deletion, the inorder successor is the leftmost node of the right subtree. It is the smallest value still greater than the target, so copying it into the target preserves the BST ordering. The successor cannot have a left child, making its follow-up deletion one of the simpler zero-or-one-child cases.', 'choosing an arbitrary right-subtree value, which can look sorted in a shallow example but violates an ancestor bound when that value has smaller descendants.', 'Finding and deleting the successor remains O(h) time, as do insert and contains. inorder is O(n); node storage is O(n) and recursion uses O(h) stack space.'), referenceSolution:bst,
    tests:[{stdin:'9\nBST\ninsert 5\ninsert 3\ninsert 8\ninsert 6\ninsert 9\nremove 5\ninorder\ncontains 5',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\nnull\n3 6 8 9\nfalse',isSample:true},{stdin:'3\nBST\nremove 4\ninorder',expectedStdout:'null\nnull\n',isSample:true},{stdin:'11\nBST\ninsert 10\ninsert 5\ninsert 15\ninsert 12\ninsert 18\ninsert 11\nremove 10\ninorder\ncontains 11\ncontains 10',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n5 11 12 15 18\ntrue\nfalse'},{stdin:'8\nBST\ninsert 2\ninsert 1\ninsert 3\nremove 2\ninorder\ncontains 3\ncontains 2',expectedStdout:'null\nnull\nnull\nnull\nnull\n1 3\ntrue\nfalse'}], provenance:AUTHORED }),
  p({ slug:'bst-ignore-duplicate-inserts', title:'BST Ignore Duplicate Inserts', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','duplicates','invariant'], signatureId:'cls:bst', avgSolveSeconds:600,
    promptMarkdown:prompt('binary search tree', 'Use this explicit duplicate policy: if `insert(x)` is called for an existing value, do nothing. The tree is a set of integers, not a multiset. `contains` still returns true and `inorder` lists the value once. **Example:** insert 4 twice, then inorder prints `4`.'),
    editorialMarkdown:editorial('Strict ordering invariant', 'A BST is easiest to reason about when every left value is strictly smaller and every right value strictly larger. The insertion descent detects equality and stops, making repeated operation logs idempotent. This makes inorder a sorted set representation and keeps deletion’s comparison decisions unambiguous.', 'sending equals consistently to one side, which seems reasonable yet changes the stated set semantics and can make a long duplicate workload artificially tall.', 'Each operation descends O(h) nodes, where h is tree height; inorder is O(n). The tree stores O(n) distinct nodes and traversal recursion costs O(h) stack space.'), referenceSolution:bst,
    tests:[{stdin:'7\nBST\ninsert 4\ninsert 4\ninsert 2\ninorder\ncontains 4\ncontains 9',expectedStdout:'null\nnull\nnull\nnull\n2 4\ntrue\nfalse',isSample:true},{stdin:'4\nBST\ninsert 1\ninsert 1\ninorder',expectedStdout:'null\nnull\nnull\n1',isSample:true},{stdin:'8\nBST\ninsert 3\ninsert 3\ninsert 3\nremove 3\ninorder\ncontains 3\ncontains 0',expectedStdout:'null\nnull\nnull\nnull\nnull\n\nfalse\nfalse'},{stdin:'4\nBST\ncontains 2\nremove 2\ninorder',expectedStdout:'null\nfalse\nnull\n'}], provenance:AUTHORED }),
  p({ slug:'bst-repeated-descent', title:'BST Repeated Descent', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','height','depth'], signatureId:'cls:bst', avgSolveSeconds:780,
    promptMarkdown:prompt('binary search tree', 'Build the BST with ordinary repeated `insert`, `contains`, and `remove` operations, including a deliberately increasing insertion order that creates a deep one-sided tree. There is no height method: the lesson is that each operation follows a root-to-leaf path whose length is the current depth. Missing values return false; empty inorder is blank.'),
    editorialMarkdown:editorial('Height-sensitive descent', 'The BST search pattern is a repeated comparison that chooses one pointer at each node. Its cost is governed by height, not merely by how many values exist: increasing inserts form a chain, while a balanced insertion order has shorter paths. The same descent supports insertion, lookup, and locating a deletion target.', 'assuming a BST is automatically balanced, which quietly turns an intended logarithmic-looking workload into O(n) paths on ordered input.', 'Each insert, contains, and remove is O(h), which is O(n) in a skewed tree; inorder is O(n). Nodes use O(n) space and recursion uses O(h) stack space.'), referenceSolution:bst,
    tests:[{stdin:'10\nBST\ninsert 1\ninsert 2\ninsert 3\ninsert 4\ncontains 4\ncontains 0\nremove 3\ninorder\ncontains 3',expectedStdout:'null\nnull\nnull\nnull\nnull\ntrue\nfalse\nnull\n1 2 4\nfalse',isSample:true},{stdin:'3\nBST\ncontains 1\ninorder',expectedStdout:'null\nfalse\n',isSample:true},{stdin:'11\nBST\ninsert 8\ninsert 4\ninsert 12\ninsert 2\ninsert 6\ncontains 6\nremove 4\ninorder\ncontains 4\ncontains 2',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\ntrue\nnull\n2 6 8 12\nfalse\ntrue'},{stdin:'6\nBST\ninsert -1\ninsert 0\nremove -1\ninorder\ncontains -1',expectedStdout:'null\nnull\nnull\nnull\n0\nfalse'}], provenance:AUTHORED }),
  p({ slug:'bst-mixed-workload', title:'BST Mixed Workload', difficulty:'HARD', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['binary-search-tree','mixed-operations','invariant'], signatureId:'cls:bst', avgSolveSeconds:1050,
    promptMarkdown:prompt('binary search tree', 'Handle a mixed operation log of inserts, removes, membership checks, and inorder snapshots. Keep the strict BST invariant after every operation, ignore duplicate inserts, and make missing removals no-ops. **Example:** insert 6, 2, 9; remove 2; insert 4; inorder prints `4 6 9`.'),
    editorialMarkdown:editorial('Maintain one invariant', 'A mixed workload tests whether every method protects the same ordered-node invariant. Insert and contains descend by comparisons, remove reconnects subtree roots, and inorder observes the result in sorted order. Treating inorder as an invariant check is useful: after every mutation it should still be strictly ascending with no duplicates.', 'implementing deletion as a special side path that does not reconnect the returned subtree root, which often passes when the target is a leaf but loses mutations below the root.', 'Every individual insert, contains, or remove is O(h); each inorder snapshot is O(n). The pointer tree occupies O(n) space and recursive operations use O(h) stack space.'), referenceSolution:bst,
    tests:[{stdin:'11\nBST\ninsert 6\ninsert 2\ninsert 9\nremove 2\ninsert 4\ninorder\ncontains 2\ncontains 4\nremove 6\ninorder',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\n4 6 9\nfalse\ntrue\nnull\n4 9',isSample:true},{stdin:'4\nBST\ninorder\nremove 1\ncontains 1',expectedStdout:'null\n\nnull\nfalse',isSample:true},{stdin:'13\nBST\ninsert 10\ninsert 5\ninsert 15\ninsert 12\nremove 10\ninsert 5\nremove 99\ninorder\ncontains 10\ncontains 12\nremove 12\ninorder',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n5 12 15\nfalse\ntrue\nnull\n5 15'},{stdin:'7\nBST\ninsert 3\ninsert 1\nremove 3\ninorder\ncontains 1\ncontains 3',expectedStdout:'null\nnull\nnull\nnull\n1\ntrue\nfalse'}], provenance:AUTHORED }),
  p({ slug:'trie-insert-search-basics', title:'Trie Insert and Search', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['trie','prefix-tree','search'], signatureId:'cls:trie', avgSolveSeconds:430,
    promptMarkdown:prompt('trie (prefix tree)', 'Implement `insert(word)` and `search(word)` for lower-case words with no spaces. Each character chooses a child pointer; only the final node is marked as a complete word. Search in an empty trie and search for a missing word return false. **Example:** insert `cat`; search `cat` is true, search `car` is false.'),
    editorialMarkdown:editorial('Character-path trie', 'The trie pattern shares prefixes as node paths, so a word lookup follows one child per character rather than comparing against every stored word. Insertion creates missing character nodes and marks only the terminal node. Search succeeds only when both the path and terminal marker exist.', 'treating a path as a word, which makes search return true for a prefix that was never inserted as a complete key.', 'For a word of length L, insert and search take O(L) time. The trie uses O(total stored characters) nodes; a lookup needs O(1) extra space.'), referenceSolution:trie,
    tests:[{stdin:'5\nTrie\ninsert cat\nsearch cat\nsearch car\nstartsWith ca',expectedStdout:'null\nnull\ntrue\nfalse\ntrue',isSample:true},{stdin:'3\nTrie\nsearch a\nstartsWith a',expectedStdout:'null\nfalse\nfalse',isSample:true},{stdin:'7\nTrie\ninsert dog\ninsert dot\nsearch dog\nsearch do\nsearch dot\nstartsWith z',expectedStdout:'null\nnull\nnull\ntrue\nfalse\ntrue\nfalse'},{stdin:'5\nTrie\ninsert a\nsearch a\nsearch b\nstartsWith a',expectedStdout:'null\nnull\ntrue\nfalse\ntrue'}], provenance:AUTHORED }),
  p({ slug:'trie-prefix-versus-word', title:'Trie Prefix versus Word', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['trie','prefix','terminal-marker'], signatureId:'cls:trie', avgSolveSeconds:470,
    promptMarkdown:prompt('trie (prefix tree)', '`search(word)` asks whether the complete word was inserted. `startsWith(prefix)` asks only whether a path begins with that prefix. Those answers may differ. Words are lower-case and contain no spaces. **Example:** after insert `apple`, search `app` is false but startsWith `app` is true.'),
    editorialMarkdown:editorial('Terminal marker distinction', 'Both trie queries walk exactly the same character path. The pattern differs only at the end: startsWith accepts any reached node, while search requires its word marker. Keeping that marker on the node separates stored keys from merely shared prefixes without duplicating character strings.', 'making search and startsWith call the same boolean return, which is quiet until a test asks for a prefix that has not itself been inserted.', 'For query length L, insert, search, and startsWith are O(L) time. The node graph uses O(total characters) space and each query uses O(1) extra space.'), referenceSolution:trie,
    tests:[{stdin:'6\nTrie\ninsert apple\nsearch app\nstartsWith app\nsearch apple\nstartsWith appl',expectedStdout:'null\nnull\nfalse\ntrue\ntrue\ntrue',isSample:true},{stdin:'3\nTrie\nsearch a\nstartsWith a',expectedStdout:'null\nfalse\nfalse',isSample:true},{stdin:'7\nTrie\ninsert home\nsearch home\nsearch ho\nstartsWith ho\nstartsWith zoo\nsearch zoo',expectedStdout:'null\nnull\ntrue\nfalse\ntrue\nfalse\nfalse'},{stdin:'4\nTrie\ninsert x\nsearch x\nstartsWith y',expectedStdout:'null\nnull\ntrue\nfalse'}], provenance:AUTHORED }),
  p({ slug:'trie-overlapping-prefixes', title:'Trie Overlapping Prefixes', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['trie','shared-prefixes','nodes'], signatureId:'cls:trie', avgSolveSeconds:690,
    promptMarkdown:prompt('trie (prefix tree)', 'Store many words that overlap at their beginning, such as `car`, `cart`, and `care`. They must share their character nodes while preserving each word’s own terminal marker. A path for a not-found suffix is false even when most of its prefix exists. **Example:** after inserting car and cart, startsWith `ca` is true and search `cat` is false.'),
    editorialMarkdown:editorial('Shared-prefix structure', 'A prefix tree earns its name by reusing the nodes for common initial characters. Inserting car, cart, and care reaches the same c-a-r path, then branches only where their suffixes differ. This is why prefix queries stay proportional to query length even when many words have the same beginning.', 'allocating a fresh path for every insertion instead of following existing child pointers, which can still answer some searches but wastes the sharing the data structure is meant to model.', 'For a word length L, each insert or query is O(L). Space is O(total distinct trie nodes), bounded by the total characters after shared prefixes are merged.'), referenceSolution:trie,
    tests:[{stdin:'9\nTrie\ninsert car\ninsert cart\ninsert care\nsearch car\nsearch cat\nstartsWith ca\nstartsWith cart\nsearch care',expectedStdout:'null\nnull\nnull\nnull\ntrue\nfalse\ntrue\ntrue\ntrue',isSample:true},{stdin:'3\nTrie\nsearch car\nstartsWith c',expectedStdout:'null\nfalse\nfalse',isSample:true},{stdin:'8\nTrie\ninsert tea\ninsert team\ninsert ten\nsearch te\nstartsWith te\nsearch team\nsearch test',expectedStdout:'null\nnull\nnull\nnull\nfalse\ntrue\ntrue\nfalse'},{stdin:'5\nTrie\ninsert a\ninsert ab\nsearch abc\nstartsWith abc',expectedStdout:'null\nnull\nnull\nfalse\nfalse'}], provenance:AUTHORED }),
  p({ slug:'trie-strict-prefix-word', title:'Trie Strict Prefix Word', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['trie','prefix','word-marker'], signatureId:'cls:trie', avgSolveSeconds:710,
    promptMarkdown:prompt('trie (prefix tree)', 'Handle a word that is a strict prefix of another word. For example, after inserting `to` and `tone`, search for both is true; if only `tone` was inserted, search `to` is false while startsWith `to` is true. Keep a word-ending marker on every complete word node.'),
    editorialMarkdown:editorial('Independent word endings', 'A terminal marker belongs to each node, not just to leaves. That lets one node represent both a complete word and the beginning of a longer word: the path t-o may end a word while continuing to n-e. The shared node path still makes all three trie operations simple character-by-character walks.', 'marking only leaf nodes as words, which quietly makes a shorter inserted word disappear as soon as a longer word extends its path.', 'Insert, search, and startsWith run in O(L) for L query characters. The trie uses O(total distinct character nodes) space, with O(1) extra query space.'), referenceSolution:trie,
    tests:[{stdin:'8\nTrie\ninsert to\ninsert tone\nsearch to\nsearch tone\nstartsWith to\nsearch ton\nstartsWith ton',expectedStdout:'null\nnull\nnull\ntrue\ntrue\ntrue\nfalse\ntrue',isSample:true},{stdin:'5\nTrie\ninsert tone\nsearch to\nstartsWith to\nsearch tone',expectedStdout:'null\nnull\nfalse\ntrue\ntrue',isSample:true},{stdin:'9\nTrie\ninsert a\ninsert an\ninsert ant\nsearch a\nsearch an\nsearch ant\nsearch ante\nstartsWith ante',expectedStdout:'null\nnull\nnull\nnull\ntrue\ntrue\ntrue\nfalse\nfalse'},{stdin:'3\nTrie\nsearch x\nstartsWith x',expectedStdout:'null\nfalse\nfalse'}], provenance:AUTHORED }),
];
