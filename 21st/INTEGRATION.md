# 21st.dev integration log

The app's look comes only from 21st.dev components brought in through each component page's **Copy prompt** menu
(Claude Code format). The prompts are saved verbatim in `21st/prompts/` (checksum, author, license and capture notes in
`21st/manifest/`) and split into files in `21st/staged/<author>--<name>/` (index: `21st/staged/summary.json`). The app's
copies live in `src/components/ui/` under the prompts' file names.

This is the one log for the whole job: the foundation step, the four page steps, the cleanup step and the fix step
that answered an independent check (section 9). The page agents' own notes are still in `21st/integration/`
(`shell.md`, `courses.md`, `learn.md`, `exam.md`). This file merges them and wins where they differ: several of their
"needs" were applied in the cleanup step (section 5). Every change to a prompt's code is logged as
**file — what changed — why**.

1. Components in the app
2. Deviations from the prompts' code
3. App-wide usage decisions
4. Page notes: shell and Home · Courses · Learn and Cheat Sheet · Practice Exam, question cards and My Misses
5. Cleanup step
6. Open items
7. Component API notes
8. Purge reference: the old design removed in the foundation step
9. Fix step: the independent check's findings
10. ASCII design language (2026-11-20): the WGU Study Buddy redesign, which supersedes sections 1-9 where they differ
11. Course-aware build (v3, 2026-11-20): the six builders' component changes, which supersede sections 1-10 where they differ
12. Degree plan and study features (v4, 2026-11-21): no component change, only call sites, which supersede 1-11 where they differ

---

## 1. Components in the app

`src/components/ui/` holds 35 files. 20 are byte-identical to their staged prompt files: accordion, alert,
animated-circular-progress-bar, button, card, checkbox, collapsible, dot-pattern, dot-text, glyph-matrix, input, kbd,
label, number-ticker, radio-group, select, separator, switch, table and tabs. The other 15 differ, and section 2 lists
every difference.

| File | Component (21st.dev author) | Used by |
| --- | --- | --- |
| `accordion.tsx` | Accordion (shadcn) | Courses, Results, Misses |
| `alert.tsx` | Alert (shadcn) | Home, Courses, Learn, Cheat, Setup, Results, question.tsx |
| `alert-dialog.tsx` | Alert Dialog (shadcn) | App, Runner, Misses |
| `button.tsx` | Button (shadcn) | App and most views; alert-dialog, empty-state and bento-grid import it |
| `card.tsx` | Card (shadcn) | Home, Courses, Learn, Cheat, Setup, Runner, Results |
| `checkbox.tsx` | Checkbox (shadcn) | Home, Courses, question.tsx |
| `collapsible.tsx` | Collapsible (shadcn) | Results |
| `input.tsx` | Input (shadcn; the file bundled with the Kbd, Card, Tabs and Dialog prompts) | Cheat |
| `kbd.tsx` | Kbd (shadcn) | Cheat, Runner |
| `label.tsx` | Label (shadcn) | Home, Courses, Setup, Runner, question.tsx |
| `progress.tsx` | Progress (shadcn) | Home, Courses, Learn, Runner, Results |
| `radio-group.tsx` | Radio Group (shadcn) | Setup |
| `select.tsx` | Select (shadcn) | Setup |
| `separator.tsx` | Separator (shadcn) | Courses, Learn, Results, Misses, question.tsx |
| `switch.tsx` | Switch (shadcn) | Setup, Runner |
| `table.tsx` | Table (shadcn) | Courses, Cheat, Setup, Results |
| `tabs.tsx` | Tabs (shadcn) | Courses, Results |
| `base-badge.tsx` | Base Badge (sean0205, ReUI). Stands in for shadcn Badge, whose 21st.dev page is a 404 | every view, question.tsx |
| `animated-circular-progress-bar.tsx` | Animated Circular Progress Bar (Magic UI, dillionverma) | Home, Results |
| `bento-grid.tsx` | Bento Grid (Magic UI) | Home |
| `blur-fade.tsx` | Blur Fade (Magic UI) | every view, question.tsx |
| `border-beam.tsx` | Border Beam (Magic UI) | App (replace-exam dialog), Results |
| `dot-pattern.tsx` | Dot Pattern (Magic UI) | App (page background) |
| `number-ticker.tsx` | Number Ticker (Magic UI) | Courses, Results |
| `glyph-matrix.tsx` | Glyph Matrix (dillionverma) | Courses |
| `glowing-effect.tsx` | Glowing Effect (Aceternity, manuarora700) | Home, Courses, Learn, Setup |
| `timeline.tsx` | Timeline (Aceternity) | Courses (study plan) |
| `hero-minimalism.tsx` | Hero Minimalism (lyanchouss) | Home |
| `stats.tsx` | Stats, stats-info variant (meschacirung) | Home |
| `empty-state.tsx` | Empty State (serafimcloud) | Courses, Cheat, Runner, Results, Misses |
| `question-tool.tsx` | Question Tool, multiple-choice variant (serafimcloud) | question.tsx (its class strings and IconQuestion) |
| `wordmark-footer.tsx` | Footer with Big Wordmark (vilqor) | App |
| `tubelight-navbar.tsx` | Tubelight Navbar (ayushmxxn) | App |
| `liquid-metal-button.tsx` | Liquid Metal Button (johuniq) | Home, Setup |
| `dot-text.tsx` | Dot Text (jahed) | Home |

Collected but not in the app: shadcn Dialog, Slider and Tooltip. Their prompts stay in `21st/prompts/`, but the cleanup
step deleted their ui files because nothing imported them. shadcn Badge was never collected (404 page; see its manifest).

Content helpers that are not design: `src/components/kit.tsx` keeps only `Rich` and `SafeRich` (they render the study
content's HTML; `SafeRich` sanitizes researched text first). `src/components/question.tsx` builds the question cards from
question-tool's class strings (section 4).

---

## 2. Deviations from the prompts' code

Step tags: **[foundation]**, **[shell]** (App and Home page step), **[exam]** (exam page step), **[cleanup]**,
**[fix]** (fixes for the independent check, section 9).

### src/components/ui

**alert-dialog.tsx**
- [foundation] removed `data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]` — framework compatibility. Tailwind 4's `translate-x/y-[-50%]` use the separate `translate` property, so tw-animate-css's transform-based slide stacked on top of the centering. At a 694px viewport the dialog started at left -152px (off screen) instead of next to its final 91px. It keeps the prompt's fade and zoom, the same animation the prompt's dialog.tsx uses.

**base-badge.tsx**
- [foundation] in the `light` and `outline` appearances (5 variants each, 10 class strings), `dark:text-[var(--color-*-soft,…)]` became `dark:text-[var(--color-*-accent,…)]`. index.css defines the `-soft` hooks, and in dark mode those classes painted the text and the background with the same `-soft` color, so the label disappeared. The blue, green, yellow, violet and red values still in base-badge are only `var()` fallbacks; they never apply because every hook is defined.

**bento-grid.tsx**
- [foundation] `import { ReactNode }` became `import type { ReactNode }` — TypeScript fix: verbatimModuleSyntax (TS1484).
- [shell] added an optional `onClick` on BentoCard's call-to-action `<a>`, plus the `MouseEventHandler` type import — routing. The call to action has to open that topic in Learn, which `openTopic` does by setting the topic and calling `replaceState`. A plain `#learn` href can't carry the topic.
- [shell] added `group-focus-within:` variants that mirror `group-hover:` on the content block (`-translate-y-10`) and on the call-to-action row (`translate-y-0 opacity-100`) — focus management (KEEP). The call to action is `opacity-0` until hover, so keyboard users tabbed onto an invisible link. The mouse look is unchanged.
- [fix] added `[@media(hover:none)]:` variants that mirror `group-hover:` on the same two elements (content block `-translate-y-10`; call-to-action row `translate-y-0 opacity-100`) — touch. Tailwind 4 wraps `group-hover:` in `@media (hover: hover)`, so on phones and tablets the call to action stayed at opacity 0 for good. On devices that can't hover, the hover layout is now the resting layout. With a mouse nothing changes (checked at 1280×900: hidden at rest, shown on hover).
- [fix] the card root passes a click anywhere outside its link on to the call-to-action link, and gets `cursor-pointer` — touch. The card itself was not a link, so a tap in the middle of a card did nothing (only a ~12px strip where the hidden link reached into the card worked), while Home says "Tap a topic to study it". Added: `useRef` on the `<a>`, and an `onClick` on the root that dispatches a `click` with the same modifier keys on that link, unless the click was on the link itself or on another control inside the card. The link stays the card's only focusable element, so keyboard and screen-reader use is unchanged; the link's own `onClick` and the browser handle the forwarded click as a click on the link. The arrow-function body became a block body for the hook, and `useRef` / `MouseEvent as ReactMouseEvent` are imported.
- [fix] the call-to-action link gets `<span className="sr-only"> {name}</span>` after the `cta` text — labels (KEEP). Home's eight links were all named "Learn"; they are now "Learn Numbers & Binary" and so on. The visible text is unchanged; an sr-only span inside a Button is the Collapsible demo's own idiom (`<span className="sr-only">Toggle</span>`).

**blur-fade.tsx**
- [foundation] `UseInViewOptions, Variants` became `type UseInViewOptions, type Variants` — TypeScript fix: verbatimModuleSyntax.

**border-beam.tsx**
- [foundation] default `colorFrom` #ffaa40 (orange) became #f5f5f7, and `colorTo` #9c40ff (purple) became #6e6e73 — color switched to monochrome.

**empty-state.tsx**
- [foundation] `import { LucideIcon }` became `import type { LucideIcon }` — TypeScript fix: verbatimModuleSyntax.

**glowing-effect.tsx**
- [foundation] the default variant's gradient colors #dd7bbb (pink), #d79f1e (gold), #5a922c (green) and #4c7894 (blue) became #f5f5f7, #a1a1a6, #6e6e73 and #d1d1d6, with the same stops and the same 8-digit transparent stops — color switched to monochrome.

**hero-minimalism.tsx**
- [shell] added optional props `brand`, `cta`, `kicker`, `title`, `subtitle`, `tag`, `heading`, `desc` and `credit`, and exported `HeroLink` and `MinimalHeroProps` — props for content. All copy was hardcoded Dali Agents text. Each prop defaults to the prompt's own copy, and `credit={null}` hides the credit link.
- [shell] the `cta` slot replaces the header button when a value is passed; by default it still shows the prompt's `alert()` button — props for content: Home puts the LiquidMetalButton there.
- [shell] the brand and credit links take an optional `onClick`, and get `target="_blank"` and `rel` only when the href is `http(s)` — routing. In-app `#hash` links must stay in the tab and use the app's `replaceState` navigation. The defaults are external, so they behave as before.
- [shell] added an optional `style` prop on the root `<section>` — layout. The component's unlayered `<style>` makes the root a fixed 100vw × 100vh overlay that only an inline style can override. Home passes `position: relative; inset: auto; width: 100%; height: clamp(640px, 88svh, 760px)`.
- [shell] the inner `<main className="hero">` became `<div className="hero">` — landmarks (labels, KEEP). The app already has `<main id="app">`, so this made a second, nested main landmark. The CSS targets `.hero`, so the look did not change.
- [shell] with `prefers-reduced-motion: reduce` the particle canvas draws one frame (and redraws once on resize) instead of looping — reduced motion (KEEP). MotionConfig and the CSS kill-switch don't reach a canvas `requestAnimationFrame` loop.
- [fix] added an optional `action?: React.ReactNode` prop, rendered in the credit link's place in the bottom section (`{action ?? (credit && <a …>)}`) — props for content. The credit's style (`.content .credit`: 10px, rgba(161,161,170,0.6), 3.43:1 on #0a0a0a, a 79×15px target) is made for a credit line, and Home had put a working link there ("Practice exam"). Home now passes a shadcn Button in this slot (section 4). Without the prop the component renders the credit as before.

**input.tsx**
- [cleanup] added: a byte-identical copy of `21st/staged/shadcn--kbd/deps/input.tsx`, the shadcn Input bundled with the collected Kbd, Card, Tabs and Dialog prompts (identical in all four, sha256 f4dcacaf…). Cheat's filter field needs an input and no standalone Input prompt was collected. It replaces the verbatim local copy the Learn/Cheat page step had to keep inside `Cheat.tsx`, because that step could not add ui files.

**liquid-metal-button.tsx**
- [foundation] shader uniforms `u_shiftRed` and `u_shiftBlue` went from 0.3 to 0 — color switched to monochrome. They split the red and blue channels into orange and blue fringes (opaque pixels such as rgb(230,159,85) were measured on the ring).
- [foundation] `shaderMount.current.destroy()` became `.dispose()` at both call sites — framework compatibility. ShaderMount in @paper-design/shaders 0.0.82 has `dispose()` and no `destroy()`, so cleanup never ran: React StrictMode left two stacked canvases, and every unmount leaked a WebGL context and its render loop.
- [foundation] removed `outline: "none"` from the button's inline style — focus management (KEEP). The inline style overrode the global `:focus-visible` outline, so keyboard focus was invisible. Mouse clicks still show no outline because the rule is `:focus-visible`.
- [fix] the label's `color: "#666666"` became `"var(--foreground)"`, and the icon view's Sparkles `#666666` the same — color spec ("white text") and contrast. Mid-grey #666666 on the #202020 → #000000 inner pill measured 3.45:1 ("Continue learning", Home) and 3.32:1 ("Start exam", Setup), under the 4.5:1 minimum for 14px text. #f5f5f7 is about 15:1 on #202020, and more on the darker part of the pill. The text shadow is kept. This closes the "CTA label contrast" open item.
- [fix] ShaderMount now gets `liquidMetalMonochromeShader` instead of `liquidMetalFragmentShader`: the same shader string with `vec3 color1 = vec3(.98, 0.98, 1.);` replaced by `vec3 color1 = vec3(.98);` and `vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, diagTLtoBR));` by `vec3 color2 = vec3(.1);` — color switched to monochrome. These colors are built into @paper-design/shaders 0.0.82 (the shader's `u_colorTint` is a color-burn tint and can't take blue out), and they gave the ring a blue tint that the foundation step's `u_shiftRed`/`u_shiftBlue` fix didn't remove. Measured on the shader canvas with `gl.readPixels` right after a render: before, up to 26/255 chroma, darkest pixel rgb(25,25,34) and about 35% of ring pixels above 12/255; after, chroma 0 on every opaque pixel (rgb(25,25,25) to rgb(250,250,250)), on Home and on Setup. If a shaders update renames those lines, the replace does nothing and the stock shader runs. The production build folds the replace at build time (the bundled shader has the grey lines).

**progress.tsx**
- [cleanup] `ProgressPrimitive.Root` now receives `value={value}` — functional and a11y bug in the prompt's code (reported as a need by every page step). The component destructured `value` only for the indicator's transform and never passed it to the Radix root, so every bar had no `aria-valuenow`/`aria-valuetext` and `data-state="indeterminate"`. Checked in the browser: bars now report `aria-valuenow`, `aria-valuetext` ("0%") and `data-state="loading"`. Radix logs an error for a value outside 0–max; every caller passes a number in range (percent helpers return 0 for an empty total, exam totals are never 0). The pages' own `aria-valuenow`/`aria-valuetext` props still apply (they are spread after Radix's) and match.

**question-tool.tsx**
- [foundation] the selected option badge `bg-blue-500 text-white border-blue-500 dark:bg-blue-400 …` became `bg-primary text-primary-foreground border-primary`. The submit button's blue-500/400/600/300 became `bg-primary text-primary-foreground hover:bg-primary/90`, with `disabled:hover:bg-primary` — color switched to monochrome (theme tokens).
- [exam] `function IconQuestion` became `export function IconQuestion` (body unchanged) — question.tsx's header row reuses the component's own icon instead of a lookalike or a copied SVG.

**stats.tsx**
- [foundation] added optional `stats?: Stat[]` and `label?: string` props, defaulting to the prompt's three figures and "Key product stats", and exported `Stat` — props for content: the figures were a hardcoded const.
- [shell] the Card gets an inline `gridTemplateColumns: repeat(stats.length, minmax(0, 1fr))` — props for content. Home shows four figures, and `grid-cols-3` pushed the fourth onto a second row. With three figures it equals `grid-cols-3`.

**timeline.tsx**
- [foundation] the moving beam `from-purple-500 via-blue-500` became `from-primary via-muted-foreground` — color switched to monochrome (theme tokens).
- [foundation] the track's `bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))]` became `bg-linear-to-b` — Tailwind 3-only syntax. In Tailwind 4, `--tw-gradient-stops` starts with `var(--tw-gradient-position)`, which has no value unless a `bg-linear-*` utility sets it, so the gradient computed to `none` and the grey track line disappeared.
- [foundation] added optional `title` and `description` props (default: the prompt's "Changelog from my journey" copy) and exported `TimelineEntry` — props for content.

**tubelight-navbar.tsx**
- [foundation] removed `import Link from "next/link"` and turned `<Link href onClick>` into `<a href onClick>` — framework compatibility: this Vite app has no Next.js.
- [foundation] `import { LucideIcon }` became `import type { LucideIcon }` — TypeScript fix: verbatimModuleSyntax.
- [foundation] `interface NavItem` is exported — App types its nav items with it.
- [foundation] added optional `activeTab?: string` (overrides the internal state when set) and `onNavigate?: (item, event) => void` (runs in the link's onClick after `setActiveTab`) — routing. The highlight has to follow the hash route on deep links and Back/Forward, and App's nav needs a hook where it can call `preventDefault`. Without the props the component behaves like the prompt.
- [foundation] added `aria-current="page"` on the active link and `aria-label={item.name}` on every link — labels (KEEP). Below md the visible name is `display: none`, so the link had no accessible name.
- [shell] link padding `px-6` became `px-3 sm:px-6` — layout. With the app's six items the icon-only pill was 466px wide on a 375px phone (it spanned -45 to 421px, so Home and My Misses were off screen). It is now 322px. Nothing changes at 640px and up.

**wordmark-footer.tsx**
- [foundation] the status dot `bg-emerald-500 dark:bg-emerald-400` became `bg-primary` — color switched to monochrome. The prop's doc comment still says "green dot".

**Deleted**
- [cleanup] `dialog.tsx`, `slider.tsx` and `tooltip.tsx` — dead code. Slider was never imported. Dialog was imported only by kit.tsx's old ConfirmDialog (removed; App's confirm is an AlertDialog). Tooltip was imported only for App's `TooltipProvider`, and no Tooltip is rendered anywhere, so the provider was removed too.

### src/index.css [foundation]

- Rewritten to hold only: the `tailwindcss` and `tw-animate-css` imports, the Geist and Geist Mono `@font-face` rules and `@custom-variant dark`; the standard shadcn tokens in `:root`, mapped in `@theme inline`; the base-badge hooks; the prompt-required keyframes; the base rules; and minimal `.rich` and `pre.code` styles in theme tokens. Values follow the user's spec: background #000000, card and popover #0f1012, primary #f5f5f7 on #0a0a0b, dark-grey secondary, muted and accent, muted-foreground #a1a1a6, subtle grey border and input, ring #d1d1d6, destructive #d1d1d6 (grey, not red) and charts on a #f5f5f7-to-#48484a ramp.
- base-badge hooks set to monochrome: primary accent #f5f5f7 on soft #222327; success accent #f5f5f7 on soft #222327 with foreground #0a0a0b; info #c7c7cc, warning #a1a1a6 and destructive #8e8e93 accents on soft #1c1d21, with #0a0a0b foregrounds. They form a white-to-grey ramp, so the variants stay distinguishable.
- `@source not "../21st";` — added. Tailwind 4 scans the whole project, so the saved prompts and demos under `21st/` were compiled into the app CSS (bg-sky-500, from-purple-500, bg-emerald-500 and others). A fresh build scans 0 files in `21st/`.
- Accordion setup step (extend tailwind.config with accordion-down/up keyframes) — not duplicated: tw-animate-css 1.4.0 already defines `--animate-accordion-down/up` (0.2s, ease-out) and the keyframes.
- Border-beam keyframes — added `--animate-border-beam: border-beam calc(var(--duration) * 1s) infinite linear` and `@keyframes border-beam { 100% { offset-distance: 100% } }` in `@theme inline`. border-beam.tsx uses `after:animate-border-beam`, but its prompt leaves out the Magic UI tailwind.config step that defines it, so the beam never moved. It is `inline` so `var(--duration)` resolves on the element that sets it.
- Base rules kept because they work around Tailwind 4 or keep a KEEP item, not for their look:
  - `* { @apply border-border outline-ring/50 }` is the standard shadcn base. Tailwind 4's default border color is currentColor, so every prompt's bare `border` would otherwise be white.
  - `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer }` restores the pointer cursor that Tailwind 4's preflight dropped (the prompts target Tailwind 3).
  - a `prefers-reduced-motion: reduce` rule shortens animations and transitions (KEEP): MotionConfig doesn't reach CSS keyframes (tw-animate-css, border-beam, hero-minimalism's lines, the liquid-metal ripple).
  - `html { color-scheme: dark }`.
- Scroll padding: 6rem at the top everywhere, plus 6rem and the safe area at the bottom below 640px, where the navbar sits at the bottom of the screen.
- [fix] removed the `pre.code` rule (muted background, rounded corners, padding, mono type, 1.6 line height) — no own visual elements: it was a code panel designed here, not taken from a collected component. Question code blocks now use the shadcn Collapsible demo's mono row (`src/components/question.tsx`, section 4). Only the `.rich` rules remain in `@layer components`.
- `--radius` changed from 1.25rem to 0.5rem. The shadcn prompts here are the Tailwind 3 versions, written against 0.5rem, and with it `rounded-sm/md/lg/xl` match Tailwind's own sizes.

### index.html [foundation]

- `theme-color` changed from #0c0f12 to #000000 to match the black background token.
- favicon: the custom SVG mark (a champagne-gold gradient "A" tile) was replaced with `data:,`, an empty icon that also suppresses the /favicon.ico request. It was custom SVG art in a non-monochrome color, and no collected component provides a favicon.

### Unchanged, not copied, installed

- `src/lib/utils.ts` is the standard shadcn `cn()`, unchanged.
- `demo.tsx` files and `shadcn--accordion/block-2.js` (the tailwind.config snippet, handled in CSS) were not copied. The only `deps/` file in the app is `input.tsx` (added in the cleanup step). Every other component-level import is covered by a standalone prompt: bento-grid, empty-state and alert-dialog import `@/components/ui/button`, and stats imports `@/components/ui/card`.
- No npm install was needed: every package the components import was already in package.json. glyph-matrix's prompt lists `next-themes`, but only its demo imports it. The cleanup step uninstalled `@paper-design/shaders-react`, which nothing imports (the Liquid Metal Button uses `@paper-design/shaders`).

---

## 3. App-wide usage decisions (no component change)

- **Alert gets `role="note"`** wherever it shows static text: Home's like-you're-5 tip, Courses (eli5, caveats, pitfalls, answer, why), Learn and Cheat callouts, Setup's tip, question.tsx's Explanation boxes, Results' remix "why". alert.tsx hardcodes `role="alert"`, an assertive live region, so every static note would be announced as it appears (ten at once on the Pitfalls tab, every callout on each topic switch). Alert spreads its props after `role`, so the prop wins; alert.tsx is untouched.
- **Type has no scale of its own.** Page kickers, titles and leads reuse hero-minimalism's `.kicker` / `.title` / `.subtitle` values as Tailwind classes (`text-xs uppercase tracking-[0.14em]` muted; `text-[clamp(32px,8vw,88px)] leading-[0.95] font-semibold`; `text-[clamp(14px,2.2vw,18px)] text-muted-foreground`). Section headings are h2 elements with CardTitle's classes, because CardTitle renders an h3. Card titles use CardTitle (bento-grid's `text-xl` where a smaller one is needed). The family is the app's Geist, not the hero prompt's network-loaded Hubot Sans.
- **Progress values for assistive tech.** Written while progress.tsx still dropped `value`: Home, Learn, Runner and Results pass `aria-valuenow` (and Learn/Runner `aria-valuetext`) themselves; Courses marks its bars `aria-hidden` and puts the numbers in visible text beside them. Since the cleanup fix the component also reports the value; the explicit props match and win.
- **AnimatedCircularProgressBar** gets an integer percent with `max={100}` (with `max={60}` it printed fractions such as 16.666666666666668) and gauge colors `var(--primary)` / `var(--secondary)` instead of the demo's indigo. It has no role or label, so Home wraps it in a labelled `role="progressbar"` element and Results hides it and adds an sr-only sentence.
- **BlurFade replaces the old Reveal** everywhere (same delays and keys; `inView` where Reveal had it).
- **GlowingEffect** uses the demo's settings (blur 0, spread 40, proximity 64, inactiveZone 0.01, borderWidth 3, glow) on Home's courses teaser, Learn's previous/next cards and Setup's mode cards (disabled on the empty "My misses" card). Courses' course cards keep the old Panel glow props (spread 34, proximity 64, inactiveZone 0.05, borderWidth 1.5, movementDuration 1.4, glow off). Default variant, which is monochrome.
- **Icons without a tile:** bare lucide icons take BentoCard's icon classes (`origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75`; `h-12 w-12`, or `h-6 w-6` in Learn's topic picker).
- **Sticky bars are Cards:** Runner `sticky top-3 sm:top-[70px] z-30`, Courses `sticky top-3 sm:top-20 z-30`, Cheat at a measured top (its `useTopChrome`); all unpin at `max-height: 560px`. 70px is the bottom of the floating navbar pill from sm up; below sm the navbar sits at the bottom of the screen.
- **AlertDialogs opened from state** (App's replace-exam confirm, Runner's Submit and Quit) record the element that had focus in `onOpenAutoFocus` and give focus back in `onCloseAutoFocus`. Radix only restores focus to a Trigger. Misses uses an `AlertDialogTrigger`, so Radix handles it.
- **Empty lists** use serafimcloud EmptyState (Courses without a guide, Cheat filter with no match, an empty exam, Results with nothing wrong, Misses when cleared). It takes one action; where the old page had two, the second is a ghost Button under it.
- **Reduced motion (KEEP):** App wraps everything in `MotionConfig reducedMotion="user"` from motion/react, with framer-motion's MotionConfig nested inside (BlurFade, NumberTicker, Timeline and the navbar import framer-motion). Canvas loops are handled one by one: hero-minimalism draws one frame (component edit above), GlyphMatrix gets `interval={1e9}`, DotMatrixText `transition="none"`, and Results shows the score number directly instead of the ticker.

---

## 4. Page notes

### Shell (`src/App.tsx`) and Home (`src/views/Home.tsx`)

- NavBar: rendered once, inside `<nav aria-label="Main">` (the component's root is a div). Items are `{ name, url: "#view", icon }`. `activeTab` comes from the current view, so the highlight follows deep links, Back/Forward and in-page links. `onNavigate` ignores modifier clicks and calls `preventDefault`, then `go()` (`replaceState`) or `openCourse(null)` for Courses (`pushState`, as before). The My Misses count is part of the label ("My Misses 20"); below md the component shows icons only, so on phones the count is in the `aria-label` (Home's "To review" figure also shows it).
- NavBar `className="sm:bottom-auto"` — the component sets `bottom-0` and adds `sm:top-0`, so at 640px and up its transparent wrapper stretched to the full screen height (876px at 1440×900) and swallowed clicks in the page's center column. Anyone rendering this navbar needs the same fix.
- Nav labels join their words with non-breaking spaces — the pill is fixed at `left: 50%`, so its shrink-to-fit width is capped at 50vw and multi-word labels wrapped inside it at desktop widths.
- Background: `DotPattern className="fixed fill-input [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"` — the demo's radial mask, pinned to the viewport so the circle stays centered on screen instead of in the middle of a 6000px page.
- [fix] `fill-input` added: the dots use the `--input` token (#34353a) instead of the component's default `fill-neutral-400/80` (about #a3a3a3 at 80%) — legibility. The pattern shows through behind text that isn't on a Card, and its grey was close to the muted text grey (#a1a1a6), so muted text in the middle of the screen sat on dot noise (for example Key facts on `#courses/c960` at 390px). The dots now read as a faint texture well below the text. Passed through the component's `className`, the way the demo passes its mask; dot-pattern.tsx is unchanged.
- Footer: WordmarkFooter with wordmark "C952", legalName "C952 Study Buddy", the description "60 questions · 8 topics · progress saves in this browser only", the status "N of 60 questions mastered" (it replaces the old header's mini mastery dial), credit columns linking the 21st.dev component pages and authors plus Paper Shaders, Lucide and Geist, and the credit link "Components from 21st.dev".
- Skip link: a `Button asChild`, kept off screen with `-translate-y-24` until focused (`sr-only` would have zeroed the Button's padding).
- "Replace your exam in progress?" confirm: an AlertDialog laid out like the demo (AlertDialogCancel "Keep current exam", AlertDialogAction "Start new exam") plus `BorderBeam size={140} duration={9}`, because the old dialog had a beam. Radix puts initial focus on Cancel.
- Removed: the old custom sticky header (brand button and mini dial) and the second NavBar (the phone dock). `main` keeps the old header height as top padding (`pt-16 md:pt-[72px]`); the root has `pb-20` below sm so the footer scrolls clear of the bottom navbar. The cleanup step also removed the unused `TooltipProvider`.
- Home hero: hero-minimalism with brand "C952 Study Buddy" (`go("home")`), the LiquidMetalButton in the `cta` slot (label Start learning / Continue learning / Take the full exam; all fit the 142px button), the old eyebrow as kicker, "Pass C952." / "In one day." as title, the old paragraph split into subtitle and description, the "Next up" line as tag and heading, and "Practice exam" as the credit link (`go("exam")`). The old outline "Practice exam" Button is gone (one CTA slot).
- [fix] Home hero "Practice exam": now a shadcn `Button variant="secondary" size="sm" asChild` around `<a href="#exam">` (a plain click calls `go("exam")`) in hero-minimalism's new `action` slot, instead of the credit link: 117×36px, #f5f5f7 on #1c1d21 (about 15:1). It was 10px text at 3.43:1 with a 79×15px target. Secondary because the hero root redefines `--accent` as #e5e7eb, so outline and ghost Buttons there would hover light grey under white text.
- [fix] Home hero height: `max(clamp(640px, 88svh, 760px), <fit>px)`. `useHeroFit` (in Home.tsx) measures the hero's centered title block and its bottom copy with a ResizeObserver and returns 2 × (bottom copy + 16px) + the title block; the hero sits in a plain `<div ref>` for the measurement — layout. hero-minimalism centers the title in the whole box and pins the bottom copy to the bottom edge, so the two overlap when the box is too short. The 36px Button made the bottom copy 21px taller, and with the fixed 640px minimum the bottom section's top border ran through the subtitle at 375×667 (10px overlap, measured). At 360px wide they already overlapped before this step (about 10px, and about 43px when the "Next up" line wraps to two lines). Measured after: a 16px gap at 360×640 (735px tall; 801px with a two-line "Next up" line) and 375×667 (693px). 390×844 (743px) and 1280×900 (760px) keep the clamp height, as before.
- Home mastery dial: AnimatedCircularProgressBar plus DotMatrixText for the mastered count ("of 60 mastered"), inside a `role="progressbar"` wrapper with `aria-valuetext`. The DotMatrixText is `aria-hidden`; its `inactiveColor` is the demo's `rgba(255,255,255,0.04)`, because a canvas can't read CSS variables.
- Home Stats: Best exam, Last exam, To review, Plan. The old notes under each figure ("No full exam yet", the last exam's mode) were dropped: the slots are value and label only.
- Home "Your courses" teaser: a Card with GlowingEffect inside `<a href="#courses">` that calls `openCourse(null)`.
- Home topics: BentoGrid `auto-rows-[16rem] md:auto-rows-[18rem]` (the default 22rem left mostly empty cards and made the 8 stacked cards about 2.8k px tall on phones), spans 3 + 2 + 3 from md. Each BentoCard: the topic's lucide icon, "{n} questions · {m} mastered", `href="#learn"`, call to action "Learn" (calls `openTopic`), and a Progress bar with the percentage in the background slot.
- [fix] Home topics: through the bento-grid changes (section 2), a tap or click anywhere on a card opens that topic, the "Learn" call to action is always visible on touch screens, and the eight links are named "Learn {topic}". Checked at 390×844 with touch emulation: a tap in the middle of "Numbers & Binary" opened Learn on Numbers & Binary; at 1280×900 a click on the Pipelining card's empty area opened Pipelining, and a click on the link itself navigated once.
- Home plan: Checkbox + Label rows in the CheckboxWithText demo layout (all 9 labels wired to their checkboxes; `leading-snug` because steps wrap), done rows muted with line-through as before; the 3-day plan is a Card with a base-badge eyebrow. Section headings are a base-badge `outline` eyebrow plus an h2. Each section enters with BlurFade.

### Courses (`src/views/Courses.tsx`)

- Course list (`#courses`): glyph-matrix in its demo frame (`relative w-full overflow-hidden rounded-lg border border-border bg-background`) as the header, sized by the header content instead of the demo's `h-[400px]`, with the title over it (the old page drew a glyph field behind its header). Four stat Cards in shadcn's dashboard-card layout with NumberTicker values (`text-4xl font-bold`, as the stats demo). One Card per course, grouped under "Current term" and "Term 3": code, name, base-badge Badges (assessment, CU, term, status), a Progress bar and GlowingEffect. The whole card is a real `<a href="#courses/<slug>">`: a plain left click goes through `openCourse` (pushState and h1 focus, as before), a modified click keeps the browser default. C952's card shows its mastered-questions Progress and Buttons Open C952 → Home and Practice exam.
- Guide (`#courses/<slug>`): ghost Button "All courses", a header (code as kicker, name as h1, Badges, "Researched {updated} · dates"), then shadcn Tabs in a sticky Card. Panels: Overview (summary, assessment Card, How to pass Card, Competencies Card, caveats Alert); Topics (Accordion `type="multiple"`; eli5 in an Alert, then detail and points); Key facts (Table; on phones the note sits under the value); Study plan (Aceternity Timeline: `title` = day, `content` = focus + tasks + a "Done" Checkbox with Label, saved to the store's plan; "{n} of {N} done" as its description); Practice (Progress plus "{n}/{N} got it", then QuestionFrame/QuestionMeta cards with a Q badge, an "I got it" Checkbox, lettered choices with base-badge circles, an outline "Reveal answer" Button and the answer and why in Alerts inside BlurFade, focus moving to the answer and back); Pitfalls (`variant="destructive"` Alerts, grey through the token); Community (coverage line, consensus Card, post Cards with subreddit/date Badges); Resources (Table with kind Badges, sorted by kind); Sources (numbered list in a Card). A Separator and the "Researched … confirm requirements" note close the page.
- Courses without a usable guide show EmptyState: C952 gets "has its own study tools" with "Open C952" plus a ghost "Practice exam" Button; the others get "Study guide in progress" → All courses.
- Kept: `normalizeGuide` with its coercion helpers and usable-guide check (the old section predicates are kept as `HAS`/`SECTION_ORDER` for it), `SafeRich` for every researched HTML string (`plain()` for text inside links and triggers), `correctChoice`/`stripLetter`, the store writes, routing, Back behavior and focus moves.
- Deviations (usage only, no prompt code changed):
  - NumberTicker is wrapped in `aria-hidden` with an sr-only final value — the ticker starts empty and counts up.
  - GlyphMatrix `color` is the `--muted-foreground` token read at runtime with getComputedStyle (a canvas can't read CSS variables). It replaces the bluish default #6B7280 and the demo's #ffffff, which competed with the title. Other props are the old page's (`glyphs="01·:"`, `fadeBottom 0.9`, `interval 140`; `1e9` under reduced motion).
  - The active tab lives in the history entry's state (`history.replaceState({...state, courseTab: {slug, tab}}, "", location.href)`), so Back, Forward and reload restore it. Not in the hash, because App's `routeFromHash` takes everything after `courses/` as the slug (see Open items).
  - The tab bar is a sticky Card (`sticky top-3 sm:top-20 z-30`, static at max-height 560px). While a guide is open, html's `scroll-padding-top` is set inline to the bar's top edge and restored on leave, and TabsContent and its descendants get `scroll-mt-16`. Focusing a tab never scrolls the page (the old "bar bottom + 12px" padding made Chrome's focus scroll jump the page on every tab click), and keyboard-focused panel content lands below the bar. Switching tabs while the bar is stuck scrolls the new panel's start back under the bar. On phones the tab list centers the active tab.
  - The Timeline is wrapped in BlurFade — its transform/filter makes a stacking context, so the timeline's `z-40` sticky day titles stay under the `z-30` tab bar.
  - Accordion triggers show topic titles as plain text (`plain()`), because a button can't hold links (no current guide has markup there).
  - Practice choices are a static list with base-badge letter circles (outline; primary plus a Check icon and sr-only "(correct answer)" when revealed). They don't use question.tsx's OptionButton (interactive) or QuestionText (renders unsanitized `Rich`, which researched HTML must never go through).
  - QuestionFrame's `accent` gets `var(--primary)` / `var(--border)`; the restyled frame ignores it.
  - Removed the old scroll-spy jump bar, `useMediaQuery`, the phone-only Disclosure and the dynamic scroll padding; Tabs and the scroll handling above replace them.

### Learn (`src/views/Learn.tsx`) and Cheat Sheet (`src/views/Cheat.tsx`)

| Old (kit) | Now |
| --- | --- |
| `TopicSwitcher` chips | one Card per topic holding a full-size `<button>`: a swipeable row on phones (active card kept centered, same code as before), a 4-column grid from md |
| `TopicTile` / `TopicIcon` | bare lucide icon with BentoCard's icon classes |
| `Eyebrow` and topic counts | base-badge (`secondary` for eyebrows, `outline` for counts and idea numbers, `success` + check for a fully mastered topic) |
| `PageHeader` / `PAGE_TITLE`, `SectionTitle` / `SECTION_TITLE` | hero-minimalism title/subtitle type; h2 with CardTitle's classes in a CardHeader |
| `Meter` | Progress |
| `Callout` (eli5, flip) | Alert + AlertTitle + AlertDescription with a lucide icon, as in the Alert demo |
| `Panel as="button" glow` (previous / next topic) | Card + GlowingEffect (demo settings) |
| Learn toolbar (title, hint, Show all / Hide all / Quiz me) | a Card: header (Badge, h2, CardDescription) and footer with the Buttons, like the Card demo |
| `border-t` above the end-of-topic block | Separator |
| `StickyBar` + pill buttons (Cheat jump bar) | a sticky Card of `Button size="sm"`: `default` for the current section, `ghost` for the rest |
| `CheatSection` + `Panel` / `DataTable` | one Card per section (header: Badge, h2, optional CardDescription; content: the table) |
| formula cards | one Table: Formula / Equation (mono) / Example or note |
| filter-row "No matches" | EmptyState (icon SearchX, action "Clear filter") |
| `Kbd` | shadcn Kbd |
| custom filter field | shadcn Input |
| nudge buttons on wide tables | `Button variant="outline" size="icon"`; the edge-fade gradients are gone |

Kept: the Show all / Hide all pulse, focus to the new h1 on a topic switch, `aria-current` on topic cards and jump buttons, the scroll-spy and its hold logic, jumps that focus the section's h2, scroll padding that follows the jump bar, the "/" shortcut, Escape to clear, the `aria-live` match count, keyboard-scrollable wide tables and `Rich` for the content HTML. There was no print layout to keep.

Deviations (usage only):
- `src/views/Cheat.tsx` — the Input gets `text-base md:text-sm`, `md:pr-12` and `[&::-webkit-search-cancel-button]:hidden` — iOS Safari zooms into fields under 16px, the padding keeps typed text clear of the Kbd hint, and hiding WebKit's native clear button leaves one clear control in every browser.
- `src/views/Cheat.tsx` — the clear-filter control is a `Button variant="ghost" size="icon"` beside the field, `invisible` while the filter is empty — the app has no InputGroup to put it inside the field; `invisible` keeps the row from shifting.
- `src/views/Cheat.tsx` — the Kbd hint in the field shows `/` while empty and `Esc` while filtering (md+ only, aria-hidden) — both shortcuts get a visible hint.
- `src/views/Cheat.tsx` — Table gets `[&_mark]:bg-primary [&_mark]:text-primary-foreground` — filter matches are `<mark>`, which browsers paint yellow; they now use the theme pair index.css uses for `::selection` (color spec).
- `src/views/Cheat.tsx` — the first cell of each row is `TableHead scope="row"` with `text-foreground` (row-header semantics; TableHead's muted color is meant for column headers), and `TableCaption` is `sr-only` (the card's h2 titles the table visually).
- `src/views/Cheat.tsx` — while a table overflows sideways, the page sets `tabindex="0"`, `role="region"` and `aria-label="… (scrolls sideways)"` on the Table's own overflow wrapper and removes them when it fits — keyboard scrolling of wide tables (KEEP); table.tsx doesn't expose that div.
- `src/views/Cheat.tsx` — [fix] while a table overflows sideways, a `CardDescription` line with lucide `MoveHorizontal` says "Scroll sideways to see every column" above it (new text; `aria-hidden`, because the region's name already says "(scrolls sideways)") — on a 390px phone the Formulas, Flynn, RAID and Memory pyramid tables (640/520/720/560px) scroll inside a 300px box, cells were cut off mid-word at the card edge, and the only cue was the outline nudge Button at the top of each table, out of view further down. The nudge Buttons stay.
- `src/views/Cheat.tsx` — the jump bar sticks at a measured top (`useTopChrome`: the bottom edge of the app's fixed or sticky top chrome, found with `elementsFromPoint`, ignoring the bar itself and full-height layers; re-measured on resize) instead of the old hard-coded `top-16 md:top-[72px]` — measured 70px under the NavBar from sm up and 0 on phones.
- `src/views/Cheat.tsx` — the jump-bar row keeps `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` (it scrolls sideways on phones) and drops the old `mask-image` edge fade (a custom gradient).
- `src/views/Cheat.tsx` — the formulas are a Table with the equation column in `font-mono` (as the collapsible demo sets mono text); the column labels "Formula", "Equation" and "Example / note" are new text the table needs. The 8 great ideas are one Card with a 2- or 4-column list of outline number Badges, since cards inside a card would nest. No filter match: EmptyState (title "No matches", description "No signal words contain “q”.", action "Clear filter") — the old sentence split across the slots.
- `src/views/Learn.tsx` — [fix] the active topic Card no longer gets `border-primary` (the Learn step's selected-state cue): that white card border was a state style designed here, and no collected component or demo has it. The current topic is now marked by its count badge: base-badge `primary` (filled), the way question-tool fills a selected option's badge (`bg-primary text-primary-foreground border-primary`). A done topic that isn't current now uses `success` with `appearance="light"` plus the Check (before: `success` default, also filled white, so current and done would look alike); current and done is `primary` plus the Check. `aria-current` is unchanged.
- `src/views/Learn.tsx` — [cleanup] the topic picker's scroller (`ul`) got `relative` — layout. Each card's sr-only count text is absolutely positioned; with no positioned ancestor inside the scroller it escaped the row's overflow clip and widened the whole document to 1353px on a 375px phone (measured; the Learn step saw the same 1353px and put it down to the navbar, which the shell step had narrowed to 322px meanwhile). Now 375px.

### Practice Exam (`src/views/exam/*`), question cards (`src/components/question.tsx`) and My Misses (`src/views/Misses.tsx`)

| Old | Now |
| --- | --- |
| `QuestionFrame` / `QuestionMeta` / `QuestionText` / `OptionButton` | question-tool's look: frame, header row (its IconQuestion + "Question", "n of N"), title row with index badge, lettered option rows with its selected badge, footer buttons |
| right / wrong marks | base-badge `success` / `destructive` (`appearance="light"`, `size="sm"`) with lucide Check / X and a word ("Correct", "Wrong", "Not quite"), so color is never the only cue |
| `Callout` (Explanation, Setup's tip) | Alert + lucide icon + AlertTitle / AlertDescription |
| `Badge` / `TopicChip` / `Eyebrow` | base-badge; eyebrows became hero-minimalism kicker text |
| `Panel` (mode cards, glowed) / `Panel` / `StickyBar` | Card + GlowingEffect / Card / sticky Card |
| `Meter` | Progress |
| `ChromeDial` + dot-matrix % | AnimatedCircularProgressBar + NumberTicker in a Card with BorderBeam |
| `Disclosure` | Accordion (single item) in Misses; Collapsible + ghost Button (collapsible demo) for the remix "original Qn breakdown" |
| `EmptyState` / `ConfirmDialog` / `Kbd` | serafimcloud EmptyState / AlertDialog / shadcn Kbd + KbdGroup |
| `TopicTile` / `ModeIcon` | lucide icon with BentoCard's icon classes |
| Recent attempts and by-topic tables | Table (`TableFooter` for the correct / wrong tally) |
| review filter buttons / runner shortcuts switch | Tabs / Switch + Label |
| navigator squares, question map | base-badge rendered as `<button>` (`render={<button type="button" />}`) |

Deviations:
- `src/components/question.tsx` — renders the question-tool look by reusing its class strings verbatim (the `QT` map; all 18 strings occur in question-tool.tsx) instead of mounting `QuestionTool` / `QuestionPrompt` — QuestionPrompt takes plain-text titles, keeps picks in its own state and has no slot for right/wrong, code blocks or explanations; mounting it would need many new props.
- `src/components/question.tsx` — layout glue on top of the copied classes: header row `h-auto min-h-7 flex-wrap gap-x-3 gap-y-1 py-1` instead of a fixed `h-7`; title and option rows `items-start`; option text `min-w-0 flex-1 break-words` (plus `font-mono whitespace-pre-wrap` for code options); review rows drop the hover background; footer `flex-wrap`; footer buttons `inline-flex items-center gap-1.5` — responsive layout and states the demo doesn't cover.
- `src/components/question.tsx` — [fix] the question's code block (`QuestionText`) is `<pre className="rounded-md border px-4 py-3 font-mono text-sm overflow-x-auto">`: the shadcn Collapsible demo's mono row, verbatim (`MONO_BLOCK`), plus `overflow-x-auto` so long lines scroll inside it. Before, it was `<pre className="code">` styled by the home-made `pre.code` rule in index.css (removed, section 2). Still focusable (`tabIndex={0}`, `aria-label="Code"`) so keyboard users can scroll it. Checked at 390px: Q13's laundry block is 324px wide with 444px of text scrolling inside; Learn and My Misses stay 390px wide.
- `src/components/question.tsx` — `QuestionFrame` moves its `QuestionMeta` children into the header slot above the body (QuestionTool's frame › header › body), so callers keep the same JSX. Its `accent` prop is now optional and ignored (the frame has no colored spine). Export names and props are kept; added an optional `index` on `QuestionText` and the exports `QuestionCount`, `QuestionOptions`, `QuestionFooter`, `QuestionButton` (`look`: nav / skip / submit) and `QuestionHint`.
- `src/components/question.tsx` — Learn's QuestionCard footer is question-tool's Skip + Submit pair: "Just show me" (skip style) and, for "Choose N", "Check my answers" (submit style, disabled until something is picked). It used to be one button whose label switched. The verdict is split between a badge and a sentence ("Correct" + "Nice work."), same words. The `role="status"` live region, focus to the result after answering and to option A after "Try again" are unchanged. The revealed block uses BlurFade.
- `src/views/exam/Setup.tsx` — pick a mode (radio, or a click anywhere on its card), then press Start (LiquidMetalButton "Start exam" in a Card with the summary line). Before, clicking a mode card started the exam at once. Picking a topic in the Select also selects Topic drill.
- `src/views/exam/Setup.tsx` — no Slider for the question count — `buildExam` (src/lib/exam.ts, KEEP) fixes each mode's count, and the exam names, Retake and the full-exam best score depend on those counts (see Open items).
- `src/views/exam/Setup.tsx` — the Switch controls the existing keyboard-shortcuts setting (`localStorage["c952-shortcuts"]`, shared with the runner) in the Card demo's row pattern. New text: "Keyboard shortcuts" and "Number keys pick an answer, ← → move between questions."
- `src/views/exam/Setup.tsx` — Recent attempts is a Table in a Card; the custom nudge buttons and gradient edge fades are gone; cells wrap on phones; the date cell is a `td` (was `th scope="row"`).
- `src/views/exam/Runner.tsx` — the exam bar is a sticky Card (Badge, Progress, timer, Quit, Submit). The navigator and legend are base-badge buttons (current `primary`, answered `secondary` + `BadgeDot`, flagged + Flag icon, unanswered `outline`); the phone strip's gradient mask and hidden scrollbar are gone. The custom 6px slide between questions became BlurFade keyed on the question (duration 0.25). Footer: Previous (nav style), Flag for review (skip style, `aria-pressed`), Next / Submit exam (submit style); header and footer stay mounted, so focus survives a move. Submit starts on its action, Quit on Cancel; the destructive action uses `buttonVariants({ variant: "destructive" })`. The empty exam shows EmptyState (`[ClipboardX]`, "Other modes").
- `src/views/exam/Results.tsx` — score: AnimatedCircularProgressBar (starts at 0 and sweeps up through its own transition) next to NumberTicker (the correct count, in the demo's `text-8xl` wrapper) in a Card with BorderBeam (defaults). dot-text is not used: the gauge prints the percentage itself and has no center slot. With reduced motion, or a score of 0 (the ticker would stay empty), the number is shown directly.
- `src/views/exam/Results.tsx` — by topic: Table with a Progress per row and a TableFooter for Correct / Wrong (incl. skipped); "Study first" is outline badges in the CardFooter. Question map: base-badge buttons (correct `success` + Check, wrong `destructive` light + X, skipped `outline` + Minus). Review: Tabs ("Wrong only n" / "All n") over a controlled Accordion (`type="multiple"`); the map and the empty state's "Show all" open the item they jump to, scroll it under the navbar (`scroll-mt-28`) and focus its trigger. The All tab mounts one render after the switch (Radix Presence), so a jump waits up to 10 frames for the item. Remix items: the remix's "why" in an Alert, the original question's breakdown behind a Collapsible with a ghost Button + ChevronsUpDown.
- `src/views/exam/Results.tsx` — [cleanup] the score / by-topic grid got `grid-cols-1` below lg — layout. Its implicit `auto` column grew to the by-topic table's min-content (366px), so both cards and the page overflowed a 375px phone by 11px (measured). Now the page is 375px wide and the table scrolls inside its own overflow wrapper (shadcn Table's behavior); its last column is partly hidden until scrolled.
- `src/views/Misses.tsx` — each miss is a QuestionFrame with a visible h2 "Question N" in the header row (was an sr-only h2 + chip), topic and "Missed N×" badges, the prompt and a single-item Accordion "Show / Hide the full breakdown". The answer is a success badge "Answer" + the answer text. "By topic" is outline badges under a Separator. Clear list is an AlertDialog with an AlertDialogTrigger; the root wraps the page so the dialog can finish closing after the list empties, and focus then goes to the empty state's button (found through a wrapper, so empty-state.tsx needed no ref prop).
- `src/views/Misses.tsx` — [cleanup] the list got `grid-cols-1` — layout. The implicit `auto` grid column grew to the longest `pre.code` line (Q13's "Washer / Dryer / Folder" block, 444px), so the page was 490px wide on a 375px phone (measured). Now the code block scrolls inside itself.

---

## 5. Cleanup step

**Dead code removed**
- `src/components/kit.tsx` now holds only `Rich` and `SafeRich` (both still imported). Removed, unused by every page: Disclosure, StickyBar, ChromeDial, Eyebrow, PAGE_TITLE, SECTION_TITLE, PageHeader, SectionTitle, Panel, Badge, TopicChip, Callout (and CalloutTone), Meter, TopicIcon, TopicTile, Kbd, Reveal, EmptyState and ConfirmDialog, with their old-design classes (`panel`, `hud`, `bezel`, `font-display`, `text-platinum`, hex and white-alpha colors, the conic/radial gradients and custom shadows). This also cleared the last two tsc errors (ChromeDial's `strokeWidth`, ConfirmDialog's `showCloseButton`).
- `src/App.tsx`: the `TooltipProvider` wrapper (no Tooltip anywhere).
- `src/components/ui/dialog.tsx`, `slider.tsx`, `tooltip.tsx` (section 2, Deleted).
- npm: `npm uninstall @paper-design/shaders-react` — nothing imports it.

**Page agents' needs applied**
- progress.tsx forwards `value` (section 2).
- input.tsx added and `src/views/Cheat.tsx` imports it; the local copy and its `forwardRef` / `InputHTMLAttributes` imports are gone.
- kit.tsx trimmed (above). App's framer-motion MotionConfig already wraps every page, so BlurFade's framer-motion animations follow reduced motion (Learn step's question): checked in App.tsx.
- Not applied, by design: the AnimatedCircularProgressBar note (usage rule, already followed by Home and Results), the sticky-bar offsets (already followed), and the optional items in section 6.

**Leftover grep (all of `src`)**
- The section 8 grep finds only the word "panel" in two code comments in Courses.tsx.
- No hex, rgb(a) or hsl colors, white/black-alpha or hue-named classes, gradients, shadows, blurs or backdrop filters remain outside `src/components/ui`, except values copied from a collected component or its demo: question-tool's `bg-white dark:bg-neutral-950` body (question.tsx), NumberTicker demo's `text-black dark:text-white` (Results), DotMatrixText demo's `inactiveColor="rgba(255, 255, 255, 0.04)"` (Home), DotPattern demo's radial `mask-image` (App) and GlowingEffect demo's `blur={0}` settings. Inline styles left in views are layout only (Cheat's `minWidth` and measured `top`, Home's hero box).
- Inside `src/components/ui`, every literal color is neutral grey (the hero's zinc greys, the liquid-metal greys, dot-text's greys) or a logged monochrome switch; base-badge's hue names are unreachable `var()` fallbacks.
- A fresh build's CSS has none of the removed classes or tokens and no hue-named utility selectors.

**Checks**
- `npx tsc -p tsconfig.app.json --noEmit`: 0 errors. `npm run build` (tsc -b + vite build): succeeds, `dist/index.html` 1,550.8 kB (522.6 kB gzip). With `--noUnusedLocals` the only hits are two unused locals in prompt code (timeline's `useMotionValueEvent`, tubelight-navbar's `isMobile`), left as the prompts wrote them.
- Browser, in a separate tab on the running dev server, at 1280×900: every route clicked through from the navbar (#home, #courses, #courses/c960 with its Practice and Study plan tabs, #courses/c952 deep link, #learn, #cheat with "/", typing a filter and Esc, #exam setup → a Quick 20 runner → one pick → Quit dialog → Leave, #misses with a breakdown opened). The Results view was checked by marking an exam finished in that tab's own sessionStorage and reloading, so nothing was submitted. Console: no errors or warnings.
- Phone width (375×812): every route, all 9 guides × 9 tabs, all 8 Learn topics with Show all answers, the runner on a question with a code block, and Results with all 60 review items open. Three overflow bugs found and fixed (Learn, Misses, Results; section 4); afterwards every page is 375px wide. Tablet (768×1024): every route fits (the navbar pill spans 5–763px).
- Saved progress: nothing was answered, ticked or submitted. `localStorage["c952-study-v1"]` on 127.0.0.1:5180 still holds what the exam step left (see Open items), unchanged.

---

## 6. Open items

- **User decision — third-party font request.** hero-minimalism's `<style>` keeps the prompt's `@import url('https://fonts.cdnfonts.com/css/hubot-sans')`, so every time Home renders the browser requests a font from a third-party site. Offline (or in the single-file build without network) the hero falls back to system fonts. Left as the prompt has it.
- **Resolved — CTA label contrast.** Fixed in the fix step: the Liquid Metal Button's label (#666666, 3.3:1 to 3.5:1 measured) is now `var(--foreground)`, following the color spec's "white text" (section 2, liquid-metal-button.tsx). If you'd rather keep the prompt's dim label, revert that one line.
- **User — test data in saved progress.** Browser checks by earlier steps and by the independent check wrote to `localStorage["c952-study-v1"]` on http://127.0.0.1:5180. It now holds three history entries ("Topic drill: Pipelining" 0/7, "Remix exam" 1/25, "Topic drill: Numbers & Binary" 4/5), 20 misses (Q13 missed 3×) and one course-guide tick: D281's practice question 1 marked "I got it" (`courses.d281.practice["0"]`). The value before any checks was `{"mastered":{},"miss":{},"plan":{},"history":[],"best":null}`. The fix step's checks answered, ticked and submitted nothing. Reset it in devtools or clear that site's data; every tab open on that origin shares it. (Restoring it from an agent was blocked by the permission classifier.)
- **Optional — unused npm dependencies.** After the cleanup nothing imports `@radix-ui/react-dialog`, `@radix-ui/react-slider`, `@radix-ui/react-tooltip`, `radix-ui` or `@fontsource/instrument-serif` (alert-dialog still pulls `@radix-ui/react-dialog` in as its own dependency). Only `@paper-design/shaders-react` was removed, as the step asked. To remove the rest: `npm uninstall @radix-ui/react-dialog @radix-ui/react-slider @radix-ui/react-tooltip radix-ui @fontsource/instrument-serif`.
- **Optional — shareable course-tab URLs.** In `routeFromHash` (App.tsx) take the slug as the segment after `courses/` up to the next `/` (`h.slice("courses/".length).split("/")[0]`); Courses could then mirror the tab as `#courses/<slug>/<tab>`.
- **Optional — a question-count Slider on Setup** needs a `count` option in `buildExam` (src/lib/exam.ts), carried through `startExam` and Retake, and exam names that don't say "Quick 20" for other counts.
- Known and left: `src/data/index.ts` (KEEP) still carries an unused per-topic `color` (#e5e5ea, monochrome). The by-topic table on Results scrolls sideways inside its card at 375px. At 768–794px the full-label navbar pill leaves little margin (5–763px at 768); with classic non-overlay scrollbars it can clip by a few pixels. BlurFade `inView` sections stay invisible until scrolled into view, so printing before scrolling through prints them blank (the old Reveal did the same; there is no print layout). In development only, StrictMode runs App's route-focus effect twice, so the h1 is focused on first load.
- Anyone placing components inside the hero: its root redefines `--muted`, `--border`, `--accent`, `--bg` and `--fg`, which shadow the shadcn tokens (a shadcn outline Button there would get a light-grey hover). Only the inline-styled LiquidMetalButton sits there now. Its global class names (`.title`, `.content`, `.header`, …) only exist while Home is mounted; nothing else in the app uses those class names.

---

## 7. Component API notes

- `NavBar` items are `{ name, url, icon }`: no `id`, `short` or `badge`. Use `activeTab` (an item name) and `onNavigate`. The component positions itself (`fixed bottom-0 sm:top-0`, centered) and every instance shares `layoutId="lamp"`, so render one instance, and pass `className="sm:bottom-auto"` (section 4).
- `AnimatedCircularProgressBar` takes `max`, `min` (required), `value`, `gaugePrimaryColor`, `gaugeSecondaryColor` and `className`. No `strokeWidth`, `label` or `children`; it prints the percentage itself (pass a 0–100 integer).
- `LiquidMetalButton` takes `label`, `onClick` and `viewMode` ("text" | "icon"). No `children`, `className` or `height`. Its label is `var(--foreground)` and its shader ring is neutral grey (fix step).
- `BentoCard`: the whole card is a click and tap target for its one link (`href` + optional `onClick`), and the link's accessible name is "{cta} {name}". Don't put other interactive elements in `background` expecting the card to ignore them unless they are a, button, input, select, textarea or label (those are left alone).
- `MinimalHero`: `action` (any node) replaces the credit link at the bottom; use it for a link people need to read and tap. Inside the hero, use Button `default`, `secondary` or `link` (the hero's own `--accent` breaks the outline and ghost hovers). Its box must be tall enough for the centered title plus twice the bottom copy (Home's `useHeroFit`).
- `Button` sizes are default, sm, lg and icon only.
- `BorderBeam` takes size, duration, anchor, borderWidth, colorFrom, colorTo and delay.
- `NumberTicker` stays empty until it scrolls into view, then counts up.
- `Progress` takes `value` (0–100) and now reports it to assistive tech; give it an `aria-label` when no visible text names it.
- glowing-effect's `variant="white"` reads `var(--black)`, which Aceternity's Tailwind 3 plugin defined and Tailwind 4 doesn't, so that variant draws nothing. Use the default variant (monochrome).
- glyph-matrix defaults to #6B7280 (a slightly blue grey); pass `color`, as its prompt says.
- Tailwind 3 → 4 differences that break nothing were left as written: the shadow, blur and rounded scale shifts, and `outline-none` (in Tailwind 4 it also removes the outline in forced-colors mode while the ring still shows). The legacy `!block`, `!hidden`, `![mask-…]` and `bg-gradient-to-t` still compile in Tailwind 4.3.5.
- kbd's `[[data-slot=tooltip-content]_&]` styles target the Tailwind 4 tooltip's data-slot; there is no tooltip in the app now.
- The running dev server's CSS can still contain old classes, because @tailwindcss/vite keeps every candidate it has seen during a session. A fresh build shows the real output.

---

## 8. Purge reference: the old design removed in the foundation step

`src/index.css` was rewritten in the foundation step. Everything below no longer exists; a class or utility that names
it compiles to nothing.

### Class names (were defined in the old index.css)

| Class | What it was |
| --- | --- |
| `panel` | gunmetal card: hairline border, top sheen gradient, inset highlight |
| `panel-raised` | lighter panel variant |
| `hud` | 11px mono uppercase label with 0.14em tracking |
| `bezel` | brushed-steel gradient ring around a tile |
| `grain` | no-op hook (`isolation: isolate`) |
| `dot-grid`, `hairline-grid` | radial-dot background with a fading mask |
| `text-platinum` | white-to-silver gradient text |
| `text-champagne` | grey gradient text |
| `font-display` | was `@utility font-display` (Geist 600, -0.035em tracking) |
| `@keyframes lmb-ripple` | the old liquid-metal-button copy's ripple. The prompt's button injects its own `ripple-animation`. |

### Tokens (CSS variables and the Tailwind utilities they generated)

| Removed CSS variable | Removed theme key | Utilities that no longer exist (any prefix: bg-, text-, border-, from-, via-, to-, ring-, fill-, stroke-, divide-, outline-, …, with or without /opacity) |
| --- | --- | --- |
| `--w-100` `--w-90` `--w-80` `--w-70` `--w-60` `--w-50` `--w-40` `--w-30` `--w-20` `--w-10` | `--color-w-100 … --color-w-10` | `text-w-60`, `bg-w-10`, … |
| `--deep` `--s1` `--s2` `--s3` `--s4` `--gunmetal` | `--color-deep`, `--color-s1 … --color-s4`, `--color-gunmetal` | `bg-s1`, `from-s1`, `bg-s3/90`, `hover:bg-s4/90`, `bg-deep`, … |
| `--gold` `--gold-hi` `--gold-lo` `--steel` `--silver` `--good` `--bad` | `--color-gold`, `--color-gold-hi`, `--color-gold-lo`, `--color-steel`, `--color-silver`, `--color-good`, `--color-bad` | `text-gold`, `bg-good`, `text-bad`, … |
| `--hairline` `--sheen` | `--color-hairline` | `border-hairline`, `bg-hairline` |
| (none) | `--font-display`, `--font-serif` (the old alias pointing at Geist) | `font-display`. `font-serif` and wordmark-footer's serif wordmark now use Tailwind's default serif stack. |
| (none) | `--radius-2xl`, `--radius-3xl` (custom mappings) | `rounded-2xl` / `rounded-3xl` are back to Tailwind's 1rem / 1.5rem |

Token values that changed but still exist: `--radius` is now 0.5rem (was 1.25rem), so `rounded-sm/md/lg/xl` are 4/6/8/12px. `--popover` is #0f1012 (was #141518), `--secondary` #1c1d21, `--muted` #16171a, `--border` #26272b (was rgba white 10%), `--input` #34353a (was rgba white 16%), `--ring` #d1d1d6 (was #f5f5f7). Tokens added: `--destructive-foreground`, `--chart-1 … --chart-5`, and the base-badge hooks.

### Base styles removed (no class name involved)

- body: the radial gunmetal glow (`background-image` + `background-attachment: fixed`), the `--w-60` grey text color (body text is now `--foreground`), `font-feature-settings: "ss01","cv11"`, `leading-relaxed`, `text-[16px]` and `min-height: 100dvh`.
- the thin scrollbar colors, and the `details > summary` marker reset.
- `.rich` extras: colored b/strong/i/em, the custom dot bullets, `p + p` spacing, and the bordered inline-code box. `pre.code` has a muted background and no border. (The fix step later removed the `pre.code` rule entirely; code blocks take the Collapsible demo's mono row.)

### Find them

```
grep -rnE '(^|[" `])(panel|panel-raised|hud|bezel|grain|hairline-grid|dot-grid|text-platinum|text-champagne|font-display)([" `]|$)|-(w-(100|[1-9]0)|deep|s[1-4]|gunmetal|gold(-hi|-lo)?|steel|silver|good|bad|hairline)\b|var\(--(w-|s[1-4]\b|gold|steel|silver|good|bad|hairline|sheen|deep|gunmetal|font-display)' src --include=*.tsx | grep -v components/ui
```

At the end of the foundation step this matched 55 lines in App.tsx, kit.tsx, question.tsx and every view, and the views
also hardcoded custom colors such as `bg-[#f5f5f7]`, `text-[#a1a1a6]`, `border-white/[.08]` and `bg-[rgba(0,0,0,.72)]`.
After the page steps and the cleanup it finds only the word "panel" in two code comments in Courses.tsx. Without the
final `grep -v`, it also finds wordmark-footer's `var(--font-display, var(--font-serif, ui-serif, Georgia, serif))`,
which is the prompt's own code and falls back to the serif stack.

---

## 9. Fix step: the independent check's findings

An independent check of the running app reported ten findings. All ten are handled; nothing in this step went
against the rule (no new visual elements: every change reuses a collected component, its demo's classes, its own
variants, a theme token or plain layout). Per-file details are in section 2 and section 4 under **[fix]**.

| # | Finding (severity) | Fix | Checked in the browser |
| --- | --- | --- | --- |
| 1 | Home topic cards can't be opened by tapping (high): the only link is the hover-only "Learn" call to action, which Tailwind 4's `group-hover` never shows on touch screens, and the card isn't a link | bento-grid.tsx: a click or tap anywhere on a card goes to its link; on devices without hover the call to action shows at rest | 390×844 with touch emulation: a tap in the middle of "Numbers & Binary" opened Learn on that topic; all 8 call-to-action rows at opacity 1. 1280×900: hidden at rest, shown on hover; a click on an empty card area opened Pipelining; a click on the link itself navigated once |
| 2 | Liquid Metal Button label #666666, 3.45:1 / 3.32:1 and not white (medium) | liquid-metal-button.tsx: label and icon `var(--foreground)` | rgb(245,245,247) on Home ("Continue learning") and Setup ("Start exam"); about 15:1 on #202020 |
| 3 | Hero "Practice exam" link in the 10px credit style, 3.43:1, 79×15px target (low) | hero-minimalism.tsx `action` slot; Home passes a shadcn `secondary` Button; Home measures the hero's height so the taller bottom copy can't overlap the title | 117×36px, rgb(245,245,247) on rgb(28,29,33); title-to-bottom-copy gap 16px at 360×640 and 375×667, 41px at 390×844, 46px at 1280×900 |
| 4 | Liquid Metal ring tinted blue (low) | liquid-metal-button.tsx: the shader's built-in colors replaced by neutral greys | `gl.readPixels` after a render: chroma 0 on every opaque pixel (before: up to 26/255, about 35% of ring pixels above 12/255) |
| 5 | `pre.code` panel designed here (low) | index.css rule removed; question.tsx uses the Collapsible demo's mono row | computed: 1px #26272b border, 6px radius, 12px / 16px padding, Geist Mono 14px, no background; Q13's block scrolls inside (324px box, 444px of text) on Learn and My Misses |
| 6 | Learn active topic `border-primary` designed here (low) | Learn.tsx: the current topic's count badge fills (`primary`); a done topic is `success` light + Check | current badge filled rgb(245,245,247), the others transparent with a border; every card border #26272b |
| 7 | Page DotPattern dots close to the muted text grey (low) | App.tsx: `fill-input` | computed fill rgb(52,53,58); Key facts on `#courses/c960` at 390px reads cleanly |
| 8 | Eight topic links all named "Learn" (low) | bento-grid.tsx: sr-only card name in the link | "Learn Numbers & Binary" … "Learn VMs, Cloud & RAID" |
| 9 | Cheat wide tables scroll with no visible cue (low) | Cheat.tsx: "Scroll sideways to see every column" above a table while it overflows | 4 lines at 390px (Formulas, Flynn, RAID, Memory pyramid), none at 1280px where the tables fit |
| 10 | Test data left in saved progress (note) | no app change; section 6 updated with the current contents | read-only look at `c952-study-v1` |

**Checks**
- `npx tsc -p tsconfig.app.json --noEmit`: 0 errors (with `--noUnusedLocals --noUnusedParameters` only the two prompt-code hits from section 5). `npm run build`: succeeds, `dist/index.html` 1,552.5 kB (523.0 kB gzip).
- Browser, in this step's own tab on the running dev server: #home, #courses, #courses/c960 (Key facts), #learn, #cheat, #exam and #misses at 390×844 (touch emulation), plus Home at 360×640, 375×667 and 1280×900, Learn, Cheat and Setup at 1280×900. Every page is as wide as the viewport (no sideways page scroll). Console: no errors after a reload; the only errors seen were two Vite 500s while a file was half edited during this step.
- Saved progress: nothing was answered, ticked or submitted. Topic cards were opened only to check navigation.

---

## 10. ASCII design language (2026-11-20)

The WGU Study Buddy redesign: the ASCII design language of the Claude Design system in
`design-system/wgu-study-buddy/project/` (README.md, Background.md, Home.md, Surfaces.md, tokens, one README per
component) implemented in the app. This section merges the eleven agent logs of that run, kept with their
measurements in `design-system/wgu-study-buddy/_work/impl-logs/` (impl-foundations, impl-ascii-a, impl-ascii-b,
impl-field, impl-restyle-a, impl-restyle-b, impl-views-home, impl-views-courses, impl-views-exam, impl-views-study,
impl-integrate). Sections 1-9 describe the app before this step; where they differ, this section wins.

Step tags: **[foundations]** tokens, fonts and base styles · **[ascii-a]** and **[ascii-b]** the collected ASCII
components · **[field]** the background · **[restyle-a]** and **[restyle-b]** the existing components ·
**[home]** App and Home · **[courses]** · **[exam]** · **[study]** Learn, Cheat Sheet, My Misses and question.tsx ·
**[integrate]** this merge, the cleanup and the checks.

Spec references: D = `_work/design-decisions.md` (D10 component fates, D11 literal colors, D12 code delta, Notes =
its dated notes, which win over earlier sections); README = `project/components/<Comp>/README.md`; Brand = the
system's `project/README.md`; Surfaces, Home.md and Background.md = its pages.

The rule held throughout: a visual element comes only from a saved 21st.dev prompt, copied word for word, then
changed only as the spec lists (every change is below). Hooks and layout glue (FieldScrim, route guards) are the
app's own plumbing.

10.1 Components after this step · 10.2 Removed assets · 10.3 New components · 10.4 Restyled and kept components ·
10.5 question.tsx · 10.6 Foundations and the curtain · 10.7 App and views · 10.8 Manifests · 10.9 Notes for
callers · 10.10 Checks · 10.11 Open items for the design system

### 10.1 Components after this step

`src/components/ui/` holds 36 files: 29 that were already in the app (restyled or kept) and 7 new ones.

| File | Component (21st.dev author) | Fate (D10) | Used by |
| --- | --- | --- | --- |
| `accordion.tsx` | Accordion (shadcn) | restyle | Courses, Results, Misses |
| `alert.tsx` | Alert (shadcn) | restyle | Home, Courses, Learn, Cheat, Setup, Results, question.tsx |
| `alert-dialog.tsx` | Alert Dialog (shadcn) | restyle | App, Runner, Misses |
| `animated-circular-progress-bar.tsx` | Animated Circular Progress Bar (Magic UI) | keep | Home, Results |
| `base-badge.tsx` | Base Badge (sean0205, ReUI) | restyle | every view, question.tsx |
| `bento-grid.tsx` | Bento Grid (Magic UI) | restyle | Home |
| `blur-fade.tsx` | Blur Fade (Magic UI) | restyle | every view |
| `button.tsx` | Button (shadcn) | restyle | App, every view but Home, alert-dialog, bento-grid, empty-state, question.tsx |
| `card.tsx` | Card (shadcn) | restyle | Home, Courses, Learn, Cheat, Setup, Runner, Results, stats |
| `checkbox.tsx` | Checkbox (shadcn) | restyle | Home, Courses, question.tsx |
| `collapsible.tsx` | Collapsible (shadcn) | keep | Results |
| `conveyor-loop.tsx` | Conveyor Loop (loading-ui) | adopt | GuideGate: the wait while a study guide is fetched (section 12) |
| `corner-frame.tsx` | Corner Frame (kevingirelli) | adopt | Home, Courses, Learn, Setup, Results, alert-dialog, bento-grid, stats |
| `decrypt-text.tsx` | Decrypt Text (rmahammad) | adopt | every page h1: Home, Courses, Learn, Cheat, Setup, Results, Misses |
| `dot-text.tsx` | Dot Text (jahed) | keep | Home |
| `empty-state.tsx` | Empty State (serafimcloud) | restyle | Courses, Cheat, Runner, Results, Misses |
| `input.tsx` | Input (shadcn, bundled with the Kbd prompt) | restyle | Cheat |
| `kbd.tsx` | Kbd (shadcn) | restyle | Cheat, Runner |
| `label.tsx` | Label (shadcn) | keep | App, Home, Courses, Setup, Runner, question.tsx |
| `number-ticker.tsx` | Number Ticker (Magic UI) | restyle | Courses, Results |
| `progress.tsx` | Progress (shadcn) | restyle | Home, Courses, Learn, Runner, Results |
| `question-tool.tsx` | Question Tool, multiple-choice (serafimcloud) | keep | question.tsx (IconQuestion; its class strings are restyled in question.tsx) |
| `radio-group.tsx` | Radio Group (shadcn) | restyle | Setup |
| `scramble-link-button.tsx` | Scramble Link Button (hyperiux) | adopt | Home |
| `select.tsx` | Select (shadcn) | restyle | Setup |
| `separator.tsx` | Separator (shadcn) | keep | Home, Courses, Learn, Results, Misses, question.tsx |
| `stats.tsx` | Stats, stats-info (meschacirung) | restyle | Home |
| `switch.tsx` | Switch (shadcn) | restyle | App (the field's pause), Setup, Runner |
| `table.tsx` | Table (shadcn) | restyle | Courses, Cheat, Setup, Results |
| `tabs.tsx` | Tabs (shadcn) | restyle | Courses, Results |
| `terminal.tsx` | Terminal (thegridcn) | adopt | Courses, question.tsx (code blocks) |
| `timeline.tsx` | Timeline (Aceternity) | restyle | Courses |
| `tree-box-drawing.tsx` | Tree Box Drawing (nikolas-sapa), exports `BoughIndex` | adopt | Courses (the Course index) |
| `trippin-spiral.tsx` | trippin spiral recipe (jobsrip), rebuilt in Canvas2D | adopt | App (the field) |
| `tubelight-navbar.tsx` | Tubelight Navbar (ayushmxxn) | restyle | App |
| `wordmark-footer.tsx` | Footer with Big Wordmark (vilqor) | restyle | App |

Other files changed: `index.html`, `src/index.css`, `src/components/field-scrim.tsx` (new, plumbing),
`src/components/question.tsx`, `src/App.tsx` and every view. `src/components/kit.tsx`, `src/lib` and `src/data` are
unchanged; the storage keys stay `c952-study-v1`, `c952-exam-session-v1` and `c952-shortcuts`, plus the new device
setting `c952-field-motion`.

### 10.2 Removed assets

Each file was deleted by [integrate] only after grep found nothing importing it (D10, D12.9). Their prompts,
manifests and staged copies stay in `21st/` for the record.

| File | Component (author) | Bytes | Replaced by |
| --- | --- | --- | --- |
| `hero-minimalism.tsx` | Hero Minimalism (lyanchouss) | 10,923 | The Home hero composition (Home.md): field, CornerFrame window, DecryptText h1, ScrambleLinkButton |
| `liquid-metal-button.tsx` | Liquid Metal Button (johuniq) | 11,898 | ScrambleLinkButton for Home's "Open courses"; Button default `lg` for Setup's "Start exam" |
| `glowing-effect.tsx` | Glowing Effect (Aceternity, manuarora700) | 6,592 | CornerFrame target frames (Home teaser, course cards, Learn cards, mode cards) |
| `border-beam.tsx` | Border Beam (Magic UI) | 1,510 | CornerFrame: AlertDialogContent's built-in two-corner frame; the Results score card's Readout frame |
| `dot-pattern.tsx` | Dot Pattern (Magic UI) | 1,043 | The field (TrippinSpiral) and its curtain (FieldScrim) |
| `glyph-matrix.tsx` | Glyph Matrix (dillionverma) | 4,635 | The field; the Courses header became a standard page header |

- npm: `npm uninstall @paper-design/shaders` ([integrate]); only the Liquid Metal Button imported it. package.json lost
  that one dependency and package-lock.json its two entries; no other package changed, none was added.
- index.css: `--animate-border-beam` and `@keyframes border-beam` removed ([foundations], D12.2).
- Comments in Results.tsx and Setup.tsx still name BorderBeam and LiquidMetalButton as what they replaced.

### 10.3 New components (adopt)

Each component file was cut out of its saved prompt by line range and checked byte-identical to the prompt before
any edit; demos and the prompts' CSS blocks were not copied. No npm package was added (clsx, tailwind-merge,
lucide-react and @radix-ui/react-slot were installed).

**decrypt-text.tsx** — `rmahammad--decrypt-text.md` lines 15-457 [ascii-a]
- [ascii-a] The "Motiq design tokens" comment and `const MOTIQ_TOKENS = "@layer motiq{…}"` (the prompt's blue and
  green `--motiq-*` light and dark values) removed. Why: index.css maps every `--motiq-*` name to a theme token once.
  Spec: D10, D11 (DecryptText row), README "Source and changes" 1.
- [ascii-a] The injection `<><style dangerouslySetInnerHTML={{ __html: MOTIQ_TOKENS }} /><DecryptTextBase {...props} /></>`
  became `<DecryptTextBase {...props} />`. Exports unchanged. Spec: as above.
- [ascii-a] The flash keyframe lost its text-shadow: `0%{color:…;text-shadow:0 0 24px color-mix(…)}100%{text-shadow:0 0 0
  transparent;}` became `0%{color:var(--motiq-accent-text, #7f9fff);}`. Why: no glows (Brand principle 6, D5.3). The
  `#7f9fff` fallback stays and never applies (index.css defines the variable). Spec: D10, README "Source and changes" 2.
- [ascii-a] Deviation, the spec being wrong against the code: `stop()` also sets `playedRef.current = false` (with a
  two-line comment). Why: with the Title decrypt recipe's `loop={false}`, a run cut off before it resolved (React
  StrictMode's dev replay, a hidden tab, the h1 scrolled away) was never re-armed and left random hex in the h1 for
  good. Now an interrupted run replays and settles. Restores Brand principle 7, README Accessibility and States,
  Home.md Motion. Behaviour only.
- Left as shipped: `"use client"`, the docblock's "decaying glow" wording, the unused `terminal` variant.

**scramble-link-button.tsx** — `hyperiux--scramble-link-button.md` lines 15-261 [ascii-a]
- [ascii-a] `DEFAULT_HOVER_COLOR = "#ff6b00"` became `"var(--primary)"`. Spec: D10, D11, README "Source and changes" 2.
- [ascii-a] Default `className = ""` became `"text-sm text-foreground"`. Spec: D10, README 2.
- [ascii-a] The root lost `text-[1.1vw]`, `text-inherit`, `max-lg:text-[3vw]` and `max-md:text-[4.2vw]`. Why: the root
  joins classes with a template string (no tailwind-merge), so they fought the caller's size and color. Spec: D10,
  README 1.
- [ascii-a] The scrambling span's `aria-label={btnText}` became `aria-hidden="true"`. Why: `aria-label` on a generic
  span is prohibited in ARIA 1.2, and the span's text is random for 500 ms. Spec: D10, README 3, Brand principle 8.
- [ascii-a] The `<a>` gained `aria-label={btnText}` right after `href`, before `{...linkProps}` and `{...props}`, so a
  caller's own label still wins. Spec: D10, README 3.
- Left as shipped: `"use client"`, the Hyperiux Vault comment, `(event as any)`.

**corner-frame.tsx** — `kevingirelli--corner-frame.md` lines 15-144 [ascii-a]
- No edit: byte-identical to the prompt (D10, README). The brackets take `--corner-frame-color`, which index.css sets
  to `var(--muted-foreground)`; callers turn them gold with `hover:`, `focus-visible:`, `has-[:focus-visible]:`,
  `has-[[data-state=checked]]:` or `aria-[current=true]:` variants.

**terminal.tsx** — `thegridcn--terminal.md` lines 15-211 [ascii-b]. The prompt's CSS block (`@import` lines, a cyan
`:root`, `@keyframes terminalScan`) was never added (D10).
- [ascii-b] `TerminalProps` gained `idleCursor?: boolean`, default `true`, gating the idle `> ▌` row. Spec: D10, README.
- [ascii-b] Line colors: error `text-red-500` → `text-destructive`; output `text-foreground/90` → `text-foreground`;
  system `text-amber-500` → `text-muted-foreground`; input keeps `text-primary`. Why: tokens; text never uses a token
  alpha. Spec: D10, D11 (Terminal prompt row).
- [ascii-b] Window borders: danger `border-red-500/50` → `border-destructive`; default `border-primary/50` →
  `border-border`; locked `border-amber-500/50` → `border-chart-2`. Spec: D10, D11.
- [ascii-b] Title-bar rules: danger `border-red-500/30 text-red-500` → `border-destructive text-destructive`; default
  `border-primary/30 text-primary` → `border-border`; locked `border-amber-500/30 text-amber-500` →
  `border-chart-2 text-chart-2`. Spec: D10.
- [ascii-b] Removed `scrollRef`, its mount effect (`scrollTop = scrollHeight`) and `ref={scrollRef}`. Why: it opened a
  10-line block scrolled to the end with the first line cut. Spec: Notes part B (Terminal correction).
- [ascii-b] Window `relative overflow-hidden rounded border bg-card/80 backdrop-blur-sm` → `relative overflow-hidden
  rounded-lg border bg-card`: opaque, no blur, `radius-lg`. Spec: D10.
- [ascii-b] Removed the CRT scanline overlay div and the scan-sweep div (inline `terminalScan 5s`). Why: characters,
  not light. Spec: D10, Notes (design review fixes).
- [ascii-b] Title span `text-[10px] text-foreground/80 uppercase tracking-widest` → `font-mono text-xs font-medium
  uppercase tracking-[0.08em] text-muted-foreground` (the `label` style). Spec: D10.
- [ascii-b] LOCKED tag `text-amber-500` → `text-chart-2`; its pulse stays, so `locked` stays unused. Spec: README,
  Notes part B.
- [ascii-b] Lines box `max-h-64 overflow-y-auto p-4 font-mono text-sm` → `p-4 font-mono text-sm whitespace-pre-wrap`:
  the whole block shows, nothing scrolls inside, phones wrap. Spec: D10, Notes part B.
- [ascii-b] Revealed, typing and idle line divs `leading-relaxed` → `leading-6` (`code` 14/24); their prefix spans
  lost `opacity-60`. Spec: Notes part B.
- [ascii-b] Carets `animate-pulse` → `animate-[caret-blink_1.1s_steps(1)_infinite] motion-reduce:animate-none`. The
  keyframes are tw-animate-css's `caret-blink`, which index.css already imports. Spec: D10, D6, README Motion.
- [ascii-b] The idle row renders only when `idleCursor && revealedLines >= lines.length`. Spec: D10.
- [ascii-b] Removed the four corner decoration divs. Spec: D10.

**tree-box-drawing.tsx** (exports `BoughIndex`) — `nikolas-sapa--tree-box-drawing.md` lines 15-422 [ascii-b]. The
prompt's CSS block (`--ns-muted`, `--ns-accent` #006bff, `--surface`) was not copied.
- [ascii-b] `BoughIndexProps` gained `onSelect?: (node: BoughNode) => void` (with a doc comment). Spec: D10, README.
- [ascii-b] The row button's click calls `onSelect?.(node)` after the internal select and toggle. Spec: README.
- [ascii-b] Enter and Space in the tree's `onKeyDown` also call `onSelect?.(node)` after select. Why: that handler
  calls `preventDefault()`, which cancels the button's own click, so keyboard users could select a leaf but never open
  its course. Spec: README Accessibility, Surfaces Course index (decision).
- [ascii-b] `ROW_H` 22 → 24; root `text-[13px] leading-[22px]` → `text-sm leading-6`. Spec: D10.
- [ascii-b] Focus outline `var(--ns-accent)` → `var(--ring)` (offset kept). Spec: D10.
- [ascii-b] `role="treeitem"` with `aria-expanded`, `aria-selected` and `aria-level` moved from the row `div` to the
  focusable `<button>`; the row and line `div`s take `role="none"`. Spec: D10, Notes (design review fixes).
- [ascii-b] Connectors `text-border` → `text-muted-foreground`. Spec: D10, D11.
- [ascii-b] Button `rounded-sm` → `rounded-xs`; selected `bg-surface` → `bg-accent`; rest `text-ns-muted
  hover:text-foreground` → `text-foreground hover:bg-accent`. Spec: D10, Notes part B.
- [ascii-b] Markers `▾ ` `▸ ` `· ` inside the button → an `aria-hidden` span with `- ` `+ ` `· ` before the label
  (the fonts lack ▸ and ▾). The marker inherits `foreground` (README parts table), not States' muted. Spec: D10.

**conveyor-loop.tsx** — `loading-ui--conveyor-loop.md` lines 15-100 [ascii-b]
- No edit: byte-identical (D10). Mounted nowhere until a real wait exists; see 10.9 for its first caller.

**trippin-spiral.tsx** (exports `TRIPPIN_SPIRAL`, `TrippinSpiral`, `TrippinSpiralProps`) [field]
- Rebuilt in Canvas2D from the recipe prompt `ascii--trippin-spiral.md` and the observations in
  `21st/reference/ascii-trippin-spiral.md`; no 21st.dev source code was read. The prompt's "Full parameters (JSON)"
  block is pasted in mechanically as `TRIPPIN_SPIRAL` (`as const`) and every constant derives from it; no prompt value
  changed. Built as Background.md specifies: seeded rings field, palette luma (Rec. 601), contrast 150, the `lum <
  0.08` skip, hex digits from a 128x64 atlas with halftone holes, one `drawImage` per lit cell; raster scale `max(1,
  W/1920, H/1080)`, DPR cap 1; 24 fps, 12 fps when `curtained` or slow; pauses for a hidden tab, off screen, reduced
  motion and `still`; a 60 s idle hold while curtained; the swirl only for fine hover pointers. The canvas is
  `aria-hidden`, `data-slot="trippin-spiral"`, `data-field`, `pointer-events-none fixed inset-x-0 top-0 -z-20
  h-[100lvh] w-full`. Spec: Background.md, D7, README (TrippinSpiral).
- [field] Deviations from Background.md, with evidence in impl-field.md (Background.md and the TrippinSpiral README
  still describe the specified values, see 10.11):
  1. Glyph baseline `Math.round(ascent)` instead of `1 + ascent`, so the glyph sits at the cell's top-left with about
     3 px clear on the right and 2 px below, as Background.md's "Look to match" describes.
  2. Halftone radii 0.276 and 0.084 instead of 0.46 and 0.14 (x intensity / 30): the specified holes erased every
     Geist Mono 500 8 px digit to a dash. Built: 87.6% of pixels stay background, against the reference's 85%.
  3. A cell's digit is held between its jitter re-rolls (alpha and hole size still follow `lum` every redraw): the
     formula recomputed every redraw changed 32-38% of glyphs per redraw, against the 22-26% Background.md asks; built
     about 18%. Still frames pick every digit fresh, so the still frame is the specified one.
  4. `Math.hypot` written as `Math.sqrt(x * x + y * y)`: same values, about 0.5 ms less per redraw.

### 10.4 Restyled and kept components

Before any edit each file was compared with its prompt: the byte-identical ones stayed so until their edits below,
the others differed only by the edits already in section 2. Only classes and the code they need changed; no export
or prop was removed, and one optional prop was added (WordmarkFooter `controls`).

**accordion.tsx** (restyle) [restyle-a]
- AccordionTrigger `… py-4 font-medium …` → `… py-4 text-base font-semibold …` (`subheading`). Spec: README "Source
  and changes", D10.
- Chevron adds `text-muted-foreground` (icons rest muted, never gold). Spec: README.
- AccordionContent: the animated region loses `text-sm`; the inner box `pb-4 pt-0` → `pb-4 pt-0 font-sans text-base`
  (`body`). Spec: README, D10, Notes part A.

**alert.tsx** (restyle) [restyle-a]
- Base: adds `bg-card`; `[&>svg]:top-4` → `[&>svg]:top-5`; `[&>svg+div]:translate-y-[-3px]` removed;
  `[&>svg]:text-foreground` → `[&>svg]:text-muted-foreground`. Why: an Alert is an opaque window in both variants; the
  16px icon centres on the title's 24px line. Spec: README "Source and changes" 1, 2, 4; Notes part A.
- `default` `bg-background text-foreground` → `text-foreground` (the fill moved to the base). Spec: README 1.
- `destructive` `border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive` →
  `border-destructive text-destructive [&>svg]:text-destructive` (no token alphas). Spec: README 3, D11.
- AlertTitle `mb-1 font-medium leading-none tracking-tight` → `mb-1 text-base font-semibold leading-6`;
  AlertDescription adds `font-sans`. Spec: README 4, 5. Titles inside sans containers pass `font-mono` at the call site
  (question.tsx, Courses ELI5, Results RemixWhy), as the README says a title is never sans.

**alert-dialog.tsx** (restyle) [restyle-a]
- Imports `{ CornerFrame }` from `@/components/ui/corner-frame`. Spec: README "Source and changes".
- AlertDialogOverlay `bg-black/80` → `bg-scrim`. Spec: README, D10, D11.
- AlertDialogContent: the Radix Content is wrapped in `<CornerFrame asChild className="fixed" corners={["top-left",
  "bottom-right"]} size="16px" thickness="2px" inset="8px">` (ref and props stay on the Content; `fixed` keeps
  CornerFrame's `relative` from unfixing the dialog). Spec: README, Surfaces (Dialog), Notes (Home and Surfaces step).
- Content classes `w-full … bg-background p-6 shadow-lg … sm:rounded-lg` → `w-[calc(100%-2rem)] … rounded-lg border
  bg-popover p-6 … focus-within:[--corner-frame-color:var(--primary)]` (a 16px phone gutter, rounded at every width,
  no shadow, brackets gold while focus is inside). Spec: README Tokens, Brand Borders, Notes part A.
- AlertDialogTitle `text-lg` → `text-base`; AlertDialogDescription adds `font-sans`. Spec: README.

**animated-circular-progress-bar.tsx** (keep) [restyle-a]
- No edit; still byte-identical. Callers pass `gaugePrimaryColor="var(--primary)"` and
  `gaugeSecondaryColor="var(--secondary)"`. Spec: README, D10.

**base-badge.tsx** (restyle) [restyle-a]
- Base `… font-medium focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 …` → `… font-mono
  font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:ring-offset-2 …`. Why: badges stay mono (`caption` 500) inside sans text; the ring shows for keyboard
  focus only, with a `background` gap instead of Tailwind 4's white offset. Spec: README, Notes part A.
- Sizes `lg` and `md` `rounded-md` → `rounded-sm`; `sm` and `xs` `rounded-sm` → `rounded-xs`. Spec: README, D5.1.
- Unchanged: the 13 hook lookups and their hue fallbacks (unreachable, D11), BadgeButton, BadgeDot.

**bento-grid.tsx** (restyle) [restyle-a]
- Imports `{ CornerFrame }`. Spec: README.
- BentoCard's root `div` wrapped in `<CornerFrame asChild size="16px" thickness="2px" inset="8px"
  className="hover:[--corner-frame-color:var(--primary)] has-[:focus-visible]:[--corner-frame-color:var(--primary)]">`
  (whitespace re-indented). Why: BentoCard forwards neither children nor style, so its Target frame lives inside.
  Spec: README, Surfaces (Target frame), Notes.
- Root: the light stack `bg-white [box-shadow:…]` and the dark string `transform-gpu dark:bg-black
  dark:[border:…] dark:[box-shadow:…inset]` → `… overflow-hidden rounded-lg border bg-card`. Spec: README, D11.
- Icon `text-neutral-700` → `text-muted-foreground`; name `text-xl font-semibold text-neutral-700
  dark:text-neutral-300` → `text-base font-semibold text-foreground`; figures `text-neutral-400` → `text-sm
  text-muted-foreground`. Spec: README, D11.
- The hover overlay div (`group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10`) removed. Spec: README, D11.
- Icon `group-hover:scale-75` adds `group-focus-within:scale-75 [@media(hover:none)]:scale-75`. Why: README States
  says keyboard focus does what hover does and on touch the hover layout is the resting one; the earlier mirrors
  missed the icon (decision). Spec: README States.

**blur-fade.tsx** (restyle) [restyle-a]
- Default `blur = "6px"` → `blur = "0px"`: every BlurFade is a fade and a 6px rise. Spec: README, D10, Brand
  "Shadows and blur".

**button.tsx** (restyle) [restyle-a]
- Base adds `font-mono` (`ui` stays mono inside sans containers). Spec: README, Notes part A.
- outline `border border-input bg-background …` → `border border-muted-foreground bg-transparent …`. Spec: README, D10.
- link `text-primary underline-offset-4 hover:underline` → `text-foreground underline underline-offset-4
  hover:text-primary`. Spec: README, D10.
- Sizes: `sm` `h-9` → `h-8`; `lg` `h-11 … px-8` → `h-12 … px-6`; `icon` `h-10 w-10` → `size-10` (32, 40, 48). Spec:
  README Sizes.

**card.tsx** (restyle) [restyle-a]
- Card loses `shadow-sm`; CardHeader `space-y-1.5` → `space-y-2`; CardTitle `leading-none tracking-tight` →
  `tracking-[-0.01em]` (`heading` 24/32); CardDescription adds `font-sans`. Spec: README 1-4, D10, Notes part A.

**checkbox.tsx** (restyle) [restyle-a]
- `h-4 w-4 … rounded-sm border border-primary` → `size-4 … rounded-xs border border-muted-foreground`, plus
  `data-[state=checked]:border-primary`. Spec: README, D10.

**empty-state.tsx** (restyle) [restyle-a]
- Frame `bg-background border-border hover:border-border/80 … rounded-xl … hover:bg-muted/50` → `bg-card border-input
  hover:border-muted-foreground … rounded-lg …` (no hover fill). Spec: README, Notes part A, D11.
- Tiles `bg-background … rounded-xl … shadow-lg` → `bg-card … rounded-lg` (no shadow). Spec: README.
- Title adds `text-base font-semibold`; description adds `font-sans`, `mt-1` → `mt-2`; action `cn("mt-4",
  "shadow-sm active:shadow-none")` → `cn("mt-4")`. Spec: README, Notes part A.
- No `visual` prop exists to drop (the code never had one). Spec: D10, Notes.

**input.tsx** (restyle; the Kbd prompt's bundled `deps/input.tsx`) [restyle-a]
- `border-input bg-background … text-sm` → `border-muted-foreground bg-transparent … font-mono text-base md:text-sm`
  (16px below 768 so phones do not zoom). Spec: README, D10.

**kbd.tsx** (restyle) [restyle-a]
- `rounded-sm px-1 font-sans` → `rounded-xs border border-input px-1 font-mono`. Spec: README, D10.

**label.tsx, separator.tsx, collapsible.tsx, dot-text.tsx** (keep) [restyle-b]
- No edit; byte-identical to their prompts. DotText's lit dots take `text-foreground` and its unlit color is the
  computed `--border`, both from the call site (Home). Spec: their READMEs, D10.

**question-tool.tsx** (keep) [restyle-b]
- No edit beyond its section 2 changes. Only `IconQuestion` is mounted; the restyle of its class strings lives in
  question.tsx (10.5). Spec: README, D10.

**number-ticker.tsx** (restyle) [restyle-b]
- Span `inline-block tabular-nums text-black dark:text-white tracking-wider` → `inline-block tabular-nums
  text-foreground`. Spec: README, D10, D11.

**progress.tsx** (restyle) [restyle-b]
- Root `h-4 … rounded-full bg-secondary` → `h-2 … rounded-none bg-secondary`; indicator adds `rounded-none` (one
  cell tall, square). Spec: README, D10.

**radio-group.tsx** (restyle) [restyle-b]
- Item `border border-primary` → `border border-muted-foreground`, plus `data-[state=checked]:border-primary`. Spec:
  README, D10, Brand Borders.

**select.tsx** (restyle) [restyle-b]
- Trigger `border-input bg-background text-sm` → `border-muted-foreground bg-transparent text-base md:text-sm`;
  chevron `opacity-50` → `text-muted-foreground`; SelectContent loses `shadow-md`; the item's Check adds
  `text-primary`. Spec: README, D10, Notes part B.

**switch.tsx** (restyle) [restyle-b]
- Root `data-[state=unchecked]:bg-input` → `data-[state=unchecked]:bg-muted-foreground`; thumb `bg-background
  shadow-lg` → `bg-background data-[state=checked]:bg-primary-foreground`. Spec: README, D10.

**table.tsx** (restyle) [restyle-b]
- TableHead `font-medium text-muted-foreground` → `font-mono text-xs font-medium uppercase tracking-[0.08em]
  text-muted-foreground` (`label`); TableRow `hover:bg-muted/50` → `hover:bg-accent`; TableFooter `bg-muted/50` →
  `bg-muted`. Spec: README, D10, D11.

**tabs.tsx** (restyle) [restyle-b]
- TabsTrigger adds `text-muted-foreground hover:text-foreground`; `data-[state=active]:bg-background` →
  `data-[state=active]:bg-accent`; `data-[state=active]:shadow-sm` → `data-[state=active]:shadow-[inset_0_-2px_0_var(--primary)]`.
  Spec: README, D10, Notes part B.

**timeline.tsx** (restyle) [restyle-b]
- Root loses `bg-white dark:bg-neutral-950` (transparent); h2 → `font-mono text-2xl font-semibold tracking-[-0.01em] …
  text-foreground` (`heading`); description `text-neutral-700 dark:text-neutral-300` → `text-muted-foreground
  tabular-nums`; dot holder → `bg-background`; dot → `bg-muted border border-input`; both day-title h3s →
  `font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-muted-foreground`
  (`title`); track `via-neutral-200 dark:via-neutral-700` → `via-input`; beam gradient → solid `bg-muted-foreground`.
  Spec: README rows, D10, D11, Notes part B.

**stats.tsx** (restyle) [restyle-b]
- Render replaced by the README's list grid: `<div role="list" aria-label={label} className="grid grid-cols-2 gap-4
  lg:grid-cols-4">`, each figure `<CornerFrame asChild corners={["top-left", "bottom-right"]} size="16px"
  thickness="2px" inset="8px">` around `<Card role="listitem" className="p-6">` with the `label` then the `stat`
  (`whitespace-nowrap`). The `muted` band section, its container, the `divide-x` card and the inline
  `gridTemplateColumns` are gone; CornerFrame is imported. API unchanged. Spec: README, D10, Notes part B.

**tubelight-navbar.tsx** (restyle) [restyle-b]
- Bar `flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full
  shadow-lg` → `isolate flex items-center gap-2 rounded-lg border border-border bg-card p-1` (comment: `isolate` keeps
  the lamp's `-z-10` above the opaque bar). Spec: README, D10, D11, Notes part B.
- Link `… text-sm font-semibold px-3 sm:px-6 py-2 rounded-full …` + `text-foreground/80 hover:text-primary` →
  `relative flex h-10 cursor-pointer items-center rounded-sm px-3 sm:px-4 text-sm font-medium transition-colors` +
  `text-muted-foreground hover:text-foreground`; the current link `bg-muted text-primary` → `text-foreground`. Spec:
  README.
- Lamp `bg-primary/5 rounded-full -z-10` → `-z-10 rounded-sm bg-accent`; the lamp bar's three `bg-primary/20 blur-*`
  glow divs removed. Spec: README, Brand "Shadows and blur".

**wordmark-footer.tsx** (restyle, one new prop) [restyle-b]
- `const serif = "var(--font-display, …)"` and its two inline `style` uses removed. Spec: README.
- New optional `controls?: React.ReactNode`, rendered after the © line as `{controls && <div className={cn("flex
  items-center gap-2", tap)}>{controls}</div>}`. It holds the field's pause Switch. Spec: README, D10, Notes (Pause).
- Root loses `bg-background` (the footer sits on the curtain). Spec: README, Notes (Home and Surfaces step).
- Inner rows `max-w-[1200px] px-6 md:px-10` → `max-w-[1120px] px-4 sm:px-6 lg:px-8` (top and bottom). Spec: README.
- Name `text-[25px] leading-none tracking-[-0.02em]` + serif → `font-mono text-2xl font-semibold tracking-[-0.01em]`;
  description → `font-sans text-sm`; status `text-[13px]` → `text-xs`, its dot `bg-primary` → `bg-muted-foreground`.
  Spec: README, D11, Notes part B.
- Column titles (desktop and phone) → `text-xs font-medium tracking-[0.08em] text-muted-foreground`; desktop links
  `text-[14px]` → `text-sm`; phone links `text-[15px]` → `text-sm … transition-colors hover:text-foreground`; email and
  credit links add `transition-colors`. Spec: README Links and States (decision: every footer link gets the 150 ms
  hover).
- Phone rows `rounded-2xl open:bg-foreground/[0.03]` → `rounded-sm open:bg-muted`; Plus `/80` dropped. Spec: README,
  D11.
- Bottom row `text-[13px] text-muted-foreground/80` → `text-xs text-muted-foreground`. Spec: README.
- Giant wordmark: `text-[clamp(96px,24vw,360px)] leading-[0.9] tracking-[-0.04em]`, `max-md:text-[30vw]` and the serif
  → `font-mono text-[10.5vw] font-semibold leading-none tracking-[-0.02em]`; the fill's `var(--color-primary)` →
  `var(--color-foreground)` in the same fading gradient. Spec: README, D11.
- Kept as shipped: the phone nav's `-mx-4` (the open row reaches the screen edges; no page overflow), the wordmark's
  `-mb-[0.2em]`, the `status` doc comment's "green dot".

### 10.5 question.tsx (the question card, built from Question Tool's class strings)

question.tsx's `QT` strings are copied from question-tool.tsx (21st.dev code), so each change is listed. question-tool.tsx
itself is untouched. Spec: D11 (question.tsx rows), D12.7, Surfaces (Question card, Answer option, Code block),
QuestionTool README.

- [study] frame `rounded-[10px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900` →
  `rounded-lg border border-border bg-card`.
- [study] header `h-7 border-b border-neutral-200 … text-neutral-500 dark:text-neutral-400` → `min-h-8 border-b
  border-border … text-muted-foreground`.
- [study] headerLabel `gap-1.5` → `gap-2 font-mono font-medium uppercase tracking-[0.08em]` with a badge reset
  (`[&_[data-slot=badge]]:normal-case [&_[data-slot=badge]]:tracking-normal`): "Question" in the `label` style.
- [study] headerCount adds `font-mono text-sm text-muted-foreground` ("n of N" in `data`).
- [study] body `bg-white dark:bg-neutral-950` → `bg-background`; title `text-sm text-neutral-900 …` → `font-sans text-base
  text-foreground`; titleIndex `h-5 … rounded-[4px] … font-medium text-neutral-500 …` → `h-6 … rounded-xs … font-mono
  text-sm text-muted-foreground`.
- [study] optionRow `rounded-md … hover:bg-neutral-100 dark:hover:bg-neutral-800` → `rounded-sm … hover:bg-accent`.
- [study] badgeBase `h-5 min-w-5 px-1 rounded-[4px] … text-sm font-medium` → `size-6 rounded-xs … font-mono text-xs`;
  badgeOff → `bg-transparent text-muted-foreground border-muted-foreground`; badgeOn kept.
- [study] optionLabel → `max-w-[68ch] font-sans text-base text-foreground`; new optionMono `font-mono text-sm leading-6
  whitespace-pre-wrap` (`code`); optionDescription → `font-sans text-sm text-muted-foreground`.
- [study] footer `gap-1.5` → `gap-2`; Previous and Skip → `buttonVariants({ variant: "ghost", size: "sm" })` +
  `text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-60`; submit →
  `buttonVariants({ size: "sm" })` + `active:scale-[0.98] … disabled:opacity-60` (only the submit's press scales).
- [study] QuestionMeta row `h-auto min-h-7 … gap-x-3` → `… gap-x-4`; its right slot `gap-1.5` → `gap-2
  text-foreground` (a control's Label reads `foreground`).
- [study] QuestionCount pads the index to the total's width ("03 of 60"). Spec: Surfaces Numbers.
- [study] MONO_BLOCK (a focusable `<pre aria-label="Code">` that scrolled sideways) → a private `CodeBlock`:
  `<Terminal title="CODE" lines={…output lines} typewriter={false} idleCursor={false} />`. Spec: D12.7, Surfaces Code
  block, Notes part B.
- [study] QuestionText's stem adds `max-w-[68ch]`; OptionButton fills only the selected letter (`state === "sel"`), so
  a right answer's letter is no longer gold (the Correct badge carries it); review rows keep `hover:bg-transparent`.
  Spec: Surfaces Answer option, Brand Color (gold never marks correctness).
- [study] QuestionHint → `font-sans text-sm text-muted-foreground`; Explanation gaps snapped (`gap-3` → `gap-4`,
  `gap-2.5` and `gap-1.5` → `gap-2`) and every AlertTitle passes `className="font-mono"`; QuestionCard's verdict row →
  `text-foreground`, its sentence `font-sans`, stem index `padQ(q.n)`, the revealed breakdown without BlurFade (never
  for a change of state), "Try again" row `mt-3` → `mt-4`. Spec: D11, Alert and BlurFade READMEs.
- Decisions: footer buttons use Button `sm` (32px; Surfaces names the looks, not a size); QuestionFrame keeps its
  ignored `accent` prop and QuestionButton its `look` API.

### 10.6 Foundations and the curtain

**index.html** [foundations]
- `theme-color` `#000000` → `#09090b`; `<title>` `C952 Study Buddy` → `WGU Study Buddy`. Spec: D12.1, D11, D8.3.

**src/index.css** [foundations] (assembled so the theme's `:root`, `.dark` and `@theme inline` lines are copied from
`21st/theme/wgu-study-buddy-theme.css` verbatim; checked by [integrate]: both blocks appear verbatim, and of the theme's
95 declarations only `--color-radius: var(--radius);` is absent, removed on purpose by D12.2)
- Fonts: the Geist and Geist Mono latin faces kept; added `@font-face` "Geist Mono Symbols" (the fontsource symbols
  file, `unicode-range` box drawing and blocks); `--font-mono` = `"Geist Mono Variable", "Geist Mono Symbols",
  ui-monospace, "SF Mono", Menlo, monospace`. Spec: D12.2, D3.1.
- Theme: the old monochrome `:root` replaced by the theme's `:root` (32) and `.dark` (31, no `--radius`) blocks, word
  for word. A second `:root` adds `--destructive-foreground: var(--primary-foreground)`, `--field-glyph`, `--scrim:
  rgba(9, 9, 11, 0.84)`, the 13 base-badge hooks as `var()` aliases, `--corner-frame-color: var(--muted-foreground)`,
  the 13 `--motiq-*` mappings and tokens.json's spacing, z, size and focus tokens. Spec: D12.2, D2.3, D11.
- `@theme inline`: the theme's 31 mappings minus `--color-radius`, plus `--color-destructive-foreground`,
  `--color-field-glyph`, `--color-scrim`; `--radius-xs: 4px`; z-index and spacing utilities named after the tokens.
  Spec: D12.2, D5.1.
- Removed `--animate-border-beam` and `@keyframes border-beam`. Spec: D12.2.
- Base: `body` `font-sans` → `font-mono`; `.rich { font-family: var(--font-sans) }`; `.rich a:hover` `primary` with a
  150 ms color transition; `.rich code` chip (`muted` fill, `0 4px`, `radius-xs`); `@media print` hides the canvas and
  the curtain (`[data-field]`, `[data-field-scrim]` and both `data-slot`s). Spec: D12.2, D3.2, D7.4, Surfaces.

**src/components/field-scrim.tsx** (new, layout plumbing, not a 21st.dev asset) [field]
- Background.md's `FieldScrim`, `useFieldCut` and `useFieldExposed`, with three small changes: the
  IntersectionObserver callback reads the last entry; `data-field-scrim` added beside `data-slot="field-scrim"`;
  comments. The curtain is `absolute` in the App root at z `scrim`, its top at the Home hero's bottom (a
  ResizeObserver), or 0 on other routes. Spec: Background.md (Component API: FieldScrim), Notes (design review fixes).

### 10.7 App and views (call sites; no 21st.dev code)

Every page h1 is Surfaces' Title decrypt recipe (`DecryptText as="h1"`, hex glyphs, `loop={false}`, `stagger={Math.min(40,
Math.round(1000 / title.length))}`, `tabIndex={-1}`), except the exam runner's plain sr-only h1. Off-grid gaps were
snapped to the 8px cell throughout (D4): 6 and 12 → 8 or 16, 20 → 16, 10 → 8.

**src/App.tsx** [home]
- DotPattern (import, element, comments) → `<TrippinSpiral still={!fieldMotion} curtained={!fieldExposed} />` and
  `<FieldScrim />` as the root's first children; the root stays `relative`, no z-index, no fill. Spec: Background.md
  (Mount in src/App.tsx), D12.4.
- `FIELD_MOTION_KEY = "c952-field-motion"` with a try/catch read (default on) and write; `useReducedMotion()`;
  `useFieldExposed()` for `curtained`. Spec: Background.md Pause control and Energy, D7.4.
- WordmarkFooter: name and legal name "WGU Study Buddy"; description "9 course guides · 60 C952 questions · progress
  saves in this browser only" (counted from data); status "{n} of 60 C952 questions mastered"; `controls` = the
  "Animate background" Switch and its Label (`text-xs font-normal leading-4 text-muted-foreground`), `null` under
  reduced motion. Spec: Home.md Names, D8.3, Background.md, WordmarkFooter README.
- `CREDITS` columns → "ASCII language" (the seven picks), "Components" (the kept ones, collections merged in), "Also"
  (Lucide, Radix Icons, Geist); Hero Minimalism, Liquid Metal Button and Paper Shaders removed. Spec: Credits.md, D8.3.
- Tab titles: Home "WGU Study Buddy", others "<Page> · WGU Study Buddy" (`APP_NAME`). Spec: D8.3, Surfaces Routes.
- `<main>` `px-5 … md:pt-[72px]` → `px-4 … sm:px-6 sm:pt-[72px] lg:px-8`; skip link `top-3 left-3 z-[60]` → `top-4
  left-4 z-skip`. Spec: Brand Page layout, Surfaces Chrome.
- Replace-exam dialog: `<BorderBeam size={140} duration={9} />` and its import removed (the dialog frames itself);
  unused `TOPICS` import removed. Spec: AlertDialog README, D10.

**src/views/Home.tsx** [home]
- MinimalHero, LiquidMetalButton, `useHeroFit` and the secondary Button → the hero box (`max(clamp(640px, 88svh,
  760px), fit)`, `useFieldCut(heroRef)`) holding a two-corner CornerFrame window (`max-w-[640px] rounded-lg border
  bg-card p-6 sm:p-8 has-[:focus-visible]:` gold): kicker, DecryptText h1 "WGU Study Buddy" at the `display` size,
  subtitle, "Open courses" ScrambleLinkButton (filled, `hoverColor="var(--primary-foreground)"`, `openCourse(null)`
  on a plain click), Separator, "Next up", two text links with real hrefs (`h-10 text-sm font-medium`). Spec: Home.md,
  D8.1, Surfaces Title decrypt.
- Section headings: Badge eyebrows with icons → `label` text, h2 `heading`, aside `caption`; relabels "C952 questions
  mastered", "Your C952 progress", "C952 curriculum" / "C952 topics", "C952 flight plan". Spec: Home.md, D8.2,
  Surfaces Section heading.
- Mastery: DotText unlit `rgba(255, 255, 255, 0.04)` → the computed `--border`; caption line. Courses teaser:
  GlowingEffect → four-corner Target frame on the `<a>`; muted icon. Topics: BentoCard click via the plain-click guard;
  Progress rows `gap-4`. Plan rows: Checkbox `mt-1`, step text `body` sans, durations `data`; footer and 3-day list
  sentences `font-sans`. Spec: Home.md rows 1-4, Progress README, D11.

**src/views/Courses.tsx** [courses]
- Imports: GlowingEffect, GlyphMatrix, ChevronLeft out; ArrowLeft, CornerFrame, DecryptText, Terminal, BoughIndex,
  TableCaption in; `tokenColor()` removed. Type constants → the Style shorthand (`LABEL`, `LEAD`, `HEADING`, `STAT`).
  Spec: D10, D12.8, Surfaces.
- Course list: the GlyphMatrix frame → a standard page header (`grid grid-cols-1 lg:grid-cols-2 lg:gap-8`, kicker
  "Degree plan", h1 "Courses", lead) with the Course index beside it: BoughIndex in a Card `p-4` "Index", sideways
  scroll inside `mt-2 overflow-x-auto` (`w-max min-w-full`), leaves open their course (C952 goes Home). Stat tiles →
  Readout frames, plain numbers under reduced motion; sections `mt-20`, stats `mt-8`. CourseCard: GlowingEffect →
  Target frame on the `<a>`, name `subheading`, Progress `h-2` dropped. ToolsCard stays a plain window. Spec:
  Surfaces `#courses`, Course index, Stat tile, Target frame; TreeBoxDrawing, NumberTicker, Card READMEs; Notes.
- Guide page: header `mt-12 sm:mt-16` with "All courses" (ArrowLeft), code kicker, DecryptText h1, badges `mt-4`;
  sticky tab bar `top-4 sm:top-20 p-2`. Code in guides: `blocks()` splits runs of whole `<code>` lines into Terminal
  `CodeBlock`s (8 blocks in today's data), everything else stays SafeRich prose. Tables sit in windows with sr-only
  captions; practice letters `rounded-xs`, the revealed right letter `success`; "In progress" badge `secondary`;
  sources zero-padded. Spec: Surfaces `#courses/<slug>`, Code block, Table README, Badge README, Notes part A.

**src/views/exam/Setup.tsx** [exam]
- GlowingEffect and LiquidMetalButton → Button, CornerFrame, DecryptText. Header: Title decrypt "Practice Exam", lead.
  Mode cards: four-corner Target frame with `hover:`, `has-[:focus-visible]:`, `has-[[data-state=checked]]:` (none
  when disabled); icon muted; name `text-base font-semibold`. "Start exam" → `<Button size="lg">` (the view's one gold
  fill). Shortcuts row icon `size-6` muted. Spec: Surfaces `#exam`, Target frame, Button and Label READMEs, D12.8.

**src/views/exam/Runner.tsx** [exam]
- `pad(n, total)` zero-pads cells, legend, stem index and remix badges; exam bar `top-4 sm:top-20`; unanswered cells
  and the flagged swatch get `border-muted-foreground`; arrow keycaps `<Kbd><ArrowLeft /></Kbd>` and
  `<Kbd><ArrowRight /></Kbd>` (hint from `md`); gaps snapped. Spec: Surfaces Exam navigator, Kbd and Badge READMEs.

**src/views/exam/Results.tsx** [exam], [integrate]
- [exam] BorderBeam out; score card → two-corner Readout frame on `Card className="flex h-full flex-col gap-6 p-6"`;
  score `text-foreground` (`score` style), plain under reduced motion; Title decrypt "Results: {name}"; one gold fill
  (Retake, or Other modes when nothing to retake), end repeat all outline; Question map wrong cells solid
  `destructive`, numbers padded; review triggers `Question {pad(n)}`, `Q{padQ(n)}` labels; tab counts `data`. Spec:
  Surfaces `#exam` Results, Readout frame, NumberTicker and Accordion READMEs.
- [integrate] RemixWhy's AlertTitle → `className="font-mono"` (with a comment). Why: inside the review
  AccordionContent (sans) the title rendered in Geist; Alert README "Don't set the title in sans".

**src/views/Learn.tsx** [study]
- Topic picker cards: Card + button → CornerFrame on the `<button>` (`hover:`, `focus-visible:`,
  `aria-[current=true]:` gold) with the Card inside; name `subheading`; counts zero-padded. Header without BlurFade:
  Title decrypt keyed by topic, lead, Progress row (value forwarded to Radix). Sections `mt-20`; step cards → Target
  frames; arrows muted. Spec: Surfaces `#learn`, CornerFrame README, BlurFade README.

**src/views/Cheat.tsx** [study]
- Header: Title decrypt "Cheat Sheet", lead. Jump bar: `useTopChrome` removed, `sticky top-4 z-30 sm:top-20`;
  buttons always ghost `sm`, the current one `bg-accent text-foreground shadow-[inset_0_-2px_0_var(--primary)]` with
  `aria-current="location"`. "→" in the heading → lucide `ArrowRight` with an sr-only "→". Row headers `text-sm
  normal-case tracking-normal`; cells mono with prose columns `font-sans`; the nudge button `bg-card`. Spec: Surfaces
  `#cheat`, Notes (Cheat jump bar), Table README.

**src/views/Misses.tsx** [study]
- Header: `label` kicker, Title decrypt "My Misses", lead; content spacing `mt-8`; cards "Question {padQ(n)}"; mono
  answers `code`; the end repeat outline; the clear flow focuses "Take a practice exam" through `onCloseAutoFocus`
  (fixes an aria-hidden focus warning). Spec: Surfaces `#misses`, Notes (one gold fill per view).

### 10.8 Manifests (D12 item 10) [integrate]

No prompt file was changed. 37 manifests' `sha256` did not match their prompt file's bytes; each now has `sha256` =
SHA-256 of the file bytes, `sha256Of: "file bytes"`, the old value as `capturedSha256`, and a `note` with the cause.
- Cause, proven by recomputation for all 37: each captured value is the SHA-256 of the prompt text with the trailing
  spaces cut from its line ends and without the final newline. Every file keeps the 21st.dev template's two
  trailing-space lines (line 4 "- shadcn project structure" plus 2 spaces, line 10 plus 1 space; glowing-effect has 2
  more, dot-text a whitespace-only line, empty-state 7 import lines) and a final newline. So the difference is
  trailing spaces plus the trailing newline: no CRLF, no blank-line collapse, no content change. `chars` is the text's
  UTF-16 length and equals each file's.
- Blur Fade (manifest 2563 characters, file 2562): no character is missing. Line 92, demo.tsx's "Hello World" heading,
  ends in U+1F44B WAVING HAND SIGN: one code point, two UTF-16 code units, and `chars` counts code units. The captured
  hash reproduces from the saved file, so the file is the whole captured text; it was not re-captured.
- `ascii--trippin-spiral.json`: `recipeUrl`
  (https://21st.dev/community/ascii/trippin-spiral-fa23bfd9-dad9-49f9-be46-6f4ce2e61c29) and `author: "jobsrip"`
  added from `21st/reference/ascii-trippin-spiral.md`; the page shows no license (`license: "not listed"`).
- Now 45 of 46 manifests match their prompt file byte for byte; `shadcn--badge.json` has no prompt (404, not
  collected). The seven ASCII manifests and the theme's already matched and are otherwise unchanged.

### 10.9 Notes for callers

- ConveyorLoop (first caller): pass the color only (`className="text-primary"`), since `text-xl` through `cn()`
  drops the base `leading-none` and drops the track 4px; add `shrink-0` in a flex row beside wrapping text; set
  `--mask-color` to the surface (`var(--card)` on cards); add `motion-reduce:[&>[style]]:hidden` (Notes part B).
- DecryptText renders a `<style>` inside the h1, so `h1.textContent` includes CSS text: read the title string or the
  sr-only span, never the h1's text.
- AlertTitle has no `font-mono` of its own: inside a sans container (AccordionContent, `.rich`) pass
  `className="font-mono"`.
- tailwind-merge does not know the token utilities `z-field` … `z-skip`, `h-control-*` or `p-cell`; inside `cn()` use
  the literal classes (`-z-20`, `h-10`) when a caller must override them.
- After a keyboard-driven route change the focused h1 shows the global 2px `ring` outline (the recipe has no
  `outline-none`; Brand Focus keeps `:focus-visible` everywhere). After a mouse click it does not.
- Terminal lines that wrap continue at the left edge, not under the prefix (no hanging indent, as specified).

### 10.10 Checks [integrate]

- `npx tsc -p tsconfig.app.json --noEmit`: no errors. `npm run build`: passes, 2,714 modules, `dist/index.html`
  1,550.58 kB (524.03 kB gzip), no warnings. `C952_Study_Buddy.html` was not regenerated (`npm run build:file`).
- Dev server (own port) and `vite preview` of `dist`, each at 1280x800 and 375x812: `#home`, `#courses`,
  `#courses/c960`, `#courses/d687` (and `#courses/c949`), `#learn`, `#cheat`, `#exam` (setup, a run, results) and
  `#misses` each render one h1 with the right text, settled to real text, and the right tab title; no horizontal page
  scroll at 375; the field animates on every route; the curtain starts at the Home hero's bottom (776 px at 1280, 779
  px at 375) and at 0 elsewhere; every Alert title is mono; Geist, Geist Mono and Geist Mono Symbols load from the
  single file; the console shows nothing from the app.
- Not checked: the OS reduced-motion setting (each step used a `matchMedia` stub), print, touch swirl, screen-reader
  speech, the 640-767 px band, the field's redraw cost on target hardware.

### 10.11 Open items for the design system

The spec files were read-only in this run; these are for the designer.
- Background.md and the TrippinSpiral README still give the specified glyph baseline, halftone radii, per-redraw digit
  and `Math.hypot`; the app ships the four deviations in 10.3 (one-line reverts).
- Home.md row 10, Surfaces' navigation call to action and the ScrambleLinkButton README text variant: the className
  lacks `font-medium` although the row names the `ui` style (500); the app adds it.
- Background.md's Pause control and the WordmarkFooter README: the Label snippet needs `font-normal leading-4` to give
  `caption`; the app adds it. The Label README's "never `muted-foreground` for an enabled control's Label" conflicts
  with that snippet; the app follows Background.md.
- Home.md section headings: say whether the aside must wrap under the h2 below 640 px even when it fits.
- BlurFade README: "0.25 for small, repeated items (Learn uses it)"; only the exam runner's question body uses 0.25.
- Credits.md line 3: the checksum caveat can go (10.8).

---

## 11. Course-aware build (v3, 2026-11-20)

The course-aware app of `design-system/wgu-study-buddy/_work/design-v2/` (decision.md, with its section 6
amendments; CHANGES.md; the project docs and the v2 component READMEs), built by six builders against
`_build/CONTRACTS.md`. Each builder that changed a file in `src/components/ui/` ended its report with a "For
21st/INTEGRATION.md" list, and integrate merged those lists here (CONTRACTS, Ownership). Where this section and
sections 1-10 differ, this one wins.

Step tags: **[shell-nav]** the bar, the course switcher and App · **[shell-frame]** the footer, the field and the call
to action · **[courses]** Courses and the Course index · **[c952-tools]** C952's Learn, Cheat Sheet, Practice Exam and
My Misses · **[guide-tools]** the nine guides' tools · **[ui-primitives]** the shared primitives.

Spec references: decision N = design-v2 `decision.md`; CHANGES = design-v2 `CHANGES.md`; README v2 = the component's
README in design-v2; Responsive = design-v2 `project/Responsive.md`; CONTRACTS = `_build/CONTRACTS.md`.

No prompt, manifest or checksum changed in this step: `21st/prompts/`, `21st/manifest/` and `21st/staged/` are as
section 10 left them. [guide-tools] changed no file in `src/components/ui/`. `src/views/Home.tsx` and
`src/components/ui/bento-grid.tsx` (BentoCard's optional `focusKey`, decision 53) are being built in a separate step,
which logs its own entries.

11.1 Component changes · 11.2 question.tsx · 11.3 Notes for the design system · 11.4 Open items

### 11.1 Component changes

**src/components/ui/tubelight-navbar.tsx** [shell-nav]
- NavItem gains optional `ariaLabel` (the link's accessible name), `count` (aria-hidden, shown after the icon in icon
  cells, with a 2ch slot kept in the top bar), `reserve` (an invisible copy that sets a named link's width) and
  `focusKey` (written as `data-focus-key` on the link). Decisions 9, 13, 34; CONTRACTS convention 3.
- New `slot` and `slotAfter` (default 2) props: one extra cell after the item at `slotAfter`, which never takes the
  lamp. Decision 14.
- Below 640 the wrapper is `fixed inset-x-0 bottom-0` (no `mb-6`, no translate) and the bar a docked `grid-cols-7`,
  `rounded-t-lg`, `border-b-0`, with safe-area padding and `h-12` cells. From 640 the wrapper is `sm:left-1/2
  sm:-translate-x-1/2 sm:top-0 sm:bottom-auto sm:pt-[max(24px,env(safe-area-inset-top))]
  sm:short:pt-[max(8px,env(safe-area-inset-top))]`, and the bar `sm:flex sm:gap-2 sm:rounded-lg sm:p-1`.
  Decisions 10-12.
- Links `px-3 lg:px-4` (was `px-3 sm:px-4`); names hidden until `min-[744px]:inline`, icons `min-[744px]:hidden` (was
  `md:`); `sm:pointer-coarse:h-11 sm:pointer-coarse:min-w-11` and `pointer-coarse:active:bg-accent`. Decisions 10, 12,
  36 and 39.
- An overflow guard (a ResizeObserver on an invisible, aria-hidden copy of the named row) shows icons whenever the
  named bar is wider than the viewport less twice the gutter. Decision 13.
- `print:hidden` on the wrapper; `forced-colors:underline` on the current link; the lamp bar gets
  `forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight]`. The unused `isMobile` state is removed.
  Decisions 34 and 43.
- The wrapper is `pointer-events-none` and the bar `pointer-events-auto`, so the transparent band above the floating
  bar no longer swallows clicks on the page under it. README Accessibility ("The wrapper must not cover the page").

**src/components/ui/select.tsx** [shell-nav]
- SelectTrigger gains `pointer-coarse:h-11` (no touch text size), and `focus:outline-none` becomes
  `focus:outline-hidden`. Decisions 12, 36 and 38.
- SelectItem gains `pointer-coarse:min-h-11`, `focus:outline-hidden`, and `pointer-coarse:active:bg-accent
  pointer-coarse:active:text-accent-foreground` (press paint). Decisions 17, 38 and 39; CONTRACTS "Press paint on
  touch".

**src/components/ui/wordmark-footer.tsx** [shell-frame]
- New optional props `license?: { label: string; href: string }`, rendered as " · {label}" as a link after the ©
  text (muted turning to foreground, tap-sized on touch), and `notice?: string`, its own caption line (after the ©
  line below 640, under the row from 640). The bottom row wraps from 640 (`sm:flex-wrap sm:gap-x-6 sm:gap-y-2`). Both
  rows' gutters take the safe-area insets: max(16, 24 or 32px, `env(safe-area-inset-left/right)`). The controls
  wrapper is hidden in print (`print:hidden!`). Decisions 39, 43, 44 and 45; WordmarkFooter README v2.

**src/components/ui/trippin-spiral.tsx** [shell-frame]
- Restarts on `pageshow` when `persisted`. While curtained on a coarse pointer, only `click` and `keydown` count as
  input and the frame holds after 10 s; fine pointers keep the 60 s hold, and `click` joins the idle events. Decision
  42; TrippinSpiral README v2 and Background.md (Pausing, Energy).

**src/components/ui/scramble-link-button.tsx** [shell-frame]
- The press-to-scramble test `(max-width: 1024px)` (`COMPACT_LAYOUT_BREAKPOINT` 1025) becomes "not (hover: hover)
  and (pointer: fine)", as `FINE_HOVER_QUERY` negated in JS. An iPad Pro at 1366 now scrambles on press and a narrow
  desktop window on hover; the listener drops its `as any` cast. Decisions 38 and 40; ScrambleLinkButton README v2.

**src/components/ui/tree-box-drawing.tsx** [courses]
- New `selectedId?: string` controls the selection (`aria-selected` and the `bg-accent` row follow it). Without it
  the tree keeps its own selection, as shipped. Decision 32; TreeBoxDrawing README v2; CHANGES step 4.
- `onSelect(node, event?)` now passes the row's click event as a second argument (absent for Enter and Space), so a
  modified click can open a new tab. CONTRACTS assignment "Index leaves and modified clicks"; Responsive, Laptops
  (Modified clicks).
- New `onToggle?: (node) => void`, called whenever a group opens or closes, by click, Enter, Space, ArrowRight or
  ArrowLeft. TreeBoxDrawing README (re-key on the 1024px query until the first toggle); CHANGES finding 21; the
  1024-1439 acceptance row.
- `BoughNode` gains an optional `focusKey`, written as the row button's `data-focus-key`. CONTRACTS convention 3;
  decision 33.
- Focusing a row button now moves the roving position, so keys act on the focused row when focus comes from outside
  the tree (the router's restore after Back). Before, Enter acted on the old position. Decision 33; the WAI-ARIA tree
  pattern.

**src/components/ui/stats.tsx** [courses]
- Below 400px each tile pads `p-4` (`max-[400px]:p-4`) and its value clamps
  (`max-[400px]:text-[clamp(32px,10vw,40px)]`). Decision 40; Stats README v2; CHANGES step 7; Responsive "Below 400".

**src/components/ui/button.tsx** [ui-primitives]
- On touch, `sm` and default buttons are `min-h-11` and icon buttons `size-11`; focus uses `outline-hidden` (forced
  colors paint it); each variant shows its hover paint while pressed on touch (`bg-primary/90`, `bg-accent` +
  `text-accent-foreground`, `bg-secondary/80`, `bg-destructive/90`, link `text-primary`). Decisions 36, 38 and 39;
  CONTRACTS Assignments (press paint).

**src/components/ui/tabs.tsx** [ui-primitives]
- TabsList is `h-auto` on touch; TabsTrigger is `min-h-11` on touch, presses to `text-foreground`, and is underlined
  when active in forced colors; TabsTrigger and TabsContent focus use `outline-hidden`. Decisions 34, 36, 38 and 39;
  Tabs README v2.

**src/components/ui/input.tsx** [ui-primitives]
- On touch, `h-11` with 16px text; focus uses `outline-hidden`. Decisions 36 and 38; Input README v2.

**src/components/ui/checkbox.tsx, src/components/ui/switch.tsx, src/components/ui/radio-group.tsx** [ui-primitives]
- Checkbox and Switch: `focus-visible:outline-hidden`; Radio Group: `focus:outline-hidden`. Decision 38; Checkbox,
  Switch and RadioGroup READMEs v2.

**src/components/ui/empty-state.tsx** [ui-primitives]
- The frame pads `p-8` below 640 and `p-14` from 640. Decision 40; EmptyState README v2.

**src/components/ui/timeline.tsx** [ui-primitives]
- Below 640 the header block is `px-0 py-8` and entries `pl-14`; from 640 as shipped (`sm:px-4 sm:py-20`,
  `sm:pl-20`). Decision 40; Timeline README v2.

**src/components/ui/terminal.tsx** [ui-primitives]
- Lines wrap long tokens (`[overflow-wrap:anywhere]`) and never scroll sideways; the line marker sits in a 2ch gutter
  (absolute) and wrapped lines hang 2ch past the code (`relative pl-[4ch] -indent-[2ch]`). Decision 40; Terminal
  README v2, with the deviation from its `pl-[2ch] -indent-[2ch]` filed for the docs (11.3). This replaces section
  10.9's note that wrapped Terminal lines continue at the left edge.

**src/components/ui/alert-dialog.tsx** [ui-primitives]
- The content caps its height at 100dvh minus 2rem and both vertical insets, and scrolls inside; the footer stacks
  full-width buttons with `gap-2` below 640 (Cancel last) and is a row with the same 8px gap from 640;
  AlertDialogCancel no longer carries `mt-2 sm:mt-0`. Decision 40; AlertDialog README v2.

**src/components/ui/blur-fade.tsx** [ui-primitives]
- Under `prefers-reduced-motion` the content renders in its final state at once (no fade, no rise). Decision 37;
  README Motion table (BlurFade: None).

**src/components/ui/number-ticker.tsx** [ui-primitives]
- Under `prefers-reduced-motion` it shows the final value at once instead of counting. Decision 37; the call sites'
  plain-value fallback (Results, Courses) still works.

**src/components/ui/question-tool.tsx** [c952-tools]
- Unchanged (Fate: Keep).

**src/components/ui/progress.tsx** [verify fixes, round 1]
- The Indicator is sized by `width: {value}%` with `transition-[width]` instead of `w-full flex-1` shifted by
  `translateX(-{100 - value}%)`: at 0% nothing paints, where the shifted bar left a 1px gold edge on a fractional
  pixel (design-copy-DC-3). Same look at every other value.

**src/components/ui/bento-grid.tsx, stats.tsx, kbd.tsx, input.tsx** [verify fixes, round 1]
- Each gains its original credit line and "Modified by Dorian Acosta for WGU Study Buddy (MIT)" (decision 47); Stats,
  Kbd and Input keep "license not listed; permission pending" (decision 48). No code change.

### 11.2 question.tsx (the question card, built from Question Tool's class strings) [c952-tools]

`src/components/question.tsx` is the app's copy of `question-tool.tsx`'s classes (section 10.5).
- Option rows add `pointer-coarse:min-h-11` and the `pointer-coarse:active:bg-accent` press paint; review and locked
  rows add `pointer-coarse:active:bg-transparent`. Decisions 36 and 39; CONTRACTS Assignments (Press paint).
- OptionButton gains `locked?: boolean` (default false): `aria-disabled="true"` with focus kept, no onClick, no
  `aria-pressed`, the review-row look; `disabled` is unchanged. CONTRACTS Assignments (change request); CourseTools
  Practice and the QuestionTool README, States: Locked.
- QuestionCard's "I've got this" Checkbox row becomes the 44px target on coarse pointers (`pointer-coarse:min-h-11`,
  the Label stretched; the box stays 16px). Decision 36; Checkbox README.
- The medium-confidence note reads "This answer follows the textbook's reasoning. Learn the why so you can still pick
  the best answer if your exam words it differently." Decision 29.

### 11.3 Notes for the design system

The design docs were read-only for the builders; these are for the designer.
- Button README v2 says the press paint comes from `src/index.css`; under CONTRACTS Assignments it lives in
  `button.tsx` [ui-primitives].
- Terminal README v2 gives `pl-[2ch] -indent-[2ch]` for the hanging indent; the app needs `relative pl-[4ch]
  -indent-[2ch]` with the marker in an absolute 2ch gutter (11.1) [ui-primitives].
- TreeBoxDrawing README: "What you provide" and "Source and changes" should add `onSelect`'s optional second argument
  (the click event), `onToggle?(node)`, `BoughNode.focusKey?` (written as `data-focus-key`) and the roving position
  following focus. Its example freezes the fold key in `onSelect`, which never runs for an ArrowLeft or ArrowRight
  toggle, so a later resize across 1024px refolds the tree and drops focus to `body`; freeze it with
  `onToggle={() => setKept(foldKey)}` [courses].

### 11.4 Open items

- `wordmark-footer.tsx`, `dot-text.tsx` and `conveyor-loop.tsx` carry no original 21st.dev credit line, so their
  "Modified by Dorian Acosta for WGU Study Buddy (MIT)" line has nothing to follow (Credits, Author; decision 47).
  Their credits: Footer with Big Wordmark by vilqor, Dot Text by jahed and Conveyor Loop by loading-ui, each MIT with
  its 21st.dev page (`THIRD_PARTY_NOTICES.md`, section 3) [shell-frame's change request].
- Three assets in the app list no license on their 21st.dev pages: the trippin spiral recipe, the Kbd prompt (with
  its Input) and Stats. `THIRD_PARTY_NOTICES.md` marks them "license not listed; permission pending"; they block the
  public release until their terms are confirmed or they are replaced (decision 48). The retired Hero Minimalism
  lists no license either; its code left the app, but its saved prompt in `21st/prompts/` ships with the repository.

---

## 12. Degree plan and study features (v4, 2026-11-21)

The owner's requests of Nov 21, in design-v2 `decision.md`: decision 55 (the whole degree plan: 29 courses in nine
subject groups, guides fetched on demand) and decisions 56 to 59, four study features: completed courses, flashcards,
exam dates with pacing, and a progress backup. Four parts built the features at the same time against one brief, each
owning its own files. Where this section and sections 1-11 differ, this one wins.

Step tags: **[degree-plan]** decision 55 · **[completed]** Courses and the course switcher (decision 56) ·
**[flashcards]** Practice, the Cheat Sheet and My Misses (decision 57) · **[status]** the course status on Learn and
Home (decisions 56 and 58) · **[backup]** the progress backup on Courses (decision 59).

Spec references: decision N = design-v2 `decision.md`; the project docs (`design-system/wgu-study-buddy/project/`),
updated for these decisions after the build: CourseTools (Course status; Practice, Flashcards; Backup and restore),
Surfaces (`#courses`, `#exam/<slug>`, Completed toggle), Home (The status card), Navigation (The course switcher) and
the component READMEs.

12.1 Component changes · 12.2 The new app component · 12.3 Call sites · 12.4 Notes for the design system

### 12.1 Component changes

No file in `src/components/ui/` changed in this step: every collected component is as section 11 left it. No prompt,
manifest or checksum changed (`21st/prompts/`, `21st/manifest/` and `21st/staged/` are untouched), and no npm package
was added. Everything below composes the collected components at their call sites.

**src/components/ui/conveyor-loop.tsx** [degree-plan]
- Unchanged, and now mounted for the first time (section 10.1's table points here): `src/views/course/GuideGate.tsx`,
  the guide-loading state. On the hosted build a guide is fetched the first time one of its tools opens (the active
  course's guide preloads, so this is rare). Until it arrives the tool shows its page header (the course code and
  the tool's h1) and a window, `<Card className="mt-8 max-w-[680px] p-4">` (the failure Alerts' frame, width and
  margin), holding a `<p role="status">` line, `flex items-start gap-3 font-mono text-sm text-muted-foreground`:
  `<ConveyorLoop trackLength={12} aria-hidden="true" className="shrink-0 text-primary
  motion-reduce:[&>[style]]:hidden" style={{ "--mask-color": "var(--card)" }} />`, then "Loading the study guide…".
  A failed fetch shows a `role="note"` Alert instead, with "Try again" (offline) or "Reload page" (the site was
  redeployed), and an always-mounted sr-only `<p role="status">` says the failure. Decision 55; the call follows
  section 10.9 and the ConveyorLoop README, and 12.4 says what was fixed after the build.

### 12.2 The new app component

**src/components/completed-toggle.tsx** [completed] (new; the app's own code, no 21st.dev prompt)
- `CompletedToggle({ code, pressed, onPressedChange, withCode?, size? })`, composed from the collected Button
  (`button.tsx`, unchanged): `variant="outline"`, `size` sm by default, `type="button"`, `aria-pressed`, `gap-2`; the
  lucide Circle, or CircleCheck when pressed (`size-4`, `aria-hidden`), then "Completed", the same words in both
  states; the pressed paint `aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground`.
  `withCode` adds `<span className="sr-only">: {code}</span>` to the name. It forwards its ref and the other button
  props. No gold: Courses, Learn and the Cheat Sheet have no gold fill. Decision 56; Surfaces, Completed toggle.
- Every Completed toggle in the app is this one. The caller writes the mark with `markCompleted`
  (`src/lib/course.ts`) and says `completedText` ("D278 marked completed.") in its own always-mounted sr-only
  `role="status"` line.

### 12.3 Call sites

**src/views/Courses.tsx** [completed]
- Degree progress, under the four stat tiles: BlurFade (`delay={0.21}`, `mt-4`), a Card `p-6 max-[400px]:p-4` with a
  `label` line, the counts in mono `text-sm`, and a Progress (`aria-label="Degree progress"`,
  `aria-valuetext="{done} of {total} courses completed"`) with its `%`. Decision 56.
- Tabs "Which courses": the TabsList in a `flex overflow-x-auto` row, triggers "All {n}", "Remaining {n}",
  "Completed {n}" with `max-[400px]:px-2 max-[360px]:px-1`, one TabsContent per list; an EmptyState ("No completed
  courses yet" with CircleCheck, or "Every course completed" with GraduationCap; action "Show all"). The subject
  sections render only the groups with cards on the list; a chosen list shows without BlurFade.
- CourseCard: the CornerFrame on the link is unchanged. A `relative` wrapper adds CompletedToggle (`withCode`) as the
  link's sibling at `absolute bottom-[calc(1.5rem+1px)] left-[calc(1.5rem+1px)]`, over an `aria-hidden` slot (`h-8
  pointer-coarse:h-11`) at the end of CardFooter, so hovering or focusing it never lights the brackets. A completed
  card adds Badge `variant="success" appearance="light"` with Check, "Completed".
- `<ProgressBackup store={store} />` after the subject sections, before the disclaimer.

**src/components/course-switcher.tsx** [completed], with **src/App.tsx** passing it `store`
- A completed course's SelectItem text adds `<span className="sr-only">,</span>`, a space and `<span className="ml-1
  indent-0 font-mono text-xs text-muted-foreground">Completed</span>` inside the item's text span, so the caption is
  part of the option's name. SelectContent from 640: `w-[592px]` (was `w-[512px]`): D459's 54 characters plus the
  caption, the check column, the padding and the border are 580.8px. No Badge, icon or check. Decisions 14, 17 and
  56; Navigation, The course switcher.

**src/views/course/GuidePractice.tsx** [flashcards]
- "Practice with": a `label` `<p>` naming a RadioGroup (`aria-labelledby`, `mt-2 grid max-w-[520px] grid-cols-2
  gap-4`) of two ModeCards, each a CornerFrame target frame (`hover:`, `has-[:focus-visible]:`,
  `has-[[data-state=checked]]:` gold) on a Card `p-4` holding the lucide ListChecks or Sigma (`size-6`), a
  RadioGroupItem and its Label. Only when the guide has questions and key facts. The header's Progress follows the
  mode (`aria-label` "Got it" or "Knew it"). Decision 57.
- Questions mode keeps its Tabs, question windows, Alert and EmptyState; its list now lives in the page, so a mode
  switch keeps it.

**src/views/course/GuideFlashcards.tsx** [flashcards] (new view)
- Tabs "Which cards" (triggers `max-[360px]:px-2`; one TabsContent whose `value` follows the list, so the card window
  stays mounted); Alert `role="note"` "Every card knew it" (CircleCheck); EmptyState "Nothing here" (ListChecks),
  action "Show all"; for the card, question.tsx's QuestionFrame, QuestionMeta, QuestionCount, QuestionFooter and
  QuestionButton (`look="nav"`, `aria-disabled` at the ends); Badge (outline "F07", success light "Knew it" with Check,
  destructive light "Study again" with X); Button (default "Show answer" with Eye, "Knew it", and the end's next
  action; outline "Study again"; ghost "Hide answer" with EyeOff); BlurFade only when Flashcards is the page's first
  view.

**src/views/course/shared.tsx** [flashcards]
- New `FactAnswer` beside GuideAnswer: an Alert `role="note"` (Check, "Answer") holding the value in `font-mono
  text-sm leading-6` and the note muted, both `[overflow-wrap:anywhere]`, `tabIndex={-1}` for the focus after "Show
  answer".

**src/views/course/GuideCheat.tsx** [flashcards]
- After the Key facts table: a Separator (`mt-8`), a `body-sm` line, and `Button variant="secondary" asChild` on `<a
  href="#exam/<slug>">` with ClipboardCheck, "Drill as flashcards" (`data-focus-key="cheat:drill-flashcards"`), whose
  plain click opens Practice on Flashcards. Decision 57.

**src/views/course/GuideMisses.tsx** [flashcards]
- No component change: "Practice my misses" (both) and "Start practicing" now name `practiceMode: "questions"`.

**src/views/course/CourseStatus.tsx** [status] (new view part)
- CompletedToggle; a ghost sm Button as the CollapsibleTrigger ("Set exam date" with CalendarPlus; "Change" or
  "Close" with CalendarDays) and "Clear date" (CalendarX); Collapsible, controlled, its root `role="group"` with
  `aria-labelledby` when visible text names it; Label "Exam date"; Input `type="date"` (`min` today,
  `max="9999-12-31"`, `w-full max-w-[240px] aria-invalid:border-destructive`); CircleAlert in the invalid hint. No
  gold. Decisions 56 and 58.

**src/views/course/GuideLearn.tsx** and **src/views/Learn.tsx** [status]
- CourseStatus in the page header after the research line (`mt-6`); on C952's Learn after the Progress row, under a
  `label` caption "C952 · Course status" (`mt-6`) that names it, with `withCode`.

**src/views/Home.tsx** [status]
- The status card: BlurFade `inView` (`mt-6`), a Card with CardTitle "{CODE} exam" (its id names CourseStatus's
  group) and CardDescription, CourseStatus in CardContent. The hero's gold ScrambleLinkButton reads "Start next
  course" once the course is completed (`aria-label` "Start next course, {NEXT CODE}"); the text links add "Review
  {CODE}" (`home:review`); a `caption` muted `<p>`, the exam countdown, follows Next up's description; the teaser's
  CardDescription adds the degree's progress. Decisions 56 and 58.

**src/views/ProgressBackup.tsx** [backup] (new view part; the file work is `src/lib/backup.ts`)
- The section's Heading (kicker "Backup", h2 "Your progress"); BlurFade `inView`; a Card `p-6` with CardDescription;
  two outline Buttons, "Save backup" (Download) and "Restore from file" (Upload); a hidden `<input type="file">`, no
  form; Alert `role="note"`, "Progress restored" (CircleCheck) or, destructive, the errors (TriangleAlert);
  AlertDialog "Replace your progress?" with AlertDialogCancel "Keep my progress" and AlertDialogAction
  `buttonVariants({ variant: "destructive" })` "Replace progress". Decision 59.

### 12.4 Notes for the design system

The design docs were updated for decisions 55 to 59 after the build. Three notes about GuideGate were left here for
the designer; all three are now fixed in `src/views/course/GuideGate.tsx`, and the ConveyorLoop README, Surfaces
(Wait, Alert, Loader, `#learn/<slug>`), Responsive, CourseTools and the project README describe it as built.
- Fixed: ConveyorLoop's first caller (GuideGate) follows the ConveyorLoop README and section 10.9. Its loading line
  sat on the dimmed field and set no `--mask-color`, so each block painted the default `var(--background)` square
  over the field (README, When not to use); it kept the default `trackLength` (10), passed `text-base` (a size
  through `cn()` drops the base `leading-none`) and had no `motion-reduce:[&>[style]]:hidden` and no `shrink-0`, so
  at 320 its row (96 + 12 + 201.6px of text) was wider than the 288px column and the loader shrank. Now the line
  sits in a window, `<Card className="mt-8 max-w-[680px] p-4">` (the failure Alerts' frame, width and margin), with
  `--mask-color: var(--card)`; the loop takes `trackLength={12}` and `className="shrink-0 text-primary
  motion-reduce:[&>[style]]:hidden"`, the color only, so it keeps the base `text-xl` and `leading-none` (144px); and
  the line is `items-start`. At 320 the words wrap in the 98px beside the whole track, the loop on their first line;
  under reduced motion the blocks hide and the still track stays [degree-plan].
- Fixed: GuideGate's two error Alerts ("Couldn't load this study guide", "This study guide was updated") passed no
  `role`, so they were `role="alert"`. Both are `role="note"` now, and an always-mounted sr-only `<p role="status">`
  says the failure as "{title}. {sentence}", and "Trying again…" while a retry runs, so a second failure is heard
  again. "Course not found" stays the app's one `role="alert"` (Alert README) [degree-plan].
- Fixed: GuideGate's "Trying again…" spun its RotateCw (`motion-safe:animate-spin`). The icon holds still now; the
  button stays in place with `aria-disabled` while it retries and reads "Trying again…" (README, Iconography: a wait
  is ConveyorLoop's blocks, never a spinning icon) [degree-plan].
