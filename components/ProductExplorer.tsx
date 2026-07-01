"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductExplorer({
  products,
  categories
}: {
  products: Product[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesFeatured = !featuredOnly || product.featured;
      const searchable = `${product.name} ${product.brand} ${product.category} ${product.tag || ""}`.toLowerCase();
      return matchesCategory && matchesFeatured && searchable.includes(normalizedQuery);
    });
  }, [products, query, category, featuredOnly]);

  return (
    <section className="explorer" id="catalogue">
      <div className="section-heading">
        <span>Dynamic catalogue</span>
        <h2>Find products faster, then route the lead to sales.</h2>
      </div>
      <div className="filters">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product, brand, category..."
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>All</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="toggle">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
          />
          Featured only
        </label>
      </div>
      <p className="result-count">{filteredProducts.length} products available</p>
      <div className="product-grid">
        {filteredProducts.slice(0, 60).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filteredProducts.length > 60 && (
        <p className="muted">Showing first 60 matches. Use search or category filters to narrow the list.</p>
      )}
    </section>
  );
}
