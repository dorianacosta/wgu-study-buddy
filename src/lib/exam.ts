/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The practice exam engine for every course (decision 60): one bank per course (ExamBank), the exams built from it
 * (buildExam), the mode cards a bank can support (modeSpecs), and what submitting records (recordExam). C952's bank
 * (C952_BANK) is its 60 questions, with their topics and Remix twists, and builds exactly the exams it always did. A
 * guide's bank is its auto-gradable practice questions (guideBank in src/views/course/guide-exam.tsx, which needs the
 * loaded guide). Each course's attempts and best score are read here too (attemptsOf, bestOf).
 *
 * Import order: this module may import course.ts and store.ts, since nothing in the store → exam-session init chain
 * imports it (exam-session.ts takes only its types).
 */
import { QUESTIONS, QUESTION_BY_N, TOPICS, correctOf } from "@/data"
import { C952, courseInfo } from "@/lib/course"
import { courseDraft, markPractice, type Attempt, type Store } from "@/lib/store"

export type ExamMode = "full" | "quick" | "topic" | "miss" | "remix"

/** A Remix twist with a definite answer: the twisted question, the option that becomes right, and why. */
export interface BankFlip {
  q: string
  a: number
  why: string
}

/** One question of a course's bank, as the exam builder reads it. */
export interface BankQuestion {
  /** C952: the question number; a guide: the 0-based index in its `practice` */
  n: number
  /** the stem (HTML): C952's own, or a guide's researched text (rendered through the sanitizer) */
  text: string
  /** C952: code shown under the stem */
  code?: string
  /** the answer choices in the bank's order (a guide's without their own letter prefix) */
  options: readonly string[]
  /** the indexes of the right options */
  correct: readonly number[]
  /** "Choose N": more than one option is right */
  multi: boolean
  /** C952: options in the code style */
  mono?: boolean
  /** the topic's id ("t1"); none for a guide today */
  topic?: string
  /** the Remix twists with a definite answer */
  flips?: readonly BankFlip[]
}

/** A course's question bank: what every exam mode draws from. */
export interface ExamBank {
  /** the course's slug: "c952", "d281" */
  course: string
  questions: readonly BankQuestion[]
  /** the topics a Topic drill can pick, in order; none for a guide today */
  topics: readonly { id: string; name: string }[]
  /** the `n` of the questions to review (My misses), in the order the exam draws them from before shuffling */
  missed(store: Store): number[]
}

export interface ExamItem {
  n: number
  remix: boolean
  text: string
  code?: string
  opts: { t: string; k: number }[]
  correct: number[]
  multi: boolean
  mono?: boolean
  fwhy: string | null
}

export interface Exam {
  /** the course whose bank the exam came from; a session saved before decision 60 has none and is C952's */
  course: string
  mode: ExamMode
  opt: { topic?: string }
  name: string
  items: ExamItem[]
  i: number
  ans: number[][]
  flags: Record<number, boolean>
  start: number
  done: boolean
  review: "wrong" | "all"
  score: number
  time: string
}

export const MODE_NAMES: Record<ExamMode, string> = {
  full: "Full exam",
  quick: "Quick 20",
  topic: "Topic drill",
  miss: "My misses",
  remix: "Remix exam",
}

/** An exam's name, and so its attempt's `mode`, is at most this long: a restore drops a longer one (backup.ts). */
export const EXAM_NAME_MAX = 80

/** A Quick 20 draws this many questions; its card shows only for a bank with more. */
export const QUICK_COUNT = 20
/** A Remix exam draws up to this many twists. */
export const REMIX_COUNT = 25

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ── C952's bank ─────────────────────────────────────────────────────────── */

/**
 * C952's 60 questions as a bank: n is the question number, topic its topic id, flips its "Flip it" twists that have
 * a definite answer, multi a "Choose N" question; My misses draws the question numbers in `store.miss` that this
 * build's bank has, in key order. It builds exactly the exams C952 always had.
 */
export const C952_BANK: ExamBank = Object.freeze({
  course: C952,
  questions: Object.freeze(
    QUESTIONS.map(
      (q): BankQuestion => ({
        n: q.n,
        text: q.q,
        code: q.code,
        options: q.o,
        correct: correctOf(q),
        multi: Array.isArray(q.a),
        mono: q.mono,
        topic: q.t,
        flips: (q.f || []).filter((f): f is BankFlip => f.a !== null),
      }),
    ),
  ),
  topics: Object.freeze(TOPICS.map((t) => ({ id: t.id, name: t.name }))),
  missed: (store: Store) =>
    Object.keys(store.miss ?? {})
      .map(Number)
      .filter((n) => !!QUESTION_BY_N[n]),
})

/* ── Building an exam ────────────────────────────────────────────────────── */

function toItem(q: BankQuestion, flip?: BankFlip): ExamItem {
  return {
    n: q.n,
    remix: !!flip,
    text: flip ? flip.q : q.text,
    code: q.code,
    opts: shuffle(q.options.map((t, k) => ({ t, k }))),
    correct: flip ? [flip.a] : [...q.correct],
    multi: !flip && q.multi,
    mono: q.mono,
    fwhy: flip ? flip.why : null,
  }
}

/** A name cut to EXAM_NAME_MAX characters ("…" last), so its attempt always survives a restore. */
function capName(name: string): string {
  return name.length > EXAM_NAME_MAX ? `${name.slice(0, EXAM_NAME_MAX - 1)}…` : name
}

/**
 * A new exam from a course's bank, every question's options shuffled: the Full exam (every question), Quick 20,
 * a Topic drill (`opt.topic`), My misses (`bank.missed`) or the Remix exam (up to 25 twists). `now` is its start time.
 * Shuffles, so never call it inside an update() or setState updater (StrictMode runs those twice).
 */
export function buildExam(
  bank: ExamBank,
  mode: ExamMode,
  opt: { topic?: string },
  store: Store,
  now: number = Date.now(),
): Exam {
  const qs = bank.questions
  let items: ExamItem[] = []
  if (mode === "full") items = shuffle(qs).map((q) => toItem(q))
  else if (mode === "quick") items = shuffle(qs).slice(0, QUICK_COUNT).map((q) => toItem(q))
  else if (mode === "topic") items = shuffle(qs.filter((q) => q.topic !== undefined && q.topic === opt.topic)).map((q) => toItem(q))
  else if (mode === "miss") {
    const byN = new Map(qs.map((q) => [q.n, q]))
    items = shuffle(
      bank
        .missed(store)
        .map((n) => byN.get(n))
        .filter((q): q is BankQuestion => !!q),
    ).map((q) => toItem(q))
  } else if (mode === "remix") {
    const pool: [BankQuestion, BankFlip][] = []
    qs.forEach((q) => (q.flips ?? []).forEach((f) => pool.push([q, f])))
    items = shuffle(pool)
      .slice(0, REMIX_COUNT)
      .map(([q, f]) => toItem(q, f))
  }
  const topic = mode === "topic" && opt.topic ? bank.topics.find((t) => t.id === opt.topic) : undefined
  return {
    course: bank.course,
    mode,
    opt,
    // same format as the original app, so carried-over history reads consistently
    name: capName(topic ? `Topic drill: ${topic.name}` : MODE_NAMES[mode]),
    items,
    i: 0,
    ans: items.map(() => []),
    flags: {},
    start: now,
    done: false,
    review: "wrong",
    score: 0,
    time: "",
  }
}

/* ── The mode cards a bank supports ──────────────────────────────────────── */

export interface ModeSpec {
  mode: ExamMode
  /** the questions the mode draws; 0 disables its card (My misses: "Get something wrong first") */
  count: number
}

/**
 * The mode cards a bank can support, in the start screen's order: the Full exam (any questions), the Remix exam (any
 * twists), Quick 20 (a bank of more than 20), My misses (always; disabled at 0) and the Topic drill (any topics),
 * counted for `topic`. C952 gets all five; a guide today gets the Full exam and My misses.
 */
export function modeSpecs(bank: ExamBank, store: Store, topic?: string): ModeSpec[] {
  const total = bank.questions.length
  const flips = bank.questions.reduce((n, q) => n + (q.flips?.length ?? 0), 0)
  const specs: ModeSpec[] = []
  if (total > 0) specs.push({ mode: "full", count: total })
  if (flips > 0) specs.push({ mode: "remix", count: Math.min(REMIX_COUNT, flips) })
  if (total > QUICK_COUNT) specs.push({ mode: "quick", count: QUICK_COUNT })
  const byN = new Set(bank.questions.map((q) => q.n))
  specs.push({ mode: "miss", count: bank.missed(store).filter((n) => byN.has(n)).length })
  if (bank.topics.length > 0)
    specs.push({ mode: "topic", count: bank.questions.filter((q) => q.topic !== undefined && q.topic === topic).length })
  return specs
}

/* ── Grading and recording ───────────────────────────────────────────────── */

export const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export const isRight = (exam: Exam, idx: number) => {
  const item = exam.items[idx]
  const a = exam.ans[idx]
  return a.length === item.correct.length && a.every((k) => item.correct.includes(k))
}

/** A best Full exam score (0 to 100): C952's in `store.best`, a guide's in `courses[slug].best`; only a better one replaces it. */
function setBest(d: Store, course: string, pct: number): void {
  if (!Number.isFinite(pct)) return
  if (course === C952) {
    if (d.best === null || pct > d.best) d.best = pct
    return
  }
  const c = courseDraft(d, course)
  if (typeof c.best !== "number" || !Number.isFinite(c.best) || pct > c.best) c.best = pct
}

/**
 * Records a submitted exam inside an update() draft; `right[i]` grades item i and `at` is when it was submitted,
 * taken outside the updater (StrictMode runs updaters twice). C952: a wrong or blank answer adds 1 to its miss count, a
 * right one clears it unless the item is a Remix twist. A guide: each item's practice mark (true right; false wrong or
 * blank, as the Submit dialog says), a newer answer replacing an older one, so My Misses and the Questions lists
 * follow. Then the attempt goes to the logbook with its course, and a Full exam may raise the course's best.
 */
export function recordExam(d: Store, exam: Exam, right: readonly boolean[], at: number): void {
  const score = right.filter(Boolean).length
  if (exam.course === C952) {
    exam.items.forEach((item, i) => {
      if (right[i]) {
        if (!item.remix) delete d.miss[item.n]
      } else {
        d.miss[item.n] = (d.miss[item.n] || 0) + 1
      }
    })
  } else {
    exam.items.forEach((item, i) => markPractice(d, exam.course, item.n, !!right[i]))
  }
  d.history.push({ course: exam.course, mode: exam.name, score, total: exam.items.length, date: at, time: exam.time })
  if (exam.mode === "full" && exam.items.length > 0) setBest(d, exam.course, Math.round((100 * score) / exam.items.length))
}

/* ── Reading a course's exams ────────────────────────────────────────────── */

/** The course an attempt belongs to: its own, or C952's for an attempt saved before decision 60 (no course). */
export function attemptCourse(a: unknown): string {
  const course = a !== null && typeof a === "object" ? (a as { course?: unknown }).course : undefined
  return typeof course === "string" && course ? course : C952
}

/** A course's exam attempts, oldest first: the logbook, Home's Last exam and "started" read only their own course's. */
export function attemptsOf(store: Store, slug: string): Attempt[] {
  const history = Array.isArray(store.history) ? store.history : []
  return history.filter((a) => a !== null && typeof a === "object" && attemptCourse(a) === slug)
}

/** A course's best Full exam score (0 to 100), or null before one: C952's `store.best`, a guide's `courses[slug].best`. */
export function bestOf(store: Store, slug: string): number | null {
  if (slug === C952) return typeof store.best === "number" && Number.isFinite(store.best) ? store.best : null
  const best = store.courses?.[slug]?.best
  return typeof best === "number" && Number.isFinite(best) && best >= 0 && best <= 100 ? best : null
}

/**
 * Whether a saved session's item can still be shown (loadExam in exam-session.ts takes this from App): C952's when
 * this build's bank has question n; a guide's when the course has a guide and n is one of its practice indexes.
 */
export function examItemKnown(course: string, n: number): boolean {
  if (course === C952) return !!QUESTION_BY_N[n]
  const info = courseInfo(course)
  return info?.kind === "guide" && Number.isInteger(n) && n >= 0 && n < info.practiceTotal
}
