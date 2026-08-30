import { AUTHORED, type ProblemDefinition } from '../problem.js';

/** Tier 0.5 — hash tables and eviction caches. */
const p = (d: ProblemDefinition): ProblemDefinition => d;

const hashMapChaining = {
  JAVASCRIPT: `class HashMap { constructor(){this.b=Array.from({length:8},()=>[]);this.n=0;} i(k){return ((k%this.b.length)+this.b.length)%this.b.length;} put(k,v){const a=this.b[this.i(k)];for(const q of a)if(q[0]===k){q[1]=v;return;}a.push([k,v]);this.n++;} get(k){for(const q of this.b[this.i(k)])if(q[0]===k)return q[1];return -1;} remove(k){const a=this.b[this.i(k)],i=a.findIndex(q=>q[0]===k);if(i>=0){a.splice(i,1);this.n--;}} containsKey(k){return this.get(k)!==-1;} size(){return this.n;} }`,
  TYPESCRIPT: `class HashMap { private b:number[][][]=Array.from({length:8},()=>[]); private n=0; private i(k:number):number{return ((k%this.b.length)+this.b.length)%this.b.length;} put(k:number,v:number):void{const a=this.b[this.i(k)];for(const q of a)if(q[0]===k){q[1]=v;return;}a.push([k,v]);this.n++;} get(k:number):number{for(const q of this.b[this.i(k)])if(q[0]===k)return q[1];return -1;} remove(k:number):void{const a=this.b[this.i(k)],i=a.findIndex(q=>q[0]===k);if(i>=0){a.splice(i,1);this.n--;}} containsKey(k:number):boolean{return this.get(k)!==-1;} size():number{return this.n;} }`,
  PYTHON: `class HashMap:
    def __init__(self): self.b=[[] for _ in range(8)];self.n=0
    def _i(self,k): return k%len(self.b)
    def put(self,k,v):
        a=self.b[self._i(k)]
        for q in a:
            if q[0]==k:q[1]=v;return
        a.append([k,v]);self.n+=1
    def get(self,k):
        for q in self.b[self._i(k)]:
            if q[0]==k:return q[1]
        return -1
    def remove(self,k):
        a=self.b[self._i(k)]
        for i,q in enumerate(a):
            if q[0]==k:a.pop(i);self.n-=1;return
    def containsKey(self,k): return self.get(k)!=-1
    def size(self): return self.n`,
  JAVA: `class HashMap { private ArrayList<int[]>[] b;private int n;@SuppressWarnings("unchecked") HashMap(){b=new ArrayList[8];for(int i=0;i<8;i++)b[i]=new ArrayList<>();}private int i(int k){return Math.floorMod(k,b.length);}public void put(int k,int v){for(int[]q:b[i(k)])if(q[0]==k){q[1]=v;return;}b[i(k)].add(new int[]{k,v});n++;}public int get(int k){for(int[]q:b[i(k)])if(q[0]==k)return q[1];return -1;}public void remove(int k){ArrayList<int[]>a=b[i(k)];for(int j=0;j<a.size();j++)if(a.get(j)[0]==k){a.remove(j);n--;return;}}public boolean containsKey(int k){return get(k)!=-1;}public int size(){return n;} }`,
  CPP: `class HashMap { vector<vector<pair<int,int>>> b;int n=0;int i(int k){return (k%(int)b.size()+(int)b.size())%(int)b.size();}public:HashMap():b(8){}void put(int k,int v){for(auto&q:b[i(k)])if(q.first==k){q.second=v;return;}b[i(k)].push_back({k,v});n++;}int get(int k){for(auto&q:b[i(k)])if(q.first==k)return q.second;return -1;}void remove(int k){auto&a=b[i(k)];for(int j=0;j<(int)a.size();j++)if(a[j].first==k){a.erase(a.begin()+j);n--;return;}}bool containsKey(int k){return get(k)!=-1;}int size(){return n;} };`,
  GO: `type pair struct{k,v int}
type HashMap struct{b [][]pair;n int}
func Constructor() HashMap{return HashMap{b:make([][]pair,8)}}
func(h *HashMap) i(k int)int{r:=k%len(h.b);if r<0{r+=len(h.b)};return r}
func(h *HashMap) Put(k int,v int){a:=h.i(k);for j:=range h.b[a]{if h.b[a][j].k==k{h.b[a][j].v=v;return}};h.b[a]=append(h.b[a],pair{k,v});h.n++}
func(h *HashMap) Get(k int)int{for _,q:=range h.b[h.i(k)]{if q.k==k{return q.v}};return -1}
func(h *HashMap) Remove(k int){a:=h.i(k);for j,q:=range h.b[a]{if q.k==k{h.b[a]=append(h.b[a][:j],h.b[a][j+1:]...);h.n--;return}}}
func(h *HashMap) ContainsKey(k int)bool{return h.Get(k)!=-1}
func(h *HashMap) Size()int{return h.n}`,
};

const hashMapOpen = {
  JAVASCRIPT: `class HashMap { constructor(){this.k=new Array(17);this.v=new Array(17);this.n=0;} i(x){return ((x%this.k.length)+this.k.length)%this.k.length;} find(x){let i=this.i(x);while(this.k[i]!==undefined&&this.k[i]!==x)i=(i+1)%this.k.length;return i;} put(x,v){const i=this.find(x);if(this.k[i]===undefined){this.k[i]=x;this.n++;}this.v[i]=v;} get(x){const i=this.find(x);return this.k[i]===x?this.v[i]:-1;} remove(x){const i=this.find(x);if(this.k[i]===x){this.k[i]=undefined;this.v[i]=undefined;this.n--;let j=(i+1)%this.k.length;while(this.k[j]!==undefined){const a=this.k[j],b=this.v[j];this.k[j]=undefined;this.n--;this.put(a,b);j=(j+1)%this.k.length;}}} containsKey(x){return this.get(x)!==-1;} size(){return this.n;} }`,
  TYPESCRIPT: `class HashMap { private k:(number|undefined)[]=new Array(17);private v:(number|undefined)[]=new Array(17);private n=0;private i(x:number):number{return ((x%this.k.length)+this.k.length)%this.k.length;}private find(x:number):number{let i=this.i(x);while(this.k[i]!==undefined&&this.k[i]!==x)i=(i+1)%this.k.length;return i;}put(x:number,v:number):void{const i=this.find(x);if(this.k[i]===undefined){this.k[i]=x;this.n++;}this.v[i]=v;}get(x:number):number{const i=this.find(x);return this.k[i]===x?this.v[i] as number:-1;}remove(x:number):void{const i=this.find(x);if(this.k[i]===x){this.k[i]=undefined;this.v[i]=undefined;this.n--;let j=(i+1)%this.k.length;while(this.k[j]!==undefined){const a=this.k[j] as number,b=this.v[j] as number;this.k[j]=undefined;this.n--;this.put(a,b);j=(j+1)%this.k.length;}}}containsKey(x:number):boolean{return this.get(x)!==-1;}size():number{return this.n;} }`,
  PYTHON: `class HashMap:
    def __init__(self): self.k=[None]*17;self.v=[0]*17;self.n=0
    def _i(self,x): return x%len(self.k)
    def _find(self,x):
        i=self._i(x)
        while self.k[i] is not None and self.k[i]!=x:i=(i+1)%len(self.k)
        return i
    def put(self,x,v):
        i=self._find(x)
        if self.k[i] is None:self.k[i]=x;self.n+=1
        self.v[i]=v
    def get(self,x):
        i=self._find(x);return self.v[i] if self.k[i]==x else -1
    def remove(self,x):
        i=self._find(x)
        if self.k[i]==x:
            self.k[i]=None;self.n-=1;j=(i+1)%len(self.k)
            while self.k[j] is not None:
                a,b=self.k[j],self.v[j];self.k[j]=None;self.n-=1;self.put(a,b);j=(j+1)%len(self.k)
    def containsKey(self,x): return self.get(x)!=-1
    def size(self): return self.n`,
  JAVA: `class HashMap {private Integer[]k=new Integer[17],v=new Integer[17];private int n;private int i(int x){return Math.floorMod(x,k.length);}private int find(int x){int j=i(x);while(k[j]!=null&&k[j]!=x)j=(j+1)%k.length;return j;}public void put(int x,int y){int j=find(x);if(k[j]==null){k[j]=x;n++;}v[j]=y;}public int get(int x){int j=find(x);return k[j]!=null&&k[j]==x?v[j]:-1;}public void remove(int x){int j=find(x);if(k[j]!=null&&k[j]==x){k[j]=null;n--;j=(j+1)%k.length;while(k[j]!=null){int a=k[j],b=v[j];k[j]=null;n--;put(a,b);j=(j+1)%k.length;}}}public boolean containsKey(int x){return get(x)!=-1;}public int size(){return n;}}`,
  CPP: `class HashMap {vector<int>k,v;vector<bool>used;int n=0;int i(int x){return (x%(int)k.size()+(int)k.size())%(int)k.size();}int find(int x){int j=i(x);while(used[j]&&k[j]!=x)j=(j+1)%k.size();return j;}public:HashMap():k(17),v(17),used(17){}void put(int x,int y){int j=find(x);if(!used[j]){used[j]=true;k[j]=x;n++;}v[j]=y;}int get(int x){int j=find(x);return used[j]&&k[j]==x?v[j]:-1;}void remove(int x){int j=find(x);if(used[j]&&k[j]==x){used[j]=false;n--;j=(j+1)%k.size();while(used[j]){int a=k[j],b=v[j];used[j]=false;n--;put(a,b);j=(j+1)%k.size();}}}bool containsKey(int x){return get(x)!=-1;}int size(){return n;}};`,
  GO: `type HashMap struct{k,v []int;used []bool;n int}
func Constructor() HashMap{return HashMap{k:make([]int,17),v:make([]int,17),used:make([]bool,17)}}
func(h *HashMap)i(x int)int{r:=x%len(h.k);if r<0{r+=len(h.k)};return r}
func(h *HashMap)find(x int)int{j:=h.i(x);for h.used[j]&&h.k[j]!=x{j=(j+1)%len(h.k)};return j}
func(h *HashMap)Put(x int,y int){j:=h.find(x);if !h.used[j]{h.used[j]=true;h.k[j]=x;h.n++};h.v[j]=y}
func(h *HashMap)Get(x int)int{j:=h.find(x);if h.used[j]&&h.k[j]==x{return h.v[j]};return -1}
func(h *HashMap)Remove(x int){j:=h.find(x);if h.used[j]&&h.k[j]==x{h.used[j]=false;h.n--;j=(j+1)%len(h.k);for h.used[j]{a,b:=h.k[j],h.v[j];h.used[j]=false;h.n--;h.Put(a,b);j=(j+1)%len(h.k)}}}
func(h *HashMap)ContainsKey(x int)bool{return h.Get(x)!=-1}
func(h *HashMap)Size()int{return h.n}`,
};

const hashMapTombstone = hashMapOpen;
const hashMapResize = {
  JAVASCRIPT: `class HashMap {constructor(){this.b=Array.from({length:4},()=>[]);this.n=0;}i(k){return ((k%this.b.length)+this.b.length)%this.b.length;}grow(){const old=this.b;this.b=Array.from({length:old.length*2},()=>[]);for(const a of old)for(const q of a)this.b[this.i(q[0])].push(q);}put(k,v){const a=this.b[this.i(k)];for(const q of a)if(q[0]===k){q[1]=v;return;}if((this.n+1)/this.b.length>.75){this.grow();return this.put(k,v);}this.b[this.i(k)].push([k,v]);this.n++;}get(k){for(const q of this.b[this.i(k)])if(q[0]===k)return q[1];return -1;}remove(k){const a=this.b[this.i(k)],j=a.findIndex(q=>q[0]===k);if(j>=0){a.splice(j,1);this.n--;}}containsKey(k){return this.get(k)!==-1;}size(){return this.n;}}`,
  TYPESCRIPT: `class HashMap {private b:number[][][]=Array.from({length:4},()=>[]);private n=0;private i(k:number):number{return ((k%this.b.length)+this.b.length)%this.b.length;}private grow():void{const old=this.b;this.b=Array.from({length:old.length*2},()=>[]);for(const a of old)for(const q of a)this.b[this.i(q[0])].push(q);}put(k:number,v:number):void{const a=this.b[this.i(k)];for(const q of a)if(q[0]===k){q[1]=v;return;}if((this.n+1)/this.b.length>.75){this.grow();return this.put(k,v);}this.b[this.i(k)].push([k,v]);this.n++;}get(k:number):number{for(const q of this.b[this.i(k)])if(q[0]===k)return q[1];return -1;}remove(k:number):void{const a=this.b[this.i(k)],j=a.findIndex(q=>q[0]===k);if(j>=0){a.splice(j,1);this.n--;}}containsKey(k:number):boolean{return this.get(k)!==-1;}size():number{return this.n;}}`,
  PYTHON: `class HashMap:
    def __init__(self):self.b=[[] for _ in range(4)];self.n=0
    def _i(self,k):return k%len(self.b)
    def _grow(self):
        old=self.b;self.b=[[] for _ in range(len(old)*2)]
        for a in old:
            for q in a:self.b[self._i(q[0])].append(q)
    def put(self,k,v):
        a=self.b[self._i(k)]
        for q in a:
            if q[0]==k:q[1]=v;return
        if (self.n+1)/len(self.b)>.75:self._grow();return self.put(k,v)
        self.b[self._i(k)].append([k,v]);self.n+=1
    def get(self,k):
        for q in self.b[self._i(k)]:
            if q[0]==k:return q[1]
        return -1
    def remove(self,k):
        a=self.b[self._i(k)]
        for i,q in enumerate(a):
            if q[0]==k:a.pop(i);self.n-=1;return
    def containsKey(self,k):return self.get(k)!=-1
    def size(self):return self.n`,
  JAVA: `class HashMap {private ArrayList<int[]>[]b;private int n;@SuppressWarnings("unchecked")HashMap(){b=new ArrayList[4];for(int i=0;i<4;i++)b[i]=new ArrayList<>();}private int i(int k){return Math.floorMod(k,b.length);}@SuppressWarnings("unchecked")private void grow(){ArrayList<int[]>[]old=b;b=new ArrayList[old.length*2];for(int i=0;i<b.length;i++)b[i]=new ArrayList<>();for(ArrayList<int[]>a:old)for(int[]q:a)b[i(q[0])].add(q);}public void put(int k,int v){for(int[]q:b[i(k)])if(q[0]==k){q[1]=v;return;}if((n+1)*4>b.length*3){grow();put(k,v);return;}b[i(k)].add(new int[]{k,v});n++;}public int get(int k){for(int[]q:b[i(k)])if(q[0]==k)return q[1];return -1;}public void remove(int k){ArrayList<int[]>a=b[i(k)];for(int j=0;j<a.size();j++)if(a.get(j)[0]==k){a.remove(j);n--;return;}}public boolean containsKey(int k){return get(k)!=-1;}public int size(){return n;}}`,
  CPP: `class HashMap {vector<vector<pair<int,int>>>b;int n=0;int i(int k){return (k%(int)b.size()+(int)b.size())%(int)b.size();}void grow(){auto old=b;b.assign(old.size()*2,{});for(auto&a:old)for(auto&q:a)b[i(q.first)].push_back(q);}public:HashMap():b(4){}void put(int k,int v){for(auto&q:b[i(k)])if(q.first==k){q.second=v;return;}if((n+1)*4>(int)b.size()*3){grow();put(k,v);return;}b[i(k)].push_back({k,v});n++;}int get(int k){for(auto&q:b[i(k)])if(q.first==k)return q.second;return -1;}void remove(int k){auto&a=b[i(k)];for(int j=0;j<(int)a.size();j++)if(a[j].first==k){a.erase(a.begin()+j);n--;return;}}bool containsKey(int k){return get(k)!=-1;}int size(){return n;}};`,
  GO: `type pair struct{k,v int}
type HashMap struct{b [][]pair;n int}
func Constructor() HashMap{return HashMap{b:make([][]pair,4)}}
func(h *HashMap)i(k int)int{r:=k%len(h.b);if r<0{r+=len(h.b)};return r}
func(h *HashMap)grow(){old:=h.b;h.b=make([][]pair,len(old)*2);for _,a:=range old{for _,q:=range a{j:=h.i(q.k);h.b[j]=append(h.b[j],q)}}}
func(h *HashMap)Put(k int,v int){for j:=range h.b[h.i(k)]{if h.b[h.i(k)][j].k==k{h.b[h.i(k)][j].v=v;return}};if (h.n+1)*4>len(h.b)*3{h.grow();h.Put(k,v);return};j:=h.i(k);h.b[j]=append(h.b[j],pair{k,v});h.n++}
func(h *HashMap)Get(k int)int{for _,q:=range h.b[h.i(k)]{if q.k==k{return q.v}};return -1}
func(h *HashMap)Remove(k int){j:=h.i(k);for x,q:=range h.b[j]{if q.k==k{h.b[j]=append(h.b[j][:x],h.b[j][x+1:]...);h.n--;return}}}
func(h *HashMap)ContainsKey(k int)bool{return h.Get(k)!=-1}
func(h *HashMap)Size()int{return h.n}`,
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

const lruCache = {
  JAVASCRIPT: `class LRUCache {constructor(c){this.c=c;this.m=new Map();}get(k){if(!this.m.has(k))return -1;const v=this.m.get(k);this.m.delete(k);this.m.set(k,v);return v;}put(k,v){if(this.m.has(k))this.m.delete(k);this.m.set(k,v);if(this.m.size>this.c)this.m.delete(this.m.keys().next().value);}}`,
  TYPESCRIPT: `class LRUCache {private c:number;private m=new Map<number,number>();constructor(c:number){this.c=c;}get(k:number):number{if(!this.m.has(k))return -1;const v=this.m.get(k)!;this.m.delete(k);this.m.set(k,v);return v;}put(k:number,v:number):void{if(this.m.has(k))this.m.delete(k);this.m.set(k,v);if(this.m.size>this.c)this.m.delete(this.m.keys().next().value!);}}`,
  PYTHON: `class LRUCache:
    def __init__(self,c):self.c=c;self.m={}
    def get(self,k):
        if k not in self.m:return -1
        v=self.m.pop(k);self.m[k]=v;return v
    def put(self,k,v):
        if k in self.m:self.m.pop(k)
        self.m[k]=v
        if len(self.m)>self.c:self.m.pop(next(iter(self.m)))`,
  JAVA: `class LRUCache {private int c;private LinkedHashMap<Integer,Integer>m=new LinkedHashMap<>(16,.75f,true);LRUCache(int c){this.c=c;}public int get(int k){return m.getOrDefault(k,-1);}public void put(int k,int v){m.put(k,v);if(m.size()>c)m.remove(m.keySet().iterator().next());}}`,
  CPP: `class LRUCache {int c;list<pair<int,int>>q;unordered_map<int,list<pair<int,int>>::iterator>m;public:LRUCache(int c):c(c){}int get(int k){if(!m.count(k))return -1;q.splice(q.end(),q,m[k]);return m[k]->second;}void put(int k,int v){if(m.count(k)){m[k]->second=v;q.splice(q.end(),q,m[k]);}else{q.push_back({k,v});m[k]=prev(q.end());if((int)q.size()>c){m.erase(q.begin()->first);q.pop_front();}}}};`,
  GO: `type LRUCache struct{c int;m map[int]int;order []int}
func Constructor(c int) LRUCache{return LRUCache{c:c,m:map[int]int{}}}
func(l *LRUCache)touch(k int){for i,x:=range l.order{if x==k{l.order=append(l.order[:i],l.order[i+1:]...);break}};l.order=append(l.order,k)}
func(l *LRUCache)Get(k int)int{v,ok:=l.m[k];if !ok{return -1};l.touch(k);return v}
func(l *LRUCache)Put(k int,v int){if l.c==0{return};if _,ok:=l.m[k];!ok&&len(l.m)==l.c{delete(l.m,l.order[0]);l.order=l.order[1:]};l.m[k]=v;l.touch(k)}`,
};

const lfuCache = {
  JAVASCRIPT: `class LFUCache {constructor(c){this.c=c;this.m=new Map();this.t=0;}get(k){const q=this.m.get(k);if(!q)return -1;q.f++;q.t=++this.t;return q.v;}put(k,v){if(!this.c)return;const q=this.m.get(k);if(q){q.v=v;q.f++;q.t=++this.t;return;}if(this.m.size===this.c){let z;for(const [a,b] of this.m)if(!z||b.f<z[1].f||b.f===z[1].f&&b.t<z[1].t)z=[a,b];this.m.delete(z[0]);}this.m.set(k,{v,f:1,t:++this.t});}}`,
  TYPESCRIPT: `class LFUCache {private c:number;private m=new Map<number,{v:number;f:number;t:number}>();private t=0;constructor(c:number){this.c=c;}get(k:number):number{const q=this.m.get(k);if(!q)return -1;q.f++;q.t=++this.t;return q.v;}put(k:number,v:number):void{if(!this.c)return;const q=this.m.get(k);if(q){q.v=v;q.f++;q.t=++this.t;return;}if(this.m.size===this.c){let z: number|undefined;for(const [a,b] of this.m)if(z===undefined||b.f<this.m.get(z)!.f||b.f===this.m.get(z)!.f&&b.t<this.m.get(z)!.t)z=a;this.m.delete(z!);}this.m.set(k,{v,f:1,t:++this.t});}}`,
  PYTHON: `class LFUCache:
    def __init__(self,c):self.c=c;self.m={};self.t=0
    def get(self,k):
        if k not in self.m:return -1
        q=self.m[k];q[1]+=1;self.t+=1;q[2]=self.t;return q[0]
    def put(self,k,v):
        if not self.c:return
        if k in self.m:
            q=self.m[k];q[0]=v;q[1]+=1;self.t+=1;q[2]=self.t;return
        if len(self.m)==self.c:del self.m[min(self.m,key=lambda x:(self.m[x][1],self.m[x][2]))]
        self.t+=1;self.m[k]=[v,1,self.t]`,
  JAVA: `class LFUCache {static class N{int v,f,t;N(int v,int t){this.v=v;f=1;this.t=t;}}int c,t;HashMap<Integer,N>m=new HashMap<>();LFUCache(int c){this.c=c;}public int get(int k){N q=m.get(k);if(q==null)return -1;q.f++;q.t=++t;return q.v;}public void put(int k,int v){if(c==0)return;N q=m.get(k);if(q!=null){q.v=v;q.f++;q.t=++t;return;}if(m.size()==c){int z=0;N best=null;for(var e:m.entrySet())if(best==null||e.getValue().f<best.f||e.getValue().f==best.f&&e.getValue().t<best.t){z=e.getKey();best=e.getValue();}m.remove(z);}m.put(k,new N(v,++t));}}`,
  CPP: `class LFUCache {struct N{int v,f,t;};int c,t=0;unordered_map<int,N>m;public:LFUCache(int c):c(c){}int get(int k){if(!m.count(k))return -1;auto&q=m[k];q.f++;q.t=++t;return q.v;}void put(int k,int v){if(!c)return;if(m.count(k)){auto&q=m[k];q.v=v;q.f++;q.t=++t;return;}if((int)m.size()==c){int z=-1;for(auto&e:m)if(z<0||e.second.f<m[z].f||(e.second.f==m[z].f&&e.second.t<m[z].t))z=e.first;m.erase(z);}m[k]={v,1,++t};}};`,
  GO: `type lfuNode struct{v,f,t int}
type LFUCache struct{c,t int;m map[int]lfuNode}
func Constructor(c int) LFUCache{return LFUCache{c:c,m:map[int]lfuNode{}}}
func(l *LFUCache)Get(k int)int{q,ok:=l.m[k];if !ok{return -1};q.f++;l.t++;q.t=l.t;l.m[k]=q;return q.v}
func(l *LFUCache)Put(k int,v int){if l.c==0{return};if q,ok:=l.m[k];ok{q.v=v;q.f++;l.t++;q.t=l.t;l.m[k]=q;return};if len(l.m)==l.c{first:=true;z:=0;for a,q:=range l.m{if first||q.f<l.m[z].f||(q.f==l.m[z].f&&q.t<l.m[z].t){z=a;first=false}};delete(l.m,z)};l.t++;l.m[k]=lfuNode{v,1,l.t}}`,
};

const prompt = (name: string, text: string) => [
  `Implement a ${name} yourself; do not use your language's built-in ${name.toLowerCase()} type.`, '', text, '',
  '**Operation log**', '', 'The first operation is the constructor. Print `null` for it and for every void method. Every other operation prints its return value.', '',
  'A missing key read by `get` returns `-1`.',
].join('\n');

const editorial = (heading: string, body: string, complexity: string) => [
  `## ${heading}`, '', body, '',
  'The quiet mistake is confusing an empty bucket or slot with proof that a key was never present. Collisions and deletion make that assumption dangerous: preserve the search path and update the stored count only when a key is actually inserted or removed.', '',
  complexity,
].join('\n');

export const TIER_05_HASHING_PROBLEMS: ProblemDefinition[] = [
  p({slug:'hash-map-separate-chaining',title:'Hash Map with Separate Chaining',difficulty:'EASY',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-map','separate-chaining','collisions'],signatureId:'cls:hash-map',avgSolveSeconds:480,
    promptMarkdown:prompt('hash map','Build `HashMap` with an array of buckets. Each bucket is a small list of key/value pairs. `put` inserts or replaces, `get` returns a value or `-1` for a missing key, `remove` is void, and `containsKey` and `size` describe the map. Keys that land in one bucket must coexist.'),
    editorialMarkdown:editorial('Separate chaining','Hash the key to one bucket, then scan only that bucket for the matching key. A collision is normal: different keys share a bucket but remain distinct pairs. Replace rather than append when the key already exists, or size silently becomes wrong.','With a bounded load factor, bucket scans are expected O(1), so operations are O(1) amortised; worst-case collision chains are O(n). Storage is O(n).'),referenceSolution:hashMapChaining,
    tests:[{stdin:'8\nHashMap\nput 1 10\nput 9 90\nget 1\nget 9\ncontainsKey 2\nsize\nremove 1',expectedStdout:'null\nnull\nnull\n10\n90\nfalse\n2\nnull',isSample:true},{stdin:'7\nHashMap\nput -1 4\nget -1\nput -1 5\nget -1\nsize\ncontainsKey -1',expectedStdout:'null\nnull\n4\nnull\n5\n1\ntrue',isSample:true},{stdin:'7\nHashMap\nremove 3\nget 3\ncontainsKey 3\nsize\nput 3 0\nget 3',expectedStdout:'null\nnull\n-1\nfalse\n0\nnull\n0'},{stdin:'8\nHashMap\nput 0 1\nput 8 2\nremove 0\nget 8\ncontainsKey 0\nsize\nget 0',expectedStdout:'null\nnull\nnull\nnull\n2\nfalse\n1\n-1'}],provenance:AUTHORED}),
  p({slug:'hash-map-linear-probing',title:'Hash Map with Linear Probing',difficulty:'MEDIUM',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-map','open-addressing','linear-probing'],signatureId:'cls:hash-map',avgSolveSeconds:720,
    promptMarkdown:prompt('hash map','Build `HashMap` with open addressing and linear probing, not bucket lists. When a home slot is occupied by another key, keep checking the next circular slot. `get` returns `-1` when the key is missing. The supplied logs keep the table below capacity.'),
    editorialMarkdown:editorial('Probe to the next slot','A key begins at its hash index. If another key owns that slot, linear probing walks forward until it finds the key or an unused slot. This gives expected O(1) amortised access when the load factor stays bounded. The quiet mistake is stopping at the collided home slot instead of following the probe sequence.','put, get, remove, containsKey, and size are expected O(1) amortised with bounded load factor; a long cluster can make one operation O(n). Space is O(n).'),referenceSolution:hashMapOpen,
    tests:[{stdin:'8\nHashMap\nput 1 10\nput 18 20\nget 18\ncontainsKey 1\nsize\nremove 1\nget 18',expectedStdout:'null\nnull\nnull\n20\ntrue\n2\nnull\n20',isSample:true},{stdin:'7\nHashMap\nput -1 7\nput 16 8\nget -1\nget 16\nsize\ncontainsKey 3',expectedStdout:'null\nnull\nnull\n7\n8\n2\nfalse',isSample:true},{stdin:'9\nHashMap\nput 0 1\nput 17 2\nput 34 3\nget 34\nput 17 9\nget 17\nsize\nget 0',expectedStdout:'null\nnull\nnull\nnull\n3\nnull\n9\n3\n1'},{stdin:'5\nHashMap\nget 4\nremove 4\ncontainsKey 4\nsize',expectedStdout:'null\n-1\nnull\nfalse\n0'}],provenance:AUTHORED}),
  p({slug:'hash-map-delete-probe-chain',title:'Hash Map Deletion in a Probe Chain',difficulty:'HARD',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-map','open-addressing','deletion','tombstones'],signatureId:'cls:hash-map',avgSolveSeconds:1080,
    promptMarkdown:prompt('hash map','Use linear probing, then remove a key from the middle of a collision cluster. Later collided keys must remain findable; `get` returns `-1` only for a truly missing key. You may use tombstones or repair the following probe run by reinserting its entries.'),
    editorialMarkdown:editorial('Deletion preserves a probe path','Open addressing relies on a continuous search path. Clearing a removed slot outright makes a later collided key look absent, which is the quiet tombstone problem. Leave a tombstone and probe past it, or reinsert the following run so every surviving key is reachable from its home slot. Expected work remains O(1) amortised under a bounded load factor.','put, get, remove, and containsKey are expected O(1) amortised and O(n) in a pathological cluster; size is O(1), with O(n) storage.'),referenceSolution:hashMapTombstone,
    tests:[{stdin:'9\nHashMap\nput 1 10\nput 18 20\nput 35 30\nremove 18\nget 35\nget 1\ncontainsKey 18\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\n30\n10\nfalse\n2',isSample:true},{stdin:'10\nHashMap\nput 0 1\nput 17 2\nput 34 3\nremove 0\nget 17\nget 34\nput 51 4\nget 51\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\n2\n3\nnull\n4\n3',isSample:true},{stdin:'7\nHashMap\nput 5 1\nremove 5\nget 5\nput 5 2\nget 5\nsize',expectedStdout:'null\nnull\nnull\n-1\nnull\n2\n1'},{stdin:'8\nHashMap\nput -1 1\nput 16 2\nremove -1\nget 16\ncontainsKey -1\nremove 16\nsize',expectedStdout:'null\nnull\nnull\nnull\n2\nfalse\nnull\n0'}],provenance:AUTHORED}),
  p({slug:'hash-map-resize-rehash',title:'Hash Map Resize and Rehash',difficulty:'HARD',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-map','resizing','rehashing','load-factor'],signatureId:'cls:hash-map',avgSolveSeconds:1140,
    promptMarkdown:prompt('hash map','Build a separate-chaining `HashMap` that grows when its load factor becomes too high. On resize, allocate more buckets and rehash every existing pair using the new bucket count. `get` returns `-1` for a missing key; replacing an existing key must not trigger an extra size increase.'),
    editorialMarkdown:editorial('Resize then rehash','A bucket index depends on the number of buckets, so copying old buckets into a larger array is wrong. Reinsert every stored pair with the new modulus. Doubling occasionally costs O(n), but each resize is separated by many inserts, making insertion expected O(1) amortised. The quiet mistake is resizing on an update rather than only on a new key.','put is expected O(1) amortised including rehashing; get, remove, and containsKey are expected O(1), with O(n) worst case. Storage is O(n).'),referenceSolution:hashMapResize,
    tests:[{stdin:'12\nHashMap\nput 0 0\nput 1 10\nput 2 20\nput 3 30\nput 4 40\nput 5 50\nget 0\nget 5\nsize\ncontainsKey 6\nget 6',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\nnull\n0\n50\n6\nfalse\n-1',isSample:true},{stdin:'9\nHashMap\nput 1 1\nput 9 9\nput 17 17\nput 25 25\nput 33 33\nget 33\nsize\nget 9',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\n33\n5\n9',isSample:true},{stdin:'8\nHashMap\nput 2 1\nput 2 2\nput 2 3\nsize\nget 2\nremove 2\nsize',expectedStdout:'null\nnull\nnull\nnull\n1\n3\nnull\n0'},{stdin:'7\nHashMap\nput -8 1\nput -16 2\nget -8\nremove -16\ncontainsKey -16\nsize',expectedStdout:'null\nnull\nnull\n1\nnull\nfalse\n1'}],provenance:AUTHORED}),
  p({slug:'hash-set-basics',title:'Hash Set Basics',difficulty:'EASY',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-set','uniqueness','buckets'],signatureId:'cls:hash-set',avgSolveSeconds:420,
    promptMarkdown:prompt('hash set','Build `HashSet` over buckets. `add` stores an integer once, `contains` reports membership, `remove` is void, and `size` counts unique values. Adding a duplicate does nothing.'),
    editorialMarkdown:editorial('A map without values','A hash set uses the same hash-to-bucket pattern as a map, but each bucket holds values rather than pairs. Scan the bucket before adding so a duplicate does not alter size. Hashing keeps the expected bucket short, giving O(1) amortised operations; the quiet mistake is counting repeated adds.','add, contains, and remove are expected O(1) amortised with bounded load factor, O(n) in a worst collision chain; size is O(1), and space is O(n).'),referenceSolution:hashSet,
    tests:[{stdin:'7\nHashSet\nadd 4\nadd 4\ncontains 4\nsize\nremove 4\ncontains 4',expectedStdout:'null\nnull\nnull\ntrue\n1\nnull\nfalse',isSample:true},{stdin:'5\nHashSet\ncontains 2\nremove 2\nsize\nadd -1',expectedStdout:'null\nfalse\nnull\n0\nnull',isSample:true},{stdin:'8\nHashSet\nadd 1\nadd 2\nremove 1\nadd 1\ncontains 1\ncontains 2\nsize',expectedStdout:'null\nnull\nnull\nnull\nnull\ntrue\ntrue\n2'},{stdin:'4\nHashSet\nadd 0\nremove 0\nsize',expectedStdout:'null\nnull\nnull\n0'}],provenance:AUTHORED}),
  p({slug:'hash-set-collision-buckets',title:'Hash Set Collision Buckets',difficulty:'MEDIUM',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['hash-set','collisions','separate-chaining'],signatureId:'cls:hash-set',avgSolveSeconds:660,
    promptMarkdown:prompt('hash set','Implement `HashSet` so integers with the same bucket index remain independently stored. The logs deliberately use colliding keys. Removing one collided key must not remove its neighbors; `contains` must check the entire bucket.'),
    editorialMarkdown:editorial('Collision buckets retain every key','A collision means keys share a bucket index, not that they are equal. Store a small bucket list and compare actual values when adding, finding, and removing. The quiet mistake is treating the bucket as one value, which passes non-collision tests but loses neighbors. With controlled load factor the average bucket stays small, so operations are O(1) amortised.','add, contains, and remove are expected O(1) amortised, O(n) in one long bucket; size is O(1) and storage is O(n).'),referenceSolution:hashSet,
    tests:[{stdin:'8\nHashSet\nadd 1\nadd 9\nadd 17\nremove 9\ncontains 1\ncontains 9\ncontains 17',expectedStdout:'null\nnull\nnull\nnull\nnull\ntrue\nfalse\ntrue',isSample:true},{stdin:'8\nHashSet\nadd -1\nadd 7\nadd 15\ncontains -1\nremove 7\ncontains 15\nsize',expectedStdout:'null\nnull\nnull\nnull\ntrue\nnull\ntrue\n2',isSample:true},{stdin:'7\nHashSet\nadd 0\nadd 8\nadd 16\nremove 0\nremove 16\ncontains 8',expectedStdout:'null\nnull\nnull\nnull\nnull\nnull\ntrue'},{stdin:'6\nHashSet\nadd 3\nadd 11\nadd 3\nsize\ncontains 11',expectedStdout:'null\nnull\nnull\nnull\n2\ntrue'}],provenance:AUTHORED}),
  p({slug:'lru-cache-eviction',title:'Capacity-Bounded LRU Cache',difficulty:'MEDIUM',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['lru-cache','recency','eviction'],signatureId:'cls:lru-cache',avgSolveSeconds:840,
    promptMarkdown:prompt('capacity-bounded LRU cache','Build `LRUCache(capacity)`. `put` stores a key/value pair; when full, inserting a new key evicts the least recently used key. `get` returns its value or `-1` for a missing key and makes a found key most recently used.'),
    editorialMarkdown:editorial('Hash lookup plus recency order','Use a hash lookup and an ordered recency list/map. Every get and put moves its key to the recent end; overflow removes the old end. That move is essential: the quiet mistake is reading without promotion, which chooses the wrong later eviction. Hashing and constant-time list moves make operations O(1) amortised.','get and put are O(1) amortised with a hash map plus linked order; capacity-sized storage is O(capacity).'),referenceSolution:lruCache,
    tests:[{stdin:'8\nLRUCache 2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3\nget 1',expectedStdout:'null\nnull\nnull\n1\nnull\n-1\n3\n1',isSample:true},{stdin:'8\nLRUCache 2\nput 1 1\nput 2 2\nget 2\nput 3 3\nget 1\nget 2\nget 3',expectedStdout:'null\nnull\nnull\n2\nnull\n-1\n2\n3',isSample:true},{stdin:'6\nLRUCache 1\nput 1 1\nput 2 2\nget 1\nget 2\nput 2 9',expectedStdout:'null\nnull\nnull\n-1\n2\nnull'},{stdin:'5\nLRUCache 0\nput 1 1\nget 1\nput 2 2\nget 2',expectedStdout:'null\nnull\n-1\nnull\n-1'}],provenance:AUTHORED}),
  p({slug:'lru-cache-get-promotes',title:'LRU Cache Get Promotes',difficulty:'MEDIUM',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['lru-cache','promotion','eviction'],signatureId:'cls:lru-cache',avgSolveSeconds:900,
    promptMarkdown:prompt('capacity-bounded LRU cache','Implement `LRUCache(capacity)` for traces where `get` must PROMOTE a key to most recently used. `get` returns `-1` for a missing key. Updating an existing key also promotes it; a new key beyond capacity evicts the least recently used key.'),
    editorialMarkdown:editorial('Promotion changes the next eviction','Recency is an ordering invariant, not an optional counter. Touching a key with get removes it from its old position and appends it as newest, so the other key becomes eviction candidate. The quiet mistake is returning the value but leaving order unchanged. A hash map locates nodes and a linked order moves them in O(1) amortised time.','Both get and put are O(1) amortised; the hash table and recency list store O(capacity) entries.'),referenceSolution:lruCache,
    tests:[{stdin:'8\nLRUCache 2\nput 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 1\nget 3',expectedStdout:'null\nnull\nnull\n10\nnull\n-1\n10\n30',isSample:true},{stdin:'8\nLRUCache 2\nput 1 1\nput 2 2\nput 1 9\nput 3 3\nget 2\nget 1\nget 3',expectedStdout:'null\nnull\nnull\nnull\nnull\n-1\n9\n3',isSample:true},{stdin:'7\nLRUCache 3\nput 1 1\nput 2 2\nput 3 3\nget 1\nput 4 4\nget 2',expectedStdout:'null\nnull\nnull\nnull\n1\nnull\n-1'},{stdin:'4\nLRUCache 1\nget 9\nput 9 8\nget 9',expectedStdout:'null\n-1\nnull\n8'}],provenance:AUTHORED}),
  p({slug:'lfu-cache-recency-tiebreak',title:'LFU Cache with Recency Tie-Break',difficulty:'HARD',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['lfu-cache','frequency','recency','eviction'],signatureId:'cls:lfu-cache',avgSolveSeconds:1200,
    promptMarkdown:prompt('capacity-bounded LFU cache','Build `LFUCache(capacity)`. `get` returns a value or `-1` for a missing key and increases that key’s frequency. When a new key needs room, evict the lowest-frequency key; if frequencies tie, evict the least recently used among that tie. Updating with `put` also counts as a use.'),
    editorialMarkdown:editorial('Frequency buckets with recency tie-break','LFU first compares usage frequency, then recency among equal frequencies. Track each entry’s frequency and its latest use order; eviction selects the smallest pair. The quiet mistake is evicting an arbitrary equal-frequency key, which fails only on a tied trace. A production frequency-bucket design keeps hash lookups and moves O(1) amortised.','With hash maps and per-frequency recency lists, get and put are O(1) amortised; storage is O(capacity).'),referenceSolution:lfuCache,
    tests:[{stdin:'9\nLFUCache 2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3\nput 4 4\nget 1',expectedStdout:'null\nnull\nnull\n1\nnull\n-1\n3\nnull\n-1',isSample:true},{stdin:'8\nLFUCache 2\nput 1 1\nput 2 2\nget 1\nget 2\nput 3 3\nget 1\nget 3',expectedStdout:'null\nnull\nnull\n1\n2\nnull\n-1\n3',isSample:true},{stdin:'7\nLFUCache 1\nput 1 1\nput 1 9\nput 2 2\nget 1\nget 2\nput 2 3',expectedStdout:'null\nnull\nnull\nnull\n-1\n2\nnull'},{stdin:'5\nLFUCache 0\nput 1 1\nget 1\nput 2 2\nget 2',expectedStdout:'null\nnull\n-1\nnull\n-1'}],provenance:AUTHORED}),
  p({slug:'lfu-cache-eviction-order',title:'LFU Cache Eviction Order',difficulty:'MEDIUM',tier:'TIER_0_5',patternFamily:'DATA_STRUCTURES',patternTags:['lfu-cache','eviction-order','ties'],signatureId:'cls:lfu-cache',avgSolveSeconds:1020,
    promptMarkdown:prompt('capacity-bounded LFU cache','Implement `LFUCache(capacity)` and expose its eviction order through `get`. `get` returns `-1` for missing keys and promotes frequency. On a full insert, evict the lowest frequency; among equal frequencies, the older use loses first. A `put` on an existing key updates it and counts as use.'),
    editorialMarkdown:editorial('Evict by a two-part priority','Treat each key’s priority as `(frequency, last-use time)`. Lower frequency is worse; for equal frequency, older time is worse. This explains why a get changes later eviction order even when no value changes. The quiet mistake is using insertion order for ties after a key was read. Hash maps with frequency groups maintain this ordering in O(1) amortised work.','get and put are O(1) amortised in a frequency-list implementation; storage is O(capacity).'),referenceSolution:lfuCache,
    tests:[{stdin:'8\nLFUCache 2\nput 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 1\nget 3',expectedStdout:'null\nnull\nnull\n10\nnull\n-1\n10\n30',isSample:true},{stdin:'8\nLFUCache 2\nput 1 1\nput 2 2\nget 1\nget 2\nput 3 3\nget 1\nget 3',expectedStdout:'null\nnull\nnull\n1\n2\nnull\n-1\n3',isSample:true},{stdin:'8\nLFUCache 3\nput 1 1\nput 2 2\nput 3 3\nget 1\nput 4 4\nget 2\nget 3',expectedStdout:'null\nnull\nnull\nnull\n1\nnull\n-1\n3'},{stdin:'5\nLFUCache 1\nput 5 5\nget 5\nget 6\nput 6 6',expectedStdout:'null\nnull\n5\n-1\nnull'}],provenance:AUTHORED}),
];
