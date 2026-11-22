/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The three shared Alerts, built from the system's Alert and Button with the docs' copy and roles (decisions 8, 28,
 * 34 and 60; CourseTools, A running exam and The 60 original questions; Navigation, Old links and bad links;
 * Surfaces, Alert). The page places them: pass its spacing as `className` (Home `mt-6`, Courses `mt-8`).
 */
import { useEffect, useState } from "react"
import { Info, SearchX, Timer } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { codeOf } from "@/lib/course"
import type { RunningExam } from "@/lib/exam-session"
import { hrefFor, NOT_FOUND_FILL_DELAY, onPlainClick, type Navigate } from "@/lib/routes"

/** The data-focus-key of the "Back to exam" link, so Back from the exam returns focus to it. */
const BACK_TO_EXAM_FOCUS_KEY = "notice:back-to-exam"

/** A running exam as the replace dialog names it: "{CODE} · {name}" ("C952 · Quick 20"). */
export function examTitle(exam: Pick<RunningExam, "course" | "name">): string {
  return `${codeOf(exam.course)} · ${exam.name}`
}

/**
 * "{CODE} exam in progress" (Timer, role="note"), with an outline sm "Back to exam" to `#exam/<its course>`, for any
 * course's running exam (one exam at a time, decision 60). Renders nothing when `exam` is null. Shows on Home below
 * the hero, on `#courses` under the header and at the top of every tool page of every course, except
 * `#exam/<that course>`, where App passes null (decisions 28 and 60).
 */
export function ExamInProgressNotice({
  exam,
  navigate,
  className,
}: {
  exam: RunningExam | null
  navigate: Navigate
  className?: string
}) {
  if (!exam) return null
  const href = hrefFor("exam", exam.course)
  return (
    <Alert role="note" className={className}>
      <Timer className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{codeOf(exam.course)} exam in progress</AlertTitle>
      <AlertDescription>
        {exam.name} · {exam.answered} of {exam.total} answered. The timer keeps running.
      </AlertDescription>
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          {/* the running exam is the Exam mode's (decision 60), so its entry names that mode */}
          <a
            href={href}
            data-focus-key={BACK_TO_EXAM_FOCUS_KEY}
            onClick={onPlainClick(() => navigate(href, { practiceMode: "exam" }))}
          >
            Back to exam
            <span className="sr-only">, {codeOf(exam.course)}</span>
          </a>
        </Button>
      </div>
    </Alert>
  )
}

/**
 * "New C952 questions" (Info, role="note"), for the rest of the visit that first moved from the private bank, with
 * marks, to the 60 original questions (NEW_C952_QUESTIONS). On Home below the hero and at the top of C952's Learn.
 */
export function NewQuestionsNotice({ className }: { className?: string }) {
  return (
    <Alert role="note" className={className}>
      <Info className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>New C952 questions</AlertTitle>
      <AlertDescription>
        The C952 questions were replaced with 60 original practice questions, so your C952 marks start over. Your exam
        log stays.
      </AlertDescription>
    </Alert>
  )
}

/** The slug as the Alert shows it: upper-cased, cut at 12 characters with "…". */
export function notFoundText(slug: string): string {
  const chars = Array.from(slug.toUpperCase())
  return chars.length > 12 ? `${chars.slice(0, 12).join("")}…` : chars.join("")
}

/**
 * "Course not found" (SearchX, role="alert"), on `#courses` between the header and the stats, after a link to an
 * unknown course. `delayed` (a load rewrite: a pasted or bookmarked link) mounts it with no words and fills its title
 * and description NOT_FOUND_FILL_DELAY ms later, because a role="alert" present at first render is often not
 * announced and a load rewrite moves no focus. After an in-app link it renders whole.
 */
export function CourseNotFoundNotice({
  slug,
  delayed = false,
  className,
}: {
  slug: string
  delayed?: boolean
  className?: string
}) {
  const [filled, setFilled] = useState(!delayed)
  useEffect(() => {
    if (filled) return
    const t = setTimeout(() => setFilled(true), NOT_FOUND_FILL_DELAY)
    return () => clearTimeout(t)
  }, [filled])
  return (
    <Alert role="alert" className={className}>
      <SearchX className="h-4 w-4" aria-hidden="true" />
      {/* a no-break space holds each line's height until the words arrive, so nothing jumps */}
      <AlertTitle>{filled ? "Course not found" : " "}</AlertTitle>
      <AlertDescription>
        {filled ? `There's no course called “${notFoundText(slug)}”. Pick one below.` : " "}
      </AlertDescription>
    </Alert>
  )
}
