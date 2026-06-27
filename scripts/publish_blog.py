import argparse, base64, html, json, os, re, sys, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE, BLOG = ROOT / "data" / "blog_queue.json", ROOT / "blog"
BLOG_IMAGES = ROOT / "assets" / "images" / "blog"
INDEX = BLOG / "index.html"
START, END = "<!-- AUTO_POSTS_START -->", "<!-- AUTO_POSTS_END -->"

def env(name):
    value = os.getenv(name, "").strip()
    if not value: raise RuntimeError(f"Missing GitHub secret: {name}")
    return value

def optional_env(name, default=""):
    return os.getenv(name, default).strip()

def load_queue():
    try: data = json.loads(QUEUE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc: raise RuntimeError(f"Invalid blog_queue.json: {exc}") from exc
    if not isinstance(data.get("topics"), list) or not isinstance(data.get("published"), list):
        raise RuntimeError("blog_queue.json requires topics[] and published[]")
    return data

def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:78]

def article_format(topic):
    if topic.get("format") != "buyer_guide":
        return "Write 6 to 8 H2 sections, each with 2-3 full paragraphs of 3-5 sentences, plus one checklist (ul/li)."
    return '''Use this exact article structure:
Intro: 2-3 short lines that directly address the buyer's problem.
H2: What is it?
H2: Who usually orders it?
H2: What buyers should check
H2: Shipping / packing / storage notes
H2: MOQ / quotation / how to order
H2: FAQ
Under FAQ, include 4-6 common buyer questions and concise answers using h3 headings.
CTA wording near the end must include: Contact SOLA for wholesale quotation via WhatsApp.'''

def generate(topic):
    prompt = f'''Write an original English article for SOLA Medical Supply's professional buyer journal.
Title brief: {topic['title']}
Keyword: {topic['keyword']}; Category: {topic['category']}.
CRITICAL LENGTH REQUIREMENT: html_body must contain AT LEAST 950 words of body text (excluding HTML tags). {article_format(topic)} Do not summarise, do not stop early, do not write a short article. Aim for 1000-1200 words. Audience: clinics, spas, resellers and distributors. This is procurement education, not medical advice. Never invent certifications, partnerships, prices, stock, approvals or customer results. Do not claim SOLA is an authorised distributor. Mention SOLA only in the closing CTA.
Avoid unsafe SEO angles such as buying prescription products without prescription, cheap toxin claims, fast fat-loss results, or whitening injection result claims.
Return JSON only: title, meta_description (max 155 chars), excerpt (35-50 words), read_time, html_body. html_body may use only h2, h3, p, ul, li, strong and em tags.'''
    payload = json.dumps({"model":env("BLOG_MODEL"),"temperature":0.5,"max_tokens":4000,"messages":[{"role":"system","content":"You are a careful B2B editor. Return valid JSON only."},{"role":"user","content":prompt}]}).encode()
    request = urllib.request.Request(env("BLOG_API_URL"), data=payload, headers={"Authorization":f"Bearer {env('BLOG_API_KEY')}","Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response: result=json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"API HTTP {exc.code}: {exc.read().decode(errors='replace')[:600]}") from exc
    try: text=result["choices"][0]["message"]["content"].strip()
    except (KeyError,IndexError,TypeError) as exc: raise RuntimeError("API is not chat/completions compatible") from exc
    text=re.sub(r"^```(?:json)?\s*|\s*```$","",text,flags=re.I)
    try: return json.loads(text)
    except json.JSONDecodeError as exc: raise RuntimeError(f"Model returned invalid JSON: {exc}") from exc

def generate_cover(topic, article, slug):
    prompt = f'''Create a premium editorial cover image for a SOLA Medical Supply journal article.
Topic: {article['title']}
Keyword: {topic['keyword']}
Category: {topic['category']}
Style: clean professional B2B medical procurement editorial, bright clinical lighting, elegant product-sourcing desk scene, subtle wholesale logistics cues, no people, no readable text, no logos, no brand labels, no fake certificates, no claims, high-end aesthetic medical supply mood.
Composition: square 1:1 cover image, centered subject, soft neutral background, suitable for a website article card and article cover.'''
    payload = json.dumps({
        "model": optional_env("BLOG_IMAGE_MODEL", "gpt-image-1"),
        "prompt": prompt,
        "size": optional_env("BLOG_IMAGE_SIZE", "1024x1024"),
        "n": 1
    }).encode()
    request = urllib.request.Request(
        optional_env("BLOG_IMAGE_API_URL", "https://api.openai.com/v1/images/generations"),
        data=payload,
        headers={"Authorization":f"Bearer {env('BLOG_API_KEY')}","Content-Type":"application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result=json.loads(response.read().decode())
        image_data=result["data"][0].get("b64_json")
        if not image_data: raise RuntimeError("Image API did not return b64_json")
        BLOG_IMAGES.mkdir(parents=True, exist_ok=True)
        target=BLOG_IMAGES/f"{slug}.png"
        target.write_bytes(base64.b64decode(image_data))
        return f"../assets/images/blog/{slug}.png"
    except Exception as exc:
        print(f"WARNING: AI cover image generation failed; using queue image. {exc}", file=sys.stderr)
        return topic.get("image") or "../assets/images/productCatalogue.png"

def validate(a):
    for key in ("title","meta_description","excerpt","read_time","html_body"):
        if not isinstance(a.get(key),str) or not a[key].strip(): raise RuntimeError(f"Missing generated field: {key}")
    if len(a["meta_description"])>160: raise RuntimeError("Meta description exceeds 160 characters")
    bad=re.search(r"<(script|style|iframe|img|a|form)\b",a["html_body"],re.I)
    if bad: raise RuntimeError(f"Forbidden generated tag: {bad.group(1)}")
    words=len(re.sub(r"<[^>]+>"," ",a["html_body"]).split())
    if words<600: raise RuntimeError(f"Article too short: {words} words")

def page(a,slug,category,date,image):
    title,desc=html.escape(a["title"]),html.escape(a["meta_description"],quote=True)
    image=html.escape(image,quote=True)
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | SOLA</title><meta name="description" content="{desc}"><link rel="canonical" href="https://www.solamedicalsupply.com/blog/{slug}.html"><link rel="icon" href="../assets/icons/logo.png"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/css/style.css"></head><body class="article-page"><nav class="nav"><div class="wrap nav-inner"><a class="brand" href="../index.html"><img src="../assets/icons/logoNgang.png" alt="SOLA Medical Supply"></a><div class="article-nav"><a href="index.html">← Journal</a><a class="btn primary" href="../products.html">Build a quote list</a></div></div></nav><main><header class="article-hero"><div class="wrap article-wrap"><span>{html.escape(category.upper())} · {html.escape(a['read_time'])}</span><h1>{title}</h1><p>{desc}</p><div class="article-meta">SOLA Knowledge Team · {date}</div></div></header><div class="article-cover wrap"><img src="{image}" alt="{title}" loading="lazy"></div><article class="article-body article-wrap"><p class="article-intro">{html.escape(a['excerpt'])}</p>{a['html_body']}<div class="article-end"><h2>Planning a wholesale request?</h2><p>Send product names, quantities and destination for a tailored discussion.</p><a class="btn primary" href="https://wa.me/84981778670">Contact SOLA on WhatsApp →</a></div><p class="disclaimer">General educational content for professional buyers. Not medical, legal, regulatory or import advice.</p></article></main><footer class="footer new-footer"><div class="wrap"><div class="footer-top"><div><img src="../assets/icons/logoNgang.png" alt="SOLA"><p>Professional aesthetic wholesale supply for clinics, spas, resellers and distributors worldwide.</p></div><div><b>Explore</b><a href="../products.html">Products</a><a href="../brands.html">Brands</a><a href="index.html">Journal</a></div><div><b>Company</b><a href="../about.html">About SOLA</a><a href="../faq.html">FAQ</a><a href="../contact.html">Contact</a></div><div><b>Connect</b><a href="https://wa.me/84981778670">WhatsApp</a><a href="mailto:sales@solamedicalsupply.com">Email sales</a></div></div><div class="footer-bottom"><span>© 2026 SOLA Medical Supply</span><span>Educational content for professional buyers</span></div></div></footer><script src="../assets/js/main.js"></script></body></html>'''

def add_card(a,slug,category,image):
    source=INDEX.read_text(encoding="utf-8")
    if START not in source or END not in source: raise RuntimeError("Journal index lacks AUTO_POSTS markers")
    card=f'''\n<a class="story-card" href="{slug}.html"><img src="{html.escape(image,quote=True)}" alt="{html.escape(a['title'])}" loading="lazy"><div><span>{html.escape(category.upper())} · {html.escape(a['read_time'].upper())}</span><h3>{html.escape(a['title'])}</h3><p>{html.escape(a['excerpt'])}</p><b>Read article →</b></div></a>'''
    INDEX.write_text(source.replace(START,START+card,1),encoding="utf-8")

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--check",action="store_true"); args=parser.parse_args()
    data=load_queue(); env("BLOG_API_URL"); env("BLOG_API_KEY"); env("BLOG_MODEL")
    if START not in INDEX.read_text(encoding="utf-8"): raise RuntimeError("Automation markers missing from blog/index.html")
    if args.check: print("Configuration valid."); return
    topic=next((x for x in data["topics"] if x.get("status")=="pending"),None)
    if not topic: print("No pending topics."); return
    article=generate(topic); validate(article); slug=slugify(article["title"]); target=BLOG/f"{slug}.html"
    if target.exists(): raise RuntimeError(f"Refusing to overwrite {target.name}")
    cover=topic.get("image") or generate_cover(topic,article,slug)
    now=datetime.now(timezone.utc); target.write_text(page(article,slug,topic["category"],now.strftime("%B %d, %Y"),cover),encoding="utf-8"); add_card(article,slug,topic["category"],cover)
    topic.update({"status":"published","slug":slug,"published_at":now.isoformat(),"cover":cover}); data["published"].append({"title":article["title"],"slug":slug,"published_at":now.isoformat(),"cover":cover})
    QUEUE.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"); print(f"Published {target.name}")

if __name__=="__main__":
    try: main()
    except Exception as exc: print(f"ERROR: {exc}",file=sys.stderr); sys.exit(1)
