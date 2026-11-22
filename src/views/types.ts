/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** The props every view takes from App (_build/CONTRACTS.md, View props). */
import type { Dispatch, SetStateAction } from "react"
import type { Store, Update } from "@/lib/store"
import type { Exam, ExamMode } from "@/lib/exam"
import type { TopicId } from "@/data"
import type { EntryState, Navigate } from "@/lib/routes"
import type { RunningExam } from "@/lib/exam-session"
import type { CardFilter, PracticeMode } from "@/lib/course"

export { VIEWS, type View, type Route, type ToolView, type EntryState, type EntryPatch, type Navigate } from "@/lib/routes"
export type { RunningExam } from "@/lib/exam-session"

/** Starts a C952 exam (App asks first when one with answers is running) and opens `#exam/c952`. */
export type StartExam = (mode: ExamMode, opt?: { topic?: TopicId }) => void

/** What every page gets from App. */
export interface PageProps {
  /** The active course's slug ("d281"). On a tool page it is the route's course: the URL wins (decision 6). */
  course: string
  /** Pushes one history entry per change of page; on the current page it scrolls to the top (src/lib/routes.ts). */
  navigate: Navigate
  store: Store
  update: Update
  /**
   * The current history entry's state when the page was entered: read the initial tab, topic or list from it
   * (initialLearnTab, initialLearnTopic, initialPracticeFilter); write changes with patchEntry. App keys each page by
   * `entry.id`, so a page mounts once per entry.
   */
  entry: Readonly<EntryState>
}

/** The pages that show the "C952 exam in progress" Alert while a C952 exam runs (decision 28). */
export interface WithRunningExam {
  /** The C952 exam that is started and not submitted (runningExamOf(exam) in src/lib/exam-session.ts), or null */
  runningExam: RunningExam | null
}

/** The pages that show the "New C952 questions" Alert for the rest of the visit (decision 8). */
export interface WithNewQuestions {
  /** NEW_C952_QUESTIONS from src/lib/store.ts */
  newQuestions: boolean
}

/* ── Home and Courses ────────────────────────────────────────────────────── */

/** `#home`. The Alerts below the hero: "New C952 questions", then "C952 exam in progress", each mt-6. */
export interface HomeViewProps extends PageProps, WithRunningExam, WithNewQuestions {}

/** `#courses`. Between the header and the stats (mt-8): "Course not found", then "C952 exam in progress". */
export interface CoursesViewProps extends PageProps, WithRunningExam {
  /** The unknown slug from a bad link, decoded, as it arrived (route change `notFound`); null on a normal visit */
  notFound: string | null
  /** True when the bad link came on load (a pasted or bookmarked link): the Alert fills 250 ms after mounting */
  notFoundDelayed: boolean
}

/* ── C952's four tools (unchanged screens at `#<tool>/c952`) ────────────── */

/** `#learn/c952`. Topic: initialLearnTopic(entry), written back with patchEntry({ learnTopic }). Top Alerts: new questions, exam in progress. */
export interface C952LearnProps extends PageProps, WithRunningExam, WithNewQuestions {
  startExam: StartExam
}

/** `#cheat/c952`. Top Alert: exam in progress. */
export type C952CheatProps = PageProps & WithRunningExam

/**
 * `#exam/c952`: Setup, the running exam, Results. Never shows the exam-in-progress Alert. Setup's "Practice with" mode
 * and Flashcards list (decision 57): examEntryOpens(exam, entry) and initialCardFilter, kept by the Exam view and
 * written back with patchEntry ({ practiceMode }, { cardFilter }). An exam shown is Questions'; an entry that names
 * Flashcards drops a finished exam's Results (setExam(null)) and opens them.
 */
export interface C952ExamProps extends PageProps {
  exam: Exam | null
  setExam: Dispatch<SetStateAction<Exam | null>>
  startExam: StartExam
  /** Grades the running exam, records misses and the attempt, and shows Results */
  submit: () => void
}

/** Setup, inside `#exam/c952` (rendered by the Exam view, not by App): the exam's mode picker, or C952's flashcards. */
export interface C952ExamSetupProps {
  store: Store
  update: Update
  startExam: StartExam
  /** "Practice with": Questions (the mode picker, as before) or Flashcards (C952_CARDS) */
  practiceMode: PracticeMode
  onPracticeMode: (mode: PracticeMode) => void
  /** The Flashcards list, kept by the Exam view so that it outlives Setup while an exam runs */
  cardFilter: CardFilter
  onCardFilter: (filter: CardFilter) => void
}

/** The running exam, inside `#exam/c952`. */
export interface C952ExamRunnerProps {
  exam: Exam
  setExam: Dispatch<SetStateAction<Exam | null>>
  submit: () => void
}

/** Results, inside `#exam/c952`. */
export interface C952ExamResultsProps {
  exam: Exam
  setExam: Dispatch<SetStateAction<Exam | null>>
  startExam: StartExam
}

/** `#misses/c952`. Top Alert: exam in progress. */
export interface C952MissesProps extends PageProps, WithRunningExam {
  startExam: StartExam
}

/* ── The four tools of a guide course (CourseTools) ─────────────────────── */

/** `#learn/<slug>`: the study guide. Tab: initialLearnTab(course, entry, tabsWithData), written back with patchEntry({ courseTab }). */
export type GuideLearnProps = PageProps

/** `#cheat/<slug>`: The exam, Key facts, Pitfalls. */
export type GuideCheatProps = PageProps

/**
 * `#exam/<slug>`: Questions graded in place, or Flashcards from the guide's keyFacts (decision 57). Mode:
 * initialPracticeMode(course, entry); lists: initialPracticeFilter and initialCardFilter; each written back with
 * patchEntry ({ practiceMode }, { practiceFilter }, { cardFilter }).
 */
export type GuidePracticeProps = PageProps

/** `#misses/<slug>`: the practice questions marked missed. */
export type GuideMissesProps = PageProps

/** All four tools of a course with no usable guide: "Study guide in progress", action "All courses" (decision 26). */
export interface GuidePendingProps {
  course: string
  navigate: Navigate
}
