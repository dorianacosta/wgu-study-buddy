/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
// "@c952-content" is src/data/content.json, the 60 original C952 practice questions (the alias is set in
// vite.config.ts and tsconfig.app.json).
import content from "@c952-content"
import {
  Binary,
  Cpu,
  Terminal,
  Gauge,
  Layers,
  Database,
  Network,
  Cloud,
  type LucideIcon,
} from "lucide-react"

export type TopicId = "t1" | "t2" | "t3" | "t4" | "t5" | "t6" | "t7" | "t8"

export interface Topic {
  id: TopicId
  name: string
  /** big-idea explanation, like you're 5 (HTML) */
  kid: string
  /** grown-up facts to memorize (HTML strings) */
  keys: string[]
  color: string
  icon: LucideIcon
}

export interface Flip {
  q: string
  a: number | null
  why: string
}

export interface Question {
  n: number
  t: TopicId
  q: string
  o: string[]
  a: number | number[]
  kid: string
  why: string
  w: (string | null)[]
  f: Flip[]
  code?: string
  mono?: boolean
  conf?: string
}

/** The content file's "meta": which question bank it holds and under what terms. */
export interface ContentMeta {
  bank: string
  /** Always false: the app has one version, with the public bank (as "private" in dist/build-info.json). */
  private?: boolean
  author?: string
  license?: string
  questions?: string
  notice?: string
}

/** False: the app has one public version. The private bank and its build are retired. */
export const IS_PRIVATE_BANK = false

/** The content's meta: "bank" is "original-1", plus author, license, questions and notice. */
export const CONTENT_META: ContentMeta = { ...content.meta, private: IS_PRIVATE_BANK }
export const BANK = CONTENT_META.bank

/** Monochrome: topics are told apart by icon, number and name, never by hue. */
const TOPIC_STYLE: Record<TopicId, { color: string; icon: LucideIcon }> = {
  t1: { color: "#e5e5ea", icon: Binary },
  t2: { color: "#e5e5ea", icon: Cpu },
  t3: { color: "#e5e5ea", icon: Terminal },
  t4: { color: "#e5e5ea", icon: Gauge },
  t5: { color: "#e5e5ea", icon: Layers },
  t6: { color: "#e5e5ea", icon: Database },
  t7: { color: "#e5e5ea", icon: Network },
  t8: { color: "#e5e5ea", icon: Cloud },
}

type RawTopic = { id: string; name: string; kid: string; keys: string[] }

export const TOPICS: Topic[] = (content.topics as RawTopic[]).map((t) => ({
  id: t.id as TopicId,
  name: t.name,
  kid: t.kid,
  keys: t.keys,
  ...TOPIC_STYLE[t.id as TopicId],
}))

export const QUESTIONS: Question[] = content.questions as unknown as Question[]

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>
export const QUESTION_BY_N = Object.fromEntries(QUESTIONS.map((q) => [q.n, q])) as Record<number, Question>

/** One-day plan: [duration, html] */
export const PLAN: [string, string][] = content.plan as [string, string][]
/** Formulas: [name, formula, example] */
export const FORMULAS: [string, string, string][] = content.formulas as [string, string, string][]
/** Signal words: [if the question says, think] */
export const SIGNALS: [string, string][] = content.signals as [string, string][]
export const GREAT_IDEAS: string[] = content.ideas

const T = content.tables as { head: string[]; rows: string[][] | null }[]
export const FLYNN = T[1]
export const RAID = T[2]
export const ARM_REF = T[3]
export const MEMORY = T[4]

/** tables[0] holds only the signal-words table's column heads and its lead line (its rows are SIGNALS). */
const SIGNALS_TABLE = T[0] as (typeof T)[number] & { lead: string }
/** Column heads of the signal-words table. */
export const SIGNALS_HEAD: [string, string] = [SIGNALS_TABLE.head[0], SIGNALS_TABLE.head[1]]
/** Lead line above the signal-words table. */
export const SIGNALS_LEAD: string = SIGNALS_TABLE.lead

/* ── C952's flashcards (decision 57) ─────────────────────────────────────── */

/** What a C952 flashcard's front is, so the student knows what to recall; the card shows it above the front. */
export type C952CardKind = "Formula" | "Signal word" | "ARM reference"

/**
 * One C952 flashcard, in a guide key fact's shape plus its kind: `label` is the front, `value` and `note` the back. All
 * three are HTML, which Practice renders through the safe-html allow-list as it renders guide text: the ARM reference
 * keeps its own (`<code>`, `<sup>`, entities), and the formulas' and signal words' plain text is escaped into HTML.
 */
export interface C952Card {
  kind: C952CardKind
  label: string
  value: string
  note: string
}

/** The Cheat Sheet lists the deck draws its cards from. */
type CardSource = "formulas" | "signals" | "arm"

/**
 * C952's deck in card order, as runs of entries `[list, from, to)`: the 10 formulas (front the name, back the formula,
 * note the example), then the 30 signal words (front the clue, back the concept), then the 12 ARM reference rows (front
 * the instruction or term, such as ESR / ELR, back what it means). 52 cards.
 *
 * Card marks are saved by position (`courses.c952.cards[i]`, i a card's place in this deck), so new cards go only at
 * the end. To add one, add its entry at the end of its list in content.json, then append a run for it here (an 11th
 * formula is `["formulas", 10, 11]`). Never reorder, insert, shorten or remove a run, and never reorder or remove the
 * entries of those three lists: a card that moves takes everyone's mark with it.
 */
const C952_DECK: readonly (readonly [CardSource, number, number])[] = [
  ["formulas", 0, 10],
  ["signals", 0, 30],
  ["arm", 0, 12],
]

/** Plain text as HTML that shows it as written (the formulas and signal words are text, the cards HTML). */
const textHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function c952Card(list: CardSource, i: number): C952Card {
  if (list === "formulas") {
    const [name, formula, example] = FORMULAS[i] ?? ["", "", ""]
    return { kind: "Formula", label: textHtml(name), value: textHtml(formula), note: textHtml(example) }
  }
  if (list === "signals") {
    const [clue, concept] = SIGNALS[i] ?? ["", ""]
    return { kind: "Signal word", label: textHtml(clue), value: textHtml(concept), note: "" }
  }
  const [instruction = "", means = ""] = ARM_REF.rows?.[i] ?? []
  return { kind: "ARM reference", label: instruction, value: means, note: "" }
}

/** C952's 52 flashcards in deck order (C952_DECK): the Practice Exam start screen's Flashcards, marked in `courses.c952.cards`. */
export const C952_CARDS: readonly C952Card[] = Object.freeze(
  C952_DECK.flatMap(([list, from, to]) => Array.from({ length: to - from }, (_, k) => Object.freeze(c952Card(list, from + k)))),
)

export const correctOf = (q: Question): number[] => (Array.isArray(q.a) ? q.a : [q.a])

export const LETTERS = "ABCDEF"
