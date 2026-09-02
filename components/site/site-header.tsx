"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu, MessageCircleHeart, Phone, Clock, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { SiteLink } from "@/components/site/link";
import { SiteSearch } from "@/components/site/site-search";
import { useChatbot } from "@/components/site/chatbot-context";
import { useLanguage } from "@/components/site/language-provider";
import { LanguageToggle } from "@/components/site/language-toggle";
import { business, whatsappLink } from "@/lib/business";
import { track } from "@/lib/analytics";
import { useOpenStatus } from "@/lib/open-status";
import { useCurrentPath } from "@/components/site/use-current-path";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.home" },
  { href: "/book", labelKey: "nav.book" },
  { href: "/track", labelKey: "nav.track" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/services", labelKey: "nav.services" },
  { href: "/pharmacy", labelKey: "nav.pharmacy" },
  { href: "/products", labelKey: "nav.products" },
  { href: "/health-information", labelKey: "nav.health" },
  { href: "/contact", labelKey: "nav.contact" },
];

/** Core links shown in the condensed lg–xl desktop nav. Between 1024–1279px
 *  there was previously NO desktop nav (hamburger only) and no bottom bar —
 *  a tablet dead zone. Book/Track (the two core actions) plus the main
 *  destinations now appear from lg; the full set from xl. */
const NAV_CORE = new Set(["/book", "/track", "/services", "/products", "/contact"]);

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const chatbot = useChatbot();
  const status = useOpenStatus();
  const currentPath = useCurrentPath();
  const { t } = useLanguage();

  const isNavActive = (href: string) => {
    if (!currentPath) return false;
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  // Global ⌘K / Ctrl+K opens site search.
  const onKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onKeydown]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Utility bar */}
      <div className="hidden bg-foreground text-background md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1.5 text-xs">
          <p className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            <span>
              {business.area}, {business.city}
            </span>
            <span aria-hidden="true" className="mx-1 opacity-40">
              •
            </span>
            <Clock aria-hidden="true" className="size-3.5" />
            <span>
              {status.ready
                ? `${status.open ? t("status.open") : t("status.closed")} · ${status.range}`
                : `${business.hours[0].day}: ${business.hours[0].open} – ${business.hours[0].close}`}
            </span>
          </p>
          <a
            href={business.phoneHref}
            className="inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-medium underline-offset-2 hover:underline"
          >
            <Phone aria-hidden="true" className="size-3.5" />
            {business.phone}
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={`border-b bg-background/90 backdrop-blur-md transition-shadow ${
          scrolled ? "shadow-[0_2px_16px_-8px_rgba(31,42,40,0.25)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <SiteLink href="/" ariaLabel="Medivyx Medical Care — home" trackLabel="logo">
            <Logo />
          </SiteLink>

          <nav aria-label="Main navigation" className="hidden min-w-0 lg:block">
            <ul className="flex items-center gap-0.5">
              {NAV_ITEMS.filter(
                (item) => item.href !== "/" && (NAV_CORE.has(item.href) || undefined)
              ).map((item) => {
                const active = isNavActive(item.href);
                return (
                  <li key={item.href}>
                    <SiteLink
                      href={item.href}
                      trackLabel={`nav-${t(item.labelKey).toLowerCase()}`}
                      ariaLabel={active ? `${t(item.labelKey)} (current page)` : undefined}
                      className={cn(
                        "whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-secondary hover:text-secondary-foreground",
                      )}
                    >
                      {t(item.labelKey)}
                    </SiteLink>
                  </li>
                );
              })}
              {/* Extended links — full navigation from xl (hidden at lg
                  where only the core set fits alongside the header actions). */}
              {NAV_ITEMS.filter(
                (item) =>
                  item.href !== "/" &&
                  !NAV_CORE.has(item.href)
              ).map((item) => {
                const active = isNavActive(item.href);
                return (
                  <li key={item.href} className="hidden xl:block">
                    <SiteLink
                      href={item.href}
                      trackLabel={`nav-${t(item.labelKey).toLowerCase()}`}
                      ariaLabel={active ? `${t(item.labelKey)} (current page)` : undefined}
                      className={cn(
                        "whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-secondary hover:text-secondary-foreground",
                      )}
                    >
                      {t(item.labelKey)}
                    </SiteLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="rounded-full text-primary hover:bg-secondary hover:text-primary"
              aria-label="Open search (Ctrl+K)"
              title="Search — Ctrl+K"
            >
              <Search aria-hidden="true" className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={chatbot.toggle}
              className="hidden rounded-full text-primary hover:bg-secondary hover:text-primary md:inline-flex"
              aria-label="Open the Ask Medivyx assistant"
              title={t("header.askMedivyx")}
            >
              <MessageCircleHeart aria-hidden="true" className="size-5" />
            </Button>
            <LanguageToggle compact />
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="hidden rounded-full px-5 sm:inline-flex"
            >
              <SiteLink href="/request-medicine" trackLabel="header-request-medicine">
                Request Medicine
              </SiteLink>
            </Button>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="xl:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu aria-hidden="true" className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-xs p-0 rounded-l-2xl"
              >
                <SheetHeader className="border-b p-4">
                  <SheetTitle asChild>
                    <div>
                      <Logo compact />
                    </div>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto scrollbar-thin">
                  <ul className="flex flex-col p-2">
                    {NAV_ITEMS.map((item) => {
                      const active = isNavActive(item.href);
                      return (
                        <li key={item.href}>
                          <SiteLink
                            href={item.href}
                            onClick={() => setOpen(false)}
                            ariaLabel={active ? `${t(item.labelKey)} (current page)` : undefined}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/85 hover:bg-secondary",
                            )}
                          >
                            {t(item.labelKey)}
                            {active && (
                              <span
                                aria-hidden="true"
                                className="size-1.5 rounded-full bg-primary"
                              />
                            )}
                          </SiteLink>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 flex flex-col gap-2 border-t p-4">
                    <a
                      href={business.phoneHref}
                      onClick={() => track("call_click", { source: "mobile-sheet" })}
                      className="flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-foreground/85 transition-colors hover:bg-secondary"
                    >
                      <Phone aria-hidden="true" className="size-4 text-primary" />
                      Call {business.phone}
                    </a>
                    <a
                      href={whatsappLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        track("whatsapp_click", { source: "mobile-sheet" });
                        setOpen(false);
                      }}
                      className="flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-foreground/85 transition-colors hover:bg-secondary"
                    >
                      <MessageCircleHeart aria-hidden="true" className="size-4 text-primary" />
                      WhatsApp us
                    </a>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        chatbot.toggle();
                      }}
                      variant="outline"
                      className="w-full rounded-full"
                    >
                      <MessageCircleHeart aria-hidden="true" className="size-4" />
                      {t("header.askMedivyx")}
                    </Button>
                    <Button asChild className="w-full rounded-full">
                      <SiteLink
                        href="/request-medicine"
                        onClick={() => setOpen(false)}
                      >
                        {t("header.requestMedicine")}
                      </SiteLink>
                    </Button>
                  </div>
                  <div className="px-4 pb-4 pt-2">
                    <LanguageToggle />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Global ⌘K search */}
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
