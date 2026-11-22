/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { useEffect, useState } from "react"
import { C952, type CardFilter, type PracticeMode } from "@/lib/course"
import { examEntryOpens, initialCardFilter, patchEntry } from "@/lib/routes"
import type { C952ExamProps } from "@/views/types"
import Setup from "@/views/exam/Setup"
import Runner from "@/views/exam/Runner"
import Results from "@/views/exam/Results"

/**
 * Practice Exam (`#exam/c952`): mode picker → live exam → debrief. The exam object lives in App so it survives page
 * changes. Setup's "Practice with" mode (Questions, the mode picker; or Flashcards, C952's deck; decision 57) and its
 * Flashcards list live here, for the page's whole entry, since Setup unmounts while an exam runs; both ride on the
 * history entry. A running exam takes the page, on Questions. A finished exam shows its Results unless the entry names
 * Flashcards, which drops it, as "Other modes" does (examEntryOpens). While an exam shows, the mode is Questions, so
 * Quit and "Other modes" come back to the mode picker.
 */
export default function ExamView({ exam, setExam, store, update, entry, startExam, submit }: C952ExamProps) {
  // decided once, when the entry opens: an exam started and submitted later on this entry keeps its Results
  const [opens] = useState(() => examEntryOpens(exam, entry))
  const [dropping, setDropping] = useState(opens.dropResults)
  const shown = dropping ? null : exam
  const [mode, setMode] = useState<PracticeMode>(opens.mode)
  const [cardFilter, setCardFilter] = useState<CardFilter>(() => initialCardFilter(C952, entry))
  if (shown && mode !== "questions") setMode("questions")
  // the finished exam leaves App (and its session) after the first render, which already shows Flashcards
  useEffect(() => {
    if (!dropping) return
    setExam((e) => (e?.done ? null : e))
    setDropping(false)
  }, [dropping, setExam])
  // the entry follows the mode shown, an exam's Questions included, so reload, Back and Forward reopen it
  useEffect(() => patchEntry({ practiceMode: mode }), [mode])

  if (!shown)
    return (
      <Setup
        store={store}
        update={update}
        startExam={startExam}
        practiceMode={mode}
        onPracticeMode={setMode}
        cardFilter={cardFilter}
        onCardFilter={setCardFilter}
      />
    )
  if (!shown.done) return <Runner exam={shown} setExam={setExam} submit={submit} />
  return <Results exam={shown} setExam={setExam} startExam={startExam} />
}
