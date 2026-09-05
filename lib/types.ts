/** Shared types for the Medivyx demo catalogue (research.md §23). */

export type ProductCategory =
  | "Medicines"
  | "Wellness"
  | "Baby Care"
  | "Personal Care"
  | "Medical Supplies";

export type ProductAvailability = "in-stock" | "low-stock" | "ask";

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  tagline: string;
  description: string;
  usageInfo: string;
  availability: ProductAvailability;
  prescriptionRequired: boolean;
  featured?: boolean;
  icon: string; // lucide icon name rendered by <ProductIcon />
  /** Indicative price in KES (demo — confirmed by the team at checkout). */
  price: number;
  /** Human pack description, e.g. "Pack of 20 tablets". */
  packSize: string;
  /** Product photography (webp) used on cards and detail pages. */
  image: string;
}

export interface Service {
  slug: string;
  name: string;
  short: string;
  description: string;
  bullets: string[];
  icon: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  readingTime: number; // minutes
  publishedAt: string; // ISO date
  content: ArticleSection[];
}

export interface SearchResult {
  kind: "product" | "service" | "article" | "faq" | "action";
  title: string;
  subtitle: string;
  href: string;
  prescriptionRequired?: boolean;
}

/* ── Medicine request tracking (research.md §8 + §24) ── */

export type MedicineRequestStatus =
  | "received"
  | "confirmed"
  | "ready"
  | "fulfilled";

/** Privacy-safe public view of a medicine request for the tracking page. */
export interface MedicineRequestPublic {
  reference: string;
  medicine: string;
  fulfilment: "pickup" | "delivery";
  status: MedicineRequestStatus;
  receivedAt: string;
}

/** Full request record as shown in the staff dashboard. */
export interface MedicineRequestFull {
  reference: string;
  medicine: string;
  fullName: string;
  phone: string;
  notes: string;
  contactMethod: string;
  fulfilment: "pickup" | "delivery";
  prescriptionFileName: string;
  status: MedicineRequestStatus;
  receivedAt: string;
}

/* ── Consultation booking ── */

export type BookingStatus = "requested" | "confirmed" | "completed";

/** Privacy-safe public view of a booking for the tracking page (no name/phone/notes). */
export interface BookingPublic {
  reference: string;
  consultType: string; // CONSULT_TYPE id (see lib/booking-shared.ts)
  date: string; // ISO date (yyyy-mm-dd)
  slot: string; // "HH:MM" 24h start of the hour slot
  status: BookingStatus;
  receivedAt: string;
}

/** Full booking record as shown in the staff dashboard. */
export interface BookingFull {
  reference: string;
  consultType: string; // CONSULT_TYPE id (see lib/bookings.ts)
  date: string; // ISO date (yyyy-mm-dd)
  slot: string; // "HH:MM" 24h label start of the hour slot
  fullName: string;
  phone: string;
  notes: string;
  status: BookingStatus;
  receivedAt: string;
}

/* ── Newsletter sign-ups (footer "Stay well" list) ── */

export interface NewsletterSubscriber {
  email: string;
  source: string;
  subscribedAt: string;
}

/* ── Online orders (shop / checkout) ── */

export type OrderStatus =
  | "received" // order placed + paid (or awaiting payment)
  | "reviewing" // prescription items under pharmacist review
  | "preparing" // items being packed
  | "ready" // ready for pickup / out for delivery
  | "completed"; // collected / delivered

export type PaymentMethod = "mpesa" | "card" | "on-collection";
export type PaymentStatus = "paid-demo" | "pending";

/** One line of an order (a snapshot of the product at purchase time). */
export interface OrderItem {
  slug: string;
  name: string;
  category: string;
  unitPrice: number; // KES
  quantity: number;
  prescriptionRequired: boolean;
  image: string;
  packSize: string;
}

/** Privacy-safe public view of an order for the tracking page. */
export interface OrderPublic {
  reference: string;
  items: OrderItem[];
  itemCount: number;
  /** Grand total in KES — items + delivery fee − promo discount − points. */
  total: number;
  /** Delivery fee included in `total` (0 for pickup / free delivery). */
  deliveryFee: number;
  /** Promo discount subtracted from `total` (0 when none). */
  discount: number;
  /** Applied promo code ("" when none). */
  promoCode: string;
  /** MediPoints discount in KES (0 when none). */
  loyaltyDiscount: number;
  /** MediPoints redeemed by this order (0 when none). */
  pointsRedeemed: number;
  /** MediPoints earned by this order (0 when unknown/legacy). */
  pointsEarned: number;
  fulfilment: "pickup" | "delivery";
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  hasPrescriptionItems: boolean;
  status: OrderStatus;
  placedAt: string;
}

/** Full order record as shown in the staff dashboard. */
export interface OrderFull extends OrderPublic {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  notes: string;
  prescriptionFileName: string;
}
