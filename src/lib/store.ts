/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Saved progress: `c952-study-v1` (name unchanged; fields added since are missing from older saves: load fills in
 * `courses` and `completed`, and a course's `cards`, `examDate` and `best` and an attempt's `course` stay optional;
 * decision 60 files every course's exam attempts in the one `history`), the practice meaning of decision 7,
 * the helpers of CHANGES.md step 3 and the plan counts Home needs, completed courses (decision 56), flashcard marks
 * (decision 57), exam dates and their local-day helpers (decision 58), the save suspension a restore sets and the
 * checks shared with src/lib/backup.ts (decision 59), and the one-time fixes and C952 bank switch of decision 8, which
 * run synchronously at module init, before useStore's state initializer and App's useState(loadExam) first read
 * storage. Every save checks the bank again, and none writes while a restore has saving suspended. Every storage
 * access sits in try/catch: blocked storage or corrupt JSON never throws out of here.
 */
import { useCallback, useState } from "react"
import { BANK, QUESTIONS, QUESTION_BY_N, type TopicId } from "@/data"
import { dropExamFromOtherBank, PRIVATE_BANK, readBankTag } from "@/lib/exam-session"

/** Same key as the original Study Buddy, with fields only added since, so saved progress carries over. */
const KEY = "c952-study-v1"

/** localStorage: the progress record (this module's `Store`). */
export const STORE_KEY = KEY
/** localStorage: a JSON array of the migration ids already applied. */
export const MIGRATIONS_KEY = "wgu-study-buddy-migrations-v1"
/** localStorage: the C952 bank the marks in `c952-study-v1` belong to; absent means "private". */
export const C952_BANK_KEY = "wgu-study-buddy-c952-bank-v1"
/** localStorage: `{ [bank]: { mastered, miss } }`, the C952 marks of each bank not in use. */
export const C952_STASH_KEY = "wgu-study-buddy-c952-stash-v1"

/** The public bank of 60 original C952 questions: the first move to it, with marks, shows "New C952 questions". */
export const ORIGINAL_BANK = "original-1"

/** One submitted practice exam in the logbook (`history`). */
export interface Attempt {
  /**
   * The exam's course ("c952", "d281"); absent in attempts saved before decision 60, which are all C952's. New attempts
   * always write it. Read it with attemptCourse or attemptsOf (src/lib/exam.ts).
   */
  course?: string
  mode: string
  score: number
  total: number
  date: number
  time: string
}

/** Per-course study-guide progress, keyed by lower-case course code. */
export interface CourseProgress {
  /** study-plan day index → done */
  plan: Record<number, boolean>
  /**
   * practice question index (0-based, in the guide's `practice`) → `true` got it, `false` missed; absent = not tried
   * (decision 7). Use markPractice and clearMisses to write it, practiceCounts to count it.
   */
  practice: Record<number, boolean>
  /**
   * flashcard index (0-based, in the guide's `keyFacts`; for `c952`, in its deck, C952_CARDS in src/data/index.ts) →
   * `true` knew it, `false` study again; absent = new (decision 57). Never stored in `practice`: the indexes would
   * collide. C952's live here, never in `mastered` or `miss`, so the bank switch leaves them alone. Use markCard to
   * write it, cardCounts to count.
   */
  cards?: Record<number, boolean>
  /** the student's planned exam date, "YYYY-MM-DD" read as a local date (decision 58). Use setExamDate and examDateOf. */
  examDate?: string
  /**
   * a guide's best Full exam score, 0 to 100 (decision 60); C952 keeps its own in `best`. Written by recordExam and read
   * by bestOf (src/lib/exam.ts).
   */
  best?: number
}

export interface Store {
  mastered: Record<number, boolean>
  miss: Record<number, number>
  plan: Record<number, boolean>
  /** every course's practice exams, oldest first; each names its course (one with none is C952's, decision 60) */
  history: Attempt[]
  /** C952's best Full exam score; a guide's is `courses[slug].best` */
  best: number | null
  /** added in v2; absent in progress saved by the original app */
  courses: Record<string, CourseProgress>
  /**
   * completed courses: slug → when the student marked it (ms since 1970); absent = not completed (decision 56). Use
   * setCompleted to write it and isCompletedIn to read it. Added in v3; absent in older saves.
   */
  completed: Record<string, number>
}

const EMPTY: Store = { mastered: {}, miss: {}, plan: {}, history: [], best: null, courses: {}, completed: {} }

/** The part of Web Storage this app uses: localStorage, sessionStorage or a test double. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v)

function storageOf(name: "localStorage" | "sessionStorage"): StorageLike | null {
  try {
    const s = (globalThis as Record<string, unknown>)[name] as StorageLike | undefined
    return s ?? null
  } catch {
    return null
  }
}

/** setItem that reports success instead of throwing. */
function write(storage: StorageLike, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** Get (creating if needed) a course's progress inside an update() draft. */
export function courseDraft(d: Store, slug: string): CourseProgress {
  d.courses ??= {}
  d.courses[slug] ??= { plan: {}, practice: {} }
  d.courses[slug].plan ??= {}
  d.courses[slug].practice ??= {}
  return d.courses[slug]
}

/** A saved record in the Store shape: missing or mistyped top-level fields fall back to empty ones. */
function coerceStore(saved: unknown): Store {
  const s = isRecord(saved) ? saved : {}
  return {
    ...structuredClone(EMPTY),
    ...s,
    mastered: isRecord(s.mastered) ? (s.mastered as Store["mastered"]) : {},
    miss: isRecord(s.miss) ? (s.miss as Store["miss"]) : {},
    plan: isRecord(s.plan) ? (s.plan as Store["plan"]) : {},
    history: Array.isArray(s.history) ? (s.history as Attempt[]) : [],
    best: typeof s.best === "number" && Number.isFinite(s.best) ? s.best : null,
    courses: isRecord(s.courses) ? (s.courses as Store["courses"]) : {},
    completed: isRecord(s.completed) ? (s.completed as Store["completed"]) : {},
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return coerceStore(JSON.parse(raw))
  } catch {
    /* private mode, blocked storage or corrupt JSON: start fresh */
  }
  return structuredClone(EMPTY)
}

/** Asked once per visit, after the first progress write (decision 8): Safari may clear script storage otherwise. */
let persistAsked = false

/**
 * Set while a backup is being restored (src/lib/backup.ts, decision 59): from then until the page reloads, nothing in
 * this tab writes progress or the active course, so a late save can't overwrite what the restore wrote.
 */
let savingSuspended = false

/** Stops every progress and active-course write for the rest of this page load (a restore, just before it writes). */
export function suspendSaving(): void {
  savingSuspended = true
}

/** Lets saves through again: only for a restore that failed and rolled every key back (nothing reloads then). */
export function resumeSaving(): void {
  savingSuspended = false
}

/** True after suspendSaving: src/lib/course.ts saveCourse checks it too. */
export function isSavingSuspended(): boolean {
  return savingSuspended
}

function askPersist() {
  if (persistAsked) return
  persistAsked = true
  try {
    const storage = typeof navigator === "undefined" ? undefined : navigator.storage
    void storage?.persist?.().catch(() => {})
  } catch {
    /* no Storage API: nothing to ask */
  }
}

/**
 * Writes the progress record. A tab still open on an older copy of the app, with another bank, may have switched the
 * marks since this tab loaded (decision 8) while this tab's state still holds its own bank's: the switch runs again
 * first (the record's marks join the stash under the bank its tag names, then this bank's tag), so a save never files
 * one bank's marks under the other's tag. The rest of the record is this tab's, as before: the last write wins.
 */
function save(s: Store) {
  if (savingSuspended) return
  const local = storageOf("localStorage")
  if (!local) return
  const move = moveBank(local, BANK, () => s)
  if (move.status === "failed") return
  if (move.status === "same" && !write(local, KEY, JSON.stringify(s))) return
  askPersist()
}

export type Update = (fn: (draft: Store) => Store | void) => void

export function useStore(): [Store, Update] {
  const [store, setStore] = useState<Store>(load)
  const update = useCallback<Update>((fn) => {
    setStore((prev) => {
      const draft: Store = JSON.parse(JSON.stringify(prev))
      const next = fn(draft) ?? draft
      save(next)
      return next
    })
  }, [])
  return [store, update]
}

export function topicProgress(topic: TopicId, store: Store) {
  const qs = QUESTIONS.filter((q) => q.t === topic)
  return { total: qs.length, mastered: qs.filter((q) => store.mastered[q.n]).length }
}

export function masteredCount(store: Store) {
  // only count real question numbers (saved data from an older version could contain unknown ones)
  return Object.entries(store.mastered).filter(([n, v]) => v && QUESTION_BY_N[+n]).length
}

/** C952's My Misses count, as today: the question numbers in `store.miss` that exist in this build's bank. */
export function c952MissCount(store: Store) {
  return Object.keys(store.miss).filter((n) => QUESTION_BY_N[+n]).length
}

/* ── Guide practice (decisions 7, 23 to 25) ──────────────────────────────── */

export interface PracticeCounts {
  /** N: the guide's practice questions */
  total: number
  /** `true` entries ("Got it") */
  got: number
  /** `false` entries ("Missed"): My Misses, the Missed list, "{m} to review" */
  missed: number
  /** N − got − missed: the "New {k}" list */
  untried: number
}

/**
 * Decision 25's counts for one guide course. `guide` names the course and its practice count; a CourseInfo from
 * src/lib/course.ts fits as it is. Only marks with an index below N count, so a got or missed mark always points at
 * a question the guide has.
 */
export function practiceCounts(guide: { slug: string; practiceTotal: number }, store: Store): PracticeCounts {
  const total = Number.isFinite(guide.practiceTotal) ? Math.max(0, Math.floor(guide.practiceTotal)) : 0
  const marks = store.courses?.[guide.slug]?.practice
  let got = 0
  let missed = 0
  if (isRecord(marks)) {
    for (const [k, v] of Object.entries(marks)) {
      const i = Number(k)
      if (!Number.isInteger(i) || i < 0 || i >= total) continue
      if (v === true) got++
      else if (v === false) missed++
    }
  }
  return { total, got, missed, untried: total - got - missed }
}

/**
 * Records a practice answer inside an update() draft: `true` got it (a right pick, "I got it"), `false` missed (a
 * wrong pick, "I missed it"). A newer answer replaces an older one. `update((d) => markPractice(d, slug, i, true))`
 */
export function markPractice(d: Store, slug: string, index: number, got: boolean): void {
  if (!Number.isInteger(index) || index < 0) return
  courseDraft(d, slug).practice[index] = got
}

/** "Clear it" on a guide's My Misses, inside an update() draft: deletes every `false` of that course; got-it marks stay. */
export function clearMisses(d: Store, slug: string): void {
  const practice = d.courses?.[slug]?.practice
  if (!isRecord(practice)) return
  for (const [k, v] of Object.entries(practice)) if (v === false) delete practice[k as unknown as number]
}

/* ── Guide study plans (decision 31; Home, Next up per course) ───────────── */

export interface PlanCounts {
  /** The guide's plan days */
  total: number
  /** Days marked done ("{done}/{days}"), counting only indexes below total */
  done: number
  /** The first day not done, as an index into planDays(slug) (src/lib/course.ts); null when all are done or there are none */
  next: number | null
}

/**
 * One guide's study plan progress: `courses[slug].plan[i] === true` marks day i done (the Study plan's Done boxes).
 * `guide` names the course and its day count; a CourseInfo from src/lib/course.ts fits as it is.
 */
export function planCounts(guide: { slug: string; planTotal: number }, store: Store): PlanCounts {
  const total = Number.isFinite(guide.planTotal) ? Math.max(0, Math.floor(guide.planTotal)) : 0
  const marks = store.courses?.[guide.slug]?.plan
  let done = 0
  let next: number | null = null
  for (let i = 0; i < total; i++) {
    if (isRecord(marks) && marks[i] === true) done++
    else if (next === null) next = i
  }
  return { total, done, next }
}

/* ── Completed courses (decision 56) ─────────────────────────────────────── */

/**
 * Marks a course completed or not, inside an update() draft. Take the time outside the updater (StrictMode runs
 * updaters twice): `const at = Date.now(); update((d) => setCompleted(d, slug, true, at))`.
 */
export function setCompleted(d: Store, slug: string, done: boolean, at: number): void {
  if (!isRecord(d.completed)) d.completed = {}
  if (done) d.completed[slug] = Number.isFinite(at) ? at : 0
  else delete d.completed[slug]
}

/** True when the student marked the course completed. Reads defensively: the record is not validated on load. */
export function isCompletedIn(store: Store, slug: string): boolean {
  const all = store.completed
  if (!isRecord(all) || !Object.hasOwn(all, slug)) return false
  const at = all[slug]
  return typeof at === "number" && Number.isFinite(at)
}

/* ── Flashcards (decision 57) ────────────────────────────────────────────── */

export interface CardCounts {
  /** the deck's flashcards: a guide's keyFacts, or C952's C952_CARDS */
  total: number
  /** `true` entries ("Knew it") */
  knew: number
  /** `false` entries ("Study again"): the Study again list */
  again: number
  /** total − knew − again: the "New" list */
  unseen: number
}

/**
 * A course's flashcard counts, a guide's or C952's; a CourseInfo from src/lib/course.ts fits as `guide`. Only marks
 * below the total count.
 */
export function cardCounts(guide: { slug: string; cardTotal: number }, store: Store): CardCounts {
  const total = Number.isFinite(guide.cardTotal) ? Math.max(0, Math.floor(guide.cardTotal)) : 0
  const marks = store.courses?.[guide.slug]?.cards
  let knew = 0
  let again = 0
  if (isRecord(marks)) {
    for (const [k, v] of Object.entries(marks)) {
      const i = Number(k)
      if (!Number.isInteger(i) || i < 0 || i >= total) continue
      if (v === true) knew++
      else if (v === false) again++
    }
  }
  return { total, knew, again, unseen: total - knew - again }
}

/** A flashcard's mark: true knew it, false study again, null new. */
export function cardMark(store: Store, slug: string, index: number): boolean | null {
  const marks = store.courses?.[slug]?.cards
  if (!isRecord(marks)) return null
  const v = marks[index]
  return v === true || v === false ? v : null
}

/** Records a flashcard inside an update() draft: `true` knew it, `false` study again. A newer mark replaces an older one. */
export function markCard(d: Store, slug: string, index: number, knew: boolean): void {
  if (!Number.isInteger(index) || index < 0) return
  const course = courseDraft(d, slug)
  if (!isRecord(course.cards)) course.cards = {}
  course.cards[index] = knew
}

/** Forgets every flashcard mark of the course, inside an update() draft (no control calls it yet: Start over keeps marks). */
export function clearCards(d: Store, slug: string): void {
  const course = d.courses?.[slug]
  if (isRecord(course)) delete course.cards
}

/* ── Exam dates (decision 58) ────────────────────────────────────────────── */

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * "YYYY-MM-DD" as a local date at midnight, or null when it isn't a real calendar day. Never `new Date("YYYY-MM-DD")`:
 * that reads as UTC midnight, which is the evening before in US time zones.
 */
export function parseLocalDay(value: unknown): Date | null {
  if (typeof value !== "string") return null
  const m = ISO_DAY.exec(value)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d)
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null
}

/** A local date as "YYYY-MM-DD" (an `<input type="date">` value). */
export function localDayString(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** Whole days from `today`'s date to the day: 0 on the day, negative after it. Counted between local midnights, so DST can't shift it. */
export function daysUntil(day: Date, today: Date = new Date()): number {
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const b = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
  return Math.round((b - a) / 86_400_000)
}

/** The course's exam date ("YYYY-MM-DD"), or null when none is set or the saved one isn't a real day. */
export function examDateOf(store: Store, slug: string): string | null {
  const v = store.courses?.[slug]?.examDate
  return parseLocalDay(v) ? (v as string) : null
}

/** Sets (or, with null or an invalid day, clears) the course's exam date inside an update() draft. */
export function setExamDate(d: Store, slug: string, day: string | null): void {
  const course = courseDraft(d, slug)
  if (day !== null && parseLocalDay(day)) course.examDate = day
  else delete course.examDate
}

/* ── For src/lib/backup.ts (decision 59) ─────────────────────────────────── */

export { isRecord as isPlainRecord, marksOf as cleanMarks, readStash as cleanStash, BANK_ID as BANK_ID_PATTERN }

/* ── One-time fixes and the C952 bank switch (decision 8) ────────────────── */

/** Every one-time fix, in the order they run. Each id is recorded only after its write succeeds. */
export const MIGRATION_IDS = ["practice-false-v1"] as const

/**
 * The ids a present but unreadable migrations record stands for. The record is only ever written after a fix
 * succeeded, and practice-false-v1 is the first id, so it was applied: running it again would delete real misses.
 */
const RECORDED_BEFORE_DAMAGE: readonly string[] = ["practice-false-v1"]

export interface MigrationEnv {
  /** localStorage; null when it is blocked */
  local: StorageLike | null
  /** sessionStorage; null when it is blocked */
  session: StorageLike | null
  /** This build's C952 bank (BANK from src/data/index.ts) */
  bank: string
}

export interface MigrationReport {
  /** The migration ids this run applied and recorded */
  applied: string[]
  /** The bank the C952 marks moved away from, when the bank switch ran; else null */
  switchedFrom: string | null
  /** True only on the first move from "private", with marks, to "original-1" */
  newQuestionsNotice: boolean
  /** True when c952-exam-session-v1 was dropped because its bank differs from this build's */
  examDropped: boolean
}

/** The applied ids, or null when the record cannot be read (blocked storage: run nothing). */
function readApplied(local: StorageLike): Set<string> | null {
  let raw: string | null
  try {
    raw = local.getItem(MIGRATIONS_KEY)
  } catch {
    return null
  }
  if (raw === null) return new Set()
  try {
    const v: unknown = JSON.parse(raw)
    if (Array.isArray(v)) return new Set(v.filter((x): x is string => typeof x === "string"))
  } catch {
    /* corrupt: below */
  }
  const ids = new Set(RECORDED_BEFORE_DAMAGE)
  write(local, MIGRATIONS_KEY, JSON.stringify([...ids])) // best effort: a clean record next time
  return ids
}

/** practice-false-v1: deletes every `false` in courses[*].practice (the old Checkbox wrote it for an untick). */
function practiceFalseV1(local: StorageLike): boolean {
  let raw: string | null
  try {
    raw = local.getItem(KEY)
  } catch {
    return false
  }
  if (raw === null) return true // nothing saved yet: nothing to clean
  let saved: unknown
  try {
    saved = JSON.parse(raw)
  } catch {
    return true // unreadable: load() starts fresh, so no old untick can show as a miss
  }
  const courses = isRecord(saved) ? saved.courses : undefined
  if (!isRecord(courses)) return true
  let changed = false
  for (const c of Object.values(courses)) {
    if (!isRecord(c) || !isRecord(c.practice)) continue
    const practice = c.practice
    for (const [k, v] of Object.entries(practice)) {
      if (v === false) {
        delete practice[k]
        changed = true
      }
    }
  }
  return changed ? write(local, KEY, JSON.stringify(saved)) : true
}

const MIGRATIONS: Record<(typeof MIGRATION_IDS)[number], (local: StorageLike) => boolean> = {
  "practice-false-v1": practiceFalseV1,
}

function applyMigrations(local: StorageLike, report: MigrationReport) {
  const done = readApplied(local)
  if (!done) return
  for (const id of MIGRATION_IDS) {
    if (done.has(id)) continue
    if (!MIGRATIONS[id](local)) return // not done: it runs again next load, and later fixes wait for it
    done.add(id)
    if (!write(local, MIGRATIONS_KEY, JSON.stringify([...done]))) return
    report.applied.push(id)
  }
}

type Marks = { mastered: Record<number, boolean>; miss: Record<number, number> }

/** A bank's C952 marks, keeping only well-typed entries. */
function marksOf(v: unknown): Marks {
  const r = isRecord(v) ? v : {}
  const mastered: Record<number, boolean> = {}
  const miss: Record<number, number> = {}
  if (isRecord(r.mastered))
    for (const [k, x] of Object.entries(r.mastered)) if (typeof x === "boolean") mastered[k as unknown as number] = x
  if (isRecord(r.miss))
    for (const [k, x] of Object.entries(r.miss))
      if (typeof x === "number" && Number.isFinite(x)) miss[k as unknown as number] = x
  return { mastered, miss }
}

const hasMarks = (m: Marks) => Object.values(m.mastered).some((v) => v === true) || Object.values(m.miss).some((v) => v > 0)

const BANK_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/i

/** The stash, keeping only entries under bank-like ids; corrupt JSON reads as an empty stash. */
function readStash(raw: string | null): Record<string, Marks> {
  if (raw === null) return {}
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!isRecord(v)) return {}
  return Object.fromEntries(Object.entries(v).flatMap(([bank, m]) => (BANK_ID.test(bank) ? [[bank, marksOf(m)]] : [])))
}

/** What moveBank did: nothing to move, the move (with the bank left), or a read or write that failed with no mark lost. */
type BankMove = { status: "same" } | { status: "moved"; from: string; firstMove: boolean } | { status: "failed" }

/**
 * The C952 bank switch's one move (decision 8): when the tag says another bank, the marks in the record (`mastered`,
 * `miss`) join the stash under that bank, `bank` becomes the tag, `recordFor(record, restored)` is written as the
 * record (`restored`: this bank's stashed marks, or none, since question numbers point at different questions in each
 * bank), and `bank` leaves the stash. Ordered so that a failed write never loses marks: stash, tag, record (the tag
 * rolled back if the record fails), then the stash drop (best effort).
 */
function moveBank(
  local: StorageLike,
  bank: string,
  recordFor: (record: Record<string, unknown>, restored: Marks) => unknown,
): BankMove {
  let tag: string | null
  let raw: string | null
  let stashRaw: string | null
  try {
    tag = local.getItem(C952_BANK_KEY)
    if (readBankTag(tag, bank) === bank) return { status: "same" }
    raw = local.getItem(KEY)
    stashRaw = local.getItem(C952_STASH_KEY)
  } catch {
    return { status: "failed" }
  }
  const saved = readBankTag(tag, bank)
  let record: Record<string, unknown> = {}
  if (raw !== null) {
    try {
      const v: unknown = JSON.parse(raw)
      if (isRecord(v)) record = v
    } catch {
      /* corrupt: as an empty record, as load() reads it */
    }
  }
  const current = marksOf(record)
  const stash = readStash(stashRaw)
  const firstMove =
    saved === PRIVATE_BANK && bank === ORIGINAL_BANK && hasMarks(current) && !Object.hasOwn(stash, ORIGINAL_BANK)

  // 1. the marks in use join the stash (this bank's entry stays until the record holds it)
  const stashed: Record<string, Marks> = { ...stash, [saved]: current }
  if (!write(local, C952_STASH_KEY, JSON.stringify(stashed))) return { status: "failed" }
  // 2. the bank, before the record: a tag that says the old bank over new marks would stash them under it next time
  if (!write(local, C952_BANK_KEY, bank)) return { status: "failed" }
  // 3. the record with this bank's marks
  const restored = Object.hasOwn(stashed, bank) ? stashed[bank] : { mastered: {}, miss: {} }
  if (!write(local, KEY, JSON.stringify(recordFor(record, restored)))) {
    // roll the tag back so the next try starts over; both banks' marks are in the stash meanwhile
    if (saved === PRIVATE_BANK) {
      try {
        local.removeItem(C952_BANK_KEY)
      } catch {
        /* blocked */
      }
    } else write(local, C952_BANK_KEY, saved)
    return { status: "failed" }
  }
  // 4. the bank in use leaves the stash (best effort: a leftover copy is overwritten when this bank is left)
  const rest = Object.fromEntries(Object.entries(stashed).filter(([b]) => b !== bank))
  write(local, C952_STASH_KEY, JSON.stringify(rest))
  return { status: "moved", from: saved, firstMove }
}

/**
 * The C952 bank switch, on every load: when the marks belong to another bank, stash them under it, restore this
 * bank's (or none) and save the bank. `history`, `best`, `plan` and `courses` stay shared: C952's flashcard marks
 * (`courses.c952.cards`) belong to its Cheat Sheet's deck, not to a question bank, so they never move, and neither do
 * a guide's exam attempts in `history` or its `courses[slug].best` (decision 60). Every save
 * repeats the check (save above), for a tab of an older copy, with another bank, that loaded meanwhile.
 */
function switchBank(local: StorageLike, bank: string, report: MigrationReport) {
  const move = moveBank(local, bank, (record, restored) => ({ ...record, mastered: restored.mastered, miss: restored.miss }))
  if (move.status !== "moved") return
  report.switchedFrom = move.from
  report.newQuestionsNotice = move.firstMove
}

/**
 * Runs the one-time fixes, the C952 bank switch and the exam-session drop rule, in that order. Called once, below, at
 * module init; `env` exists for tests. Never throws.
 */
export function runMigrations(env: Partial<MigrationEnv> = {}): MigrationReport {
  const local = env.local !== undefined ? env.local : storageOf("localStorage")
  const session = env.session !== undefined ? env.session : storageOf("sessionStorage")
  const bank = env.bank ?? BANK
  const report: MigrationReport = { applied: [], switchedFrom: null, newQuestionsNotice: false, examDropped: false }
  if (local) {
    try {
      applyMigrations(local, report)
    } catch {
      /* never throw out of module init */
    }
    try {
      switchBank(local, bank, report)
    } catch {
      /* never throw out of module init */
    }
  }
  try {
    report.examDropped = dropExamFromOtherBank(bank, session)
  } catch {
    /* never throw out of module init */
  }
  return report
}

/** This page load's migration run. */
export const MIGRATION_REPORT: Readonly<MigrationReport> = Object.freeze(runMigrations())

/**
 * Shows the "New C952 questions" Alert (Info, role="note") for the rest of this visit, on Home below the hero and at
 * the top of C952's Learn: true only on the first move from "private", with marks, to "original-1".
 */
export const NEW_C952_QUESTIONS: boolean = MIGRATION_REPORT.newQuestionsNotice
