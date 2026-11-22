/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Courses (`#courses`): the 29 WGU B.S. Computer Science courses of the degree plan, grouped by subject, each with a
 * researched study guide, and the place the student files the courses they have finished (decisions 32, 55 and 56;
 * Surfaces, `#courses`).
 *
 * The standard page header (kicker, the decrypting h1, lead) with the Course index window (BoughIndex) beside it from
 * lg, its subject groups as folders with the active course's group open, and under the lead below, all folded; the
 * "Course not found" and "C952 exam in progress" Alerts when they apply; four stat tiles (readouts) and, under them,
 * the Degree progress window (courses and CU completed, over a Progress); then the list: Tabs "Which courses" (All,
 * Remaining, Completed, each with its live count) and one section per subject group that has cards in the chosen
 * list, each a list of CourseCards in study order (the course switcher's order, COURSE_GROUP_LIST); then the Backup
 * section (ProgressBackup) and the disclaimer.
 *
 * Every CourseCard (C952's too) is a target window (CornerFrame on its link) to the course's Learn, `#learn/<slug>`,
 * and so is every Index leaf: the course becomes active. The active course's card is current ("Studying now", gold
 * brackets) and its Index row is selected. Every card also carries the Completed toggle (CompletedToggle), drawn over
 * its footer from outside the link; a completed card shows a "Completed" badge, and one sr-only status line says each
 * change. The chosen list rides on the history entry (`coursesFilter`), so Back and reload reopen it. A list is a
 * snapshot taken when it is chosen (or the entry is first shown; Back and Forward show it again): a card you mark
 * keeps its place, and its toggle its focus, until another list is chosen, and a course marked on another page since
 * keeps its card, so Back focuses the card that left the page; the counts stay live. A chosen list shows at once (a
 * filter applied is a change of state, so no BlurFade). The view has no gold fill (the toggles are outline Buttons):
 * gold marks only focus, the current tab, Progress fills and the brackets of the hovered, focused or active card.
 *
 * The look comes only from the collected 21st.dev components, composed as the design system's Surfaces lays out
 * `#courses` (design-system/wgu-study-buddy/project/Surfaces.md), plus layout. The guide's own pages live in
 * src/views/course/; course/shared.tsx holds the parts this list borrows (CourseBadges, Heading, PageTitle).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import {
  ArrowUpRight,
  Check,
  CircleCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Sigma,
  type LucideIcon,
} from "lucide-react"
import { COURSE_BY_SLUG, type Course } from "@/data/courses"
import { QUESTIONS } from "@/data"
import {
  COURSE_GROUP_LIST,
  completedText,
  courseInfo,
  degreeProgress,
  isCompleted,
  isCourseSlug,
  isCoursesFilter,
  markCompleted,
  type CoursesFilter,
} from "@/lib/course"
import {
  getRoute,
  hrefFor,
  initialCoursesFilter,
  isPlainClick,
  onPlainClick,
  patchEntry,
  type ClickLike,
  type EntryState,
  type Navigate,
} from "@/lib/routes"
import { masteredCount, practiceCounts, type Store } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { CoursesViewProps } from "@/views/types"
import { CourseBadges, Heading, LABEL, LEAD, PageTitle, assessmentOf, percent } from "@/views/course/shared"
import { ProgressBackup } from "@/views/ProgressBackup"
import { CompletedToggle } from "@/components/completed-toggle"
import { CourseNotFoundNotice, ExamInProgressNotice } from "@/components/notices"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CornerFrame } from "@/components/ui/corner-frame"
import { EmptyState } from "@/components/ui/empty-state"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BoughIndex, type BoughNode } from "@/components/ui/tree-box-drawing"

/** `stat`: stat-tile values (Surfaces, Style shorthand); below 400px the value clamps (Stat tile) */
const STAT =
  "font-mono text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-foreground max-[400px]:text-[clamp(32px,10vw,40px)]"

/** The degree plan by subject (src/data/courses.ts): each group with its courses in study order, the switcher's order. */
const GROUPS = COURSE_GROUP_LIST.map((g) => ({ id: g.id, label: g.label, courses: g.courses.map((c) => COURSE_BY_SLUG[c.slug]) }))
/** Every course, in the same order. */
const LIST: Course[] = GROUPS.flatMap((g) => g.courses)

/* ── Course cards ────────────────────────────────────────────────────────── */

/** A footer line over its Progress. The words carry the numbers, so the bar stays out of the accessibility tree. */
function Meter({ label, value, children }: { label: string; value: number; children: ReactNode }) {
  return (
    <>
      <span className="flex items-start justify-between gap-4 text-sm text-muted-foreground">
        <span>{label}</span>
        <span className="text-right">{children}</span>
      </span>
      <Progress value={value} aria-hidden="true" />
    </>
  )
}

/** The card's footer (CourseTools, Counts): C952's mastery, a guide's practice, or a guide still being researched. */
function CardMeter({ course, store }: { course: Course; store: Store }) {
  const info = courseInfo(course.slug)
  if (!info || info.kind === "pending") {
    return (
      <span>
        <Badge variant="outline">Guide in progress</Badge>
      </span>
    )
  }
  if (info.kind === "c952") {
    const mastered = masteredCount(store)
    return (
      <Meter label="Questions mastered" value={percent(mastered, QUESTIONS.length)}>
        {mastered} of {QUESTIONS.length}
      </Meter>
    )
  }
  if (info.practiceTotal === 0) return <span className="text-sm text-muted-foreground">Study guide ready</span>
  const { got, missed, total } = practiceCounts(info, store)
  // each phrase stays whole and the dot stays with the first, so the line breaks only after the dot
  return (
    <Meter label="Practice" value={percent(got, total)}>
      <span className="whitespace-nowrap">
        {got} of {total} got it
      </span>
      {missed > 0 && (
        <>
          {" · "}
          <span className="whitespace-nowrap">{missed} to review</span>
        </>
      )}
    </Meter>
  )
}

/**
 * A course card: a target window. The whole card is the link to the course's Learn, and the Target frame's brackets
 * sit on that link, so they turn gold on its hover and keyboard focus, and stay gold on the active course's card. A
 * completed course adds a success "Completed" badge (a Check and the word), which also becomes part of the link's name.
 *
 * The Completed toggle is the link's sibling, never inside it (a link holds no control): the card's footer keeps an
 * empty slot as tall as the toggle, and the toggle is drawn over it from the wrapper. So it follows the link in tab
 * order, a press on it never follows the link, and hovering or focusing it never lights the link's brackets.
 */
function CourseCard({
  course,
  active,
  done,
  store,
  navigate,
  onCompletedChange,
}: {
  course: Course
  active: boolean
  done: boolean
  store: Store
  navigate: Navigate
  onCompletedChange: (next: boolean) => void
}) {
  const href = hrefFor("learn", course.slug)
  return (
    <div className="relative h-full">
      <CornerFrame
        asChild
        size="16px"
        thickness="2px"
        inset="8px"
        className="hover:[--corner-frame-color:var(--primary)] focus-visible:[--corner-frame-color:var(--primary)] aria-[current=true]:[--corner-frame-color:var(--primary)]"
      >
        <a
          href={href}
          aria-current={active ? "true" : undefined}
          data-focus-key={`card:${course.slug}`}
          onClick={onPlainClick(() => navigate(href))}
          className="block h-full rounded-lg"
        >
          <Card className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <span className={LABEL}>{course.code}</span>
                <ArrowUpRight className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
              </div>
              <CardTitle className="text-base text-balance">{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {active && <Badge variant="secondary">Studying now</Badge>}
              {done && (
                <Badge variant="success" appearance="light">
                  <Check aria-hidden="true" />
                  Completed
                </Badge>
              )}
              <CourseBadges course={course} />
            </CardContent>
            <CardFooter className="mt-auto flex-col items-stretch gap-2">
              <CardMeter course={course} store={store} />
              {/* the Completed toggle's slot: a sm Button's height, 44px on touch */}
              <span aria-hidden="true" className="h-8 pointer-coarse:h-11" />
            </CardFooter>
          </Card>
        </a>
      </CornerFrame>
      {/* over the slot: the Card's 1px border plus its p-6 (in rem, so it holds under a larger default font size),
          clear of the bottom-left bracket (8px in, 16px arms) */}
      <CompletedToggle
        code={course.code}
        pressed={done}
        onPressedChange={onCompletedChange}
        withCode
        className="absolute bottom-[calc(1.5rem+1px)] left-[calc(1.5rem+1px)]"
      />
    </div>
  )
}

/**
 * A card's entrance into the list. When the page's first list appears, each card fades in with BlurFade (inView,
 * staggered); a list the student chooses shows at once, since a filter applied is a change of state, which never
 * animates (BlurFade, When not to use). The still wrapper rests where BlurFade settles (6px up), so a list shown at
 * once lines up exactly with the one that faded in.
 */
function Entrance({ fade, index, children }: { fade: boolean; index: number; children: ReactNode }) {
  if (!fade) return <div className="h-full -translate-y-1.5">{children}</div>
  return (
    <BlurFade inView delay={0.03 * index} className="h-full">
      {children}
    </BlurFade>
  )
}

/* ── Which courses (decision 56) ─────────────────────────────────────────── */

/** The list's tabs, "All {n}", "Remaining {n}" and "Completed {n}", in this order. */
const LISTS: { value: CoursesFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "remaining", label: "Remaining" },
  { value: "completed", label: "Completed" },
]

/** The slugs on a list as the store has them now: the page shows this snapshot until another list is chosen. */
function listOf(filter: CoursesFilter, store: Store): ReadonlySet<string> {
  const on = (c: Course) => filter === "all" || isCompleted(c.slug, store) === (filter === "completed")
  return new Set(LIST.filter(on).map((c) => c.slug))
}

/**
 * Each entry's list for this page load, by entry id, as the router keeps scroll positions: Back and Forward show the
 * list the entry left, so a course marked since on another page (Learn's or Home's toggle) keeps its card there, the
 * restored scroll lands on the same cards, and the card that left the page takes focus again (decision 33).
 */
const SHOWN = new Map<string, { filter: CoursesFilter; slugs: ReadonlySet<string> }>()

/**
 * The list an entry opens on: the one it left this page load, else a fresh snapshot. An empty list is taken again,
 * since its message ("No completed courses yet") may no longer hold. Back or Forward to an entry this page load has
 * not shown (the student reloaded on another page) keeps the card that left the page on the fresh list, so focus
 * still returns to it; a reload of Courses does not, since the load moves no focus (history.state keeps the key).
 */
function entryList(entry: Readonly<EntryState>, filter: CoursesFilter, store: Store): ReadonlySet<string> {
  const kept = SHOWN.get(entry.id)
  if (kept && kept.filter === filter && kept.slugs.size > 0) return kept.slugs
  const list = new Set(listOf(filter, store))
  // only for an entry not yet shown: one left from an empty list was not left by a card, so its key is an older one
  const left = !kept && entry.focusKey?.startsWith("card:") ? entry.focusKey.slice("card:".length) : null
  if (isCourseSlug(left) && getRoute().change.cause === "pop") list.add(left)
  return list
}

/** What an empty list says. All always holds every course, so only Remaining and Completed can be empty. */
function emptyOf(filter: CoursesFilter): { title: string; description: string; icon: LucideIcon } {
  if (filter === "completed")
    return {
      title: "No completed courses yet",
      description: "When you pass a course, tap Completed on its card to file it here.",
      icon: CircleCheck,
    }
  return {
    title: "Every course completed",
    description: "Every course in the degree plan is marked completed. Nice work.",
    icon: GraduationCap,
  }
}

/* ── Course index ────────────────────────────────────────────────────────── */

/** The Course index (Surfaces, Course index): one folder per subject group, holding its courses as "{CODE} {Name}". */
const courseLeaf = (c: Course): BoughNode => ({ id: c.slug, label: `${c.code} ${c.name}`, focusKey: `index:${c.slug}` })
const groupNode = (id: string) => `group:${id}`
const COURSE_TREE: BoughNode[] = GROUPS.map((g) => ({ id: groupNode(g.id), label: g.label, children: g.courses.map(courseLeaf) }))
/** Each course's group folder, so the index opens on the active course's group. */
const GROUP_OF = new Map(GROUPS.flatMap((g) => g.courses.map((c) => [c.slug, groupNode(g.id)] as const)))

const WIDE = "(min-width: 1024px)"
const watchWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}
const isWide = () => window.matchMedia(WIDE).matches

function CourseIndex({ course, navigate, leftFromLeaf }: { course: string; navigate: Navigate; leftFromLeaf: boolean }) {
  // BoughIndex reads defaultExpandedIds once, so it is re-keyed when the 1024px query changes (an iPad turned, a
  // window dragged across 1024); the first group toggle freezes the key, so the student's fold stays. From 1024px the
  // active course's group starts open, and below everything starts folded. An entry left through an Index leaf (which
  // made that course active) opens its group at every width, so Back finds the leaf and focus returns to it
  // (decision 33)
  const wide = useSyncExternalStore(watchWide, isWide)
  const [kept, setKept] = useState<string | null>(null)
  const foldKey = kept ?? (wide ? "wide" : "narrow")

  /** A leaf opens what its card opens; a modified click opens it in a new browser tab. */
  const open = (node: BoughNode, e?: ClickLike) => {
    if (node.children) return
    const href = hrefFor("learn", node.id)
    if (e && !isPlainClick(e)) window.open(href, "_blank", "noopener")
    else navigate(href)
  }

  return (
    <Card className="p-4">
      <p className={LABEL}>Index</p>
      <div className="mt-2 overflow-x-auto">
        <BoughIndex
          key={foldKey}
          label="Course index"
          nodes={COURSE_TREE}
          defaultExpandedIds={wide || leftFromLeaf ? [GROUP_OF.get(course) ?? ""] : []}
          selectedId={course}
          onSelect={open}
          onToggle={() => setKept(foldKey)}
          className="w-max min-w-full"
        />
      </div>
    </Card>
  )
}

/* ── View ────────────────────────────────────────────────────────────────── */

export default function Courses({ course, navigate, store, update, entry, runningExam, notFound, notFoundDelayed }: CoursesViewProps) {
  // NumberTicker's spring ignores reduced motion, so the tiles show the plain value instead
  const still = useReducedMotion()
  const guideable = LIST.filter((c) => courseInfo(c.slug)?.kind !== "c952")
  const ready = guideable.filter((c) => courseInfo(c.slug)?.kind === "guide").length
  const kinds = LIST.map(assessmentOf)
  // a course whose CU isn't listed (null; every course lists it today) stays out of the total, and the note counts only
  // the rest
  const withCu = LIST.filter((c) => c.cu !== null)
  const cu = withCu.reduce((sum, c) => sum + (c.cu ?? 0), 0)

  // the list: which one (the entry's, else the one remembered this visit, else All) and its snapshot (on Back and
  // Forward, the one this entry left), kept for the entry each time it changes
  const [filter, setFilter] = useState<CoursesFilter>(() => initialCoursesFilter(entry))
  const [shown, setShown] = useState(() => entryList(entry, filter, store))
  useEffect(() => {
    SHOWN.set(entry.id, { filter, slugs: shown })
  }, [entry.id, filter, shown])
  // false until the student chooses a list: only the page's first list fades in
  const [chosen, setChosen] = useState(false)
  const [status, setStatus] = useState("")
  const allRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  // the tab list fits from 320px; only below 316px, with both of Remaining's and Completed's counts at two digits, or
  // under text zoom, is it wider than the page and scrolls sideways in its row: keep the chosen tab whole in view (at
  // once, never a glide); a page it fits has nothing to scroll
  useEffect(() => {
    const row = rowRef.current
    if (!row || row.scrollWidth <= row.clientWidth) return
    const tab = row.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!tab) return
    const box = row.getBoundingClientRect()
    const r = tab.getBoundingClientRect()
    // 4px more: the list's own padding, so its rounded end and the tab's focus ring show with the tab, also when the
    // browser scrolled the focused tab only to the row's edge
    if (r.left < box.left + 4) row.scrollLeft -= box.left - r.left + 4
    else if (r.right > box.right - 4) row.scrollLeft += r.right - box.right + 4
  }, [filter])

  const choose = (value: string) => {
    if (!isCoursesFilter(value)) return
    setFilter(value)
    setShown(listOf(value, store))
    setChosen(true)
    patchEntry({ coursesFilter: value })
  }

  const markDone = (slug: string, done: boolean) => {
    markCompleted(update, slug, done)
    setStatus(completedText(slug, done))
  }

  const degree = degreeProgress(store)
  const degreePct = percent(degree.done, degree.total)
  const counts: Record<CoursesFilter, number> = {
    all: degree.total,
    remaining: degree.total - degree.done,
    completed: degree.done,
  }

  const stats: { label: string; value: number; suffix: string; note: string; icon: LucideIcon }[] = [
    {
      label: "Courses",
      value: LIST.length,
      suffix: "",
      note:
        ready === 0
          ? "Study guides in progress"
          : ready === guideable.length
            ? "Every study guide ready"
            : `${ready} of ${guideable.length} study guides ready`,
      icon: GraduationCap,
    },
    { label: "Total", value: cu, suffix: " CU", note: `Competency units across ${withCu.length} courses`, icon: Sigma },
    { label: "Objective", value: kinds.filter((k) => k === "Objective").length, suffix: "", note: "Proctored exams", icon: ClipboardCheck },
    { label: "Performance", value: kinds.filter((k) => k === "Performance").length, suffix: "", note: "Graded projects", icon: FileText },
  ]

  // the subject groups with cards on the shown list; a group with none leaves the page
  const sections = GROUPS.map((g) => ({ ...g, courses: g.courses.filter((c) => shown.has(c.slug)) })).filter(
    (g) => g.courses.length > 0,
  )
  const empty = emptyOf(filter)

  const card = (c: Course) => (
    <CourseCard
      course={c}
      active={c.slug === course}
      done={isCompleted(c.slug, store)}
      store={store}
      navigate={navigate}
      onCompletedChange={(next) => markDone(c.slug, next)}
    />
  )

  return (
    <>
      {/* ── Header: kicker, title, lead on the dimmed field; the Course index window beside them from lg, under
          the lead below. grid-cols-1 (minmax(0, 1fr)) keeps the index's sideways scroll inside its window. ── */}
      <header className="mt-12 grid grid-cols-1 sm:mt-16 short:mt-6 lg:grid-cols-2 lg:gap-8">
        <div>
          <p className={LABEL}>Unofficial · for WGU Computer Science</p>
          <PageTitle text="Courses" />
          <p className={cn(LEAD, "mt-4")}>
            The WGU B.S. Computer Science degree plan by subject, each course with a researched study guide.
          </p>
        </div>
        <BlurFade className="mt-8 min-w-0 lg:mt-0">
          <CourseIndex course={course} navigate={navigate} leftFromLeaf={!!entry.focusKey?.startsWith("index:")} />
        </BlurFade>
      </header>

      {/* ── Alerts, when they apply: the bad link's, then the running C952 exam's ── */}
      {notFound !== null && <CourseNotFoundNotice slug={notFound} delayed={notFoundDelayed} className="mt-8" />}
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className={notFound !== null ? "mt-4" : "mt-8"} />

      {/* ── Stats: four readouts (two brackets that stay muted) ── */}
      <ul role="list" className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <li key={s.label}>
            <BlurFade delay={0.05 + i * 0.04} className="h-full">
              <CornerFrame asChild corners={["top-left", "bottom-right"]} size="16px" thickness="2px" inset="8px">
                <Card className="h-full p-6 max-[400px]:p-4">
                  {/* gap-1 (an inline gap): "PERFORMANCE" and its icon share a narrow tile; below 400px the icon hides */}
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn(LABEL, "truncate")}>{s.label}</p>
                    <s.icon className="h-4 w-4 flex-none text-muted-foreground max-[400px]:hidden" aria-hidden="true" />
                  </div>
                  <p className={cn(STAT, "mt-2 whitespace-nowrap")}>
                    {/* the ticker starts empty and counts up; screen readers get the final number */}
                    <span aria-hidden="true">{still ? s.value : <NumberTicker value={s.value} />}</span>
                    <span className="sr-only">{s.value}</span>
                    {s.suffix && <span className="text-muted-foreground">{s.suffix}</span>}
                  </p>
                  <p className="mt-2 text-xs break-words text-muted-foreground">{s.note}</p>
                </Card>
              </CornerFrame>
            </BlurFade>
          </li>
        ))}
      </ul>

      {/* ── Degree progress: one window the stats' width, its numbers live (a mark updates it at once) ── */}
      <BlurFade delay={0.21} className="mt-4">
        <Card className="p-6 max-[400px]:p-4">
          <p className={LABEL}>Degree progress</p>
          {/* each phrase stays whole, so a narrow window breaks the line only after the dot */}
          <p className="mt-2 font-mono text-sm text-foreground">
            <span className="whitespace-nowrap">
              {degree.done} of {degree.total} courses
            </span>
            {" · "}
            <span className="whitespace-nowrap">
              {degree.cuDone} of {degree.cuTotal} CU
            </span>
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Progress
              className="flex-1"
              value={degreePct}
              aria-label="Degree progress"
              aria-valuetext={`${degree.done} of ${degree.total} courses completed`}
            />
            <span className="w-10 text-right font-mono text-sm text-muted-foreground">{degreePct}%</span>
          </div>
        </Card>
      </BlurFade>

      {/* ── The degree plan: Tabs over one list, then one section per subject group on it. Not sticky (Courses has
          no sticky bar) and out of any BlurFade. The triggers' padding narrows on phones so the labels fit whole:
          at the widest counts ("All 29", "Remaining 15", "Completed 14": 30 mono characters, 252px) the list is 332px
          with px-3, 308 with px-2 below 400 (a 360 phone has 328), 284 with px-1 below 360 (a 320 phone has 288;
          "All 29" stays 58px wide). The list keeps its p-1, which holds the end tabs' focus rings inside the row; the
          row scrolls sideways only under text zoom or below 316 ── */}
      <Tabs value={filter} onValueChange={choose} className="mt-20">
        <div ref={rowRef} className="flex overflow-x-auto">
          <TabsList aria-label="Which courses">
            {LISTS.map((l) => (
              <TabsTrigger
                key={l.value}
                value={l.value}
                ref={l.value === "all" ? allRef : undefined}
                className="max-[400px]:px-2 max-[360px]:px-1"
              >
                {l.label} {counts[l.value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {LISTS.map((l) => (
          <TabsContent key={l.value} value={l.value} className="mt-8">
            {sections.length === 0 ? (
              <div className="flex justify-center">
                <EmptyState
                  title={empty.title}
                  description={empty.description}
                  icons={[empty.icon]}
                  action={{
                    label: "Show all",
                    onClick: () => {
                      choose("all")
                      allRef.current?.focus()
                    },
                  }}
                />
              </div>
            ) : (
              sections.map((g, gi) => (
                <section key={g.id} aria-labelledby={`courses-${g.id}`} className={gi === 0 ? undefined : "mt-16"}>
                  <Heading
                    id={`courses-${g.id}`}
                    title={g.label}
                    aside={`${g.courses.length} ${g.courses.length === 1 ? "course" : "courses"}`}
                  />
                  <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.courses.map((c, i) => (
                      <li key={c.slug}>
                        <Entrance fade={!chosen} index={i}>
                          {card(c)}
                        </Entrance>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* always mounted, outside the panels: says each Completed toggle ("D278 marked completed.") */}
      <p role="status" className="sr-only">
        {status}
      </p>

      {/* ── Backup: the page's last section (its own heading, note and buttons) ── */}
      <ProgressBackup store={store} />

      <p className="mt-14 max-w-[680px] font-sans text-sm text-muted-foreground">
        Study guides are researched from public sources and cited. Course details change; confirm requirements on your
        WGU course page. Not affiliated with Western Governors University.
      </p>
    </>
  )
}
