import type { MetadataRoute } from "next";
import { products, articles } from "@/lib/data";
import { site } from "@/lib/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.7 },
    { path: "/services", priority: 0.9 },
    { path: "/pharmacy", priority: 0.9 },
    { path: "/products", priority: 0.9 },
    { path: "/health-information", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
    { path: "/request-medicine", priority: 0.9 },
    { path: "/book", priority: 0.8 },
    { path: "/track", priority: 0.6 },
  ].map((r) => ({
    url: `${site.url}${r.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: r.priority,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${site.url}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${site.url}/health-information/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...articleRoutes];
}
