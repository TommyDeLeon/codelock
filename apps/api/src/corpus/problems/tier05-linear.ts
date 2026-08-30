import { AUTHORED, type ProblemDefinition } from '../problem.js';

/** Tier 0.5 — the linear structures behind the library calls. */
const p = (d: ProblemDefinition): ProblemDefinition => d;

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
  JAVASCRIPT: `class Queue { constructor() { this.items = []; } enqueue(x) { this.items.push(x); } dequeue() { return this.items.length ? this.items.shift() : -1; } peek() { return this.items.length ? this.items[0] : -1; } isEmpty() { return this.items.length === 0; } size() { return this.items.length; } }`,
  TYPESCRIPT: `class Queue { private items: number[] = []; enqueue(x: number): void { this.items.push(x); } dequeue(): number { return this.items.length ? this.items.shift()! : -1; } peek(): number { return this.items.length ? this.items[0] : -1; } isEmpty(): boolean { return this.items.length === 0; } size(): number { return this.items.length; } }`,
  PYTHON: `class Queue:
    def __init__(self): self.items = []
    def enqueue(self, x): self.items.append(x)
    def dequeue(self): return self.items.pop(0) if self.items else -1
    def peek(self): return self.items[0] if self.items else -1
    def isEmpty(self): return not self.items
    def size(self): return len(self.items)`,
  JAVA: `class Queue { private java.util.ArrayDeque<Integer> items = new java.util.ArrayDeque<>(); public void enqueue(int x) { items.addLast(x); } public int dequeue() { return items.isEmpty() ? -1 : items.removeFirst(); } public int peek() { return items.isEmpty() ? -1 : items.peekFirst(); } public boolean isEmpty() { return items.isEmpty(); } public int size() { return items.size(); } }`,
  CPP: `class Queue { deque<int> items; public: void enqueue(int x) { items.push_back(x); } int dequeue() { if(items.empty()) return -1; int x=items.front(); items.pop_front(); return x; } int peek() { return items.empty() ? -1 : items.front(); } bool isEmpty() { return items.empty(); } int size() { return items.size(); } };`,
  GO: `type Queue struct { items []int }
func Constructor() Queue { return Queue{} }
func (q *Queue) Enqueue(x int) { q.items=append(q.items,x) }
func (q *Queue) Dequeue() int { if len(q.items)==0{return -1}; x:=q.items[0]; q.items=q.items[1:]; return x }
func (q *Queue) Peek() int { if len(q.items)==0{return -1}; return q.items[0] }
func (q *Queue) IsEmpty() bool{return len(q.items)==0}
func (q *Queue) Size() int{return len(q.items)}`,
};

const twoStackQueue = {
  JAVASCRIPT: `class Queue { constructor() { this.in = []; this.out = []; } move() { if (!this.out.length) while (this.in.length) this.out.push(this.in.pop()); } enqueue(x) { this.in.push(x); } dequeue() { this.move(); return this.out.length ? this.out.pop() : -1; } peek() { this.move(); return this.out.length ? this.out[this.out.length-1] : -1; } isEmpty() { return !this.in.length && !this.out.length; } size() { return this.in.length + this.out.length; } }`,
  TYPESCRIPT: `class Queue { private input: number[] = []; private output: number[] = []; private move(): void { if (!this.output.length) while (this.input.length) this.output.push(this.input.pop()!); } enqueue(x: number): void { this.input.push(x); } dequeue(): number { this.move(); return this.output.length ? this.output.pop()! : -1; } peek(): number { this.move(); return this.output.length ? this.output[this.output.length-1] : -1; } isEmpty(): boolean { return !this.input.length && !this.output.length; } size(): number { return this.input.length + this.output.length; } }`,
  PYTHON: `class Queue:
    def __init__(self): self.input, self.output = [], []
    def _move(self):
        if not self.output:
            while self.input: self.output.append(self.input.pop())
    def enqueue(self, x): self.input.append(x)
    def dequeue(self): self._move(); return self.output.pop() if self.output else -1
    def peek(self): self._move(); return self.output[-1] if self.output else -1
    def isEmpty(self): return not self.input and not self.output
    def size(self): return len(self.input) + len(self.output)`,
  JAVA: `class Queue { private java.util.ArrayDeque<Integer> input=new java.util.ArrayDeque<>(), output=new java.util.ArrayDeque<>(); private void move(){if(output.isEmpty()) while(!input.isEmpty()) output.push(input.pop());} public void enqueue(int x){input.push(x);} public int dequeue(){move(); return output.isEmpty()?-1:output.pop();} public int peek(){move(); return output.isEmpty()?-1:output.peek();} public boolean isEmpty(){return input.isEmpty()&&output.isEmpty();} public int size(){return input.size()+output.size();} }`,
  CPP: `class Queue { stack<int> input, output; void move(){if(output.empty()) while(!input.empty()){output.push(input.top());input.pop();}} public: void enqueue(int x){input.push(x);} int dequeue(){move();if(output.empty())return -1;int x=output.top();output.pop();return x;} int peek(){move();return output.empty()?-1:output.top();} bool isEmpty(){return input.empty()&&output.empty();} int size(){return input.size()+output.size();} };`,
  GO: `type Queue struct { input, output []int }
func Constructor() Queue{return Queue{}}
func (q *Queue) move(){if len(q.output)==0 {for len(q.input)>0 {i:=len(q.input)-1;q.output=append(q.output,q.input[i]);q.input=q.input[:i]}}}
func(q *Queue) Enqueue(x int){q.input=append(q.input,x)}
func(q *Queue) Dequeue() int{q.move();if len(q.output)==0{return -1};i:=len(q.output)-1;x:=q.output[i];q.output=q.output[:i];return x}
func(q *Queue) Peek() int{q.move();if len(q.output)==0{return -1};return q.output[len(q.output)-1]}
func(q *Queue) IsEmpty() bool{return len(q.input)==0&&len(q.output)==0}
func(q *Queue) Size() int{return len(q.input)+len(q.output)}`,
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

const circularDeque = {
  JAVASCRIPT: `class Deque { constructor(){this.a=new Array(4);this.head=0;this.n=0;} grow(){const b=new Array(this.a.length*2);for(let i=0;i<this.n;i++)b[i]=this.a[(this.head+i)%this.a.length];this.a=b;this.head=0;} pushFront(x){if(this.n===this.a.length)this.grow();this.head=(this.head-1+this.a.length)%this.a.length;this.a[this.head]=x;this.n++;} pushBack(x){if(this.n===this.a.length)this.grow();this.a[(this.head+this.n)%this.a.length]=x;this.n++;} popFront(){if(!this.n)return -1;const x=this.a[this.head];this.head=(this.head+1)%this.a.length;this.n--;return x;} popBack(){if(!this.n)return -1;this.n--;return this.a[(this.head+this.n)%this.a.length];} size(){return this.n;} }`,
  TYPESCRIPT: `class Deque { private a:number[]=new Array(4); private head=0; private n=0; private grow():void{const b=new Array<number>(this.a.length*2);for(let i=0;i<this.n;i++)b[i]=this.a[(this.head+i)%this.a.length];this.a=b;this.head=0;} pushFront(x:number):void{if(this.n===this.a.length)this.grow();this.head=(this.head-1+this.a.length)%this.a.length;this.a[this.head]=x;this.n++;} pushBack(x:number):void{if(this.n===this.a.length)this.grow();this.a[(this.head+this.n)%this.a.length]=x;this.n++;} popFront():number{if(!this.n)return -1;const x=this.a[this.head];this.head=(this.head+1)%this.a.length;this.n--;return x;} popBack():number{if(!this.n)return -1;this.n--;return this.a[(this.head+this.n)%this.a.length];} size():number{return this.n;} }`,
  PYTHON: `class Deque:
    def __init__(self): self.a=[0]*4; self.head=0; self.n=0
    def _grow(self):
        b=[0]*(len(self.a)*2)
        for i in range(self.n): b[i]=self.a[(self.head+i)%len(self.a)]
        self.a=b; self.head=0
    def pushFront(self,x):
        if self.n==len(self.a): self._grow()
        self.head=(self.head-1)%len(self.a); self.a[self.head]=x; self.n+=1
    def pushBack(self,x):
        if self.n==len(self.a): self._grow()
        self.a[(self.head+self.n)%len(self.a)]=x; self.n+=1
    def popFront(self):
        if not self.n:return -1
        x=self.a[self.head];self.head=(self.head+1)%len(self.a);self.n-=1;return x
    def popBack(self):
        if not self.n:return -1
        self.n-=1;return self.a[(self.head+self.n)%len(self.a)]
    def size(self): return self.n`,
  JAVA: `class Deque { private int[] a=new int[4];private int head=0,n=0;private void grow(){int[]b=new int[a.length*2];for(int i=0;i<n;i++)b[i]=a[(head+i)%a.length];a=b;head=0;} public void pushFront(int x){if(n==a.length)grow();head=(head-1+a.length)%a.length;a[head]=x;n++;} public void pushBack(int x){if(n==a.length)grow();a[(head+n)%a.length]=x;n++;} public int popFront(){if(n==0)return -1;int x=a[head];head=(head+1)%a.length;n--;return x;} public int popBack(){if(n==0)return -1;n--;return a[(head+n)%a.length];} public int size(){return n;} }`,
  CPP: `class Deque { vector<int>a;int head=0,n=0;void grow(){vector<int>b(a.size()*2);for(int i=0;i<n;i++)b[i]=a[(head+i)%a.size()];a=b;head=0;} public: Deque():a(4){} void pushFront(int x){if(n==(int)a.size())grow();head=(head-1+a.size())%a.size();a[head]=x;n++;} void pushBack(int x){if(n==(int)a.size())grow();a[(head+n)%a.size()]=x;n++;} int popFront(){if(!n)return -1;int x=a[head];head=(head+1)%a.size();n--;return x;} int popBack(){if(!n)return -1;n--;return a[(head+n)%a.size()];} int size(){return n;} };`,
  GO: `type Deque struct{a []int;head,n int}
func Constructor() Deque{return Deque{a:make([]int,4)}}
func(d *Deque) grow(){b:=make([]int,len(d.a)*2);for i:=0;i<d.n;i++{b[i]=d.a[(d.head+i)%len(d.a)]};d.a=b;d.head=0}
func(d *Deque) PushFront(x int){if d.n==len(d.a){d.grow()};d.head=(d.head-1+len(d.a))%len(d.a);d.a[d.head]=x;d.n++}
func(d *Deque) PushBack(x int){if d.n==len(d.a){d.grow()};d.a[(d.head+d.n)%len(d.a)]=x;d.n++}
func(d *Deque) PopFront() int{if d.n==0{return -1};x:=d.a[d.head];d.head=(d.head+1)%len(d.a);d.n--;return x}
func(d *Deque) PopBack() int{if d.n==0{return -1};d.n--;return d.a[(d.head+d.n)%len(d.a)]}
func(d *Deque) Size() int{return d.n}`,
};

const linkedList = {
  JAVASCRIPT: `class LinkedList { constructor(){this.head=null;this.tail=null;this.n=0;} addFirst(x){const q={x,next:this.head};this.head=q;if(!this.tail)this.tail=q;this.n++;} addLast(x){const q={x,next:null};if(this.tail)this.tail.next=q;else this.head=q;this.tail=q;this.n++;} removeFirst(){if(!this.head)return -1;const x=this.head.x;this.head=this.head.next;this.n--;if(!this.head)this.tail=null;return x;} get(i){let q=this.head;while(q&&i-->0)q=q.next;return q?q.x:-1;} size(){return this.n;} toArray(){const a=[];for(let q=this.head;q;q=q.next)a.push(q.x);return a;} }`,
  TYPESCRIPT: `class LinkedList { private head: {x:number;next:any}|null=null; private tail: {x:number;next:any}|null=null; private n=0; addFirst(x:number):void{const q={x,next:this.head};this.head=q;if(!this.tail)this.tail=q;this.n++;} addLast(x:number):void{const q={x,next:null as any};if(this.tail)this.tail.next=q;else this.head=q;this.tail=q;this.n++;} removeFirst():number{if(!this.head)return -1;const x=this.head.x;this.head=this.head.next;this.n--;if(!this.head)this.tail=null;return x;} get(i:number):number{let q=this.head;while(q&&i-->0)q=q.next;return q?q.x:-1;} size():number{return this.n;} toArray():number[]{const a:number[]=[];for(let q=this.head;q;q=q.next)a.push(q.x);return a;} }`,
  PYTHON: `class LinkedList:
    def __init__(self): self.head=self.tail=None;self.n=0
    def addFirst(self,x):
        q=[x,self.head];self.head=q
        if self.tail is None:self.tail=q
        self.n+=1
    def addLast(self,x):
        q=[x,None]
        if self.tail:self.tail[1]=q
        else:self.head=q
        self.tail=q;self.n+=1
    def removeFirst(self):
        if not self.head:return -1
        x=self.head[0];self.head=self.head[1];self.n-=1
        if not self.head:self.tail=None
        return x
    def get(self,i):
        q=self.head
        while q and i>0:q=q[1];i-=1
        return q[0] if q else -1
    def size(self):return self.n
    def toArray(self):
        a=[];q=self.head
        while q:a.append(q[0]);q=q[1]
        return a`,
  JAVA: `class LinkedList { static class Node{int x;Node next;Node(int x){this.x=x;}} Node head,tail;int n; public void addFirst(int x){Node q=new Node(x);q.next=head;head=q;if(tail==null)tail=q;n++;} public void addLast(int x){Node q=new Node(x);if(tail!=null)tail.next=q;else head=q;tail=q;n++;} public int removeFirst(){if(head==null)return -1;int x=head.x;head=head.next;n--;if(head==null)tail=null;return x;} public int get(int i){Node q=head;while(q!=null&&i-->0)q=q.next;return q==null?-1:q.x;} public int size(){return n;} public int[] toArray(){int[]a=new int[n];Node q=head;for(int i=0;i<n;i++){a[i]=q.x;q=q.next;}return a;} }`,
  CPP: `class LinkedList { struct Node{int x;Node*next;Node(int v):x(v),next(nullptr){}};Node*head=nullptr,*tail=nullptr;int n=0;public: void addFirst(int x){Node*q=new Node(x);q->next=head;head=q;if(!tail)tail=q;n++;} void addLast(int x){Node*q=new Node(x);if(tail)tail->next=q;else head=q;tail=q;n++;} int removeFirst(){if(!head)return -1;Node*q=head;int x=q->x;head=head->next;delete q;n--;if(!head)tail=nullptr;return x;} int get(int i){Node*q=head;while(q&&i-->0)q=q->next;return q?q->x:-1;} int size(){return n;} vector<int> toArray(){vector<int>a;for(Node*q=head;q;q=q->next)a.push_back(q->x);return a;} };`,
  GO: `type node struct{x int;next *node}
type LinkedList struct{head,tail *node;n int}
func Constructor() LinkedList{return LinkedList{}}
func(l *LinkedList) AddFirst(x int){q:=&node{x:x,next:l.head};l.head=q;if l.tail==nil{l.tail=q};l.n++}
func(l *LinkedList) AddLast(x int){q:=&node{x:x};if l.tail!=nil{l.tail.next=q}else{l.head=q};l.tail=q;l.n++}
func(l *LinkedList) RemoveFirst() int{if l.head==nil{return -1};x:=l.head.x;l.head=l.head.next;l.n--;if l.head==nil{l.tail=nil};return x}
func(l *LinkedList) Get(i int) int{q:=l.head;for q!=nil&&i>0{q=q.next;i--};if q==nil{return -1};return q.x}
func(l *LinkedList) Size() int{return l.n}
func(l *LinkedList) ToArray() []int{a:=[]int{};for q:=l.head;q!=nil;q=q.next{a=append(a,q.x)};return a}`,
};

const prompt = (name: string, text: string) => [
  `Implement a ${name} yourself; do not use your language's built-in ${name.toLowerCase()} type.`, '', text, '',
  '**Operation log**', '', 'The first operation is the constructor. Print `null` for it and for every void method. Every other operation prints its return value.', '',
  'When an operation cannot return an element (an empty removal or an invalid index), return `-1`.',
].join('\n');

const editorial = (heading: string, body: string, complexity: string) => [
  `## ${heading}`, '', body, '',
  'The quiet mistake is treating an empty structure as though it has a valid first or last slot. That often passes ordinary examples, then fails only after a long sequence of removals. Keep the element count as the source of truth and check it before reading or moving a pointer.', '',
  complexity,
].join('\n');

export const TIER_05_LINEAR_PROBLEMS: ProblemDefinition[] = [
  p({ slug:'dynamic-array-grow', title:'Growable Array', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['dynamic-array','resizing','buffers'], signatureId:'cls:dynamic-array', avgSolveSeconds:420,
    promptMarkdown:prompt('growable array', 'Build `DynamicArray` over a fixed backing buffer. `push(x)` appends, `pop()` removes and returns the last value, `get(i)` reads an index, `set(i, x)` replaces one, and `size()` returns the number of stored values. Start with a small buffer and grow it when full.\n\n**Example:** after `DynamicArray`, `push 4`, `push 9`, `get 1`, the output is `null`, `null`, `null`, `9`.'),
    editorialMarkdown:editorial('Copy when full', 'A dynamic array owns a buffer and a logical length. Appending writes at `length`, then advances it. When length equals capacity, allocate a larger buffer and copy only live elements; old unused slots are not elements.', 'Each ordinary operation is O(1). A resize is O(n), but doubling makes push amortized O(1); space is O(n).'), referenceSolution:dynamicArray,
    tests:[{stdin:'6\nDynamicArray\npush 4\npush 9\nget 1\nsize\npop',expectedStdout:'null\nnull\nnull\n9\n2\n9',isSample:true},{stdin:'4\nDynamicArray\npop\nget 0\nsize',expectedStdout:'null\n-1\n-1\n0',isSample:true},{stdin:'9\nDynamicArray\npush 1\npush 2\npush 3\npush 4\nget 3\nset 1 8\nget 1\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\n4\nnull\n8\n4'},{stdin:'5\nDynamicArray\npush -5\nget 0\npop\nsize',expectedStdout:'null\nnull\n-5\n-5\n0'}], provenance:AUTHORED }),
  p({ slug:'dynamic-array-pop-after-resize', title:'Dynamic Array Resize and Pop', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['dynamic-array','resizing','edge-cases'], signatureId:'cls:dynamic-array', avgSolveSeconds:600,
    promptMarkdown:prompt('growable array', 'Use the same `DynamicArray` interface, but this operation log repeatedly grows the buffer, pops values, and appends again. Preserve last-in-first-out order across every resize. A popped slot is no longer part of the array, so `get` on it must return `-1`.'),
    editorialMarkdown:editorial('Logical length survives resizing', 'The buffer capacity is not the array size. Resize copies indices `0` through `length - 1`; pop decrements length before returning that last live value. Later pushes overwrite the freed logical slot, whether or not the buffer grew earlier.', 'Push and pop are O(1) amortized, while get, set, and size are O(1). The backing storage uses O(n) space.'), referenceSolution:dynamicArray,
    tests:[{stdin:'11\nDynamicArray\npush 1\npush 2\npush 3\npop\npush 4\nget 2\nsize\npop\npop\npop',expectedStdout:'null\nnull\nnull\nnull\n3\nnull\n4\n3\n4\n2\n1',isSample:true},{stdin:'7\nDynamicArray\npush 7\npop\nget 0\npush 8\nget 0\nsize',expectedStdout:'null\nnull\n7\n-1\nnull\n8\n1',isSample:true},{stdin:'8\nDynamicArray\npush 0\npush 1\npush 2\npush 3\npop\npop\nget 2\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\n3\n2\n-1\n2'},{stdin:'4\nDynamicArray\nset 0 9\nget -1\npop',expectedStdout:'null\nnull\n-1\n-1'}], provenance:AUTHORED }),
  p({ slug:'stack-lifo-basics', title:'Stack LIFO Basics', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['stack','lifo'], signatureId:'cls:stack', avgSolveSeconds:360,
    promptMarkdown:prompt('stack', 'Build `Stack`. `push(x)` adds to the top; `pop()` removes the top; `peek()` reads it without removing; `isEmpty()` and `size()` describe the current stack. It follows last-in, first-out order.'),
    editorialMarkdown:editorial('One accessible end', 'A stack needs one end only. Store the top at the end of your backing storage, so both pushing and popping touch the same location. The first item pushed is therefore the last item left to remove.', 'Push, pop, peek, isEmpty, and size are O(1); the stored values take O(n) space.'), referenceSolution:stack,
    tests:[{stdin:'7\nStack\npush 3\npush 8\npeek\npop\npeek\nsize',expectedStdout:'null\nnull\nnull\n8\n8\n3\n1',isSample:true},{stdin:'4\nStack\nisEmpty\npush 1\nisEmpty',expectedStdout:'null\ntrue\nnull\nfalse',isSample:true},{stdin:'5\nStack\npop\npeek\nsize\nisEmpty',expectedStdout:'null\n-1\n-1\n0\ntrue'},{stdin:'8\nStack\npush -1\npush 0\npop\npop\npop\nsize\nisEmpty',expectedStdout:'null\nnull\nnull\n0\n-1\n-1\n0\ntrue'}], provenance:AUTHORED }),
  p({ slug:'stack-underflow-guard', title:'Stack Underflow Guard', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['stack','underflow','lifo'], signatureId:'cls:stack', avgSolveSeconds:540,
    promptMarkdown:prompt('stack', 'Implement `Stack` for a log that intentionally asks for `pop` and `peek` after the stack becomes empty. Those calls must return `-1`; they must not corrupt the stack, change `size`, or make the next `push` fail.'),
    editorialMarkdown:editorial('Guard the top', 'Underflow is not a special kind of value: it is a state where there is no top to read. Check emptiness before every pop or peek, return the documented sentinel, and leave the backing storage unchanged. That means the next push begins a clean one-element stack.', 'All operations are O(1) time and O(n) space for n stored values.'), referenceSolution:stack,
    tests:[{stdin:'8\nStack\npush 5\npop\npop\npush 6\npeek\npop\nisEmpty',expectedStdout:'null\nnull\n5\n-1\nnull\n6\n6\ntrue',isSample:true},{stdin:'5\nStack\npeek\npop\nsize\nisEmpty',expectedStdout:'null\n-1\n-1\n0\ntrue',isSample:true},{stdin:'9\nStack\npush 1\npush 2\npop\npop\npop\npush 3\nsize\npeek',expectedStdout:'null\nnull\nnull\n2\n1\n-1\nnull\n1\n3'},{stdin:'3\nStack\npush -9\npeek',expectedStdout:'null\nnull\n-9'}], provenance:AUTHORED }),
  p({ slug:'queue-fifo-basics', title:'Queue FIFO Basics', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['queue','fifo'], signatureId:'cls:queue', avgSolveSeconds:420,
    promptMarkdown:prompt('queue', 'Build `Queue`. `enqueue(x)` joins the back, `dequeue()` removes the front, and `peek()` reads the front. Items leave in first-in, first-out order.'),
    editorialMarkdown:editorial('Separate front and back', 'A queue has two roles: incoming values join the back and outgoing values leave the front. Keeping those roles distinct makes FIFO automatic: the earliest value is always the next one removed.', 'Enqueue, dequeue, peek, isEmpty, and size are O(1) with a proper queue representation, using O(n) space.'), referenceSolution:queue,
    tests:[{stdin:'7\nQueue\nenqueue 3\nenqueue 8\npeek\ndequeue\npeek\nsize',expectedStdout:'null\nnull\nnull\n3\n3\n8\n1',isSample:true},{stdin:'4\nQueue\nisEmpty\nenqueue 1\nisEmpty',expectedStdout:'null\ntrue\nnull\nfalse',isSample:true},{stdin:'5\nQueue\ndequeue\npeek\nsize\nisEmpty',expectedStdout:'null\n-1\n-1\n0\ntrue'},{stdin:'8\nQueue\nenqueue -1\nenqueue 0\ndequeue\ndequeue\ndequeue\nsize\nisEmpty',expectedStdout:'null\nnull\nnull\n-1\n0\n-1\n0\ntrue'}], provenance:AUTHORED }),
  p({ slug:'queue-two-stacks', title:'Queue from Two Stacks', difficulty:'HARD', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['queue','two-stacks','amortized-analysis'], signatureId:'cls:queue', avgSolveSeconds:900,
    promptMarkdown:prompt('queue', 'Implement `Queue` using exactly two stacks: an input stack for `enqueue` and an output stack for `dequeue` and `peek`. Move items from input to output only when output is empty. Do not use a queue or deque internally.'),
    editorialMarkdown:editorial('Two reversals make FIFO', 'The input stack reverses arrival order once; moving its contents into the output stack reverses that order again, putting the oldest item on top. Do not transfer on every dequeue: transfer only when output is empty, so each value crosses between stacks once.', 'Each operation is O(1) amortized: an individual transfer can cost O(n), but every item moves at most once. Space is O(n).'), referenceSolution:twoStackQueue,
    tests:[{stdin:'8\nQueue\nenqueue 1\nenqueue 2\ndequeue\nenqueue 3\ndequeue\npeek\nsize',expectedStdout:'null\nnull\nnull\n1\nnull\n2\n3\n1',isSample:true},{stdin:'5\nQueue\ndequeue\npeek\nisEmpty\nsize',expectedStdout:'null\n-1\n-1\ntrue\n0',isSample:true},{stdin:'11\nQueue\nenqueue 1\nenqueue 2\nenqueue 3\ndequeue\ndequeue\nenqueue 4\nenqueue 5\ndequeue\ndequeue\ndequeue',expectedStdout:'null\nnull\nnull\nnull\n1\n2\nnull\nnull\n3\n4\n5'},{stdin:'4\nQueue\nenqueue -7\npeek\ndequeue',expectedStdout:'null\nnull\n-7\n-7'}], provenance:AUTHORED }),
  p({ slug:'deque-both-ends', title:'Deque Both Ends', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['deque','double-ended-queue'], signatureId:'cls:deque', avgSolveSeconds:480,
    promptMarkdown:prompt('double-ended queue', 'Build `Deque`. `pushFront` and `pushBack` add values at either end; `popFront` and `popBack` remove from their matching ends. `size()` reports stored values.'),
    editorialMarkdown:editorial('Two ends, four symmetric operations', 'Think of a deque as a line with a front and a back, not as a stack with extra methods. Each push adds at its named end and each pop removes at its named end. Symmetry is a useful check: front and back cases should behave alike for one element.', 'With an appropriate deque representation, every operation is O(1), and storage is O(n).'), referenceSolution:deque,
    tests:[{stdin:'7\nDeque\npushFront 2\npushBack 3\npushFront 1\npopBack\npopFront\nsize',expectedStdout:'null\nnull\nnull\nnull\n3\n1\n1',isSample:true},{stdin:'4\nDeque\npopFront\npopBack\nsize',expectedStdout:'null\n-1\n-1\n0',isSample:true},{stdin:'8\nDeque\npushBack 1\npushBack 2\npopFront\npushFront 0\npopBack\npopFront\nsize',expectedStdout:'null\nnull\nnull\n1\nnull\n2\n0\n0'},{stdin:'3\nDeque\npushFront -4\npopBack',expectedStdout:'null\nnull\n-4'}], provenance:AUTHORED }),
  p({ slug:'deque-circular-buffer', title:'Circular Buffer Deque', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['deque','circular-buffer','resizing'], signatureId:'cls:deque', avgSolveSeconds:720,
    promptMarkdown:prompt('double-ended queue', 'Build `Deque` on a circular backing buffer. Keep a head index and wrap it around the buffer for both-end operations. Begin with a fixed-capacity buffer, then grow and copy elements in logical front-to-back order when it fills.'),
    editorialMarkdown:editorial('Wrap physical indices, preserve logical order', 'The logical front is not always slot zero. Convert logical offset `i` to `(head + i) mod capacity`; when growing, copy values in that order into a fresh buffer and reset head to zero. This is why copying raw physical slots is a quiet bug after wraparound.', 'Push and pop are O(1) amortized with doubling; a grow costs O(n). The buffer requires O(n) space.'), referenceSolution:circularDeque,
    tests:[{stdin:'10\nDeque\npushBack 1\npushBack 2\npopFront\npushBack 3\npushFront 0\npopBack\npopFront\npopFront\nsize',expectedStdout:'null\nnull\nnull\n1\nnull\nnull\n3\n0\n2\n0',isSample:true},{stdin:'5\nDeque\npopFront\npushBack 9\npopBack\nsize',expectedStdout:'null\n-1\nnull\n9\n0',isSample:true},{stdin:'10\nDeque\npushBack 1\npushBack 2\npushBack 3\npushBack 4\npushBack 5\npopFront\npopBack\npopFront\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\n1\n5\n2\n2'},{stdin:'4\nDeque\npushFront -2\npushBack -1\npopFront',expectedStdout:'null\nnull\nnull\n-2'}], provenance:AUTHORED }),
  p({ slug:'linked-list-singly-basics', title:'Singly Linked List Basics', difficulty:'EASY', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['linked-list','nodes','pointers'], signatureId:'cls:linked-list', avgSolveSeconds:480,
    promptMarkdown:prompt('singly linked list', 'Build `LinkedList` from nodes. `addFirst` prepends, `addLast` appends, `removeFirst` removes the head, `get(i)` reads from zero-based index `i`, `size` counts nodes, and `toArray` returns the values in order.'),
    editorialMarkdown:editorial('Nodes and the next link', 'Each node holds a value and a link to its successor. Adding at the front replaces head; adding at the back needs a tail pointer or a walk to the last node. When removing the only node, update both head and tail to empty.', 'Front insertion and removal are O(1); with a tail, append is O(1); get and toArray are O(n). Space is O(n).'), referenceSolution:linkedList,
    tests:[{stdin:'7\nLinkedList\naddFirst 2\naddFirst 1\naddLast 3\nget 1\ntoArray\nsize',expectedStdout:'null\nnull\nnull\nnull\n2\n1 2 3\n3',isSample:true},{stdin:'4\nLinkedList\nremoveFirst\nget 0\nsize',expectedStdout:'null\n-1\n-1\n0',isSample:true},{stdin:'7\nLinkedList\naddLast 4\nremoveFirst\nsize\naddFirst 5\ntoArray\nget 1',expectedStdout:'null\nnull\n4\n0\nnull\n5\n-1'},{stdin:'5\nLinkedList\naddLast -1\nget 0\ntoArray\nsize',expectedStdout:'null\nnull\n-1\n-1\n1'}], provenance:AUTHORED }),
  p({ slug:'linked-list-index-access', title:'Linked List Index Access', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['linked-list','indexing','traversal'], signatureId:'cls:linked-list', avgSolveSeconds:600,
    promptMarkdown:prompt('singly linked list', 'Use `addFirst` and `addLast` to place values, then answer zero-based `get(i)` requests by walking nodes. `get` returns `-1` for a negative or out-of-range index. Removing the first node must leave later indices shifted down by one.'),
    editorialMarkdown:editorial('Index means a walk', 'A linked list has no arithmetic address for index i. Begin at head and follow next exactly i times; if the link disappears first, the index is invalid. After removeFirst, head changes, so the former index one becomes index zero without moving values.', 'Adding and removing at the front and appending with a tail are O(1); get is O(i), worst-case O(n); storage is O(n).'), referenceSolution:linkedList,
    tests:[{stdin:'9\nLinkedList\naddLast 10\naddLast 20\naddLast 30\nget 0\nget 2\nremoveFirst\nget 0\nget 2',expectedStdout:'null\nnull\nnull\nnull\n10\n30\n10\n20\n-1',isSample:true},{stdin:'5\nLinkedList\naddFirst 7\nget -1\nget 1\nget 0',expectedStdout:'null\nnull\n-1\n-1\n7',isSample:true},{stdin:'8\nLinkedList\naddFirst 2\naddFirst 1\naddLast 3\nremoveFirst\nget 0\nget 1\ntoArray',expectedStdout:'null\nnull\nnull\nnull\n1\n2\n3\n2 3'},{stdin:'4\nLinkedList\nget 0\nremoveFirst\nsize',expectedStdout:'null\n-1\n-1\n0'}], provenance:AUTHORED }),
  p({ slug:'linked-list-reverse-build', title:'Linked List Reverse Build', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['linked-list','reversal','head-insertion'], signatureId:'cls:linked-list', avgSolveSeconds:660,
    promptMarkdown:prompt('singly linked list', 'There is no `reverse` method in this fixed interface. Reverse a sequence in place as it is built: each incoming `addFirst` becomes the new head. Use `toArray` to observe that the final list is in reverse insertion order; `removeFirst` then removes from that reversed front.'),
    editorialMarkdown:editorial('Head insertion reverses order', 'A new head points at the old head, so the most recently added first value is always first in the chain. Repeating that operation is the same core pointer move used by an in-place linked-list reversal: redirect one next link at a time.', 'Each addFirst and removeFirst is O(1); toArray is O(n); total storage is O(n).'), referenceSolution:linkedList,
    tests:[{stdin:'7\nLinkedList\naddFirst 1\naddFirst 2\naddFirst 3\ntoArray\nremoveFirst\ntoArray',expectedStdout:'null\nnull\nnull\nnull\n3 2 1\n3\n2 1',isSample:true},{stdin:'4\nLinkedList\naddFirst 9\ntoArray\nremoveFirst',expectedStdout:'null\nnull\n9\n9',isSample:true},{stdin:'8\nLinkedList\naddLast 1\naddFirst 2\naddFirst 3\naddLast 0\ntoArray\nget 2\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\n3 2 1 0\n1\n4'},{stdin:'3\nLinkedList\ntoArray\nremoveFirst',expectedStdout:'null\n\n-1'}], provenance:AUTHORED }),
  p({ slug:'linked-list-to-array-round-trip', title:'Linked List Array Round Trip', difficulty:'MEDIUM', tier:'TIER_0_5', patternFamily:'DATA_STRUCTURES', patternTags:['linked-list','traversal','serialization'], signatureId:'cls:linked-list', avgSolveSeconds:620,
    promptMarkdown:prompt('singly linked list', 'Build a list through both insertion methods, call `toArray`, then continue changing the list. `toArray` must walk the current nodes into a fresh ordered integer array; an empty list returns an empty array, printed as a blank output line.'),
    editorialMarkdown:editorial('Traverse without losing head', 'To create an array, use a temporary cursor beginning at head and follow next until null. Do not advance head itself while serializing: doing so appears to make toArray work once, but silently destroys the list for every later operation. The output must be a fresh collection, not internal node storage.', 'toArray visits every node, so it is O(n) time and O(n) output space. Insertions and removeFirst are O(1); the list itself is O(n).'), referenceSolution:linkedList,
    tests:[{stdin:'8\nLinkedList\naddLast 1\naddLast 2\ntoArray\naddFirst 0\ntoArray\nremoveFirst\ntoArray',expectedStdout:'null\nnull\nnull\n1 2\nnull\n0 1 2\n0\n1 2',isSample:true},{stdin:'3\nLinkedList\ntoArray\nsize',expectedStdout:'null\n\n0',isSample:true},{stdin:'9\nLinkedList\naddFirst 3\naddFirst 2\naddFirst 1\ntoArray\nremoveFirst\naddLast 4\ntoArray\nsize',expectedStdout:'null\nnull\nnull\nnull\n1 2 3\n1\nnull\n2 3 4\n3'},{stdin:'5\nLinkedList\naddLast -2\ntoArray\nget 0\nremoveFirst',expectedStdout:'null\nnull\n-2\n-2\n-2'}], provenance:AUTHORED }),
];
