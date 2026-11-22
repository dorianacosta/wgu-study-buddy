/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * My Misses: every question you got wrong in Learn or an exam, most-missed first.
 * Each card (the question-tool frame from components/question) shows the prompt; the answer and the full breakdown
 * sit in a single-item Accordion. Empty: serafimcloud's empty-state. Clearing asks first in an AlertDialog.
 * Monochrome: the answer is a success badge with a check, "Missed N×" a secondary badge with the count in mono.
 * Gold: the header's "Quiz me on my misses" is the view's one filled primary; its repeat at the end is outline.
 */
import { useId, useRef, useState } from "react"
import { ArrowRight, Check, Eraser, Target } from "lucide-react"
import { QUESTIONS, QUESTION_BY_N, TOPICS, TOPIC_BY_ID, correctOf, type Question } from "@/data"
import { hrefFor } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { C952MissesProps } from "@/views/types"
import { ExamInProgressNotice } from "@/components/notices"
import { Explanation, QuestionFrame, QuestionMeta, QuestionText } from "@/components/question"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button, buttonVariants } from "@/components/ui/button"
import { DecryptText } from "@/components/ui/decrypt-text"
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"

/* Type styles (Surfaces, Style shorthand) */
const PAGE_TITLE = "My Misses"
/** `label`: the kicker and the "By topic" eyebrow */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
/** the Title decrypt recipe's className (`title`) */
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
const LEAD = "mt-4 max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"

/** Question numbers zero-padded to the bank's width (01 to 60). */
const padQ = (n: number) => String(n).padStart(String(QUESTIONS.length).length, "0")

function MissCard({ q, count }: { q: Question; count: number }) {
  const topic = TOPIC_BY_ID[q.t]
  const TopicIcon = topic.icon
  const answer = correctOf(q)
    .map((i) => q.o[i])
    .join(" + ")
  const [open, setOpen] = useState("")
  const headingId = useId()

  return (
    <QuestionFrame className="my-0" aria-labelledby={headingId}>
      {/* the h2 sits where the card's "Question" label sits, so it takes the header's `label` style */}
      <QuestionMeta>
        <h2 id={headingId}>Question {padQ(q.n)}</h2>
        <Badge variant="outline" size="sm">
          <TopicIcon aria-hidden="true" />
          {topic.name}
        </Badge>
        <Badge variant="secondary" size="sm">
          Missed
          <span aria-hidden="true" className="font-mono">
            {count}×
          </span>
          <span className="sr-only">
            {count} {count === 1 ? "time" : "times"}
          </span>
        </Badge>
      </QuestionMeta>

      <QuestionText html={q.q} code={q.code} />

      <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
        <AccordionItem value="breakdown" className="border-b-0">
          {/* Every card's toggle has the same visible label, so screen readers also hear which question it opens. */}
          <AccordionTrigger>
            <span>
              {open ? "Hide" : "Show"} the full breakdown<span className="sr-only"> for question {q.n}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" appearance="light">
                <Check aria-hidden="true" />
                Answer
              </Badge>
              <span
                className={cn(
                  "font-semibold break-words text-foreground",
                  q.mono && "font-mono text-sm leading-6 whitespace-pre-wrap",
                )}
              >
                {answer}
              </span>
            </div>
            <Explanation q={q} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </QuestionFrame>
  )
}

export default function Misses({ navigate, store, update, startExam, runningExam }: C952MissesProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const justCleared = useRef(false)
  const emptyRef = useRef<HTMLDivElement>(null)
  const byTopicLabel = useId()

  // Most-missed first, then by question number. Numbers no longer in the bank (old saves) are skipped.
  const items = Object.entries(store.miss)
    .map(([n, count]) => ({ q: QUESTION_BY_N[Number(n)], count }))
    .filter((it) => Boolean(it.q))
    .sort((a, b) => b.count - a.count || a.q.n - b.q.n)
  const total = items.length

  // Weakest topics first; ties keep curriculum order (sort is stable).
  const byTopic = TOPICS.map((t) => ({ t, count: items.filter((it) => it.q.t === t.id).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
  const showByTopic = byTopic.length > 1

  // Clearing removes the button that opened the dialog, so keyboard focus goes to the empty state's action instead.
  // It moves when the dialog has closed (its close-focus hook): while the dialog is up the page behind it is
  // aria-hidden, and focusing into it then draws a console warning (and focus would sit inside hidden content).
  const focusAfterClose = (e: Event) => {
    if (!justCleared.current) return
    justCleared.current = false
    const action = emptyRef.current?.querySelector<HTMLButtonElement>("button")
    if (!action) return
    e.preventDefault()
    action.focus()
  }

  const quiz = () => startExam("miss")

  const clear = () => {
    justCleared.current = true
    update((d) => {
      d.miss = {}
    })
    setConfirmOpen(false)
  }

  return (
    // The dialog root wraps the page so its Trigger can sit in the header; it renders no element of its own.
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      {/* While a C952 exam runs: the exam Alert at the top (decision 28), taking the header's top margin; the header
          then mt-8 (CONTRACTS, open question 17) */}
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className="mt-12 sm:mt-16 short:mt-6" />
      {/* The page header: nothing frames it (it sits on the dimmed field) and it takes no BlurFade, since the h1
          decrypt is its one entrance */}
      <header className={runningExam ? "mt-8" : "mt-12 sm:mt-16 short:mt-6"}>
        <p className={LABEL}>C952 · Weak spots</p>
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
        {total > 0 && (
          <>
            <p className={LEAD}>
              <span className="font-mono text-sm text-foreground">{total}</span> {total === 1 ? "question" : "questions"} to
              review, most-missed first. Get one right in an exam and it drops off the list.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button onClick={quiz} data-focus-key="misses:quiz">
                Quiz me on my misses
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Eraser className="mr-2 h-4 w-4" aria-hidden="true" />
                  Clear list
                </Button>
              </AlertDialogTrigger>
            </div>
          </>
        )}
      </header>

      {total === 0 ? (
        <BlurFade delay={0.08} className="mt-8">
          {/* the focus key sits on the wrapper: EmptyState gives no access to its action (CONTRACTS, convention 3) */}
          <div ref={emptyRef} className="flex justify-center" data-focus-key="misses:exam">
            <EmptyState
              icons={[Target]}
              title="Nothing here yet"
              description="Questions you get wrong in Learn or in an exam show up here, so you can hit your weak spots."
              action={{
                label: "Take a practice exam",
                // it names the exam, so it opens the mode picker, never Flashcards (decision 57)
                onClick: () => navigate(hrefFor("exam", "c952"), { practiceMode: "questions" }),
              }}
            />
          </div>
        </BlurFade>
      ) : (
        <>
          {showByTopic && (
            <BlurFade delay={0.08} className="mt-8">
              <Separator />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6">
                <p id={byTopicLabel} className={LABEL}>
                  By topic
                </p>
                {/* role="list": Safari drops list semantics from unstyled lists */}
                <ul role="list" aria-labelledby={byTopicLabel} className="flex flex-wrap gap-2">
                  {byTopic.map(({ t, count }) => {
                    const Icon = t.icon
                    return (
                      <li key={t.id}>
                        <Badge variant="outline" size="lg">
                          <Icon aria-hidden="true" />
                          <span>{t.name}</span>
                          <span className="font-mono">
                            {count}
                            <span className="sr-only"> to review</span>
                          </span>
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </BlurFade>
          )}

          <ol
            role="list"
            aria-label="Questions to review"
            className={cn("grid grid-cols-1 gap-4", showByTopic ? "mt-6" : "mt-8")}
          >
            {items.map(({ q, count }, i) => (
              <li key={q.n}>
                <BlurFade inView delay={i < 5 ? 0.1 + i * 0.05 : 0}>
                  <MissCard q={q} count={count} />
                </BlurFade>
              </li>
            ))}
          </ol>

          {/* Long lists: the next step is waiting at the bottom, no scrolling back up. Outline: the header's
              "Quiz me on my misses" is the view's one gold fill. */}
          {total >= 4 && (
            <BlurFade inView>
              <Separator className="mt-14" />
              <div className="flex flex-col items-center gap-4 pt-12 text-center">
                <p className="font-sans text-muted-foreground">
                  <span className="font-semibold text-foreground">Done reviewing?</span> Quiz yourself while it's fresh.
                </p>
                <Button variant="outline" onClick={quiz} data-focus-key="misses:quiz-end">
                  Quiz me on my misses
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </BlurFade>
          )}
        </>
      )}

      {/* Always mounted (the root wraps the page), so the close animation can play after the list empties. */}
      <AlertDialogContent onCloseAutoFocus={focusAfterClose}>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear your C952 misses list?</AlertDialogTitle>
          <AlertDialogDescription>This only resets the review list. Mastered marks stay.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={clear}>
            Clear it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
