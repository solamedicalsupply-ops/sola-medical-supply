"""Source product packshots from pages whose text explicitly names the product."""
import html, json, re, time
from pathlib import Path
from urllib.parse import urlparse
import requests
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'assets/data/product-image-candidates.json'
OUT=ROOT/'assets/images/product-sources-reviewed'
MANIFEST=ROOT/'assets/data/product-image-reviewed.json'
APPROVED={"botulax-100u","hutox-100","laennec-japan","neuramis-dermal-filler","ozempic-2-pens","pdrn","rejuran-healer-new-packaging","rejuran-healer-previous-packaging","retatrutide-bioaminolabs-10mg","retatrutide-bioaminolabs-30mg","retatrutide-bioaminolabs-60mg","tirzepatide-regenlab-5mg","tirzepatide-regenlab-10mg","tirzepatide-regenlab-20mg","tirzepatide-regenlab-30mg","tirzepatide-regenlab-60mg","vitaran-hb","vitaran-i","vitaran-s","xeomin-100"}
BLOCK=('facebook.','instagram.','pinterest.','youtube.','tiktok.')

def tokens(name): return [x for x in re.findall(r'[a-z0-9]+',name.lower()) if len(x)>2 and x not in {'new','previous','packaging','korean','market','pens','vials'}]
def bing(session,q):
 t=session.get('https://www.bing.com/search',params={'q':f'"{q}" product buy'},headers={'User-Agent':'Mozilla/5.0'},timeout=20).text
 return [html.unescape(u) for u in re.findall(r'<li class="b_algo".*?<h2><a href="([^"]+)"',t,re.S)]
def meta_image(page,base):
 for pat in (r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image'):
  m=re.search(pat,page,re.I)
  if m:
   from urllib.parse import urljoin
   return urljoin(base,html.unescape(m.group(1)))
 return None
def main():
 OUT.mkdir(parents=True,exist_ok=True); session=requests.Session()
 src=json.loads(DATA.read_text(encoding='utf8')); done=json.loads(MANIFEST.read_text(encoding='utf8')) if MANIFEST.exists() else {}
 rows=[(k,v) for k,v in src.items() if k not in APPROVED]
 for i,(slug,v) in enumerate(rows,1):
  if done.get(slug,{}).get('downloaded') and (OUT/f'{slug}.img').exists(): continue
  name=v['name']; need=tokens(name); entry={'name':name,'downloaded':False}
  try:
   for page_url in bing(session,name)[:6]:
    if any(b in urlparse(page_url).netloc for b in BLOCK): continue
    try:
     page=session.get(page_url,headers={'User-Agent':'Mozilla/5.0'},timeout=18).text
     plain=re.sub('<[^>]+>',' ',html.unescape(page)).lower()
     if not need or sum(t in plain for t in need)/len(need)<.75: continue
     image_url=meta_image(page,page_url)
     if not image_url: continue
     data=session.get(image_url,headers={'User-Agent':'Mozilla/5.0','Referer':page_url},timeout=25).content
     target=OUT/f'{slug}.img'; target.write_bytes(data)
     with Image.open(target) as im:
      if min(im.size)<220: target.unlink(missing_ok=True); continue
      size=list(im.size)
     entry.update(downloaded=True,page=page_url,image=image_url,dimensions=size); break
    except Exception: continue
  except Exception as e: entry['error']=str(e)
  done[slug]=entry; MANIFEST.write_text(json.dumps(done,ensure_ascii=False,indent=2),encoding='utf8')
  print(f'[{i}/{len(rows)}] {slug}: {"ok" if entry["downloaded"] else "missing"}',flush=True); time.sleep(.15)
if __name__=='__main__': main()
