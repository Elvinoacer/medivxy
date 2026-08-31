import productsJson from "@/data/products.json";
import servicesJson from "@/data/services.json";
import faqsJson from "@/data/faqs.json";
import articlesJson from "@/data/articles.json";
import type {
  Product,
  ProductCategory,
  Service,
  Faq,
  Article,
} from "@/lib/types";

export const products: Product[] = productsJson as Product[];
export const services: Service[] = servicesJson as Service[];
export const faqs: Faq[] = faqsJson as Faq[];
export const articles: Article[] = articlesJson as Article[];

export const productCategories: ProductCategory[] = [
  "Medicines",
  "Wellness",
  "Baby Care",
  "Personal Care",
  "Medical Supplies",
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, count = 2): Article[] {
  const current = getArticle(slug);
  if (!current) return articles.slice(0, count);
  const sameCategory = articles.filter(
    (a) => a.slug !== slug && a.category === current.category
  );
  const others = articles.filter(
    (a) => a.slug !== slug && a.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, count);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function formatAvailability(product: Product): {
  label: string;
  tone: "in" | "low" | "ask";
} {
  if (product.prescriptionRequired) {
    return { label: "Prescription Required", tone: "ask" };
  }
  switch (product.availability) {
    case "in-stock":
      return { label: "In Stock", tone: "in" };
    case "low-stock":
      return { label: "Low Stock", tone: "low" };
    default:
      return { label: "Ask Our Team", tone: "ask" };
  }
}
