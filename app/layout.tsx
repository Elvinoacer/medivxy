import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MobileNavBar } from "@/components/site/mobile-nav-bar";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { BackToTop } from "@/components/site/back-to-top";
import { ThemeScript } from "@/components/site/theme-script";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Chatbot } from "@/components/site/chatbot";
import { ChatbotProvider } from "@/components/site/chatbot-context";
import { LanguageProvider } from "@/components/site/language-provider";
import { CartProvider } from "@/components/site/cart-provider";
import { CartSheet } from "@/components/site/cart-sheet";
import { business, site } from "@/lib/business";
import { escapeJsonLd } from "@/lib/utils";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s | Medivyx Medical Care",
  },
  description: site.seoDescription,
  keywords: [...site.keywords],
  applicationName: business.name,
  authors: [{ name: business.name }],
  creator: business.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: site.url,
    siteName: business.name,
    title: site.title,
    description: site.seoDescription,
    images: [
      {
        url: "/images/hero-pharmacy.webp",
        width: 1536,
        height: 768,
        alt: "Inside the Medivyx Medical Care pharmacy in Roysambu, Nairobi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.seoDescription,
    images: ["/images/hero-pharmacy.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#177457",
  width: "device-width",
  initialScale: 1,
};

function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "MedicalBusiness"],
    name: business.name,
    description: site.seoDescription,
    url: site.url,
    logo: `${site.url}/icon.svg`,
    areaServed: `${business.area}, ${business.city}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.city,
      addressRegion: "Nairobi",
      addressCountry: "KE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: business.phone,
      contactType: "customer service",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans">
        <LanguageProvider>
        <ChatbotProvider>
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to main content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
          <MobileNavBar />
          <WhatsAppFab />
          <BackToTop />
          <CookieConsent />
          <Chatbot />
          <Toaster position="top-center" richColors />
          <CartSheet />
        </CartProvider>
        </ChatbotProvider>
        </LanguageProvider>
        <OrganizationJsonLd />
      </body>
    </html>
  );
}
