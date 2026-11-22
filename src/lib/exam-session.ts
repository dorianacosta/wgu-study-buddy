/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The running exam, kept in sessionStorage too, so reloading the tab mid-exam doesn't lose it. One exam at a time for
 * the whole app (decision 60): a C952 exam or a guide course's, under the same key, with the same checks and the same
 * behavior as C952's always had. Every saved exam names its course (`course`); a session saved before decision 60 has
 * none and is C952's. Every saved session also writes the bank it was built from to `wgu-study-buddy-exam-bank-v1`
 * (absent means "private"; decisions 7 and 8), and clearing a session removes both keys. The bank switch in store.ts
 * drops a C952 session whose bank differs from this build's; a guide's session has no C952 bank, so it never drops one.
 *
 * Import order: store.ts runs dropExamFromOtherBank at module init, before src/lib/course.ts has finished loading, so
 * this module never imports course.ts (or exam.ts, which does): the course is read from the session's own JSON and
 * compared with the literal "c952", and App passes its item check (examItemKnown) into loadExam.
 */
import { BANK, QUESTION_BY_N } from "@/data"
import type { Exam } from "@/lib/exam"

/** sessionStorage: the running exam (unchanged name and shape, plus `course`). */
export const EXAM_KEY = "c952-exam-session-v1"

/** sessionStorage: the bank of the running exam in EXAM_KEY; absent means "private". */
export const EXAM_BANK_KEY = "wgu-study-buddy-exam-bank-v1"

/** The bank an absent or unreadable bank tag means: the only bank before this release. */
export const PRIVATE_BANK = "private"

/** C952's slug, as a literal: see the import note above. */
const C952_SLUG = "c952"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

/** Whether a saved item of `course`'s exam can still be shown (examItemKnown in src/lib/exam.ts). */
export type ExamItemCheck = (course: string, n: number) => boolean

/** Without App's check: C952's items alone, by this build's bank. */
const c952ItemKnown: ExamItemCheck = (course, n) => course === C952_SLUG && !!QUESTION_BY_N[n]

function sessionStore(): StorageLike | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage
  } catch {
    return null
  }
}

/** A saved bank id ("private", "original-1"). Ids look like this; anything else reads as absent. */
const BANK_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/i

/**
 * The bank a stored tag names: the value itself when it is this build's bank or looks like a bank id, else
 * "private" (absent, unreadable or garbage). Shared by the exam tag and store.ts's C952 marks tag.
 */
export function readBankTag(value: string | null | undefined, bank: string = BANK): string {
  if (value === bank) return bank
  return typeof value === "string" && BANK_ID.test(value) ? value : PRIVATE_BANK
}

const isNumArray = (a: unknown): a is number[] => Array.isArray(a) && a.every((x) => typeof x === "number")

/** The course a saved exam names; none (a session from before decision 60) is C952's. */
function courseOfSaved(e: unknown): string {
  const course = e !== null && typeof e === "object" ? (e as { course?: unknown }).course : undefined
  return typeof course === "string" && course ? course : C952_SLUG
}

/** The course of the session's raw JSON: C952's when it names none or can't be read (store.ts's drop rule). */
function courseOfRaw(raw: string): string {
  try {
    return courseOfSaved(JSON.parse(raw))
  } catch {
    return C952_SLUG
  }
}

/**
 * The saved running exam, or null. An invalid session is removed: one whose items `known` no longer finds (an unknown
 * course, a question this build lacks), or a guide's item without string text and options. Unreadable storage gives
 * null. Never throws.
 */
export function loadExam(storage: StorageLike | null = sessionStore(), known: ExamItemCheck = c952ItemKnown): Exam | null {
  try {
    if (!storage) return null
    const raw = storage.getItem(EXAM_KEY)
    if (!raw) return null
    const e = JSON.parse(raw) as Exam
    const course = courseOfSaved(e)
    const guide = course !== C952_SLUG
    const valid =
      e &&
      Array.isArray(e.items) &&
      e.items.length > 0 &&
      Array.isArray(e.ans) &&
      e.ans.length === e.items.length &&
      e.ans.every(isNumArray) &&
      e.items.every(
        (it) =>
          it &&
          known(course, it.n) &&
          Array.isArray(it.opts) &&
          it.opts.length > 0 &&
          isNumArray(it.correct) &&
          // a guide's text is rendered from here (through the sanitizer), so it must be text
          (!guide || (typeof it.text === "string" && it.opts.every((o) => o && typeof o.t === "string" && typeof o.k === "number"))),
      ) &&
      typeof e.flags === "object" &&
      e.flags !== null &&
      Number.isFinite(e.start) &&
      typeof e.name === "string"
    if (!valid) {
      storage.removeItem(EXAM_KEY)
      return null
    }
    return { ...e, course, i: Math.min(Math.max(0, Number(e.i) || 0), e.items.length - 1) }
  } catch {
    return null
  }
}

/** Removes the session and its bank tag. Never throws. */
export function clearExam(storage: StorageLike | null = sessionStore()): void {
  try {
    storage?.removeItem(EXAM_KEY)
  } catch {
    /* storage blocked */
  }
  try {
    storage?.removeItem(EXAM_BANK_KEY)
  } catch {
    /* storage blocked */
  }
}

/**
 * Saves the running exam (or clears it for null): App's exam effect. A saved session also writes BANK to
 * EXAM_BANK_KEY. Never throws: with storage blocked the exam simply won't survive a reload.
 */
export function saveExam(exam: Exam | null, storage: StorageLike | null = sessionStore(), bank: string = BANK): void {
  if (!exam) {
    clearExam(storage)
    return
  }
  try {
    storage?.setItem(EXAM_KEY, JSON.stringify(exam))
    storage?.setItem(EXAM_BANK_KEY, bank)
  } catch {
    /* storage blocked: the exam simply won't survive a reload */
  }
}

/**
 * The drop rule of the bank switch (decision 8): removes the saved session, and its tag, only when it is C952's (its
 * JSON names no course, or "c952") and the tag (absent: "private") differs from `bank`. A guide's session is never
 * dropped here. Returns true when it dropped one. Run by store.ts's runMigrations at module init, before App's
 * useState(loadExam). Never throws.
 */
export function dropExamFromOtherBank(bank: string = BANK, storage: StorageLike | null = sessionStore()): boolean {
  if (!storage) return false
  try {
    const raw = storage.getItem(EXAM_KEY)
    if (raw === null) return false
    if (courseOfRaw(raw) !== C952_SLUG) return false
    if (readBankTag(storage.getItem(EXAM_BANK_KEY), bank) === bank) return false
  } catch {
    return false
  }
  clearExam(storage)
  return true
}

/** What the "{CODE} exam in progress" Alert says about a running exam (decisions 28 and 60). */
export interface RunningExam {
  /** The exam's course: "c952", "d281" */
  course: string
  /** The exam's name: "Quick 20", "Topic drill: …" */
  name: string
  /** Questions with an answer */
  answered: number
  /** Questions in the exam */
  total: number
}

/** The running exam's summary: null when there is none or it is submitted (the Alert's "started, not submitted"). */
export function runningExamOf(exam: Exam | null): RunningExam | null {
  if (!exam || exam.done) return null
  return {
    course: courseOfSaved(exam),
    name: exam.name,
    answered: exam.ans.filter((a) => a.length > 0).length,
    total: exam.items.length,
  }
}
