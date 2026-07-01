import Image from "next/image";
import Link from "next/link";
import { Product, productSlug, whatsappUrl } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const message = `Hello SOLA Medical Supply, I would like a wholesale quote for ${product.name}.`;

  return (
    <article className="product-card">
      <Link href={`/products/${productSlug(product)}`} className="product-image">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={420} height={320} />
        ) : (
          <span>{product.name}</span>
        )}
      </Link>
      <div className="product-copy">
        <span className="pill">{product.tag || product.category}</span>
        <h3>
          <Link href={`/products/${productSlug(product)}`}>{product.name}</Link>
        </h3>
        <p>
          {product.brand}
          {product.origin ? ` · ${product.origin}` : ""}
        </p>
      </div>
      <div className="product-actions">
        <Link href={`/products/${productSlug(product)}`}>Details</Link>
        <a href={whatsappUrl(message)}>Quote</a>
      </div>
    </article>
  );
}
