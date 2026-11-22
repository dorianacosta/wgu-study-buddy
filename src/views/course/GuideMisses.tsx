/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * `#misses/<slug>` for a guide course (decision 24; CourseTools, My Misses): the practice questions marked missed, in
 * guide order, each with its answer in a single-item Accordion. Its counts are questions only: flashcard marks never
 * count here (decision 57). "Quiz me on my misses", the view's one gold fill as on C952's, starts the course's My
 * misses exam (decision 60) when a missed question can be graded in one (guide-exam.tsx); a self-graded miss stays
 * for "Practice my misses", which opens Practice on Questions, Missed list. The empty state's "Start practicing"
 * opens Questions too, whichever mode Practice last showed; "Clear list" asks first, then deletes every `false` of
 * the course (clearMisses). As C952's Misses.tsx: the question-tool frame, serafimcloud's empty-state, the
 * AlertDialog, and another course's exam-in-progress Alert above the header (one exam at a time).
 */
import { useId, useRef, useState } from "react"
import { ArrowRight, Check, Eraser, Target, X } from "lucide-react"
import { codeOf, courseInfo } from "@/lib/course"
import { hrefFor, onPlainClick } from "@/lib/routes"
import { clearMisses } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { GuideMissesProps } from "@/views/types"
import {
  GuideAnswer,
  GuideRich,
  HEADER,
  HEADER_AFTER_NOTICE,
  LABEL,
  LEAD,
  PROSE,
  PageTitle,
  StaticChoices,
  correctChoice,
  letter,
  padTo,
  type Guide,
  type Practice,
} from "@/views/course/shared"
import { GuideGate } from "@/views/course/GuideGate"
import { GuidePending } from "@/views/course/GuideLearn"
import { guideBank } from "@/views/course/guide-exam"
import { ExamInProgressNotice } from "@/components/notices"
import { QuestionFrame, QuestionMeta } from "@/components/question"
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
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"

function MissCard({ item, index, total }: { item: Practice; index: number; total: number }) {
  const [open, setOpen] = useState("")
  const headingId = useId()
  const num = padTo(index + 1, total)
  const right = correctChoice(item.answer, item.choices)

  return (
    <QuestionFrame className="my-0" aria-labelledby={headingId}>
      {/* the h2 sits where the card's "Question" label sits, so it takes the header's `label` style */}
      <QuestionMeta>
        <h2 id={headingId}>Question {num}</h2>
        <Badge variant="destructive" appearance="light" size="sm">
          <X aria-hidden="true" />
          Missed
        </Badge>
      </QuestionMeta>

      <GuideRich html={item.q} className={cn("my-2 text-base whitespace-pre-line break-words", PROSE)} />
      <StaticChoices choices={item.choices} />

      <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
        <AccordionItem value="answer" className="border-b-0">
          {/* every card's toggle has the same visible label, so screen readers also hear which question it opens */}
          <AccordionTrigger>
            <span>
              {open ? "Hide" : "Show"} the answer<span className="sr-only"> for question {num}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {right !== null && (
              <Badge variant="success" appearance="light">
                <Check aria-hidden="true" />
                {letter(right)}
              </Badge>
            )}
            <GuideAnswer item={item} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </QuestionFrame>
  )
}

export function GuideMisses(props: GuideMissesProps) {
  const notice = !!props.runningExam
  return (
    <>
      <ExamInProgressNotice exam={props.runningExam} navigate={props.navigate} className={HEADER} />
      <GuideGate course={props.course} title="My Misses" afterNotice={notice}>
        {(guide) => <GuideMissesPage {...props} guide={guide} />}
      </GuideGate>
    </>
  )
}

function GuideMissesPage({
  course,
  navigate,
  store,
  update,
  startExam,
  runningExam,
  guide,
}: GuideMissesProps & { guide: Guide | null }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const justCleared = useRef(false)
  const emptyRef = useRef<HTMLDivElement>(null)
  const info = courseInfo(course)
  if (!guide || !info) return <GuidePending course={course} navigate={navigate} afterNotice={!!runningExam} />

  const code = codeOf(course)
  const total = guide.practice.length
  const marks = store.courses?.[course]?.practice
  // decision 25: the `false` marks with an index below N, in guide order
  const items = guide.practice.flatMap((item, i) => (marks?.[i] === false ? [{ item, i }] : []))
  const n = items.length
  const practice = hrefFor("exam", course)
  // Questions named outright: a Flashcards mode remembered from this visit would hide the missed questions
  const practiceMisses = () => navigate(practice, { practiceFilter: "missed", practiceMode: "questions" })
  const startPracticing = () => navigate(practice, { practiceMode: "questions" })
  // the My misses exam: the misses an exam can grade (a self-graded one stays for Practice's Questions)
  const bank = guideBank(course, guide)
  const quizzable = bank.missed(store).length > 0
  const quiz = () => startExam(bank, "miss")

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

  const clear = () => {
    justCleared.current = true
    update((d) => clearMisses(d, course))
    setConfirmOpen(false)
  }

  return (
    // The dialog root wraps the page so its Trigger can sit in the header; it renders no element of its own.
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <header className={runningExam ? HEADER_AFTER_NOTICE : HEADER}>
        <p className={LABEL}>{code} · Weak spots</p>
        <PageTitle text="My Misses" />
        {/* the lead and the actions only when there is something to review: the empty state carries its own */}
        {n > 0 && (
          <>
            <p className={cn(LEAD, "mt-4")}>
              <span className="font-mono text-sm text-foreground">{n}</span> {n === 1 ? "question" : "questions"} to
              review. Get one right in Practice and it drops off the list.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {quizzable && (
                <Button onClick={quiz} data-focus-key="misses:quiz">
                  Quiz me on my misses
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {/* outline beside the quiz, which is then the view's one gold fill */}
              <Button variant={quizzable ? "outline" : "default"} asChild>
                <a href={practice} data-focus-key="misses:practice" onClick={onPlainClick(practiceMisses)}>
                  Practice my misses
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
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

      {n === 0 ? (
        <BlurFade delay={0.08} className="mt-8">
          {/* EmptyState gives no access to its button: the focus key sits on this wrapper (convention 3) */}
          <div ref={emptyRef} data-focus-key="misses:start-practicing" className="flex justify-center">
            <EmptyState
              icons={[Target]}
              title="Nothing here yet"
              description={`Questions you miss in ${code} Practice show up here, so you can hit your weak spots.`}
              action={{ label: "Start practicing", onClick: startPracticing }}
            />
          </div>
        </BlurFade>
      ) : (
        <>
          <ol role="list" aria-label="Questions to review" className="mt-8 grid grid-cols-1 gap-4">
            {items.map(({ item, i }, k) => (
              <li key={i}>
                <BlurFade inView delay={k < 5 ? 0.1 + k * 0.05 : 0}>
                  <MissCard item={item} index={i} total={total} />
                </BlurFade>
              </li>
            ))}
          </ol>

          {/* Long lists: the next step waits at the bottom. Outline: the header's button is the view's one gold fill. */}
          {n >= 4 && (
            <BlurFade inView>
              <Separator className="mt-14" />
              <div className="flex flex-col items-center gap-4 pt-12 text-center">
                <p className="font-sans text-muted-foreground">
                  <span className="font-semibold text-foreground">Done reviewing?</span>{" "}
                  {quizzable ? "Quiz yourself while they're fresh." : "Practice them while they're fresh."}
                </p>
                {quizzable ? (
                  <Button variant="outline" onClick={quiz} data-focus-key="misses:quiz-end">
                    Quiz me on my misses
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <a href={practice} data-focus-key="misses:practice-end" onClick={onPlainClick(practiceMisses)}>
                      Practice my misses
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>
            </BlurFade>
          )}
        </>
      )}

      {/* Always mounted (the root wraps the page), so the close animation can play after the list empties. */}
      <AlertDialogContent onCloseAutoFocus={focusAfterClose}>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear your {code} misses list?</AlertDialogTitle>
          <AlertDialogDescription>This only resets the review list. Got-it marks stay.</AlertDialogDescription>
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
