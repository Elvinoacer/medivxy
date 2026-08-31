/**
 * Bilingual UI strings — English + Kiswahili (research.md §29 Kenya audience).
 *
 * Client-safe pure module: a flat dictionary so the language provider can do
 * a single lookup, plus helpers shared by both projects. Swahili coverage is
 * intentionally bounded to the "chrome" surfaces (header/nav, hero, home
 * section headings, footer band, newsletter) — long-form page content stays
 * English while the toggle is in demo scope.
 */

export type Lang = "en" | "sw";

export const LANG_KEY = "medivyx:lang";

type Entry = { en: string; sw: string };

export const DICTIONARY: Record<string, Entry> = {
  // ---- Header / navigation -------------------------------------------------
  "nav.home": { en: "Home", sw: "Nyumbani" },
  "nav.about": { en: "About", sw: "Kuhusu" },
  "nav.services": { en: "Services", sw: "Huduma" },
  "nav.pharmacy": { en: "Pharmacy", sw: "Dawa" },
  "nav.products": { en: "Products", sw: "Bidhaa" },
  "nav.health": { en: "Health Information", sw: "Taarifa za Afya" },
  "nav.contact": { en: "Contact", sw: "Mawasiliano" },
  "header.requestMedicine": { en: "Request Medicine", sw: "Omba Dawa" },
  "header.askMedivyx": { en: "Ask Medivyx", sw: "Uliza Medivyx" },
  "header.search": { en: "Search", sw: "Tafuta" },
  "status.open": { en: "Open now", sw: "Wazi sasa" },
  "status.closed": { en: "Closed now", sw: "Imefungwa" },
  "status.today": { en: "Today's hours", sw: "Saa za leo" },

  // ---- Hero ----------------------------------------------------------------
  "hero.headline1": { en: "Healthcare that's", sw: "Huduma za afya" },
  "hero.headline2": { en: "closer to you.", sw: "karibu nawe." },
  "hero.sub": {
    en: "Quality pharmacy, healthcare products and everyday medical support for you and your family — with a team that actually takes time to help.",
    sw: "Duka la dawa la ubora, bidhaa za afya na msaada wa kila siku kwa ajili yako na familia yako — na timu inayopata muda wa kukusaidia.",
  },
  "hero.talk": { en: "Talk to Medivyx", sw: "Zungumza na Medivyx" },
  "hero.exploreServices": { en: "Explore Services", sw: "Angalia Huduma" },
  "hero.cardTitle": { en: "WhatsApp-first care", sw: "Huduma kwa WhatsApp" },
  "hero.cardSub": {
    en: "Answers without unnecessary visits",
    sw: "Majibu bila lazima ya kuja dukani",
  },

  // ---- Home sections ---------------------------------------------------------
  "home.visitEyebrow": { en: "Visit us", sw: "Tembelea" },
  "home.visitTitle": { en: "Find us in Roysambu", sw: "Tupate Roysambu" },
  "home.visitDesc": {
    en: "Easy to reach, easy to talk to — drop by or message first.",
    sw: "Rahisi kufika, rahisi kuzungumza — tembelea au tuma ujumbe kwanza.",
  },

  // ---- Footer ---------------------------------------------------------------
  "footer.explore": { en: "Explore", sw: "Vinjari" },
  "footer.services": { en: "Services", sw: "Huduma" },
  "footer.visitContact": { en: "Visit or Contact", sw: "Tembelea au Wasiliana" },
  "footer.tagline": {
    en: "Healthcare that's closer to you.",
    sw: "Huduma za afya karibu nawe.",
  },
  "footer.whatsappUs": { en: "WhatsApp us", sw: "Tuma ujumbe kwa WhatsApp" },
  "footer.link.home": { en: "Home", sw: "Nyumbani" },
  "footer.link.about": { en: "About Medivyx", sw: "Kuhusu Medivyx" },
  "footer.link.services": { en: "Services", sw: "Huduma" },
  "footer.link.pharmacy": { en: "Pharmacy", sw: "Duka la Dawa" },
  "footer.link.products": { en: "Products", sw: "Bidhaa" },
  "footer.link.health": { en: "Health Information", sw: "Taarifa za Afya" },
  "footer.link.request": { en: "Request Medicine", sw: "Omba Dawa" },
  "footer.link.book": { en: "Book a Consultation", sw: "Panga Ushauri" },
  "footer.link.track": { en: "Track a Request", sw: "Fuatilia Ombi" },
  "footer.link.contact": { en: "Contact & Location", sw: "Mawasiliano & Mahali" },

  // ---- Newsletter band --------------------------------------------------------
  "news.title": { en: "Stay well", sw: "Kuwa na afya njema" },
  "news.desc": {
    en: "Practical health tips and pharmacy updates — once a month, no noise.",
    sw: "Vidokezo vya afya na taarifa za duka — mara moja kwa mwezi, bila kelele.",
  },
  "news.subscribe": { en: "Subscribe", sw: "Jiunge" },
  "news.joining": { en: "Joining…", sw: "Inajiunga…" },
  "news.successTitle": { en: "You're subscribed.", sw: "Umejiunga." },
  "news.successMsg": {
    en: "You're on the list — health tips coming your way.",
    sw: "Umo kwenye orodha — vidokezo vya afya vitafika hivi karibuni.",
  },
  "news.invalid": {
    en: "Please enter a valid email address.",
    sw: "Tafadhali weka anwani sahihi ya barua pepe.",
  },
  "news.demoNote": {
    en: "Demo note — no emails are sent; the list lives in the demo store.",
    sw: "Kumbuka — hakuna barua pepe zinazotumwa; orodha ipo kwenye hifadhi ya mfano.",
  },

  // ---- Mobile bottom bar ------------------------------------------------------
  "mobile.home": { en: "Home", sw: "Nyumbani" },
  "mobile.services": { en: "Services", sw: "Huduma" },
  "mobile.products": { en: "Products", sw: "Bidhaa" },
  "mobile.call": { en: "Call", sw: "Piga" },

  // ---- Language toggle ---------------------------------------------------------
  "lang.aria": { en: "Switch language", sw: "Badilisha lugha" },
  "lang.fullEnglish": { en: "English", sw: "English" },
  "lang.fullSwahili": { en: "Kiswahili", sw: "Kiswahili" },

  // ---- Cookie / analytics consent ---------------------------------------------
  "consent.title": { en: "Anonymous demo analytics", sw: "Takwimu za mfano bila majina" },
  "consent.body": {
    en: "This demo site counts anonymous visits (no names, no tracking cookies). Allow it so the owner can see the site is working, or keep essential-only — everything works either way.",
    sw: "Tovuti hii ya mfano inahesabu matembezi yasiyo na majina (hakuna vidakuzi vya kufuatilia). Ruhusu ili mmiliki aone tovuti inafanya kazi, au endelea na muhimu tu — kila kitu kinafanya kazi kwa pande zote.",
  },
  "consent.essential": { en: "Essential only", sw: "Muhimu tu" },
  "consent.allow": { en: "Allow analytics", sw: "Ruhusu takwimu" },

  // ---- Page heroes (secondary pages) -------------------------------------------
  "page.products.eyebrow": { en: "Products", sw: "Bidhaa" },
  "page.products.title": { en: "The Medivyx catalogue", sw: "Orodha ya Medivyx" },
  "page.products.desc": {
    en: "Medicines, wellness, baby care, personal care and medical supplies — one practical range for everyday health.",
    sw: "Dawa, bidhaa za afya, malezi ya watoto, huduma za mwili na vifaa vya kimatibabu — orodha moja ya vitu vya kila siku.",
  },
  "page.services.eyebrow": { en: "Services", sw: "Huduma" },
  "page.services.title": { en: "Pharmacy services with a personal touch", sw: "Huduma za duka la dawa kwa ukarimu" },
  "page.services.desc": {
    en: "Everything you'd expect from a serious pharmacy — plus the convenience of requesting ahead and asking first.",
    sw: "Kila kitu unachotarajia kutoka duka la dawa la kitaalamu — pamoja na urahisi wa kuomba kwanza na kuuliza kwanza.",
  },
  "page.book.eyebrow": { en: "Book a Consultation", sw: "Panga Ushauri" },
  "page.book.title": { en: "Book time with a pharmacist", sw: "Panga muda na mfamasia" },
  "page.book.desc": {
    en: "Reserve a free consultation slot — medicine questions, prescription review or a blood pressure check. The team confirms every booking.",
    sw: "Weka nafasi ya ushauri bila malipo — maswali ya dawa, ukaguzi wa resheti, au kupima shinikizo la damu. Timu inathibitisha kila pangilio.",
  },
  "page.contact.eyebrow": { en: "Contact", sw: "Mawasiliano" },
  "page.contact.title": { en: "Talk to the Medivyx team", sw: "Zungumza na timu ya Medivyx" },
  "page.contact.desc": {
    en: "Call, WhatsApp, email or visit — whichever is easiest for you.",
    sw: "Piga simu, tuma ujumbe wa WhatsApp, barua pepe au tembelea — njia ambayo ni rahisi kwako.",
  },
  "page.articles.eyebrow": { en: "Health Information", sw: "Taarifa za Afya" },
  "page.articles.title": { en: "Health articles from your pharmacy", sw: "Makala za afya kutoka duka lako la dawa" },
  "page.articles.desc": {
    en: "Short, sensible reads on storing medicines safely, first aid, prescriptions and family health.",
    sw: "Soma mafupi ya busara juu ya kuhifadhi dawa salama, msaada wa kwanza, resheti na afya ya familia.",
  },
  "page.request.eyebrow": { en: "Request Medicine", sw: "Omba Dawa" },
  "page.request.title": { en: "Request your medicine ahead", sw: "Omba dawa yako mapema" },
  "page.request.desc": {
    en: "Tell us what you need, attach your prescription if you have one, and the pharmacy team will review your request and contact you.",
    sw: "Tuambie unachohitaji, ambatisha resheti yako ukiwa nayo, na timu ya duka la dawa itapitia ombi lako na kuwasiliana nawe.",
  },
  "page.track.eyebrow": { en: "Order tracking", sw: "Ufuatiliaji" },
  "page.track.title": { en: "Track your request or booking", sw: "Fuatilia ombi au pangilio lako" },
  "page.track.desc": {
    en: "Enter the reference code from your confirmation — MDX-XXXX for medicine requests, BKG-XXXX for consultation bookings.",
    sw: "Weka msimbo wa marejeleo kutoka uthibitisho wako — MDX-XXXX kwa maombi ya dawa, BKG-XXXX kwa mipangilio ya ushauri.",
  },
  "page.pharmacy.eyebrow": { en: "Pharmacy", sw: "Duka la Dawa" },
  "page.pharmacy.title": { en: "Prescriptions, handled properly", sw: "Resheti, zinashughulikiwa kwa usahihi" },
  "page.pharmacy.desc": {
    en: "Send your prescription ahead of time and the Medivyx team reviews it before you arrive — prepared medicine, no waiting.",
    sw: "Tuma resheti yako mapema na timu ya Medivyx itaipitia kabla hujafika — dawa tayari, bila kusubiri.",
  },

  // ---- Services section (shared home + /services) --------------------------------
  "services.section.eyebrow": { en: "Services", sw: "Huduma" },
  "services.section.title": { en: "Care for every day, not just emergencies", sw: "Huduma za kila siku, si dharura tu" },
  "services.section.desc": {
    en: "From prescriptions to everyday essentials — Medivyx brings pharmacy services and healthcare products together in one friendly place.",
    sw: "Kutoka resheti hadi mahitaji ya kila siku — Medivyx inakusanya huduma za duka la dawa na bidhaa za afya mahali pamoja, kwa ukarimu.",
  },

  // ---- Chatbot ------------------------------------------------------------------
  "chat.greeting": {
    en: "Hi, I’m the Medivyx assistant. Ask me about our services, products, prescriptions, opening hours or how to reach the team. For medical advice, our pharmacist is the right person to talk to.",
    sw: "Habari, mimi ni msaidizi wa Medivyx. Niulize kuhusu huduma zetu, bidhaa, resheti, saa za kufungua au jinsi ya kuwasiliana na timu. Kwa ushauri wa kimatibabu, mfamasia wetu ndiye mtu sahihi wa kuzungumza naye.",
  },

  // ---- WhatsApp prefilled messages -----------------------------------------------
  "whatsapp.general": {
    en: "Hi Medivyx, I have a question about your pharmacy services.",
    sw: "Habari Medivyx, nina swali kuhusu huduma zenu za duka la dawa.",
  },

  // ---- Print ---------------------------------------------------------------------
  "print.productNote": {
    en: "Availability is confirmed by the Medivyx team — message or call us before visiting.",
    sw: "Uwepo wa bidhaa unathibitishwa na timu ya Medivyx — tuma ujumbe au piga simu kabla ya kuja.",
  },
};

/** Translate a dictionary key for the active language (falls back to English). */
export function translate(lang: Lang, key: string): string {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  return lang === "sw" ? entry.sw : entry.en;
}
