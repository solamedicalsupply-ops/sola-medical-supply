import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { QuoteForm } from "@/components/QuoteForm";
import { findProduct, productSlug, products, relatedProducts, whatsappUrl } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: productSlug(product) }));
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = findProduct(params.slug);
  if (!product) notFound();

  const related = relatedProducts(product);
  const message = `Hello SOLA Medical Supply, I would like a wholesale quote for ${product.name}. Quantity:`;

  return (
    <>
      <Header />
      <main className="product-detail">
        <Link className="back-link" href="/products">
          Back to catalogue
        </Link>
        <section className="detail-grid">
          <div className="detail-image">
            <Image src={product.image || "/assets/icons/logo.png"} alt={product.name} width={720} height={560} priority />
          </div>
          <div className="detail-copy">
            <span className="pill">{product.category}</span>
            <h1>{product.name}</h1>
            <p>
              {product.brand}
              {product.origin ? ` · ${product.origin}` : ""} · {product.tag || "Wholesale product"}
            </p>
            <div className="detail-points">
              <div>
                <strong>Best next step</strong>
                <span>Ask buyer for quantity, destination and expected order timing.</span>
              </div>
              <div>
                <strong>Sales proof</strong>
                <span>Offer product photo, batch/expiry and packing proof before shipping.</span>
              </div>
              <div>
                <strong>Lead tracking</strong>
                <span>This page is captured when the quote form is submitted.</span>
              </div>
            </div>
            <div className="hero-actions">
              <a className="primary-action" href={whatsappUrl(message)}>
                Quote on WhatsApp
              </a>
              <a className="secondary-action" href="#quote">
                Send quote form
              </a>
            </div>
          </div>
        </section>

        <section className="quote-section" id="quote">
          <div>
            <span className="eyebrow">Product quote</span>
            <h2>Capture a structured request for {product.name}.</h2>
            <p>Sales receives the product context, buyer details and lead source in one request.</p>
          </div>
          <QuoteForm productName={product.name} compact />
        </section>

        {related.length > 0 && (
          <section className="related">
            <div className="section-heading">
              <span>Related products</span>
              <h2>Keep the buyer moving in the same category.</h2>
            </div>
            <div className="product-grid compact-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
