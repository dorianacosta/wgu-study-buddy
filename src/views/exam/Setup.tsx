/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The Practice Exam's start screen (`#exam/c952` with no exam; the Exam view renders it). Its header's "Practice with"
 * (decision 57) picks Questions, the exam's mode picker as it always was (modes, the Shortcuts row, "Start exam", the
 * logbook), or Flashcards: C952's formulas, signal words and ARM reference as cards (C952_CARDS), in Practice's
 * Flashcards (GuideFlashcards), marked in `courses.c952.cards`. The header's lead follows the mode, and a switch moves
 * no focus and shows the other mode at once; each mode's windows fade in only when it is the page's first view.
 */
import { useId, useState, type ReactNode } from "react"
import { Crosshair, GraduationCap, Keyboard, Lightbulb, Repeat, Target, Zap, type LucideIcon } from "lucide-react"
import { C952_CARDS, QUESTIONS, QUESTION_BY_N, TOPICS, type TopicId } from "@/data"
import { C952, type PracticeMode } from "@/lib/course"
import { cardCounts, type Attempt } from "@/lib/store"
import type { ExamMode } from "@/lib/exam"
import { cn } from "@/lib/utils"
import type { SetupProps } from "@/views/exam/props"
import { GuideFlashcards } from "@/views/course/GuideFlashcards"
import { PracticeWith } from "@/views/course/PracticeWith"
import { percent } from "@/views/course/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { CornerFrame } from "@/components/ui/corner-frame"
import { DecryptText } from "@/components/ui/decrypt-text"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/** Type styles (Surfaces, Style shorthand). `body` is mono, so only the sans lead opts in. */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
const LEAD = "mt-4 max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"
/** The page h1: Surfaces' Title decrypt recipe (`title` style). */
const PAGE_TITLE = "Practice Exam"
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
/**
 * Target frame variants for a card whose focusable element (its radio) sits inside: brackets turn gold on hover,
 * with keyboard focus on the radio, and while the radio is checked. Never `focus-within:` (Surfaces, Target frame).
 */
const MODE_FRAME_ON =
  "hover:[--corner-frame-color:var(--primary)] has-[:focus-visible]:[--corner-frame-color:var(--primary)] has-[[data-state=checked]]:[--corner-frame-color:var(--primary)]"

/** Single-key shortcuts in the exam (1–N pick, ← → move). Same device setting the exam runner's switch uses. */
const SHORTCUTS_KEY = "c952-shortcuts"

function readShortcuts() {
  try {
    return localStorage.getItem(SHORTCUTS_KEY) !== "off"
  } catch {
    return true
  }
}

function saveShortcuts(on: boolean) {
  try {
    localStorage.setItem(SHORTCUTS_KEY, on ? "on" : "off")
  } catch {
    /* storage blocked: the choice lasts until the page is closed */
  }
}

/** A Remix exam draws up to 25 of the "Flip it" twists that have a definite answer. */
const REMIX_COUNT = Math.min(
  25,
  QUESTIONS.reduce((n, q) => n + (q.f ?? []).filter((f) => f.a !== null).length, 0),
)

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** Time budget at 45–60 s per question, e.g. 20 questions → "15–20 min". */
function minutes(n: number) {
  const raw = n * 0.75
  const lo = n >= 20 ? Math.round(raw / 5) * 5 : Math.round(raw)
  return lo > 0 && lo < n ? `${lo}–${n} min` : `~${Math.max(1, n)} min`
}

interface ModeSpec {
  mode: ExamMode
  icon: LucideIcon
  title: string
  text: string
  count: number
  /** the description already gives the time, so the meta line shows only the question count */
  timeInText?: boolean
  recommended?: boolean
}

/**
 * One mode as a target window (Surfaces, Target frame): a Card in a four-corner CornerFrame, with the mode's 48px
 * lucide icon (muted) shown the way bento-grid cards show theirs, and a RadioGroupItem labelled by the name. Clicking
 * anywhere on the card picks the mode; keyboard users move through the radio group. With nothing to practice the radio
 * is disabled, the brackets stay muted (no variants) and the card says why; that reason stays at full strength while
 * the icon, name and description dim.
 */
function ModeCard({
  spec,
  onSelect,
  className,
  children,
}: {
  spec: ModeSpec
  onSelect: () => void
  className?: string
  children?: ReactNode
}) {
  const id = useId()
  const off = spec.count === 0
  const dim = off && "opacity-50"
  const Icon = spec.icon
  return (
    <CornerFrame asChild size="16px" thickness="2px" inset="8px" className={off ? undefined : MODE_FRAME_ON}>
      <Card className={cn("group flex h-full flex-col", !off && "cursor-pointer", className)} onClick={off ? undefined : onSelect}>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <Icon
            aria-hidden="true"
            className={cn(
              "h-12 w-12 origin-left transform-gpu text-muted-foreground transition-all duration-300 ease-in-out",
              off ? dim : "group-hover:scale-75",
            )}
          />
          <RadioGroupItem
            value={spec.mode}
            id={id}
            disabled={off}
            aria-describedby={[spec.recommended && `${id}-r`, `${id}-d`, `${id}-m`].filter(Boolean).join(" ")}
          />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className={cn("flex flex-wrap items-center gap-2", dim)}>
            {/* a name inside a target window: `subheading` (Label README) */}
            <Label htmlFor={id} className="text-base font-semibold">
              {spec.title}
            </Label>
            {spec.recommended && (
              <Badge id={`${id}-r`} variant="primary" appearance="light" size="sm">
                Recommended
              </Badge>
            )}
          </div>
          <CardDescription id={`${id}-d`} className={cn("mt-2", dim)}>
            {spec.text}
          </CardDescription>
          {children}
          <p id={`${id}-m`} className="mt-auto pt-6 text-sm text-muted-foreground">
            {off ? (
              "Get something wrong first"
            ) : (
              <>
                {plural(spec.count, "question")}
                {!spec.timeInText && ` · ${minutes(spec.count)}`}
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </CornerFrame>
  )
}

/**
 * A window's way in: a BlurFade, as the start screen always had, when Questions is the page's first view; after a
 * "Practice with" switch, still, resting 6px up where the fade settles (a switch is a change of state, so it is
 * instant, as on a guide's Practice).
 */
function Entrance({
  fade,
  delay,
  inView,
  className,
  children,
}: {
  fade: boolean
  delay?: number
  inView?: boolean
  className?: string
  children: ReactNode
}) {
  if (!fade) return <div className={cn("-translate-y-1.5", className)}>{children}</div>
  return (
    <BlurFade delay={delay} inView={inView} className={className}>
      {children}
    </BlurFade>
  )
}

/* ── Recent attempts ────────────────────────────────────────────────────── */

/**
 * Last 8 attempts, newest first, in a shadcn Table. Cells wrap on phones, the date is the short form ("11/22/26,
 * 12:13 AM"; the <time> keeps the exact moment), and below 375px cells keep 8px side padding instead of 16 (TIGHT), so
 * the table never scrolls sideways: at 320 the card holds 286px.
 */
const TIGHT = "max-[374px]:px-2"

function RecentAttempts({ history, fade }: { history: Attempt[]; fade: boolean }) {
  const recent = history.slice(-8).reverse()
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="mt-20">
      {/* Section heading: eyebrow `label`, h2 `heading`, aside `caption` (Surfaces, Headings and text) */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-2">
          <p className={LABEL}>Logbook</p>
          <h2 id={headingId} className={HEADING}>
            Recent attempts
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">Last {recent.length} · newest first</p>
      </div>
      <Entrance fade={fade} inView>
        <Card>
          <Table>
            <TableCaption className="sr-only">Your last {recent.length} practice exams, newest first</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className={TIGHT}>When</TableHead>
                <TableHead className={TIGHT}>Mode</TableHead>
                <TableHead className={cn("text-right", TIGHT)}>Score</TableHead>
                <TableHead className={cn("text-right", TIGHT)}>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((a, i) => {
                const pct = a.total ? Math.round((100 * a.score) / a.total) : 0
                const date = new Date(a.date)
                const valid = !Number.isNaN(date.getTime())
                return (
                  <TableRow key={`${a.date}-${i}`}>
                    <TableCell className={cn("text-muted-foreground", TIGHT)}>
                      {valid ? (
                        <time dateTime={date.toISOString()}>
                          {date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        </time>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className={TIGHT}>{a.mode}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", TIGHT)}>
                      <span className="font-semibold">
                        {a.score}/{a.total}
                      </span>{" "}
                      <span className="text-muted-foreground">({pct}%)</span>
                    </TableCell>
                    <TableCell className={cn("text-right text-muted-foreground tabular-nums", TIGHT)}>{a.time || "—"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </Entrance>
    </section>
  )
}

export default function Setup({
  store,
  update,
  startExam,
  practiceMode,
  onPracticeMode,
  cardFilter,
  onCardFilter,
}: SetupProps) {
  // only questions that exist in this build (the exam builder drops unknown numbers too)
  const misses = Object.keys(store.miss).filter((n) => QUESTION_BY_N[+n]).length
  const [mode, setMode] = useState<ExamMode>("full")
  const [topic, setTopic] = useState<TopicId>("t1")
  const [keysOn, setKeysOn] = useState(readShortcuts)
  // each mode's windows fade in with the page only: a "Practice with" switch is a change of state, so it is instant
  const [switched, setSwitched] = useState(false)
  const fade = !switched
  const modesHeading = useId()
  const topicId = useId()
  const keysId = useId()

  const modes: ModeSpec[] = [
    {
      mode: "full",
      icon: GraduationCap,
      title: "Full exam",
      text: "All 60 C952 practice questions, shuffled. A full practice run. About 45–60 min.",
      count: QUESTIONS.length,
      timeInText: true,
      recommended: true,
    },
    {
      mode: "remix",
      icon: Repeat,
      title: "Remix exam",
      text: "25 twisted questions where a wrong answer becomes right. Tests real understanding.",
      count: REMIX_COUNT,
    },
    {
      mode: "quick",
      icon: Zap,
      title: "Quick 20",
      text: "20 random questions. Good for a warm-up or a coffee break.",
      count: Math.min(20, QUESTIONS.length),
    },
    {
      mode: "miss",
      icon: Target,
      title: `My misses (${misses})`,
      text: "Only the questions you've gotten wrong.",
      count: misses,
    },
    {
      mode: "topic",
      icon: Crosshair,
      title: "Topic drill",
      text: "Every question from one topic, shuffled. Great right after you study it.",
      count: QUESTIONS.filter((q) => q.t === topic).length,
    },
  ]
  const selected = modes.find((m) => m.mode === mode) ?? modes[0]

  const start = () => (mode === "topic" ? startExam("topic", { topic }) : startExam(mode))

  const toggleKeys = (on: boolean) => {
    setKeysOn(on)
    saveShortcuts(on)
  }

  // Flashcards: C952's deck, counted as a guide's (cardCounts), its knew-it share in the header's Progress
  const cards = practiceMode === "cards"
  const cardTotal = C952_CARDS.length
  const deck = cardCounts({ slug: C952, cardTotal }, store)
  const knewPct = percent(deck.knew, cardTotal)
  // the switch moves no focus: it stays on the radio, and the radios stay mounted in the header
  const choosePractice = (next: PracticeMode) => {
    if (next === practiceMode) return
    onPracticeMode(next)
    setSwitched(true)
  }

  return (
    <>
      <header className="mt-12 sm:mt-16 short:mt-6">
        <p className={LABEL}>C952 · Simulation</p>
        {/* Title decrypt (Surfaces): tabIndex -1 keeps the App's route-change focus landing on `#app h1` */}
        <DecryptText
          as="h1"
          text={PAGE_TITLE}
          variant="display"
          trigger="mount"
          loop={false}
          retriggerOnHover={false}
          glyphs="0123456789ABCDEF"
          speed={45}
          stagger={Math.min(40, Math.round(1000 / PAGE_TITLE.length))}
          startDelay={150}
          jitter={80}
          tabIndex={-1}
          className={TITLE}
        />
        {/* the lead of the mode shown, as on a guide's Practice */}
        {cards ? (
          <p className={LEAD}>
            <span className="font-mono text-sm text-foreground">{cardTotal}</span> cards ·{" "}
            <span className="font-mono text-sm text-foreground">{deck.knew}</span> knew it ·{" "}
            <span className="font-mono text-sm text-foreground">{deck.again}</span> to study again
          </p>
        ) : (
          <p className={LEAD}>Pick a mode. Answer choices are shuffled so you learn the ideas, not the letter positions.</p>
        )}
        <PracticeWith mode={practiceMode} onChange={choosePractice} questions={QUESTIONS.length} cards={cardTotal} />
        {cards && (
          <div className="mt-6 flex max-w-[520px] items-center gap-4">
            <Progress
              className="flex-1"
              value={knewPct}
              aria-label="Knew it"
              aria-valuenow={knewPct}
              aria-valuetext={`${deck.knew} of ${cardTotal} knew it`}
            />
            <span className="w-10 text-right font-mono text-sm text-muted-foreground">{knewPct}%</span>
          </div>
        )}
      </header>

      {cards ? (
        // one card at a time, as a guide's Flashcards: the lists, status line and focus moves are the same
        <GuideFlashcards
          slug={C952}
          facts={C952_CARDS}
          counts={deck}
          store={store}
          update={update}
          filter={cardFilter}
          onFilter={onCardFilter}
          enter={fade}
        />
      ) : (
        // Questions: the exam's mode picker, as it always was; after a switch back here its windows are there at once
        <>
          <Entrance fade={fade} delay={0.04} className="mt-8">
            <Alert role="note">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Like you're 5</AlertTitle>
              <AlertDescription>
                The <b>Full exam</b> is a full practice run. The <b>Remix exam</b> is the sneaky one: same answer choices,
                but the question is twisted so a <i>different</i> answer is right. If you can beat Remix, you know the idea,
                not just the answer.
              </AlertDescription>
            </Alert>
          </Entrance>

          <h2 id={modesHeading} className="sr-only">
            Choose a mode
          </h2>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as ExamMode)}
            aria-labelledby={modesHeading}
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {modes.map((m, i) => (
              <Entrance
                key={m.mode}
                fade={fade}
                delay={0.08 + 0.04 * i}
                className={cn("h-full", m.mode === "topic" && "sm:col-span-2")}
              >
                <ModeCard spec={m} onSelect={() => setMode(m.mode)}>
                  {m.mode === "topic" && (
                    <div className="mt-4 grid max-w-sm gap-2">
                      <Label htmlFor={topicId}>Topic</Label>
                      <Select
                        value={topic}
                        onValueChange={(v) => {
                          setTopic(v as TopicId)
                          setMode("topic")
                        }}
                      >
                        <SelectTrigger id={topicId}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOPICS.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </ModeCard>
              </Entrance>
            ))}
          </RadioGroup>

          <Entrance fade={fade} delay={0.28}>
            <Card className="mt-4">
              <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Shortcuts Switch row (Switch README): icon 24px muted, the label and its sans description, the
                    Switch. The bordered row is the Switch's <label>, so a tap anywhere in it toggles it (decision 36:
                    the row with its Label is the target); the name stays "Keyboard shortcuts" through aria-labelledby */}
                <label
                  htmlFor={keysId}
                  className="flex items-center space-x-4 rounded-md border p-4 lg:min-w-0 lg:flex-1"
                >
                  <Keyboard aria-hidden="true" className="size-6 flex-none text-muted-foreground" />
                  <span className="flex-1 space-y-2">
                    <span id={`${keysId}-l`} className="block text-sm font-medium leading-none">
                      Keyboard shortcuts
                    </span>
                    <span id={`${keysId}-d`} className="block font-sans text-sm text-muted-foreground">
                      Number keys pick an answer, ← → move between questions.
                    </span>
                  </span>
                  <Switch
                    id={keysId}
                    checked={keysOn}
                    onCheckedChange={toggleKeys}
                    aria-labelledby={`${keysId}-l`}
                    aria-describedby={`${keysId}-d`}
                  />
                </label>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-none">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {mode === "topic" ? `Topic drill: ${TOPICS.find((t) => t.id === topic)?.name}` : selected.title}
                    </span>
                    {" · "}
                    {plural(selected.count, "question")} · {minutes(selected.count)}
                  </p>
                  {/* the view's one gold fill (Button default lg, replacing LiquidMetalButton); Flashcards has its own,
                      "Show answer", and never shows this one */}
                  <Button size="lg" onClick={start}>
                    Start exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Entrance>

          {store.history.length > 0 && <RecentAttempts history={store.history} fade={fade} />}
        </>
      )}
    </>
  )
}
