/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The courses as the chrome and the pages see them (decisions 6, 14, 20, 25, 26 and 55 to 58; Navigation, The active
 * course): the slugs, slug checks, the active course's storage and the words said when it changes, the keys of in-page
 * state (Learn tabs, Practice lists and modes, Flashcards lists, the Courses page's lists), one info record per course
 * and the subject groups, the counts every surface shares, the completed marks with degree progress and the next
 * course (decision 56), the exam date with its countdown and plan-day pacing (decision 58), and the per-visit memory
 * (CHANGES.md, step 1) of C952 Learn's last topic, each guide's last Learn tab and question list, each course's last
 * Practice mode and Flashcards list (C952's included), and the Courses page's last list. No React here: markCompleted
 * and saveExamDate write only through the `update` they are given.
 *
 * The guide checks below mirror the runtime coercion of the guide page (`normalizeGuide`, `TAB_HAS` and `plain` in
 * src/views/course/shared.tsx, and the Study plan's day labels): a guide is usable when one of its parts has content,
 * and a practice question counts when it has a stem and an answer or a why. If that coercion changes, these checks
 * follow (a change request). They read each guide's outline from `virtual:guide-index`, which keeps exactly what
 * they look at, so the counts are ready at startup before any guide loads.
 */
import { GUIDE_INDEX } from "virtual:guide-index"
import { COURSE_GROUPS, COURSES, type CourseGroup, type CourseGuide } from "@/data/courses"
import { C952_CARDS, PLAN, TOPIC_BY_ID, type TopicId } from "@/data"
import {
  c952MissCount,
  cardCounts,
  daysUntil,
  examDateOf,
  isCompletedIn,
  isSavingSuspended,
  parseLocalDay,
  practiceCounts,
  setCompleted,
  setExamDate,
  type StorageLike,
  type Store,
  type Update,
} from "@/lib/store"

/** localStorage key of the active course: a bare slug such as "d281" (decision 7). */
export const COURSE_KEY = "wgu-study-buddy-course-v1"

/** The course a missing, unknown or unreadable value means, and the course old bare tool links open. */
export const DEFAULT_COURSE = "c952"

/** The C952 slug: the course with its own four screens and its own question bank. */
export const C952 = "c952"

/** Every course slug, sorted by code (c867 c949 c950 c952 … d687), for slug checks (decision 14). */
export const COURSE_SLUGS: readonly string[] = Object.freeze(
  [...COURSES].sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)).map((c) => c.slug),
)

const SLUGS = new Set(COURSE_SLUGS)

/** True for a lower-case code in COURSES ("d281"); false for anything else, "D281" and "constructor" included. */
export function isCourseSlug(value: unknown): value is string {
  return typeof value === "string" && SLUGS.has(value)
}

/* ── Keys of in-page state (Navigation, History) ─────────────────────────── */

/** A guide Learn's tabs, in their order on every guide (decision 21). The values ride on `courseTab.tab`. */
export const LEARN_TABS = ["overview", "topics", "plan", "community", "resources", "sources"] as const
export type LearnTab = (typeof LEARN_TABS)[number]

/** A guide Practice's lists, "All {N}", "Missed {m}" and "New {k}" (decision 23). The values ride on `practiceFilter`. */
export const PRACTICE_FILTERS = ["all", "missed", "new"] as const
export type PracticeFilter = (typeof PRACTICE_FILTERS)[number]

/**
 * Practice's modes, "Exam" (the practice exam's mode picker, every course's; decision 60), "Questions" (a guide's
 * questions graded in place) and "Flashcards" (decision 57). They ride on `practiceMode`. C952 has Exam and Flashcards;
 * its old entries' "questions" (its mode picker before decision 60) read as "exam".
 */
export const PRACTICE_MODES = ["exam", "questions", "cards"] as const
export type PracticeMode = (typeof PRACTICE_MODES)[number]

/** The Flashcards lists, "All", "Study again" and "New" (decision 57). The values ride on `cardFilter`. */
export const CARD_FILTERS = ["all", "again", "new"] as const
export type CardFilter = (typeof CARD_FILTERS)[number]

/** The Courses page's lists, "All", "Remaining" and "Completed" (decision 56). The values ride on `coursesFilter`. */
export const COURSES_FILTERS = ["all", "remaining", "completed"] as const
export type CoursesFilter = (typeof COURSES_FILTERS)[number]

/** The old guide page's tab keys (`TABS` in src/views/course/shared.tsx), which old `#courses/<slug>` entries saved (decision 2). */
export const OLD_GUIDE_TABS = [
  "overview",
  "topics",
  "facts",
  "plan",
  "practice",
  "pitfalls",
  "community",
  "resources",
  "sources",
] as const
export type OldGuideTab = (typeof OLD_GUIDE_TABS)[number]

export const isLearnTab = (v: unknown): v is LearnTab => typeof v === "string" && (LEARN_TABS as readonly string[]).includes(v)
export const isPracticeFilter = (v: unknown): v is PracticeFilter =>
  typeof v === "string" && (PRACTICE_FILTERS as readonly string[]).includes(v)
export const isPracticeMode = (v: unknown): v is PracticeMode =>
  typeof v === "string" && (PRACTICE_MODES as readonly string[]).includes(v)
export const isCardFilter = (v: unknown): v is CardFilter => typeof v === "string" && (CARD_FILTERS as readonly string[]).includes(v)
export const isCoursesFilter = (v: unknown): v is CoursesFilter =>
  typeof v === "string" && (COURSES_FILTERS as readonly string[]).includes(v)
export const isOldGuideTab = (v: unknown): v is OldGuideTab =>
  typeof v === "string" && (OLD_GUIDE_TABS as readonly string[]).includes(v)
/** A C952 topic id ("t1" to "t8") that the bank has. */
export const isTopicId = (v: unknown): v is TopicId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(TOPIC_BY_ID, v)

/* ── The guides, coerced only as far as the counts need ──────────────────── */

const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : ""
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const strs = (v: unknown) => arr(v).map(str).filter(Boolean)
const obj = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

function isHttpUrl(url: string) {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }
const decode = (s: string) => s.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
const BREAK_TAGS = /<\/?(?:br|p|div|ul|ol|li)\b[^>]*>/gi
const INLINE_TAGS = /<\/?(?:a|b|strong|i|em|code|sub|sup|span|mark|small|u|s)\b[^>]*>/gi

/** Researched HTML as plain text, as the guide page's `plain` makes it (src/views/course/shared.tsx). */
const plain = (html: string) =>
  decode(decode(html).replace(BREAK_TAGS, " ").replace(INLINE_TAGS, "")).replace(/\s+/g, " ").trim()

/** One day of a guide's study plan as plain text: what Home's "Next up · {CODE}" line shows ("{day} · {focus}"). */
export interface GuidePlanDay {
  /** "Day 3"; "Step {n}" when the guide gives none, as the Study plan labels it */
  day: string
  /** The day's focus as plain text; "" when the day has only tasks */
  focus: string
}

interface GuideFacts {
  usable: boolean
  practice: number
  /** keyFacts with a label or a value: the guide's flashcards (decision 57) */
  facts: number
  plan: number
  topics: number
  oldTabs: ReadonlySet<OldGuideTab>
  learnTabs: readonly LearnTab[]
  planDays: readonly GuidePlanDay[]
}

function guideFacts(raw: CourseGuide | undefined): GuideFacts {
  const g = obj(raw)
  const a = obj(g.assessment)
  const assessment = !!(str(a.type) || str(a.format) || strs(a.details).length || strs(a.tips).length)
  const competencies = strs(g.competencies).length
  const caveats = strs(g.caveats).length
  const topics = arr(g.topics)
    .map(obj)
    .filter((t) => str(t.title) || str(t.eli5) || str(t.detail) || strs(t.points).length).length
  const facts = arr(g.keyFacts)
    .map(obj)
    .filter((f) => str(f.label) || str(f.value)).length
  const planItems = arr(g.plan)
    .map(obj)
    .filter((p) => str(p.focus) || strs(p.tasks).length)
  const plan = planItems.length
  const practice = arr(g.practice)
    .map(obj)
    .filter((p) => str(p.q) && (str(p.answer) || str(p.why))).length
  const pitfalls = strs(g.pitfalls).length
  const cm = obj(g.community)
  const posts = arr(cm.posts)
    .map(obj)
    .filter((p) => isHttpUrl(str(p.url)) && (str(p.title) || str(p.takeaway))).length
  const community = !!str(cm.summary) || posts > 0
  const resources = arr(g.resources)
    .map(obj)
    .filter((r) => str(r.label) || isHttpUrl(str(r.url))).length
  const sources = arr(g.sources)
    .map(obj)
    .filter((s) => isHttpUrl(str(s.url))).length

  const has = {
    assessment: assessment || competencies > 0,
    topics: topics > 0,
    facts: facts > 0,
    plan: plan > 0,
    practice: practice > 0,
    pitfalls: pitfalls > 0,
    community,
    resources: resources > 0 || sources > 0 || caveats > 0,
  }
  const tabs: Record<OldGuideTab, boolean> = {
    overview: !!str(g.summary) || has.assessment || caveats > 0,
    topics: has.topics,
    facts: has.facts,
    plan: has.plan,
    practice: has.practice,
    pitfalls: has.pitfalls,
    community: has.community,
    resources: resources > 0,
    sources: sources > 0,
  }
  const usable = Object.values(has).some(Boolean)
  return {
    usable,
    practice,
    facts,
    plan,
    topics,
    oldTabs: new Set(OLD_GUIDE_TABS.filter((k) => tabs[k])),
    learnTabs: Object.freeze(usable ? LEARN_TABS.filter((k) => tabs[k]) : []),
    planDays: Object.freeze(
      planItems.map((p, i) => Object.freeze({ day: plain(str(p.day)) || `Step ${i + 1}`, focus: plain(str(p.focus)) })),
    ),
  }
}

/* ── Course info ─────────────────────────────────────────────────────────── */

/**
 * What a course is to the app: "c952" has its own four screens; "guide" has a usable study guide, split across the
 * four guide tools; "pending" has none yet, so all four tools show "Study guide in progress" (decision 26).
 */
export type CourseKind = "c952" | "guide" | "pending"

export interface CourseInfo {
  slug: string
  /** "D281" */
  code: string
  /** "Linux Foundations" */
  name: string
  kind: CourseKind
  /** kind === "guide" */
  hasGuide: boolean
  /** The guide's practice questions (N in decision 25); 0 for C952 and pending courses. */
  practiceTotal: number
  /** The guide's study plan days; 0 when none. */
  planTotal: number
  /** The guide's topics (Learn, Topics); 0 when none. */
  topicTotal: number
  /**
   * The course's flashcards (Practice, Flashcards; decision 57): a guide's keyFacts, C952's deck of formulas, signal
   * words and ARM reference (C952_CARDS, 52); 0 for pending courses.
   */
  cardTotal: number
  /** Competency units; null when the degree plan doesn't list them (every course lists them today). */
  cu: number | null
  /** The subject group the course sits in. */
  group: CourseGroup
}

const FACTS = new Map<string, GuideFacts>(
  COURSES.filter((c) => c.slug !== C952).map((c) => [c.slug, guideFacts(GUIDE_INDEX[c.slug])]),
)

const INFO = new Map<string, CourseInfo>(
  COURSES.map((c) => {
    const f = FACTS.get(c.slug)
    if (!f) {
      const info: CourseInfo = {
        slug: c.slug,
        code: c.code,
        name: c.name,
        kind: "c952",
        hasGuide: false,
        practiceTotal: 0,
        planTotal: 0,
        topicTotal: 0,
        cardTotal: C952_CARDS.length,
        cu: c.cu,
        group: c.group,
      }
      return [c.slug, Object.freeze(info)]
    }
    const info: CourseInfo = {
      slug: c.slug,
      code: c.code,
      name: c.name,
      kind: f.usable ? "guide" : "pending",
      hasGuide: f.usable,
      practiceTotal: f.usable ? f.practice : 0,
      planTotal: f.usable ? f.plan : 0,
      topicTotal: f.usable ? f.topics : 0,
      cardTotal: f.usable ? f.facts : 0,
      cu: c.cu,
      group: c.group,
    }
    return [c.slug, Object.freeze(info)]
  }),
)

/** The course's info, or null for anything that is not a slug. */
export function courseInfo(slug: string | null | undefined): CourseInfo | null {
  return (slug && INFO.get(slug)) || null
}

/** Every course's info, in the degree plan's order: by subject group, then study order (src/data/courses.ts). */
export const COURSE_LIST: readonly CourseInfo[] = Object.freeze(COURSES.map((c) => INFO.get(c.slug)!))

/** The course switcher's and the Courses page's groups, in order, each with its courses' info. */
export const COURSE_GROUP_LIST: readonly { id: CourseGroup; label: string; courses: readonly CourseInfo[] }[] =
  Object.freeze(
    COURSE_GROUPS.map((g) =>
      Object.freeze({
        id: g.id,
        label: g.label,
        courses: Object.freeze(COURSES.filter((c) => c.group === g.id).map((c) => INFO.get(c.slug)!)),
      }),
    ).filter((g) => g.courses.length > 0),
  )

/** "D281"; the slug upper-cased for anything unknown. */
export const codeOf = (slug: string) => courseInfo(slug)?.code ?? slug.toUpperCase()

/** True when the old guide page (`#courses/<slug>`) showed this tab for this course: the rewrite's "one the guide lacks". */
export function hasOldTab(slug: string, tab: string): boolean {
  return isOldGuideTab(tab) && (FACTS.get(slug)?.oldTabs.has(tab) ?? false)
}

const NO_TABS: readonly LearnTab[] = Object.freeze([])
const NO_DAYS: readonly GuidePlanDay[] = Object.freeze([])

/**
 * A guide Learn's tabs that have data, in LEARN_TABS order (decision 21): the tabs the router lets a new entry open
 * on. None for C952 and for a course with no usable guide.
 */
export function learnTabsOf(slug: string): readonly LearnTab[] {
  const f = FACTS.get(slug)
  return f && f.usable ? f.learnTabs : NO_TABS
}

/**
 * A guide's study plan days as plain text, in guide order; the index is the one `courses[slug].plan` marks use (the
 * Study plan's Done boxes). Count them with planCounts (src/lib/store.ts). None for C952 and a pending course.
 */
export function planDays(slug: string): readonly GuidePlanDay[] {
  const f = FACTS.get(slug)
  return f && f.usable ? f.planDays : NO_DAYS
}

/* ── Counts shared by the bar, Home, Courses and the tools (decision 25) ──── */

/** My Misses {n} for any course: C952's bank misses, a guide's missed practice questions, 0 for a pending course. */
export function courseMissCount(slug: string, store: Store): number {
  const info = courseInfo(slug)
  if (!info) return 0
  if (info.kind === "c952") return c952MissCount(store)
  if (info.kind === "guide") return practiceCounts(info, store).missed
  return 0
}

/* ── Completed courses and degree progress (decision 56) ─────────────────── */

/** True when the student marked the course completed. */
export function isCompleted(slug: string, store: Store): boolean {
  return isCourseSlug(slug) && isCompletedIn(store, slug)
}

/**
 * Marks a course completed or not: what every Completed toggle calls. The time is taken here, outside the updater
 * (StrictMode runs updaters twice).
 */
export function markCompleted(update: Update, slug: string, done: boolean): void {
  if (!isCourseSlug(slug)) return
  const at = Date.now()
  update((d) => setCompleted(d, slug, done, at))
}

/** The status line after a Completed toggle: "D278 marked completed." or "D278 no longer marked completed." */
export function completedText(slug: string, done: boolean): string {
  return `${codeOf(slug)} ${done ? "marked completed" : "no longer marked completed"}.`
}

export interface DegreeProgress {
  /** courses marked completed */
  done: number
  /** every course in the degree plan */
  total: number
  /** competency units of the completed courses that list their CU */
  cuDone: number
  /** competency units of every course that lists its CU (every course does today) */
  cuTotal: number
}

/** The degree plan's progress: courses completed, and CU completed out of every course that lists its CU. */
export function degreeProgress(store: Store): DegreeProgress {
  let done = 0
  let cuDone = 0
  let cuTotal = 0
  for (const c of COURSE_LIST) {
    const completed = isCompletedIn(store, c.slug)
    if (completed) done++
    if (c.cu !== null) {
      cuTotal += c.cu
      if (completed) cuDone += c.cu
    }
  }
  return { done, total: COURSE_LIST.length, cuDone, cuTotal }
}

/**
 * The course to study after `slug`: the first one after it in the degree plan's order (COURSE_LIST, by subject then
 * study order) that isn't completed, wrapping around and never `slug` itself; a course with a guide before one still
 * being researched. Null when every other course is completed.
 */
export function nextCourse(slug: string, store: Store): CourseInfo | null {
  const i = COURSE_LIST.findIndex((c) => c.slug === slug)
  const order = i < 0 ? [...COURSE_LIST] : [...COURSE_LIST.slice(i + 1), ...COURSE_LIST.slice(0, i)]
  const open = order.filter((c) => !isCompletedIn(store, c.slug))
  return open.find((c) => c.kind !== "pending") ?? open[0] ?? null
}

/* ── Exam dates and pacing (decision 58) ──────────────────────────────────── */

/** The days a study-plan entry's label spans: "Day 3" is 1, "Days 6-7" is 2; 1 when the label names no range. */
function daySpan(label: string): number {
  const m = /(\d+)\s*[-–]\s*(\d+)/.exec(label)
  if (!m) return 1
  const span = Number(m[2]) - Number(m[1]) + 1
  return span >= 1 && span <= 60 ? span : 1
}

export interface ExamStatus {
  /** the exam date, "YYYY-MM-DD" */
  date: string
  /** the date as a short label: "Sat, Dec 5", with the year when it isn't this year */
  label: string
  /** whole days from today: 0 on the exam day, negative after it */
  daysLeft: number
  /**
   * study-plan days not yet done, each entry weighted by its span ("Days 5-6" counts 2); C952's one-day plan counts 1
   * until every step is done; null when there's no plan
   */
  planDaysLeft: number | null
  /** with a plan and the exam still ahead: "on-pace" when the plan days left fit the days left, else "behind" */
  pace: "on-pace" | "behind" | null
}

/** Sets the course's exam date ("YYYY-MM-DD"), or clears it with null or anything that isn't a real day. */
export function saveExamDate(update: Update, slug: string, day: string | null): void {
  if (!isCourseSlug(slug)) return
  update((d) => setExamDate(d, slug, day))
}

/** A course's exam date with the countdown and the pacing against its study plan; null when no date is set. */
export function examStatus(slug: string, store: Store, today: Date = new Date()): ExamStatus | null {
  const date = examDateOf(store, slug)
  const day = date ? parseLocalDay(date) : null
  if (!date || !day) return null
  const daysLeft = daysUntil(day, today)
  const info = courseInfo(slug)
  let planDaysLeft: number | null = null
  if (info?.kind === "c952") {
    // C952's plan is one study day of timed steps (about 6 hours): one plan day until every step is done
    const marks = obj(store.plan)
    planDaysLeft = PLAN.length > 0 ? (PLAN.some((_, i) => marks[i] !== true) ? 1 : 0) : null
  } else if (info && info.planTotal > 0) {
    const marks = obj(store.courses?.[slug]?.plan)
    planDaysLeft = planDays(slug).reduce((sum, d, i) => sum + (marks[i] === true ? 0 : daySpan(d.day)), 0)
  }
  const pace = planDaysLeft === null || daysLeft <= 0 ? null : planDaysLeft <= daysLeft ? "on-pace" : "behind"
  const sameYear = day.getFullYear() === today.getFullYear()
  const label = day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })
  return { date, label, daysLeft, planDaysLeft, pace }
}

/* ── The active course's storage (decision 6) ─────────────────────────────── */

function localStore(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

/** The saved active course, read on load: a missing, unknown or unreadable value means "c952". Never throws. */
export function loadCourse(storage: StorageLike | null = localStore()): string {
  try {
    const v = storage?.getItem(COURSE_KEY)
    return isCourseSlug(v) ? v : DEFAULT_COURSE
  } catch {
    return DEFAULT_COURSE
  }
}

/** Saves the active course (call on every change). Ignores anything that is not a slug. Never throws. */
export function saveCourse(slug: string, storage: StorageLike | null = localStore()): void {
  if (!isCourseSlug(slug) || isSavingSuspended()) return
  try {
    storage?.setItem(COURSE_KEY, slug)
  } catch {
    /* storage blocked: the course lasts for the visit */
  }
}

/**
 * The status region's words after a course change (decision 34): "Now studying {CODE} {Name}.", and, while another
 * course's exam runs (`examCourse`, its slug; decision 60), "Your {EXAM CODE} exam keeps running."
 */
export function nowStudyingText(slug: string, examCourse: string | null): string {
  const info = courseInfo(slug)
  const said = info ? `Now studying ${info.code} ${info.name}.` : `Now studying ${slug.toUpperCase()}.`
  return examCourse && examCourse !== slug ? `${said} Your ${codeOf(examCourse)} exam keeps running.` : said
}

/* ── Per-visit memory (memory only, no storage) ───────────────────────────── */

let lastTopic: TopicId | null = null
const lastTab = new Map<string, LearnTab>()
const lastList = new Map<string, PracticeFilter>()
const lastMode = new Map<string, PracticeMode>()
const lastCards = new Map<string, CardFilter>()
let lastCoursesFilter: CoursesFilter | null = null

/** C952 Learn's last topic. The router records it from every entry it enters and every patch. */
export function rememberTopic(topic: TopicId): void {
  if (isTopicId(topic)) lastTopic = topic
}
export const rememberedTopic = (): TopicId | null => lastTopic

/** A guide Learn's last tab, per course. */
export function rememberTab(slug: string, tab: LearnTab): void {
  if (isCourseSlug(slug) && slug !== C952 && isLearnTab(tab)) lastTab.set(slug, tab)
}
export const rememberedTab = (slug: string): LearnTab | null => lastTab.get(slug) ?? null

/** A guide Practice's last list, per course. */
export function rememberList(slug: string, list: PracticeFilter): void {
  if (isCourseSlug(slug) && slug !== C952 && isPracticeFilter(list)) lastList.set(slug, list)
}
export const rememberedList = (slug: string): PracticeFilter | null => lastList.get(slug) ?? null

/** Practice's last mode, per course: a guide's, or C952's on the Practice Exam start screen (decisions 57 and 60). */
export function rememberMode(slug: string, mode: PracticeMode): void {
  if (isCourseSlug(slug) && isPracticeMode(mode)) lastMode.set(slug, mode)
}
export const rememberedMode = (slug: string): PracticeMode | null => lastMode.get(slug) ?? null

/** Practice's last Flashcards list, per course, C952's included (decision 57). */
export function rememberCardList(slug: string, list: CardFilter): void {
  if (isCourseSlug(slug) && isCardFilter(list)) lastCards.set(slug, list)
}
export const rememberedCardList = (slug: string): CardFilter | null => lastCards.get(slug) ?? null

/**
 * The state a Cheat Sheet's "Drill as flashcards" opens Practice with, a guide's or C952's (decision 57): Flashcards,
 * on the card list the student used last this visit, unless that list has no cards now (every "Study again" card known,
 * or no "New" card left): then All, so the link never lands on an empty list. `cardTotal` is the deck's size.
 */
export function drillPatch(slug: string, cardTotal: number, store: Store): { practiceMode: PracticeMode; cardFilter?: CardFilter } {
  const last = rememberedCardList(slug)
  const deck = cardCounts({ slug, cardTotal }, store)
  const empty = (last === "again" && deck.again === 0) || (last === "new" && deck.unseen === 0)
  return empty ? { practiceMode: "cards", cardFilter: "all" } : { practiceMode: "cards" }
}

/** The Courses page's last list (decision 56). */
export function rememberCoursesFilter(filter: CoursesFilter): void {
  if (isCoursesFilter(filter)) lastCoursesFilter = filter
}
export const rememberedCoursesFilter = (): CoursesFilter | null => lastCoursesFilter
