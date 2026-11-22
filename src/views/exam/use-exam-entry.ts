/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * What `#exam/<course>` shows for App's one exam slot (decisions 57 and 60), for C952's Exam view and a guide's
 * Practice alike. Only an exam of this course counts: another course's exam keeps running in App, and this page shows
 * its own modes (with that exam's Alert on top).
 *
 * - The course's running exam takes the page, in the Exam mode, whatever the entry names, so Quit comes back to the
 *   mode picker.
 * - Its finished exam shows Results, unless the entry names Questions or Flashcards ("Practice my misses", "Drill as
 *   flashcards", Back or Forward to such an entry): then the finished exam is dropped, as "Other modes" does, and that
 *   mode shows from the first frame.
 * - Decided once, when the entry opens (examEntryOpens): an exam started and submitted later on this entry keeps its
 *   Results.
 *
 * The mode lives here for the page's whole entry, since the start screen unmounts while an exam runs, and rides on
 * the entry (patchEntry), so reload, Back and Forward reopen it. `fit` maps a mode the page has no data for to one it
 * has (a guide's Practice, once its guide is loaded).
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import type { PracticeMode } from "@/lib/course"
import type { Exam } from "@/lib/exam"
import { examEntryOpens, patchEntry, type EntryState } from "@/lib/routes"

export interface ExamEntry {
  /** This course's exam to show (running or finished), or null for the page's modes */
  shown: Exam | null
  /** The mode shown: Exam while an exam shows */
  mode: PracticeMode
  setMode: (mode: PracticeMode) => void
}

export function useExamEntry(
  course: string,
  exam: Exam | null,
  setExam: Dispatch<SetStateAction<Exam | null>>,
  entry: Readonly<EntryState>,
  fit: (mode: PracticeMode) => PracticeMode = (mode) => mode,
): ExamEntry {
  const [opens] = useState(() => examEntryOpens(exam, course, entry))
  const [dropping, setDropping] = useState(opens.dropResults)
  const mine = exam && exam.course === course ? exam : null
  const shown = dropping ? null : mine
  const [mode, setMode] = useState<PracticeMode>(() => fit(opens.mode))
  if (shown && mode !== "exam") setMode("exam")
  // the finished exam leaves App (and its session) after the first render, which already shows the mode named
  useEffect(() => {
    if (!dropping) return
    setExam((e) => (e?.done && e.course === course ? null : e))
    setDropping(false)
  }, [dropping, setExam, course])
  // the entry follows the mode shown, an exam's Exam included, so reload, Back and Forward reopen it
  useEffect(() => patchEntry({ practiceMode: mode }), [mode])
  return { shown, mode, setMode }
}
