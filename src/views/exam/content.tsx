/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * How an exam's course renders it (decision 60). The exam engine (src/lib/exam.ts) and its screens (ExamPicker,
 * Runner, Results) are the same for every course; this adapter is what differs. C952's stems, choices and breakdowns
 * are its own bundled content (Rich with the code Terminal, plain-text choices, Explanation, a Remix twist's own why);
 * a guide's (guideExamContent in src/views/course/guide-exam.tsx) are researched text, which renders through the
 * sanitizer (GuideRich, SafeRich) every time, a session restored from sessionStorage included, never through Rich.
 */
import { useState, type ReactNode } from "react"
import { ChevronsUpDown, Repeat, type LucideIcon } from "lucide-react"
import { QUESTIONS, QUESTION_BY_N, TOPIC_BY_ID } from "@/data"
import { COURSE_BY_SLUG } from "@/data/courses"
import { C952, codeOf } from "@/lib/course"
import type { ExamItem } from "@/lib/exam"
import { assessmentOf } from "@/views/course/shared"
import { Rich } from "@/components/kit"
import { Explanation } from "@/components/question"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

/** A topic as Results' By topic shows it: its name and its 16px icon. */
export interface ExamTopic {
  id: string
  name: string
  icon: LucideIcon
}

/** What an exam's screens ask its course: how to render each part and what to call it. */
export interface ExamContent {
  /** The course code for kickers and captions: "C952", "D281" */
  code: string
  /** A stem's body for QuestionText; undefined keeps QuestionText's own (C952: Rich, then its code as a Terminal) */
  stem(item: ExamItem): ReactNode | undefined
  /** An answer choice's text, as OptionButton shows it */
  option(text: string): ReactNode
  /** The review's breakdown under the options */
  explain(item: ExamItem): ReactNode
  /** The bank label of item `n`: "Q05" */
  label(n: number): string
  /** Item n's topic, or null (a guide's items have none yet: Results then leave out By topic) */
  topicOf(n: number): ExamTopic | null
  /** The start screen's "Like you're 5" */
  eli5: ReactNode
  /** The Full exam card's description; `timeInText` when it already says the time, so the meta line leaves it out */
  full: { text: string; timeInText?: boolean }
  /** An Objective-assessment course: only then may Results mention exam day */
  oa: boolean
}

/** A C952 question number, padded to the bank's width like Learn and My Misses (`05`). */
const padQ = (n: number) => String(n).padStart(String(QUESTIONS.length).length, "0")

/** A Remix twist's own "why", then the original question's breakdown behind a Collapsible. */
function RemixWhy({ item }: { item: ExamItem }) {
  const [open, setOpen] = useState(false)
  const q = QUESTION_BY_N[item.n]
  return (
    <>
      <Alert role="note" className="mt-4">
        <Repeat className="h-4 w-4" aria-hidden="true" />
        {/* font-mono: this Alert sits in the review AccordionContent (sans), and Alert titles are never sans (Alert
            README), as question.tsx's Explanation does for its titles */}
        <AlertTitle className="font-mono">
          Why · remix of <span className="font-mono">Q{padQ(item.n)}</span>
        </AlertTitle>
        <AlertDescription>
          <Rich html={item.fwhy ?? ""} />
        </AlertDescription>
      </Alert>
      <Collapsible open={open} onOpenChange={setOpen} className="mt-4 space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="mr-2 h-4 w-4" aria-hidden="true" />
            {open ? "Hide" : "See"} the original Q{padQ(item.n)} breakdown
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Explanation q={q} />
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}

/** C952's own content, as its Practice Exam always rendered it. */
export const C952_CONTENT: ExamContent = {
  code: codeOf(C952),
  stem: () => undefined,
  option: (text) => text,
  explain: (item) => (item.remix ? <RemixWhy item={item} /> : <Explanation q={QUESTION_BY_N[item.n]} />),
  label: (n) => `Q${padQ(n)}`,
  topicOf: (n) => {
    const q = QUESTION_BY_N[n]
    const t = q ? TOPIC_BY_ID[q.t] : undefined
    return t ? { id: t.id, name: t.name, icon: t.icon } : null
  },
  eli5: (
    <>
      The <b>Full exam</b> is a full practice run. The <b>Remix exam</b> is the sneaky one: same answer choices, but the
      question is twisted so a <i>different</i> answer is right. If you can beat Remix, you know the idea, not just the answer.
    </>
  ),
  full: { text: "All 60 C952 practice questions, shuffled. A full practice run. About 45–60 min.", timeInText: true },
  oa: COURSE_BY_SLUG[C952] ? assessmentOf(COURSE_BY_SLUG[C952]) === "Objective" : false,
}
