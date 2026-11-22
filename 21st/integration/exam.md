# Page step: exam (question.tsx, Practice Exam setup / runner / results, My Misses)

Files: `src/components/question.tsx`, `src/views/exam/Setup.tsx`, `src/views/exam/Runner.tsx`, `src/views/exam/Results.tsx`,
`src/views/Misses.tsx`, plus one line in `src/components/ui/question-tool.tsx`. `src/views/Exam.tsx` and
`src/components/ui/empty-state.tsx` are unchanged. tsc: 0 errors in these files. Every removed class and token from
INTEGRATION.md is gone from them (grep clean). The only kit import left is `Rich`.

## What each old piece became

| Old | Now |
| --- | --- |
| `QuestionFrame` / `QuestionMeta` / `QuestionText` / `OptionButton` | serafimcloud question-tool's look: frame, header row (its IconQuestion + "Question", "n of N"), title row with index badge, lettered option rows with its selected badge, footer buttons |
| right / wrong marks | base-badge `success` / `destructive` (`appearance="light"`, `size="sm"`) with lucide Check / X and a word ("Correct", "Wrong", "Not quite") |
| `Callout` (Explanation, Setup's ELI5) | shadcn `Alert` + lucide icon + `AlertTitle` / `AlertDescription`, `role="note"` |
| `Badge` / `TopicChip` / `Eyebrow` | base-badge `Badge`; eyebrows became hero-minimalism kicker text |
| `PageHeader` | hero-minimalism kicker / title / subtitle type (`text-xs uppercase tracking-[0.14em]`, `text-[clamp(32px,8vw,88px)] leading-[0.95] font-semibold`, `text-[clamp(14px,2.2vw,18px)]`) in theme tokens |
| `SectionTitle` / card titles | h2 with CardTitle's classes (CardTitle itself renders h3) |
| `Panel` (mode cards, glowed) | `Card` + `GlowingEffect` with the demo's settings |
| `Panel` (other) | `Card` |
| `StickyBar` | sticky `Card` |
| `Meter` | `Progress` |
| `ChromeDial` + dot-matrix % | `AnimatedCircularProgressBar` + `NumberTicker` in a `Card` with `BorderBeam` |
| `Disclosure` | `Accordion` (single item) in Misses, `Collapsible` + ghost Button (collapsible demo) for the remix "original Qn breakdown" |
| `Reveal` | `BlurFade` (same delays, `inView` where Reveal had it) |
| `EmptyState` | serafimcloud `EmptyState` |
| `ConfirmDialog` | `AlertDialog` |
| `Kbd` | shadcn `Kbd` / `KbdGroup` |
| `TopicTile` / `ModeIcon` | lucide icon with BentoCard's icon classes (`h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75`) |
| `TopicIcon` (inline) | the lucide icon inside the badge or cell, `currentColor` |
| Recent attempts / by-topic table | shadcn `Table` (`TableFooter` for the correct / wrong tally) |
| review filter buttons | shadcn `Tabs` |
| runner shortcuts switch | shadcn `Switch` + `Label` |
| navigator squares, question map | base-badge rendered as `<button>` (`render={<button type="button" />}`) |

## Deviations (file — what changed — why)

### src/components/ui

- `src/components/ui/question-tool.tsx` — `function IconQuestion` is now `export function IconQuestion` (body unchanged) — question.tsx's header row reuses the component's own question icon instead of a lookalike or a copied SVG.

### src/components/question.tsx

- Renders the question-tool look by reusing its class strings verbatim (the `QT` map; all 18 strings were checked to occur in question-tool.tsx), not by mounting `QuestionTool` / `QuestionPrompt` — QuestionPrompt takes plain-text titles and string labels, keeps picks in its own state and has no slot for right / wrong, a code block or an explanation; mounting it would need many new props, which is not a minimal change.
- Layout glue on top of the copied classes: header row `h-auto min-h-7 flex-wrap gap-x-3 gap-y-1 py-1` instead of a fixed `h-7` (badges and the "I've got this" checkbox wrap on narrow screens); title and option rows `items-start` (multi-line prompts keep the badge on the first line); option text `min-w-0 flex-1 break-words`, plus `font-mono whitespace-pre-wrap` for code options; review rows (disabled) drop the hover background; footer `flex-wrap`; footer buttons `inline-flex items-center gap-1.5` so the Flag icon sits beside its label — responsive layout and states the prompt's demo doesn't cover.
- `QuestionFrame` puts its `QuestionMeta` children in the header slot above the body (a `Children` partition) — mirrors QuestionTool's frame › header › body; callers keep passing QuestionMeta as a child (Courses does).
- `QuestionFrame`'s `accent` is now optional and ignored — the question-tool frame has no colored spine; badges carry mastered / correct. Existing callers (Courses passes `var(--primary)` / `var(--border)`) still compile.
- Export names and props kept. Added: optional `index` on `QuestionText` (the title row's index badge) and new exports `QuestionCount`, `QuestionOptions`, `QuestionFooter`, `QuestionButton` (`look`: nav / skip / submit), `QuestionHint`.
- `Explanation`: every box is an `Alert` with `role="note"` — the shadcn Alert hardcodes `role="alert"`, an assertive live region, so every static explanation would be announced when it appears.
- `QuestionCard` (Learn): the footer is the question-tool's Skip + Submit pair: "Just show me" (skip style) and, for "Choose N", "Check my answers" (submit style, disabled until something is picked), with "Pick N, then check." on the left. Before, one button switched its label. Both actions are still there; "Just show me" with picks reveals without grading.
- `QuestionCard` verdict: "Correct. Nice work." / "Not quite. Read why below…" became a success badge "Correct" + "Nice work." / a destructive badge "Not quite" + "Read why below, then try the Flip-it questions in your head." — same words, split across the badge and the sentence. The `role="status"` live region, focus to the result after answering and to option A after "Try again" are unchanged (checked).
- The revealed block uses `BlurFade` instead of a custom motion fade.

### src/views/exam/Setup.tsx

- Mode cards: `Card` + `GlowingEffect` (demo settings: blur 0, spread 40, proximity 64, inactiveZone 0.01, borderWidth 3, glow; disabled on the empty "My misses" card) + a `RadioGroupItem` labelled by the title; topic `Select` inside the Topic drill card; Start = `LiquidMetalButton` "Start exam" in a `Card` with the summary line. Before, clicking a mode card started the exam at once; now you pick a mode (radio, or a click anywhere on its card) and press Start — the step's RadioGroup + Start layout. Picking a topic also selects Topic drill.
- Slider (question count) not used — `buildExam` (src/lib/exam.ts, KEEP) fixes each mode's count (Full 60, Quick 20, Remix 25, topic and misses = all of them), and the exam name ("Quick 20"), Retake and the Full-exam best score assume those counts. A count needs a lib change (see Needs).
- Switch (options): the only exam option is the single-key shortcuts setting the runner already had (`localStorage["c952-shortcuts"]`); Setup shows the same setting in the Card demo's row pattern (`rounded-md border p-4`, icon, title, description, Switch). New text: "Keyboard shortcuts" and "Number keys pick an answer, ← → move between questions."
- Recent attempts: `Table` in a `Card`. The custom side-scroll nudge buttons and gradient edge fades are gone; cells wrap on phones, so the table doesn't scroll sideways. The date cell is a `td` (was `th scope="row"`).

### src/views/exam/Runner.tsx

- Exam bar: a sticky `Card` (`sticky top-3 sm:top-[70px] z-30`, `[@media(max-height:560px)]:static`) — 70px is the bottom of the shell's floating navbar from sm up (shell.md); below sm the navbar sits at the bottom. Checked: stuck at 70px at 1280px wide; the scroll-padding hook still follows the bar.
- `Progress` gets `aria-valuenow` and `aria-valuetext` ("n of N answered") — shadcn's progress.tsx never passes `value` to the Radix root, which then reports no value (same workaround as Home; see Needs). Results' topic bars do the same.
- Navigator: base-badge buttons — current `primary`, answered `secondary` + `BadgeDot`, flagged + Flag icon, unanswered `outline`; the legend uses the same badges. The phone strip's gradient mask and hidden scrollbar are gone.
- Question card: QuestionFrame header "Question" + Remix / Choose N badges, "n of N" on the right; footer Previous (nav style), Flag for review (skip style, `aria-pressed`), Next / Submit exam (submit style). The footer and header stay mounted across questions, so focus on Previous / Next survives a move (checked).
- The custom 6px slide between questions became `BlurFade` keyed on the question (duration 0.25).
- Submit / Quit: `AlertDialog`s opened from state. `onOpenAutoFocus` records the opener and `onCloseAutoFocus` returns focus to it — Radix only restores focus to a Trigger, and Submit has two openers. Submit starts on the Submit action (as before); Quit starts on Cancel (Radix default); the destructive action uses `buttonVariants({ variant: "destructive" })`. Checked: focus lands and returns as described; Escape and Cancel keep the exam.
- Empty exam: serafimcloud `EmptyState` (icons `[ClipboardX]`, action "Other modes"), centered.

### src/views/exam/Results.tsx

- Score: `AnimatedCircularProgressBar` (min 0, max 100, value = the rounded percent so it never prints a fraction; colors `var(--primary)` / `var(--secondary)`; starts at 0 and sweeps up through its own transition) next to `NumberTicker` (the correct count, inside the demo's `text-8xl` wrapper), in a `Card` with `BorderBeam` (defaults). Both are `aria-hidden`; an sr-only sentence gives the score. With reduced motion, or a score of 0 (the ticker would stay empty), the number is shown directly.
- dot-text not used — the gauge prints the percentage itself and has no slot for center content.
- By topic: `Table` with a `Progress` per row and a `TableFooter` for Correct / Wrong (incl. skipped); "Study first" is outline badges in the `CardFooter`.
- Question map: base-badge buttons — correct `success` + Check, wrong `destructive` light + X, skipped `outline` + Minus.
- Review: one `Accordion` item per question (`type="multiple"`, controlled); filter buttons → `Tabs` ("Wrong only n" / "All n"). The map and the empty state's "Show all" open the item they jump to, scroll it under the navbar (`scroll-mt-28`) and focus its trigger. The All tab's list mounts a render after the switch (Radix Presence), so the jump waits up to 10 frames for the item — found and fixed in the browser.
- Remix items: the remix's "why" in an `Alert`; the original question's breakdown behind a `Collapsible` with a ghost Button + ChevronsUpDown ("See / Hide the original Qn breakdown").
- Title stays "Results: {exam.name}" at hero-minimalism's title size (topic drills wrap to two lines).

### src/views/Misses.tsx

- Each miss: QuestionFrame (question-tool look) with a visible `h2` "Question N" in the header row (was an sr-only h2 + chip), topic and "Missed N×" badges, the prompt, and a single-item `Accordion` "Show / Hide the full breakdown" (sr-only "for question N" kept). The answer is a success badge "Answer" + the answer text (was a white box).
- "By topic": outline badges with the topic icon and count, under a `Separator`.
- Clearing: `AlertDialog` with `AlertDialogTrigger` on "Clear list" (Radix returns focus to it on Cancel); the root wraps the page so the dialog can finish closing after the list empties. After clearing, focus goes to the empty state's button, found inside a wrapper div, so empty-state.tsx needed no ref prop (checked).
- Empty: serafimcloud `EmptyState` (icons `[Target]`, action "Take a practice exam" → `go("exam")`), centered.

## Needs (not my files)

- `src/components/ui/progress.tsx` — forward `value` to `ProgressPrimitive.Root` (one line; shadcn's own code drops it). Every Progress would then report its value; Runner, Results and Home pass `aria-valuenow` themselves meanwhile.
- `src/lib/exam.ts` + App (only if a question-count Slider is wanted on Setup) — a `count` option in `buildExam`, carried through `startExam` and Retake, and a name that doesn't say "Quick 20" for other counts.
- `src/components/ui/liquid-metal-button.tsx` (observation) — its label is hardcoded `#666666` on the near-black ring, about 3.3:1, below 4.5:1 for 14px text. A lighter grey would read better; I didn't restyle it.
- `src/components/kit.tsx` (cleanup) — the exam views and question.tsx import only `Rich` now. Badge, Callout, ChromeDial, ConfirmDialog, Disclosure, EmptyState, Kbd, Meter, PageHeader, Panel, Reveal, SectionTitle, StickyBar, TopicChip, TopicIcon are unused by these files.
- User: my browser checks submitted two exams in the dev origin, and restoring `localStorage["c952-study-v1"]` afterwards was blocked by the permission classifier. It now holds two history entries ("Topic drill: Pipelining" 0/7 and "Remix exam" 1/25, 2026-11-20 06:22 and 06:26 UTC) and 21 misses. The value before the checks was `{"mastered":{},"miss":{},"plan":{},"history":[],"best":null}`; setting it back in devtools (or clearing site data for http://127.0.0.1:5180) undoes it. Home and Setup screenshots taken since show this data.
