import argparse, html, json, os, re, sys, traceback, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE, BLOG = ROOT / "data" / "blog_queue.json", ROOT / "blog"
VERCEL = ROOT / "vercel.json"
BLOG_IMAGES = ROOT / "assets" / "images" / "blog"
INDEX = BLOG / "index.html"
START, END = "<!-- AUTO_POSTS_START -->", "<!-- AUTO_POSTS_END -->"
MIN_ARTICLE_WORDS = 850
MIN_PUBLISHABLE_WORDS = 700
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
COMMONS_MIN_WIDTH = 1600
COMMONS_MAX_BYTES = 8 * 1024 * 1024
COMMONS_USER_AGENT = "SOLA-Journal/1.0 (sales@solamedicalsupply.com)"

def env(name):
    value = os.getenv(name, "").strip()
    if not value: raise RuntimeError(f"Missing GitHub secret: {name}")
    return value

def require_url(name):
    value = env(name)
    if not re.match(r"^https?://", value, re.I):
        raise RuntimeError(f"Invalid GitHub secret {name}: URL must start with https://")
    return value

def load_queue():
    try: data = json.loads(QUEUE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc: raise RuntimeError(f"Invalid blog_queue.json: {exc}") from exc
    if not isinstance(data.get("topics"), list) or not isinstance(data.get("published"), list):
        raise RuntimeError("blog_queue.json requires topics[] and published[]")
    return data

def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:78]

def article_format(topic):
    topic_type = "category buyer guide" if topic.get("format") == "buyer_guide" else "product sourcing guide"
    return f'''Use a polished ecommerce education style inspired by premium product blogs: direct opening, useful takeaways, problem-led sections, scannable bullets, and confident buyer guidance. Do not copy any competitor wording.
Article type: {topic_type}.
Use this exact article structure:
Intro: 2 short paragraphs that immediately explain the buyer problem and why the topic matters.
H2: Key Takeaways
Include 5 concise bullet points. Each bullet should give a practical buying insight, not generic filler.
H2: What this guide covers
Include a short, non-clickable table-of-contents style bullet list with 5-7 items.
H2: What buyers should understand first
Explain the product/category in plain English for clinics, spas, resellers and distributors. Avoid treatment instructions.
H2: Which buyers is this most relevant for?
Describe buyer scenarios, order planning needs and how different business types may evaluate the topic.
H2: How to compare options before ordering
Give practical comparison criteria such as product type, brand, packaging, batch/expiry visibility, supplier communication and destination requirements.
H2: Buyer checklist before requesting a quote
Include a strong checklist using ul/li. Make it specific enough for a real wholesale buyer.
H2: Shipping, packing and documentation questions
Cover realistic logistics questions without inventing guaranteed delivery times, approvals or customs outcomes.
H2: MOQ, quotation and reorder planning
Explain how to prepare quantities, variants and destination details. Mention that SOLA can help confirm current availability and wholesale quotation.
H2: FAQ
Under FAQ, include 5 common buyer questions using h3 headings and concise answers.
Near the end, include this exact sentence once: Contact SOLA for wholesale quotation via WhatsApp.'''

def request_article(prompt):
    payload = json.dumps({"model":env("BLOG_MODEL"),"temperature":0.35,"max_tokens":6500,"messages":[{"role":"system","content":"You are a careful B2B editor. Return one complete valid JSON object only."},{"role":"user","content":prompt}]}).encode()
    request = urllib.request.Request(require_url("BLOG_API_URL"), data=payload, headers={"Authorization":f"Bearer {env('BLOG_API_KEY')}","Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response: result=json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"API HTTP {exc.code}: {exc.read().decode(errors='replace')[:600]}") from exc
    try: text=result["choices"][0]["message"]["content"].strip()
    except (KeyError,IndexError,TypeError) as exc: raise RuntimeError("API is not chat/completions compatible") from exc
    text=re.sub(r"^```(?:json)?\s*|\s*```$","",text,flags=re.I)
    try: return json.loads(text)
    except json.JSONDecodeError as exc: raise RuntimeError(f"Model returned invalid JSON: {exc}") from exc

def generate(topic, correction=""):
    prompt = f'''Write an original English article for SOLA Medical Supply's professional buyer journal.
Title brief: {topic['title']}
Keyword: {topic['keyword']}; Category: {topic['category']}.
CRITICAL SEO AND LENGTH REQUIREMENT: html_body must contain AT LEAST 950 words of body text (excluding HTML tags). Aim for 1000-1300 words.
SEO requirements: use the exact keyword naturally in the intro, one H2 or H3, and 2-4 additional places. Include close variants and buyer-intent phrases such as wholesale supplier, sourcing guide, professional buyers, documentation, packing, shipping, quotation, MOQ and reorder planning where relevant.
Writing style: practical, clear and commercially useful. The article should feel like a premium ecommerce education guide: direct, buyer-focused, scannable and confident. Avoid academic filler and avoid vague phrases like "in today's market" or "unlock the secrets". Do not mention competitor websites or describe the style source.
{article_format(topic)} Do not summarise, do not stop early, do not write a short article. Audience: clinics, spas, resellers and distributors. This is procurement education, not medical advice. Never invent certifications, partnerships, prices, stock, approvals or customer results. Do not claim SOLA is an authorised distributor. Mention SOLA only in buyer-support and closing CTA context.
Avoid unsafe SEO angles such as buying prescription products without prescription, cheap toxin claims, fast fat-loss results, or whitening injection result claims.
Do not provide dosage, injection technique, treatment protocol, patient selection advice or guaranteed results. For regulated or prescription-sensitive products, tell buyers to confirm local requirements with qualified professionals and local authorities.
Return JSON only: title, meta_description (max 155 chars), excerpt (35-50 words), read_time, html_body. html_body may use only h2, h3, p, ul, li, strong and em tags. Do not include image tags, figure tags, links, tables or markdown; SOLA will insert article illustrations automatically.
{correction}'''
    return request_article(prompt)

def repair_article(topic, article, reason):
    prompt = f'''Expand and repair the existing SOLA Medical Supply journal draft below. Return the full revised JSON object, not a patch and not commentary.
The draft failed validation because: {reason}
Title brief: {topic['title']}
Keyword: {topic['keyword']}; Category: {topic['category']}.
Keep accurate, useful material from the draft, but substantially expand thin sections with practical procurement detail. The revised html_body must contain at least 950 words and follow every required section below.
{article_format(topic)}
Preserve the safety rules: do not invent certifications, partnerships, prices, stock, approvals, customer results, dosage, injection technique, treatment protocols or guaranteed results. Use only h2, h3, p, ul, li, strong and em in html_body. Keep meta_description at 155 characters or fewer and excerpt at 35-50 words.
EXISTING DRAFT JSON:
{json.dumps(article, ensure_ascii=False)}'''
    return request_article(prompt)

def article_word_count(article):
    if not isinstance(article, dict) or not isinstance(article.get("html_body"), str): return 0
    return len(re.sub(r"<[^>]+>"," ",article["html_body"]).split())

def generate_valid_article(topic, attempts=3):
    correction=""
    errors=[]
    article=None
    best_publishable=None
    for attempt in range(1,attempts+1):
        try:
            if article is None:
                article=generate(topic,correction)
            else:
                article=repair_article(topic,article,correction)
            validate(article)
            return article
        except RuntimeError as exc:
            errors.append(str(exc))
            try:
                validate(article, minimum_words=MIN_PUBLISHABLE_WORDS)
                if best_publishable is None or article_word_count(article)>article_word_count(best_publishable):
                    best_publishable=article
            except RuntimeError:
                pass
            if attempt == attempts: break
            correction=str(exc)
            action="expanding the existing draft" if article is not None else "regenerating"
            print(f"WARNING: Article attempt {attempt} failed validation; {action}. {exc}",file=sys.stderr)
    if best_publishable is not None:
        words=article_word_count(best_publishable)
        print(f"WARNING: Publishing the best structurally valid draft after {attempts} attempts ({words} words; preferred minimum is {MIN_ARTICLE_WORDS}).",file=sys.stderr)
        return best_publishable
    raise RuntimeError(f"Article generation failed after {attempts} attempts. Last error: {errors[-1]}")

def sync_blog_redirects():
    config=json.loads(VERCEL.read_text(encoding="utf-8"))
    redirects=config.setdefault("redirects",[])
    existing={item.get("source") for item in redirects}
    additions=[]
    for target in sorted(BLOG.glob("*.html")):
        if target.name == "index.html": continue
        slug=target.stem
        source=f"/{slug}"
        if source not in existing:
            additions.append({"source":source,"destination":f"/blog/{slug}","permanent":True})
    if additions:
        redirects.extend(additions)
        redirects.sort(key=lambda item:item.get("source", ""))
        VERCEL.write_text(json.dumps(config,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return len(additions)

def plain_metadata(value):
    return html.unescape(re.sub(r"<[^>]+>", " ", value or "")).strip()

def metadata_value(metadata,key):
    item=metadata.get(key) if isinstance(metadata,dict) else None
    return item.get("value","") if isinstance(item,dict) else ""

def allowed_commons_license(value):
    normalized=plain_metadata(value).lower()
    return (
        normalized.startswith("cc0") or "public domain" in normalized or normalized == "pdm"
        or normalized.startswith("cc by") or normalized.startswith("cc-by")
    )

def commons_queries(topic, role):
    category=re.sub(r"[^a-z0-9 ]+", " ", topic.get("category", "").lower()).strip()
    role_queries={
        "cover": ["modern medical office interior", "aesthetic clinic interior", f"{category} medical supplies"],
        "concept": ["bright modern beauty treatment room", "skin care clinic interior", f"{category} clinic equipment"],
        "checklist": ["medicine storage container", "medical supplies inventory", "sorting medical supplies"],
        "logistics": ["sorting medical supplies", "medical supplies warehouse", "pharmaceutical warehouse"]
    }
    queries=[]
    for query in role_queries.get(role, role_queries["concept"]):
        query=re.sub(r"\s+", " ", query).strip()
        if query and query not in queries: queries.append(query)
    return queries

def search_commons(query):
    params=urllib.parse.urlencode({
        "action":"query", "generator":"search", "gsrsearch":query,
        "gsrnamespace":6, "gsrlimit":15, "prop":"imageinfo",
        "iiprop":"url|size|mime|extmetadata", "format":"json", "formatversion":2
    })
    request=urllib.request.Request(f"{COMMONS_API}?{params}",headers={"User-Agent":COMMONS_USER_AGENT})
    with urllib.request.urlopen(request,timeout=30) as response:
        result=json.loads(response.read().decode())
    if not isinstance(result,dict): return []
    return (result.get("query") or {}).get("pages") or []

def commons_candidate(page, used_sources):
    if not isinstance(page,dict): return None
    imageinfo=page.get("imageinfo") or []
    if not imageinfo or not isinstance(imageinfo[0],dict): return None
    info=imageinfo[0]
    metadata=info.get("extmetadata") or {}
    source_url=info.get("descriptionurl") or metadata_value(metadata,"CanonicalPageURL")
    license_name=plain_metadata(metadata_value(metadata,"LicenseShortName"))
    title=plain_metadata(page.get("title","").removeprefix("File:"))
    unsuitable=("navy","army","military","dvids","air force","marine corps","guardsmen","afghanistan","iraq","ukraine","war ")
    if any(term in title.lower() for term in unsuitable): return None
    if source_url in used_sources or not allowed_commons_license(license_name): return None
    if info.get("mime") not in {"image/jpeg","image/png","image/webp"}: return None
    if int(info.get("width") or 0)<COMMONS_MIN_WIDTH: return None
    if int(info.get("size") or 0)>COMMONS_MAX_BYTES: return None
    width,height=int(info.get("width") or 0),int(info.get("height") or 0)
    if not height or width/height<0.6 or width/height>2.2: return None
    original_url=info.get("url","")
    if not original_url.startswith("https://upload.wikimedia.org/"): return None
    return {
        "title":title,
        "source_url":source_url,
        "original_url":original_url,
        "creator":plain_metadata(metadata_value(metadata,"Artist"))[:180],
        "license":license_name or "Public domain",
        "license_url":plain_metadata(metadata_value(metadata,"LicenseUrl")),
        "width":width,
        "height":height,
        "mime":info["mime"]
    }

def download_commons_original(candidate,slug,suffix):
    extensions={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}
    target=BLOG_IMAGES/f"{slug}-{suffix}.{extensions[candidate['mime']]}"
    request=urllib.request.Request(candidate["original_url"],headers={"User-Agent":COMMONS_USER_AGENT})
    with urllib.request.urlopen(request,timeout=90) as response:
        content=response.read(COMMONS_MAX_BYTES+1)
    if len(content)>COMMONS_MAX_BYTES: raise RuntimeError("Original image exceeds download size limit")
    BLOG_IMAGES.mkdir(parents=True,exist_ok=True)
    target.write_bytes(content)
    result=dict(candidate)
    result["src"]=f"../assets/images/blog/{target.name}"
    return result

def find_real_image(topic,slug,role,suffix,used_sources):
    try:
        for query in commons_queries(topic,role):
            for page in search_commons(query):
                candidate=commons_candidate(page,used_sources)
                if not candidate: continue
                result=download_commons_original(candidate,slug,suffix)
                used_sources.add(result["source_url"])
                print(f"Downloaded real {role} image: {result['width']}x{result['height']} from Wikimedia Commons")
                return result
    except Exception as exc:
        print(f"WARNING: Real {role} image lookup failed; using local fallback. {exc}",file=sys.stderr)
    return None

def used_image_sources(data):
    sources=set()
    for item in [*(data.get("topics") or []),*(data.get("published") or [])]:
        if not isinstance(item,dict): continue
        for source in item.get("image_sources") or []:
            if isinstance(source,dict) and source.get("source_url"): sources.add(source["source_url"])
    return sources

def generate_cover(topic,slug,used_sources):
    fallback=topic.get("image") or "../assets/images/productCatalogue.png"
    source=find_real_image(topic,slug,"cover","cover",used_sources)
    return (source["src"],source) if source else (fallback,None)

def validate(a, minimum_words=MIN_ARTICLE_WORDS):
    for key in ("title","meta_description","excerpt","read_time","html_body"):
        if not isinstance(a.get(key),str) or not a[key].strip(): raise RuntimeError(f"Missing generated field: {key}")
    if len(a["meta_description"])>160: raise RuntimeError("Meta description exceeds 160 characters")
    bad=re.search(r"<(script|style|iframe|img|a|form)\b",a["html_body"],re.I)
    if bad: raise RuntimeError(f"Forbidden generated tag: {bad.group(1)}")
    allowed={"h2","h3","p","ul","li","strong","em"}
    tags={t.lower() for t in re.findall(r"</?\s*([a-z0-9]+)\b",a["html_body"],re.I)}
    extra=tags-allowed
    if extra: raise RuntimeError(f"Unsupported generated tag(s): {', '.join(sorted(extra))}")
    words=article_word_count(a)
    if words<minimum_words: raise RuntimeError(f"Article too short: {words} words")
    h2_count=len(re.findall(r"<h2\b",a["html_body"],re.I))
    if h2_count<7: raise RuntimeError(f"Article structure too thin: {h2_count} H2 sections")
    plain=re.sub(r"<[^>]+>"," ",a["html_body"]).lower()
    for phrase in ("key takeaways","what this guide covers","faq"):
        if phrase not in plain: raise RuntimeError(f"Missing required section: {phrase}")

def normalize_article_image(src):
    src=(src or "").strip()
    if not src: return ""
    if src.startswith("assets/"): return f"../{src}"
    return src

def article_illustration(src,alt,caption):
    src=html.escape(normalize_article_image(src),quote=True)
    alt=html.escape(alt,quote=True)
    caption=html.escape(caption)
    return f'''<figure class="article-illustration"><img src="{src}" alt="{alt}" loading="lazy"><figcaption>{caption}</figcaption></figure>'''

def article_visual_grid(items):
    cards="".join(article_illustration(src,alt,caption) for src,alt,caption in items if src)
    return f'''<div class="article-visual-grid">{cards}</div>''' if cards else ""

def insert_after_nth_h2(body,n,block):
    if not block: return body
    matches=list(re.finditer(r"</h2>",body,re.I))
    if len(matches)>=n:
        idx=matches[n-1].end()
        return body[:idx]+block+body[idx:]
    return body+block

def unique_image_pool(topic,cover):
    candidates=[
        topic.get("image"),
        "../assets/images/productCatalogue.png",
        "../assets/images/warehouse-2.png",
        "../assets/images/shipping.png",
        "../assets/images/tracking-proof-1.png"
    ]
    used={normalize_article_image(cover)}
    pool=[]
    for item in candidates:
        item=normalize_article_image(item)
        if item and item not in used:
            used.add(item); pool.append(item)
    return pool

def fallback_from_pool(pool,used):
    while pool:
        item=pool.pop(0)
        key=normalize_article_image(item)
        if key not in used:
            used.add(key); return item
    return ""

def generate_inline_images(topic,article,slug,cover,used_sources):
    pool=unique_image_pool(topic,cover)
    used={normalize_article_image(cover)}
    roles=[
        ("concept","concept",f"{article['title']} concept visual",f"Article concept image for {topic['keyword']}: a visual summary of the buyer problem and sourcing decision."),
        ("checklist","buyer-checklist",f"{article['title']} buyer checklist",f"Buyer checklist image for {topic['keyword']}: product details, quantities and quotation preparation in one professional workflow."),
        ("logistics","logistics-documentation",f"{article['title']} logistics and documentation",f"Logistics image for {topic['keyword']}: packing, documentation and tracking questions before international dispatch.")
    ]
    images=[]; sources=[]
    for role,suffix,alt,caption in roles:
        fallback=fallback_from_pool(pool,used)
        source=find_real_image(topic,slug,role,suffix,used_sources)
        src=source["src"] if source else fallback
        key=normalize_article_image(src)
        if src and key not in {normalize_article_image(x[0]) for x in images} and key != normalize_article_image(cover):
            images.append((src,alt,caption))
            if source: sources.append(source)
        elif fallback:
            images.append((fallback,alt,caption))
    return images,sources

def image_credits(sources):
    if not sources: return ""
    links=[]
    for source in sources:
        label=html.escape(source.get("title") or "Wikimedia Commons image")
        url=html.escape(source.get("source_url", ""),quote=True)
        license_name=html.escape(source.get("license") or "Public domain")
        license_url=html.escape(source.get("license_url", ""),quote=True)
        creator=html.escape(source.get("creator") or "Wikimedia Commons contributor")
        dimensions=f"{source.get('width')}x{source.get('height')} px"
        license_credit=f'''<a href="{license_url}" rel="nofollow noopener" target="_blank">{license_name}</a>''' if license_url else license_name
        links.append(f'''<a href="{url}" rel="nofollow noopener" target="_blank">{label}</a> by {creator} ({license_credit}, {dimensions})''')
    return f'''<p class="disclaimer">Image sources: {'; '.join(links)}.</p>'''

def inject_inline_illustrations(body,topic,cover,illustrations=None):
    topic=topic or {}
    illustrations=illustrations or []
    if illustrations:
        body=insert_after_nth_h2(body,3,article_illustration(*illustrations[0]))
    if len(illustrations)>1:
        body=insert_after_nth_h2(body,6,article_visual_grid(illustrations[1:3]))
    return body

def page(a,slug,category,date,image,topic=None,illustrations=None,image_sources=None):
    body=inject_inline_illustrations(a["html_body"],topic or {},image,illustrations)
    title,desc=html.escape(a["title"]),html.escape(a["meta_description"],quote=True)
    image=html.escape(image,quote=True)
    credits=image_credits(image_sources or [])
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | SOLA</title><meta name="description" content="{desc}"><link rel="canonical" href="https://www.solamedicalsupply.com/blog/{slug}.html"><link rel="icon" href="../assets/icons/logo.png"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/css/style.css"></head><body class="article-page"><nav class="nav"><div class="wrap nav-inner"><a class="brand" href="../index.html"><img src="../assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><div class="article-nav"><a href="index.html">← Journal</a><a class="btn primary" href="../products.html">Build a quote list</a></div></div></nav><main><header class="article-hero"><div class="wrap article-wrap"><span>{html.escape(category.upper())} · {html.escape(a['read_time'])}</span><h1>{title}</h1><p>{desc}</p><div class="article-meta">SOLA Knowledge Team · {date}</div></div></header><div class="article-cover wrap"><img src="{image}" alt="{title}" loading="lazy"></div><article class="article-body article-wrap"><p class="article-intro">{html.escape(a['excerpt'])}</p>{body}<div class="article-end"><h2>Planning a wholesale request?</h2><p>Send product names, quantities and destination for a tailored discussion.</p><a class="btn primary" href="https://wa.me/84981778670">Contact SOLA on WhatsApp →</a></div><p class="disclaimer">General educational content for professional buyers. Not medical, legal, regulatory or import advice.</p>{credits}</article></main><footer class="footer new-footer"><div class="wrap"><div class="footer-top"><div><img src="../assets/icons/logoNgang.png" alt="SOLA"><p>Professional aesthetic wholesale supply for clinics, spas, resellers and distributors worldwide.</p></div><div><b>Explore</b><a href="../products.html">Products</a><a href="../brands.html">Brands</a><a href="index.html">Journal</a></div><div><b>Company</b><a href="../about.html">About SOLA</a><a href="../faq.html">FAQ</a><a href="../contact.html">Contact</a></div><div><b>Connect</b><a href="https://wa.me/84981778670">WhatsApp</a><a href="mailto:sales@solamedicalsupply.com">Email sales</a></div></div><div class="footer-bottom"><span>© 2026 SOLA Medical Supply</span><span>Educational content for professional buyers</span></div></div></footer><script src="../assets/js/main.js"></script></body></html>'''

def add_card(a,slug,category,image):
    source=INDEX.read_text(encoding="utf-8")
    if START not in source or END not in source: raise RuntimeError("Journal index lacks AUTO_POSTS markers")
    card=f'''\n<a class="story-card" href="{slug}.html"><img src="{html.escape(image,quote=True)}" alt="{html.escape(a['title'])}" loading="lazy"><div><span>{html.escape(category.upper())} · {html.escape(a['read_time'].upper())}</span><h3>{html.escape(a['title'])}</h3><p>{html.escape(a['excerpt'])}</p><b>Read article →</b></div></a>'''
    INDEX.write_text(source.replace(START,START+card,1),encoding="utf-8")

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--check",action="store_true"); args=parser.parse_args()
    data=load_queue(); require_url("BLOG_API_URL"); env("BLOG_API_KEY"); env("BLOG_MODEL")
    if START not in INDEX.read_text(encoding="utf-8"): raise RuntimeError("Automation markers missing from blog/index.html")
    if args.check: print("Configuration valid."); return
    topic=next((x for x in data["topics"] if x.get("status")=="pending"),None)
    if not topic: print("No pending topics."); return
    article=generate_valid_article(topic); slug=slugify(topic["title"]); target=BLOG/f"{slug}.html"
    if target.exists(): raise RuntimeError(f"Refusing to overwrite {target.name}")
    source_urls=used_image_sources(data)
    cover,cover_source=generate_cover(topic,slug,source_urls)
    illustrations,inline_sources=generate_inline_images(topic,article,slug,cover,source_urls)
    image_sources=([cover_source] if cover_source else [])+inline_sources
    now=datetime.now(timezone.utc); target.write_text(page(article,slug,topic["category"],now.strftime("%B %d, %Y"),cover,topic,illustrations,image_sources),encoding="utf-8"); add_card(article,slug,topic["category"],cover)
    illustration_paths=[src for src,_,_ in illustrations]
    topic.update({"status":"published","slug":slug,"published_at":now.isoformat(),"cover":cover,"illustrations":illustration_paths,"image_sources":image_sources}); data["published"].append({"title":article["title"],"slug":slug,"published_at":now.isoformat(),"cover":cover,"illustrations":illustration_paths,"image_sources":image_sources})
    QUEUE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    redirect_count=sync_blog_redirects()
    print(f"Published {target.name}; synchronized {redirect_count} blog redirect(s)")

if __name__=="__main__":
    try: main()
    except Exception as exc: traceback.print_exc(); print(f"ERROR: {exc}",file=sys.stderr); sys.exit(1)
