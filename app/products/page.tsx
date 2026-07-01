import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductExplorer } from "@/components/ProductExplorer";
import { categories, products } from "@/lib/products";

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-title">
          <span>Catalogue</span>
          <h1>Search the full SOLA product range.</h1>
          <p>Use this as the buyer-facing catalogue and internal lead entry point for sales conversations.</p>
        </div>
        <ProductExplorer products={products} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
