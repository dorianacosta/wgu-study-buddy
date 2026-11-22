# Page step: Learn + Cheat Sheet

Files: `src/views/Learn.tsx`, `src/views/Cheat.tsx`. No file in `src/components/ui` was edited or added.

## How the old pieces were mapped

| Old (kit) | Now |
| --- | --- |
| `TopicSwitcher` chips | one shadcn `Card` per topic with a full-size `<button>` inside: a swipeable row on phones (active card kept centered, same code as before) and a 4-column grid from md up |
| `TopicTile` / `TopicIcon` | bare lucide icon with Magic UI BentoCard's icon classes (`h-12 w-12` in the topic header, `h-6 w-6` in the picker) |
| `Eyebrow` ("Topic 01 / 08", "Practice", "Reference", "01 / 07") and topic counts | ReUI `Badge` (`secondary` for eyebrows, `outline` for counts and idea numbers, `success` + check for a fully mastered topic) |
| `PageHeader` / `PAGE_TITLE` | h1 with hero-minimalism's `.title` type, lead with its `.subtitle` type |
| `SectionTitle` / `SECTION_TITLE` | h2 with CardTitle's classes, inside a `CardHeader` |
| `Meter` | shadcn `Progress` |
| `Callout` (eli5, flip) | shadcn `Alert` + `AlertTitle` + `AlertDescription` with a lucide icon, as in the Alert demo |
| `Panel as="button" glow` (previous / next topic) | `Card` + Aceternity `GlowingEffect` (the demo's settings: blur 0, spread 40, proximity 64, inactiveZone 0.01, borderWidth 3) |
| `Reveal` | Magic UI `BlurFade` (`inView` where Reveal had it, same keys so it re-animates on a topic switch) |
| Learn toolbar (title, hint, Show all / Hide all / Quiz me) | a `Card`: header (Badge, h2, CardDescription) and footer with the Buttons, like the Card demo |
| `border-t` above the end-of-topic block | shadcn `Separator` |
| `StickyBar` + pill buttons (Cheat jump bar) | a sticky `Card` holding `Button size="sm"`: `default` for the current section, `ghost` for the rest |
| `CheatSection` + `Panel` / `DataTable` | one `Card` per section (header: Badge, h2, optional CardDescription; content: the table) |
| formula cards | one shadcn `Table`: Formula / Equation / Example or note, the equation column in mono |
| `DataTable` | shadcn `Table` (`TableHeader`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) |
| filter-row "No matches" row | serafimcloud `EmptyState` (icon SearchX, action "Clear filter") |
| `Kbd` | shadcn `Kbd` |
| custom filter field | shadcn `Input` (see the first deviation) |
| nudge buttons on wide tables | `Button variant="outline" size="icon"`; the edge-fade gradients are gone |

Kept as they were: the Show all / Hide all pulse, focus to the new h1 on a topic switch, `aria-current` on topic cards and jump buttons, the scroll-spy and its hold logic, the jump with focus to the section's h2, scroll padding that follows the jump bar, the "/" shortcut, Escape to clear the filter, the `aria-live` match count, keyboard-scrollable wide tables, `Rich` for the content HTML. No print layout existed (no `print:` class or `@media print` anywhere), so there was none to keep.

## Deviations (file — what changed — why)

- `src/views/Cheat.tsx` — a local `Input` component, copied verbatim from the shadcn input.tsx bundled with the collected kbd, card, tabs and dialog prompts (`21st/staged/shadcn--kbd/deps/input.tsx`, identical in all four) — the filter field needs an input, no standalone input prompt was collected, and this step may not add files to `src/components/ui` (see Needs).
- `src/views/Cheat.tsx` — the Input gets `text-base md:text-sm`, `md:pr-12` and `[&::-webkit-search-cancel-button]:hidden` — iOS Safari zooms into fields smaller than 16px (newer shadcn Input does the same), the right padding keeps typed text clear of the Kbd hint, and hiding WebKit's native clear button leaves one clear control in every browser.
- `src/views/Cheat.tsx` — the clear-filter control is a `Button variant="ghost" size="icon"` beside the field, `invisible` while the filter is empty — the old one sat inside the field, but the app has no InputGroup to put a button there; `invisible` keeps the row from shifting while typing.
- `src/views/Cheat.tsx` — the Kbd hint in the field shows `/` while it's empty and `Esc` while filtering (md+ only, aria-hidden) — both shortcuts get a visible hint (the task asks for Kbd shortcut hints); the old field showed only `/`.
- `src/views/Cheat.tsx` — Table gets `[&_mark]:bg-primary [&_mark]:text-primary-foreground` — filter matches are `<mark>`, which the browser paints yellow; switched to the theme pair index.css already uses for `::selection` (color spec).
- `src/views/Cheat.tsx` — the first cell of each row is `TableHead scope="row"` with `text-foreground` — keeps the row-header semantics the old table had (a11y); TableHead's muted color is meant for column headers, so row labels take the foreground token, like the demo's emphasized first column.
- `src/views/Cheat.tsx` — `TableCaption className="sr-only"` — the caption names the table for screen readers; the card's h2 already titles it visually.
- `src/views/Cheat.tsx` — while a table overflows sideways, the page sets `tabindex="0"`, `role="region"` and `aria-label="… (scrolls sideways)"` on the Table's own overflow wrapper (the `div.relative.w-full.overflow-auto` that table.tsx renders) and removes them when it fits — keyboard users must be able to scroll a wide table (it was the same on the old wrapper); Table doesn't expose that div, so the attributes are set from the page.
- `src/views/Learn.tsx`, `src/views/Cheat.tsx` — every `Alert` gets `role="note"` (overrides Alert's built-in `role="alert"`) — these are static study notes; `role="alert"` makes screen readers announce them assertively each time React inserts them, i.e. on every topic switch.
- `src/views/Learn.tsx` — `Progress` gets explicit `aria-valuenow={pct}` and `aria-valuetext` — the collected progress.tsx destructures `value` and never passes it to `ProgressPrimitive.Root`, so the bar was exposed as indeterminate (checked in the browser: no aria-valuenow before, `0` / `0%` after). See Needs for the component fix.
- `src/views/Learn.tsx` — the active topic Card gets `border-primary` — the selected-state cue (shadcn's selected-card idiom, theme token); `aria-current="true"` stays. Judgment call: it marks state, not decoration.
- `src/views/Learn.tsx` — topic icons use BentoCard's icon classes (`origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75`), at BentoCard's `h-12 w-12` in the topic header and `h-6 w-6` in the picker cards — the TopicIcon / TopicTile mapping; the smaller size keeps the 8-card picker compact. `text-neutral-700` is BentoCard's own neutral grey, kept.
- `src/views/Learn.tsx`, `src/views/Cheat.tsx` — headings: h1 = hero-minimalism's `.title` (`text-[clamp(32px,8vw,88px)] leading-[0.95] font-semibold`), the line under it = its `.subtitle` (`text-[clamp(14px,2.2vw,18px)] text-muted-foreground`), section h2 = CardTitle's classes on an h2 (CardTitle renders an h3) — PageHeader / SectionTitle mapping, no new type scale.
- `src/views/Cheat.tsx` — the jump bar sticks at a measured `top` (`useTopChrome`: the bottom edge of the app's own fixed or sticky top chrome, found with `elementsFromPoint` at the top edge, ignoring the bar itself and full-height layers such as the dot-pattern background or a dialog overlay; re-measured on resize) instead of the old hard-coded `top-16 md:top-[72px]` — App's chrome was rebuilt in parallel (now the floating tubelight NavBar: bottom ≈70px from sm up, nothing at the top on phones), and measuring keeps the bar right under it. Checked: 73px with the old header, 70px with the new NavBar, 0px at 390px wide.
- `src/views/Cheat.tsx` — the jump-bar row keeps `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` (it scrolls sideways on phones) and drops the old `mask-image` edge fade (a custom gradient).
- `src/views/Cheat.tsx` — the formulas are a Table instead of cards, with the equation column in `font-mono` (mono text as the collapsible demo sets it) — the task asks for Tables for formulas and facts; the column labels "Formula", "Equation" and "Example / note" are new text the table needs.
- `src/views/Cheat.tsx` — the 8 great ideas are one section Card with a 2- or 4-column list (outline number Badge + text) instead of eight Panels — every section is now a Card, and cards inside a card would nest.
- `src/views/Cheat.tsx` — no filter match: `EmptyState` replaces the table (title "No matches", description "No signal words contain “q”.", action "Clear filter") — the old single sentence "No matches for “q”." is split across the component's title and description slots.

## Needs (not done: outside my files)

- `src/components/ui/input.tsx` — add it with `cp 21st/staged/shadcn--kbd/deps/input.tsx src/components/ui/input.tsx`, then in `src/views/Cheat.tsx` delete the local `Input` (the block after the imports, with its comment) and `import { Input } from "@/components/ui/input"`. `forwardRef` and `InputHTMLAttributes` can then leave Cheat's react import.
- `src/components/ui/progress.tsx` — pass `value` to `ProgressPrimitive.Root` (`<ProgressPrimitive.Root ref={ref} value={value} …>`) so Radix sets aria-valuenow / aria-valuetext / data-state itself; it's a bug in the prompt's code (log it as a deviation). Learn's explicit aria props can stay or go, they match.
- `src/components/kit.tsx` (cleanup) — Learn and Cheat now import only `Rich` from kit. Callout, Eyebrow, Meter, PAGE_TITLE, Panel, Reveal, SectionTitle, TopicIcon, TopicTile, Kbd, PageHeader, SECTION_TITLE and StickyBar are free to remove once no other page uses them.
- App (its owner or cleanup) — BlurFade imports `framer-motion`, so App's framer-motion `MotionConfig reducedMotion="user"` has to wrap both pages (it's on the KEEP list; not checked here).

## Problems / observations

- App, not mine: at 390px wide the tubelight NavBar is 466px wide (six 66px icon links), so the document became 1353px wide in phone emulation (`document.documentElement.scrollWidth`). Nothing inside `main` overflows on Learn or Cheat at 390px.
- App, not mine: with the floating NavBar there is no full-width header behind it, so page content shows above the stuck jump bar beside the pill. The bar itself sits right under the NavBar.
- Printing: there is no print layout. Sections wrapped in `BlurFade inView` stay at opacity 0 until scrolled into view, so printing before scrolling through prints them blank. The old `Reveal inView` did the same; not changed.
- The question cards come from `question.tsx` (another agent). The list uses `space-y-4`, so the gap stays 16px whether its frame keeps `my-4` (margins collapse) or not.
- Browser checks: the Browser pane often reported `visibilityState: hidden`, which throttles smooth scrolling, so jumps were verified after waiting rather than by watching them.

## Checks

- `npx tsc -p tsconfig.app.json --noEmit`: 0 errors in Learn.tsx and Cheat.tsx. The project's remaining 2 errors are in kit.tsx (lines 143, 533; cleanup step).
- Grep of both files for the removed classes and tokens in INTEGRATION.md and for hex / rgba / white-alpha colors, gradients, shadows, blur and masks: no hits.
- Browser, 1280×800, own tab: `#learn` and `#cheat` render, console has no errors or warnings.
  - Learn: topic cards switch the topic, scroll to top and move focus to the new h1; the Next card's glow follows the pointer; Show all answers / Hide all work repeatedly (5 cards revealed, then 0); the ideas Alerts have `role="note"`; the progress bar reports `aria-valuenow`. Answers and "I've got this" were not clicked, so saved progress (shared localStorage) was not touched.
  - Cheat: the jump bar sticks under the app chrome; RAID jump lands the card 16px under the bar, lights RAID and focuses its h2; "/" focuses the filter and lights Signal words; typing filters (3 of 30, `<mark>` in white on black), Esc clears, no-match shows EmptyState and its Clear filter empties the field and refocuses it; the last section lights at the bottom.
- 390px: wide tables (formulas, Flynn, RAID, memory) become focusable named regions and scroll sideways; the jump bar sticks at 0 and keeps the current button centered.
