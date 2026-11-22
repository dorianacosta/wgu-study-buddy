/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Hash routes and history (decisions 1 to 5 and 33, with their section 6 amendments; Navigation, Destinations and
 * routes, Old links and bad links, History, Tab titles).
 *
 * - resolveHash is the pure parser: canonical form, old links, bad links. hrefFor and titleFor build hashes and tab
 *   titles.
 * - The router is a singleton that starts on first use: one history entry per change of page (navigate), in-page
 *   state on the entry (patchEntry), pinned on every entry from its first showing, scroll positions kept in memory
 *   per entry id and written to the entry only when scrolling has stopped, before a push and when the page is hidden;
 *   Back and Forward restore them.
 * - useRoute is the one React hook: the route, the entry's state and how the last change happened.
 *
 * Nothing here calls a history API from a scroll handler or once per frame (WebKit throws SecurityError after about
 * 100 pushState/replaceState calls in 10 to 30 s), and every history call sits in try/catch.
 */
import { useSyncExternalStore } from "react"
import type { TopicId } from "@/data"
import type { Exam } from "@/lib/exam"
import {
  C952,
  DEFAULT_COURSE,
  LEARN_TABS,
  codeOf,
  courseInfo,
  hasOldTab,
  isCardFilter,
  isCourseSlug,
  isCoursesFilter,
  isLearnTab,
  isPracticeFilter,
  isPracticeMode,
  isTopicId,
  learnTabsOf,
  rememberCardList,
  rememberCoursesFilter,
  rememberList,
  rememberMode,
  rememberTab,
  rememberTopic,
  rememberedCardList,
  rememberedCoursesFilter,
  rememberedList,
  rememberedMode,
  rememberedTab,
  rememberedTopic,
  type CardFilter,
  type CourseInfo,
  type CoursesFilter,
  type LearnTab,
  type PracticeFilter,
  type PracticeMode,
} from "@/lib/course"

/* ── Routes (decision 1) ─────────────────────────────────────────────────── */

export const VIEWS = ["home", "courses", "learn", "cheat", "exam", "misses"] as const
export type View = (typeof VIEWS)[number]

/** The four course tools: Learn, Cheat Sheet, Practice (C952: Practice Exam) and My Misses. */
export const TOOL_VIEWS = ["learn", "cheat", "exam", "misses"] as const
export type ToolView = (typeof TOOL_VIEWS)[number]

export const isToolView = (v: unknown): v is ToolView =>
  typeof v === "string" && (TOOL_VIEWS as readonly string[]).includes(v)

/** A page: `#home`, `#courses`, or a tool of one course (`#learn/d281`). `course` is required for the tools. */
export type Route = { view: "home"; course: null } | { view: "courses"; course: null } | { view: ToolView; course: string }

export const HOME_ROUTE: Route = Object.freeze({ view: "home", course: null })
export const COURSES_ROUTE: Route = Object.freeze({ view: "courses", course: null })

/** The canonical hash: "#home", "#courses", "#learn/d281". A tool with no course gets C952, as an old bare link does. */
export function hrefFor(view: View, course?: string | null): string {
  if (!isToolView(view)) return `#${view}`
  return `#${view}/${(course || DEFAULT_COURSE).toLowerCase()}`
}

/** The canonical hash of a route. */
export const hrefOf = (route: Route): string => hrefFor(route.view, route.course)

/* ── Tab titles (decision 4) ─────────────────────────────────────────────── */

export const APP_NAME = "WGU Study Buddy"

const PAGE_NAMES: Record<ToolView, string> = {
  learn: "Learn",
  cheat: "Cheat Sheet",
  exam: "Practice",
  misses: "My Misses",
}

/** `document.title` for a route: "WGU Study Buddy", "Courses · WGU Study Buddy", "{Page} · {CODE} · WGU Study Buddy". */
export function titleFor(route: Route): string {
  if (route.view === "home") return APP_NAME
  if (route.view === "courses") return `Courses · ${APP_NAME}`
  const page = route.view === "exam" && route.course === C952 ? "Practice Exam" : PAGE_NAMES[route.view]
  return `${page} · ${codeOf(route.course)} · ${APP_NAME}`
}

/* ── History entry state (decision 3) ────────────────────────────────────── */

/** A guide Learn's tab, as old and new entries keep it (`{ slug, tab }`). */
export interface CourseTab {
  slug: string
  tab: LearnTab
}

/** What rides on each history entry's `history.state`. */
export interface EntryState {
  /** The entry's key: given when it is pushed, or once on load or Back to an entry without one */
  id: string
  /** A guide Learn's tab (`#learn/<guide slug>` only) */
  courseTab?: CourseTab
  /** C952 Learn's topic, "t1" to "t8" (`#learn/c952` only) */
  learnTopic?: TopicId
  /** A guide Practice's list of questions (`#exam/<guide slug>` only) */
  practiceFilter?: PracticeFilter
  /** Practice's mode, Questions or Flashcards (`#exam/<slug>`, C952's start screen included; decision 57) */
  practiceMode?: PracticeMode
  /** Practice's list of flashcards (`#exam/<slug>`, C952's included; decision 57) */
  cardFilter?: CardFilter
  /** The Courses page's list: All, Remaining or Completed (`#courses` only; decision 56) */
  coursesFilter?: CoursesFilter
  /** The page's scroll position, written when scrolling stops, before a push and when the page is hidden */
  scrollY?: number
  /** The `data-focus-key` of the control that left this page: Back and Forward focus it again when it is in view */
  focusKey?: string
  /**
   * Set just before a backup restore reloads the page (noteRestoreForReload, decision 59). The load reads it once
   * (restoredThisLoad) and drops it: entryFor never copies it, so the next reload says nothing.
   */
  restored?: true
}

/** The in-page state a view may write or a link may name. A field that does not fit the route is dropped. */
export interface EntryPatch {
  courseTab?: CourseTab
  learnTopic?: TopicId
  practiceFilter?: PracticeFilter
  practiceMode?: PracticeMode
  cardFilter?: CardFilter
  coursesFilter?: CoursesFilter
}

/** The in-page fields, as unchecked input (an entry's `history.state`, a link's state). */
type RawPatch = { [K in keyof EntryPatch]?: unknown }

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v)

/**
 * Keeps the in-page fields that fit the route: learnTopic on `#learn/c952`, courseTab on a guide's Learn,
 * practiceFilter on a guide's Practice, practiceMode and cardFilter on any Practice (C952's Practice Exam included),
 * coursesFilter on `#courses`.
 */
function fitPatch(p: RawPatch, route: Route): EntryPatch {
  const out: EntryPatch = {}
  if (route.view === "learn" && route.course === C952) {
    if (isTopicId(p.learnTopic)) out.learnTopic = p.learnTopic
  } else if (route.view === "learn") {
    const t = p.courseTab
    if (isRecord(t) && t.slug === route.course && isLearnTab(t.tab)) out.courseTab = { slug: route.course, tab: t.tab }
  } else if (route.view === "exam") {
    // C952's Practice Exam has no question lists: its Questions mode is the exam's mode picker
    if (route.course !== C952 && isPracticeFilter(p.practiceFilter)) out.practiceFilter = p.practiceFilter
    if (isPracticeMode(p.practiceMode)) out.practiceMode = p.practiceMode
    if (isCardFilter(p.cardFilter)) out.cardFilter = p.cardFilter
  } else if (route.view === "courses") {
    if (isCoursesFilter(p.coursesFilter)) out.coursesFilter = p.coursesFilter
  }
  return out
}

/** Later patches win; an undefined field never erases an earlier one. */
function mergePatches(...patches: (EntryPatch | null | undefined)[]): EntryPatch {
  const out: EntryPatch = {}
  for (const p of patches) {
    if (!p) continue
    if (p.courseTab !== undefined) out.courseTab = p.courseTab
    if (p.learnTopic !== undefined) out.learnTopic = p.learnTopic
    if (p.practiceFilter !== undefined) out.practiceFilter = p.practiceFilter
    if (p.practiceMode !== undefined) out.practiceMode = p.practiceMode
    if (p.cardFilter !== undefined) out.cardFilter = p.cardFilter
    if (p.coursesFilter !== undefined) out.coursesFilter = p.coursesFilter
  }
  return out
}

/**
 * A Practice mode the course has data for: Flashcards needs cards (keyFacts, or C952's deck), Questions needs practice
 * questions (C952 always has its exam's; `practiceTotal` counts only a guide's).
 */
function fitMode(info: CourseInfo | null, wanted: PracticeMode): PracticeMode {
  if (!info) return wanted
  const questions = info.kind === "c952" || info.practiceTotal > 0
  if (wanted === "cards" && info.cardTotal === 0) return "questions"
  if (wanted === "questions" && !questions && info.cardTotal > 0) return "cards"
  return wanted
}

/**
 * The Practice mode an entry opens on (decision 57): the one it names (every link that starts a C952 exam names
 * Questions); else the mode of the one list it names (My Misses' "Practice my misses" names the missed questions, so
 * it opens on Questions); else the course's mode remembered this visit; else Questions. Always a mode the course has
 * data for.
 */
function practiceModeFor(slug: string, fields: EntryPatch): PracticeMode {
  const named =
    fields.practiceMode ??
    (fields.practiceFilter && !fields.cardFilter ? "questions" : fields.cardFilter && !fields.practiceFilter ? "cards" : null)
  return fitMode(courseInfo(slug), named ?? rememberedMode(slug) ?? "questions")
}

/** C952 Learn's first topic: where `#learn/c952` opens when no topic is named or remembered. */
const FIRST_TOPIC: TopicId = "t1"

/**
 * The in-page state an entry opens on (Navigation, History): the fields it has, else, for each field its route uses,
 * the course's value remembered this visit, else the default (Topic 01, Overview, All, Questions). The router pins
 * it on every entry it pushes, and on every entry it enters without one (load, Back, Forward), so Back, Forward and
 * reload reopen what the entry first showed, never what a later entry left in the per-visit memory. A guide tab the
 * guide lacks counts as none; so does a Practice mode it has no data for.
 */
function withInitial(route: Route, fields: EntryPatch): EntryPatch {
  if (route.view === "learn" && route.course === C952) {
    if (fields.learnTopic) return fields
    const topic = rememberedTopic() ?? FIRST_TOPIC
    return isTopicId(topic) ? { ...fields, learnTopic: topic } : fields
  }
  if (route.view === "learn") {
    const tabs = learnTabsOf(route.course)
    if (tabs.length === 0 || (fields.courseTab && tabs.includes(fields.courseTab.tab))) return fields
    const kept = rememberedTab(route.course)
    const tab = kept && tabs.includes(kept) ? kept : tabs.includes("overview") ? "overview" : tabs[0]
    return { ...fields, courseTab: { slug: route.course, tab } }
  }
  if (route.view === "exam") {
    const kind = courseInfo(route.course)?.kind
    if (kind !== "guide" && kind !== "c952") return fields
    // the mode first: it reads which list, if any, the fields name
    const practiceMode = practiceModeFor(route.course, fields)
    const cardFilter = fields.cardFilter ?? rememberedCardList(route.course) ?? "all"
    // C952's Practice Exam: the mode and the card list, and no question list (its Questions are the exam modes)
    if (kind === "c952") return { ...fields, practiceMode, cardFilter }
    return {
      ...fields,
      practiceMode,
      practiceFilter: fields.practiceFilter ?? rememberedList(route.course) ?? "all",
      cardFilter,
    }
  }
  if (route.view === "courses") {
    if (fields.coursesFilter) return fields
    return { ...fields, coursesFilter: rememberedCoursesFilter() ?? "all" }
  }
  return fields
}

/** The in-page fields of an entry's state. */
function inPage(s: EntryState): EntryPatch {
  const p: EntryPatch = {}
  if (s.courseTab) p.courseTab = { ...s.courseTab }
  if (s.learnTopic) p.learnTopic = s.learnTopic
  if (s.practiceFilter) p.practiceFilter = s.practiceFilter
  if (s.practiceMode) p.practiceMode = s.practiceMode
  if (s.cardFilter) p.cardFilter = s.cardFilter
  if (s.coursesFilter) p.coursesFilter = s.coursesFilter
  return p
}

let idSeq = 0
function newId(): string {
  idSeq += 1
  return `${Date.now().toString(36)}-${idSeq.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const isEntryId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64

/** The entry id `history.state` holds, or null. */
const idOf = (raw: unknown): string | null => (isRecord(raw) && isEntryId(raw.id) ? raw.id : null)

/**
 * In-page state per entry id, for this page load: the newest tab, topic or list of every entry entered or patched.
 * A patch that the rate limit deferred never reaches the entry it was for once Back or Forward has left it (history
 * writes go to the current entry only); this copy wins over that entry's `history.state` when it is entered again.
 */
const stateMemory = new Map<string, EntryPatch>()

/** An entry's state from whatever `history.state` holds (null, an old app's `{ courseTab }`, garbage), pinned (withInitial). */
function entryFor(raw: unknown, route: Route, courseTab?: CourseTab | null): EntryState {
  const s = isRecord(raw) ? raw : {}
  const out: EntryState = { id: isEntryId(s.id) ? s.id : newId() }
  const fields = fitPatch(
    {
      courseTab: courseTab === undefined ? s.courseTab : courseTab,
      learnTopic: s.learnTopic,
      practiceFilter: s.practiceFilter,
      practiceMode: s.practiceMode,
      cardFilter: s.cardFilter,
      coursesFilter: s.coursesFilter,
    },
    route,
  )
  const kept = stateMemory.get(out.id)
  Object.assign(out, withInitial(route, mergePatches(fields, kept ? fitPatch(kept, route) : null)))
  if (typeof s.scrollY === "number" && Number.isFinite(s.scrollY) && s.scrollY >= 0) out.scrollY = s.scrollY
  if (typeof s.focusKey === "string" && s.focusKey.length > 0 && s.focusKey.length <= 200) out.focusKey = s.focusKey
  return out
}

/* ── Parsing, canonical form and rewrites (decisions 1 and 2) ────────────── */

/** What resolveHash needs to know about courses (the app's real data unless a test passes its own). */
export interface RouteLookup {
  /** A lower-case code in COURSES */
  isCourse(slug: string): boolean
  /** The old guide page (`#courses/<slug>`) showed this tab key for this course */
  hasOldTab(slug: string, tab: string): boolean
}

const LOOKUP: RouteLookup = { isCourse: isCourseSlug, hasOldTab }

export interface Resolution {
  route: Route
  /** The canonical hash for the route */
  href: string
  /** The address is not already `href`: write `href` with replaceState (an old link, a bad link, another form) */
  rewrite: boolean
  /** The unknown course slug, decoded, as it arrived (the "Course not found" Alert); null otherwise */
  notFound: string | null
  /**
   * Set only for an old `#courses/<slug>` link: the Learn tab the entry's saved tab maps to, or null when the entry's
   * courseTab must go (the link now opens the Cheat Sheet, Practice, or C952)
   */
  courseTab?: CourseTab | null
}

/** Decision 2's table for an old `#courses/<slug>` entry's saved `courseTab.tab` key. */
const OLD_TAB_TOOL = new Map<string, "learn" | "cheat" | "exam">([
  ["overview", "learn"],
  ["topics", "learn"],
  ["plan", "learn"],
  ["community", "learn"],
  ["resources", "learn"],
  ["sources", "learn"],
  ["facts", "cheat"],
  ["pitfalls", "cheat"],
  ["practice", "exam"],
])

function resolved(route: Route, hash: string, notFound: string | null = null, courseTab?: CourseTab | null): Resolution {
  const href = hrefOf(route)
  const r: Resolution = { route, href, rewrite: hash !== href, notFound }
  if (courseTab !== undefined) r.courseTab = courseTab
  return r
}

function oldCourseLink(slug: string, state: unknown, lookup: RouteLookup, hash: string): Resolution {
  if (slug === C952) return resolved({ view: "learn", course: C952 }, hash, null, null)
  const saved = isRecord(state) && isRecord(state.courseTab) ? state.courseTab : null
  const key = saved && saved.slug === slug && typeof saved.tab === "string" ? saved.tab : null
  const tool = key !== null && lookup.hasOldTab(slug, key) ? OLD_TAB_TOOL.get(key) : undefined
  if (tool === "cheat" || tool === "exam") return resolved({ view: tool, course: slug }, hash, null, null)
  const tab: LearnTab = tool === "learn" && isLearnTab(key) ? key : "overview"
  return resolved({ view: "learn", course: slug }, hash, null, { slug, tab })
}

/**
 * Parses an address (`location.hash`, or an href) into a route, as decisions 1 and 2 say: drop the `#`, decode,
 * lower-case, split on `/`, ignore a trailing slash and any third segment.
 * - `#learn`, `#cheat`, `#exam`, `#misses` and an empty slug (`#learn/`) open C952's tool.
 * - `#courses/<slug>` opens the course's Learn, Cheat Sheet or Practice by the entry's saved `courseTab.tab` key
 *   (`state` is that entry's `history.state`); no saved tab, or one the guide lacks, opens Learn on Overview;
 *   `#courses/c952` opens C952's Learn.
 * - An unknown slug (`#courses/x`, `#learn/x`) opens `#courses` with `notFound`.
 * - Empty, `#`, anything else, or an address that cannot be decoded opens `#home`.
 * Pure: no history, storage or DOM.
 */
export function resolveHash(hash: string, state: unknown = null, lookup: RouteLookup = LOOKUP): Resolution {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return resolved(HOME_ROUTE, hash)
  }
  const parts = decoded.split("/")
  const first = parts[0].toLowerCase()
  const second = parts.length > 1 ? parts[1] : ""
  const slug = second.toLowerCase()
  if (first === "home") return resolved(HOME_ROUTE, hash)
  if (first === "courses") {
    if (!slug) return resolved(COURSES_ROUTE, hash)
    if (!lookup.isCourse(slug)) return resolved(COURSES_ROUTE, hash, second)
    return oldCourseLink(slug, state, lookup, hash)
  }
  if (isToolView(first)) {
    if (!slug) return resolved({ view: first, course: DEFAULT_COURSE }, hash)
    if (!lookup.isCourse(slug)) return resolved(COURSES_ROUTE, hash, second)
    return resolved({ view: first, course: slug }, hash)
  }
  return resolved(HOME_ROUTE, hash)
}

/* ── The router ──────────────────────────────────────────────────────────── */

/** How the current page was reached: the load (a rewrite or not), a push (navigate), or Back/Forward (any browser traversal). */
export type ChangeCause = "load" | "push" | "pop"

export interface RouteChange {
  /** 0 for the load, then +1 per change of page: an effect key */
  seq: number
  cause: ChangeCause
  /** The address arrived in another form (an old link, a bad link, `#Learn/D281/`) and was replaced */
  rewritten: boolean
  /** The unknown slug that sent the student to `#courses` (decoded, as it arrived); null otherwise */
  notFound: string | null
  /** The route before this change; null on load */
  from: Route | null
  /** Where the page scrolls once rendered: 0 after a push; the remembered position on load, Back and Forward */
  scrollTo: number
}

export interface RouteSnapshot {
  route: Route
  /** `hrefOf(route)` */
  href: string
  /**
   * The entry's state as it was when the page was entered: read it for initial values (initialLearnTab and friends).
   * It does not follow patchEntry or scrolling; readEntry() gives the live copy.
   */
  entry: Readonly<EntryState>
  change: RouteChange
}

export type NavigateResult = "pushed" | "same"

export interface NavigateOptions {
  /**
   * The `data-focus-key` to record on the page being left. Omit it to take the one of the clicked control (or the
   * focused one); pass null to record none. The course switcher passes its own key: a pick happens in its list.
   */
  focusKey?: string | null
}

/** Pushes one history entry for a change of page. On the current page it scrolls to the top and pushes nothing. */
export type Navigate = (href: string, state?: EntryPatch, options?: NavigateOptions) => NavigateResult

/** Scroll writes wait this long after the last scroll event (at most about 4 a second). */
export const SCROLL_WRITE_DELAY = 250
/** patchEntry writes at most once in this many ms. */
export const PATCH_WRITE_GAP = 250
/** Focus moves this long after a change of page (decision 33). */
export const FOCUS_DELAY = 60
/** After a load rewrite, the "Course not found" Alert fills this long after mounting (decision 34). */
export const NOT_FOUND_FILL_DELAY = 250
/** The page's main region, which holds the page's one h1. */
export const MAIN_SELECTOR = "#app"

interface Current {
  route: Route
  href: string
  /** The live state of the current entry: patches and scroll writes land here, then on the entry */
  state: EntryState
}

let started = false
let live = false
/** This page load follows a backup restore (the entry carried `restored`). */
let restoredOnLoad = false
let cur: Current = { route: HOME_ROUTE, href: "#home", state: { id: "static" } }
let snap: RouteSnapshot = {
  route: HOME_ROUTE,
  href: "#home",
  entry: Object.freeze({ id: "static" }),
  change: { seq: 0, cause: "load", rewritten: false, notFound: null, from: null, scrollTo: 0 },
}
const subscribers = new Set<() => void>()
/** Scroll positions per entry id, for this page load. */
const scrollMemory = new Map<string, number>()
let scrollTimer: ReturnType<typeof setTimeout> | undefined
let patchTimer: ReturnType<typeof setTimeout> | undefined
let lastWrite = Number.NEGATIVE_INFINITY
let clickTarget: Element | null = null
/**
 * Set while a push fell back to `location.hash`, until that address's hashchange: the traversal the assignment causes
 * (Chrome fires popstate inside it, then hashchange; a browser may fire only the hashchange) adopts the new entry,
 * which is already current, instead of entering the page again. `wrote`: its one try to write the entry's state.
 */
let fallback: { hash: string; wrote: boolean } | null = null

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

function readState(): unknown {
  try {
    return history.state
  } catch {
    return null
  }
}

function readHash(): string {
  try {
    return location.hash
  } catch {
    return ""
  }
}

function scrollYNow(): number {
  try {
    return Math.max(0, window.scrollY || 0)
  } catch {
    return 0
  }
}

function scrollToY(y: number) {
  try {
    window.scrollTo({ top: y, left: 0, behavior: "instant" })
  } catch {
    try {
      window.scrollTo(0, y)
    } catch {
      /* no scrolling here */
    }
  }
}

/** replaceState on the current entry; the URL only for a rewrite. */
function replaceEntry(state: EntryState, url?: string): boolean {
  try {
    if (url === undefined) history.replaceState(state, "")
    else history.replaceState(state, "", url)
    lastWrite = now()
    return true
  } catch {
    return false
  }
}

function cancelWrites() {
  if (scrollTimer !== undefined) clearTimeout(scrollTimer)
  if (patchTimer !== undefined) clearTimeout(patchTimer)
  scrollTimer = undefined
  patchTimer = undefined
}

/** The per-visit memory (course.ts) and the per-entry copy follow every entry the student enters and every patch. */
function remember(route: Route, s: EntryState) {
  stateMemory.set(s.id, inPage(s))
  if (route.view === "learn" && route.course === C952) {
    if (s.learnTopic) rememberTopic(s.learnTopic)
  } else if (route.view === "learn") {
    if (s.courseTab) rememberTab(route.course, s.courseTab.tab)
  } else if (route.view === "exam") {
    if (s.practiceFilter && route.course !== C952) rememberList(route.course, s.practiceFilter)
    if (s.practiceMode) rememberMode(route.course, s.practiceMode)
    if (s.cardFilter) rememberCardList(route.course, s.cardFilter)
  } else if (route.view === "courses") {
    if (s.coursesFilter) rememberCoursesFilter(s.coursesFilter)
  }
}

function notify() {
  for (const fn of [...subscribers]) fn()
}

/** Restores the change's scroll position one frame after it, once React has rendered the page. */
function scheduleScroll(id: string, y: number) {
  const run = () => {
    if (cur.state.id === id) scrollToY(y)
  }
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run)
  else setTimeout(run, 0)
}

function enter(route: Route, href: string, state: EntryState, change: Omit<RouteChange, "seq" | "from">, first = false) {
  const from = first ? null : cur.route
  cur = { route, href, state }
  remember(route, state)
  snap = {
    route,
    href,
    entry: Object.freeze({ ...state, ...(state.courseTab ? { courseTab: { ...state.courseTab } } : {}) }),
    change: { ...change, seq: first ? 0 : snap.change.seq + 1, from },
  }
  // the load restores only a saved position (a reload); a fresh load leaves the page where it is
  if (!first || state.scrollY !== undefined) scheduleScroll(state.id, change.scrollTo)
  if (!first) notify()
}

function onScroll() {
  const id = cur.state.id
  scrollMemory.set(id, scrollYNow())
  if (scrollTimer !== undefined) clearTimeout(scrollTimer)
  // the handler only remembers; the write waits until scrolling has stopped
  scrollTimer = setTimeout(() => {
    scrollTimer = undefined
    if (cur.state.id !== id) return
    cur.state.scrollY = scrollMemory.get(id) ?? scrollYNow()
    replaceEntry(cur.state)
  }, SCROLL_WRITE_DELAY)
}

/** pagehide, and visibilitychange to hidden: the entry keeps its scroll position for a reload or a later visit. */
function writeNow() {
  if (!live) return
  cancelWrites()
  const y = scrollYNow()
  scrollMemory.set(cur.state.id, y)
  cur.state.scrollY = y
  replaceEntry(cur.state)
}

function onVisibility() {
  try {
    if (document.visibilityState === "hidden") writeNow()
  } catch {
    /* ignore */
  }
}

function onClickCapture(e: Event) {
  clickTarget = e.target instanceof Element ? e.target : null
  setTimeout(() => {
    clickTarget = null
  }, 0)
}

/** The data-focus-key of the control that is leaving the page: the clicked one, else the focused one. */
function focusKeyNow(): string | null {
  try {
    const active = document.activeElement instanceof Element ? document.activeElement : null
    const from = clickTarget ?? active
    const key = from?.closest("[data-focus-key]")?.getAttribute("data-focus-key")
    return key ? key : null
  } catch {
    return null
  }
}

/** popstate and hashchange: Back, Forward, a typed address, a link the app did not route. */
function onTraverse(e?: Event) {
  const isHashChange = e?.type === "hashchange"
  // a hashchange for an address that is no longer current is stale: its traversal was handled by its popstate (and
  // perhaps rewritten), or a later one replaced it
  try {
    if (isHashChange && (e as HashChangeEvent).newURL && (e as HashChangeEvent).newURL !== location.href) return
  } catch {
    /* ignore */
  }
  const raw = readState()
  const hash = readHash()
  const rawId = idOf(raw)
  if (fallback !== null) {
    if (hash === fallback.hash && (rawId === null || rawId === cur.state.id)) {
      // the traversal navigate's fallback caused: the new entry is already current, so it only takes its state, once,
      // if history lets it, and the fallback ends with the address's hashchange
      if (!fallback.wrote) {
        fallback.wrote = true
        if (rawId === null) replaceEntry(cur.state)
      }
      if (isHashChange) fallback = null
      return
    }
    fallback = null
  }
  const r = resolveHash(hash, raw)
  // the second event for one traversal (hashchange after popstate), or a no-op
  if (rawId !== null && rawId === cur.state.id && r.href === cur.href && !r.rewrite) return
  const state = entryFor(raw, r.route, r.courseTab)
  if (r.rewrite || rawId !== state.id || JSON.stringify(raw) !== JSON.stringify(state)) {
    replaceEntry(state, r.rewrite ? r.href : undefined)
  }
  // a write still pending for the page that was left is dropped: its scroll position and in-page state stay in memory
  cancelWrites()
  const scrollTo = scrollMemory.get(state.id) ?? state.scrollY ?? 0
  enter(r.route, r.href, state, { cause: "pop", rewritten: r.rewrite, notFound: r.notFound, scrollTo })
}

function startRouter() {
  if (started) return
  started = true
  if (typeof window === "undefined" || typeof history === "undefined" || typeof location === "undefined") return
  live = true
  try {
    history.scrollRestoration = "manual"
  } catch {
    /* ignore */
  }
  const raw = readState()
  const hash = readHash()
  restoredOnLoad = isRecord(raw) && raw.restored === true
  const r = resolveHash(hash, raw)
  const state = entryFor(raw, r.route, r.courseTab)
  // one write on load: the canonical address (replaceState, so Back never lands on a form that bounces) and the id;
  // it also drops a restore's one-time `restored`
  replaceEntry(state, r.rewrite ? r.href : undefined)
  if (state.scrollY !== undefined) scrollMemory.set(state.id, state.scrollY)
  enter(r.route, r.href, state, { cause: "load", rewritten: r.rewrite, notFound: r.notFound, scrollTo: state.scrollY ?? 0 }, true)
  try {
    window.addEventListener("popstate", onTraverse)
    window.addEventListener("hashchange", onTraverse)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pagehide", writeNow)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("click", onClickCapture, true)
  } catch {
    /* no events: the router still routes */
  }
}

/** The current route, entry and last change. Starts the router on first use. Stable between changes. */
export function getRoute(): RouteSnapshot {
  startRouter()
  return snap
}

/** Calls `fn` after every change of page. Returns the unsubscribe function. */
export function subscribeRoute(fn: () => void): () => void {
  startRouter()
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
  }
}

/** The one hook: re-renders on every change of page (never on scrolling or patches). */
export function useRoute(): RouteSnapshot {
  return useSyncExternalStore(subscribeRoute, getRoute, getRoute)
}

/** A copy of the current entry's live state (patches and the last written scroll position included). */
export function readEntry(): EntryState {
  startRouter()
  return { ...cur.state, ...(cur.state.courseTab ? { courseTab: { ...cur.state.courseTab } } : {}) }
}

/**
 * Navigate: pushes exactly one history entry for a change of page, with `state` written into it. The entry always
 * carries the in-page state it opens on: the tab, topic or list `state` names (a link that names its target wins),
 * else the course's remembered one, else Overview, Topic 01 or All. Before the push the page being left records its
 * scroll position and the `data-focus-key` of the control that left it. A target that is the current page scrolls to
 * the top and pushes nothing (`state` is then ignored). Old or non-canonical hrefs are resolved first, so
 * `navigate("#courses/d281")` pushes `#learn/d281`. Never throws.
 */
export const navigate: Navigate = (href, state, options = {}) => {
  startRouter()
  const r = resolveHash(href, state ?? null)
  if (!live) return "same"
  if (r.href === cur.href && r.notFound === null) {
    scrollToY(0)
    return "same"
  }
  cancelWrites()
  const y = scrollYNow()
  scrollMemory.set(cur.state.id, y)
  cur.state.scrollY = y
  const key = options.focusKey !== undefined ? options.focusKey : focusKeyNow()
  if (key) cur.state.focusKey = key
  else delete cur.state.focusKey
  replaceEntry(cur.state)

  const fields = withInitial(r.route, fitPatch(mergePatches(r.courseTab ? { courseTab: r.courseTab } : null, state), r.route))
  const next: EntryState = { id: newId(), ...fields }
  // a newer push supersedes a fallback whose hashchange has not come
  fallback = null
  let pushed = false
  try {
    history.pushState(next, "", r.href)
    lastWrite = now()
    pushed = true
  } catch {
    /* below */
  }
  enter(r.route, r.href, next, { cause: "push", rewritten: false, notFound: r.notFound, scrollTo: 0 })
  if (!pushed && readHash() !== r.href) {
    // WebKit's rate limit, or a blocked history: the hash still moves, so the address and Back stay right. The new
    // entry is already current, so the traversal this causes only adopts it (onTraverse). In this mode the entry may
    // keep no state: Back and Forward to it later open it fresh, at the top, with its default tab, topic or list.
    fallback = { hash: r.href, wrote: false }
    try {
      location.hash = r.href
    } catch {
      fallback = null
    }
  }
  return "pushed"
}

/**
 * Writes in-page state (a guide Learn's tab, C952 Learn's topic, a Practice page's mode and lists, the Courses
 * page's list) into the current entry
 * with replaceState, so reload and Back keep it, and into the per-visit memory. Fields that do not fit the current
 * route are dropped. Writes at most once per PATCH_WRITE_GAP, so calling it on every change is safe; it never needs
 * to run once per frame. A write the gap still holds back when Back or Forward leaves the entry is kept in memory and
 * lands when the entry is entered again during this page load. Never throws.
 */
export function patchEntry(patch: EntryPatch): void {
  startRouter()
  if (!live) return
  const p = fitPatch(patch, cur.route)
  let changed = false
  if (p.courseTab && p.courseTab.tab !== cur.state.courseTab?.tab) {
    cur.state.courseTab = p.courseTab
    changed = true
  }
  if (p.learnTopic && p.learnTopic !== cur.state.learnTopic) {
    cur.state.learnTopic = p.learnTopic
    changed = true
  }
  if (p.practiceFilter && p.practiceFilter !== cur.state.practiceFilter) {
    cur.state.practiceFilter = p.practiceFilter
    changed = true
  }
  if (p.practiceMode && p.practiceMode !== cur.state.practiceMode) {
    cur.state.practiceMode = p.practiceMode
    changed = true
  }
  if (p.cardFilter && p.cardFilter !== cur.state.cardFilter) {
    cur.state.cardFilter = p.cardFilter
    changed = true
  }
  if (p.coursesFilter && p.coursesFilter !== cur.state.coursesFilter) {
    cur.state.coursesFilter = p.coursesFilter
    changed = true
  }
  if (!changed) return
  remember(cur.route, cur.state)
  if (patchTimer !== undefined) return
  const wait = lastWrite + PATCH_WRITE_GAP - now()
  if (wait <= 0) {
    replaceEntry(cur.state)
    return
  }
  const id = cur.state.id
  patchTimer = setTimeout(() => {
    patchTimer = undefined
    if (cur.state.id === id) replaceEntry(cur.state)
  }, wait)
}

/**
 * Marks the current entry so the load after `location.reload()` knows a backup was just restored (decision 59), with
 * the scroll position, so the page reopens where the student was. Call it right before the reload. The mark rides on
 * the entry's live state, so the pagehide write keeps it. Never throws.
 */
export function noteRestoreForReload(): void {
  startRouter()
  if (!live) return
  cancelWrites()
  cur.state.restored = true
  cur.state.scrollY = scrollYNow()
  replaceEntry(cur.state)
}

/** True for the whole page load that follows a backup restore (noteRestoreForReload); false otherwise. */
export function restoredThisLoad(): boolean {
  startRouter()
  return restoredOnLoad
}

/** Scrolls to the last change's position again (the router already does it one frame after each change). */
export function restoreScroll(s: RouteSnapshot = getRoute()): void {
  if (live && cur.state.id === s.entry.id) scrollToY(s.change.scrollTo)
}

/** Focuses the page's h1 (inside `#app`) without scrolling; gives it tabindex -1 when it has none. */
export function focusH1(): boolean {
  try {
    const h1 = document.querySelector<HTMLElement>(`${MAIN_SELECTOR} h1`)
    if (!h1) return false
    if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1")
    h1.focus({ preventScroll: true })
    return document.activeElement === h1
  } catch {
    return false
  }
}

function inView(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
}

/**
 * Focuses the control with this data-focus-key when it is in view: the keyed element itself, or, for a wrapper
 * (a component that gives no access to its control, such as EmptyState's action), the first focusable inside it.
 */
function focusControl(key: string): boolean {
  try {
    const el = [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find((x) => x.dataset.focusKey === key)
    if (!el) return false
    const target =
      el.matches("a[href], button, input, select, textarea, [tabindex]")
        ? el
        : el.querySelector<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")
    if (!target || !inView(target)) return false
    target.focus({ preventScroll: true })
    return document.activeElement === target
  } catch {
    return false
  }
}

/**
 * Decision 33's focus after a change of page, FOCUS_DELAY ms after it: a push focuses the new h1; Back and Forward
 * focus the entry's focusKey control when it is in view, else the h1; the load moves no focus (a rewrite included).
 * Call it from App's effect on `change.seq`; it returns the cancel function for the effect's cleanup.
 */
export function focusAfterChange(s: RouteSnapshot = getRoute()): () => void {
  if (!live || s.change.cause === "load") return () => {}
  const t = setTimeout(() => {
    if (s.change.cause === "pop" && s.entry.focusKey && focusControl(s.entry.focusKey)) return
    focusH1()
  }, FOCUS_DELAY)
  return () => clearTimeout(t)
}

/* ── Reading entry state in a view ───────────────────────────────────────── */

/*
 * Every entry the router pushes or enters carries the field its route uses (withInitial), so these return the entry's
 * own value: what the page first showed, on Back, Forward and reload too. The memory and default after it only serve
 * an entry the router has not entered (a test harness, a view rendered outside App) or a tab that is not `available`.
 */

/** C952 Learn's topic: the entry's, else the one remembered this visit, else Topic 01. */
export function initialLearnTopic(entry: Readonly<EntryState>): TopicId {
  return entry.learnTopic ?? rememberedTopic() ?? FIRST_TOPIC
}

/** A guide Learn's tab: the entry's, else remembered, else Overview; always one of `available` (the tabs with data). */
export function initialLearnTab(
  slug: string,
  entry: Readonly<EntryState>,
  available: readonly LearnTab[] = LEARN_TABS,
): LearnTab {
  const wants = [entry.courseTab?.slug === slug ? entry.courseTab.tab : null, rememberedTab(slug), "overview" as const]
  for (const w of wants) if (w && available.includes(w)) return w
  return available[0] ?? "overview"
}

/** A guide Practice's list of questions: the entry's, else remembered, else All. */
export function initialPracticeFilter(slug: string, entry: Readonly<EntryState>): PracticeFilter {
  return entry.practiceFilter ?? rememberedList(slug) ?? "all"
}

/**
 * Practice's mode, a guide's or C952's (its Practice Exam start screen): the entry's, else remembered, else Questions;
 * always one the course has data for.
 */
export function initialPracticeMode(slug: string, entry: Readonly<EntryState>): PracticeMode {
  return practiceModeFor(slug, entry)
}

/** What `#exam/c952` opens an entry on (examEntryOpens). */
export interface ExamEntryOpening {
  /** The mode the entry opens on: Questions while an exam is shown, else the entry's (initialPracticeMode) */
  mode: PracticeMode
  /** A finished exam's Results give way to Flashcards: the page drops the exam, as Results' "Other modes" does */
  dropResults: boolean
}

/**
 * What `#exam/c952` shows when an entry opens there (decision 57), given App's exam. A running exam takes the page, on
 * Questions, whatever the entry names, so Quit comes back to the mode picker. A finished exam's Results show on an
 * entry that names Questions; an entry that names Flashcards (the Cheat Sheet's "Drill as flashcards", Back or Forward
 * to a Flashcards entry) drops the finished exam and opens Flashcards. With no exam, the entry's mode.
 */
export function examEntryOpens(exam: Pick<Exam, "done"> | null, entry: Readonly<EntryState>): ExamEntryOpening {
  const mode = initialPracticeMode(C952, entry)
  if (!exam) return { mode, dropResults: false }
  if (exam.done && mode === "cards") return { mode, dropResults: true }
  return { mode: "questions", dropResults: false }
}

/** Practice's list of flashcards, a guide's or C952's: the entry's, else remembered, else All. */
export function initialCardFilter(slug: string, entry: Readonly<EntryState>): CardFilter {
  return entry.cardFilter ?? rememberedCardList(slug) ?? "all"
}

/** The Courses page's list: the entry's, else remembered, else All. */
export function initialCoursesFilter(entry: Readonly<EntryState>): CoursesFilter {
  return entry.coursesFilter ?? rememberedCoursesFilter() ?? "all"
}

/* ── Links ───────────────────────────────────────────────────────────────── */

/** The parts of a click event the link helpers read (a React MouseEvent fits). */
export interface ClickLike {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
  preventDefault(): void
}

/** A plain left click with no modifier key that nothing has handled yet: the app routes it. */
export function isPlainClick(e: ClickLike): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

/**
 * onClick for an in-app `<a href>`: a plain click prevents the default and runs `fn` (a navigate call); a modified
 * click keeps the browser's own behavior (a new tab or window), so `href` must be the real route.
 * `<a href={href} data-focus-key="card:d281" onClick={onPlainClick(() => navigate(href))}>`
 */
export function onPlainClick(fn: () => void): (e: ClickLike) => void {
  return (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    fn()
  }
}
