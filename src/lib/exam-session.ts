/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The running C952 exam, kept in sessionStorage too, so reloading the tab mid-exam doesn't lose it. Moved out of
 * App.tsx with the same key, the same checks and the same behavior. New (decisions 7 and 8): every saved session also
 * writes the bank it was built from to `wgu-study-buddy-exam-bank-v1` (absent means "private"), and clearing a
 * session removes both keys. The bank switch in store.ts drops a session whose bank differs from this build's.
 */
import { BANK, QUESTION_BY_N } from "@/data"
import type { Exam } from "@/lib/exam"

/** sessionStorage: the running exam (unchanged name and shape). */
export const EXAM_KEY = "c952-exam-session-v1"

/** sessionStorage: the bank of the running exam in EXAM_KEY; absent means "private". */
export const EXAM_BANK_KEY = "wgu-study-buddy-exam-bank-v1"

/** The bank an absent or unreadable bank tag means: the only bank before this release. */
export const PRIVATE_BANK = "private"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

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

/** The saved running exam, or null. An invalid session is removed; unreadable storage gives null. Never throws. */
export function loadExam(storage: StorageLike | null = sessionStore()): Exam | null {
  try {
    if (!storage) return null
    const raw = storage.getItem(EXAM_KEY)
    if (!raw) return null
    const e = JSON.parse(raw) as Exam
    const valid =
      e &&
      Array.isArray(e.items) &&
      e.items.length > 0 &&
      Array.isArray(e.ans) &&
      e.ans.length === e.items.length &&
      e.ans.every(isNumArray) &&
      e.items.every(
        (it) => it && QUESTION_BY_N[it.n] && Array.isArray(it.opts) && it.opts.length > 0 && isNumArray(it.correct),
      ) &&
      typeof e.flags === "object" &&
      e.flags !== null &&
      Number.isFinite(e.start) &&
      typeof e.name === "string"
    if (!valid) {
      storage.removeItem(EXAM_KEY)
      return null
    }
    return { ...e, i: Math.min(Math.max(0, Number(e.i) || 0), e.items.length - 1) }
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
 * The drop rule of the bank switch (decision 8): removes the saved session, and its tag, only when the tag (absent:
 * "private") differs from `bank`. Returns true when it dropped one. Run by store.ts's runMigrations at module init,
 * before App's useState(loadExam). Never throws.
 */
export function dropExamFromOtherBank(bank: string = BANK, storage: StorageLike | null = sessionStore()): boolean {
  if (!storage) return false
  try {
    if (storage.getItem(EXAM_KEY) === null) return false
    if (readBankTag(storage.getItem(EXAM_BANK_KEY), bank) === bank) return false
  } catch {
    return false
  }
  clearExam(storage)
  return true
}

/** What the "C952 exam in progress" Alert says about a running exam (decision 28). */
export interface RunningExam {
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
  return { name: exam.name, answered: exam.ans.filter((a) => a.length > 0).length, total: exam.items.length }
}
