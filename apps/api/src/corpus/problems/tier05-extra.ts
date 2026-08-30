import { AUTHORED, type ProblemDefinition } from '../problem.js';

/** Tier 0.5 — extra drills on the gateway structures: dynamic array, hash set, stack, queue, deque. */
const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_0_5',
  patternFamily: 'DATA_STRUCTURES',
  provenance: AUTHORED,
} as const;

const dynamicArray = {
  JAVASCRIPT: `class DynamicArray {
  constructor() { this.data = new Array(2); this.length = 0; }
  push(x) { if (this.length === this.data.length) this.grow(); this.data[this.length++] = x; }
  grow() { const next = new Array(this.data.length * 2); for (let i = 0; i < this.length; i++) next[i] = this.data[i]; this.data = next; }
  pop() { return this.length === 0 ? -1 : this.data[--this.length]; }
  get(i) { return i < 0 || i >= this.length ? -1 : this.data[i]; }
  set(i, x) { if (i >= 0 && i < this.length) this.data[i] = x; }
  size() { return this.length; }
}`,
  TYPESCRIPT: `class DynamicArray {
  private data: number[] = new Array(2); private length = 0;
  push(x: number): void { if (this.length === this.data.length) this.grow(); this.data[this.length++] = x; }
  private grow(): void { const next = new Array<number>(this.data.length * 2); for (let i = 0; i < this.length; i++) next[i] = this.data[i]; this.data = next; }
  pop(): number { return this.length === 0 ? -1 : this.data[--this.length]; }
  get(i: number): number { return i < 0 || i >= this.length ? -1 : this.data[i]; }
  set(i: number, x: number): void { if (i >= 0 && i < this.length) this.data[i] = x; }
  size(): number { return this.length; }
}`,
  PYTHON: `class DynamicArray:
    def __init__(self):
        self.data = [0, 0]
        self.length = 0
    def push(self, x):
        if self.length == len(self.data): self._grow()
        self.data[self.length] = x
        self.length += 1
    def _grow(self):
        next_data = [0] * (len(self.data) * 2)
        for i in range(self.length): next_data[i] = self.data[i]
        self.data = next_data
    def pop(self):
        if self.length == 0: return -1
        self.length -= 1
        return self.data[self.length]
    def get(self, i):
        return -1 if i < 0 or i >= self.length else self.data[i]
    def set(self, i, x):
        if 0 <= i < self.length: self.data[i] = x
    def size(self): return self.length`,
  JAVA: `class DynamicArray {
    private int[] data = new int[2]; private int length = 0;
    public void push(int x) { if (length == data.length) grow(); data[length++] = x; }
    private void grow() { int[] next = new int[data.length * 2]; for (int i = 0; i < length; i++) next[i] = data[i]; data = next; }
    public int pop() { return length == 0 ? -1 : data[--length]; }
    public int get(int i) { return i < 0 || i >= length ? -1 : data[i]; }
    public void set(int i, int x) { if (i >= 0 && i < length) data[i] = x; }
    public int size() { return length; }
}`,
  CPP: `class DynamicArray {
    vector<int> data; int length;
    void grow() { vector<int> next(data.size() * 2); for (int i = 0; i < length; i++) next[i] = data[i]; data = next; }
  public:
    DynamicArray() : data(2), length(0) {}
    void push(int x) { if (length == (int)data.size()) grow(); data[length++] = x; }
    int pop() { return length == 0 ? -1 : data[--length]; }
    int get(int i) { return i < 0 || i >= length ? -1 : data[i]; }
    void set(int i, int x) { if (i >= 0 && i < length) data[i] = x; }
    int size() { return length; }
};`,
  GO: `type DynamicArray struct { data []int; length int }
func Constructor() DynamicArray { return DynamicArray{data: make([]int, 2)} }
func (a *DynamicArray) grow() { next := make([]int, len(a.data)*2); copy(next, a.data[:a.length]); a.data = next }
func (a *DynamicArray) Push(x int) { if a.length == len(a.data) { a.grow() }; a.data[a.length] = x; a.length++ }
func (a *DynamicArray) Pop() int { if a.length == 0 { return -1 }; a.length--; return a.data[a.length] }
func (a *DynamicArray) Get(i int) int { if i < 0 || i >= a.length { return -1 }; return a.data[i] }
func (a *DynamicArray) Set(i int, x int) { if i >= 0 && i < a.length { a.data[i] = x } }
func (a *DynamicArray) Size() int { return a.length }`,
};

const hashSet = {
  JAVASCRIPT: `class HashSet {constructor(){this.b=Array.from({length:8},()=>[]);this.n=0;}i(x){return ((x%this.b.length)+this.b.length)%this.b.length;}add(x){const a=this.b[this.i(x)];if(!a.includes(x)){a.push(x);this.n++;}}contains(x){return this.b[this.i(x)].includes(x);}remove(x){const a=this.b[this.i(x)],i=a.indexOf(x);if(i>=0){a.splice(i,1);this.n--;}}size(){return this.n;}}`,
  TYPESCRIPT: `class HashSet {private b:number[][]=Array.from({length:8},()=>[]);private n=0;private i(x:number):number{return ((x%this.b.length)+this.b.length)%this.b.length;}add(x:number):void{const a=this.b[this.i(x)];if(!a.includes(x)){a.push(x);this.n++;}}contains(x:number):boolean{return this.b[this.i(x)].includes(x);}remove(x:number):void{const a=this.b[this.i(x)],i=a.indexOf(x);if(i>=0){a.splice(i,1);this.n--;}}size():number{return this.n;}}`,
  PYTHON: `class HashSet:
    def __init__(self):self.b=[[] for _ in range(8)];self.n=0
    def _i(self,x):return x%len(self.b)
    def add(self,x):
        if not self.contains(x):self.b[self._i(x)].append(x);self.n+=1
    def contains(self,x):return x in self.b[self._i(x)]
    def remove(self,x):
        a=self.b[self._i(x)]
        if x in a:a.remove(x);self.n-=1
    def size(self):return self.n`,
  JAVA: `class HashSet {private ArrayList<Integer>[]b;private int n;@SuppressWarnings("unchecked")HashSet(){b=new ArrayList[8];for(int i=0;i<8;i++)b[i]=new ArrayList<>();}private int i(int x){return Math.floorMod(x,b.length);}public void add(int x){if(!b[i(x)].contains(x)){b[i(x)].add(x);n++;}}public boolean contains(int x){return b[i(x)].contains(x);}public void remove(int x){if(b[i(x)].remove((Integer)x))n--;}public int size(){return n;}}`,
  CPP: `class HashSet {vector<vector<int>>b;int n=0;int i(int x){return (x%(int)b.size()+(int)b.size())%(int)b.size();}public:HashSet():b(8){}void add(int x){if(!contains(x)){b[i(x)].push_back(x);n++;}}bool contains(int x){auto&a=b[i(x)];return find(a.begin(),a.end(),x)!=a.end();}void remove(int x){auto&a=b[i(x)];auto q=find(a.begin(),a.end(),x);if(q!=a.end()){a.erase(q);n--;}}int size(){return n;}};`,
  GO: `type HashSet struct{b [][]int;n int}
func Constructor() HashSet{return HashSet{b:make([][]int,8)}}
func(s *HashSet)i(x int)int{r:=x%len(s.b);if r<0{r+=len(s.b)};return r}
func(s *HashSet)Add(x int){if !s.Contains(x){j:=s.i(x);s.b[j]=append(s.b[j],x);s.n++}}
func(s *HashSet)Contains(x int)bool{for _,v:=range s.b[s.i(x)]{if v==x{return true}};return false}
func(s *HashSet)Remove(x int){j:=s.i(x);for q,v:=range s.b[j]{if v==x{s.b[j]=append(s.b[j][:q],s.b[j][q+1:]...);s.n--;return}}}
func(s *HashSet)Size()int{return s.n}`,
};

const stack = {
  JAVASCRIPT: `class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } pop() { return this.items.length ? this.items.pop() : -1; } peek() { return this.items.length ? this.items[this.items.length - 1] : -1; } isEmpty() { return this.items.length === 0; } size() { return this.items.length; } }`,
  TYPESCRIPT: `class Stack { private items: number[] = []; push(x: number): void { this.items.push(x); } pop(): number { return this.items.length ? this.items.pop()! : -1; } peek(): number { return this.items.length ? this.items[this.items.length - 1] : -1; } isEmpty(): boolean { return this.items.length === 0; } size(): number { return this.items.length; } }`,
  PYTHON: `class Stack:
    def __init__(self): self.items = []
    def push(self, x): self.items.append(x)
    def pop(self): return self.items.pop() if self.items else -1
    def peek(self): return self.items[-1] if self.items else -1
    def isEmpty(self): return not self.items
    def size(self): return len(self.items)`,
  JAVA: `class Stack { private java.util.ArrayList<Integer> items = new java.util.ArrayList<>(); public void push(int x) { items.add(x); } public int pop() { return items.isEmpty() ? -1 : items.remove(items.size()-1); } public int peek() { return items.isEmpty() ? -1 : items.get(items.size()-1); } public boolean isEmpty() { return items.isEmpty(); } public int size() { return items.size(); } }`,
  CPP: `class Stack { vector<int> items; public: void push(int x) { items.push_back(x); } int pop() { if (items.empty()) return -1; int x = items.back(); items.pop_back(); return x; } int peek() { return items.empty() ? -1 : items.back(); } bool isEmpty() { return items.empty(); } int size() { return items.size(); } };`,
  GO: `type Stack struct { items []int }
func Constructor() Stack { return Stack{} }
func (s *Stack) Push(x int) { s.items = append(s.items, x) }
func (s *Stack) Pop() int { if len(s.items)==0 { return -1 }; i:=len(s.items)-1; x:=s.items[i]; s.items=s.items[:i]; return x }
func (s *Stack) Peek() int { if len(s.items)==0 { return -1 }; return s.items[len(s.items)-1] }
func (s *Stack) IsEmpty() bool { return len(s.items)==0 }
func (s *Stack) Size() int { return len(s.items) }`,
};

const queue = {
  JAVASCRIPT: `class Queue { constructor() { this.items = []; this.head = 0; } enqueue(x) { this.items.push(x); } dequeue() { if (this.head >= this.items.length) return -1; const x = this.items[this.head++]; if (this.head > 32 && this.head * 2 > this.items.length) { this.items = this.items.slice(this.head); this.head = 0; } return x; } peek() { return this.head < this.items.length ? this.items[this.head] : -1; } isEmpty() { return this.head >= this.items.length; } size() { return this.items.length - this.head; } }`,
  TYPESCRIPT: `class Queue { private items: number[] = []; private head = 0; enqueue(x: number): void { this.items.push(x); } dequeue(): number { if (this.head >= this.items.length) return -1; const x = this.items[this.head++]; if (this.head > 32 && this.head * 2 > this.items.length) { this.items = this.items.slice(this.head); this.head = 0; } return x; } peek(): number { return this.head < this.items.length ? this.items[this.head] : -1; } isEmpty(): boolean { return this.head >= this.items.length; } size(): number { return this.items.length - this.head; } }`,
  PYTHON: `class Queue:
    def __init__(self): self.items = []; self.head = 0
    def enqueue(self, x): self.items.append(x)
    def dequeue(self):
        if self.head >= len(self.items): return -1
        x = self.items[self.head]; self.head += 1
        if self.head > 32 and self.head * 2 > len(self.items):
            self.items = self.items[self.head:]; self.head = 0
        return x
    def peek(self): return self.items[self.head] if self.head < len(self.items) else -1
    def isEmpty(self): return self.head >= len(self.items)
    def size(self): return len(self.items) - self.head`,
  JAVA: `class Queue { private java.util.ArrayList<Integer> items = new java.util.ArrayList<>(); private int head = 0; public void enqueue(int x) { items.add(x); } public int dequeue() { if (head >= items.size()) return -1; int x = items.get(head++); if (head > 32 && head * 2 > items.size()) { items = new java.util.ArrayList<>(items.subList(head, items.size())); head = 0; } return x; } public int peek() { return head < items.size() ? items.get(head) : -1; } public boolean isEmpty() { return head >= items.size(); } public int size() { return items.size() - head; } }`,
  CPP: `class Queue { vector<int> items; int head = 0; public: void enqueue(int x) { items.push_back(x); } int dequeue() { if (head >= (int)items.size()) return -1; int x = items[head++]; if (head > 32 && head * 2 > (int)items.size()) { items.erase(items.begin(), items.begin() + head); head = 0; } return x; } int peek() { return head < (int)items.size() ? items[head] : -1; } bool isEmpty() { return head >= (int)items.size(); } int size() { return (int)items.size() - head; } };`,
  GO: `type Queue struct { items []int; head int }
func Constructor() Queue { return Queue{} }
func (q *Queue) Enqueue(x int) { q.items = append(q.items, x) }
func (q *Queue) Dequeue() int { if q.head >= len(q.items) { return -1 }; x := q.items[q.head]; q.head++; if q.head > 32 && q.head*2 > len(q.items) { q.items = append([]int{}, q.items[q.head:]...); q.head = 0 }; return x }
func (q *Queue) Peek() int { if q.head >= len(q.items) { return -1 }; return q.items[q.head] }
func (q *Queue) IsEmpty() bool { return q.head >= len(q.items) }
func (q *Queue) Size() int { return len(q.items) - q.head }`,
};

const deque = {
  JAVASCRIPT: `class Deque { constructor(){this.items=[];} pushFront(x){this.items.unshift(x);} pushBack(x){this.items.push(x);} popFront(){return this.items.length?this.items.shift():-1;} popBack(){return this.items.length?this.items.pop():-1;} size(){return this.items.length;} }`,
  TYPESCRIPT: `class Deque { private items:number[]=[]; pushFront(x:number):void{this.items.unshift(x);} pushBack(x:number):void{this.items.push(x);} popFront():number{return this.items.length?this.items.shift()!:-1;} popBack():number{return this.items.length?this.items.pop()!:-1;} size():number{return this.items.length;} }`,
  PYTHON: `class Deque:
    def __init__(self): self.items=[]
    def pushFront(self,x): self.items.insert(0,x)
    def pushBack(self,x): self.items.append(x)
    def popFront(self): return self.items.pop(0) if self.items else -1
    def popBack(self): return self.items.pop() if self.items else -1
    def size(self): return len(self.items)`,
  JAVA: `class Deque { private java.util.ArrayDeque<Integer> items=new java.util.ArrayDeque<>(); public void pushFront(int x){items.addFirst(x);} public void pushBack(int x){items.addLast(x);} public int popFront(){return items.isEmpty()?-1:items.removeFirst();} public int popBack(){return items.isEmpty()?-1:items.removeLast();} public int size(){return items.size();} }`,
  CPP: `class Deque { deque<int> items; public: void pushFront(int x){items.push_front(x);} void pushBack(int x){items.push_back(x);} int popFront(){if(items.empty())return -1;int x=items.front();items.pop_front();return x;} int popBack(){if(items.empty())return -1;int x=items.back();items.pop_back();return x;} int size(){return items.size();} };`,
  GO: `type Deque struct{items []int}
func Constructor() Deque{return Deque{}}
func(d *Deque) PushFront(x int){d.items=append([]int{x},d.items...)}
func(d *Deque) PushBack(x int){d.items=append(d.items,x)}
func(d *Deque) PopFront() int{if len(d.items)==0{return -1};x:=d.items[0];d.items=d.items[1:];return x}
func(d *Deque) PopBack() int{if len(d.items)==0{return -1};i:=len(d.items)-1;x:=d.items[i];d.items=d.items[:i];return x}
func(d *Deque) Size() int{return len(d.items)}`,
};

const prompt = (name: string, text: string, edge: string) => [
  `Implement a ${name} yourself; do not use your language's built-in ${name.toLowerCase()} type.`, '', text, '',
  '**Operation log**', '', 'The first operation is the constructor. Print `null` for it and for every void method. Every other operation prints its return value.', '',
  edge,
].join('\n');

export const TIER_05_EXTRA_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'dynamic-array-insert-at-index',
    title: 'Dynamic Array Insert at Index',
    difficulty: 'MEDIUM',
    patternTags: ['dynamic-array', 'shifting', 'indexing'],
    signatureId: 'cls:dynamic-array',
    avgSolveSeconds: 660,
    promptMarkdown: prompt('growable array',
      'Build `DynamicArray` over a fixed backing buffer: `push(x)` appends, `pop()` removes and returns the last value, `get(i)` reads index `i`, `set(i, x)` overwrites index `i`, and `size()` returns how many values are stored. Grow the buffer by copying when it fills.\n\nThe log inserts a value in the middle the way you would by hand: push a copy of the last element to make room, shift each element one slot right with `set`, then `set` the freed slot to the new value. Your job is to make every primitive behave so that this works.\n\n```\n7\nDynamicArray\npush 1\npush 2\npush 2\nset 1 5\nget 1\nsize\n```\n```\nnull\nnull\nnull\nnull\nnull\n5\n3\n```\n\n**Edge case:** an index outside `0 .. size - 1` (including a negative one) is not part of the array. `get` on it returns `-1` and `set` on it changes nothing.',
      'When an operation cannot return an element (a pop on an empty array, or an out-of-range `get`), return `-1`.'),
    editorialMarkdown: [
      '## Shift right, then overwrite',
      '',
      'Insertion into an array is not an insertion primitive — it is a copy. Making room first (one `push`) and then moving elements from the back toward the front means no live value is ever overwritten before it has been copied. Walking front-to-back instead would smear the first moved value across the whole tail, which is why the direction of the shift is the whole trick.',
      '',
      'The quiet mistake here is letting the buffer capacity stand in for the size. After a grow, the backing buffer has slots past the last live element; they hold stale or default values, not elements. If `get` and `set` bound-check against `data.length` rather than the logical length, an out-of-range read returns a plausible-looking `0` instead of `-1`, and every simple test still passes. Keep the element count as the single source of truth, and check both ends of the range including negatives.',
      '',
      '`get`, `set` and `size` are O(1); `push` is O(1) amortized because doubling spreads each O(n) copy over n pushes. A middle insertion built from these costs O(n) shifts. Space is O(n).',
    ].join('\n'),
    referenceSolution: dynamicArray,
    tests: [
      { stdin: '10\nDynamicArray\npush 1\npush 2\npush 3\npush 3\nset 2 2\nset 1 5\nget 1\nget 3\nsize', expectedStdout: 'null\nnull\nnull\nnull\nnull\nnull\nnull\n5\n3\n4', isSample: true },
      { stdin: '7\nDynamicArray\nset 0 9\nget 0\npush 7\nset 5 1\nget 0\nsize', expectedStdout: 'null\nnull\n-1\nnull\nnull\n7\n1', isSample: true },
      { stdin: '7\nDynamicArray\npush 4\npush 4\nset 0 9\nget 0\nget 1\nsize', expectedStdout: 'null\nnull\nnull\nnull\n9\n4\n2' },
      { stdin: '7\nDynamicArray\npush -1\npush -2\npush -3\nget -1\npop\nsize', expectedStdout: 'null\nnull\nnull\nnull\n-1\n-3\n2' },
      { stdin: '13\nDynamicArray\npush 1\npush 2\npush 3\npush 4\npush 5\npush 5\nset 4 4\nset 3 3\nset 2 99\nget 2\nget 5\nsize', expectedStdout: 'null\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n99\n5\n6' },
    ],
  }),
  p({
    ...base,
    slug: 'dynamic-array-remove-shifts-left',
    title: 'Dynamic Array Remove Shifts Left',
    difficulty: 'MEDIUM',
    patternTags: ['dynamic-array', 'shifting', 'edge-cases'],
    signatureId: 'cls:dynamic-array',
    avgSolveSeconds: 660,
    promptMarkdown: prompt('growable array',
      'Same `DynamicArray` interface: `push`, `pop`, `get`, `set`, `size`. This log deletes a value at a chosen index the way you would by hand: copy each later element one slot left with `set`, then `pop` once to drop the now-duplicated tail. After that the array is one element shorter and the freed slot is no longer part of it.\n\n```\n6\nDynamicArray\npush 1\npush 2\nset 0 2\npop\nget 0\n```\n```\nnull\nnull\nnull\nnull\n2\n2\n```\n\n**Edge case:** `pop` on an empty array returns `-1` and leaves the array empty — it must not go to a negative size or break the next `push`.',
      'When an operation cannot return an element (a pop on an empty array, or an out-of-range `get`), return `-1`.'),
    editorialMarkdown: [
      '## Shift left, then shrink',
      '',
      'Deletion is the mirror of insertion: copy every element after the hole one slot toward the front, front-to-back this time so each value is read before it is overwritten, then drop the last slot. The final `pop` is what actually makes the array shorter; the shifting alone only duplicates the tail.',
      '',
      'The quiet mistake is forgetting that shrink half. Shift without popping and the array still reports its old size with a stale copy sitting at the end — correct-looking for every `get` you happen to try except the last index. The other half of the same mistake is letting `pop` on an empty array decrement the length below zero. That does not fail immediately: the array keeps answering, and the damage only surfaces several operations later when the next `push` writes at index `-1`. Check emptiness first and return the sentinel without touching the length.',
      '',
      'The primitives are O(1) each — `pop` amortized alongside `push` — and a middle deletion built from them costs O(n) shifts. Space is O(n) in the backing buffer.',
    ].join('\n'),
    referenceSolution: dynamicArray,
    tests: [
      { stdin: '11\nDynamicArray\npush 1\npush 2\npush 3\npush 4\nset 1 3\nset 2 4\npop\nget 1\nget 2\nsize', expectedStdout: 'null\nnull\nnull\nnull\nnull\nnull\nnull\n4\n3\n4\n3', isSample: true },
      { stdin: '4\nDynamicArray\npop\nget 0\nsize', expectedStdout: 'null\n-1\n-1\n0', isSample: true },
      { stdin: '6\nDynamicArray\npush 5\npush 6\npop\nget 1\nsize', expectedStdout: 'null\nnull\nnull\n6\n-1\n1' },
      { stdin: '6\nDynamicArray\npush 8\npop\npop\nsize\nget 0', expectedStdout: 'null\nnull\n8\n-1\n0\n-1' },
      { stdin: '10\nDynamicArray\npush 10\npush 20\npush 30\nset 0 20\nset 1 30\npop\nget 0\nget 1\nsize', expectedStdout: 'null\nnull\nnull\nnull\nnull\nnull\n30\n20\n30\n2' },
    ],
  }),
  p({
    ...base,
    slug: 'hash-set-add-is-idempotent',
    title: 'Hash Set Add Is Idempotent',
    difficulty: 'EASY',
    patternTags: ['hash-set', 'idempotence', 'membership'],
    signatureId: 'cls:hash-set',
    avgSolveSeconds: 420,
    promptMarkdown: prompt('hash set',
      'Build `HashSet` over an array of buckets. `add(x)` stores `x`, `contains(x)` answers `true` or `false`, `remove(x)` deletes `x`, and `size()` returns how many distinct values are stored.\n\nA set stores each value at most once. Adding a value that is already present must leave `size()` unchanged.\n\n```\n5\nHashSet\nadd 5\nadd 5\nsize\ncontains 5\n```\n```\nnull\nnull\nnull\n1\ntrue\n```\n\n**Edge case:** a duplicate `add` is a no-op, and `remove` of a value that was never added is also a no-op — neither may change `size()`.',
      'Membership answers print as `true` or `false`.'),
    editorialMarkdown: [
      '## Membership check before insert',
      '',
      'A hash set is a hash table that stores only keys. Hashing sends `x` to a bucket; the bucket holds every value that landed there, so `contains` is a short scan of one bucket rather than the whole set. Idempotence is not automatic — you get it by scanning that bucket first and appending only when the value is absent. That is also why the stored count must be maintained by hand: increment only on a real insert, decrement only on a real removal.',
      '',
      'The quiet mistake is counting instead of checking. Appending unconditionally and incrementing the counter gives right answers from `contains` forever — the duplicate is in the bucket, so it is found — while `size()` slowly drifts upward. Nothing about the wrong number is visible until a test asks for it. The mirror case is `remove` of an absent value decrementing the count anyway. Both are one comparison away from correct.',
      '',
      'With buckets kept short, `add`, `contains` and `remove` are O(1) on average and O(n) if everything collides into one bucket; `size` is O(1). Space is O(n).',
    ].join('\n'),
    referenceSolution: hashSet,
    tests: [
      { stdin: '8\nHashSet\nadd 5\nadd 5\nsize\ncontains 5\nremove 5\ncontains 5\nsize', expectedStdout: 'null\nnull\nnull\n1\ntrue\nnull\nfalse\n0', isSample: true },
      { stdin: '4\nHashSet\nremove 3\nsize\ncontains 3', expectedStdout: 'null\nnull\n0\nfalse', isSample: true },
      { stdin: '9\nHashSet\nadd 1\nadd 9\nadd 1\nsize\ncontains 9\nremove 1\ncontains 9\nsize', expectedStdout: 'null\nnull\nnull\nnull\n2\ntrue\nnull\ntrue\n1' },
      { stdin: '7\nHashSet\nadd -3\nadd -3\ncontains -3\nsize\nremove -3\nsize', expectedStdout: 'null\nnull\nnull\ntrue\n1\nnull\n0' },
      { stdin: '8\nHashSet\nadd 0\nadd 0\nadd 0\nadd 8\nsize\ncontains 0\ncontains 4', expectedStdout: 'null\nnull\nnull\nnull\nnull\n2\ntrue\nfalse' },
    ],
  }),
  p({
    ...base,
    slug: 'stack-peek-does-not-remove',
    title: 'Stack Peek Does Not Remove',
    difficulty: 'EASY',
    patternTags: ['stack', 'lifo', 'read-only-access'],
    signatureId: 'cls:stack',
    avgSolveSeconds: 360,
    promptMarkdown: prompt('stack',
      'Build `Stack`. `push(x)` adds on top, `pop()` removes and returns the top, `peek()` returns the top **without removing it**, and `isEmpty()` and `size()` describe the current stack.\n\nRepeated `peek` calls must all return the same value and leave `size()` untouched.\n\n```\n6\nStack\npush 4\npeek\npeek\nsize\npop\n```\n```\nnull\nnull\n4\n4\n1\n4\n```\n\n**Edge case:** `peek` and `pop` on an empty stack both return `-1`, and neither may change the stack.',
      'When an operation cannot return an element (a pop or peek on an empty stack), return `-1`.'),
    editorialMarkdown: [
      '## Read the top without moving it',
      '',
      'A stack keeps its top at one end of its storage, so both `pop` and `peek` look at the same place. The only difference between them is that `pop` also shortens the storage. Writing `peek` as a read of the last slot — never as a removal — is what makes it repeatable, and repeatability is what callers rely on when they inspect the top before deciding whether to consume it.',
      '',
      'The quiet mistake is implementing `peek` by popping and then pushing the value back. It returns the correct number, so it passes any test that peeks once. It fails only when something else observes the stack in the gap — and in a bounded stack, or where `pop` on empty is a guarded path, that round trip can also swallow the empty case entirely and return `-1` for a stack that has an element. Read the slot; do not touch the size.',
      '',
      '`push`, `pop`, `peek`, `isEmpty` and `size` are all O(1). Storage is O(n) for n pushed values.',
    ].join('\n'),
    referenceSolution: stack,
    tests: [
      { stdin: '7\nStack\npush 4\npeek\npeek\nsize\npop\nsize', expectedStdout: 'null\nnull\n4\n4\n1\n4\n0', isSample: true },
      { stdin: '5\nStack\npeek\nisEmpty\npop\nsize', expectedStdout: 'null\n-1\ntrue\n-1\n0', isSample: true },
      { stdin: '8\nStack\npush 1\npush 2\npeek\npop\npeek\npop\npeek', expectedStdout: 'null\nnull\nnull\n2\n2\n1\n1\n-1' },
      { stdin: '5\nStack\npush -5\npeek\nisEmpty\nsize', expectedStdout: 'null\nnull\n-5\nfalse\n1' },
      { stdin: '9\nStack\npush 7\npush 8\npeek\npeek\npeek\nsize\npop\npeek', expectedStdout: 'null\nnull\nnull\n8\n8\n8\n2\n8\n7' },
    ],
  }),
  p({
    ...base,
    slug: 'queue-interleaved-push-pop',
    title: 'Queue Interleaved Push and Pop',
    difficulty: 'MEDIUM',
    patternTags: ['queue', 'fifo', 'interleaving'],
    signatureId: 'cls:queue',
    avgSolveSeconds: 600,
    promptMarkdown: prompt('queue',
      'Build `Queue`. `enqueue(x)` joins the back, `dequeue()` removes and returns the front, `peek()` reads the front, and `isEmpty()` and `size()` describe the queue.\n\nThis log interleaves arrivals and departures instead of filling first and draining after. FIFO order must hold across the whole log: a value enqueued after a dequeue still leaves before anything already behind it.\n\n```\n6\nQueue\nenqueue 1\nenqueue 2\ndequeue\nenqueue 3\ndequeue\n```\n```\nnull\nnull\nnull\n1\nnull\n2\n```\n\n**Edge case:** `dequeue` and `peek` on an empty queue return `-1`, and the queue must still accept new values afterwards.',
      'When an operation cannot return an element (a dequeue or peek on an empty queue), return `-1`.'),
    editorialMarkdown: [
      '## Two moving ends, one order',
      '',
      'A queue has an arrival end and a departure end, and interleaving is only hard if you conflate them. Keep a head index alongside the storage: `enqueue` appends at the back, `dequeue` returns the slot at the head and advances the head. The two never contend, so an arrival in the middle of a drain simply lands behind everything already waiting, and FIFO falls out without any bookkeeping.',
      '',
      'The quiet mistake is emptying by resetting rather than by draining. It is tempting, when the head catches up to the tail, to clear the storage and start both at zero — and that is fine, as long as you also treat "head equals tail" as empty everywhere else. Get one of those two places wrong and the queue reports the wrong size, or `peek` reads a slot the head has already passed and hands back a value that was dequeued several operations ago. Derive emptiness from the same head and tail you use to read, never from a separately maintained flag.',
      '',
      '`enqueue`, `peek`, `isEmpty` and `size` are O(1); `dequeue` is O(1) with a head index (amortized if you compact the discarded prefix occasionally). Space is O(n).',
    ].join('\n'),
    referenceSolution: queue,
    tests: [
      { stdin: '9\nQueue\nenqueue 1\nenqueue 2\ndequeue\nenqueue 3\ndequeue\nenqueue 4\npeek\nsize', expectedStdout: 'null\nnull\nnull\n1\nnull\n2\nnull\n3\n2', isSample: true },
      { stdin: '6\nQueue\ndequeue\nenqueue 9\ndequeue\ndequeue\nisEmpty', expectedStdout: 'null\n-1\nnull\n9\n-1\ntrue', isSample: true },
      { stdin: '8\nQueue\nenqueue 1\ndequeue\nenqueue 2\ndequeue\nenqueue 3\npeek\nsize', expectedStdout: 'null\nnull\n1\nnull\n2\nnull\n3\n1' },
      { stdin: '10\nQueue\nenqueue 5\nenqueue 6\nenqueue 7\ndequeue\ndequeue\nenqueue 8\ndequeue\ndequeue\nisEmpty', expectedStdout: 'null\nnull\nnull\nnull\n5\n6\nnull\n7\n8\ntrue' },
      { stdin: '7\nQueue\nenqueue -1\npeek\nenqueue -2\ndequeue\npeek\nsize', expectedStdout: 'null\nnull\n-1\nnull\n-1\n-2\n1' },
    ],
  }),
  p({
    ...base,
    slug: 'deque-rotate-by-steps',
    title: 'Deque Rotate by Steps',
    difficulty: 'MEDIUM',
    patternTags: ['deque', 'rotation', 'double-ended-queue'],
    signatureId: 'cls:deque',
    avgSolveSeconds: 660,
    promptMarkdown: prompt('double-ended queue',
      'Build `Deque`. `pushFront(x)` and `pushBack(x)` add at either end, `popFront()` and `popBack()` remove and return from their matching ends, and `size()` reports how many values are stored.\n\nThe log rotates the contents using only these four operations: one step to the right is `popBack` followed by `pushFront` of that value; one step to the left is `popFront` followed by `pushBack`. Rotating `k` steps is that pair repeated `k` times, so both ends must stay correct after many moves.\n\n```\n7\nDeque\npushBack 1\npushBack 2\npushBack 3\npopBack\npushFront 3\npopFront\n```\n```\nnull\nnull\nnull\nnull\n3\nnull\n3\n```\n\n**Edge case:** `popFront` and `popBack` on an empty deque both return `-1`; a rotation of an empty deque must leave it empty and usable.',
      'When an operation cannot return an element (a pop on an empty deque), return `-1`.'),
    editorialMarkdown: [
      '## Rotation is a pop and a push at opposite ends',
      '',
      'A rotation moves no data in bulk — it takes the one element that falls off one end and puts it back on the other. That is why a deque makes it cheap: every step is two O(1) operations, so `k` steps cost O(k) rather than the O(nk) a naive array shift would. Note also that a rotation of a one-element deque, or of an empty one, is the identity, which makes those two cases the cheapest correctness check you have.',
      '',
      'The quiet mistake is a front and a back that disagree about the last element. When the deque is down to one value, `popFront` and `popBack` must return that same value and both leave the deque empty; if your two ends are tracked by separate indices that are updated independently, one of them can end up pointing past the other. The deque keeps answering — with `size()` at zero and a pop still returning a stale value, or `size()` at one with nothing readable. Drive both ends from the same element count, and check it before moving either.',
      '',
      'All five operations are O(1) with a proper deque representation, so a `k`-step rotation is O(k). Space is O(n).',
    ].join('\n'),
    referenceSolution: deque,
    tests: [
      { stdin: '10\nDeque\npushBack 1\npushBack 2\npushBack 3\npushBack 4\npopBack\npushFront 4\npopFront\npopFront\nsize', expectedStdout: 'null\nnull\nnull\nnull\nnull\n4\nnull\n4\n1\n2', isSample: true },
      { stdin: '4\nDeque\npopBack\npopFront\nsize', expectedStdout: 'null\n-1\n-1\n0', isSample: true },
      { stdin: '10\nDeque\npushBack 1\npushBack 2\npushBack 3\npopFront\npushBack 1\npopFront\npopFront\npopFront\nsize', expectedStdout: 'null\nnull\nnull\nnull\n1\nnull\n2\n3\n1\n0' },
      { stdin: '6\nDeque\npushBack 7\npopBack\npushFront 7\npopFront\nsize', expectedStdout: 'null\nnull\n7\nnull\n7\n0' },
      { stdin: '12\nDeque\npushBack 1\npushBack 2\npushBack 3\npopBack\npushFront 3\npopBack\npushFront 2\npopFront\npopFront\npopFront\nsize', expectedStdout: 'null\nnull\nnull\nnull\n3\nnull\n2\nnull\n2\n3\n1\n0' },
    ],
  }),
];
