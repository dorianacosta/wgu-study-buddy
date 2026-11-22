/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { useEffect, useId, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Lightbulb,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import { QUESTIONS, TOPICS, TOPIC_BY_ID, type TopicId } from "@/data"
import { C952_BANK } from "@/lib/exam"
import { initialLearnTopic, patchEntry } from "@/lib/routes"
import { topicProgress, type Store } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { C952LearnProps } from "@/views/types"
import { CourseStatus } from "@/views/course/CourseStatus"
import { Rich } from "@/components/kit"
import { ExamInProgressNotice, NewQuestionsNotice } from "@/components/notices"
import { QuestionCard } from "@/components/question"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { CornerFrame } from "@/components/ui/corner-frame"
import { DecryptText } from "@/components/ui/decrypt-text"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

/* Type styles (Surfaces, Style shorthand) */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
/** the Title decrypt recipe's className (`title`) */
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
const LEAD = "max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"
/** `heading`: CardTitle's style, for a window heading that must be an h2 (CardTitle renders an h3) */
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
/** `subheading`: names inside target windows */
const SUBHEADING = "font-mono text-base font-semibold"
/** Magic UI bento-grid: how BentoCard shows its lucide icon (bare, muted, shrinks on the card's hover) */
const BENTO_ICON = "origin-left transform-gpu text-muted-foreground transition-all duration-300 ease-in-out group-hover:scale-75"

/** Target frame (Surfaces): four brackets, gold under the pointer and on keyboard focus... */
const TARGET_FRAME = "hover:[--corner-frame-color:var(--primary)] focus-visible:[--corner-frame-color:var(--primary)]"
/** ...and, on the topic picker, on the current topic */
const CURRENT_FRAME = "aria-[current=true]:[--corner-frame-color:var(--primary)]"

const pad = (n: number) => String(n).padStart(2, "0")

/** Topics with at least this many questions end with a "next step" block, so quizzing needs no scroll back up. */
const LIST_END_MIN = 4

function TopicGlyph({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return <Icon className={cn(BENTO_ICON, className)} aria-hidden="true" />
}

/**
 * Topic picker: one target window per topic (Target frame on the button, the Card inside it). One swipeable row on
 * phones (active card kept centered), a 4-column grid from md up. The current topic's brackets stay gold.
 */
function TopicSwitcher({
  topic,
  setTopic,
  store,
  className,
}: {
  topic: TopicId
  setTopic: (id: TopicId) => void
  store: Store
  className?: string
}) {
  const rowRef = useRef<HTMLUListElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const shownTopic = useRef(topic)
  const reduceMotion = useReducedMotion()

  // Center the active card on first paint and whenever the row changes size (e.g. a phone turned upright, where the
  // md+ grid becomes one row). Moves only the row's own scroll, never the page.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const ro = new ResizeObserver(() => {
      const card = activeRef.current
      if (!card || row.scrollWidth <= row.clientWidth) return
      const r = row.getBoundingClientRect()
      const c = card.getBoundingClientRect()
      row.scrollLeft += c.left + c.width / 2 - (r.left + r.width / 2)
    })
    ro.observe(row)
    return () => ro.disconnect()
  }, [])

  // Glide the newly active card into view on a topic switch (only when the row scrolls, i.e. on phones).
  // Compared against the last topic shown, so the mount (and StrictMode's second effect run) is a no-op.
  useEffect(() => {
    if (shownTopic.current === topic) return
    shownTopic.current = topic
    const row = rowRef.current
    const card = activeRef.current
    if (row && card && row.scrollWidth > row.clientWidth) {
      card.scrollIntoView({ inline: "center", block: "nearest", behavior: reduceMotion ? "auto" : "smooth" })
    }
  }, [topic, reduceMotion])

  return (
    <nav aria-label="Topics" className={className}>
      {/* relative: the cards' sr-only text is absolutely positioned; without a positioned scroller it escaped the
          row's overflow clip and widened the whole page on phones (measured 1353px at 375px). The row bleeds into
          main's gutters (16px, 24px from 640px) so a card scrolls to the screen edge; py-1 keeps focus outlines inside
          the scroller's clip */}
      <ul
        ref={rowRef}
        role="list"
        className="relative -mx-4 flex snap-x gap-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0"
      >
        {TOPICS.map((t) => {
          const p = topicProgress(t.id, store)
          const active = t.id === topic
          const done = p.total > 0 && p.mastered === p.total
          return (
            <li key={t.id} className="w-44 flex-none snap-center md:w-auto">
              <CornerFrame asChild size="16px" thickness="2px" inset="8px" className={cn(TARGET_FRAME, CURRENT_FRAME)}>
                <button
                  ref={active ? activeRef : undefined}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  aria-current={active ? "true" : undefined}
                  className="group block h-full w-full rounded-lg text-left"
                >
                  <Card className="flex h-full flex-col items-start gap-4 p-4">
                    <TopicGlyph icon={t.icon} className="h-6 w-6" />
                    <span className={cn("break-words", SUBHEADING)}>{t.name}</span>
                    {/* the current topic's count fills (primary); a done topic gets a check in a soft badge, so done
                        and current never rely on the fill alone. Mastered is zero-padded to the total's width */}
                    <Badge
                      variant={active ? "primary" : done ? "success" : "outline"}
                      appearance={!active && done ? "light" : "default"}
                      size="sm"
                      aria-hidden="true"
                    >
                      {done && <Check />}
                      {String(p.mastered).padStart(String(p.total).length, "0")}/{p.total}
                    </Badge>
                    <span className="sr-only">
                      , {p.mastered} of {p.total} mastered
                    </span>
                  </Card>
                </button>
              </CornerFrame>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Previous / next topic: a target window (Target frame on the button, the Card inside it). */
function StepCard({
  dir,
  name,
  onClick,
  className,
}: {
  dir: "prev" | "next"
  name: string
  onClick: () => void
  className?: string
}) {
  const Arrow = dir === "prev" ? ArrowLeft : ArrowRight
  const arrow = <Arrow className="h-5 w-5 flex-none text-muted-foreground" aria-hidden="true" />
  return (
    <CornerFrame asChild size="16px" thickness="2px" inset="8px" className={TARGET_FRAME}>
      <button
        type="button"
        onClick={onClick}
        className={cn("block h-full w-full rounded-lg", dir === "next" ? "text-right" : "text-left", className)}
      >
        <Card className="flex h-full items-center gap-4 p-6">
          {dir === "prev" && arrow}
          <span className="min-w-0 flex-1">
            <span className={cn("block", LABEL)}>{dir === "prev" ? "Previous topic" : "Next topic"}</span>
            <span className={cn("mt-2 block break-words", SUBHEADING)}>{name}</span>
          </span>
          {dir === "next" && arrow}
        </Card>
      </button>
    </CornerFrame>
  )
}

/**
 * `#learn/c952`: the topic picker, the topic header (badge, the decrypting h1, the count, the mastery bar, then the
 * course's status: the Completed toggle and the exam date, decisions 56 and 58, named by a "C952 · Course status"
 * caption so it never reads as the topic's), the big ideas, the questions and the next step. The header isn't keyed by
 * topic, so the status row and its caption stay put across topic switches; a switch focuses the new topic's h1.
 */
export default function Learn({
  course,
  entry,
  navigate,
  store,
  update,
  startExam,
  runningExam,
  newQuestions,
}: C952LearnProps) {
  // The topic rides on the history entry (CONTRACTS, convention 4), so reload and Back keep it (decision 27).
  const [topic, setTopicState] = useState<TopicId>(() => initialLearnTopic(entry))
  // A topic switch swaps the page's content: it scrolls itself to the top (convention 10); the h1 takes focus below.
  const setTopic = (id: TopicId) => {
    setTopicState(id)
    patchEntry({ learnTopic: id })
    window.scrollTo(0, 0)
  }
  const t = TOPIC_BY_ID[topic]
  const questions = QUESTIONS.filter((q) => q.t === topic)
  const p = topicProgress(topic, store)
  const pct = p.total ? Math.round((100 * p.mastered) / p.total) : 0
  const idx = TOPICS.findIndex((x) => x.id === topic)
  const prev = TOPICS[idx - 1]
  const next = TOPICS[idx + 1]
  const quiz = () => startExam(C952_BANK, "topic", { topic })

  // Show all / Hide all send a one-tick pulse (true or false, then back to null) that every card reacts to once,
  // so either button keeps working after cards were opened or reset one by one. Tagging the pulse with its topic
  // means a topic switch starts with null right away, before the new cards mount.
  const [force, setForce] = useState<{ topic: TopicId; open: boolean | null }>({ topic, open: null })
  const forceOpen = force.topic === topic ? force.open : null
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const pulse = (open: boolean) => {
    window.clearTimeout(timer.current)
    setForce({ topic, open })
    timer.current = window.setTimeout(() => setForce({ topic, open: null }), 0)
  }

  // A topic switch (topic cards or Previous / Next) swaps the whole page: move focus to the new title so keyboard and
  // screen reader users start at the top, not at the bottom or on a Next button that no longer exists.
  // setTopic has already scrolled the page to the top, hence preventScroll. Skipped on mount: the router focuses the h1.
  // DecryptText keeps its own ref, so the h1 is found through the header.
  const headerRef = useRef<HTMLElement>(null)
  const titledTopic = useRef(topic)
  useEffect(() => {
    if (titledTopic.current === topic) return
    titledTopic.current = topic
    headerRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true })
  }, [topic])

  // The "C952 · Course status" caption: it names the course's status row on screen and as its group (labelledBy)
  const statusLabel = useId()

  // The two Alerts at the top (decisions 8 and 28). Spacing (CONTRACTS, open question 17): the first takes the top
  // margin of the page's first block (here the topic picker's), a second one mt-4, and the picker after them mt-8.
  const TOP = "mt-6 sm:mt-8"

  return (
    <>
      {newQuestions && <NewQuestionsNotice className={TOP} />}
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className={newQuestions ? "mt-4" : TOP} />
      <BlurFade>
        <TopicSwitcher
          topic={topic}
          setTopic={setTopic}
          store={store}
          className={newQuestions || runningExam ? "mt-8" : TOP}
        />
      </BlurFade>

      {/* ── Topic header: the page header, with a Badge eyebrow. Nothing frames it (it sits on the dimmed field) and
            it takes no BlurFade: the h1 decrypt is its one entrance, replayed per topic (keyed). The header itself
            isn't keyed, so the course's status row under the mastery bar, with its "C952 · Course status" caption,
            stays mounted across topic switches ── */}
      <header ref={headerRef} className="mt-12 sm:mt-16 short:mt-6">
        <div className="flex items-center gap-4">
          <t.icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <Badge variant="secondary">
            C952 · Topic {pad(idx + 1)} / {pad(TOPICS.length)}
          </Badge>
        </div>
        {/* Title decrypt (Surfaces): tabIndex -1 keeps the App's route-change focus landing on `#app h1` */}
        <DecryptText
          key={topic}
          as="h1"
          text={t.name}
          variant="display"
          trigger="mount"
          loop={false}
          retriggerOnHover={false}
          glyphs="0123456789ABCDEF"
          speed={45}
          stagger={Math.min(40, Math.round(1000 / t.name.length))}
          startDelay={150}
          jitter={80}
          tabIndex={-1}
          className={TITLE}
        />
        <p className={cn("mt-4 tabular-nums", LEAD)}>
          {p.total} questions · {p.mastered} mastered
        </p>
        <div className="mt-4 flex max-w-[520px] items-center gap-4">
          <Progress className="flex-1" value={pct} aria-label={`${t.name} mastered`} />
          <span className="w-10 text-right font-mono text-sm text-muted-foreground">{pct}%</span>
        </div>
        {/* the course's status in a topic's header: the caption (`label`, course first) names the row on screen and
            as its group, so "Completed" never reads as the topic's; withCode still names the toggle alone
            "Completed: C952" (a screen reader's list of buttons) */}
        <p id={statusLabel} className={cn(LABEL, "mt-6")}>C952 · Course status</p>
        <CourseStatus
          course={course}
          store={store}
          update={update}
          labelledBy={statusLabel}
          withCode
          className="mt-2"
        />
      </header>

      <BlurFade key={`ideas-${topic}`} delay={0.08} className="mt-8">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {/* role="note": these are static study notes, not alerts to announce (Alert sets role="alert") */}
          <Alert role="note">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>The big idea, like you're 5</AlertTitle>
            <AlertDescription>
              <Rich html={t.kid} />
            </AlertDescription>
          </Alert>
          <Alert role="note">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>The grown-up version · memorize these</AlertTitle>
            <AlertDescription>
              <div className="rich">
                <ul className="space-y-2">
                  {t.keys.map((k, i) => (
                    <li key={i}>
                      <Rich as="span" html={k} />
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </BlurFade>

      {/* ── Questions toolbar window ──────────────────────────────── */}
      <Card className="mt-20">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            <ListChecks aria-hidden="true" />
            Practice
          </Badge>
          <h2 className={HEADING}>Questions</h2>
          <CardDescription>Tap an answer to lock in your guess, then read the breakdown.</CardDescription>
        </CardHeader>
        <CardFooter className="flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => pulse(true)}>
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            Show all answers
          </Button>
          <Button size="sm" variant="outline" onClick={() => pulse(false)}>
            <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
            Hide all
          </Button>
          <Button size="sm" variant="secondary" onClick={quiz} data-focus-key="learn:quiz">
            <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Quiz me on this topic
          </Button>
        </CardFooter>
      </Card>

      {/* keyed by topic so every card's guess / open state starts fresh on a switch */}
      <div key={topic} className="mt-6 space-y-4">
        {questions.map((q) => (
          <BlurFade key={q.n} inView>
            <QuestionCard q={q} store={store} update={update} forceOpen={forceOpen} />
          </BlurFade>
        ))}
      </div>

      {/* ── End of the topic: the next step, then previous / next topic ── */}
      <BlurFade inView>
        <Separator className="mt-12 sm:mt-16" />
        <div className="pt-10 sm:pt-12">
          {questions.length >= LIST_END_MIN && (
            <div className="mb-10 flex flex-col items-center gap-4 text-center sm:mb-12">
              <p className="font-sans text-sm text-muted-foreground">Done with this topic? Quiz yourself while it's fresh.</p>
              <Button variant="secondary" onClick={quiz} data-focus-key="learn:quiz-end">
                <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Quiz me on this topic
              </Button>
            </div>
          )}

          <nav aria-label="Previous and next topic" className="grid gap-4 sm:grid-cols-2">
            {prev && <StepCard dir="prev" name={prev.name} onClick={() => setTopic(prev.id)} />}
            {next && <StepCard dir="next" name={next.name} onClick={() => setTopic(next.id)} className="sm:col-start-2" />}
          </nav>
        </div>
      </BlurFade>
    </>
  )
}
