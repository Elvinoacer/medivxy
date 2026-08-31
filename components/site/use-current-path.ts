"use client";

import { usePathname } from "next/navigation";

/**
 * Current in-app path, portable across both builds.
 *
 * Standalone build (this project): real Next.js routes, so the path comes
 * from next/navigation's usePathname — it stays correct through App Router
 * client-side navigations even though the layout persists.
 *
 * The preview build (the live sandbox mirror) uses the same header/component
 * code with a hash-based version of this hook — see the adapter pattern
 * documented in components/site/link.tsx.
 *
 * Returns null until mounted in a context where the pathname is unavailable,
 * keeping markup stable; the active-nav highlight appears after hydration.
 */
export function useCurrentPath(): string | null {
  const pathname = usePathname();
  if (!pathname) return null;
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}
