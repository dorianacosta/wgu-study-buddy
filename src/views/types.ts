/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** The props every view takes from App (_build/CONTRACTS.md, View props). */
import type { Dispatch, SetStateAction } from "react"
import type { Store, Update } from "@/lib/store"
import type { Exam, ExamBank, ExamMode } from "@/lib/exam"
import type { EntryState, Navigate } from "@/lib/routes"
import type { RunningExam } from "@/lib/exam-session"
import type { CardFilter, PracticeMode } from "@/lib/course"
import type { ExamContent } from "@/views/exam/content"

export { VIEWS, type View, type Route, type ToolView, type EntryState, type EntryPatch, type Navigate } from "@/lib/routes"
export type { RunningExam } from "@/lib/exam-session"

/**
 * Starts an exam from a course's bank (decision 60) and opens `#exam/<that course>` on Exam. One exam at a time for
 * the whole app: while any course's exam has answers, App asks first.
 */
export type StartExam = (bank: ExamBank, mode: ExamMode, opt?: { topic?: string }) => void

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

/** The pages that show the "{CODE} exam in progress" Alert while an exam runs (decisions 28 and 60). */
export interface WithRunningExam {
  /**
   * The exam that is started and not submitted, of any course (runningExamOf(exam) in src/lib/exam-session.ts), or
   * null; App passes null on `#exam/<its course>`, where the exam itself shows
   */
  runningExam: RunningExam | null
}

/** The pages that show the "New C952 questions" Alert for the rest of the visit (decision 8). */
export interface WithNewQuestions {
  /** NEW_C952_QUESTIONS from src/lib/store.ts */
  newQuestions: boolean
}

/** The pages that run an exam (`#exam/<slug>`): App's one exam slot (decision 60). */
export interface WithExam {
  exam: Exam | null
  setExam: Dispatch<SetStateAction<Exam | null>>
  startExam: StartExam
  /** Grades the running exam, records it (recordExam) and shows Results */
  submit: () => void
}

/* ── Home and Courses ────────────────────────────────────────────────────── */

/** `#home`. The Alerts below the hero: "New C952 questions", then "{CODE} exam in progress", each mt-6. */
export interface HomeViewProps extends PageProps, WithRunningExam, WithNewQuestions {}

/** `#courses`. Between the header and the stats (mt-8): "Course not found", then "{CODE} exam in progress". */
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
 * `#exam/c952`: Setup, the running exam, Results. The start screen's "Practice with" mode (Exam, the mode picker, or
 * Flashcards; decisions 57 and 60) and Flashcards list: useExamEntry and initialCardFilter, kept by the Exam view and
 * written back with patchEntry ({ practiceMode }, { cardFilter }). C952's exam shown is Exam's; an entry that names
 * Flashcards drops a finished exam's Results (setExam(null)) and opens them. Another course's running exam shows its
 * Alert at the top of the start screen.
 */
export interface C952ExamProps extends PageProps, WithRunningExam, WithExam {}

/** Setup, inside `#exam/c952` (rendered by the Exam view, not by App): the exam's mode picker, or C952's flashcards. */
export interface C952ExamSetupProps extends WithRunningExam {
  navigate: Navigate
  store: Store
  update: Update
  startExam: StartExam
  /** "Practice with": Exam (the mode picker, as before) or Flashcards (C952_CARDS) */
  practiceMode: PracticeMode
  onPracticeMode: (mode: PracticeMode) => void
  /** The Flashcards list, kept by the Exam view so that it outlives Setup while an exam runs */
  cardFilter: CardFilter
  onCardFilter: (filter: CardFilter) => void
}

/** The running exam, inside `#exam/<slug>`, C952's or a guide's (decision 60). */
export interface ExamRunnerProps {
  exam: Exam
  setExam: Dispatch<SetStateAction<Exam | null>>
  submit: () => void
  /** How the exam's course renders its stems, choices and labels (src/views/exam/content.tsx) */
  content: ExamContent
}

/** Results, inside `#exam/<slug>`, C952's or a guide's (decision 60). */
export interface ExamResultsProps {
  exam: Exam
  setExam: Dispatch<SetStateAction<Exam | null>>
  startExam: StartExam
  /** The bank the exam came from, for Retake */
  bank: ExamBank
  /** How the exam's course renders its stems, choices, breakdowns and labels (src/views/exam/content.tsx) */
  content: ExamContent
}

/** `#misses/c952`. Top Alert: exam in progress. */
export interface C952MissesProps extends PageProps, WithRunningExam {
  startExam: StartExam
}

/* ── The four tools of a guide course (CourseTools) ─────────────────────── */

/**
 * `#learn/<slug>`: the study guide. Tab: initialLearnTab(course, entry, tabsWithData), written back with
 * patchEntry({ courseTab }). Top Alert: exam in progress.
 */
export type GuideLearnProps = PageProps & WithRunningExam

/** `#cheat/<slug>`: The exam, Key facts, Pitfalls. Top Alert: exam in progress. */
export type GuideCheatProps = PageProps & WithRunningExam

/**
 * `#exam/<slug>`: the practice exam (decision 60), Questions graded in place, or Flashcards from the guide's keyFacts
 * (decision 57). Mode: useExamEntry(course, exam, setExam, entry); lists: initialPracticeFilter and initialCardFilter;
 * each written back with patchEntry ({ practiceMode }, { practiceFilter }, { cardFilter }). Top Alert: another
 * course's exam in progress.
 */
export type GuidePracticeProps = PageProps & WithRunningExam & WithExam

/** `#misses/<slug>`: the practice questions marked missed, with "Quiz me on my misses". Top Alert: exam in progress. */
export interface GuideMissesProps extends PageProps, WithRunningExam {
  startExam: StartExam
}

/** All four tools of a course with no usable guide: "Study guide in progress", action "All courses" (decision 26). */
export interface GuidePendingProps {
  course: string
  navigate: Navigate
  /** The exam-in-progress Alert sits above the header, which then takes mt-8 */
  afterNotice?: boolean
}
