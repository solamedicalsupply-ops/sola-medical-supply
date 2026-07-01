import rawProducts from "./products.json";

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  origin?: string;
  tag?: string;
  image?: string;
  featured?: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const products: Product[] = (rawProducts as Product[]).map((product, index) => ({
  ...product,
  id: `${slugify(product.name)}-${index}`
}));

export const categories = Array.from(new Set(products.map((product) => product.category))).sort();
export const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();
export const featuredProducts = products.filter((product) => product.featured).slice(0, 12);

export function productSlug(product: Product) {
  return product.id;
}

export function findProduct(slug: string) {
  return products.find((product) => productSlug(product) === slug);
}

export function relatedProducts(product: Product) {
  return products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);
}

export function whatsappUrl(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "84981778670";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
