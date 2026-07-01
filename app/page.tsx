import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductExplorer } from "@/components/ProductExplorer";
import { QuoteForm } from "@/components/QuoteForm";
import { categories, featuredProducts, products, whatsappUrl } from "@/lib/products";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-media">
            <Image src="/assets/images/hero-banner-4.png" alt="SOLA product supply" fill priority />
          </div>
          <div className="hero-content">
            <span className="eyebrow">Dynamic wholesale engine</span>
            <h1>Premium aesthetic supply, designed to capture every serious buyer.</h1>
            <p>
              A fast product catalogue with tracked quote forms, WhatsApp handoff and source analytics for SOLA sales.
            </p>
            <div className="hero-actions">
              <Link className="primary-action" href="/products">
                Browse catalogue
              </Link>
              <a className="secondary-action" href={whatsappUrl("Hello SOLA Medical Supply, I need a wholesale quote.")}>
                Talk on WhatsApp
              </a>
            </div>
            <div className="signal-row">
              <div>
                <strong>{products.length}</strong>
                <span>catalogue items</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>sales categories</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>lead capture</span>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div className="workflow-card">
            <span>01</span>
            <h3>Buyer explores</h3>
            <p>Search by product, brand, use case or category without waiting for a PDF price list.</p>
          </div>
          <div className="workflow-card">
            <span>02</span>
            <h3>Lead is captured</h3>
            <p>Quote requests include product interest, quantity, page source and UTM details.</p>
          </div>
          <div className="workflow-card">
            <span>03</span>
            <h3>Sales follows up</h3>
            <p>WhatsApp opens with context so the conversation starts closer to closing.</p>
          </div>
        </section>

        <section className="featured">
          <div className="section-heading">
            <span>High intent products</span>
            <h2>Feature the products your WhatsApp buyers ask for most.</h2>
          </div>
          <div className="mini-grid">
            {featuredProducts.slice(0, 8).map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="mini-product">
                <Image src={product.image || "/assets/icons/logo.png"} alt={product.name} width={112} height={88} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <ProductExplorer products={products} categories={categories} />

        <section className="quote-section" id="quote">
          <div>
            <span className="eyebrow">Quote routing</span>
            <h2>Send the lead to Sheets, email or CRM with source context.</h2>
            <p>
              The form is ready for webhook routing. Add your Google Sheets or CRM webhook in Vercel environment
              variables when you are ready to collect live leads.
            </p>
          </div>
          <QuoteForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
