/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The practice exam's mode picker, every course's (decision 60): Practice's Exam mode, on C952's Practice Exam start
 * screen (Setup) and on a guide's Practice (GuidePractice). Moved out of Setup.tsx as it was, over a course's bank: the
 * ELI5 Alert, one mode card per mode the bank supports (modeSpecs: C952's five; a guide's Full exam and My misses
 * today), the Topic Select when the bank has topics, the summary window (the Shortcuts row, the selection line and the
 * view's one gold fill, "Start exam") and the logbook of this course's own attempts with its best Full exam score.
 */
import { useId, useState, type ReactNode } from "react"
import { Crosshair, GraduationCap, Keyboard, Lightbulb, Repeat, Target, Zap, type LucideIcon } from "lucide-react"
import { attemptsOf, bestOf, modeSpecs, type ExamBank, type ExamMode, type ModeSpec } from "@/lib/exam"
import type { Attempt, Store } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { StartExam } from "@/views/types"
import type { ExamContent } from "@/views/exam/content"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { CornerFrame } from "@/components/ui/corner-frame"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/** Type styles (Surfaces, Style shorthand). */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** Time budget at 45–60 s per question, e.g. 20 questions → "15–20 min". */
function minutes(n: number) {
  const raw = n * 0.75
  const lo = n >= 20 ? Math.round(raw / 5) * 5 : Math.round(raw)
  return lo > 0 && lo < n ? `${lo}–${n} min` : `~${Math.max(1, n)} min`
}

interface CardSpec {
  mode: ExamMode
  icon: LucideIcon
  title: string
  text: string
  count: number
  /** the description already gives the time, so the meta line shows only the question count */
  timeInText?: boolean
  recommended?: boolean
}

/** A mode's card: its icon, name and description, the Full exam's from the course (ExamContent.full). */
function cardSpec({ mode, count }: ModeSpec, content: ExamContent): CardSpec {
  if (mode === "full")
    return { mode, count, icon: GraduationCap, title: "Full exam", text: content.full.text, timeInText: content.full.timeInText, recommended: true }
  if (mode === "remix")
    return {
      mode,
      count,
      icon: Repeat,
      title: "Remix exam",
      text: `${count} twisted questions where a wrong answer becomes right. Tests real understanding.`,
    }
  if (mode === "quick")
    return { mode, count, icon: Zap, title: "Quick 20", text: "20 random questions. Good for a warm-up or a coffee break." }
  if (mode === "miss")
    return { mode, count, icon: Target, title: `My misses (${count})`, text: "Only the questions you've gotten wrong." }
  return {
    mode,
    count,
    icon: Crosshair,
    title: "Topic drill",
    text: "Every question from one topic, shuffled. Great right after you study it.",
  }
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
  spec: CardSpec
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
 * A window's way in: a BlurFade, as the start screen always had, when Exam is the page's first view; after a
 * "Practice with" switch, still, resting 6px up where the fade settles (a switch is a change of state, so it is
 * instant).
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
 * The course's last 8 attempts, newest first, in a shadcn Table, with its best Full exam score in the heading's aside.
 * Cells wrap on phones, the date is the short form ("11/22/26, 12:13 AM"; the <time> keeps the exact moment), and
 * below 375px cells keep 8px side padding instead of 16 (TIGHT), so the table never scrolls sideways: at 320 the card
 * holds 286px.
 */
const TIGHT = "max-[374px]:px-2"

function RecentAttempts({
  history,
  best,
  code,
  fade,
}: {
  history: Attempt[]
  best: number | null
  code: string
  fade: boolean
}) {
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
        <p className="text-xs text-muted-foreground">
          {best !== null && `Best full exam ${best}% · `}Last {recent.length} · newest first
        </p>
      </div>
      <Entrance fade={fade} inView>
        <Card>
          <Table>
            <TableCaption className="sr-only">
              Your last {recent.length} {code} practice exams, newest first
            </TableCaption>
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

/* ── The picker ─────────────────────────────────────────────────────────── */

/**
 * Practice's Exam mode over `bank`: the cards fade in only when it is the page's first view (`fade`); after a
 * "Practice with" switch they are there at once. Two or more modes sit two to a row from 640, three from 1024 when
 * there are three or more.
 */
export function ExamPicker({
  bank,
  content,
  store,
  startExam,
  fade,
}: {
  bank: ExamBank
  content: ExamContent
  store: Store
  startExam: StartExam
  fade: boolean
}) {
  const [mode, setMode] = useState<ExamMode>("full")
  const [topic, setTopic] = useState<string>(() => bank.topics[0]?.id ?? "")
  const [keysOn, setKeysOn] = useState(readShortcuts)
  const modesHeading = useId()
  const topicId = useId()
  const keysId = useId()

  const modes = modeSpecs(bank, store, topic).map((s) => cardSpec(s, content))
  const selected = modes.find((m) => m.mode === mode) ?? modes[0]
  const topicName = bank.topics.find((t) => t.id === topic)?.name ?? ""

  const start = () => (selected.mode === "topic" ? startExam(bank, "topic", { topic }) : startExam(bank, selected.mode))

  const toggleKeys = (on: boolean) => {
    setKeysOn(on)
    saveShortcuts(on)
  }

  const attempts = attemptsOf(store, bank.course)

  return (
    <>
      <Entrance fade={fade} delay={0.04} className="mt-8">
        <Alert role="note">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Like you're 5</AlertTitle>
          <AlertDescription>{content.eli5}</AlertDescription>
        </Alert>
      </Entrance>

      <h2 id={modesHeading} className="sr-only">
        Choose a mode
      </h2>
      <RadioGroup
        value={selected.mode}
        onValueChange={(v) => setMode(v as ExamMode)}
        aria-labelledby={modesHeading}
        className={cn("mt-6 grid gap-4 sm:grid-cols-2", modes.length >= 3 && "lg:grid-cols-3")}
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
                      setTopic(v)
                      setMode("topic")
                    }}
                  >
                    <SelectTrigger id={topicId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bank.topics.map((t) => (
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
            <label htmlFor={keysId} className="flex items-center space-x-4 rounded-md border p-4 lg:min-w-0 lg:flex-1">
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
                  {selected.mode === "topic" ? `Topic drill: ${topicName}` : selected.title}
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

      {attempts.length > 0 && (
        <RecentAttempts history={attempts} best={bestOf(store, bank.course)} code={content.code} fade={fade} />
      )}
    </>
  )
}
