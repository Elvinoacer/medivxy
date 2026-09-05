"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MessageSquareQuote, PenLine, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, StarRatingInput } from "@/components/site/star-rating";
import { useLanguage } from "@/components/site/language-provider";

/**
 * Product reviews section — fetched client-side so the product page stays
 * statically renderable. Ratings + short comments, POST-able by visitors.
 */

/** Human date for review timestamps ("5 Sept 2026"). */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

interface Review {
  slug: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Summary {
  avg: number;
  count: number;
}

export function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [writing, setWriting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data.ok) {
          setReviews(data.reviews ?? []);
          setSummary(data.summary ?? null);
        } else {
          setReviews([]);
        }
      } catch {
        if (active) setReviews([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  function openForm() {
    setWriting(true);
    setFormOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t("reviews.needRating"));
      return;
    }
    if (name.trim().length < 2) {
      setError(t("reviews.needName"));
      return;
    }
    if (comment.trim().length < 4) {
      setError(t("reviews.needComment"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("reviews.error"));
        return;
      }
      setReviews((list) => [data.review, ...(list ?? [])]);
      setSummary(data.summary ?? null);
      setFormOpen(false);
      setRating(0);
      setName("");
      setComment("");
      toast.success(t("reviews.thanks"), {
        description: productName,
      });
    } catch {
      setError(t("reviews.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-12 scroll-mt-28">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="reviews-heading"
            className="flex items-center gap-2.5 font-display text-xl font-semibold text-foreground sm:text-2xl"
          >
            <MessageSquareQuote aria-hidden="true" className="size-5.5 text-primary" />
            {t("reviews.title")}
          </h2>
          {summary && summary.count > 0 && (
            <StarRating value={summary.avg} count={summary.count} size="md" />
          )}
        </div>

        {/* Summary strip */}
        {summary && summary.count > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm">
            <span className="font-display text-2xl font-bold text-foreground">
              {summary.avg.toFixed(1)}
              <span className="text-sm font-medium text-muted-foreground"> / 5</span>
            </span>
            <StarRating value={summary.avg} size="md" />
            <span className="text-muted-foreground">
              {summary.count} {t("reviews.count")}
            </span>
            <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              {t("reviews.note")}
            </span>
          </div>
        )}

        {/* Review list */}
        <div className="mt-6">
          {reviews === null ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading reviews">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-2xl border p-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("reviews.empty")}
            </p>
          ) : (
            <ul className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin pr-1 pb-16 sm:pb-0" aria-label={t("reviews.title")}>
              {reviews.map((r) => (
                <li
                  key={`${r.slug}-${r.createdAt}-${r.name}`}
                  className="review-in rounded-2xl border bg-background/60 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                      >
                        {r.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                      <StarRating value={r.rating} />
                    </div>
                    <time
                      dateTime={r.createdAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(r.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Write a review */}
        <div className="mt-6">
          {!formOpen ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={openForm}
            >
              <PenLine aria-hidden="true" className="size-4" />
              {t("reviews.write")}
            </Button>
          ) : (
            <form
              onSubmit={onSubmit}
              className="review-in space-y-4 rounded-2xl border bg-background/60 p-5"
              aria-label={t("reviews.form")}
            >
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-foreground">
                  {t("reviews.yourRating")}
                </span>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  legend={t("reviews.yourRating")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="review-name">{t("reviews.name")}</Label>
                  <Input
                    id="review-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amina W."
                    maxLength={60}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="review-comment">{t("reviews.comment")}</Label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("reviews.placeholder")}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-right text-[0.6875rem] tabular-nums text-muted-foreground">
                    {comment.length}/500
                  </p>
                </div>
              </div>
              {error && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setFormOpen(false);
                    setWriting(false);
                    setError("");
                  }}
                  disabled={submitting}
                >
                  {t("reviews.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="rounded-full px-6"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                      {t("reviews.submitting")}
                    </>
                  ) : (
                    <>
                      <Send aria-hidden="true" className="size-4" />
                      {t("reviews.submit")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
          {writing && !formOpen && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" />
              {t("reviews.posted")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
