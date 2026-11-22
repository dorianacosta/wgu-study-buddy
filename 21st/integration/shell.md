# Page step: shell and Home

Files: `src/App.tsx` and `src/views/Home.tsx`. `src/views/types.ts` did not change.
UI files I changed (only my pages use them): `tubelight-navbar`, `hero-minimalism`, `stats` and `bento-grid`.
UI files I used without changing them: `dot-pattern`, `wordmark-footer`, `liquid-metal-button` and `dot-text`.
`tsc` reports 0 errors in these files. The only errors left are the two in `src/components/kit.tsx`.

## Deviations from the prompts' code (file — what changed — why)

- `src/components/ui/tubelight-navbar.tsx` — the link padding `px-6` became `px-3 sm:px-6` — layout fix. With the app's six items, the icon-only pill was 466px wide on a 375px phone. It spanned -45 to 421px, so Home and My Misses were off-screen (measured). Now it is 322px wide and fits. At 640px and up, nothing changed.
- `src/components/ui/hero-minimalism.tsx` — added optional props `brand`, `cta`, `kicker`, `title`, `subtitle`, `tag`, `heading`, `desc` and `credit`, and exported `HeroLink` and `MinimalHeroProps` — props for content. All copy was hardcoded Dali Agents text. Each prop defaults to the prompt's own copy, and `credit={null}` hides the credit link.
- `src/components/ui/hero-minimalism.tsx` — the `cta` slot replaces the header button when a value is passed. By default the slot still shows the prompt's `alert()` button — props for content: Home puts the LiquidMetalButton in this slot.
- `src/components/ui/hero-minimalism.tsx` — the brand and credit links take an optional `onClick`, and they get `target="_blank"` and `rel` only when the href is `http(s)` — routing. In-app `#hash` links must stay in the same tab and use the app's `replaceState` navigation. The default links are external, so they behave as before.
- `src/components/ui/hero-minimalism.tsx` — added an optional `style` prop on the root `<section>` — layout. The component's unlayered `<style>` makes the root a fixed 100vw × 100vh overlay, and only an inline style can override it. Home passes `position: relative; width: 100%; height: clamp(640px, 88svh, 760px)`.
- `src/components/ui/hero-minimalism.tsx` — the inner `<main className="hero">` became `<div className="hero">` — landmarks (labels are on the KEEP list). The app already has `<main id="app">`, so this made a second, nested main landmark. The CSS targets `.hero`, so the look did not change. The app now has one `<main>` (checked).
- `src/components/ui/hero-minimalism.tsx` — when `prefers-reduced-motion: reduce` is set, the particle canvas draws one frame and does not loop. It redraws once on resize — reduced motion (KEEP). MotionConfig and the CSS kill-switch don't reach a canvas `requestAnimationFrame` loop. Checked: normally the canvas changes between frames, and with reduced motion it stays static.
- `src/components/ui/stats.tsx` — the Card gets an inline `gridTemplateColumns: repeat(stats.length, minmax(0, 1fr))` — props for content. Home shows four figures, and `grid-cols-3` pushed the fourth onto a second row. With three figures the style equals `grid-cols-3`, so the prompt's default is unchanged.
- `src/components/ui/bento-grid.tsx` — added an optional `onClick` on BentoCard's call-to-action `<a>`, plus the `MouseEventHandler` type import — routing. The call to action has to open that topic in Learn, which `openTopic` does by setting the topic and calling `replaceState`. A plain `#learn` href can't carry the topic.
- `src/components/ui/bento-grid.tsx` — added `group-focus-within:` variants that mirror `group-hover:`: on the content block (`-translate-y-10`) and on the call-to-action row (`translate-y-0 opacity-100`) — focus management (KEEP). The call to action is `opacity-0` until hover, so keyboard users tabbed onto an invisible link. The look on mouse hover is unchanged. Checked: when the link is focused, the row is at opacity 1, translate 0, and the content moves up 40px.

## How the components are used (no component change)

- App: `NavBar className="sm:bottom-auto"`. The component sets `bottom-0` and adds `sm:top-0`, so at 640px and up its transparent wrapper stretched to the full height of the screen. At 1440×900 it was 876px tall, and `elementFromPoint` in the page's center column hit the wrapper, so clicks there were swallowed (measured). With `bottom: auto`, the wrapper is 70px tall and clicks reach the page. Anyone else rendering this navbar needs the same fix.
- App: `NavBar` is wrapped in `<nav aria-label="Main">`, because the component's root is a div and gives no navigation landmark. Items are `{ name, url: "#view", icon }`. `activeTab` comes from the current view, so the highlight follows the route on deep links, Back/Forward and in-page links (checked). `onNavigate` ignores modifier clicks and calls `preventDefault`, then `go()` (`replaceState`), or `openCourse(null)` for Courses (`pushState`, as before). Checked: Back and Forward move the highlight, `#courses/c952` highlights Courses, and after a page change focus goes to the new page's h1.
- App: the nav labels join their words with non-breaking spaces. The pill is fixed at `left: 50%`, so its shrink-to-fit width is capped at 50vw, and without the spaces multi-word labels wrapped inside the pill at desktop widths. Measured pill width: 740px at 1440px wide, and 762px at 768px with "My Misses 20", the longest possible label (it fits).
- App: the My Misses count is part of the label, for example "My Misses 20". Below md the component shows icons only, so on phones the count is in the `aria-label` only. It also appears on Home's "To review" figure.
- App: `DotPattern className="fixed [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"` is the demo's radial mask. The pattern is pinned to the screen, so the circle stays centered in the viewport instead of the middle of a 6000px page. It renders before `main` and the footer, which are `relative` and paint above it. `fill-neutral-400/80` is already monochrome.
- App: the WordmarkFooter shows:
  - wordmark `C952`, with legalName "C952 Study Buddy" in the © line;
  - description: "60 questions · 8 topics · progress saves in this browser only";
  - status: "N of 60 questions mastered". This replaces the old header's mini mastery dial, which was on every page;
  - link columns "Components", "Collections" and "Also": the 21st.dev pages of the components and their authors, plus Paper Shaders, Lucide and Geist, which the old footer credited;
  - credit link: "Components from 21st.dev".

  The profile URLs `21st.dev/@shadcn`, `@dillionverma` and `@manuarora700` were opened in the browser and resolve.
- App: the skip link is a `Button asChild`, kept off-screen with `-translate-y-24` until focused. `sr-only` / `not-sr-only` would have zeroed the Button's padding. Checked: on focus it shows as the primary Button at the top left, and activating it focuses `#app`.
- App: the "Replace your exam in progress?" confirm is an AlertDialog laid out like the demo: AlertDialogCancel "Keep current exam" and AlertDialogAction "Start new exam". It adds a `BorderBeam size={140} duration={9}` because the old ConfirmDialog had a beam. `onOpenAutoFocus` records which element had focus, and `onCloseAutoFocus` gives focus back to it. Without that, Radix would try to focus a trigger that doesn't exist. Radix puts initial focus on Cancel.

  Checked with a running exam that had one answer:
  - "Quiz me on my misses" opens the dialog with focus on Cancel.
  - Escape keeps the exam and returns focus to the button.
  - Start new exam builds the new exam, routes to `#exam` and focuses the new h1.
- App: MotionConfig with `reducedMotion="user"` from `motion/react`, with framer-motion's MotionConfig nested inside it.
- App: removed the old sticky header (brand button and mini dial) and the second NavBar (the phone dock). `main` has `pt-16 md:pt-[72px]`, the old header's height, so the views keep their spacing. The root has `pb-20` below sm, so the footer wordmark scrolls clear of the navbar, which sits at the bottom on phones.
- Home, hero:
  - Brand: "C952 Study Buddy", which calls `go("home")`.
  - CTA slot: the LiquidMetalButton, whose label is Start learning, Continue learning or Take the full exam. All three fit the 142px button (114px or less, measured).
  - Kicker: the old eyebrow.
  - Title: "Pass C952." / "In one day."
  - Subtitle and description: the old paragraph, split in two. Its first sentence is the subtitle ("a short line"), and the second is the description.
  - Tag and heading: the old "Next up" line.
  - Credit link: "Practice exam", which calls `go("exam")` and keeps `replaceState`. The old secondary outline Button is gone.
- Home: mastery dial.
  - AnimatedCircularProgressBar gets `value` = the rounded percent with `max={100}`. With `max={60}` it prints raw fractions such as 16.666666666666668.
  - Its gauge colors are `var(--primary)` and `var(--secondary)`.
  - The dot-text shows the mastered count with the caption "of 60 mastered".
  - A wrapper with `role="progressbar"` carries the label and `aria-valuetext`.
  - The DotMatrixText is `aria-hidden` and uses `transition="none"` when reduced motion is on. Its `inactiveColor` is the demo's `rgba(255,255,255,0.04)`, because a canvas can't read CSS variables.
- Home: Stats shows Best exam, Last exam, To review and Plan. The old notes under each figure ("No full exam yet", the last exam's mode and so on) were dropped, because the component's slots are value and label only.
- Home: the "Your courses" teaser is a Card wrapped in `<a href="#courses">` that calls `openCourse(null)`. It has a GlowingEffect with the demo's settings, because the old panel glowed.
- Home: the topics use a BentoGrid with `auto-rows-[16rem] md:auto-rows-[18rem]` (the default 22rem left mostly empty cards) and spans of 3 + 2 + 3 from md.
  - Each BentoCard gets the topic's lucide icon, a description with the question and mastered counts, `href="#learn"` and the call to action "Learn".
  - The background slot holds a Progress bar and the percentage. Meter maps to Progress, which is passed `aria-valuenow` (see Needs).
- Home: the "How to use this, like you're 5" Alert gets `role="note"`. Alert hardcodes `role="alert"`, an assertive live region, which would announce this static tip on load. Checked: Home has 0 `role="alert"`.
- Home: the plan rows follow the CheckboxWithText demo: Checkbox, Label (`htmlFor` / `id`) and the duration as muted text. Checked: all 9 `label.control` are wired to their checkbox. The Label gets `leading-snug` because steps wrap to two lines. Done rows keep the old app's muted line-through.
- Home: section headings are a base-badge `outline` eyebrow plus an h2 that uses CardTitle's type classes, with no new type scale. Each section enters with BlurFade, and the headings use it too.

## Needs (files that are not mine)

- `src/components/ui/progress.tsx` — the Tailwind 3 shadcn Progress destructures `value` and never passes it to the Radix Root. As a result the progressbar has no `aria-valuenow` or `aria-valuetext`, and its `data-state` is "indeterminate". Home works around this by passing `aria-valuenow`. Forwarding `value` to Root (one line) would fix it on every page.
- `src/components/ui/animated-circular-progress-bar.tsx` — it prints the raw `currentPercent`, which is a fraction when max is not 100, and it has no role or label. Pages should pass a 0–100 integer and wrap the bar in a labelled element, as Home does.
- `src/components/kit.tsx` — App and Home no longer import ConfirmDialog, ChromeDial, Panel, Reveal, Callout, Meter, Eyebrow, SectionTitle or TopicTile. Home still imports `Rich`.
- Other views: the shell's fixed navbar takes y 24–70px at 640px and up (a centered pill), and the bottom 24–70px below 640px. `html { scroll-padding-top: 6rem }` already clears it. A sticky bar belongs at `top: 70px` from sm up; Cheat already uses 70px.
- User decision: hero-minimalism's `<style>` still contains `@import url('https://fonts.cdnfonts.com/css/hubot-sans')`. Every time Home renders, the browser requests a font from a third-party site. Offline, or in the single-file build without network, the title falls back to system fonts. I left it as the prompt has it.
- Note for anyone putting components inside the hero: its root defines its own `--muted`, `--border`, `--accent`, `--bg` and `--fg`, which shadow the shadcn tokens. A shadcn outline Button inside the hero, for example, would get a light-grey hover. Only the LiquidMetalButton is placed there, and it uses inline styles.
