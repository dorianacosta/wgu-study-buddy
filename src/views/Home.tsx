/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { ArrowRight, BookOpen, CalendarDays, FileText, GraduationCap, Lightbulb } from "lucide-react"
import { PLAN, QUESTIONS, TOPICS } from "@/data"
import {
  C952,
  COURSE_LIST,
  courseInfo,
  degreeProgress,
  examStatus,
  isCompleted,
  learnTabsOf,
  nextCourse,
  planDays,
} from "@/lib/course"
import { hrefFor, onPlainClick, type EntryPatch } from "@/lib/routes"
import { c952MissCount, courseDraft, masteredCount, planCounts, practiceCounts, topicProgress } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { HomeViewProps } from "@/views/types"
import { OUTLINE, plain } from "@/views/course/shared"
import { CourseStatus, examLine } from "@/views/course/CourseStatus"
import { Rich } from "@/components/kit"
import { useFieldCut } from "@/components/field-scrim"
import { ExamInProgressNotice, NewQuestionsNotice } from "@/components/notices"
import { CornerFrame } from "@/components/ui/corner-frame"
import { DecryptText } from "@/components/ui/decrypt-text"
import { ScrambleLinkButton } from "@/components/ui/scramble-link-button"
import { Separator } from "@/components/ui/separator"
import StatsSection, { type Stat } from "@/components/ui/stats"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { DotMatrixText } from "@/components/ui/dot-text"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"

const TOTAL = QUESTIONS.length

/** The Home h1 and tab title (README, Logo and imagery: the name is set in type). */
const TITLE = "WGU Study Buddy"

/** The label type style (12/16, 500, 0.08em, uppercase by CSS): the kicker, the Next up label, section eyebrows. */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"

/** A stat tile's value (`stat`), as StatsSection sets it: clamped below 400px so it fits a 136px tile at 320. */
const STAT =
  "mt-2 font-mono text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-foreground whitespace-nowrap max-[400px]:text-[clamp(32px,10vw,40px)]"

/** The `short:` variant's query (index.css): landscape and under 560px tall. */
const SHORT = "(max-height: 560px) and (orientation: landscape)"

/** Bento placement of the 8 C952 topic cards from md up (3 columns: 3 + 2 + 3); phones stack them at full width. */
const TOPIC_SPANS = [
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-1",
]

/** A guide's topic cards fill every row (two columns from 640, three from 1024): literal classes, so Tailwind sees them. */
function guideSpan(i: number, n: number): string {
  if (i < n - 1) return "sm:col-span-1"
  return `${n % 2 ? "sm:col-span-2" : "sm:col-span-1"} ${["lg:col-span-1", "lg:col-span-3", "lg:col-span-2"][n % 3]}`
}

const THREE_DAYS: [string, string][] = [
  ["Day 1", "Cheat Sheet, Performance Math, Pipelining, Numbers & Binary (all the math)."],
  ["Day 2", "ARM Assembly, Cache & VM, VMs/Cloud/RAID."],
  ["Day 3", "Parallelism, Hardware & History, then the Full exam and the Remix exam."],
]

const C952_DESC =
  "For every question you'll learn why the right answer is right, why every wrong one is wrong, and how the question could be twisted so a wrong answer becomes right."

/** A control that leaves Home: its route, the state the new entry opens with, its label, accessible name and focus key. */
interface Go {
  label: string
  href: string
  state?: EntryPatch
  name: string
  key: string
}

/** Section heading (Surfaces, Section heading): a type-only eyebrow (`label`, no Badge, no icon), the h2 in `heading`
 *  and an optional aside in `caption`, right of the h2 from sm and wrapped under it when the row runs out. */
function SectionHeading({ eyebrow, aside, children }: { eyebrow: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <BlurFade inView className="mt-20 mb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col items-start gap-2">
          <p className={LABEL}>{eyebrow}</p>
          <h2 className="font-mono text-2xl font-semibold tracking-[-0.01em]">{children}</h2>
        </div>
        {aside && <p className="font-mono text-xs text-muted-foreground">{aside}</p>}
      </div>
    </BlurFade>
  )
}

/**
 * Home: the active course's dashboard (decision 53; Home.md). Never keyed by the course: a switcher pick re-renders it
 * in place (no h1 decrypt, the scroll kept), and each section sits in its own slot below, so a section new to the
 * page (C952's after a guide's, or the reverse) mounts and fades in once while the hero and the teaser stay.
 *
 * The course's status (decisions 56 and 58) is read from the store on every render and never held here, so nothing
 * carries over to the next course after a switcher pick. The status card (CourseStatus: the Completed toggle and the
 * exam date) sits after the progress sections, before the teaser; its description asks to mark the course completed
 * only until it is. While a date is set and the course isn't completed, Next up adds the countdown as a caption. Once
 * the course is completed, the gold button starts the next course in degree order (nextCourse) and Next up names it,
 * or says every course is completed. Once any course is completed, the teaser adds the degree's progress.
 */
export default function Home({ course, navigate, store, update, runningExam, newQuestions }: HomeViewProps) {
  const reduceMotion = useReducedMotion()
  const info = courseInfo(course)!
  const { code, kind } = info

  // The hero box (Home.md, Hero): the curtain's cut, and never shorter than its window plus 32px above and below
  // (8px on short screens).
  const heroRef = useRef<HTMLDivElement>(null) // the hero box: the curtain's cut
  const windowRef = useRef<HTMLDivElement>(null) // the window, measured for fit
  const [fit, setFit] = useState(0) // the window's height + 64 (32 above, 32 below); + 16 when short
  useFieldCut(heroRef)
  useLayoutEffect(() => {
    const el = windowRef.current
    if (!el) return
    const short = window.matchMedia(SHORT)
    const measure = () => setFit(Math.ceil(el.getBoundingClientRect().height) + (short.matches ? 16 : 64))
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    short.addEventListener("change", measure)
    return () => {
      ro.disconnect()
      short.removeEventListener("change", measure)
    }
  }, [])

  // A canvas can't read var(--border): the unlit dots take its computed value (DotText README).
  const [unlit] = useState(
    () => getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || undefined,
  )

  /** A link's onClick: a plain click pushes the route through the router; a modified click keeps the browser's. */
  const open = (to: { href: string; state?: EntryPatch }) => onPlainClick(() => navigate(to.href, to.state))

  // ── C952 (as today) ──
  const mastered = masteredCount(store)
  const masteredPct = Math.round((100 * mastered) / TOTAL)
  const last = store.history[store.history.length - 1]
  const lastPct = last ? Math.round((100 * last.score) / last.total) : null
  const toReview = c952MissCount(store)
  const started = mastered > 0 || store.history.length > 0 || toReview > 0
  const nextTopic = TOPICS.find((t) => {
    const p = topicProgress(t.id, store)
    return p.mastered < p.total
  })
  const nextLeft = nextTopic ? topicProgress(nextTopic.id, store) : null
  const planDone = PLAN.filter((_, i) => store.plan[i]).length
  const stats: Stat[] = [
    { value: store.best === null ? "—" : `${store.best}%`, label: "Best exam" },
    { value: lastPct === null ? "—" : `${lastPct}%`, label: "Last exam" },
    { value: String(toReview), label: "To review" },
    { value: `${planDone}/${PLAN.length}`, label: "Plan" },
  ]

  // ── A guide course (decisions 30, 31 and 53): counts from the contract helpers, topics and format from the guide outline (OUTLINE) ──
  const practice = practiceCounts(info, store)
  const plan = planCounts(info, store)
  const days = planDays(course)
  const guide = kind === "guide" ? OUTLINE[course] : null
  const topics = guide?.topics ?? []
  const format = plain(guide?.assessment?.format ?? "")
  const N = info.practiceTotal
  const learn = hrefFor("learn", course)
  const readouts = [
    { label: "Practice", value: N ? `${practice.got}/${N}` : "—", note: "got it" },
    { label: "To review", value: N ? String(practice.missed) : "—", note: "missed questions" },
    { label: "Study plan", value: info.planTotal ? `${plan.done}/${info.planTotal}` : "—", note: "days done" },
    { label: "Topics", value: info.topicTotal ? String(info.topicTotal) : "—", note: "in Learn" },
  ]

  // ── The course's status (decisions 56 and 58): read from the store, never held here ──
  const completed = isCompleted(course, store)
  const degree = degreeProgress(store)
  const examDay = examStatus(course, store)
  // the hero's countdown caption: the date line, while a date is set and the course isn't completed
  const countdown = examDay && !completed ? examLine(examDay) : null
  const statusTitle = useId() // the status card's CardTitle, which names CourseStatus's group

  // ── The hero's gold button, Next up and links follow the course (Home.md, Next up per course) ──
  const coursesLink: Go = { label: "Open courses", href: hrefFor("courses"), name: "Open courses", key: "home:courses" }
  let step: Go
  // the code Next up names: the active course's; the next course's once it's completed; none when every one is
  let upNext: string | null = code
  let line: string
  let desc: string
  let links: Go[]
  if (completed) {
    // decision 56: a completed course hands the gold button to the next course in degree order that isn't completed
    const next = nextCourse(course, store)
    // a course still being researched has no guide to review
    const review: Go[] =
      kind === "pending" ? [] : [{ label: `Review ${code}`, href: learn, name: `Review ${code}`, key: "home:review" }]
    desc = `${code} completed · ${degree.done} of ${degree.total} courses · ${degree.cuDone} CU`
    if (next) {
      // a guide opens Learn on its first tab (Overview when it has one); the courseTab must name the next course, or
      // the router drops it. C952 (topics, not tabs) and a course still being researched (its pending Learn) take none
      const tab = learnTabsOf(next.slug)[0]
      step = {
        label: "Start next course",
        href: hrefFor("learn", next.slug),
        state: tab ? { courseTab: { slug: next.slug, tab } } : undefined,
        name: `Start next course, ${next.code}`,
        key: "home:step",
      }
      upNext = next.code
      line = next.name
      links = [...review, coursesLink]
    } else {
      // every course completed: the gold button opens the list, so "Open courses" isn't repeated as a link
      step = { ...coursesLink, key: "home:step" }
      upNext = null
      line = "Every course completed."
      links = review
    }
  } else if (kind === "c952") {
    // the choice link 1 made until now
    const label = !nextTopic ? "Take the full exam" : started ? "Continue learning" : "Start learning"
    step = {
      label,
      href: nextTopic ? hrefFor("learn", C952) : hrefFor("exam", C952),
      // "Take the full exam" names an exam, so it opens the mode picker, never Flashcards (decision 57)
      state: nextTopic ? (started ? { learnTopic: nextTopic.id } : undefined) : { practiceMode: "questions" },
      name: `${label}, ${code}`,
      key: "home:step",
    }
    line = nextTopic && nextLeft ? `${nextTopic.name} · ${nextLeft.total - nextLeft.mastered} to go` : "Every question mastered. Take the full exam."
    desc = C952_DESC
    const exam = hrefFor("exam", C952)
    // "Practice exam" names the exam too: the mode picker
    const examLink: Go = {
      label: "Practice exam",
      href: exam,
      state: { practiceMode: "questions" },
      name: "Practice exam, C952",
      key: "home:practice",
    }
    links = [examLink, coursesLink]
  } else if (kind === "guide") {
    const label = plan.done === 0 && practice.got + practice.missed === 0 ? "Start learning" : "Continue learning"
    const tab = info.planTotal > 0 ? "plan" : "overview"
    step = { label, href: learn, state: { courseTab: { slug: course, tab } }, name: `${label}, ${code}`, key: "home:step" }
    const day = plan.next === null ? null : days[plan.next]
    if (info.planTotal === 0) {
      line = "Read the guide, then test yourself in Practice."
      desc = `Check yourself with ${N} practice questions.`
    } else {
      line = day
        ? day.focus
          ? `${day.day} · ${day.focus}`
          : day.day
        : N > 0
          ? "Study plan done. Test yourself in Practice."
          : "Study plan done. Review the Cheat Sheet."
      desc = N > 0 ? `Follow the study plan, then check yourself with ${N} practice questions.` : "Follow the study plan in Learn."
    }
    const exam = hrefFor("exam", course)
    links = N > 0 ? [{ label: "Practice", href: exam, name: `Practice, ${code}`, key: "home:practice" }, coursesLink] : [coursesLink]
  } else {
    step = { ...coursesLink, key: "home:step" }
    line = "Study guide in progress"
    desc = "This course's guide is being researched. Check back soon."
    links = []
  }

  return (
    <>
      {/* ── Hero: one window over the full-strength field ──────────── */}
      {/* the box is transparent (the field shows all around the window) and registers itself as the curtain's cut;
          every word of the hero sits inside the window */}
      <div
        ref={heroRef}
        className="relative flex w-full items-center justify-center"
        style={{ height: `max(clamp(min(640px, 100svh), 88svh, 760px), ${fit}px)` }}
      >
        {/* two brackets: a frame you read, gold only while keyboard focus is inside (not focus-within: the app
            focuses the h1 after every route change) */}
        <CornerFrame
          ref={windowRef}
          corners={["top-left", "bottom-right"]}
          size="16px"
          thickness="2px"
          inset="8px"
          className="w-full max-w-[640px] rounded-lg border bg-card p-6 sm:p-8 short:p-6 max-sm:short:py-4 has-[:focus-visible]:[--corner-frame-color:var(--primary)]"
        >
          {/* below 640 on short screens (568 × 320, and 568 × 276 in Safari) the docked bar takes the bottom 57px: the
              window's top padding and the gaps above the gold button tighten by 32px, and the subtitle drops to 14/20px,
              so the button ends above the bar */}
          <p className={LABEL}>Unofficial · for WGU Computer Science</p>
          <DecryptText
            as="h1"
            text={TITLE}
            variant="display"
            trigger="mount"
            loop={false}
            retriggerOnHover={false}
            glyphs="0123456789ABCDEF"
            speed={45}
            stagger={40}
            startDelay={150}
            jitter={80}
            tabIndex={-1}
            className="mt-4 max-sm:short:mt-2 font-mono text-[clamp(32px,min(7.5vw,12svh),64px)] short:text-[clamp(32px,min(7.5vw,10svh),64px)] font-semibold leading-none tracking-[-0.03em] text-foreground"
          />
          <p className="mt-4 max-sm:short:mt-2 max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg short:text-base max-sm:short:text-sm max-sm:short:leading-5">
            Study guides for {COURSE_LIST.length} WGU Computer Science courses, plus {QUESTIONS.length} C952 practice
            questions, explained like you're 5, then like an engineer.
          </p>
          {/* the one gold fill on the first screen: the active course's next step; no arrow (its -45° hover turn reads
              as an external link) */}
          <ScrambleLinkButton
            href={step.href}
            btnText={step.label}
            aria-label={step.name}
            data-focus-key={step.key}
            onClick={open(step)}
            hoverColor="var(--primary-foreground)"
            className="mt-8 short:mt-6 max-sm:short:mt-4 h-12 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
          />
          <Separator className="my-8" />
          <p className={LABEL}>{upNext ? `Next up · ${upNext}` : "Next up"}</p>
          <p className="mt-2 text-base font-semibold text-foreground">{line}</p>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{desc}</p>
          {/* the exam countdown (decision 58), a muted caption with no gold, while a date is set and the course isn't
              completed: below the gold button, so the button still ends on the first screen in landscape */}
          {countdown && <p className="mt-2 font-mono text-xs text-muted-foreground">{countdown}</p>}
          {/* text links in the ui style: foreground at rest, primary and underlined under the pointer */}
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6">
              {links.map((l) => (
                <ScrambleLinkButton
                  key={l.key}
                  href={l.href}
                  btnText={l.label}
                  aria-label={l.name}
                  data-focus-key={l.key}
                  onClick={open(l)}
                  showLine
                  hoverColor="var(--primary)"
                  className="h-10 text-sm text-foreground pointer-coarse:min-h-11"
                />
              ))}
            </div>
          )}
          <p className="mt-6 font-mono text-xs text-muted-foreground">Not affiliated with Western Governors University.</p>
        </CornerFrame>
      </div>

      {/* ── Alerts, when they apply ──────────────────────────── */}
      {newQuestions && course === C952 && <NewQuestionsNotice className="mt-6" />}
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className="mt-6" />

      {/* Every section below keeps its own slot, so a switch mounts only the sections new to the page */}

      {/* ── C952: mastery dial ───────────────────────────────── */}
      {kind === "c952" && (
        <BlurFade delay={0.1} className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="font-mono text-2xl font-semibold tracking-[-0.01em]">C952 questions mastered</h2>
              <CardDescription>
                {masteredPct}% of the {TOTAL} C952 practice questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="progressbar"
                aria-label="C952 questions mastered"
                aria-valuemin={0}
                aria-valuemax={TOTAL}
                aria-valuenow={mastered}
                aria-valuetext={`${mastered} of ${TOTAL} mastered (${masteredPct}%)`}
                className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12"
              >
                <AnimatedCircularProgressBar
                  max={100}
                  min={0}
                  value={masteredPct}
                  gaugePrimaryColor="var(--primary)"
                  gaugeSecondaryColor="var(--secondary)"
                />
                <div className="flex flex-col items-center">
                  <DotMatrixText
                    aria-hidden="true"
                    text={String(mastered)}
                    transition={reduceMotion ? "none" : "fade"}
                    dotSize={4}
                    gap={2.5}
                    inactiveColor={unlit}
                    showInactive
                    className="h-[120px] w-[200px] text-foreground"
                  />
                  <p className="mt-2 font-mono text-xs text-muted-foreground">of {TOTAL} mastered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      )}

      {/* ── C952: stats ──────────────────────────────────────── */}
      {kind === "c952" && (
        <BlurFade delay={0.15} className="mt-6">
          <StatsSection stats={stats} label="Your C952 progress" />
        </BlurFade>
      )}

      {/* ── A guide: progress readouts ───────────────────────── */}
      {kind === "guide" && (
        <BlurFade delay={0.1} className="mt-6">
          {/* the outline's h2 here, as C952's "C952 questions mastered" is, so the teaser's h3 follows an h2 */}
          <h2 id="home-progress" className="sr-only">
            Your {code} progress
          </h2>
          <div role="list" aria-labelledby="home-progress" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {readouts.map((r) => (
              <CornerFrame key={r.label} asChild corners={["top-left", "bottom-right"]} size="16px" thickness="2px" inset="8px">
                <Card role="listitem" className="p-6 max-[400px]:p-4">
                  <p className={LABEL}>{r.label}</p>
                  <p className={STAT}>{r.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.note}</p>
                </Card>
              </CornerFrame>
            ))}
          </div>
        </BlurFade>
      )}

      {/* ── The course's status (every course; decisions 56 and 58) ── */}
      {/* a plain window, not a target: its controls are the targets. Its BlurFade stays mounted across a switcher
          pick and a mark, so it fades in once and never on a change; only the description's words follow the mark */}
      <BlurFade inView className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle id={statusTitle}>{code} exam</CardTitle>
            <CardDescription>
              {completed
                ? `${code} is marked completed.`
                : `Plan your exam date, and mark ${code} completed once you pass.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseStatus course={course} store={store} update={update} labelledBy={statusTitle} />
          </CardContent>
        </Card>
      </BlurFade>

      {/* ── Courses teaser (every course) ────────────────────── */}
      <BlurFade inView className="mt-6">
        {/* a target window: four brackets on the link itself, gold when hovered or focused */}
        <CornerFrame
          asChild
          size="16px"
          thickness="2px"
          inset="8px"
          className="hover:[--corner-frame-color:var(--primary)] focus-visible:[--corner-frame-color:var(--primary)]"
        >
          <a
            href={coursesLink.href}
            data-focus-key="home:teaser"
            onClick={open(coursesLink)}
            className="block rounded-lg"
          >
            <Card>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <GraduationCap className="size-6 flex-none text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-2">
                  <CardTitle>Your courses</CardTitle>
                  {/* the degree's progress joins once any course is completed (decision 56) */}
                  <CardDescription>
                    Study guides and practice for {COURSE_LIST.length} WGU Computer Science courses
                    {degree.done > 0 && ` · ${degree.done} of ${degree.total} courses completed`}
                  </CardDescription>
                </div>
                <ArrowRight className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
              </CardHeader>
            </Card>
          </a>
        </CornerFrame>
      </BlurFade>

      {/* ── C952: topics ─────────────────────────────────────── */}
      {kind === "c952" && (
        <>
          <SectionHeading eyebrow="C952 curriculum" aside="Tap a topic to study it">
            C952 topics
          </SectionHeading>
          <BlurFade inView>
            <BentoGrid className="auto-rows-[16rem] md:auto-rows-[18rem]">
              {TOPICS.map((t, i) => {
                const p = topicProgress(t.id, store)
                const pct = Math.round((100 * p.mastered) / p.total)
                return (
                  <BentoCard
                    key={t.id}
                    name={t.name}
                    className={TOPIC_SPANS[i] ?? "md:col-span-1"}
                    Icon={t.icon}
                    description={`${p.total} questions · ${p.mastered} mastered`}
                    href={hrefFor("learn", C952)}
                    cta="Learn"
                    onClick={open({ href: hrefFor("learn", C952), state: { learnTopic: t.id } })}
                    focusKey={`home:topic-${t.id}`}
                    background={
                      <div className="flex items-center gap-4 p-6">
                        <Progress value={pct} aria-valuenow={pct} aria-label={`${t.name} mastered`} className="flex-1" />
                        <span className="w-10 text-right text-sm text-muted-foreground tabular-nums">{pct}%</span>
                      </div>
                    }
                  />
                )
              })}
            </BentoGrid>
          </BlurFade>
        </>
      )}

      {/* ── C952: plan ───────────────────────────────────────── */}
      {kind === "c952" && (
        <>
          <SectionHeading eyebrow="C952 flight plan" aside={`${planDone}/${PLAN.length} done`}>
            One-day plan · ~6.5 hours
          </SectionHeading>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <BlurFade inView>
              <Card>
                <CardContent className="pt-6">
                  <ul className="grid gap-4">
                    {PLAN.map(([dur, html], i) => (
                      <li key={i} className="flex items-start space-x-2">
                        {/* mt-1 centres the 16px box on the step's first 24px line */}
                        <Checkbox
                          id={`plan-step-${i}`}
                          className="mt-1"
                          checked={!!store.plan[i]}
                          onCheckedChange={(c) =>
                            update((d) => {
                              d.plan[i] = c === true
                            })
                          }
                        />
                        {/* the Label holds the step and its time under it, so the row is a 44px target on touch, as
                            the guide plan's rows are; the step is reading text: .rich (sans) at body 16/24, 400 */}
                        <Label htmlFor={`plan-step-${i}`} className="grid gap-2 text-base font-normal leading-6">
                          <span className={cn(store.plan[i] && "text-muted-foreground line-through")}>
                            <Rich as="span" html={html} />
                          </span>
                          <span className="font-mono text-sm text-muted-foreground">{dur}</span>
                        </Label>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <p className="font-sans text-sm text-muted-foreground">
                    <b className="text-foreground">Ready for the OA when:</b> you score 85%+ on the full exam and 80%+ on
                    the Remix exam. WGU doesn't publish the exact cutoff, so give yourself a cushion.
                  </p>
                </CardFooter>
              </Card>
            </BlurFade>

            <div className="grid content-start gap-4">
              <BlurFade inView delay={0.05}>
                <Card>
                  <CardHeader>
                    <Badge variant="outline" className="self-start">
                      <CalendarDays aria-hidden="true" />
                      Extended mission
                    </Badge>
                    <CardTitle>Need 3 days instead?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="grid gap-4 text-sm">
                      {THREE_DAYS.map(([d, t]) => (
                        <li key={d} className="grid grid-cols-[3.5rem_1fr] gap-2">
                          <span className="font-mono text-foreground">{d}</span>
                          <span className="font-sans text-muted-foreground">{t}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </BlurFade>
              <BlurFade inView delay={0.1}>
                {/* role="note": the Alert's default role="alert" would announce this static tip on load */}
                <Alert role="note">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>How to use this, like you're 5</AlertTitle>
                  <AlertDescription>
                    Before you peek at an answer, <b>guess first</b>. Guessing wrong and then seeing why is how your brain
                    remembers. Reading answers you already know feels good but doesn't stick. Then read the{" "}
                    <b>Flip it</b> box: that's the test's favorite trick, asking the same thing a different way.
                  </AlertDescription>
                </Alert>
              </BlurFade>
            </div>
          </div>
        </>
      )}

      {/* ── A guide: topics, each to Learn on the Topics tab ─── */}
      {topics.length > 0 && (
        <>
          <SectionHeading eyebrow={`${code} curriculum`} aside="Tap a topic to open Learn">
            {code} topics
          </SectionHeading>
          <BlurFade inView>
            <BentoGrid className="auto-rows-[18rem] sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t, i) => {
                const nn = String(i + 1).padStart(2, "0")
                const k = t.points.length
                return (
                  <BentoCard
                    key={i}
                    name={plain(t.title) || `Topic ${i + 1}`}
                    className={guideSpan(i, topics.length)}
                    Icon={BookOpen}
                    description={k ? `Topic ${nn} · ${k} key ${k === 1 ? "point" : "points"}` : `Topic ${nn}`}
                    href={learn}
                    cta="Learn"
                    onClick={open({ href: learn, state: { courseTab: { slug: course, tab: "topics" } } })}
                    focusKey={`home:topic-${i}`}
                    background={null}
                  />
                )
              })}
            </BentoGrid>
          </BlurFade>
        </>
      )}

      {/* ── A guide: study plan beside the study-guide card ──── */}
      {kind === "guide" && info.planTotal > 0 && (
        <>
          <SectionHeading eyebrow={`${code} study plan`} aside={`${plan.done}/${info.planTotal} done`}>
            Day by day
          </SectionHeading>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <BlurFade inView>
              <Card>
                <CardContent className="pt-6">
                  <ul className="grid gap-4">
                    {days.map((d, i) => {
                      const id = `plan-${course}-${i}`
                      const done = store.courses?.[course]?.plan?.[i] === true
                      return (
                        <li key={i} className="flex items-start space-x-2">
                          {/* mt-1 centres the 16px box on the focus's first 24px line */}
                          <Checkbox
                            id={id}
                            className="mt-1"
                            checked={done}
                            onCheckedChange={(c) =>
                              update((draft) => {
                                courseDraft(draft, course).plan[i] = c === true
                              })
                            }
                          />
                          {/* the Label holds the focus and the day under it, so the row is a 44px target on touch */}
                          <Label htmlFor={id} className="grid gap-2 text-base font-normal leading-6">
                            <span className={cn("font-sans", done && "text-muted-foreground line-through")}>
                              {d.focus || d.day}
                            </span>
                            {d.focus && <span className="font-mono text-sm text-muted-foreground">{d.day}</span>}
                          </Label>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            </BlurFade>

            <div className="grid content-start gap-4">
              <BlurFade inView delay={0.05}>
                <CornerFrame
                  asChild
                  size="16px"
                  thickness="2px"
                  inset="8px"
                  className="hover:[--corner-frame-color:var(--primary)] focus-visible:[--corner-frame-color:var(--primary)]"
                >
                  <a
                    href={learn}
                    data-focus-key="home:guide"
                    onClick={open({ href: learn, state: { courseTab: { slug: course, tab: "overview" } } })}
                    className="block rounded-lg"
                  >
                    <Card>
                      <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <FileText className="size-6 flex-none text-muted-foreground" aria-hidden="true" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <CardTitle>{code} study guide</CardTitle>
                          {format && <CardDescription>{format}</CardDescription>}
                        </div>
                        <ArrowRight className="size-5 flex-none text-muted-foreground" aria-hidden="true" />
                      </CardHeader>
                    </Card>
                  </a>
                </CornerFrame>
              </BlurFade>
            </div>
          </div>
        </>
      )}
    </>
  )
}
