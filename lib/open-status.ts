"use client";

import { useEffect, useState } from "react";
import { business, hoursForDate, isOpenAt } from "@/lib/business";

export interface OpenStatusState {
  /** True once mounted — before this the weekday fallback hours are shown. */
  ready: boolean;
  /** Whether the pharmacy is open right now (only meaningful when `ready`). */
  open: boolean;
  /** Display range for today, e.g. "8:00 AM – 6:00 PM". */
  range: string;
}

const WEEKDAY_FALLBACK = `${business.hours[0].open} – ${business.hours[0].close}`;

function computeStatus(): { open: boolean; range: string } {
  const now = new Date();
  const row = hoursForDate(now);
  return {
    open: isOpenAt(now),
    range: `${row.open} – ${row.close}`,
  };
}

/**
 * Live opening status derived from `business.hours` (single source of truth).
 *
 * Renders a neutral weekday fallback until mounted so the SSR markup stays
 * stable (no hydration mismatch when server and visitor timezones differ).
 * Refreshes every minute while mounted.
 */
export function useOpenStatus(): OpenStatusState {
  const [state, setState] = useState<OpenStatusState>({
    ready: false,
    open: false,
    range: WEEKDAY_FALLBACK,
  });

  useEffect(() => {
    const update = () => setState({ ready: true, ...computeStatus() });
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return state;
}
