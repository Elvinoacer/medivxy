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
  "nav.book": { en: "Book", sw: "Panga" },
  "nav.track": { en: "Track", sw: "Fuatilia" },
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
  "hero.offerRibbon": {
    en: "New customer? Code WELCOME10 takes 10% off your first order",
    sw: "Mteja mpya? Msimbo WELCOME10 unapunguza 10% ya ombi lako la kwanza",
  },
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
  "mobile.shop": { en: "Shop", sw: "Duka" },
  "mobile.cart": { en: "Basket", sw: "Kikapu" },
  "mobile.request": { en: "Request", sw: "Omba" },
  "mobile.book": { en: "Book", sw: "Panga" },
  "mobile.track": { en: "Track", sw: "Fuatilia" },
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
  "page.track.title": { en: "Track your order, request or booking", sw: "Fuatilia ombi, agizo au pangilio lako" },
  "page.track.desc": {
    en: "Enter the reference code from your confirmation — ORD-XXXX for shop orders, MDX-XXXX for medicine requests, BKG-XXXX for consultation bookings.",
    sw: "Weka msimbo wa marejeleo kutoka uthibitisho wako — ORD-XXXX kwa agizo la duka, MDX-XXXX kwa maombi ya dawa, BKG-XXXX kwa mipangilio ya ushauri.",
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

  // ---- Quick actions hub (home) ----------------------------------------------------
  "quick.eyebrow": { en: "Where do you want to start?", sw: "Unataka kuanzia wapi?" },
  "quick.title": { en: "What do you need today?", sw: "Unahitaji nini leo?" },
  "quick.desc": {
    en: "Every path is two taps away — buy from the shop, reserve a consultation, send a prescription or follow an order.",
    sw: "Kila njia iko hatua mbili tu — nunua dukani, panga ushauri, tuma resheti au fuatilia ombi.",
  },
  "quick.shop": { en: "Shop medicines", sw: "Nunua dawa" },
  "quick.shopSub": { en: "Buy essentials & pay securely", sw: "Nunua mahitaji & lipa salama" },
  "quick.book": { en: "Book a consultation", sw: "Panga ushauri" },
  "quick.bookSub": { en: "Free slots with the pharmacist", sw: "Nafasi bila malipo na mfamasia" },
  "quick.rx": { en: "Send a prescription", sw: "Tuma resheti" },
  "quick.rxSub": { en: "Reviewed before you arrive", sw: "Inapitiwa kabla hujafika" },
  "quick.track": { en: "Track an order", sw: "Fuatilia ombi" },
  "quick.trackSub": { en: "Live status, reference code", sw: "Hali ya papo hapo, msimbo wa marejeleo" },

  // ---- Shop / commerce -------------------------------------------------------------
  "shop.basket": { en: "Basket", sw: "Kikapu" },
  "shop.addToCart": { en: "Add to basket", sw: "Weka kikapuni" },
  "shop.added": { en: "Added to basket", sw: "Imeongezwa kikapuni" },
  "shop.viewBasket": { en: "View basket", sw: "Angalia kikapu" },
  "shop.checkout": { en: "Checkout", sw: "Malipo" },
  "shop.priceNote": { en: "Indicative price — confirmed by the team", sw: "Bei ya mwongozo — timu inathibitisha" },
  "shop.categories": { en: "Shop by category", sw: "Nunua kwa aina" },
  "shop.browseAll": { en: "Browse the full catalogue", sw: "Angalia orodha kamili" },

  // ---- Product reviews --------------------------------------------------------------
  "reviews.title": { en: "What customers say", sw: "Wateja wanasema" },
  "reviews.count": { en: "reviews", sw: "maoni" },
  "reviews.note": { en: "Reviews are from verified demo customers", sw: "Maoni yatoka kwa wateja wa demo" },
  "reviews.empty": { en: "No reviews yet — be the first to help other customers.", sw: "Hakuna maoni bado — kuwa wa kwanza kuwasaidia wengine." },
  "reviews.write": { en: "Write a review", sw: "Andika maoni" },
  "reviews.form": { en: "Write a review form", sw: "Fomu ya maoni" },
  "reviews.yourRating": { en: "Your rating", sw: "Kiwango chako" },
  "reviews.name": { en: "Your name", sw: "Jina lako" },
  "reviews.comment": { en: "Your review", sw: "Maoni yako" },
  "reviews.placeholder": { en: "How was the product and the service?", sw: "Ilikuwaje bidhaa na huduma?" },
  "reviews.submit": { en: "Submit review", sw: "Tuma maoni" },
  "reviews.submitting": { en: "Sending…", sw: "Inatuma…" },
  "reviews.cancel": { en: "Cancel", sw: "Ghairi" },
  "reviews.thanks": { en: "Asante! Your review is live.", sw: "Asante! Maoni yako yamechapishwa." },
  "reviews.posted": { en: "Your review is now shown above.", sw: "Maoni yako sasa yanaonyeshwa hapo juu." },
  "reviews.needRating": { en: "Please choose a star rating.", sw: "Tafadhali chagua nyota." },
  "reviews.needName": { en: "Please enter your name (first name is enough).", sw: "Tafadhali weka jina lako (jina la kwanza inatosha)." },
  "reviews.needComment": { en: "Please write a short comment.", sw: "Tafadhali andika maoni mafupi." },
  "reviews.error": { en: "Something went wrong — please try again.", sw: "Kuna hitilafu — tafadhali jaribu tena." },

  // ---- Offers / promo codes -----------------------------------------------------------
  "offers.eyebrow": { en: "Current offers", sw: "Ofa za sasa" },
  "offers.title": { en: "Codes that save you money at checkout", sw: "Msimbo unaokupa akiba kwenye malipo" },
  "offers.desc": {
    en: "Copy a code, fill your basket and paste it at checkout — the discount is applied instantly and confirmed by the team.",
    sw: "Nakili msimbo, jaza kikapu, ubandike kwenye malipo — punguzo linaanzia mara moja.",
  },
  "offers.badge": { en: "Offer", sw: "Ofa" },
  "offers.copy": { en: "Copy code", sw: "Nakili msimbo" },
  "offers.copiedBtn": { en: "Copied", sw: "Imenakiliwa" },
  "offers.copied": { en: "Copied — paste it at checkout", sw: "Imenakiliwa — bandika kwenye malipo" },
  "offers.copyFailed": { en: "Couldn't copy — type the code at checkout", sw: "Haikunakiliwa — andika msimbo kwenye malipo" },
  "offers.applyHint": { en: "Paste it in the promo field at checkout", sw: "Bandika kwenye sehemu ya ofa kwenye malipo" },
  "offers.footnote": {
    en: "One code per order. Codes are checked by the team when confirming your order — demo codes for now, real campaigns coming with the loyalty programme.",
    sw: "Msimbo mmoja kwa ombi. Timu inathibitisha msimbo — hizi ni ofa za demo kwa sasa.",
  },
  "offers.shopCta": { en: "Shop the catalogue", sw: "Angalia bidhaa" },

  // ---- MediPoints loyalty -------------------------------------------------------------
  "loyalty.eyebrow": { en: "Loyalty programme", sw: "Programu ya uaminifu" },
  "loyalty.title": { en: "MediPoints — every order earns", sw: "MediPoints — kila ombi linaleta" },
  "loyalty.desc": {
    en: "No sign-up, no card — your phone number is your account. Points appear the moment your first order is confirmed.",
    sw: "Hakuna usajili, hakuna kadi — nambari yako ya simu ni akaunti yako. Pointi zinaonekana mara ombi lako la kwanza linapothibitishwa.",
  },
  "loyalty.step1Title": { en: "Earn", sw: "Pata" },
  "loyalty.step1Desc": { en: "1 point per KES 100 spent — +50 bonus on your first order.", sw: "Pointi 1 kwa KES 100 — +50 kwa ombi la kwanza." },
  "loyalty.step2Title": { en: "Climb", sw: "Panda" },
  "loyalty.step2Desc": { en: "Lifetime points move you up the tiers and earn faster.", sw: "Pointi za maisha zikupandisha daraja — unaipata kasi zaidi." },
  "loyalty.step3Title": { en: "Redeem", sw: "Tumia" },
  "loyalty.step3Desc": { en: "100 points = KES 100 off, in blocks of 100 at checkout.", sw: "Pointi 100 = KES 100, kwa mikusanyo ya 100 kwenye malipo." },
  "loyalty.tierFriend": { en: "Friend", sw: "Rafiki" },
  "loyalty.tierSilver": { en: "Silver · 1.25×", sw: "Fedha · 1.25×" },
  "loyalty.tierGold": { en: "Gold · 1.5×", sw: "Dhahabu · 1.5×" },
  "loyalty.cta": { en: "Start earning today", sw: "Anza kupata leo" },
  "loyalty.footnote": { en: "Balances live with the pharmacy — nothing to lose if you change phones.", sw: "Salio liko duka — halipotei ukipata simu mpya." },

  // ---- MediPoints lookup (track page) -------------------------------------------------
  "points.cardTitle": { en: "Your MediPoints", sw: "MediPoints zako" },
  "points.cardDesc": {
    en: "Check your balance and tier — points live on your phone number, the same one you order with.",
    sw: "Angalia salio na daraja — pointi ziko kwenye nambari yako ya simu unayotumia kuagiza.",
  },
  "points.phoneLabel": { en: "Phone number", sw: "Nambari ya simu" },
  "points.phonePlaceholder": { en: "07XX XXX XXX", sw: "07XX XXX XXX" },
  "points.check": { en: "Check my points", sw: "Angalia pointi zangu" },
  "points.checking": { en: "Checking…", sw: "Inakagua…" },
  "points.balance": { en: "points to spend", sw: "pointi za kutumia" },
  "points.tier": { en: "Tier", sw: "Daraja" },
  "points.earnRate": { en: "Earn rate", sw: "Kasi ya kupata" },
  "points.toNext": {
    en: "pts to next tier",
    sw: "pointi hadi daraja linalofuata",
  },
  "points.topTier": { en: "Top tier — maximum earn rate", sw: "Daraja la juu — kasi kubwa kabisa" },
  "points.orders": { en: "orders earned points", sw: "maagizo yaliyotoa pointi" },
  "points.spendHint": {
    en: "Redeem in blocks of 100 at checkout (1 pt = KES 1).",
    sw: "Tumia kwa mikusanyo ya 100 kwenye malipo (pt 1 = KES 1).",
  },
  "points.noAccount": {
    en: "No MediPoints account on that number yet — place your first order and points appear automatically.",
    sw: "Hakuna akaunti ya MediPoints kwenye nambari hiyo — agiza kwa mara ya kwanza na pointi zinaonekana automatic.",
  },
  "points.invalidPhone": { en: "Please enter a valid Kenyan phone number.", sw: "Tafadhali weka nambari sahihi ya simu ya Kenya." },
  "points.error": { en: "Couldn't check points right now — please try again.", sw: "Haikuweza kukagua pointi — tafadhali jaribu tena." },
  "points.shopCta": { en: "Spend them at checkout", sw: "Zitumie kwenye malipo" },
  "points.privacy": {
    en: "Only your balance is shown — no order history or personal details.",
    sw: "Salio lako pekee linaonyeshwa — hakuna historia ya maagizo.",
  },

  // ---- Product Q&A --------------------------------------------------------------------
  "qa.title": { en: "Questions about this medicine", sw: "Maswali kuhusu dawa hii" },
  "qa.answered": { en: "answered", sw: "imejibiwa" },
  "qa.pending": { en: "awaiting the pharmacist", sw: "inasubiri daktari wa dawa" },
  "qa.pendingNote": {
    en: "The team usually answers within a few hours — your question appears here once answered.",
    sw: "Timu hujibu ndani ya masaa machache — swali lako litaonekana hapa likijibiwa.",
  },
  "qa.empty": {
    en: "No questions yet — ask the first one, the pharmacist answers personally.",
    sw: "Hakuna maswali bado — uliza wa kwanza, daktari wa dawa hujibu mwenyewe.",
  },
  "qa.cta": { en: "Ask a question", sw: "Uliza swali" },
  "qa.formTitle": { en: "Ask the pharmacist", sw: "Uliza daktari wa dawa" },
  "qa.nameLabel": { en: "Your name (optional)", sw: "Jina lako (si lazima)" },
  "qa.namePlaceholder": { en: "e.g. Amina W.", sw: "k.m. Amina W." },
  "qa.questionLabel": { en: "Your question", sw: "Swali lako" },
  "qa.questionPlaceholder": {
    en: "e.g. Is this safe to take with blood pressure medication?",
    sw: "k.m. Je, dawa hii ni salama na dawa za shinikizo la damu?",
  },
  "qa.needQuestion": { en: "Please write a question of at least 10 characters.", sw: "Tafadhali andika swali la angalau herufi 10." },
  "qa.error": { en: "Something went wrong — please try again.", sw: "Kuna hitilafu — tafadhali jaribu tena." },
  "qa.thanks": { en: "Question received", sw: "Swali limepokelewa" },
  "qa.thanksDesc": {
    en: "The pharmacist will answer shortly — check back here or on WhatsApp.",
    sw: "Daktari wa dawa atajibu hivi karibuni — rudi hapa au angalia WhatsApp.",
  },
  "qa.cancel": { en: "Cancel", sw: "Ghairi" },
  "qa.send": { en: "Send question", sw: "Tuma swali" },
  "qa.answeredBy": { en: "answered by", sw: "imejibiwa na" },
  "qa.askedBy": { en: "asked by", sw: "imeulizwa na" },

  // ---- Checkout ----------------------------------------------------------------------
  "checkout.title": { en: "Checkout", sw: "Malipo" },
  "checkout.step.cart": { en: "Basket", sw: "Kikapu" },
  "checkout.step.details": { en: "Your details", sw: "Maelezo yako" },
  "checkout.step.rx": { en: "Prescription", sw: "Resheti" },
  "checkout.step.pay": { en: "Payment", sw: "Malipo" },
  "checkout.step.done": { en: "Confirmation", sw: "Uthibitisho" },
  "checkout.continue": { en: "Continue", sw: "Endelea" },
  "checkout.back": { en: "Back", sw: "Rudi" },
  "checkout.placeOrder": { en: "Place order", sw: "Weka ombi" },
  "checkout.empty": { en: "Your basket is empty", sw: "Kikapu chako ni tupu" },
  "checkout.delivery": { en: "Delivery", sw: "Kuletewa" },
  "checkout.pickup": { en: "Pickup from the pharmacy", sw: "Kuchukua dukani" },
};

/** Translate a dictionary key for the active language (falls back to English). */
export function translate(lang: Lang, key: string): string {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  return lang === "sw" ? entry.sw : entry.en;
}
