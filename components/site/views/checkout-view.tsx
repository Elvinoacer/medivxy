"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  Gift,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  PackageSearch,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TicketPercent,
  Trash2,
  Truck,
  Wallet,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { useCart, formatKes } from "@/components/site/cart-provider";
import { useLanguage } from "@/components/site/language-provider";
import { business, site, whatsappLink, whatsappMessages, deliveryZones, findDeliveryZone, FREE_DELIVERY_OVER } from "@/lib/business";
import { evaluatePromo } from "@/lib/promos";
import { rememberOrder, listDeviceOrders } from "@/components/site/order-history";
import {
  REDEEM_BLOCK,
  REDEEM_RATE_KES,
  pointsEarnedFor,
  type LoyaltyQuote,
} from "@/lib/loyalty-shared";
import { isValidKenyanPhone, PHONE_HINT } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────── */

type Fulfilment = "pickup" | "delivery";
type PaymentMethod = "mpesa" | "card" | "on-collection";

interface OrderResult {
  reference: string;
  itemCount: number;
  total: number;
  deliveryFee: number;
  discount: number;
  promoCode: string;
  promoLabel: string;
  loyaltyDiscount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  pointsBalance: number | null;
  loyaltyTier: string | null;
  status: string;
  paymentStatus: string;
  hasPrescriptionItems: boolean;
}

/** Contact + delivery details saved on THIS device for faster repeat orders.
 *  (Deliberately never includes payment data.) */
interface SavedProfile {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  savedAt: string;
}

const PROFILE_KEY = "medivyx:profile";

/* ── Main view ─────────────────────────────────────────────────── */

export function CheckoutView() {
  const { t } = useLanguage();
  const {
    lines,
    loaded,
    subtotal,
    count,
    hasPrescriptionItems,
    setQuantity,
    removeLine,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(0); // 0 basket · 1 details · 2 rx · 3 payment · 4 done
  const steps = useMemo(() => {
    const base = [
      { id: 0, label: t("checkout.step.cart") },
      { id: 1, label: t("checkout.step.details") },
      ...(hasPrescriptionItems ? [{ id: 2, label: t("checkout.step.rx") }] : []),
      { id: 3, label: t("checkout.step.pay") },
      { id: 4, label: t("checkout.step.done") },
    ];
    return base;
  }, [hasPrescriptionItems, t]);

  // Details form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Saved-profile state: prefill from this device + remember-me toggle.
  // (Never stores payment data — only contact + delivery details.)
  const [remember, setRemember] = useState(true);
  const [prefilled, setPrefilled] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Prescription state — rxChoice "reuse" applies the prescription metadata
  // remembered from a past Rx order on this device (the pharmacist re-verifies
  // the original with the customer before dispensing — same demo policy).
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [rxChoice, setRxChoice] = useState<"upload" | "later" | "reuse">("upload");
  const [savedRx, setSavedRx] = useState<{ ref: string; fileName: string } | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);

  // Promo state — validated client-side for display, re-checked by the server.
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<
    { code: string; label: string; discount: number; freeDelivery: boolean } | null
  >(null);
  const [promoError, setPromoError] = useState("");

  // MediPoints state — the SERVER holds the balance (phone-keyed); this is
  // just a display quote + the redemption the customer asks for. The orders
  // API re-validates blocks/balance/cap before granting any discount.
  const [loyaltyQuote, setLoyaltyQuote] = useState<LoyaltyQuote | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyError, setLoyaltyError] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);

  // ── Delivery pricing (zone table in lib/business — server re-checks it) ─
  const selectedZone = fulfilment === "delivery" ? findDeliveryZone(area) : null;
  const freeDelivery = fulfilment === "delivery" && subtotal >= FREE_DELIVERY_OVER;
  const deliveryFee = selectedZone ? (freeDelivery ? 0 : selectedZone.fee) : 0;
  // Live re-evaluation: if the basket changes after applying a promo (items
  // added/removed), the discount follows automatically — the server recomputes
  // the authoritative values at submit anyway.
  const livePromo = promoApplied
    ? evaluatePromo(promoApplied.code, subtotal, deliveryFee)
    : null;
  const promoValid = !!livePromo && !livePromo.error;
  const promoWaivesDelivery = promoValid && (livePromo?.freeDelivery ?? false);
  const effectiveDeliveryFee = promoWaivesDelivery ? 0 : deliveryFee;
  const discount = promoValid ? (livePromo?.discount ?? 0) : 0;

  // ── MediPoints (display math only — the server re-checks everything) ──
  // A redemption can never eat into the delivery fee or go below zero.
  const loyaltyCapKes = Math.max(0, subtotal - discount);
  const maxRedeemablePoints =
    Math.floor(Math.min(loyaltyQuote?.points ?? 0, loyaltyCapKes / REDEEM_RATE_KES) / REDEEM_BLOCK) *
    REDEEM_BLOCK;
  const loyaltyKes = Math.min(
    pointsToRedeem * REDEEM_RATE_KES,
    loyaltyCapKes
  );

  const total = Math.max(0, subtotal + effectiveDeliveryFee - discount - loyaltyKes);

  // Points this order will earn (tier multiplier + first-order bonus applied).
  const previewEarn = loyaltyQuote
    ? (loyaltyQuote.previewEarn ??
       pointsEarnedFor(loyaltyQuote.orders, total, loyaltyQuote.multiplier))
    : pointsEarnedFor(0, total, 1);

  // ── Promo handling ────────────────────────────────────────────
  function applyPromo() {
    const input = promoInput.trim();
    setPromoError("");
    if (!input) {
      setPromoApplied(null);
      return;
    }
    const result = evaluatePromo(input, subtotal, effectiveDeliveryFee);
    if (!result) {
      setPromoApplied(null);
      setPromoError("We don't recognise that code — check the spelling.");
      return;
    }
    if (result.error) {
      setPromoApplied(null);
      setPromoError(result.error);
      return;
    }
    setPromoApplied({
      code: result.code,
      label: result.label,
      discount: result.discount,
      freeDelivery: result.freeDelivery,
    });
    track("promo_applied", { code: result.code, discount: result.discount });
    toast.success(`Promo ${result.code} applied`, {
      description: result.label,
    });
  }

  function clearPromo() {
    setPromoInput("");
    setPromoApplied(null);
    setPromoError("");
  }

  // Focus management: move focus to the step heading on step change.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // ── MediPoints quote: when the customer types a valid phone (their M-Pesa
  // identity), fetch the SERVER-side balance for the widget. Debounced so
  // typing doesn't spam the API; failures fail silently (widget hides).
  // (All setState lives inside the debounce callback — never sync-in-effect.)
  useEffect(() => {
    const trimmed = phone.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!trimmed || !isValidKenyanPhone(trimmed)) {
        setLoyaltyQuote(null);
        setPointsToRedeem(0);
        return;
      }
      try {
        const res = await fetch(
          `/api/loyalty?phone=${encodeURIComponent(trimmed)}&total=${Math.round(subtotal)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.ok) return;
        const quote: LoyaltyQuote | null = data.account ?? null;
        setLoyaltyQuote(quote);
        setLoyaltyError("");
        // Phone switched (or balance changed) — drop any stale selection.
        setPointsToRedeem((prev) =>
          quote && prev > 0 && quote.points >= prev ? prev : 0
        );
      } catch {
        // aborted/offline — the widget simply stays hidden
      }
    }, 450);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // total intentionally excluded: re-quoting on every basket change would
    // refetch for the preview; the preview is computed locally instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, hasPrescriptionItems]);

  useEffect(() => {
    track("page_view", { page: "checkout" });
  }, []);

  // Prefill from the saved profile (this device only) — one-tap repeat orders.
  // (Indirect setState — open-status pattern — runs once after mount.)
  useEffect(() => {
    const init = () => {
      try {
        const raw = window.localStorage.getItem(PROFILE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as Partial<SavedProfile>;
          if (typeof p?.fullName === "string" && p.fullName.trim()) {
            setFullName(p.fullName);
            if (typeof p.phone === "string") setPhone(p.phone);
            if (typeof p.email === "string") setEmail(p.email);
            if (typeof p.address === "string") setAddress(p.address);
            if (typeof p.area === "string") setArea(p.area);
            if (p.address) setFulfilment("delivery");
            setPrefilled(true);
          }
        }
      } catch {
        // corrupted profile — start fresh
      }
      // Rx shortcut: the most recent order on this device that carried a
      // prescription (metadata only — the team re-verifies the original).
      const rx = listDeviceOrders().find((o) => o.prescriptionFileName);
      if (rx) {
        setSavedRx({ ref: rx.reference, fileName: rx.prescriptionFileName! });
        setRxChoice("reuse");
      }
    };
    init();
  }, []);

  // ── Validation ─────────────────────────────────────────────────
  function validateDetails(): boolean {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2 || fullName.trim().length > 80)
      e.fullName = "Please enter your full name.";
    if (!isValidKenyanPhone(phone)) e.phone = `Please enter a valid Kenyan phone — ${PHONE_HINT}.`;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address (or leave it empty).";
    if (fulfilment === "delivery") {
      if (address.trim().length < 5) e.address = "Please enter your delivery address (street / building / estate).";
      if (!area) e.area = "Please choose your delivery area.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast("Please check your details", {
        description: Object.values(e)[0],
      });
      return false;
    }
    return true;
  }

  function validateRx(): boolean {
    if (hasPrescriptionItems && rxChoice === "upload") {
      if (!prescriptionFile) {
        setErrors({ prescription: "Attach a photo or PDF of your prescription, or choose “send later”." });
        return false;
      }
      if (prescriptionFile.size > 5 * 1024 * 1024) {
        setErrors({ prescription: "File must be smaller than 5MB." });
        return false;
      }
    }
    setErrors({});
    return true;
  }
  // ── Submit ─────────────────────────────────────────────────────
  async function placeOrder() {
    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      const payload = {
        items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        fulfilment,
        address: fulfilment === "delivery" ? address.trim() : "",
        area: fulfilment === "delivery" ? area : "",
        notes: notes.trim(),
        prescriptionFileName:
          hasPrescriptionItems && rxChoice === "reuse" && savedRx
            ? savedRx.fileName.slice(0, 200)
            : hasPrescriptionItems && prescriptionFile
              ? `${prescriptionFile.name}`
              : "",
        promoCode: promoValid ? (promoApplied?.code ?? "") : "",
        pointsToRedeem: loyaltyKes > 0 ? pointsToRedeem : 0,
        paymentMethod,
      };
      fd.set("payload", JSON.stringify(payload));
      if (hasPrescriptionItems && prescriptionFile && rxChoice === "upload") {
        fd.set("prescription", prescriptionFile);
      }

      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.fields) {
          setErrors(data.fields);
          // Jump back to the step owning the first error.
          const key = Object.keys(data.fields)[0];
          if (["fullName", "phone", "email", "address", "area"].includes(key)) setStep(1);
          else if (key === "prescription") setStep(2);
          else if (key === "promo") {
            setPromoError(data.fields.promo);
            setPromoApplied(null);
          } else if (key === "points") {
            setLoyaltyError(data.fields.points);
            setPointsToRedeem(0);
          }
        }
        toast("We couldn't place your order", {
          description: data.error ?? "Please try again or message us on WhatsApp.",
        });
        setSubmitting(false);
        return;
      }
      setOrder(data as OrderResult);
      clearCart();
      setStep(4);
      track("order_placed", { value: data.total, items: count, rx: data.hasPrescriptionItems });
      if (data.pointsRedeemed > 0) {
        track("loyalty_redeem", { points: data.pointsRedeemed, kes: data.loyaltyDiscount });
      }
      // Device order history — one-tap lookup on the tracking page + the
      // Rx-reuse shortcut on this device.
      try {
        rememberOrder({
          reference: data.reference,
          total: data.total,
          itemCount: count,
          fulfilment,
          promoCode: data.promoCode ?? "",
          pointsEarned: data.pointsEarned ?? 0,
          prescriptionFileName:
            data.hasPrescriptionItems && (rxChoice === "reuse" ? savedRx?.fileName : prescriptionFile?.name) || "",
          placedAt: new Date().toISOString(),
        });
      } catch {
        // storage blocked — history simply isn't remembered
      }
      // Saved profile (this device, no payment data) — speeds up the next order.
      try {
        if (remember) {
          window.localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify({
              fullName: fullName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: fulfilment === "delivery" ? address.trim() : "",
              area: fulfilment === "delivery" ? area : "",
              savedAt: new Date().toISOString(),
            } satisfies SavedProfile)
          );
          setProfileSaved(true);
        } else {
          window.localStorage.removeItem(PROFILE_KEY);
        }
      } catch {
        // storage blocked — checkout still works, just no prefill next time
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast("Network problem", {
        description: "We couldn't reach the pharmacy. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function onPayTrigger() {
    if (paymentMethod === "mpesa" && !hasPrescriptionItems) {
      setMpesaOpen(true); // simulated STK push, then placeOrder()
      return;
    }
    if (paymentMethod === "card" && !hasPrescriptionItems) {
      placeOrder(); // demo card — no real charge
      return;
    }
    placeOrder();
  }

  // ── Render ─────────────────────────────────────────────────────
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <main id="main-content" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: "Checkout" },
          ]}
        />

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground outline-none sm:text-4xl"
        >
          {t("checkout.title")}
        </h1>
        <p className="sr-only" aria-live="polite">
          {steps[stepIndex + 1] ? `Step: ${steps[stepIndex + 1].label}` : "Order complete"}
        </p>

        {loaded && lines.length === 0 && step !== 4 ? (
          <EmptyBasket />
        ) : step === 4 && order ? (
          <OrderConfirmation order={order} fulfilment={fulfilment} profileSaved={profileSaved} />
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
            <div className="min-w-0">
              <StepIndicator steps={steps} current={step} />
              <div className="mt-8">
                {step === 0 && (
                  <BasketStep
                    lines={lines}
                    setQuantity={setQuantity}
                    removeLine={removeLine}
                    onContinue={() => setStep(1)}
                  />
                )}
                {step === 1 && (
                  <DetailsStep
                    {...{
                      fullName, setFullName,
                      phone, setPhone,
                      email, setEmail,
                      fulfilment, setFulfilment,
                      address, setAddress,
                      area, setArea,
                      notes, setNotes,
                      errors,
                      remember, setRemember,
                      prefilled,
                      onClearProfile: () => {
                        setFullName("");
                        setPhone("");
                        setEmail("");
                        setAddress("");
                        setArea("");
                        setPrefilled(false);
                        try {
                          window.localStorage.removeItem(PROFILE_KEY);
                        } catch {}
                        toast("Details cleared", {
                          description: "Nothing from this device is kept.",
                        });
                      },
                    }}
                    onBack={() => setStep(0)}
                    onContinue={() => {
                      if (validateDetails()) setStep(hasPrescriptionItems ? 2 : 3);
                    }}
                  />
                )}
                {step === 2 && hasPrescriptionItems && (
                  <PrescriptionStep
                    file={prescriptionFile}
                    setFile={setPrescriptionFile}
                    choice={rxChoice}
                    setChoice={setRxChoice}
                    savedRx={savedRx}
                    error={errors.prescription}
                    onBack={() => setStep(1)}
                    onContinue={() => {
                      if (validateRx()) setStep(3);
                    }}
                  />
                )}
                {step === 3 && (
                  <PaymentStep
                    phone={phone}
                    total={total}
                    hasRx={hasPrescriptionItems}
                    method={paymentMethod}
                    setMethod={setPaymentMethod}
                    submitting={submitting}
                    onBack={() => setStep(hasPrescriptionItems ? 2 : 1)}
                    onPay={onPayTrigger}
                  />
                )}
              </div>
            </div>

            {/* Sticky order summary */}
            <aside aria-label="Order summary" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <SummaryCard
                lines={lines}
                subtotal={subtotal}
                total={total}
                effectiveDeliveryFee={effectiveDeliveryFee}
                fulfilment={fulfilment}
                zone={selectedZone}
                freeDelivery={freeDelivery}
                promoApplied={promoValid ? promoApplied : null}
                promoLabel={livePromo?.error ?? ""}
                promoInput={promoInput}
                promoError={promoError}
                onPromoInput={setPromoInput}
                onApplyPromo={applyPromo}
                onClearPromo={clearPromo}
                loyaltyQuote={loyaltyQuote}
                pointsToRedeem={pointsToRedeem}
                maxRedeemablePoints={maxRedeemablePoints}
                loyaltyKes={loyaltyKes}
                previewEarn={previewEarn}
                loyaltyError={loyaltyError}
                onSetPoints={(v: number) => {
                  setLoyaltyError("");
                  setPointsToRedeem(v);
                  if (v > 0) track("loyalty_redeem", { points: v, stage: "select" });
                }}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Simulated M-Pesa STK push — remounted per open so phase resets cleanly */}
      <MpesaSimDialog
        key={mpesaOpen ? "open" : "closed"}
        open={mpesaOpen}
        phone={phone}
        amount={total}
        onClose={() => setMpesaOpen(false)}
        onSuccess={() => {
          setMpesaOpen(false);
          placeOrder();
        }}
      />
    </main>
  );
}

/* ── Step indicator ─────────────────────────────────────────────── */

function StepIndicator({
  steps,
  current,
}: {
  steps: { id: number; label: string }[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <li key={s.id} className="flex shrink-0 items-center gap-1">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active && "border-primary bg-primary text-primary-foreground shadow-sm",
                done && "border-primary/30 bg-primary/10 text-primary",
                !active && !done && "border-border bg-card text-muted-foreground"
              )}
            >
              {done ? (
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
              ) : (
                <span aria-hidden="true" className={cn("flex size-4 items-center justify-center rounded-full text-[0.625rem]", active && "bg-primary-foreground/20")}>
                  {i + 1}
                </span>
              )}
              <span className="whitespace-nowrap">{s.label}</span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="h-px w-4 bg-border sm:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Step 0: basket ─────────────────────────────────────────────── */

function BasketStep({
  lines,
  setQuantity,
  removeLine,
  onContinue,
}: {
  lines: ReturnType<typeof useCart>["lines"];
  setQuantity: (slug: string, qty: number) => void;
  removeLine: (slug: string) => void;
  onContinue: () => void;
}) {
  return (
    <section aria-labelledby="basket-step">
      <h2 id="basket-step" className="font-display text-xl font-semibold text-foreground">
        Review your basket
      </h2>
      <ul className="mt-4 divide-y rounded-2xl border bg-card">
        {lines.map((line) => (
          <li key={line.slug} className="flex gap-4 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-secondary/60 sm:size-24">
              <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <SiteLink
                    href={`/products/${line.slug}`}
                    className="text-sm font-semibold text-foreground underline-offset-4 hover:underline sm:text-base"
                  >
                    {line.name}
                  </SiteLink>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {line.packSize} · {formatKes(line.price)} each
                    {line.prescriptionRequired && " · Rx item"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.slug)}
                  aria-label={`Remove ${line.name}`}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="inline-flex items-center rounded-full border">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.quantity - 1)}
                    aria-label={`Decrease ${line.name}`}
                    className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.slug, line.quantity + 1)}
                    aria-label={`Increase ${line.name}`}
                    className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <p className="font-display text-base font-semibold text-foreground">
                  {formatKes(line.price * line.quantity)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="ghost" size="lg" className="rounded-full">
          <SiteLink href="/products" trackLabel="checkout-keep-shopping">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Keep shopping
          </SiteLink>
        </Button>
        <Button size="lg" className="rounded-full px-8 text-base shadow-md shadow-primary/20" onClick={onContinue}>
          Continue to details
          <ArrowRight aria-hidden="true" className="size-4.5" />
        </Button>
      </div>
    </section>
  );
}

/* ── Step 1: details ────────────────────────────────────────────── */

function DetailsStep({
  fullName, setFullName,
  phone, setPhone,
  email, setEmail,
  fulfilment, setFulfilment,
  address, setAddress,
  area, setArea,
  notes, setNotes,
  errors,
  remember, setRemember,
  prefilled,
  onClearProfile,
  onBack,
  onContinue,
}: {
  fullName: string; setFullName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  fulfilment: Fulfilment; setFulfilment: (v: Fulfilment) => void;
  address: string; setAddress: (v: string) => void;
  area: string; setArea: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  errors: Record<string, string>;
  remember: boolean; setRemember: (v: boolean) => void;
  prefilled: boolean;
  onClearProfile: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section aria-labelledby="details-step">
      <h2 id="details-step" className="font-display text-xl font-semibold text-foreground">
        Your details
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We use these to confirm your order and reach you if anything needs checking.
      </p>

      {/* Welcome-back strip — prefilled from this device's saved profile */}
      {prefilled && (
        <div className="profile-in mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-sm text-foreground">
            Welcome back, <strong className="font-semibold">{fullName}</strong> — your details are filled in.
          </p>
          <button
            type="button"
            onClick={onClearProfile}
            className="rounded-full border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            Not you? Clear
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="co-name">Full name *</Label>
          <Input
            id="co-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Amina Wanjiru"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "co-name-err" : undefined}
          />
          {errors.fullName && <p id="co-name-err" className="text-xs font-medium text-destructive">{errors.fullName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="co-phone">Phone (M-Pesa number) *</Label>
          <Input
            id="co-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "co-phone-err" : undefined}
          />
          {errors.phone ? (
            <p id="co-phone-err" className="text-xs font-medium text-destructive">{errors.phone}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{PHONE_HINT}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="co-email">Email (optional)</Label>
          <Input
            id="co-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "co-email-err" : undefined}
          />
          {errors.email && <p id="co-email-err" className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>
      </div>

      {/* Fulfilment selector */}
      <fieldset className="mt-8">
        <legend className="text-sm font-semibold text-foreground">How would you like to get your order?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FulfilmentCard
            value="pickup"
            selected={fulfilment === "pickup"}
            onSelect={() => setFulfilment("pickup")}
            icon={Store}
            title="Pickup from the pharmacy"
            sub={`Roysambu, Nairobi · typically ready in 1–2 hours · ${business.hours[0].open}–${business.hours[0].close}`}
          />
          <FulfilmentCard
            value="delivery"
            selected={fulfilment === "delivery"}
            onSelect={() => setFulfilment("delivery")}
            icon={Truck}
            title="Delivery to you"
            sub={`Same-day nearby · from KES 150 · free over ${formatKes(FREE_DELIVERY_OVER)}`}
          />
        </div>
      </fieldset>

      {fulfilment === "delivery" && (
        <div className="mt-5 grid gap-5 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="co-address">Delivery address *</Label>
            <Input
              id="co-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street / estate / building, e.g. Sunrise Apt 4B, Roysambu"
              autoComplete="street-address"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "co-address-err" : undefined}
            />
            {errors.address && <p id="co-address-err" className="text-xs font-medium text-destructive">{errors.address}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-area">Delivery area *</Label>
            <select
              id="co-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-invalid={!!errors.area}
            >
              <option value="">Choose your area…</option>
              {deliveryZones.map((z) => (
                <option key={z.name} value={z.name}>
                  {z.name} — {z.fee > 0 ? `KES ${z.fee}` : "fee by phone"}
                </option>
              ))}
            </select>
            {errors.area ? (
              <p className="text-xs font-medium text-destructive">{errors.area}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Fees are indicative for the demo — the team confirms before dispatch.
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="co-notes">Delivery notes (optional)</Label>
            <Textarea
              id="co-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Landmarks, gate colour, best time to call…"
              rows={3}
              maxLength={1000}
            />
          </div>
          {/* Zone fee table — transparent pricing at the point of choice */}
          <details className="group rounded-xl border bg-background/60 p-0 sm:col-span-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-3.5 text-primary" />
                Delivery zones &amp; fees around {business.area}
              </span>
              <ChevronDown aria-hidden="true" className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-3">
              <table className="w-full text-xs">
                <caption className="sr-only">Delivery fee per area</caption>
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th scope="col" className="py-1.5 font-medium">Area</th>
                    <th scope="col" className="py-1.5 font-medium">Typical arrival</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveryZones.map((z) => (
                    <tr key={z.name} className={cn("transition-colors", area === z.name && "bg-primary/5 font-medium")}>
                      <td className="py-1.5 pr-2 text-foreground">{z.name}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{z.eta}</td>
                      <td className="py-1.5 text-right tabular-nums text-foreground">
                        {z.fee > 0 ? `KES ${z.fee}` : "Confirmed"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                Free delivery on baskets of {formatKes(FREE_DELIVERY_OVER)} or more.
              </p>
            </div>
          </details>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" size="lg" className="rounded-full" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Basket
        </Button>
        <Button size="lg" className="rounded-full px-8 text-base shadow-md shadow-primary/20" onClick={onContinue}>
          Continue
          <ArrowRight aria-hidden="true" className="size-4.5" />
        </Button>
      </div>

      {/* Remember-me — speeds up the NEXT order (contact details only) */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/30">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
            remember
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-transparent"
          )}
        >
          <Check aria-hidden="true" className="size-3.5" />
        </span>
        <span className="text-sm">
          <span className="font-medium text-foreground">Remember my details on this device</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Name, phone and delivery address only — never payment information.
            Your next order is then a couple of taps.
          </span>
        </span>
      </label>
    </section>
  );
}

function FulfilmentCard({
  value,
  selected,
  onSelect,
  icon: Icon,
  title,
  sub,
}: {
  value: "pickup" | "delivery";
  selected: boolean;
  onSelect: () => void;
  icon: typeof Store;
  title: string;
  sub: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "bg-card hover:border-primary/30"
      )}
    >
      <input
        type="radio"
        name="fulfilment"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          {selected && <BadgeCheck aria-hidden="true" className="size-4 text-primary" />}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{sub}</span>
      </span>
    </label>
  );
}

/* ── Step 2: prescription ───────────────────────────────────────── */

function PrescriptionStep({
  file,
  setFile,
  choice,
  setChoice,
  savedRx,
  error,
  onBack,
  onContinue,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  choice: "upload" | "later" | "reuse";
  setChoice: (c: "upload" | "later" | "reuse") => void;
  /** Prescription metadata remembered from a past Rx order on this device. */
  savedRx: { ref: string; fileName: string } | null;
  error?: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <section aria-labelledby="rx-step">
      <h2 id="rx-step" className="font-display text-xl font-semibold text-foreground">
        Prescription review
      </h2>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-honey-soft/50 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
        <p className="text-sm leading-6 text-accent-foreground">
          Your basket includes <strong>prescription-only medicine</strong>. A pharmacist
          reviews your prescription first — then the team confirms your order and
          payment before anything is dispensed.
        </p>
      </div>

      {/* Rx-reuse shortcut — the fastest path for repeat customers. */}
      {savedRx && (
        <button
          type="button"
          onClick={() => setChoice("reuse")}
          aria-pressed={choice === "reuse"}
          className={cn(
            "rx-reuse-in mt-5 flex w-full flex-wrap items-center gap-3 rounded-2xl border p-4 text-left transition-all",
            choice === "reuse"
              ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/30 dark:ring-emerald-500/30"
              : "border-border bg-card hover:border-emerald-600/40 dark:hover:border-emerald-500/40"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              choice === "reuse"
                ? "bg-emerald-700 text-white"
                : "bg-mint text-mint-foreground"
            )}
          >
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              Use the prescription from {savedRx.ref}
              {choice === "reuse" && (
                <BadgeCheck aria-hidden="true" className="size-4 text-emerald-700 dark:text-emerald-400" />
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {savedRx.fileName} — the pharmacist re-verifies it with you before dispensing
            </span>
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider",
              choice === "reuse"
                ? "bg-emerald-700 text-white"
                : "bg-mint text-mint-foreground"
            )}
          >
            Fastest
          </span>
        </button>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RxChoiceCard
          selected={choice === "upload"}
          onSelect={() => setChoice("upload")}
          icon={Package}
          title="Attach it now"
          sub="Photo or PDF of your prescription"
        />
        <RxChoiceCard
          selected={choice === "later"}
          onSelect={() => setChoice("later")}
          icon={MessageCircle}
          title="Send it later"
          sub="WhatsApp it to the team once you place the order"
        />
      </div>

      {choice === "upload" && (
        <div className="mt-5">
          <Label htmlFor="co-rx">Prescription file (PDF, JPG, PNG or WebP · max 5MB)</Label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
            <input
              ref={inputRef}
              id="co-rx"
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && f.size > 5 * 1024 * 1024) {
                  toast("File too large", { description: "Prescription files must be smaller than 5MB." });
                }
              }}
              className="w-full text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {file && (
            <p className="mt-2 flex items-center gap-2 text-xs font-medium text-primary">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {file.name} ({(file.size / 1024).toFixed(0)}KB) — ready to attach
            </p>
          )}
          {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Demo note: the file is validated but not stored — only its name reaches the
            team, who&rsquo;ll ask you to show the original at collection.
          </p>
        </div>
      )}

      {choice === "reuse" && savedRx && (
        <p className="rx-reuse-in mt-4 flex items-start gap-2 rounded-2xl bg-mint/60 px-4 py-3 text-sm leading-6 text-mint-foreground">
          <BadgeCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          We&rsquo;ll ask the pharmacist to re-verify <strong className="mx-1">{savedRx.fileName}</strong>
          from {savedRx.ref} against today&rsquo;s basket — no re-upload needed. They&rsquo;ll
          WhatsApp you if anything needs clarifying.
        </p>
      )}

      {(choice === "reuse" || choice === "later") && error && (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" size="lg" className="rounded-full" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Details
        </Button>
        <Button size="lg" className="rounded-full px-8 text-base shadow-md shadow-primary/20" onClick={onContinue}>
          Continue to payment
          <ArrowRight aria-hidden="true" className="size-4.5" />
        </Button>
      </div>
    </section>
  );
}

function RxChoiceCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof Package;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-left transition-all",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "bg-card hover:border-primary/30"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span>
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          {selected && <BadgeCheck aria-hidden="true" className="size-4 text-primary" />}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

/* ── Step 3: payment ────────────────────────────────────────────── */

function PaymentStep({
  phone,
  total,
  hasRx,
  method,
  setMethod,
  submitting,
  onBack,
  onPay,
}: {
  phone: string;
  total: number;
  hasRx: boolean;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  submitting: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <section aria-labelledby="pay-step">
      <h2 id="pay-step" className="font-display text-xl font-semibold text-foreground">
        Payment
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Lock aria-hidden="true" className="size-3.5" />
        Secure demo checkout — no real money moves, no card data is stored.
      </p>

      {hasRx && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-honey-soft/50 p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-foreground" />
          <p className="text-sm leading-6 text-accent-foreground">
            Because this order contains prescription items, payment happens{" "}
            <strong>after the pharmacist reviews and confirms</strong> your order —
            the team will send an M-Pesa request or take payment on collection.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-3">
        <PaymentCard
          selected={method === "mpesa"}
          onSelect={() => !hasRx && setMethod("mpesa")}
          disabled={hasRx}
          icon={Smartphone}
          title="M-Pesa"
          sub={hasRx ? "Unavailable for prescription orders" : `Pay instantly from ${phone || "your Safaricom line"}`}
          badge="Most popular"
          image="/images/payment-mobile.webp"
        />
        <PaymentCard
          selected={method === "card"}
          onSelect={() => !hasRx && setMethod("card")}
          disabled={hasRx}
          icon={CreditCard}
          title="Card (Visa / Mastercard)"
          sub={hasRx ? "Unavailable for prescription orders" : "Any card — demo mode accepts test values"}
        />
        <PaymentCard
          selected={method === "on-collection" || hasRx}
          onSelect={() => setMethod("on-collection")}
          disabled={false}
          icon={Wallet}
          title={hasRx ? "Pay after confirmation" : "Pay on collection / delivery"}
          sub="The team confirms your total first — then you pay"
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" size="lg" className="rounded-full" onClick={onBack} disabled={submitting}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8 text-base shadow-md shadow-primary/20"
          onClick={onPay}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
              Placing your order…
            </>
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-4.5" />
              Place order · {formatKes(total)}
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground sm:text-right">
        By placing this order you agree the team calls/WhatsApp to confirm availability.
      </p>
    </section>
  );
}

function PaymentCard({
  selected,
  onSelect,
  disabled,
  icon: Icon,
  title,
  sub,
  badge,
  image,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  icon: typeof Smartphone;
  title: string;
  sub: string;
  badge?: string;
  image?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-2xl border p-4 transition-all",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "bg-card hover:border-primary/30",
        disabled && "cursor-not-allowed opacity-50 hover:border-border"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className="flex flex-1 items-center gap-4 text-left disabled:cursor-not-allowed"
      >
        {image ? (
          <span className="relative hidden size-14 shrink-0 overflow-hidden rounded-xl border sm:block">
            <Image src={image} alt="" fill sizes="56px" className="object-cover" />
          </span>
        ) : null}
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {title}
            {badge && !disabled && (
              <span className="rounded-full bg-honey-soft px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-accent-foreground">
                {badge}
              </span>
            )}
            {selected && <BadgeCheck aria-hidden="true" className="size-4 text-primary" />}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
        </span>
      </button>
    </div>
  );
}

/* ── Step 4: confirmation ───────────────────────────────────────── */

function OrderConfirmation({
  order,
  fulfilment,
  profileSaved,
}: {
  order: OrderResult;
  fulfilment: Fulfilment;
  profileSaved: boolean;
}) {
  const summary = `${formatKes(order.total)}${order.hasPrescriptionItems ? ", includes Rx items" : ""}${order.pointsEarned > 0 ? `, earns ${order.pointsEarned} MediPoints` : ""}`;
  const printedOn = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Reveal className="mx-auto mt-10 max-w-2xl">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-lg">
        <div className="brand-gradient flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-background shadow-md">
            <CheckCircle2 aria-hidden="true" className="size-9 text-primary" />
          </span>
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Order received — asante!
          </h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {order.hasPrescriptionItems
              ? "The pharmacist is reviewing your prescription. The team will confirm your order and payment shortly."
              : "The team is already preparing your basket. We'll WhatsApp you the moment it's ready."}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Your reference
            </p>
            <p className="mt-1 font-display text-3xl font-bold tracking-wide text-foreground">
              {order.reference}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Save this code — it tracks your order on the website.
            </p>
          </div>

          {/* MediPoints earned — the celebratory payoff of the programme. */}
          {order.pointsEarned > 0 && (
            <div
              className="points-in mt-4 flex items-center gap-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-mint/60 p-4 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-emerald-900/10"
              aria-label="MediPoints earned on this order"
            >
              <span className="points-shine relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  +{order.pointsEarned.toLocaleString("en-KE")} MediPoints earned
                  {order.loyaltyTier && (
                    <span className="ml-1.5 font-normal text-muted-foreground">· {order.loyaltyTier} tier</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {order.pointsBalance !== null ? (
                    <>
                      New balance: <span className="font-bold tabular-nums text-foreground">{order.pointsBalance.toLocaleString("en-KE")} pts</span>
                      {" "}— spend them like cash at checkout.
                    </>
                  ) : (
                    "Points live on your phone number — spend them like cash at checkout."
                  )}
                </p>
              </div>
            </div>
          )}

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold text-foreground">
                {formatKes(order.total)}
                {order.loyaltyDiscount > 0 && (
                  <span className="block text-right text-[0.6875rem] font-normal text-emerald-700 dark:text-emerald-400">
                    {order.pointsRedeemed} MediPoints saved {formatKes(order.loyaltyDiscount)}
                  </span>
                )}
                {order.discount > 0 && (
                  <span className="block text-right text-[0.6875rem] font-normal text-primary">
                    promo {order.promoCode} saved {formatKes(order.discount)}
                  </span>
                )}
                {order.deliveryFee > 0 && fulfilment === "delivery" && (
                  <span className="block text-right text-[0.6875rem] font-normal text-muted-foreground">
                    includes {formatKes(order.deliveryFee)} delivery
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fulfilment</dt>
              <dd className="font-medium text-foreground">
                {fulfilment === "delivery" ? "Delivery to you" : "Pickup from the pharmacy"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="font-medium text-foreground">
                {order.paymentStatus === "paid-demo"
                  ? "Paid (demo)"
                  : order.hasPrescriptionItems
                    ? "On confirmation"
                    : "On collection"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Next time</dt>
              <dd className="flex items-center gap-1.5 font-medium text-foreground">
                {profileSaved ? (
                  <>
                    <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
                    Details saved on this device
                  </>
                ) : (
                  "Fresh checkout each time"
                )}
              </dd>
            </div>
          </dl>

          <Separator className="my-6" />

          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            What happens next
          </h3>
          <ol className="mt-3 space-y-3">
            {[
              {
                icon: Phone,
                title: "We confirm with you",
                desc: "The team WhatsApp/calls to confirm items and availability.",
              },
              {
                icon: Package,
                title: order.hasPrescriptionItems ? "Pharmacist review" : "We pack your order",
                desc: order.hasPrescriptionItems
                  ? "Prescription checked by the pharmacist, then packed."
                  : "Your basket is packed and labelled with your reference.",
              },
              {
                icon: fulfilment === "delivery" ? Truck : Store,
                title: fulfilment === "delivery" ? "Out for delivery" : "Ready for pickup",
                desc: fulfilment === "delivery"
                  ? "Same-day dispatch to your address once confirmed."
                  : "Collect at Roysambu — bring your reference code.",
              },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon aria-hidden="true" className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button asChild className="wa-cta rounded-full" size="lg">
              <a
                href={whatsappLink(whatsappMessages.order(order.reference, summary))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "order-confirmation" })}
              >
                <MessageCircle aria-hidden="true" className="size-4.5" />
                Confirm on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <SiteLink href={`/track?ref=${order.reference}`} trackLabel="order-track">
                <PackageSearch aria-hidden="true" className="size-4.5" />
                Track this order
              </SiteLink>
            </Button>
          </div>

          {/* Print-only receipt footer — revealed on paper (see .print-only). */}
          <div className="print-only">
            <div className="mt-2 border-t border-black/30 pt-3 text-[0.72rem] leading-5 text-black">
              <p className="text-base font-bold">{business.name}</p>
              <p>{business.area}, {business.city} · {business.phone}</p>
              <p className="mt-1 font-semibold">Order receipt — {order.reference}</p>
              <p>Placed {printedOn} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p>
              <p className="mt-1">
                {fulfilment === "delivery" ? "Delivery" : "Pickup"}
                {order.deliveryFee > 0 ? ` (incl. ${formatKes(order.deliveryFee)} delivery)` : ""}
                {order.discount > 0 ? ` · promo ${order.promoCode} −${formatKes(order.discount)}` : ""}
                {order.loyaltyDiscount > 0 ? ` · ${order.pointsRedeemed} pts −${formatKes(order.loyaltyDiscount)}` : ""}
              </p>
              {order.pointsEarned > 0 && (
                <p>MediPoints earned: +{order.pointsEarned}{order.pointsBalance !== null ? ` · balance ${order.pointsBalance} pts` : ""}</p>
              )}
              <p className="mt-1 font-bold">Total paid: {formatKes(order.total)}</p>
              <p className="mt-2 text-[0.62rem]">
                Demo receipt — prices are indicative. Bring this receipt or your reference code
                when collecting. {site.url}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="mt-3 w-full rounded-full"
            onClick={() => {
              track("receipt_print", { ref: order.reference });
              window.print();
            }}
          >
            <Printer aria-hidden="true" className="size-4.5" />
            Print receipt
          </Button>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full rounded-full">
            <SiteLink href="/products" trackLabel="order-continue-shopping">
              Continue shopping
            </SiteLink>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Summary card ───────────────────────────────────────────────── */

function SummaryCard({
  lines,
  subtotal,
  total,
  effectiveDeliveryFee,
  fulfilment,
  zone,
  freeDelivery,
  promoApplied,
  promoLabel,
  promoInput,
  promoError,
  onPromoInput,
  onApplyPromo,
  onClearPromo,
  loyaltyQuote,
  pointsToRedeem,
  maxRedeemablePoints,
  loyaltyKes,
  previewEarn,
  loyaltyError,
  onSetPoints,
}: {
  lines: ReturnType<typeof useCart>["lines"];
  subtotal: number;
  total: number;
  effectiveDeliveryFee: number;
  fulfilment: Fulfilment;
  zone: ReturnType<typeof findDeliveryZone>;
  freeDelivery: boolean;
  promoApplied: { code: string; label: string; discount: number; freeDelivery: boolean } | null;
  /** When non-empty the applied code no longer fits the basket. */
  promoLabel: string;
  promoInput: string;
  promoError: string;
  onPromoInput: (v: string) => void;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  loyaltyQuote: LoyaltyQuote | null;
  pointsToRedeem: number;
  maxRedeemablePoints: number;
  loyaltyKes: number;
  previewEarn: number;
  loyaltyError: string;
  onSetPoints: (v: number) => void;
}) {
  const remaining = FREE_DELIVERY_OVER - subtotal;
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <ShoppingBag aria-hidden="true" className="size-5 text-primary" />
        Order summary
      </h2>
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto scrollbar-thin">
        {lines.map((l) => (
          <li key={l.slug} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-secondary/60">
              <Image src={l.image} alt="" fill sizes="48px" priority={lines[0]?.slug === l.slug} className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
              <p className="text-xs text-muted-foreground">× {l.quantity}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatKes(l.price * l.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <Separator className="my-4" />
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatKes(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {fulfilment === "delivery" ? "Delivery" : "Pickup"}
            {zone ? <span className="block text-[0.6875rem] text-muted-foreground/80">{zone.name} · {zone.eta}</span> : null}
          </span>
          <span className="font-medium text-foreground">
            {fulfilment === "pickup"
              ? "Free"
              : freeDelivery || effectiveDeliveryFee === 0
                ? promoApplied
                  ? "Free (promo)"
                  : "Free (over threshold)"
                : zone
                  ? zone.fee > 0
                    ? formatKes(effectiveDeliveryFee)
                    : "TBC*"
                  : "Choose area"}
          </span>
        </div>
        {promoApplied && promoApplied.discount > 0 && (
          <div key={promoApplied.code} className="promo-in flex justify-between text-primary">
            <span className="flex items-center gap-1.5 font-medium">
              <TicketPercent aria-hidden="true" className="size-3.5" />
              Promo {promoApplied.code}
            </span>
            <span className="font-semibold tabular-nums">−{formatKes(promoApplied.discount)}</span>
          </div>
        )}
        {promoApplied && promoApplied.freeDelivery && promoApplied.discount === 0 && (
          <div key={promoApplied.code} className="promo-in flex justify-between text-primary">
            <span className="flex items-center gap-1.5 font-medium">
              <TicketPercent aria-hidden="true" className="size-3.5" />
              Promo {promoApplied.code}
            </span>
            <span className="font-semibold">Delivery waived</span>
          </div>
        )}
        {loyaltyKes > 0 && (
          <div key={pointsToRedeem} className="promo-in flex justify-between text-primary">
            <span className="flex items-center gap-1.5 font-medium">
              <Gift aria-hidden="true" className="size-3.5" />
              {pointsToRedeem} MediPoints
            </span>
            <span className="font-semibold tabular-nums">−{formatKes(loyaltyKes)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-display text-lg font-bold text-primary">{formatKes(total)}</span>
        </div>
        {promoApplied && (
          <p className="flex items-center gap-1.5 text-[0.6875rem] text-primary/90">
            <BadgeCheck aria-hidden="true" className="size-3" />
            {promoApplied.label}
          </p>
        )}
        {promoApplied && promoLabel && (
          <p className="text-[0.6875rem] font-medium text-accent-foreground" role="alert">
            {promoLabel}
          </p>
        )}
        {fulfilment === "delivery" && zone && zone.fee === 0 && !freeDelivery && !promoApplied?.freeDelivery && (
          <p className="text-xs text-muted-foreground">*The team confirms this area&apos;s fee before dispatch.</p>
        )}
      </div>

      {/* Promo code entry — validated server-side at submit */}
      <div className="mt-4 rounded-xl border bg-background/60 p-3">
        {promoApplied ? (
          <div key={promoApplied.code} className="promo-in flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary">
              <TicketPercent aria-hidden="true" className="size-4 shrink-0" />
              <span className="font-mono tracking-wide">{promoApplied.code}</span>
              <BadgeCheck aria-hidden="true" className="size-4 shrink-0" />
            </p>
            <button
              type="button"
              onClick={onClearPromo}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              aria-label={`Remove promo ${promoApplied.code}`}
            >
              Remove
            </button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onApplyPromo();
            }}
          >
            <label htmlFor="co-promo" className="sr-only">
              Promo code
            </label>
            <Input
              id="co-promo"
              value={promoInput}
              onChange={(e) => onPromoInput(e.target.value.toUpperCase().slice(0, 20))}
              placeholder="Promo code"
              autoComplete="off"
              className="h-9 flex-1 border-none bg-transparent font-mono text-sm uppercase tracking-wider shadow-none focus-visible:ring-0"
              aria-invalid={!!promoError}
              aria-describedby={promoError ? "co-promo-err" : "co-promo-hint"}
            />
            <Button type="submit" variant="outline" size="sm" className="h-9 rounded-full px-4 text-xs font-semibold">
              Apply
            </Button>
            <p id="co-promo-hint" className="sr-only">
              Try WELCOME10 for 10% off your first order.
            </p>
          </form>
        )}
        {promoError && !promoApplied && (
          <p id="co-promo-err" className="mt-2 text-xs font-medium text-destructive" role="alert">
            {promoError}
          </p>
        )}
      </div>

      {/* MediPoints widget — the balance lives SERVER-SIDE (phone-keyed);
          redemption blocks are re-validated by the orders API at submit. */}
      {(loyaltyQuote || previewEarn >= 1) && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-3",
            loyaltyQuote?.tier === "gold"
              ? "border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10"
              : loyaltyQuote?.tier === "silver"
                ? "border-slate-300/60 bg-gradient-to-br from-slate-50/80 to-zinc-50/50 dark:from-slate-800/30 dark:to-zinc-900/20"
                : "border-primary/20 bg-primary/5"
          )}
          aria-labelledby="medipoints-heading"
        >
          <div className="flex items-center justify-between gap-2">
            <p
              id="medipoints-heading"
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <Sparkles aria-hidden="true" className="size-4 text-primary" />
              MediPoints
            </p>
            {loyaltyQuote && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider",
                  loyaltyQuote.tier === "gold"
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950"
                    : loyaltyQuote.tier === "silver"
                      ? "bg-gradient-to-r from-slate-300 to-zinc-400 text-slate-900"
                      : "bg-secondary text-secondary-foreground"
                )}
              >
                {loyaltyQuote.tierLabel}
              </span>
            )}
          </div>

          {loyaltyQuote ? (
            <>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                <span className="font-bold tabular-nums text-foreground">
                  {loyaltyQuote.points.toLocaleString("en-KE")} points
                </span>{" "}
                on {loyaltyQuote.phone}
                {loyaltyQuote.nextAt !== null && (
                  <>
                    {" "}· {Math.max(0, loyaltyQuote.nextAt - loyaltyQuote.lifetimePoints).toLocaleString("en-KE")} pts to {loyaltyQuote.nextLabel}
                  </>
                )}
              </p>
              {maxRedeemablePoints >= REDEEM_BLOCK ? (
                <div className="mt-2.5">
                  <label
                    htmlFor="co-points"
                    className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Use points (1 pt = KES 1 · blocks of {REDEEM_BLOCK})
                  </label>
                  <select
                    id="co-points"
                    value={pointsToRedeem}
                    onChange={(e) => onSetPoints(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <option value={0}>Don&rsquo;t use points</option>
                    {Array.from(
                      { length: maxRedeemablePoints / REDEEM_BLOCK },
                      (_, i) => (i + 1) * REDEEM_BLOCK
                    ).map((v) => (
                      <option key={v} value={v}>
                        Use {v} pts − KES {v.toLocaleString("en-KE")}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                loyaltyQuote.points >= REDEEM_BLOCK && (
                  <p className="mt-2 text-[0.6875rem] leading-4 text-muted-foreground">
                    Points unlock once the basket reaches KES {REDEEM_BLOCK} — earn on this order instead.
                  </p>
                )
              )}
            </>
          ) : (
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Every order earns points you can spend like cash at checkout.
            </p>
          )}

          {previewEarn >= 1 && (
            <p
              className={cn(
                "mt-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                "bg-primary/10 text-primary",
                pointsToRedeem > 0 && "opacity-70"
              )}
            >
              <Gift aria-hidden="true" className="size-3.5 shrink-0" />
              This order earns +{previewEarn.toLocaleString("en-KE")} pts
              {!loyaltyQuote && (
                <span className="font-normal text-primary/80">· incl. +50 first-order bonus</span>
              )}
            </p>
          )}
          {loyaltyError && (
            <p className="mt-2 text-xs font-medium text-destructive" role="alert">
              {loyaltyError}
            </p>
          )}
        </div>
      )}

      {/* Free-delivery nudge — classic basket-builder */}
      {fulfilment === "delivery" && !freeDelivery && remaining > 0 && (
        <div className="mt-4 rounded-xl bg-primary/5 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Truck aria-hidden="true" className="size-3.5" />
            Add {formatKes(remaining)} more for free delivery
          </p>
          <div
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((subtotal / FREE_DELIVERY_OVER) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress towards free delivery"
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.round((subtotal / FREE_DELIVERY_OVER) * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[0.6875rem] text-muted-foreground">
            Baskets of {formatKes(FREE_DELIVERY_OVER)}+ deliver free in all zones.
          </p>
        </div>
      )}
      {freeDelivery && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-mint p-3 text-xs font-semibold text-mint-foreground">
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          Free delivery unlocked — asante!
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs leading-5 text-secondary-foreground">
        <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Pickup: {business.area}, {business.city} · today until {business.hours[0].close}
      </p>
    </div>
  );
}

/* ── Empty basket ───────────────────────────────────────────────── */

function EmptyBasket() {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary">
        <ShoppingBag aria-hidden="true" className="size-9 text-primary" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
        Your basket is empty
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Add a few health essentials from the shop and come back — your basket waits
        for you here.
      </p>
      <Button asChild size="lg" className="mt-6 rounded-full px-8">
        <SiteLink href="/products" trackLabel="checkout-empty-browse">
          Browse the shop
          <ArrowRight aria-hidden="true" className="size-4.5" />
        </SiteLink>
      </Button>
    </div>
  );
}

/* ── M-Pesa STK simulation ──────────────────────────────────────── */

function MpesaSimDialog({
  open,
  phone,
  amount,
  onClose,
  onSuccess,
}: {
  open: boolean;
  phone: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phase, setPhase] = useState<"sending" | "pin" | "processing" | "success">("sending");

  useEffect(() => {
    if (!open) return;
    const t1 = setTimeout(() => setPhase("pin"), 2000);
    return () => clearTimeout(t1);
  }, [open]);

  useEffect(() => {
    if (phase === "processing") {
      const t = setTimeout(() => setPhase("success"), 1600);
      return () => clearTimeout(t);
    }
    if (phase === "success") {
      const t = setTimeout(onSuccess, 1400);
      return () => clearTimeout(t);
    }
  }, [phase, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : phase === "pin" && onClose())}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>M-Pesa payment</DialogTitle>
          <DialogDescription>Simulated M-Pesa checkout (demo).</DialogDescription>
        </DialogHeader>

        <div className="bg-[#00a851] px-6 py-8 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-90">M-Pesa · Demo</p>
          <p className="mt-2 font-display text-2xl font-bold">{formatKes(amount)}</p>
          <p className="mt-1 text-sm opacity-90">Medivyx Medical Care</p>
        </div>

        <div className="p-6">
          {phase === "sending" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Sending payment request to {phone || "your phone"}…
              </p>
              <p className="text-xs text-muted-foreground">
                A prompt like this appears on your phone (simulated).
              </p>
            </div>
          )}
          {phase === "pin" && (
            <div className="text-center">
              {/* Fake phone prompt */}
              <div className="rounded-2xl border bg-secondary/60 p-4 text-left">
                <p className="text-xs leading-5 text-secondary-foreground">
                  <strong>MPESA:</strong> Enter M-PESA PIN to pay {formatKes(amount)} to
                  MEDIVYX MEDICAL CARE {phone ? `on ${phone}` : ""}.
                </p>
              </div>
              <Button
                size="lg"
                className="mt-4 w-full rounded-full"
                onClick={() => setPhase("processing")}
              >
                I&rsquo;ve entered my PIN
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                This is a demo — nothing is charged. Click to continue the simulation.
              </p>
            </div>
          )}
          {phase === "processing" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Confirming payment…</p>
            </div>
          )}
          {phase === "success" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 aria-hidden="true" className="size-10 text-primary" />
              <p className="text-sm font-semibold text-foreground">Payment received (demo)</p>
              <p className="text-xs text-muted-foreground">Placing your order…</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
