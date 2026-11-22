/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The Practice Exam's start screen (`#exam/c952` with no C952 exam shown; the Exam view renders it). Its header's
 * "Practice with" (decisions 57 and 60) picks Exam, the exam's mode picker as it always was (ExamPicker over C952's
 * bank: modes, the Shortcuts row, "Start exam", the logbook), or Flashcards: C952's formulas, signal words and ARM
 * reference as cards (C952_CARDS), in Practice's Flashcards (GuideFlashcards), marked in `courses.c952.cards`. The
 * header's lead follows the mode, and a switch moves no focus and shows the other mode at once; each mode's windows
 * fade in only when it is the page's first view. While another course's exam runs, its Alert sits above the header
 * (one exam at a time, decision 60).
 */
import { useState } from "react"
import { C952_CARDS } from "@/data"
import { C952, type PracticeMode } from "@/lib/course"
import { C952_BANK } from "@/lib/exam"
import { cardCounts } from "@/lib/store"
import type { SetupProps } from "@/views/exam/props"
import { C952_CONTENT } from "@/views/exam/content"
import { ExamPicker } from "@/views/exam/ExamPicker"
import { GuideFlashcards } from "@/views/course/GuideFlashcards"
import { PracticeWith } from "@/views/course/PracticeWith"
import { percent } from "@/views/course/shared"
import { ExamInProgressNotice } from "@/components/notices"
import { DecryptText } from "@/components/ui/decrypt-text"
import { Progress } from "@/components/ui/progress"

/** Type styles (Surfaces, Style shorthand). `body` is mono, so only the sans lead opts in. */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
const LEAD = "mt-4 max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"
/** The page h1: Surfaces' Title decrypt recipe (`title` style). */
const PAGE_TITLE = "Practice Exam"
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
/** The page header's top margin; mt-8 under the exam-in-progress Alert, which then takes it (as on the Cheat Sheet). */
const TOP = "mt-12 sm:mt-16 short:mt-6"

export default function Setup({
  navigate,
  runningExam,
  store,
  update,
  startExam,
  practiceMode,
  onPracticeMode,
  cardFilter,
  onCardFilter,
}: SetupProps) {
  // each mode's windows fade in with the page only: a "Practice with" switch is a change of state, so it is instant
  const [switched, setSwitched] = useState(false)
  const fade = !switched

  // Flashcards: C952's deck, counted as a guide's (cardCounts), its knew-it share in the header's Progress
  const cards = practiceMode === "cards"
  const cardTotal = C952_CARDS.length
  const deck = cardCounts({ slug: C952, cardTotal }, store)
  const knewPct = percent(deck.knew, cardTotal)
  // the switch moves no focus: it stays on the radio, and the radios stay mounted in the header
  const choosePractice = (next: PracticeMode) => {
    if (next === practiceMode) return
    onPracticeMode(next)
    setSwitched(true)
  }

  return (
    <>
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className={TOP} />
      <header className={runningExam ? "mt-8" : TOP}>
        <p className={LABEL}>C952 · Simulation</p>
        {/* Title decrypt (Surfaces): tabIndex -1 keeps the App's route-change focus landing on `#app h1` */}
        <DecryptText
          as="h1"
          text={PAGE_TITLE}
          variant="display"
          trigger="mount"
          loop={false}
          retriggerOnHover={false}
          glyphs="0123456789ABCDEF"
          speed={45}
          stagger={Math.min(40, Math.round(1000 / PAGE_TITLE.length))}
          startDelay={150}
          jitter={80}
          tabIndex={-1}
          className={TITLE}
        />
        {/* the lead of the mode shown, as on a guide's Practice */}
        {cards ? (
          <p className={LEAD}>
            <span className="font-mono text-sm text-foreground">{cardTotal}</span> cards ·{" "}
            <span className="font-mono text-sm text-foreground">{deck.knew}</span> knew it ·{" "}
            <span className="font-mono text-sm text-foreground">{deck.again}</span> to study again
          </p>
        ) : (
          <p className={LEAD}>Pick a mode. Answer choices are shuffled so you learn the ideas, not the letter positions.</p>
        )}
        <PracticeWith
          mode={cards ? "cards" : "exam"}
          onChange={choosePractice}
          options={[
            { mode: "exam", count: C952_BANK.questions.length },
            { mode: "cards", count: cardTotal },
          ]}
        />
        {cards && (
          <div className="mt-6 flex max-w-[520px] items-center gap-4">
            <Progress
              className="flex-1"
              value={knewPct}
              aria-label="Knew it"
              aria-valuenow={knewPct}
              aria-valuetext={`${deck.knew} of ${cardTotal} knew it`}
            />
            <span className="w-10 text-right font-mono text-sm text-muted-foreground">{knewPct}%</span>
          </div>
        )}
      </header>

      {cards ? (
        // one card at a time, as a guide's Flashcards: the lists, status line and focus moves are the same
        <GuideFlashcards
          slug={C952}
          facts={C952_CARDS}
          counts={deck}
          store={store}
          update={update}
          filter={cardFilter}
          onFilter={onCardFilter}
          enter={fade}
        />
      ) : (
        // Exam: the exam's mode picker, as it always was; after a switch back here its windows are there at once
        <ExamPicker bank={C952_BANK} content={C952_CONTENT} store={store} startExam={startExam} fade={fade} />
      )}
    </>
  )
}
