"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Navigation adapter for shared site components.
 * In this (Next.js) build it wraps next/link with light analytics.
 */

interface SiteLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** Analytics label, e.g. "hero-primary" */
  trackLabel?: string;
  onClick?: () => void;
}

export function SiteLink({
  href,
  children,
  className,
  style,
  ariaLabel,
  trackLabel,
  onClick,
}: SiteLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      style={style}
      className={cn(className)}
      onClick={() => {
        if (trackLabel) track("navigation", { to: href, label: trackLabel });
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
