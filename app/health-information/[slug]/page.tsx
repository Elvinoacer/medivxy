import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/site/views/article-view";
import { getArticle, articles } from "@/lib/data";
import { site } from "@/lib/business";
import { escapeJsonLd } from "@/lib/utils";

export function generateStaticParams(): { slug: string }[] {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/health-information/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `/health-information/${article.slug}`,
      publishedTime: article.publishedAt,
      images: [{ url: article.image, alt: article.imageAlt }],
    },
  };
}

export default async function Page({
  params,
}: PageProps<"/health-information/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: `${site.url}${article.image}`,
    datePublished: article.publishedAt,
    author: {
      "@type": "Organization",
      name: "Medivyx Medical Care",
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Medivyx Medical Care",
      logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` },
    },
    mainEntityOfPage: `${site.url}/health-information/${article.slug}`,
  };

  return (
    <>
      <ArticleView article={article} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
    </>
  );
}
