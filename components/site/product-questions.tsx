"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  MessageCircleQuestion,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/site/language-provider";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  slug: string;
  askedBy: string;
  question: string;
  answer: string;
  answeredBy: string;
  createdAt: string;
  answeredAt: string | null;
}

/**
 * Product Q&A — customers ask, the pharmacist answers from the admin
 * dashboard; answers render publicly here. Client-fetched (like reviews)
 * so product pages stay statically renderable.
 */
export function ProductQuestions({
  slug,
  productName,
}: {
  slug: string;
  productName: string;
}) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justAsked, setJustAsked] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/questions?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        setQuestions(res.ok && Array.isArray(data.questions) ? data.questions : []);
      } catch {
        if (active) setQuestions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const pending = (questions ?? []).filter((q) => !q.answer);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim().length < 10) {
      setError(t("qa.needQuestion"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          question: question.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error ?? t("qa.error"));
        return;
      }
      setQuestions((list) => [...(list ?? []), data.question as Question]);
      setFormOpen(false);
      setJustAsked(true);
      setQuestion("");
      setName("");
      toast.success(t("qa.thanks"), {
        description: t("qa.thanksDesc"),
      });
      track("question_asked", { slug });
    } catch {
      setError(t("qa.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="qa-heading" className="mt-8 scroll-mt-28">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="qa-heading"
            className="flex items-center gap-2.5 font-display text-xl font-semibold text-foreground sm:text-2xl"
          >
            <MessageCircleQuestion aria-hidden="true" className="size-5.5 text-primary" />
            {t("qa.title")}
            {questions !== null && questions.length > 0 && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {questions.length}
              </span>
            )}
          </h2>
          {!formOpen && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setFormOpen(true);
                setJustAsked(false);
              }}
            >
              <MessageCircleQuestion aria-hidden="true" className="size-4" />
              {t("qa.cta")}
            </Button>
          )}
        </div>

        {/* Ask form */}
        {formOpen && (
          <form
            onSubmit={onSubmit}
            className="qa-in mt-5 rounded-2xl border bg-background/60 p-4 sm:p-5"
            aria-label={t("qa.formTitle")}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t("qa.formTitle")}
              </p>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label={t("qa.cancel")}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="qa-name" className="text-xs font-medium text-muted-foreground">
                  {t("qa.nameLabel")}
                </Label>
                <Input
                  id="qa-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  placeholder={t("qa.namePlaceholder")}
                  autoComplete="off"
                  className="mt-1.5 h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="qa-question" className="text-xs font-medium text-muted-foreground">
                  {t("qa.questionLabel")}
                </Label>
                <Textarea
                  id="qa-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 400))}
                  placeholder={t("qa.questionPlaceholder")}
                  rows={3}
                  className="mt-1.5 resize-none"
                  aria-invalid={!!error}
                  aria-describedby={error ? "qa-error" : undefined}
                />
                <p className="mt-1 text-right text-[0.6875rem] tabular-nums text-muted-foreground">
                  {question.length}/400
                </p>
              </div>
            </div>

            {error && (
              <p id="qa-error" role="alert" className="mt-1 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full"
              >
                {submitting ? (
                  <>
                    <Clock aria-hidden="true" className="size-4 animate-spin" />
                    {t("qa.send")}…
                  </>
                ) : (
                  t("qa.send")
                )}
              </Button>
            </div>
            <p className="mt-2 text-[0.6875rem] leading-5 text-muted-foreground">
              {t("qa.pendingNote")}
            </p>
          </form>
        )}

        {/* Just-asked confirmation */}
        {justAsked && !formOpen && (
          <p className="qa-in mt-4 flex items-center gap-2 rounded-xl bg-mint/70 px-4 py-2.5 text-sm font-semibold text-mint-foreground">
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            {t("qa.thanks")} — {t("qa.pending")}
          </p>
        )}

        {/* Question list */}
        <div className="mt-6">
          {questions === null ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading questions">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-2xl border p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("qa.empty")}
            </p>
          ) : (
            <ul
              className="max-h-96 space-y-3 overflow-y-auto scrollbar-thin pr-1 pb-16 sm:pb-0"
              aria-label={t("qa.title")}
            >
              {questions.map((q) => (
                <li
                  key={q.id}
                  className={cn(
                    "qa-in rounded-2xl border bg-background/60 p-4 transition-colors hover:border-primary/30",
                    !q.answer && "border-dashed"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        q.answer
                          ? "bg-primary/10 text-primary"
                          : "bg-honey-soft text-accent-foreground"
                      )}
                    >
                      {q.askedBy === "Anonymous"
                        ? "?"
                        : q.askedBy.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-6 text-foreground">
                        {q.question}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                        {t("qa.askedBy")} {q.askedBy}
                        {" · "}
                        <span className={q.answer ? "text-primary" : "font-medium text-accent-foreground"}>
                          {q.answer ? t("qa.answered") : t("qa.pending")}
                        </span>
                      </p>

                      {q.answer && (
                        <div className="mt-3 rounded-xl border-l-2 border-primary/40 bg-secondary/50 px-3.5 py-2.5">
                          <p className="flex items-start gap-2 text-sm leading-6 text-foreground/90">
                            <BadgeCheck
                              aria-hidden="true"
                              className="mt-1 size-4 shrink-0 text-primary"
                            />
                            {q.answer}
                          </p>
                          <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                            {t("qa.answeredBy")} {q.answeredBy || "Medivyx team"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pending.length > 1 && (
          <p className="mt-4 text-center text-[0.6875rem] text-muted-foreground">
            {pending.length} {t("qa.pending")} · {productName}
          </p>
        )}
      </div>
    </section>
  );
}
