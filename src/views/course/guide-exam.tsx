/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * A guide course's practice exam (decision 60): its bank and how its exam renders. The bank is every practice question
 * the app can grade on its own: one with choices whose answer `correctChoice` maps to exactly one of them (387 of the
 * 408 today, 9 to 15 a guide). Its n is the question's index in the guide's `practice`, so results write the same
 * marks as Questions do (`courses[slug].practice[n]`). A self-graded question (no choices, or an answer no choice
 * matches) never joins an exam: it stays in Questions, and the Full exam card says so. Both are memoized per loaded
 * guide.
 *
 * Shuffling a guide's choices is safe because no choice or why names another option by its letter or position; the
 * test suite rejects any guide that does ("Both A and C", "None of the above", "option B").
 */
import { COURSE_BY_SLUG } from "@/data/courses"
import { codeOf } from "@/lib/course"
import type { BankQuestion, ExamBank } from "@/lib/exam"
import type { Store } from "@/lib/store"
import { GuideAnswer, GuideRich, assessmentOf, correctChoice, padTo, stripLetter, type Guide } from "@/views/course/shared"
import type { ExamContent } from "@/views/exam/content"
import { SafeRich } from "@/components/kit"

const BANKS = new WeakMap<Guide, ExamBank>()
const CONTENTS = new WeakMap<Guide, ExamContent>()

/** The gradable questions of a guide: n is the practice index, the options are the choices without their own letter. */
function bankQuestions(guide: Guide): BankQuestion[] {
  return guide.practice.flatMap((p, i) => {
    if (p.choices.length === 0) return []
    const right = correctChoice(p.answer, p.choices)
    if (right === null) return []
    return [{ n: i, text: p.q, options: p.choices.map((c, j) => stripLetter(c, j)), correct: [right], multi: false }]
  })
}

/**
 * A guide's exam bank: its gradable practice questions, no topics yet (no topic tags in the guides), and My misses
 * drawing the gradable ones marked missed (`courses[slug].practice[n] === false`), in guide order.
 */
export function guideBank(slug: string, guide: Guide): ExamBank {
  const kept = BANKS.get(guide)
  if (kept && kept.course === slug) return kept
  const questions = Object.freeze(bankQuestions(guide))
  const bank: ExamBank = Object.freeze({
    course: slug,
    questions,
    topics: Object.freeze([]),
    missed: (store: Store) => {
      const marks = store.courses?.[slug]?.practice
      return questions.filter((q) => marks?.[q.n] === false).map((q) => q.n)
    },
  })
  BANKS.set(guide, bank)
  return bank
}

/** "1 question", "12 questions". */
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/**
 * How a guide's exam renders: the stem through GuideRich (code lines become a Terminal), each choice through SafeRich,
 * the review's breakdown as Practice's Answer and "Why it's right" Alerts, labels "Q07" from the practice index (as
 * Questions numbers them), and no topics. The Full exam card says where the self-graded questions are.
 */
export function guideExamContent(slug: string, guide: Guide): ExamContent {
  const kept = CONTENTS.get(guide)
  if (kept && kept.code === codeOf(slug)) return kept
  const code = codeOf(slug)
  const total = guide.practice.length
  const gradable = guideBank(slug, guide).questions.length
  const selfGraded = total - gradable
  const course = COURSE_BY_SLUG[slug]
  const content: ExamContent = {
    code,
    stem: (item) => (
      <GuideRich html={item.text} className="min-w-0 max-w-[68ch] flex-1 whitespace-pre-line break-words" />
    ),
    option: (text) => <SafeRich as="span" html={text} />,
    explain: (item) => {
      const p = guide.practice[item.n]
      return p ? <GuideAnswer item={p} /> : null
    },
    label: (n) => `Q${padTo(n + 1, total)}`,
    topicOf: () => null,
    eli5: (
      <>
        The <b>Full exam</b> is a full practice run: every question with answer choices, shuffled and timed, graded only
        when you submit. <b>My misses</b> runs just the ones you got wrong, until they stick.
      </>
    ),
    full: {
      text:
        selfGraded > 0
          ? `All ${plural(gradable, `${code} question`)} with answer choices, shuffled. A full practice run. ${
              selfGraded === 1
                ? "The 1 you grade yourself is in Questions."
                : `The ${selfGraded} you grade yourself are in Questions.`
            }`
          : `All ${gradable} ${code} practice ${gradable === 1 ? "question" : "questions"}, shuffled. A full practice run.`,
    },
    oa: course ? assessmentOf(course) === "Objective" : false,
  }
  CONTENTS.set(guide, content)
  return content
}
