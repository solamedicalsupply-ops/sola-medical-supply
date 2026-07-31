import argparse, base64, html, json, os, re, sys, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE, BLOG = ROOT / "data" / "blog_queue.json", ROOT / "blog"
VERCEL = ROOT / "vercel.json"
BLOG_IMAGES = ROOT / "assets" / "images" / "blog"
INDEX = BLOG / "index.html"
START, END = "<!-- AUTO_POSTS_START -->", "<!-- AUTO_POSTS_END -->"

def env(name):
    value = os.getenv(name, "").strip()
    if not value: raise RuntimeError(f"Missing GitHub secret: {name}")
    return value

def optional_env(name, default=""):
    value = os.getenv(name, "").strip()
    return value or default

def require_url(name):
    value = env(name)
    if not re.match(r"^https?://", value, re.I):
        raise RuntimeError(f"Invalid GitHub secret {name}: URL must start with https://")
    return value

def optional_url(name, default=""):
    value = optional_env(name, default).strip()
    if value and not re.match(r"^https?://", value, re.I):
        print(f"WARNING: Ignoring invalid {name}; URL must start with https://", file=sys.stderr)
        return ""
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

def generate_valid_article(topic, attempts=3):
    correction=""
    errors=[]
    for attempt in range(1,attempts+1):
        try:
            article=generate(topic,correction)
            validate(article)
            return article
        except RuntimeError as exc:
            errors.append(str(exc))
            if attempt == attempts: break
            correction=f"IMPORTANT CORRECTION: the previous response failed validation ({exc}). Return a complete article that fixes this exact issue."
            print(f"WARNING: Article attempt {attempt} failed validation; retrying. {exc}",file=sys.stderr)
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

def image_role_prompt(topic, article, role):
    base = f'''SOLA Medical Supply journal article visual.
Article title: {article['title']}
Keyword: {topic['keyword']}
Category: {topic['category']}
Audience: professional aesthetic clinics, medical spas, resellers and distributors.
Create an original AI-generated image that reflects the article's procurement theme, not a generic stock image.
Style: premium B2B medical procurement editorial, clean clinical lighting, soft pink-white SOLA mood, elegant, trustworthy, no people, no readable text, no logos, no brand labels, no fake certificates, no price tags, no medical claims, no before/after results.'''
    roles = {
        "cover": "Role: article cover. Show the overall idea of the article as a polished editorial hero image with product sourcing, catalogue planning, and subtle wholesale logistics cues. Square 1:1 composition, centered subject, suitable for a blog card and article cover.",
        "concept": "Role: main concept illustration. Visualize the central buyer problem of the article: comparing product categories, choosing professional sourcing options, and preparing a smarter wholesale request. Make it distinct from the cover image.",
        "checklist": "Role: buyer checklist illustration. Show a premium procurement desk scene with organized product cards, batch/expiry check symbols, quantity planning, and quotation preparation. No readable words or numbers.",
        "logistics": "Role: logistics and documentation illustration. Show careful packing, shipment planning, tracking proof, document folders, and international wholesale dispatch cues. No readable words, no country flags, no courier brand."
    }
    return f"{base}\n{roles.get(role, roles['concept'])}"

def generate_ai_image(topic, article, slug, role, suffix="", fallback=""):
    image_url = optional_url("BLOG_IMAGE_API_URL", "https://api.openai.com/v1/images/generations")
    if not image_url:
        return fallback
    image_key = optional_env("BLOG_IMAGE_API_KEY") or env("BLOG_API_KEY")
    payload = json.dumps({
        "model": optional_env("BLOG_IMAGE_MODEL", "gpt-image-1"),
        "prompt": image_role_prompt(topic, article, role),
        "size": optional_env("BLOG_IMAGE_SIZE", "1024x1024"),
        "n": 1
    }).encode()
    request = urllib.request.Request(
        image_url,
        data=payload,
        headers={"Authorization":f"Bearer {image_key}","Content-Type":"application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result=json.loads(response.read().decode())
        image_data=result["data"][0].get("b64_json")
        if not image_data: raise RuntimeError("Image API did not return b64_json")
        BLOG_IMAGES.mkdir(parents=True, exist_ok=True)
        target=BLOG_IMAGES/f"{slug}{('-' + suffix) if suffix else ''}.png"
        target.write_bytes(base64.b64decode(image_data))
        return f"../assets/images/blog/{target.name}"
    except Exception as exc:
        print(f"WARNING: AI {role} image generation failed; using fallback image. {exc}", file=sys.stderr)
        return fallback

def generate_cover(topic, article, slug):
    fallback=topic.get("image") or "../assets/images/productCatalogue.png"
    return generate_ai_image(topic, article, slug, "cover", "", fallback)

def validate(a):
    for key in ("title","meta_description","excerpt","read_time","html_body"):
        if not isinstance(a.get(key),str) or not a[key].strip(): raise RuntimeError(f"Missing generated field: {key}")
    if len(a["meta_description"])>160: raise RuntimeError("Meta description exceeds 160 characters")
    bad=re.search(r"<(script|style|iframe|img|a|form)\b",a["html_body"],re.I)
    if bad: raise RuntimeError(f"Forbidden generated tag: {bad.group(1)}")
    allowed={"h2","h3","p","ul","li","strong","em"}
    tags={t.lower() for t in re.findall(r"</?\s*([a-z0-9]+)\b",a["html_body"],re.I)}
    extra=tags-allowed
    if extra: raise RuntimeError(f"Unsupported generated tag(s): {', '.join(sorted(extra))}")
    words=len(re.sub(r"<[^>]+>"," ",a["html_body"]).split())
    if words<850: raise RuntimeError(f"Article too short: {words} words")
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

def generate_inline_images(topic,article,slug,cover):
    pool=unique_image_pool(topic,cover)
    used={normalize_article_image(cover)}
    roles=[
        ("concept","concept",f"{article['title']} concept visual",f"Article concept image for {topic['keyword']}: a visual summary of the buyer problem and sourcing decision."),
        ("checklist","buyer-checklist",f"{article['title']} buyer checklist",f"Buyer checklist image for {topic['keyword']}: product details, quantities and quotation preparation in one professional workflow."),
        ("logistics","logistics-documentation",f"{article['title']} logistics and documentation",f"Logistics image for {topic['keyword']}: packing, documentation and tracking questions before international dispatch.")
    ]
    images=[]
    for role,suffix,alt,caption in roles:
        fallback=fallback_from_pool(pool,used)
        src=generate_ai_image(topic,article,slug,role,suffix,fallback)
        key=normalize_article_image(src)
        if src and key not in {normalize_article_image(x[0]) for x in images} and key != normalize_article_image(cover):
            images.append((src,alt,caption))
        elif fallback:
            images.append((fallback,alt,caption))
    return images

def inject_inline_illustrations(body,topic,cover,illustrations=None):
    topic=topic or {}
    illustrations=illustrations or []
    if illustrations:
        body=insert_after_nth_h2(body,3,article_illustration(*illustrations[0]))
    if len(illustrations)>1:
        body=insert_after_nth_h2(body,6,article_visual_grid(illustrations[1:3]))
    return body

def page(a,slug,category,date,image,topic=None,illustrations=None):
    body=inject_inline_illustrations(a["html_body"],topic or {},image,illustrations)
    title,desc=html.escape(a["title"]),html.escape(a["meta_description"],quote=True)
    image=html.escape(image,quote=True)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | SOLA</title><meta name="description" content="{desc}"><link rel="canonical" href="https://www.solamedicalsupply.com/blog/{slug}.html"><link rel="icon" href="../assets/icons/logo.png"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/css/style.css"></head><body class="article-page"><nav class="nav"><div class="wrap nav-inner"><a class="brand" href="../index.html"><img src="../assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><div class="article-nav"><a href="index.html">← Journal</a><a class="btn primary" href="../products.html">Build a quote list</a></div></div></nav><main><header class="article-hero"><div class="wrap article-wrap"><span>{html.escape(category.upper())} · {html.escape(a['read_time'])}</span><h1>{title}</h1><p>{desc}</p><div class="article-meta">SOLA Knowledge Team · {date}</div></div></header><div class="article-cover wrap"><img src="{image}" alt="{title}" loading="lazy"></div><article class="article-body article-wrap"><p class="article-intro">{html.escape(a['excerpt'])}</p>{body}<div class="article-end"><h2>Planning a wholesale request?</h2><p>Send product names, quantities and destination for a tailored discussion.</p><a class="btn primary" href="https://wa.me/84981778670">Contact SOLA on WhatsApp →</a></div><p class="disclaimer">General educational content for professional buyers. Not medical, legal, regulatory or import advice.</p></article></main><footer class="footer new-footer"><div class="wrap"><div class="footer-top"><div><img src="../assets/icons/logoNgang.png" alt="SOLA"><p>Professional aesthetic wholesale supply for clinics, spas, resellers and distributors worldwide.</p></div><div><b>Explore</b><a href="../products.html">Products</a><a href="../brands.html">Brands</a><a href="index.html">Journal</a></div><div><b>Company</b><a href="../about.html">About SOLA</a><a href="../faq.html">FAQ</a><a href="../contact.html">Contact</a></div><div><b>Connect</b><a href="https://wa.me/84981778670">WhatsApp</a><a href="mailto:sales@solamedicalsupply.com">Email sales</a></div></div><div class="footer-bottom"><span>© 2026 SOLA Medical Supply</span><span>Educational content for professional buyers</span></div></div></footer><script src="../assets/js/main.js"></script></body></html>'''

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
    cover=generate_cover(topic,article,slug)
    illustrations=generate_inline_images(topic,article,slug,cover)
    now=datetime.now(timezone.utc); target.write_text(page(article,slug,topic["category"],now.strftime("%B %d, %Y"),cover,topic,illustrations),encoding="utf-8"); add_card(article,slug,topic["category"],cover)
    illustration_paths=[src for src,_,_ in illustrations]
    topic.update({"status":"published","slug":slug,"published_at":now.isoformat(),"cover":cover,"illustrations":illustration_paths}); data["published"].append({"title":article["title"],"slug":slug,"published_at":now.isoformat(),"cover":cover,"illustrations":illustration_paths})
    QUEUE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    redirect_count=sync_blog_redirects()
    print(f"Published {target.name}; synchronized {redirect_count} blog redirect(s)")

if __name__=="__main__":
    try: main()
    except Exception as exc: print(f"ERROR: {exc}",file=sys.stderr); sys.exit(1)
