import { business, whatsappMessages } from "@/lib/business";
import { products, services } from "@/lib/data";
import type { Product } from "@/lib/types";

/**
 * "Ask Medivyx" — self-contained chatbot engine (research.md §27–28).
 *
 * Design principles:
 *  - Answers only from the structured business knowledge base below.
 *  - Never diagnoses, prescribes, suggests dosages or guarantees stock.
 *  - Always hands medical questions to a qualified professional.
 *  - Ends answers with useful CTAs (WhatsApp, call, internal links).
 *
 * The engine is deterministic and dependency-free, so the demo works
 * anywhere with zero API keys. It can later be swapped for an LLM
 * service that is given this same knowledge base as its system prompt.
 */

export type ChatCtaKind = "whatsapp" | "call" | "internal";

export interface ChatCta {
  kind: ChatCtaKind;
  label: string;
  /** Pre-filled WhatsApp message (whatsapp kind) */
  message?: string;
  /** Internal site path (internal kind) */
  href?: string;
}

export interface ChatReply {
  intent: string;
  text: string;
  ctas: ChatCta[];
  suggestions: string[];
}

/** A single prior conversation turn, sent by the chat UI. */
export interface ChatHistoryTurn {
  role: "user" | "bot";
  content: string;
  /** Suggestion chips attached to a bot turn (used for "yes" follow-ups). */
  suggestions?: string[];
}

/* ------------------------------------------------------------------ */
/* Knowledge base                                                      */
/* ------------------------------------------------------------------ */

const KB = {
  servicesList: services.map((s) => `${s.name} — ${s.short}`).join("\n"),
  productCategories: "Medicines, Wellness, Baby Care, Personal Care and Medical Supplies",
  hoursSummary: business.hours.map((h) => `${h.day}: ${h.open} – ${h.close}`).join(", "),
} as const;

/* ------------------------------------------------------------------ */
/* Intent detection                                                    */
/* ------------------------------------------------------------------ */

interface IntentDef {
  id: string;
  keywords: string[];
  weight?: number;
  reply: () => ChatReply;
}

const callCta: ChatCta = { kind: "call", label: "Call Medivyx" };
const whatsappCta = (message?: string): ChatCta => ({
  kind: "whatsapp",
  label: "Chat on WhatsApp",
  message,
});

/* Safety-first reply for medical questions (research.md §27). */
function medicalSafetyReply(question: string): ChatReply {
  const isEmergency = /\b(emergency|bleeding a lot|unconscious|not breathing|suicide|poison(ed|ing)?)\b/.test(
    question.toLowerCase()
  );
  if (isEmergency) {
    return {
      intent: "emergency",
      text: "If this is a medical emergency, please call 999 or 112 immediately, or go to the nearest emergency unit. For urgent medicine questions, the Medivyx pharmacy team is available during opening hours.",
      ctas: [callCta],
      suggestions: ["What are your opening hours?", "How do I contact Medivyx?"],
    };
  }
  return {
    intent: "medical-advice",
    text: "I can share general information, but a qualified healthcare professional should assess your specific situation. For questions about symptoms, medicines or dosages, please speak with the Medivyx pharmacist — they’ll give you proper, personal guidance.",
    ctas: [
      whatsappCta(whatsappMessages.general),
      callCta,
      { kind: "internal", label: "Health Information", href: "/health-information" },
    ],
    suggestions: ["Can I send a prescription?", "How do I request medicine?"],
  };
}

/* Product matching with common brand-name aliases (Kenya). */
const PRODUCT_ALIASES: Record<string, string> = {
  panadol: "paracetamol-500mg-tablets",
  brufen: "ibuprofen-400mg-tablets",
  "panado": "paracetamol-500mg-tablets",
  zyrtec: "cetirizine-10mg-tablets",
  ors: "oral-rehydration-salts",
  "oral rehydration": "oral-rehydration-salts",
  antibiotic: "amoxicillin-500mg-capsules",
  amoxil: "amoxicillin-500mg-capsules",
  multivitamin: "multivitamin-tablets",
  "vitamin c": "vitamin-c-1000mg",
  "vitamin d": "baby-vitamin-d-drops",
  thermometer: "digital-thermometer",
  mask: "medical-face-masks-50",
  masks: "medical-face-masks-50",
  sanitizer: "hand-sanitizer-500ml",
  "first aid": "home-first-aid-kit",
  "first-aid": "home-first-aid-kit",
  "blood pressure": "blood-pressure-monitor",
  gloves: "disposable-gloves",
  jelly: "petroleum-jelly-baby",
  wipes: "baby-wipes-fragrance-free",
  "baby syrup": "baby-paracetamol-syrup",
  "cough": "cough-syrup-honey-lemon",
  "fever": "paracetamol-500mg-tablets",
  "pain": "ibuprofen-400mg-tablets",
  "allergy": "cetirizine-10mg-tablets",
  "diabetes": "metformin-500mg-tablets",
  "iron": "iron-and-folic-acid",
  "zinc": "zinc-supplement",
};

function findProduct(query: string): Product | undefined {
  const q = query.toLowerCase();
  // Exact-ish name match first
  const byName = products.find((p) =>
    q.includes(p.name.toLowerCase()) ||
    q.includes(p.name.toLowerCase().split(" ")[0] + " ")
  );
  if (byName) return byName;
  // Slug word match
  const slugWords = products.find((p) =>
    p.slug.split("-").some((w) => w.length > 3 && q.includes(w))
  );
  if (slugWords) return slugWords;
  // Aliases
  for (const [alias, slug] of Object.entries(PRODUCT_ALIASES)) {
    if (q.includes(alias)) {
      const hit = products.find((p) => p.slug === slug);
      if (hit) return hit;
    }
  }
  return undefined;
}

function productReply(product: Product): ChatReply {
  const rx = product.prescriptionRequired
    ? " Please note this item requires a valid prescription before it can be dispensed."
    : "";
  return {
    intent: "product",
    text: `Medivyx offers ${product.name} — ${product.tagline}.${rx} For current stock and pricing, the pharmacy team can confirm for you right away.`,
    ctas: [
      whatsappCta(whatsappMessages.product(product.name)),
      { kind: "internal", label: "View Product", href: `/products/${product.slug}` },
    ],
    suggestions: [
      "Can I request it now?",
      "Do you offer delivery?",
      "What other products do you stock?",
    ],
  };
}

/* ------------------------------------------------------------------ */

const INTENTS: IntentDef[] = [
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "habari", "niaje", "jambo"],
    reply: () => ({
      intent: "greeting",
      text: "Hello! Welcome to Medivyx Medical Care. I can help with our services, products, prescriptions, opening hours and how to reach the team. What would you like to know?",
      ctas: [],
      suggestions: [
        "What services do you offer?",
        "Where are you located?",
        "How can I request medicine?",
      ],
    }),
  },
  {
    id: "services",
    keywords: ["service", "services", "offer", "what do you do", "help with", "what can you do"],
    reply: () => ({
      intent: "services",
      text: `Medivyx provides:\n\n${KB.servicesList}\n\nIf you tell me what you need, I can point you to the right one.`,
      ctas: [{ kind: "internal", label: "Explore Services", href: "/services" }],
      suggestions: ["Can I book a consultation?", "Can I send a prescription?"],
    }),
  },
  {
    id: "booking",
    keywords: ["book", "booking", "appointment", "appointments", "consult", "consultation", "consultations", "reserve", "schedule", "see a pharmacist", "talk to a pharmacist", "meet the pharmacist", "blood pressure check", "bp check"],
    reply: () => ({
      intent: "booking",
      text: "Yes — you can book a free pharmacist consultation! Pick a slot online: choose a consultation type (medicine questions, prescription review, blood pressure check or wellness advice), pick a day and time, and the team confirms your booking. You can also simply walk in, but booking means no waiting.",
      ctas: [
        { kind: "internal", label: "Book a Consultation", href: "/book" },
        whatsappCta("Hi Medivyx, I'd like to book a consultation with a pharmacist."),
      ],
      suggestions: ["What services do you offer?", "How can I request medicine?"],
    }),
  },
  {
    id: "location",
    keywords: ["where", "located", "location", "address", "directions", "find you", "roysambu", "nairobi", "branch"],
    reply: () => ({
      intent: "location",
      text: `Medivyx Medical Care is located in ${business.area}, ${business.city}. Tap “Get Directions” for the route — or message us on WhatsApp and the team will send you a pin.`,
      ctas: [
        whatsappCta(whatsappMessages.directions),
        { kind: "internal", label: "Contact & Directions", href: "/contact" },
      ],
      suggestions: ["What are your opening hours?", "Can I request medicine before visiting?"],
    }),
  },
  {
    id: "hours",
    keywords: ["open", "hours", "opening", "close", "closing", "today", "time", "when are you"],
    reply: () => ({
      intent: "hours",
      text: `Our opening hours are:\n• ${business.hours.map((h) => `${h.day}: ${h.open} – ${h.close}`).join("\n• ")}\n\nYou can also message us on WhatsApp any time and the team will reply during opening hours.`,
      ctas: [whatsappCta(whatsappMessages.general)],
      suggestions: ["Where are you located?", "How do I contact Medivyx?"],
    }),
  },
  {
    id: "contact",
    keywords: ["contact", "phone", "call", "number", "email", "reach", "talk to", "speak to someone", "human", "person"],
    reply: () => ({
      intent: "contact",
      text: `You can reach the Medivyx team by phone (${business.phone}), WhatsApp or email (${business.email}). WhatsApp is usually the fastest during opening hours.`,
      ctas: [whatsappCta(whatsappMessages.general), callCta],
      suggestions: ["What are your opening hours?", "Can I contact you on WhatsApp?"],
    }),
  },
  {
    id: "whatsapp",
    keywords: ["whatsapp", "wa", "chat", "message you"],
    reply: () => ({
      intent: "whatsapp",
      text: "Yes! WhatsApp is one of the fastest ways to reach the team — for product availability, prescriptions or any quick question. The button below opens a chat with your message pre-filled.",
      ctas: [whatsappCta(whatsappMessages.general)],
      suggestions: ["Where are you located?", "How can I request medicine?"],
    }),
  },
  {
    id: "prescription",
    keywords: ["prescription", "prescribe", "rx", "refill", "repeat", "upload", "send my"],
    reply: () => ({
      intent: "prescription",
      text: "Yes — you can submit a prescription ahead of time. Use Request Medicine, attach a photo or PDF of your prescription, and the pharmacy team will review it and contact you to confirm. You can also simply bring it to the counter.",
      ctas: [
        { kind: "internal", label: "Request Medicine", href: "/request-medicine" },
        whatsappCta(whatsappMessages.prescription),
      ],
      suggestions: ["Do you offer delivery?", "Can someone else collect for me?"],
    }),
  },
  {
    id: "request",
    keywords: ["request", "order", "buy", "purchase", "get medicine", "medicine request", "before visiting", "before i come"],
    reply: () => ({
      intent: "request",
      text: "Requesting medicine is easy: tell us what you need, attach your prescription if you have one, choose pickup or delivery, and submit. The team reviews your request and contacts you to confirm — usually very quickly during opening hours.",
      ctas: [{ kind: "internal", label: "Request Medicine", href: "/request-medicine" }],
      suggestions: ["Can I send a prescription?", "Do you offer delivery?"],
    }),
  },
  {
    id: "delivery",
    keywords: ["deliver", "delivery", "bring", "bring it", "home delivery", "ship", "courier", "rider", "pickup", "collect", "someone else"],
    reply: () => ({
      intent: "delivery",
      text: "Pickup at the pharmacy is always available. Delivery options are being confirmed for the demo — ask the team on WhatsApp about current arrangements for your area, including whether someone else can collect on your behalf.",
      ctas: [whatsappCta("Hi Medivyx, do you offer delivery to my area?")],
      suggestions: ["How can I request medicine?", "Can I send a prescription?"],
    }),
  },
  {
    id: "products",
    keywords: ["product", "products", "stock", "stocked", "item", "items", "catalogue", "inventory", "what do you sell", "have"],
    reply: () => ({
      intent: "products",
      text: `We stock a practical range of healthcare products: ${KB.productCategories}. Browse the full catalogue online — and if something isn’t listed, just ask and the team will check for you.`,
      ctas: [{ kind: "internal", label: "Browse Products", href: "/products" }],
      suggestions: ["Do you have paracetamol?", "Do you have baby care products?"],
    }),
  },
  {
    id: "payment",
    keywords: ["pay", "payment", "mpesa", "m-pesa", "card", "cash", "price", "prices", "cost", "how much", "insurance", "sha", "nhif"],
    reply: () => ({
      intent: "payment",
      text: "Payment and insurance details (including M-Pesa and SHA) are being confirmed with the business for the demo. For current pricing of any product, the pharmacy team can confirm for you directly.",
      ctas: [whatsappCta("Hi Medivyx, I'd like to ask about prices and payment options.")],
      suggestions: ["Do you have paracetamol?", "How can I request medicine?"],
    }),
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "asante", "appreciate", "great", "perfect", "awesome"],
    reply: () => ({
      intent: "thanks",
      text: "You’re very welcome! If there’s anything else — products, prescriptions, hours or directions — just ask. Have a healthy day! 💚",
      ctas: [],
      suggestions: ["Where are you located?", "What services do you offer?"],
    }),
  },
];

/* Medical-safety keyword guard runs BEFORE normal intents. */
const MEDICAL_PATTERNS = [
  "diagnos", "what should i take", "what can i take", "dosage", "dose", "how many mg",
  "how much should", "is it safe", "side effect", "symptom", "sick", "ill", "pain in my",
  "hurts", "infection", "pregnan", "breastfeed", "treat my", "cure", "hiv", "malaria",
  "typhoid", "cough for", "fever for", "vomit", "diarrh", "rash", "allergic to",
  "medicine for my baby", "give my child", "overdose", "took too many", "mix", "interact",
];

export function getBotReply(input: string, history: ChatHistoryTurn[] = []): ChatReply {
  const q = input.toLowerCase().trim();
  if (!q) {
    return INTENTS[0].reply();
  }

  // 1. Safety guard
  if (MEDICAL_PATTERNS.some((p) => q.includes(p))) {
    return medicalSafetyReply(input);
  }

  // 2. Product match (only if the query looks like it's about having/finding an item)
  if (/\b(have|stock|carry|do you|available|avail|find|looking for|need|get)\b/.test(q)) {
    const product = findProduct(input);
    if (product) return productReply(product);
  }

  // 3. Intent scoring
  let best: { def: IntentDef; score: number } | null = null;
  for (const def of INTENTS) {
    let score = 0;
    for (const kw of def.keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 3 : 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { def, score };
  }
  if (best) return best.def.reply();

  // 4. Plain product-name mention
  const product = findProduct(input);
  if (product) return productReply(product);

  // 4b. Follow-up resolution (multi-turn context)
  const followUp = resolveFollowUp(q, history);
  if (followUp) return followUp;

  // 5. Fallback
  return {
    intent: "fallback",
    text: "I’m not sure about that one — but the Medivyx team will know! You can ask them directly on WhatsApp, or try one of the topics below. For anything about symptoms or medicines, please speak with the pharmacist.",
    ctas: [whatsappCta(whatsappMessages.general), callCta],
    suggestions: [
      "What services do you offer?",
      "Where are you located?",
      "How can I request medicine?",
      "What products do you stock?",
    ],
  };
}

/* ── Multi-turn follow-up resolution ─────────────────────────────
 * The chat UI sends the last few turns. Two patterns are resolved:
 *  1. Affirmative replies ("yes", "sure", "ok") → treat as clicking the
 *     first suggestion chip of the last bot answer (that is what the
 *     user almost always means).
 *  2. Pronoun/ellipsis follow-ups ("how much is it?", "is it available?")
 *     → re-resolve against the last product mentioned in the conversation.
 * Both fall through to the normal fallback when there is no context. */
const AFFIRMATIVE_RE =
  /^(yes|yeah|yep|yup|sure|ok|okay|please|sounds good|go ahead|sawa|ndio|ndiyo|naam|ok please|yes please)[!., ]*$/;

const FOLLOWUP_WORDS =
  /\b(it|that|that one|the same|one|price|prices|cost|how much|stock|available|deliver|deliver it|get it|order it|request it)\b/;

function resolveFollowUp(
  q: string,
  history: ChatHistoryTurn[]
): ChatReply | null {
  if (history.length === 0) return null;

  // 1. Affirmative → first suggestion of the last bot turn
  if (AFFIRMATIVE_RE.test(q)) {
    const lastBot = [...history].reverse().find((h) => h.role === "bot");
    const suggestion = lastBot?.suggestions?.[0];
    if (suggestion) {
      // Suggestions are plain topic questions — safe to re-resolve.
      // They can never be affirmative themselves, so no recursion loop.
      return getBotReply(suggestion);
    }
    return null;
  }

  // 2. Pronoun/ellipsis follow-up → last product mentioned by the user
  if (FOLLOWUP_WORDS.test(q) && q.split(/\s+/).length <= 8) {
    let lastProduct: Product | undefined;
    for (const turn of history) {
      if (turn.role === "user") {
        const found = findProduct(turn.content);
        if (found) lastProduct = found;
      }
    }
    if (lastProduct) {
      const reply = productReply(lastProduct);
      return {
        ...reply,
        text: `About ${lastProduct.name} — ${stripProductPrefix(reply.text)}`,
        intent: "product-followup",
      };
    }
  }

  return null;
}

function stripProductPrefix(text: string): string {
  // productReply starts with "Medivyx offers {name} — …"; drop that head
  // because we already name the product in the follow-up prefix.
  const dash = text.indexOf(" — ");
  return dash >= 0 ? text.slice(dash + 3) : text;
}

/** Opening chips shown when the chat starts (research.md §27). */
export const chatStarter = {
  greeting:
    "Hi, I’m the Medivyx assistant. Ask me about our services, products, prescriptions, opening hours or how to reach the team. For medical advice, our pharmacist is the right person to talk to.",
  suggestions: [
    "What services do you offer?",
    "Where are you located?",
    "How can I request medicine?",
    "Can I send a prescription?",
    "What products do you stock?",
  ],
} as const;
