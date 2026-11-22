/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { useState } from "react"
import { C952, type CardFilter } from "@/lib/course"
import { C952_BANK } from "@/lib/exam"
import { initialCardFilter } from "@/lib/routes"
import type { C952ExamProps } from "@/views/types"
import { C952_CONTENT } from "@/views/exam/content"
import { useExamEntry } from "@/views/exam/use-exam-entry"
import Setup from "@/views/exam/Setup"
import Runner from "@/views/exam/Runner"
import Results from "@/views/exam/Results"

/**
 * Practice Exam (`#exam/c952`): mode picker → live exam → debrief. The exam object lives in App (one exam slot for the
 * whole app, decision 60) so it survives page changes. Setup's "Practice with" mode (Exam, the mode picker; or
 * Flashcards, C952's deck; decisions 57 and 60) and its Flashcards list live here, for the page's whole entry, since
 * Setup unmounts while an exam runs; both ride on the history entry. useExamEntry decides what shows: C952's running
 * exam takes the page, on Exam; its finished exam shows Results unless the entry names Flashcards, which drops it, as
 * "Other modes" does. Another course's running exam leaves this page on its own modes, with that exam's Alert on top.
 */
export default function ExamView({ navigate, exam, setExam, store, update, entry, startExam, submit, runningExam }: C952ExamProps) {
  const { shown, mode, setMode } = useExamEntry(C952, exam, setExam, entry)
  const [cardFilter, setCardFilter] = useState<CardFilter>(() => initialCardFilter(C952, entry))

  if (!shown)
    return (
      <Setup
        navigate={navigate}
        runningExam={runningExam}
        store={store}
        update={update}
        startExam={startExam}
        practiceMode={mode}
        onPracticeMode={setMode}
        cardFilter={cardFilter}
        onCardFilter={setCardFilter}
      />
    )
  if (!shown.done) return <Runner exam={shown} setExam={setExam} submit={submit} content={C952_CONTENT} />
  return <Results exam={shown} setExam={setExam} startExam={startExam} bank={C952_BANK} content={C952_CONTENT} />
}
