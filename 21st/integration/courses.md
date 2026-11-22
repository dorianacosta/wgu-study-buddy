# Courses page (src/views/Courses.tsx)

Owner: the Courses page agent. Files touched: `src/views/Courses.tsx` only. No `src/components/ui` file was edited
(timeline.tsx and glyph-matrix.tsx are unchanged), and neither were `src/index.css` nor `src/components/kit.tsx`.

## What the page is built from

- Course list (`#courses`): glyph-matrix inside its demo frame as the header, with the page title over it; four stat
  Cards (shadcn dashboard-card layout, values in the stats demo's `text-4xl font-bold`, NumberTicker); one Card per
  course, grouped under "Current term" and "Term 3" headings. Each course Card has the code, the name, base-badge
  Badges (assessment type, CU, term, status), a Progress bar for practice progress, and Aceternity's GlowingEffect. The
  whole card is a link to the guide. C952's Card shows its mastered-questions Progress and Buttons to its tools
  (Open C952 → Home, Practice exam, plus "Study guide" if a guide ever exists).
- Guide (`#courses/<slug>`): ghost Button "All courses", then a header (code as kicker, name as h1, base-badge Badges,
  "Researched {updated} · dates"), then shadcn Tabs inside a sticky Card. Panels:
  - Overview: summary, assessment Card (type, format, details), "How to pass" Card, Competencies Card, caveats in an Alert.
  - Topics: Accordion (`type="multiple"`). Each item holds the like-you're-5 text in an Alert, then the detail and the points.
  - Key facts: Table (Fact / Value / Note; on phones the note sits under the value).
  - Study plan: Aceternity Timeline (`title: day`, `content: focus + tasks + a "Done" Checkbox with Label`), and
    "{n} of {N} done" in its description.
  - Practice: Progress plus "{n}/{N} got it", then one card per question built on question.tsx's QuestionFrame and
    QuestionMeta. Each card has a Q badge, an "I got it" Checkbox with Label, the question, lettered choices with
    base-badge circles, an outline "Reveal answer" Button, and the answer and why in Alerts inside BlurFade.
  - Pitfalls: Alerts (`variant="destructive"`, grey through the `--destructive` token).
  - Community ("What students say"): the coverage line, a consensus Card, then post Cards (title as an external link,
    Badges for subreddit and date, the takeaway).
  - Resources: Table (Resource link + host, Kind Badge with its lucide icon, Note), sorted by kind.
  - Sources: numbered list in a Card.
  - Below the tabs: a Separator and the "Researched … confirm requirements" note.
- Courses without a usable guide get serafimcloud's EmptyState. C952 gets "has its own study tools" with "Open C952",
  and every other course gets "Study guide in progress" with "All courses".
- Reveal → BlurFade everywhere (header, stats, cards, panels, revealed answers).

Kept intact: normalizeGuide, along with its coercion helpers and its "usable guide" check (the old section predicates
are kept as `HAS`/`SECTION_ORDER` for it); SafeRich for every researched HTML string (plain() for text inside links and
triggers); correctChoice/stripLetter; store progress (`courseDraft(d, slug).plan[i]`, `.practice[i]`); openCourse/go
routing; Back behavior (openCourse pushes); the h1 that App focuses; focus moving to the answer after a reveal and back
to "Reveal answer" after hiding it.

## Deviations (file — what changed — why)

No prompt code was changed. These are usage-level decisions in `src/views/Courses.tsx`, logged because they are judgment calls:

- src/views/Courses.tsx — every static Alert gets `role="note"` (eli5, caveats, pitfalls, answer, why) — alert.tsx
  hardcodes `role="alert"`, an assertive live region, so opening the Pitfalls tab would make screen readers announce
  ten alerts at once. Alert spreads its props after `role`, so the prop overrides it, and alert.tsx is untouched.
- src/views/Courses.tsx — every Progress gets `aria-hidden="true"`, and the visible text beside each bar carries the
  numbers ("3 of 15 got it", "0 of 60") — the collected progress.tsx destructures `value` and never passes it to
  `ProgressPrimitive.Root`, so the Radix progressbar has no aria-valuenow and reads as indeterminate (checked in the
  browser). See Needs.
- src/views/Courses.tsx — NumberTicker is wrapped in `aria-hidden` with an sr-only final value — the ticker starts
  empty and counts up, so screen readers could read nothing or an intermediate number.
- src/views/Courses.tsx — GlyphMatrix: `color` is the `--muted-foreground` token, read at runtime with
  getComputedStyle (a canvas can't read CSS variables). Its default `#6B7280` is Tailwind's bluish gray-500, and the
  demo's dark value `#ffffff` competed with the title on top. `interval={1e9}` under prefers-reduced-motion, so it
  draws once and never mutates — KEEP: reduced motion (MotionConfig doesn't reach the canvas loop). The other props
  are the old page's (`glyphs="01·:"`, `fadeBottom 0.9`, `interval 140`).
- src/views/Courses.tsx — GlyphMatrix composition: its demo frame (`relative w-full overflow-hidden rounded-lg border
  border-border bg-background`) sizes to the header content instead of the demo's fixed `h-[400px]`. The canvas is
  `absolute inset-0` and the title block sits over it — the old page drew this glyph field behind its header.
- src/views/Courses.tsx — GlowingEffect is on the course Cards only (the only old Panels with `glow`), with the old
  Panel's props (spread 34, proximity 64, inactiveZone 0.05, borderWidth 1.5, movementDuration 1.4), the default
  (monochrome) variant and `disabled={false}`.
- src/views/Courses.tsx — type has no scale of its own. The kicker, h1 and lead reuse hero-minimalism's `.kicker` /
  `.title` / `.subtitle` values as Tailwind classes (12px uppercase 0.14em muted; 600 clamp(32px, 8vw, 88px) / 0.95;
  clamp(14px, 2.2vw, 18px) muted). Section h2s use CardTitle's classes, and titles inside cards are CardTitle at
  bento-grid's `text-xl`. The family is the app's Geist, not the prompt's network-loaded Hubot Sans.
- src/views/Courses.tsx — the active tab is not mirrored in the hash. It lives in the history entry's state
  (`history.replaceState({...state, courseTab: {slug, tab}}, "", location.href)`), and Back, Forward and reload restore
  it (all checked in the browser). Why not the hash: App's routeFromHash takes everything after `courses/` as the
  slug, so `#courses/c949/topics` falls back to the course list on reload, Back and Forward. See Needs.
- src/views/Courses.tsx — the tab bar is a sticky Card (`sticky top-3 sm:top-20 z-30`, `[@media(max-height:560px)]:static`).
  At sm+ it sits under App's floating nav pill (measured bottom 70px), and on phones the pill is at the bottom, so the
  bar sits near the top. While a guide is open, html's scroll-padding-top is set inline to the bar's top edge and
  restored on leave, and TabsContent and its descendants get `scroll-mt-16`. So focusing a tab never scrolls the page
  (with padding past the bar, Chrome's focus scroll jumped the page on every tab click), and keyboard-focused panel
  content lands below the bar (checked: a link focused under the bar moved to y=144, below the bar's bottom at 134).
  Switching tabs while the bar is stuck scrolls the new panel's start back under the bar. Clicks, arrow keys and
  phones were all checked.
- src/views/Courses.tsx — the Timeline is wrapped in BlurFade — its transform/filter makes a stacking context, so the
  timeline's `z-40` sticky day titles stay under the `z-30` tab bar (checked by scrolling the plan under the bar).
- src/views/Courses.tsx — EmptyState takes one action. C952's guide page therefore puts the old second action
  ("Practice exam") as a ghost Button under it.
- src/views/Courses.tsx — the course Card is a real link (`<a href="#courses/<slug>">`). A plain left click goes
  through openCourse (pushState and h1 focus, as before), and a modified click keeps the browser default (new tab).
- src/views/Courses.tsx — the Accordion trigger shows topic titles as plain text (`plain()`), because a button can't
  hold links. None of the current guides has markup in topic titles.
- src/views/Courses.tsx — practice choices are a static list with base-badge letter circles (outline, primary for the
  revealed answer, plus a Check icon and sr-only "(correct answer)"). They don't use question.tsx's
  OptionButton/QuestionText: OptionButton is an interactive button, and QuestionText renders through Rich (not
  sanitized), which researched HTML must never go through.
- src/views/Courses.tsx — QuestionFrame's required `accent` gets `var(--primary)` / `var(--border)` (theme tokens).
  The restyled QuestionFrame ignores it.
- src/views/Courses.tsx — removed the old scroll-spy jump bar, useMediaQuery, the phone-only Disclosure and the dynamic
  `bar bottom + 12px` scroll padding; Tabs and the scroll handling above replace them. The only kit import left is
  SafeRich (no Badge, Callout, Disclosure, EmptyState, Eyebrow, PAGE_TITLE, Panel, Reveal, SectionTitle or StickyBar).
- Timeline colors: nothing more to do. The foundation already switched the beam to `from-primary via-muted-foreground`
  and the track to `bg-linear-to-b` (INTEGRATION.md). The rest of the component is neutral greys. Checked in the
  browser: grey track, white-to-grey beam, neutral-950 panel.

Purge check: the INTEGRATION.md grep finds only the word "panel" in two code comments. The file has no hex, rgb(a),
white/black alpha or hue-named color classes, and no shadow, gradient, blur or animate utilities of its own.

## Needs (changes in files this agent doesn't own)

- src/App.tsx — only if tab URLs are wanted. In routeFromHash, take the slug as the segment after `courses/` up to
  the next `/`, for example `const slug = h.slice("courses/".length).split("/")[0]`. Courses could then mirror the
  tab as `#courses/<slug>/<tab>` with replaceState. Today it keeps the tab in history.state, which needs nothing from App.
- src/components/ui/progress.tsx — pass `value` through to `ProgressPrimitive.Root` (today it is destructured for the
  indicator's transform only), so the progressbar exposes aria-valuenow. This is a functional/a11y fix. Courses could
  then drop `aria-hidden` on its bars.
- kit.tsx cleanup: Courses uses only `SafeRich` from kit.

## Checks

- `npx tsc -p tsconfig.app.json --noEmit`: 0 errors in Courses.tsx (also clean with --noUnusedLocals
  --noUnusedParameters). The remaining errors are kit.tsx(143) strokeWidth and kit.tsx(533) showCloseButton, which
  belong to the cleanup step.
- Browser (own tab, 1280×900, plus a 375×812 pass): `#courses`, `#courses/c952` (empty state) and all 9 guides × 9
  tabs render with no console errors. Checked: card link → guide (title and h1 focus), "All courses" pushes and Back
  returns to the same tab, Forward restores the tab, plan "Done" and practice "I got it" save to the store (then
  unticked), Reveal and Hide answer move focus, the accordion opens, the sticky bar realigns on click and on arrow
  keys, the tab list centers the active tab on phones, and there's no horizontal page scroll at 375px.
