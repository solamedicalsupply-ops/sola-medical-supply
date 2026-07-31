"""Download representative product images from reviewed source pages."""
import html,json,re,os
from pathlib import Path
from urllib.parse import urljoin
import requests
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
manifest_name=os.environ.get('SOLA_SOURCE_MANIFEST','product-page-sources.json')
SRC=json.loads((ROOT/'assets/data'/manifest_name).read_text(encoding='utf8'))
output_name=os.environ.get('SOLA_SOURCE_OUTPUT','product-sources-pages')
OUT=ROOT/'assets/images'/output_name; OUT.mkdir(parents=True,exist_ok=True)
REPORT={}; session=requests.Session(); headers={'User-Agent':'Mozilla/5.0'}
stop={'product','packaging','new','previous','korean','market','pens','vials','small','big'}
only={x for x in os.environ.get('SOLA_ONLY_SLUGS','').split(',') if x}
for i,(raw,v) in enumerate(SRC.items(),1):
 slug=raw.removesuffix('.webp'); page_url=v.get('page'); entry={**v,'downloaded':False}
 if only and slug not in only: continue
 if not page_url: REPORT[slug]=entry; continue
 try:
  r=session.get(page_url,headers=headers,timeout=25); r.raise_for_status(); page=r.text
  plain=re.sub('<[^>]+>',' ',html.unescape(page)).lower()
  toks=[x for x in re.findall('[a-z0-9]+',v['name'].lower()) if len(x)>2 and x not in stop]
  entry['tokenMatch']=sum(x in plain for x in toks)/max(1,len(toks))
  if entry['tokenMatch']<.67: raise ValueError('page name mismatch')
  patterns=[r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image',r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)']
  image_url=None
  for p in patterns:
   m=re.search(p,page,re.I)
   if m: image_url=urljoin(page_url,html.unescape(m.group(1))); break
  candidates=[]
  if image_url: candidates.append(image_url)
  for tag in re.findall(r'<img\b[^>]*>',page,re.I):
   sm=re.search(r'(?:src|data-src)=["\']([^"\']+)',tag,re.I)
   if not sm: continue
   url=urljoin(page_url,html.unescape(sm.group(1)))
   label=(tag+' '+url).lower()
   score=sum(t in label for t in toks)-sum(x in label for x in ('logo','icon','avatar','flag','payment'))
   candidates.append((score,url))
  candidates=[x for _,x in sorted((x if isinstance(x,tuple) else (10,x) for x in candidates),reverse=True)]
  target=OUT/f'{slug}.img'
  for candidate in candidates[:12]:
   try:
    data=session.get(candidate,headers={**headers,'Referer':page_url},timeout=30).content; target.write_bytes(data)
    with Image.open(target) as im:
     if min(im.size)<220: raise ValueError('image too small')
     entry['dimensions']=list(im.size)
    image_url=candidate; break
   except Exception: target.unlink(missing_ok=True)
  else: raise ValueError('no usable page image')
  entry.update(downloaded=True,image=image_url)
 except Exception as e:
  (OUT/f'{slug}.img').unlink(missing_ok=True); entry['error']=str(e)
 REPORT[slug]=entry; print(f'[{i}/{len(SRC)}] {slug}: {"ok" if entry["downloaded"] else "missing"}',flush=True)
report_name=os.environ.get('SOLA_SOURCE_REPORT','product-page-images.json')
(ROOT/'assets/data'/report_name).write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
