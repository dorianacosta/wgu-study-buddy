/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Progress backup (decision 59): everything this browser saved, as one JSON file the student keeps, and a checked
 * restore from such a file.
 *
 * - No network and no form: the file is made with a Blob and a script-made `<a download>`, and read with `File.text()`
 *   (the CSP has `default-src 'none'` and `form-action 'none'`).
 * - A backup holds the five localStorage keys the app writes: the progress record (`c952-study-v1`), the C952 bank tag
 *   and stash, the migrations record and the active course. Never the running exam (sessionStorage) or device
 *   settings.
 * - The file format is version 2 (BACKUP_VERSION): exam attempts name their course (decision 60). Version-1 files
 *   still restore; their attempts have no course, so they stay C952's.
 * - A restore checks every field it knows and keeps a newer version's extra fields, then writes in the bank switch's
 *   order (stash, tag, record), then the migrations record and the course. A failed write rolls every key back. On
 *   success the caller reloads the page: useStore reads storage once, and the bank switch and one-time fixes run only
 *   at module start. Saving stays suspended from the first write until that reload, so a late save in this tab can't
 *   overwrite the restore, and every other open tab of the app is told to stop saving and reload too.
 */
import { BANK } from "@/data"
import { readBankTag } from "@/lib/exam-session"
import { COURSE_KEY, isCourseSlug } from "@/lib/course"
import {
  BANK_ID_PATTERN,
  C952_BANK_KEY,
  C952_STASH_KEY,
  MIGRATIONS_KEY,
  MIGRATION_IDS,
  STORE_KEY,
  isPlainRecord,
  localDayString,
  parseLocalDay,
  resumeSaving,
  suspendSaving,
  type Attempt,
  type StorageLike,
  type Store,
} from "@/lib/store"

/** The file's marker: `{ app, kind, version, exported, data }`. */
export const BACKUP_APP = "wgu-study-buddy"
export const BACKUP_KIND = "progress-backup"
/**
 * The format this build writes and the newest it reads. 2 (decision 60): exam attempts name their course and a guide
 * keeps its best exam score. A version-1 reader would strip an attempt's course and file a guide's attempts under
 * C952, so it refuses these files ("newer"); this build still reads version 1, whose attempts are all C952's.
 */
export const BACKUP_VERSION = 2
/** A real backup is a few KB; a file past this isn't one. */
export const BACKUP_MAX_BYTES = 2 * 1024 * 1024

/** The keys a backup carries, in the order a restore writes them. */
const KEYS = [C952_STASH_KEY, C952_BANK_KEY, STORE_KEY, MIGRATIONS_KEY, COURSE_KEY] as const

/**
 * The one-time fixes every backup's data has already been through: the ones that existed when backups began. A restore
 * always records them, or practice-false-v1 would run again on reload and delete every restored miss. Never add a
 * later fix here: a backup made before it must still get it.
 */
const ALWAYS_APPLIED: readonly string[] = ["practice-false-v1"]

/* ── Messages (sans sentences, shown in a destructive Alert where the action happened) ───────────────────────────── */

export const BACKUP_ERRORS = {
  tooBig: "That file is too large to be a WGU Study Buddy backup.",
  notBackup: "That file isn't a WGU Study Buddy backup. Choose a file made with Save backup.",
  newer: "That backup comes from a newer version of WGU Study Buddy. Reload this page to update, then try again.",
  unreadable: "That file couldn't be read. Try again, or choose another file.",
  blocked: "This browser is blocking storage, so nothing was restored.",
  writeFailed: "The restore couldn't finish, so your progress is unchanged. This browser's storage may be full or blocked.",
  saveFailed: "This browser couldn't make the backup file. Try again.",
} as const

/* ── Checking what a file holds ────────────────────────────────────────────────────────────────────────────────────── */

/** Keys never copied out of a file: JSON.parse makes them own properties, and nothing in the app uses them. */
const DROP = new Set(["__proto__", "constructor", "prototype"])
/** A question, plan-day or flashcard index. */
const INDEX = /^(?:0|[1-9]\d{0,5})$/
/** A course key: a lower-case course code ("d278"), or one a newer version may add. */
const SLUG_LIKE = /^[a-z][a-z0-9]{1,11}$/
/** A one-time fix's id. */
const MIGRATION_ID = /^[a-z0-9][a-z0-9-]{0,63}$/
/** At most this many exam attempts are restored (the newest). */
const MAX_HISTORY = 1000

const isBool = (x: unknown): x is boolean => typeof x === "boolean"
const isFiniteNumber = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x)
const isCount = (x: unknown): x is number => isFiniteNumber(x) && x >= 0

/** Own fields of a parsed object, without the ones in DROP. */
function ownFields(v: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, x] of Object.entries(v)) if (!DROP.has(k)) out[k] = x
  return out
}

/** `{ index: value }` marks, keeping only index keys with values `keep` accepts. */
function indexMarks<T>(v: unknown, keep: (x: unknown) => x is T): Record<number, T> {
  const out: Record<number, T> = {}
  if (!isPlainRecord(v)) return out
  for (const [k, x] of Object.entries(v)) if (INDEX.test(k) && keep(x)) out[Number(k)] = x
  return out
}

/** An exam attempt; its course is kept when it looks like a course key, so an attempt without one stays C952's. */
function cleanAttempt(v: unknown): Attempt | null {
  if (!isPlainRecord(v)) return null
  const { mode, score, total, date, time, course } = v
  if (typeof mode !== "string" || mode.length > 80 || typeof time !== "string" || time.length > 40) return null
  if (!isCount(score) || !isCount(total) || !isFiniteNumber(date)) return null
  const out: Attempt = { mode, score, total, date, time }
  if (typeof course === "string" && SLUG_LIKE.test(course)) out.course = course
  return out
}

/** A score in percent, 0 to 100. */
const isPercent = (x: unknown): x is number => isFiniteNumber(x) && x >= 0 && x <= 100

/**
 * A course's record (`courses[slug]`, C952's included: its exam date and flashcard marks): its known fields checked
 * (a guide's best exam score only from 0 to 100), any other field (a newer version's) kept.
 */
function cleanCourse(v: unknown): Record<string, unknown> | null {
  if (!isPlainRecord(v)) return null
  const out = ownFields(v)
  out.plan = indexMarks(v.plan, isBool)
  out.practice = indexMarks(v.practice, isBool)
  if (v.cards === undefined) delete out.cards
  else out.cards = indexMarks(v.cards, isBool)
  if (v.examDate === undefined || !parseLocalDay(v.examDate)) delete out.examDate
  if (!isPercent(v.best)) delete out.best
  return out
}

/** The progress record (`c952-study-v1`), as store.ts saves it: known fields checked, a newer version's kept. */
function cleanRecord(v: Record<string, unknown>): Record<string, unknown> {
  const out = ownFields(v)
  out.mastered = indexMarks(v.mastered, isBool)
  out.miss = indexMarks(v.miss, isCount)
  out.plan = indexMarks(v.plan, isBool)
  const history = Array.isArray(v.history) ? v.history : []
  out.history = history
    .map(cleanAttempt)
    .filter((a): a is Attempt => a !== null)
    .slice(-MAX_HISTORY)
  out.best = isFiniteNumber(v.best) ? v.best : null
  const courses: Record<string, unknown> = {}
  if (isPlainRecord(v.courses)) {
    for (const [slug, c] of Object.entries(v.courses)) {
      if (!SLUG_LIKE.test(slug)) continue
      const course = cleanCourse(c)
      if (course) courses[slug] = course
    }
  }
  out.courses = courses
  const completed: Record<string, number> = {}
  if (isPlainRecord(v.completed)) {
    for (const [slug, at] of Object.entries(v.completed)) if (SLUG_LIKE.test(slug) && isFiniteNumber(at)) completed[slug] = at
  }
  out.completed = completed
  return out
}

type BankMarks = { mastered: Record<number, boolean>; miss: Record<number, number> }

const bankMarksOf = (v: unknown): BankMarks => {
  const r = isPlainRecord(v) ? v : {}
  return { mastered: indexMarks(r.mastered, isBool), miss: indexMarks(r.miss, isCount) }
}

/** The C952 stash: `{ [bank]: { mastered, miss } }`, keeping only bank-like ids. */
function cleanStashValue(v: unknown): Record<string, BankMarks> {
  const out: Record<string, BankMarks> = {}
  if (!isPlainRecord(v)) return out
  for (const [bank, m] of Object.entries(v)) if (BANK_ID_PATTERN.test(bank) && !DROP.has(bank)) out[bank] = bankMarksOf(m)
  return out
}

function cleanMigrations(v: unknown): string[] {
  const ids = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && MIGRATION_ID.test(x)) : []
  return [...new Set(ids)].slice(0, 100)
}

/* ── Reading storage ───────────────────────────────────────────────────────────────────────────────────────────────── */

function localStore(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

function readKey(local: StorageLike | null, key: string): string | null {
  try {
    return local?.getItem(key) ?? null
  } catch {
    return null
  }
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/* ── Saving a backup ───────────────────────────────────────────────────────────────────────────────────────────────── */

/** What a backup file holds once checked: the values a restore writes. */
export interface BackupData {
  /** `c952-study-v1` */
  record: Record<string, unknown>
  /** The C952 bank the record's marks belong to; null for none (the "private" bank) */
  bank: string | null
  /** The C952 marks of every bank not in use */
  stash: Record<string, BankMarks>
  /** The one-time fixes the data has been through */
  migrations: string[]
  /** The active course; null to keep this browser's */
  course: string | null
}

/**
 * This browser's progress as a backup file's JSON. The record is the one on screen (`store`), so its C952 marks belong
 * to this build's bank, as every save files them (store.ts save). When another tab of an older copy switched banks
 * since this one loaded, the saved record's marks join the stash under their bank first, as the next save would do.
 */
export function backupJson(store: Store, now: Date = new Date()): string {
  const local = localStore()
  const savedBank = readBankTag(readKey(local, C952_BANK_KEY), BANK)
  const stash = cleanStashValue(parseJson(readKey(local, C952_STASH_KEY)))
  if (savedBank !== BANK) stash[savedBank] = bankMarksOf(parseJson(readKey(local, STORE_KEY)))
  delete stash[BANK]
  const savedMigrations = parseJson(readKey(local, MIGRATIONS_KEY))
  // unreadable storage: the record on screen is a fresh one, which needs no fix
  const migrations = Array.isArray(savedMigrations) ? cleanMigrations(savedMigrations) : [...MIGRATION_IDS]
  const course = readKey(local, COURSE_KEY)
  const data: Record<string, unknown> = {
    [STORE_KEY]: store,
    [C952_BANK_KEY]: BANK,
    [C952_STASH_KEY]: stash,
    [MIGRATIONS_KEY]: migrations,
  }
  if (isCourseSlug(course)) data[COURSE_KEY] = course
  return JSON.stringify(
    { app: BACKUP_APP, kind: BACKUP_KIND, version: BACKUP_VERSION, exported: now.toISOString(), data },
    null,
    2,
  )
}

/** "wgu-study-buddy-progress-2026-11-21.json" (the local date). */
export const backupFileName = (now: Date = new Date()) => `wgu-study-buddy-progress-${localDayString(now)}.json`

/**
 * Saves the backup file: a Blob behind a script-made `<a download>`, so nothing leaves the browser. True when the
 * browser took the file (it may still ask where to save it); false when it couldn't make one.
 */
export function downloadBackup(store: Store, now: Date = new Date()): boolean {
  let url: string | null = null
  try {
    const blob = new Blob([backupJson(store, now)], { type: "application/json" })
    url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = backupFileName(now)
    a.rel = "noopener"
    a.hidden = true
    document.body.appendChild(a)
    a.click()
    a.remove()
    const made = url
    // long enough for a slow save sheet (iOS) to read it
    setTimeout(() => URL.revokeObjectURL(made), 60_000)
    return true
  } catch {
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* ignore */
      }
    }
    return false
  }
}

/* ── Reading a backup ──────────────────────────────────────────────────────────────────────────────────────────────── */

export interface BackupSummary {
  /** When the backup was made; null when the file doesn't say */
  exported: Date | null
  /** "Nov 21, 2026"; null when the file doesn't say */
  exportedLabel: string | null
  /**
   * Courses with any saved progress (flashcard marks count, C952's too, and each exam attempt for its own course),
   * completed ones included
   */
  courses: number
  /** Courses marked completed */
  completed: number
}

export type BackupCheck = { ok: true; data: BackupData; summary: BackupSummary } | { ok: false; error: string }

const anyTrue = (m: Record<number, boolean>) => Object.values(m).some((x) => x === true)
const anyMark = (m: unknown) => isPlainRecord(m) && Object.keys(m).length > 0

function summarize(record: Record<string, unknown>, exported: unknown): BackupSummary {
  const slugs = new Set<string>()
  // every attempt counts for its own course (decision 60): one with no course is C952's
  const attempts = record.history as Attempt[]
  for (const a of attempts) if (a.course !== undefined && a.course !== "c952") slugs.add(a.course)
  const c952 =
    anyTrue(record.mastered as Record<number, boolean>) ||
    Object.values(record.miss as Record<number, number>).some((n) => n > 0) ||
    anyTrue(record.plan as Record<number, boolean>) ||
    attempts.some((a) => a.course === undefined || a.course === "c952")
  if (c952) slugs.add("c952")
  for (const [slug, c] of Object.entries(record.courses as Record<string, Record<string, unknown>>)) {
    if (
      anyTrue(c.plan as Record<number, boolean>) ||
      anyMark(c.practice) ||
      anyMark(c.cards) ||
      c.examDate !== undefined ||
      c.best !== undefined
    )
      slugs.add(slug)
  }
  let completed = 0
  for (const slug of Object.keys(record.completed as Record<string, number>)) {
    if (!isCourseSlug(slug)) continue
    completed++
    slugs.add(slug)
  }
  const when = typeof exported === "string" ? new Date(exported) : null
  const valid = when !== null && Number.isFinite(when.getTime())
  return {
    exported: valid ? when : null,
    exportedLabel: valid ? when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
    courses: [...slugs].filter((s) => isCourseSlug(s)).length,
    completed,
  }
}

/**
 * Checks a backup file's text: the marker, the version, then every field (see cleanRecord), and that this browser can
 * write the record back out, as restoreBackup will.
 */
export function checkBackup(text: string): BackupCheck {
  if (text.length > BACKUP_MAX_BYTES) return { ok: false, error: BACKUP_ERRORS.tooBig }
  const v = parseJson(text)
  if (!isPlainRecord(v) || v.app !== BACKUP_APP || v.kind !== BACKUP_KIND) return { ok: false, error: BACKUP_ERRORS.notBackup }
  if (typeof v.version !== "number" || !Number.isInteger(v.version) || v.version < 1)
    return { ok: false, error: BACKUP_ERRORS.notBackup }
  if (v.version > BACKUP_VERSION) return { ok: false, error: BACKUP_ERRORS.newer }
  const data = isPlainRecord(v.data) ? v.data : null
  const raw = data ? data[STORE_KEY] : null
  if (!data || !isPlainRecord(raw)) return { ok: false, error: BACKUP_ERRORS.notBackup }
  const record = cleanRecord(raw)
  // kept extra fields are never walked, and JSON.parse nests deeper than JSON.stringify (a 40,000-level field parses
  // but won't stringify in Safari, nor in V8 once the record holds a mark): such a file could never be restored, so it
  // is turned away here, at the pick
  try {
    JSON.stringify(record)
  } catch {
    return { ok: false, error: BACKUP_ERRORS.notBackup }
  }
  const tag = data[C952_BANK_KEY]
  const course = data[COURSE_KEY]
  const checked: BackupData = {
    record,
    bank: typeof tag === "string" && BANK_ID_PATTERN.test(tag) ? tag : null,
    stash: cleanStashValue(data[C952_STASH_KEY]),
    migrations: cleanMigrations(data[MIGRATIONS_KEY]),
    course: isCourseSlug(course) ? course : null,
  }
  return { ok: true, data: checked, summary: summarize(record, v.exported) }
}

/** Reads and checks a picked file (`<input type="file">`). Never throws. */
export async function readBackupFile(file: Blob): Promise<BackupCheck> {
  if (file.size > BACKUP_MAX_BYTES) return { ok: false, error: BACKUP_ERRORS.tooBig }
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, error: BACKUP_ERRORS.unreadable }
  }
  return checkBackup(text)
}

/* ── Restoring ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export type RestoreResult = { ok: true } | { ok: false; error: string }

/**
 * Replaces this browser's progress with a checked backup. On `{ ok: true }` the caller reloads the page
 * (`location.reload()`); saving stays suspended until then. On failure every key is as it was (a failed write rolls
 * them all back), saving goes on, and nothing reloads. Never throws.
 */
export function restoreBackup(data: BackupData, storage: StorageLike | null = localStore()): RestoreResult {
  if (!storage) return { ok: false, error: BACKUP_ERRORS.blocked }
  const before = new Map<string, string | null>()
  try {
    for (const key of KEYS) before.set(key, storage.getItem(key))
  } catch {
    return { ok: false, error: BACKUP_ERRORS.blocked }
  }
  const migrations = [...new Set([...data.migrations, ...ALWAYS_APPLIED])]
  let writes: [string, string | null][]
  try {
    writes = [
      [C952_STASH_KEY, JSON.stringify(data.stash)],
      [C952_BANK_KEY, data.bank],
      [STORE_KEY, JSON.stringify(data.record)],
      [MIGRATIONS_KEY, JSON.stringify(migrations)],
    ]
  } catch {
    // too deep for this browser's JSON.stringify (checkBackup turns such a file away first): nothing was written, and
    // saving never stopped
    return { ok: false, error: BACKUP_ERRORS.notBackup }
  }
  if (data.course) writes.push([COURSE_KEY, data.course])
  // just before the first write, as the file header says
  suspendSaving()
  for (const [key, value] of writes) {
    try {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    } catch {
      for (const [k, old] of before) {
        try {
          if (old === null) storage.removeItem(k)
          else storage.setItem(k, old)
        } catch {
          /* best effort */
        }
      }
      resumeSaving()
      return { ok: false, error: BACKUP_ERRORS.writeFailed }
    }
  }
  announceRestore()
  return { ok: true }
}

/* ── Other open tabs ───────────────────────────────────────────────────────────────────────────────────────────────── */

const CHANNEL_NAME = "wgu-study-buddy"
const RESTORED = "progress-restored"
let channel: BroadcastChannel | null = null

/** Every tab listens from module start: a restore in another tab stops this one saving and reloads it. */
function openChannel(): BroadcastChannel | null {
  if (channel) return channel
  try {
    if (typeof BroadcastChannel === "undefined") return null
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e: MessageEvent) => {
      if (!isPlainRecord(e.data) || e.data.type !== RESTORED) return
      suspendSaving()
      try {
        location.reload()
      } catch {
        /* saving stays off: this tab can't overwrite the restore */
      }
    }
  } catch {
    channel = null
  }
  return channel
}

function announceRestore() {
  try {
    openChannel()?.postMessage({ type: RESTORED })
  } catch {
    /* no channel: other tabs keep their copy until they reload */
  }
}

openChannel()
