"""Download representative product images from reviewed source pages."""
import html,json,re
from pathlib import Path
from urllib.parse import urljoin
import requests
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SRC=json.loads((ROOT/'assets/data/product-page-sources.json').read_text(encoding='utf8'))
OUT=ROOT/'assets/images/product-sources-pages'; OUT.mkdir(parents=True,exist_ok=True)
REPORT={}; session=requests.Session(); headers={'User-Agent':'Mozilla/5.0'}
stop={'product','packaging','new','previous','korean','market','pens','vials','small','big'}
for i,(raw,v) in enumerate(SRC.items(),1):
 slug=raw.removesuffix('.webp'); page_url=v.get('page'); entry={**v,'downloaded':False}
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
  if not image_url: raise ValueError('no social image')
  data=session.get(image_url,headers={**headers,'Referer':page_url},timeout=30).content
  target=OUT/f'{slug}.img'; target.write_bytes(data)
  with Image.open(target) as im:
   if min(im.size)<220: raise ValueError('image too small')
   entry['dimensions']=list(im.size)
  entry.update(downloaded=True,image=image_url)
 except Exception as e:
  (OUT/f'{slug}.img').unlink(missing_ok=True); entry['error']=str(e)
 REPORT[slug]=entry; print(f'[{i}/{len(SRC)}] {slug}: {"ok" if entry["downloaded"] else "missing"}',flush=True)
(ROOT/'assets/data/product-page-images.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
