/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Practice Exam debrief: the score (gauge + ticker in a Readout frame: a Card with two muted corner brackets),
 * accuracy by topic (Table), a map of every question, then the review: each question in an Accordion item with the
 * full breakdown.
 *
 * Monochrome states: right = success badge with a check, wrong = destructive badge with ✕, skipped = outline with –.
 * "Wrong" has one meaning on this screen: every question not answered correctly. A blank answer counts as
 * wrong (as the submit dialog says), so the tally, the map and the "Wrong only" tab always show the same number.
 */
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Check, ChevronsUpDown, Minus, Repeat, Shuffle, Trophy, X } from "lucide-react"
import { QUESTIONS, QUESTION_BY_N, TOPIC_BY_ID, type TopicId } from "@/data"
import { isRight, type ExamItem } from "@/lib/exam"
import { cn } from "@/lib/utils"
import type { ResultsProps } from "@/views/exam/props"
import { Rich } from "@/components/kit"
import {
  Explanation,
  OptionButton,
  QuestionCount,
  QuestionFrame,
  QuestionMeta,
  QuestionOptions,
  QuestionText,
  type OptionState,
} from "@/components/question"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CornerFrame } from "@/components/ui/corner-frame"
import { DecryptText } from "@/components/ui/decrypt-text"
import { EmptyState } from "@/components/ui/empty-state"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Type styles (Surfaces, Style shorthand). `body` is mono, so only sans styles opt in. */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em]"
/** A window's own heading and a section h2 (`heading`, CardTitle's type, as an h2). */
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
/** The page h1: Surfaces' Title decrypt recipe (`title` style). */
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
/** The Results score (`score` style). */
const SCORE = "font-mono text-[clamp(64px,18vw,96px)] leading-none font-semibold tracking-[-0.02em] text-foreground"

/** Zero-pads a sequence number to the width of its total: `01`–`60`, `1`–`9` (README, Numbers). */
const pad = (n: number, total: number) => String(n).padStart(String(total).length, "0")
/** A bank question number, padded to the bank's width like Learn and My Misses (`Q05`). */
const padQ = (n: number) => pad(n, QUESTIONS.length)
/** When the app's modules loaded: tells a page reload straight onto old results apart from arriving via Submit. */
const APP_START = performance.now()

function debriefLine(pct: number) {
  if (pct >= 90) return "Mission ready. Keep it sharp until exam day."
  if (pct >= 80) return "Strong run. Clean up the misses and you're set."
  if (pct >= 65) return "Getting there. Review the misses below and try again."
  return "Good start. Study the topics with the shortest bars first."
}

const itemValue = (i: number) => `r-${i}`

/** Scrolls to a review item and moves focus to its trigger, so keyboard and screen reader users land on it too. */
function scrollToItem(i: number) {
  const el = document.getElementById(itemValue(i))
  if (!el) return
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  // Land just under the sticky header using the item's own scroll-margin. scrollIntoView would also add
  // the page's scroll-padding on top of it and leave a large gap.
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margin, behavior: reduce ? "auto" : "smooth" })
  el.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })
}

/**
 * When the control that had focus has just been removed (Submit on the way in, Retake / Other modes on the way out),
 * focus falls to <body>. Hand it to the page title that is on screen by then. No-op if something else took focus.
 */
function focusTitleIfLost() {
  return window.setTimeout(() => {
    const active = document.activeElement
    if (active && active !== document.body) return
    const h1 = document.querySelector<HTMLElement>("#app h1")
    if (!h1) return
    if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1")
    h1.focus({ preventScroll: true })
  }, 60)
}

/* ── Score ──────────────────────────────────────────────────────────────── */

/**
 * Magic UI's gauge (it prints the percentage itself) next to the number of right answers counting up.
 * The gauge starts empty and sweeps up through its own CSS transition; with reduced motion both show the result at once.
 * Both are hidden from screen readers, which get the plain sentence instead.
 */
function ScoreFigures({ pct, score, total, time }: { pct: number; score: number; total: number; time: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(() => (reduce ? pct : 0))

  useEffect(() => {
    if (reduce) {
      setShown(pct)
      return
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setShown(pct))
    })
    return () => cancelAnimationFrame(raf)
  }, [pct, reduce])

  return (
    <>
      <div aria-hidden="true" className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <AnimatedCircularProgressBar
          max={100}
          min={0}
          value={shown}
          gaugePrimaryColor="var(--primary)"
          gaugeSecondaryColor="var(--secondary)"
        />
        <div className="text-center sm:text-left">
          {/* `score` style; NumberTicker ignores reduced motion, so the plain value shows then (NumberTicker README) */}
          <p className={SCORE}>{reduce || score === 0 ? score : <NumberTicker value={score} />}</p>
          {/* "of N correct · m:ss" in `data` muted */}
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            of {total} correct
            {time && (
              <>
                {" · "}
                <span className="font-mono">{time}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <p className="sr-only">
        {score} of {total} correct, {pct}%{time && `, in ${time}`}.
      </p>
    </>
  )
}

/* ── By topic ───────────────────────────────────────────────────────────── */

type TopicRow = { id: TopicId; r: number; n: number }
/** wrong = every question not answered correctly; skipped = the part of it left blank. */
type Tally = { correct: number; wrong: number; skipped: number }

function TopicBreakdown({ rows, tally }: { rows: TopicRow[]; tally: Tally }) {
  // Point at the weakest topic: lowest accuracy first, ties broken by the most misses.
  // Shown only when it singles out one or two topics.
  const rate = (t: TopicRow) => t.r / t.n
  const misses = (t: TopicRow) => t.n - t.r
  const worst = [...rows].sort((a, b) => rate(a) - rate(b) || misses(b) - misses(a))[0]
  const weakest = worst ? rows.filter((t) => rate(t) === rate(worst) && misses(t) === misses(worst)) : []
  const studyFirst = worst && rate(worst) < 1 && weakest.length <= 2 && weakest.length < rows.length ? weakest : []

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <h2 className={HEADING}>By topic</h2>
        <CardDescription>Correct / asked</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Table>
          <TableCaption className="sr-only">Correct answers by topic</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead className="w-1/3">Accuracy</TableHead>
              <TableHead className="text-right">Correct</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ id, r, n }) => {
              const t = TOPIC_BY_ID[id]
              const Icon = t.icon
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {/* topic icon 16px, muted at rest (README, Iconography) */}
                      <Icon className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
                      {t.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Progress forwards `value` to the Radix root; aria-valuenow is passed rounded */}
                    <Progress
                      value={(100 * r) / n}
                      aria-label={`${t.name}: ${r} of ${n} correct`}
                      aria-valuenow={Math.round((100 * r) / n)}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r}/{n}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Correct</TableCell>
              <TableCell className="text-right tabular-nums">{tally.correct}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>
                Wrong
                {tally.skipped > 0 && <span className="font-normal text-muted-foreground"> (incl. {tally.skipped} skipped)</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums">{tally.wrong}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
      {studyFirst.length > 0 && (
        <CardFooter className="flex-wrap gap-2">
          <span className="text-sm font-medium">Study first:</span>
          {studyFirst.map(({ id }) => {
            const Icon = TOPIC_BY_ID[id].icon
            return (
              <Badge key={id} variant="outline" size="md">
                <Icon aria-hidden="true" />
                {TOPIC_BY_ID[id].name}
              </Badge>
            )
          })}
        </CardFooter>
      )}
    </Card>
  )
}

/* ── Question map ───────────────────────────────────────────────────────── */

/**
 * The navigator's cells, marked (Surfaces, Question map): correct `success` solid with Check, wrong `destructive`
 * solid with X, unanswered `outline` with Minus and a `muted-foreground` boundary; numbers zero-padded.
 */
function QuestionMap({ right, ans, onJump }: { right: boolean[]; ans: number[][]; onJump: (i: number) => void }) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-2 space-y-0">
        <h2 className={HEADING}>Question map</h2>
        <CardDescription>Tap a number to jump to it</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
          {right.map((ok, i) => {
            const skipped = !ans[i]?.length
            const Icon = ok ? Check : skipped ? Minus : X
            return (
              <li key={i}>
                <Badge
                  render={<button type="button" />}
                  onClick={() => onJump(i)}
                  aria-label={`Question ${i + 1}: ${ok ? "correct" : skipped ? "skipped" : "wrong"}`}
                  variant={ok ? "success" : skipped ? "outline" : "destructive"}
                  size="lg"
                  className={cn(
                    "w-full tabular-nums pointer-coarse:h-11 pointer-coarse:min-w-11",
                    skipped && "border-muted-foreground",
                  )}
                >
                  {pad(i + 1, right.length)}
                  <Icon aria-hidden="true" />
                </Badge>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

/* ── Review ─────────────────────────────────────────────────────────────── */

function StatusBadge({ ok, answered }: { ok: boolean; answered: boolean }) {
  if (ok)
    return (
      <Badge variant="success" appearance="light" size="sm">
        <Check aria-hidden="true" />
        Correct
      </Badge>
    )
  if (answered)
    return (
      <Badge variant="destructive" appearance="light" size="sm">
        <X aria-hidden="true" />
        Wrong
      </Badge>
    )
  return (
    <Badge variant="outline" size="sm">
      <Minus aria-hidden="true" />
      Skipped
    </Badge>
  )
}

/** The remix's own "why", then the original question's breakdown behind a Collapsible. */
function RemixWhy({ item }: { item: ExamItem }) {
  const [open, setOpen] = useState(false)
  const q = QUESTION_BY_N[item.n]
  return (
    <>
      <Alert role="note" className="mt-4">
        <Repeat className="h-4 w-4" aria-hidden="true" />
        {/* font-mono: this Alert sits in the review AccordionContent (sans), and Alert titles are never sans (Alert
            README), as question.tsx's Explanation does for its titles */}
        <AlertTitle className="font-mono">
          Why · remix of <span className="font-mono">Q{padQ(item.n)}</span>
        </AlertTitle>
        <AlertDescription>
          <Rich html={item.fwhy ?? ""} />
        </AlertDescription>
      </Alert>
      <Collapsible open={open} onOpenChange={setOpen} className="mt-4 space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="mr-2 h-4 w-4" aria-hidden="true" />
            {open ? "Hide" : "See"} the original Q{padQ(item.n)} breakdown
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Explanation q={q} />
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}

function ReviewItem({
  item,
  index,
  total,
  ok,
  picked,
}: {
  item: ExamItem
  index: number
  total: number
  ok: boolean
  picked: number[]
}) {
  const q = QUESTION_BY_N[item.n]
  const topic = TOPIC_BY_ID[q.t]
  const TopicIcon = topic.icon
  const answered = picked.length > 0

  return (
    <AccordionItem value={itemValue(index)} id={itemValue(index)} className="scroll-mt-28">
      <AccordionTrigger className="gap-4 text-left">
        <span className="flex flex-wrap items-center gap-2">
          {/* `subheading` title, zero-padded to the total (Accordion README: "Question {pad(n)}") */}
          <span>Question {pad(index + 1, total)}</span>
          <StatusBadge ok={ok} answered={answered} />
          <Badge variant="outline" size="sm">
            <TopicIcon aria-hidden="true" />
            {topic.name}
          </Badge>
          {/* Q-numbers in mono, as in the exam runner */}
          {item.remix ? (
            <Badge variant="info" appearance="light" size="sm">
              <Repeat aria-hidden="true" />
              <span>
                Remix of <span className="font-mono">Q{padQ(item.n)}</span>
              </span>
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              <span className="font-mono">Q{padQ(item.n)}</span>
            </Badge>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <QuestionFrame className="my-0">
          <QuestionMeta right={<QuestionCount index={index + 1} total={total} />}>
            <span>Question</span>
          </QuestionMeta>
          <QuestionText html={item.text} code={item.code} index={pad(index + 1, total)} />
          <QuestionOptions>
            {item.opts.map((o, j) => {
              const mine = picked.includes(o.k)
              const state: OptionState = item.correct.includes(o.k) ? "right" : mine ? "wrong" : ""
              return (
                <OptionButton
                  key={o.k}
                  index={j}
                  text={o.t}
                  mono={item.mono}
                  state={state}
                  disabled
                  note={mine ? "(your answer)" : undefined}
                />
              )
            })}
          </QuestionOptions>
          {item.remix ? <RemixWhy item={item} /> : <Explanation q={q} />}
        </QuestionFrame>
      </AccordionContent>
    </AccordionItem>
  )
}

/* ── View ───────────────────────────────────────────────────────────────── */

export default function Results({ exam, setExam, startExam }: ResultsProps) {
  const total = exam.items.length
  const pct = total ? Math.round((100 * exam.score) / total) : 0

  const right = exam.items.map((_, i) => isRight(exam, i))
  // An empty answer can never be right, so every skip is also one of the wrong ones.
  const wrong = right.filter((ok) => !ok).length
  const skipped = exam.ans.filter((a) => a.length === 0).length
  const tally: Tally = { correct: total - wrong, wrong, skipped }

  const byTopic = new Map<TopicId, TopicRow>()
  exam.items.forEach((item, i) => {
    const id = QUESTION_BY_N[item.n].t
    const row = byTopic.get(id) ?? { id, r: 0, n: 0 }
    row.n += 1
    if (right[i]) row.r += 1
    byTopic.set(id, row)
  })
  const topicRows = [...byTopic.values()].sort((a, b) => a.id.localeCompare(b.id))

  const all = exam.items.map((item, i) => ({ item, i, ok: right[i] }))
  const wrongOnly = all.filter((x) => !x.ok)
  const visible = exam.review === "all" ? all : wrongOnly

  // Review items open in the Accordion; the map and "Show all" open the one they jump to.
  const [openItems, setOpenItems] = useState<string[]>([])
  const openItem = (i: number) => setOpenItems((o) => (o.includes(itemValue(i)) ? o : [...o, itemValue(i)]))

  // Arriving from Submit, the button that had focus is gone: start at this page's title instead of <body>.
  // Not on a page reload (like App, which leaves focus alone on first render).
  useEffect(() => {
    if (performance.now() - APP_START < 1500) return
    const id = focusTitleIfLost()
    return () => window.clearTimeout(id)
  }, [])

  // An item can be hidden by "Wrong only" (map jump to a correct answer, or "Show all" in the empty state):
  // switch to All, then scroll and focus once it has rendered. The All tab's content mounts a render after the
  // switch (Radix Presence), so wait a few frames for the item to exist.
  const pendingJump = useRef<number | null>(null)
  useEffect(() => {
    const i = pendingJump.current
    if (i === null) return
    pendingJump.current = null
    let raf = 0
    let tries = 0
    const go = () => {
      if (document.getElementById(itemValue(i))) scrollToItem(i)
      else if (tries++ < 10) raf = requestAnimationFrame(go)
    }
    go()
    return () => cancelAnimationFrame(raf)
  }, [exam.review])

  const setReview = (review: "wrong" | "all") => setExam((e) => (e ? { ...e, review } : e))

  const jumpTo = (i: number) => {
    openItem(i)
    if (exam.review === "wrong" && right[i]) {
      pendingJump.current = i
      setReview("all")
    } else {
      scrollToItem(i)
    }
  }

  // The "Show all" button goes away with the empty state, so focus moves on to the first item.
  const showAll = () => {
    openItem(0)
    pendingJump.current = 0
    setReview("all")
  }

  // After a perfect "My misses" run the misses list is empty, so a retake would have no questions.
  const canRetake = !(exam.mode === "miss" && wrong === 0)
  const retake = () => {
    startExam(exam.mode, exam.opt)
    focusTitleIfLost()
  }
  const otherModes = () => {
    setExam(null)
    window.scrollTo({ top: 0 })
    focusTitleIfLost()
  }
  // One gold fill per view: the score readout's Retake (or Other modes when there is nothing to retake). The repeat at
  // the end of the page is all outline (Surfaces, #exam Results 6).
  const actions = (repeat: boolean) => (
    <>
      {canRetake && (
        <Button variant={repeat ? "outline" : "default"} onClick={retake}>
          <Shuffle className="mr-2 h-4 w-4" aria-hidden="true" />
          Retake (reshuffled)
        </Button>
      )}
      <Button variant={canRetake || repeat ? "outline" : "default"} onClick={otherModes}>
        Other modes
      </Button>
    </>
  )
  const title = `Results: ${exam.name}`

  const reviewList = (list: typeof all) =>
    list.length > 0 ? (
      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
        {list.map(({ item, i, ok }) => (
          <ReviewItem key={i} item={item} index={i} total={total} ok={ok} picked={exam.ans[i] ?? []} />
        ))}
      </Accordion>
    ) : (
      <div className="flex justify-center">
        <EmptyState
          icons={[Trophy]}
          title="Perfect, nothing wrong."
          description="Want the explanations anyway? Walk through every question."
          action={{ label: `Show all ${total}`, onClick: showAll }}
        />
      </div>
    )

  return (
    <>
      <header className="mt-12 sm:mt-16 short:mt-6">
        <p className={cn(LABEL, "text-muted-foreground")}>C952 · Debrief</p>
        {/* Title decrypt (Surfaces): tabIndex -1 keeps focus landing on `#app h1` (App, focusTitleIfLost) */}
        <DecryptText
          as="h1"
          text={title}
          variant="display"
          trigger="mount"
          loop={false}
          retriggerOnHover={false}
          glyphs="0123456789ABCDEF"
          speed={45}
          stagger={Math.min(40, Math.round(1000 / title.length))}
          startDelay={150}
          jitter={80}
          tabIndex={-1}
          className={TITLE}
        />
      </header>

      {/* grid-cols-1 below lg: an implicit auto column grew to the By-topic table's width and overflowed phones */}
      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* ── Score: the Readout frame (two corners, no variants: read, not pressed), replacing the BorderBeam ── */}
        <BlurFade delay={0.02} className="h-full">
          <CornerFrame asChild corners={["top-left", "bottom-right"]} size="16px" thickness="2px" inset="8px">
            <Card className="flex h-full flex-col gap-6 p-6">
              <div className="space-y-2">
                <h2 className={HEADING}>Your score</h2>
                <CardDescription>{debriefLine(pct)}</CardDescription>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <ScoreFigures pct={pct} score={exam.score} total={total} time={exam.time} />
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-2">{actions(false)}</div>
                {!canRetake && (
                  <p className="text-center font-sans text-sm text-muted-foreground">
                    You cleared your misses list, so there's nothing left to retake.
                  </p>
                )}
              </div>
            </Card>
          </CornerFrame>
        </BlurFade>

        {/* ── By topic ────────────────────────────────────────── */}
        <BlurFade delay={0.08} className="h-full">
          <TopicBreakdown rows={topicRows} tally={tally} />
        </BlurFade>
      </div>

      {/* ── Question map ──────────────────────────────────────── */}
      <BlurFade delay={0.14} className="mt-4">
        <QuestionMap right={right} ans={exam.ans} onJump={jumpTo} />
      </BlurFade>

      {/* ── Review ────────────────────────────────────────────── */}
      <Tabs value={exam.review} onValueChange={(v) => setReview(v === "all" ? "all" : "wrong")}>
        {/* Section heading (eyebrow `label`, h2 `heading`) with the Tabs in the aside's place; heading to content 24 */}
        <div className="mt-20 mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-2">
            <p className={cn(LABEL, "text-muted-foreground")}>Walkthrough</p>
            <h2 className={HEADING}>Review</h2>
          </div>
          <TabsList aria-label="Which questions to review">
            {/* counts after the word in `data` (Tabs README) */}
            <TabsTrigger value="wrong">
              Wrong only<span className="ml-2 font-normal">{wrong}</span>
            </TabsTrigger>
            <TabsTrigger value="all">
              All<span className="ml-2 font-normal">{total}</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="wrong" className="mt-0">
          {reviewList(wrongOnly)}
        </TabsContent>
        <TabsContent value="all" className="mt-0">
          {reviewList(all)}
        </TabsContent>
      </Tabs>

      {visible.length > 0 && (
        <BlurFade inView>
          <Separator className="mt-12" />
          <div className="flex flex-col items-center gap-4 pt-10 text-center">
            <p className="font-sans text-muted-foreground">Done reviewing?</p>
            <div className="flex flex-wrap justify-center gap-2">{actions(true)}</div>
          </div>
        </BlurFade>
      )}
    </>
  )
}
