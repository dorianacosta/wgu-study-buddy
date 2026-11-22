/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { QUESTIONS, QUESTION_BY_N, TOPIC_BY_ID, correctOf, type Question, type TopicId } from "@/data"
import type { Store } from "@/lib/store"

export type ExamMode = "full" | "quick" | "topic" | "miss" | "remix"

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
  mode: ExamMode
  opt: { topic?: TopicId }
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

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toItem(q: Question, flip?: { q: string; a: number; why: string }): ExamItem {
  return {
    n: q.n,
    remix: !!flip,
    text: flip ? flip.q : q.q,
    code: q.code,
    opts: shuffle(q.o.map((t, k) => ({ t, k }))),
    correct: flip ? [flip.a] : correctOf(q),
    multi: !flip && Array.isArray(q.a),
    mono: q.mono,
    fwhy: flip ? flip.why : null,
  }
}

export function buildExam(mode: ExamMode, opt: { topic?: TopicId }, store: Store): Exam {
  let items: ExamItem[] = []
  if (mode === "full") items = shuffle(QUESTIONS).map((q) => toItem(q))
  else if (mode === "quick") items = shuffle(QUESTIONS).slice(0, 20).map((q) => toItem(q))
  else if (mode === "topic") items = shuffle(QUESTIONS.filter((q) => q.t === opt.topic)).map((q) => toItem(q))
  else if (mode === "miss")
    items = shuffle(
      Object.keys(store.miss)
        .map((n) => QUESTION_BY_N[+n])
        .filter(Boolean),
    ).map((q) => toItem(q))
  else if (mode === "remix") {
    const pool: [Question, { q: string; a: number; why: string }][] = []
    QUESTIONS.forEach((q) => (q.f || []).forEach((f) => f.a !== null && pool.push([q, f as { q: string; a: number; why: string }])))
    items = shuffle(pool)
      .slice(0, 25)
      .map(([q, f]) => toItem(q, f))
  }
  return {
    mode,
    opt,
    // same format as the original app, so carried-over history reads consistently
    name: mode === "topic" && opt.topic ? `Topic drill: ${TOPIC_BY_ID[opt.topic].name}` : MODE_NAMES[mode],
    items,
    i: 0,
    ans: items.map(() => []),
    flags: {},
    start: Date.now(),
    done: false,
    review: "wrong",
    score: 0,
    time: "",
  }
}

export const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export const isRight = (exam: Exam, idx: number) => {
  const item = exam.items[idx]
  const a = exam.ans[idx]
  return a.length === item.correct.length && a.every((k) => item.correct.includes(k))
}
