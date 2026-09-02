# Medivyx UI & Interaction Guidelines

The design rules this site follows — written down so every future change
keeps the same bar. When a review decision is needed, this file is the
tiebreaker. It is deliberately short and concrete; anything not covered
here follows the existing code as precedent.

---

## 1. Colour & theming

- **Only design tokens.** Every surface, text, border and shadow uses the
  CSS variables defined in `app/globals.css` (`background`, `foreground`,
  `card`, `primary`, `muted`, `honey`, `mint`, …). Never write
  `bg-white`, `text-black`, `text-slate-500` or raw hex values inline —
  dark mode silently breaks (this repo had 45 such breaks before the
  token sweep).
- **Both themes are first-class.** Any new component must be eyeballed in
  light AND dark mode. Inverted bands (`bg-foreground text-background`)
  intentionally flip in dark mode — put `bg-background` surfaces inside
  them so contrast tracks automatically.
- **Two brand exceptions may be hardcoded:** WhatsApp green
  (`#1faa53` / hover `#199047`, use the shared `.wa-cta` class) and the
  focus outline green in `globals.css`. Everything else is a token.
- **Semantic colours only for meaning:** `destructive` for errors,
  `honey`/`honey-soft` for warnings ("time passed"), `mint` for success.
  Never use colour alone — always pair with an icon or text label.

## 2. Layout & spacing

- Section rhythm: `py-12` mobile / `sm:py-16` for page bodies; page heroes
  above them. One `border-t`/`border-y` between bands, never doubled.
- Max content widths: `max-w-6xl` (page shell), `max-w-3xl` (form
  headings), `max-w-2xl` (single-column forms), `max-w-xl` (success
  cards), `max-w-md` (auth / narrow dialogs).
- Cards: `rounded-2xl` for panels inside a section, `rounded-3xl` for the
  big page-level form/success cards, `rounded-xl` for rows inside cards,
  `rounded-full` for pills and all buttons. Do not invent a fourth radius.
- Density beats decoration: prefer `gap-2`/`gap-3` between interactive
  chips, `space-y-3` between queue rows, generous `p-6 sm:p-8` card
  padding. No purely decorative element may push content below the fold.

## 3. Type

- Display font (Fraunces) for headings only; body is Manrope. Never use
  `font-display` below 16 px text.
- Heading scale: hero `text-3xl sm:text-4xl+`, page/section heading
  `text-lg`–`text-2xl`, card titles `font-semibold` body size.
- Muted copy uses `text-muted-foreground` — not a smaller font size.
  Minimum body size is 14 px (`text-sm`); captions 12 px (`text-xs`).
- Numbers that change (counters, "N left") get `tabular-nums`.

## 4. Interactive elements

- **Touch targets ≥ 44 px** (`min-h-11`); mobile nav bar rows ≥ 56 px
  (`min-h-[56px]`).
- Buttons carry an icon AND a text label; icon-only buttons must have
  `aria-label` + `title`.
- Focus is never removed: the global `:focus-visible` outline (2px green,
  offset 2) stays. Do not add `outline-none` without replacing it.
- Every interactive element has visible hover state on pointer devices
  and `active:scale-[0.97]` press feedback on primary actions.
- Disabled states keep ≥ 40% opacity and still show the cursor context.

## 5. Forms (the rules that matter most)

1. **Never lose user input.** Long forms persist drafts to localStorage
   (`medivxy:*-draft`) and clear them only on success. The medicine
   request wizard does this; new multi-step flows must too.
2. **Validate in three places, in one voice:** inline on `onBlur` per
   field, on submit for the whole step, and server-side — with the server
   returning `fields: { name: message }` that the client maps onto the
   exact same error slots. Error text is a human sentence, never a code.
3. **Errors are announced:** each error message has `role="alert"`, is
   linked to its input via `aria-describedby` (`id="field-error"`), and
   the input gets `aria-invalid`.
4. **Buttons show progress:** spinner + "Sending…" label, disabled while
   in flight. On completion: toast (`sonner`) + a state change (success
   card or inline confirmation). Rate-limit errors say "try again in Xs".
5. **Limits are visible before they bite:** `maxLength` plus a subtle
   "N left" counter that appears as the field nears its cap.
6. **Spam defence:** hidden honeypot `website` field on every public form
   (`tabIndex={-1}` + `aria-hidden`), plus the server rate limiter.
7. **One primary action per view.** Secondary actions are `outline` or
   `ghost`; destructive/error text is `destructive`.

## 6. Feedback & state choreography

- **Toasts** (top-centre, `richColors`) for transient outcomes: submission
  success, network failure, admin status changes, copy-to-clipboard.
  Inline errors remain for field validation; toasts never replace them,
  they echo them.
- **Loading:** skeletons that match the final layout's shape (the booking
  day strip skeleton renders 14 chips because 14 real chips follow).
  Shimmer uses `.skeleton-shimmer`.
- **Empty states** always explain AND offer the next step (e.g. "No
  requests yet — submit one from Request Medicine"), never a bare void.
- **Polling/live data:** auto-refresh cadence 30 s, paused while the tab
  is hidden; a "Live · updated Xs ago" chip + manual refresh; network
  failure during a background poll keeps the last good data and toasts
  instead of blanking the card.
- **Destructive/irreversible-feeling actions need an undo** (admin status
  changes have Undo buttons) rather than a confirm dialog.

## 7. Navigation & wayfinding

- Core actions are reachable everywhere: header nav (lg+ core set, xl full
  set), mobile bottom bar (Home · Request · Book · Track · Call), sheet
  menu (everything + WhatsApp + Call), footer (everything + Staff).
- No route may be orphaned — every page is linked from at least one
  navigation surface.
- `aria-current`/active styling on the current nav item; breadcrumbs on
  deep pages; the skip-link stays first in tab order.
- Deep links into flows (`/track?ref=…`) auto-run the flow instead of
  making the user re-type.

## 8. Motion

- Reveal-on-scroll (`.reveal`) max 0.7 s; reduced-motion users get no
  animation at all (`prefers-reduced-motion` kill-switch in globals.css).
- Streams and pulses (chatbot typing, live dot, shimmer) are subtle,
  ≤1.8 s cycles, and disabled under reduced motion.

## 9. Accessibility floor

- Semantic landmarks (`header`/`nav`/`main`/`footer`), one `h1` per page,
  lists for lists.
- All imagery has alt text; decorative icons carry `aria-hidden="true"`.
- Bilingual toggle switches `lang` on the root; chrome strings come from
  `lib/i18n.ts` — add the key to BOTH languages.
- Colour contrast ≥ 4.5:1 for body text in both themes (token palette is
  tuned for this; avoid introducing mid-tone pairs).

## 10. Data-flow rules (forms ↔ API ↔ store)

- One shared validator per concept (`lib/validation.ts` for phones and
  lengths) — client and server import the same constants so rules can
  never drift.
- Writes are atomic (temp file + rename), and a failed write is a failed
  request: the API returns an error and the UI tells the user instead of
  pretending success.
- Rate limits answer with `Retry-After` headers and friendly retry copy.
- Public reads are privacy-safe projections (no names/phones/notes) —
  full records live only behind the staff gate.
- Reference codes are the customer's receipt: shown, printable,
  WhatsApp-forwardable, deep-linkable into /track.
