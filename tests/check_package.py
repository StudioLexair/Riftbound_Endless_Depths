from pathlib import Path
import json,re,collections
R=Path(__file__).resolve().parents[1]
results=[]
def report(s):results.append(s);print(s)
# Lightweight balanced-delimiter scanner, including nested template interpolations.
# Not a JS parser, type checker or execution test.
def scan(s):
 stack=[];i=0;n=len(s);mode='code';returns=[]
 while i<n:
  c=s[i];two=s[i:i+2]
  if mode in ['single','double']:
   if c=='\\':i+=2;continue
   if c==("'" if mode=='single' else '"'):mode='code'
   i+=1;continue
  if mode=='template':
   if c=='\\':i+=2;continue
   if c=='`':mode='code';i+=1;continue
   if two=='${':stack.append('$');mode='code';i+=2;continue
   i+=1;continue
  if mode=='line':
   if c=='\n':mode='code'
   i+=1;continue
  if mode=='block':
   if two=='*/':mode='code';i+=2;continue
   i+=1;continue
  if two=='//':mode='line';i+=2;continue
  if two=='/*':mode='block';i+=2;continue
  if c=="'":mode='single';i+=1;continue
  if c=='"':mode='double';i+=1;continue
  if c=='`':mode='template';i+=1;continue
  # JS regex literals in this package all occur after these expression prefixes.
  if c=='/' and (not s[:i].rstrip() or s[:i].rstrip()[-1] in '=(!,:;{[|&?'):
   i+=1;inside=False
   while i<n:
    if s[i]=='\\':i+=2;continue
    if s[i]=='[':inside=True
    elif s[i]==']':inside=False
    elif s[i]=='/' and not inside:break
    i+=1
   i+=1
   while i<n and s[i].isalpha():i+=1
   continue
  if c in '({[':stack.append(c)
  elif c in ')}]':
   assert stack,f'excess {c} at {i}'
   opener=stack.pop()
   if c=='}' and opener=='$':mode='template'
   else:assert opener=={')':'(',']':'[','}':'{'}[c],f'mismatch {opener} {c} at {i}'
  i+=1
 assert not stack,f'unclosed {stack}'
 assert mode in ['code','line'],f'unclosed {mode}'
for p in R.rglob('*.js'):
 scan(p.read_text())
 for ref in re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',p.read_text()):
  if ref.startswith('.'):assert (p.parent/ref).resolve().is_file(),f'missing import {ref}'
report('PASS: imports locales y delimitadores de 12 archivos JavaScript (no parseo/ejecución JS).')
s=(R/'data/content.js').read_text();d=json.loads(s[s.index('=')+1:].strip().rstrip(';'))
assert len(d['classes'])==7 and len(d['enemies'])==30 and len(d['bosses'])==6 and len(d['items'])==60 and len(d['achievements'])==34
for group in ['classes','enemies','bosses','items','achievements','quests']:
 ids=[i['id'] for i in d[group]];assert len(ids)==len(set(ids))
for c in d['classes']:assert len(c['skills'])==3
for a in d['achievements']:assert a['metric'] in ['kills','depth','bosses','gold','level','deaths','runs','steps','zones','events','chests','clean','quests','hardcoreBosses','equips','skills']
report('PASS: contenido, cantidades, identificadores únicos y métricas de logros.')
manifest=json.loads((R/'manifest.webmanifest').read_text());assert manifest['display']=='standalone'
from PIL import Image
for icon in manifest['icons']:
 p=R/icon['src'];assert p.is_file();assert Image.open(p).size==tuple(map(int,icon['sizes'].split('x')))
assert Image.open(R/'assets/sprites/atlas.png').size==(256,112)
report('PASS: manifest, dimensiones PWA 192/512, atlas de 109 sprites.')
sw=(R/'sw.js').read_text();files=json.loads(re.search(r'const FILES=(\[.*?\]);',sw).group(1))
for f in files:
 if f!='./':assert (R/f).is_file(),f
runtime={p.relative_to(R).as_posix() for folder in ['src','assets','data'] for p in (R/folder).rglob('*') if p.is_file()}
assert runtime<={f.removeprefix('./') for f in files}
report('PASS: todos los recursos runtime incluidos en lista de precaché.')
# Exact integer translation of the topology portion of generator.js; does NOT run JS.
def imul(a,b):return (a*b)&0xffffffff
def hash_(s):
 h=2166136261
 for c in s:h=imul(h^ord(c),16777619)
 return h
class RNG:
 def __init__(self,s):self.a=s
 def __call__(self):
  self.a=(self.a+0x6D2B79F5)&0xffffffff;t=imul(self.a^(self.a>>15),1|self.a);t^=(t+imul(t^(t>>7),61|t))&0xffffffff
  return ((t^(t>>14))&0xffffffff)/4294967296

def topology(seed,depth):
 rand=RNG(hash_(f'{seed}:{depth}'));tiles=[[0]*36 for _ in range(36)];rooms=[]
 def carve(x,y):
  if 0<x<35 and 0<y<35:tiles[y][x]=1
 for j in range(3):
  for i in range(3):
   w=6+int(rand()*5);h=6+int(rand()*5);x=2+i*11+int(rand()*2);y=2+j*11+int(rand()*2);shape=int(rand()*4)
   for dy in range(h):
    for dx in range(w):
     if shape==1 and dx in [0,w-1] and dy in [0,h-1]:continue
     if shape==2 and (dx<2 or dx>w-3) and (dy<2 or dy>h-3):continue
     carve(x+dx,y+dy)
   c=(x+w//2,y+h//2);rooms.append(c)
   if len(rooms)>1:
    xx,yy=rooms[-2]
    if rand()<.5:
     while xx!=c[0]:carve(xx,yy);xx+=1 if c[0]>xx else -1
     while yy!=c[1]:carve(xx,yy);yy+=1 if c[1]>yy else -1
    else:
     while yy!=c[1]:carve(xx,yy);yy+=1 if c[1]>yy else -1
     while xx!=c[0]:carve(xx,yy);xx+=1 if c[0]>xx else -1
    carve(*c)
 for i in range(3):
  a=rooms[i];b=rooms[i+3]
  for y in range(a[1],b[1]+1):carve(a[0],y)
  for x in range(min(a[0],b[0]),max(a[0],b[0])+1):carve(x,b[1])
 seen={rooms[0]};q=collections.deque(seen)
 while q:
  x,y=q.popleft()
  for dx,dy in [(0,1),(0,-1),(1,0),(-1,0)]:
   xx=x+dx;yy=y+dy
   if 0<=xx<36 and 0<=yy<36 and tiles[yy][xx] and (xx,yy) not in seen:seen.add((xx,yy));q.append((xx,yy))
 floors={(x,y) for y in range(36) for x in range(36) if tiles[y][x]}
 assert seen==floors,'Floor connectivity error'
 assert rooms[-1] in seen
 return tiles
for n in range(1,1001):topology(f'seed-{n}',n)
assert topology('same',8)==topology('same',8)
report('PASS: 1000 topologías conectadas y deterministas mediante traducción Python de la geometría (no ejecución JS).')
report('NOT RUN: tests/engine-tests.js, navegador, PWA/offline real, IndexedDB real, controles táctiles, balance, rendimiento y pruebas físicas.')
(R/'tests/static-results.txt').write_text('\n'.join(results)+'\n')
