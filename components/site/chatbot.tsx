"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowUp,
  MessageCircleHeart,
  Phone,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useChatbot } from "@/components/site/chatbot-context";
import { useLanguage } from "@/components/site/language-provider";
import { translate } from "@/lib/i18n";
import { BrandMark } from "@/components/site/logo";
import { SiteLink } from "@/components/site/link";
import { getBotReply, chatStarter, type ChatCta, type ChatReply } from "@/lib/chatbot";
import { business, whatsappLink } from "@/lib/business";
import { track } from "@/lib/analytics";

interface UiMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  ctas?: ChatCta[];
  suggestions?: string[];
  streaming?: boolean;
}

let idCounter = 1;

function initialMessages(): UiMessage[] {
  return [
    {
      id: idCounter++,
      role: "bot",
      text: chatStarter.greeting,
      suggestions: [...chatStarter.suggestions],
    },
  ];
}

/** Reveal bot text word-by-word for a natural assistant feel. */
function useStreamingText(active: boolean, text: string, speed = 28) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    const words = text.split(" ");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= words.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [active, text, speed]);

  if (!active) return text;
  return text.split(" ").slice(0, progress).join(" ");
}

function BotBubble({ message, onDone }: { message: UiMessage; onDone?: () => void }) {
  const shown = useStreamingText(!!message.streaming, message.text);
  const done = shown === message.text;

  useEffect(() => {
    if (done && message.streaming) onDone?.();
  }, [done, message.streaming, onDone]);

  return (
    <div className="flex gap-2.5">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BrandMark className="size-6" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <div className="rounded-2xl rounded-tl-md bg-card px-4 py-3 text-sm leading-6 text-foreground shadow-sm ring-1 ring-border/70">
          {shown}
          {!done && (
            <span aria-hidden="true" className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-primary/60 align-middle" />
          )}
        </div>
        {done && message.ctas && message.ctas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.ctas.map((cta) => (
              <CtaRender key={cta.label} cta={cta} />
            ))}
          </div>
        )}
        {done && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggestions.map((s) => (
              <SuggestionChip key={s} label={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionChip({ label }: { label: string }) {
  // Handled via a custom event so the sheet doesn't need prop drilling
  return (
    <button
      type="button"
      data-suggestion={label}
      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {label}
    </button>
  );
}

export function Chatbot() {
  const { open, setOpen } = useChatbot();
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the greeting in the visitor's language while the conversation is
  // still pristine (no messages yet). Once the visitor has chatted, history
  // is left untouched.
  useEffect(() => {
    const localizeGreeting = () => {
      setMessages((m) => {
        const localized = translate(lang, "chat.greeting");
        if (
          m.length === 1 &&
          m[0].role === "bot" &&
          m[0].text !== localized
        ) {
          return [{ ...m[0], text: localized }];
        }
        return m;
      });
    };
    localizeGreeting();
  }, [lang]);

  useEffect(() => {
    if (open) {
      track("chat_message", { action: "open" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return;
      setInput("");
      track("chat_message", { action: "send", intent: text.slice(0, 60) });

      setMessages((m) => [
        ...m,
        { id: idCounter++, role: "user", text },
      ]);
      setThinking(true);

      // Try the server engine first; fall back to the local engine.
      let reply: ChatReply;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            // Structured history (incl. each bot turn's suggestion chips) —
            // the server engine uses it to resolve "yes"-style follow-ups.
            history: messages.slice(-8).map((m) => ({
              role: m.role,
              content: m.text,
              suggestions: m.role === "bot" ? m.suggestions : undefined,
            })),
          }),
        });
        if (!res.ok) throw new Error("chat api error");
        reply = (await res.json()) as ChatReply;
      } catch {
        reply = getBotReply(text);
      }

      setTimeout(() => {
        setThinking(false);
        setMessages((m) => [
          ...m,
          {
            id: idCounter++,
            role: "bot",
            text: reply.text,
            ctas: reply.ctas,
            suggestions: reply.suggestions,
            streaming: true,
          },
        ]);
      }, 450 + Math.random() * 500);
    },
    [thinking, messages]
  );

  const handleSuggestionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const label = target.getAttribute("data-suggestion");
    if (label) void send(label);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const markStreamed = (id: number) => {
    setMessages((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, streaming: false } : msg))
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="inset-y-auto bottom-4 top-auto flex h-[min(72vh,620px)] w-[calc(100vw-2rem)] max-w-md flex-col gap-0 rounded-2xl border p-0 shadow-2xl sm:bottom-6 sm:right-6"
      >
        <SheetHeader className="border-b bg-primary/5 p-4">
          <SheetTitle asChild>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircleHeart aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="font-display text-base font-semibold text-foreground">
                  Ask Medivyx
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Online · answers instantly
                </p>
              </div>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Ask about Medivyx services, products, prescriptions, opening hours
            and contact details. This assistant cannot give medical advice.
          </SheetDescription>
        </SheetHeader>

        {/* Messages */}
        <div
          ref={listRef}
          onClick={handleSuggestionClick}
          className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-muted/40 p-4"
          aria-live="polite"
          aria-label="Chat conversation"
        >
          <p className="mx-auto max-w-[90%] rounded-full bg-card px-3 py-1.5 text-center text-[0.6875rem] leading-4 text-muted-foreground ring-1 ring-border/60">
            <Sparkles aria-hidden="true" className="mr-1 inline size-3 -translate-y-px" />
            Instant answers from the Medivyx knowledge base
          </p>
          {messages.map((m) =>
            m.role === "bot" ? (
              <BotBubble
                key={m.id}
                message={m}
                onDone={() => markStreamed(m.id)}
              />
            ) : (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm">
                  {m.text}
                </p>
              </div>
            )
          )}
          {thinking && (
            <div className="flex gap-2.5">
              <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BrandMark className="size-6" />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-card px-4 py-3.5 shadow-sm ring-1 ring-border/70">
                <span className="typing-dot size-1.5 rounded-full bg-primary/70" />
                <span className="typing-dot size-1.5 rounded-full bg-primary/70" />
                <span className="typing-dot size-1.5 rounded-full bg-primary/70" />
                <span className="sr-only">Medivyx assistant is typing</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t bg-background p-3"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask Medivyx a question
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, hours, prescriptions…"
            autoComplete="off"
            maxLength={400}
            className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
          >
            <ArrowUp aria-hidden="true" className="size-5" />
          </button>
        </form>
        <p className="bg-background px-4 pb-3 text-center text-[0.625rem] leading-3.5 text-muted-foreground">
          For medical questions, the Medivyx pharmacist will help — this
          assistant shares general information only.
        </p>
      </SheetContent>
    </Sheet>
  );
}

function CtaRender({ cta }: { cta: ChatCta }) {
  if (cta.kind === "whatsapp") {
    return (
      <a
        href={whatsappLink(cta.message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { source: "chatbot" })}
        className="wa-cta inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm hover:scale-[1.03]"
      >
        <Phone aria-hidden="true" className="size-3.5" />
        {cta.label}
      </a>
    );
  }
  if (cta.kind === "call") {
    return (
      <a
        href={business.phoneHref}
        onClick={() => track("call_click", { source: "chatbot" })}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
      >
        <Phone aria-hidden="true" className="size-3.5" />
        {cta.label}
      </a>
    );
  }
  return (
    <SiteLink
      href={cta.href ?? "/"}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-card px-3.5 py-2 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5"
    >
      <ExternalLink aria-hidden="true" className="size-3.5" />
      {cta.label}
    </SiteLink>
  );
}
