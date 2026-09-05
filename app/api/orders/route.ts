import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createOrder, updateOrderLoyalty } from "@/lib/orders";
import { isValidKenyanPhone, LENGTHS } from "@/lib/validation";
import { evaluatePromo, deliveryFeeWithPromo } from "@/lib/promos";
import { getProduct } from "@/lib/data";
import { consumeStock } from "@/lib/stock";
import { checkRedemption, applyLoyalty } from "@/lib/loyalty";
import type { OrderItem } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_MB = 5;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

const itemSchema = z.object({
  slug: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(10),
});

const payloadSchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  fullName: z.string().min(LENGTHS.fullName.min).max(LENGTHS.fullName.max),
  phone: z.string().min(9).max(20),
  email: z.string().email().max(120).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  area: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(LENGTHS.notes.max).optional().or(z.literal("")),
  prescriptionFileName: z.string().max(200).optional().or(z.literal("")),
  promoCode: z.string().max(30).optional().or(z.literal("")),
  /** MediPoints the customer wants to redeem (blocks of 100, server-checked). */
  pointsToRedeem: z.number().int().min(0).max(100_000).optional(),
  fulfilment: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["mpesa", "card", "on-collection"]),
});

function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Online order endpoint (shop checkout).
 *
 * Items are re-priced SERVER-SIDE from the catalogue (data/products.json) so
 * a tampered client can't invent prices. Uploaded prescriptions are validated
 * for type/size but — as everywhere in this demo — only metadata is stored.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`order:${ip}`, 6, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(rl.retryAfterSec, "Too many orders submitted.");
    }

    const fd = await request.formData().catch(() => null);
    if (!fd) {
      return NextResponse.json({ error: "Invalid checkout submission." }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(field(fd, "payload"));
    } catch {
      return NextResponse.json({ error: "Invalid checkout data." }, { status: 400 });
    }
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fields: { form: "Please check your checkout details." } },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const errors: Record<string, string> = {};
    if (!isValidKenyanPhone(data.phone))
      errors.phone = "Please enter a valid Kenyan phone number.";
    if (data.fulfilment === "delivery" && (data.address ?? "").length < 5)
      errors.address = "Please enter your delivery address.";
    if (data.fulfilment === "delivery" && (data.area ?? "").length < 2)
      errors.area = "Please choose your delivery area.";
    if (data.paymentMethod === "mpesa" && !isValidKenyanPhone(data.phone))
      errors.phone = "M-Pesa payments need a valid Safaricom number.";

    const file = fd.get("prescription");
    let fileName = "";
    if (file instanceof File && file.size > 0) {
      if (!ACCEPTED.includes(file.type)) {
        errors.prescription = "Only PDF, JPG, PNG or WebP files are accepted.";
      } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
        errors.prescription = `File must be smaller than ${MAX_FILE_MB}MB.`;
      } else {
        fileName = `${file.name} (${(file.size / 1024).toFixed(0)}KB)`;
        // Demo policy: file content intentionally not persisted
      }
    }
    if (!fileName && data.prescriptionFileName) {
      fileName = data.prescriptionFileName.slice(0, 200);
    }

    // Re-build items from the server catalogue (price integrity).
    const items: OrderItem[] = [];
    for (const line of data.items) {
      const product = getProduct(line.slug);
      if (!product) {
        errors.items = `We couldn't find "${line.slug}" in our catalogue.`;
        break;
      }
      items.push({
        slug: product.slug,
        name: product.name,
        category: product.category,
        unitPrice: product.price,
        quantity: line.quantity,
        prescriptionRequired: product.prescriptionRequired,
        image: product.image,
        packSize: product.packSize,
      });
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 });
    }

    // Stock check + auto stock-keeping: server-side levels are the source of
    // truth (an out-of-stock line rejects the whole order with a clear note).
    const stockProblem = await consumeStock(items.map((i) => ({ slug: i.slug, quantity: i.quantity })));
    if (stockProblem) {
      return NextResponse.json(
        {
          error:
            stockProblem.available === 0
              ? `${stockProblem.name} is out of stock — remove it from your basket or ask the team about restock.`
              : `Only ${stockProblem.available} × ${stockProblem.name} left in the shop — please lower the quantity.`,
          fields: { items: `${stockProblem.name}: check availability.` },
        },
        { status: 409 }
      );
    }

    // Delivery fee + promo discount are computed SERVER-SIDE (like prices,
    // the client can't invent a fee or a discount). Pickup always costs 0.
    // A free-delivery promo waives the fee; WELCOME10/CARE200 shave the total.
    const itemsSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const deliveryFee =
      data.fulfilment === "delivery"
        ? deliveryFeeWithPromo(itemsSubtotal, data.area ?? "", data.promoCode ?? "").fee
        : 0;
    const promo = data.promoCode
      ? evaluatePromo(data.promoCode, itemsSubtotal, deliveryFee)
      : null;
    if (data.promoCode && !promo) {
      return NextResponse.json(
        {
          error: "That promo code isn't valid.",
          fields: { promo: "We don't recognise that code — check the spelling." },
        },
        { status: 400 }
      );
    }
    if (promo?.error) {
      return NextResponse.json(
        { error: promo.error, fields: { promo: promo.error } },
        { status: 400 }
      );
    }
    const discount = promo?.discount ?? 0;

    // ── MediPoints redemption — validated SERVER-SIDE against the phone's
    // balance (same source-of-truth philosophy as prices, fees and promos).
    const pointsToRedeem = data.pointsToRedeem ?? 0;
    let loyaltyDiscount = 0;
    if (pointsToRedeem > 0) {
      const redemption = await checkRedemption(
        data.phone,
        pointsToRedeem,
        Math.max(0, itemsSubtotal - discount)
      );
      if (!redemption.ok) {
        return NextResponse.json(
          {
            error: redemption.error ?? "That MediPoints redemption can't be applied.",
            fields: { points: redemption.error ?? "Check your points." },
          },
          { status: 400 }
        );
      }
      loyaltyDiscount = redemption.kes;
    }

    const order = await createOrder({
      items,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email ?? "",
      address: data.address ?? "",
      area: data.area ?? "",
      notes: data.notes ?? "",
      prescriptionFileName: fileName,
      deliveryFee,
      discount,
      promoCode: promo?.code ?? "",
      pointsToRedeem,
      loyaltyDiscount,
      pointsRedeemed: loyaltyDiscount > 0 ? pointsToRedeem : 0,
      pointsEarned: 0,
      fulfilment: data.fulfilment,
      paymentMethod: data.paymentMethod,
    });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "We received your order but couldn't save it right now. Please message us on WhatsApp and the team will help you immediately.",
        },
        { status: 500 }
      );
    }

    // ── MediPoints bookkeeping AFTER the order is safely stored: redeem the
    // validated points, then earn for the new total (bonus on first order).
    // Failure here never blocks the order — the balance simply isn't updated.
    const loyalty = await applyLoyalty(
      data.phone,
      order.reference,
      order.total,
      loyaltyDiscount > 0 ? pointsToRedeem : 0,
      loyaltyDiscount
    ).catch(() => null);
    if (loyalty) {
      order.pointsEarned = loyalty.earned;
      order.pointsRedeemed = loyalty.redeemed;
      order.loyaltyDiscount = loyalty.redeemedKes;
      // Persist the bookkeeping onto the stored order (tracking page reads it).
      await updateOrderLoyalty(order.reference, {
        earned: loyalty.earned,
        redeemed: loyalty.redeemed,
        redeemedKes: loyalty.redeemedKes,
      }).catch(() => false);
    }

    return NextResponse.json({
      ok: true,
      reference: order.reference,
      itemCount: order.itemCount,
      total: order.total,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      promoCode: order.promoCode,
      promoLabel: promo?.label ?? "",
      loyaltyDiscount: order.loyaltyDiscount,
      pointsRedeemed: order.pointsRedeemed,
      pointsEarned: order.pointsEarned,
      pointsBalance: loyalty?.balance ?? null,
      loyaltyTier: loyalty?.tierLabel ?? null,
      status: order.status,
      paymentStatus: order.paymentStatus,
      hasPrescriptionItems: order.hasPrescriptionItems,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not place your order right now." },
      { status: 500 }
    );
  }
}
