"""Source remaining exact product images from Yandex result metadata."""
import html,json,re,subprocess,time
from pathlib import Path
import requests
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
PRODUCTS=(ROOT/'assets/data/products.js').read_text(encoding='utf8')
tracked={Path(x).stem for x in subprocess.check_output(['git','ls-files','assets/images/product-sources-auto/*'],text=True,cwd=ROOT).splitlines()}|{'curenex-lipo','youthfill-fine'}
rows=[]
for m in re.finditer(r"\{ name: '([^']+)'.*?image: 'assets/images/generated/products/([^']+)'",PRODUCTS):
 slug=Path(m.group(2)).stem
 if slug not in tracked:rows.append((m.group(1),slug))
OUT=ROOT/'assets/images/product-sources-yandex';OUT.mkdir(parents=True,exist_ok=True)
stop={'product','packaging','cream','needle','small','big','pens','vials','korean','market','previous','new'}
s=requests.Session();report={}
for i,(name,slug) in enumerate(rows,1):
 entry={'name':name,'downloaded':False};toks=[x for x in re.findall('[a-z0-9]+',name.lower()) if len(x)>2 and x not in stop]
 try:
  raw=s.get('https://yandex.com/images/search',params={'text':f'"{name}" product box vial syringe'},headers={'User-Agent':'Mozilla/5.0'},timeout=25).text
  page=html.unescape(raw); items=[]
  for match in re.finditer(r'"origUrl":"(.*?)".*?"snippet":\{"title":"(.*?)".*?"url":"(.*?)"',page,re.S):
   url,title,source=[html.unescape(x.replace('\\/','/')) for x in match.groups()]
   hay=(title+' '+url+' '+source).lower();score=sum(4 for x in toks if x in hay)
   if all(x in hay for x in toks[:1]):score+=3
   items.append((score,url,title,source))
  for score,url,title,source in sorted(items,reverse=True):
   if score<3:continue
   try:
    data=s.get(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://yandex.com/'},timeout=30).content;target=OUT/f'{slug}.img';target.write_bytes(data)
    with Image.open(target) as im:
     if min(im.size)<180:raise ValueError('small')
     dims=list(im.size)
    entry.update(downloaded=True,image=url,title=title,page=source,score=score,dimensions=dims);break
   except:target.unlink(missing_ok=True)
 except Exception as e:entry['error']=str(e)
 report[slug]=entry;print(f'[{i}/{len(rows)}] {slug}: {"ok" if entry["downloaded"] else "missing"}',flush=True);time.sleep(.2)
(ROOT/'assets/data/product-yandex-sources.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
