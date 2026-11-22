/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Question building blocks shared by C952's Learn, Practice Exam (runner + review) and My Misses, and a guide
 * course's Practice and My Misses.
 *
 * The look is serafimcloud's question-tool (21st.dev, src/components/ui/question-tool.tsx): its frame, its header row
 * with the question icon and "n of N", its title row with the index, its lettered option rows and its footer buttons.
 * QuestionPrompt itself takes plain-text titles and keeps the picks in its own state, so it can't show an HTML prompt,
 * a code block, picks that live in the exam, or right / wrong. QT keeps that file's class strings instead, restyled to
 * the ASCII design language (Surfaces, Questions; design decisions 9 and 11): every neutral is a token, the header
 * reads in the `label` style, stems and options in sans, the letters are keycaps, the footer buttons are the app's
 * Button (ghost, and default for the one submit), and a stem's code is a Terminal window. The header keeps the
 * component's own IconQuestion.
 * Right / wrong: base-badge success / destructive with a Check / X icon and the word, never colour alone. Gold marks
 * only your pick (the selected letter) and the card's one next action (the submit), never the right answer.
 */
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { ArrowRight, Check, CircleCheck, CircleX, Info, Lightbulb, Repeat, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LETTERS, QUESTIONS, correctOf, type Question } from "@/data"
import type { Store, Update } from "@/lib/store"
import { Rich } from "@/components/kit"
import { IconQuestion } from "@/components/ui/question-tool"
import { Badge } from "@/components/ui/base-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Terminal } from "@/components/ui/terminal"

/* ── question-tool classes, from src/components/ui/question-tool.tsx, in tokens ── */

const QT = {
  /** QuestionTool: the frame (a window holding a screen) */
  frame: "rounded-lg border border-border bg-card overflow-hidden",
  /** QuestionTool: the header row, its "Question" group (the `label` style; badges keep their own case) and "n of N" */
  header: "min-h-8 border-b border-border px-3 flex items-center justify-between text-xs text-muted-foreground",
  headerLabel:
    "inline-flex items-center gap-2 font-mono font-medium uppercase tracking-[0.08em] [&_[data-slot=badge]]:normal-case [&_[data-slot=badge]]:tracking-normal",
  headerCount: "inline-flex items-center gap-1 font-mono text-sm text-muted-foreground",
  /** QuestionPrompt: the body (the screen), the title row (`body` sans) and the title's index (`data`, muted) */
  body: "px-3 py-2 space-y-2 bg-background",
  title: "flex items-center gap-2 font-sans text-base text-foreground",
  titleIndex: "h-6 min-w-5 px-1 rounded-xs inline-flex items-center justify-center font-mono text-sm text-muted-foreground",
  /** QuestionPrompt: the option list, an option row, its letter key (off / on = selected) and its label */
  options: "space-y-px",
  /** + v2: 44px rows and the hover's press paint on touch (Responsive, Touch targets; decision 39) */
  optionRow:
    "w-full text-left rounded-sm px-2 py-1.5 flex items-center gap-2 -mx-2 hover:bg-accent pointer-coarse:min-h-11 pointer-coarse:active:bg-accent",
  badgeBase: "size-6 rounded-xs inline-flex items-center justify-center font-mono text-xs border",
  badgeOff: "bg-transparent text-muted-foreground border-muted-foreground",
  badgeOn: "bg-primary text-primary-foreground border-primary",
  optionLabel: "max-w-[68ch] font-sans text-base text-foreground",
  /** a mono question's option label: the `code` style */
  optionMono: "font-mono text-sm leading-6 whitespace-pre-wrap",
  optionDescription: "font-sans text-sm text-muted-foreground",
  /** QuestionPrompt: the footer and its three button looks on the app's Button: Previous and Skip ghost, Submit default */
  footer: "flex items-center gap-2",
  nav: cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-60",
  ),
  skip: cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-60",
  ),
  submit: cn(
    buttonVariants({ size: "sm" }),
    "active:scale-[0.98] transition-[background-color,transform] duration-150 disabled:opacity-60",
  ),
} as const

/** Zero-pads a question number to the width of the bank (01 to 60). */
const padQ = (n: number) => String(n).padStart(String(QUESTIONS.length).length, "0")

/* ── Card frame ─────────────────────────────────────────────────────────── */

/** QuestionMeta children render as the frame's header row; everything else goes in the body. */
const isMeta = (node: ReactNode) => isValidElement(node) && node.type === QuestionMeta

/** The question-tool frame: header row (from a QuestionMeta child) above the body. No brackets: it is read, not pressed. */
export function QuestionFrame({
  accent: _accent,
  className,
  children,
  ...rest
}: ComponentProps<"article"> & {
  /** Ignored, kept so existing callers compile. The question-tool frame has no colored spine; badges carry the state. */
  accent?: string
}) {
  const parts = Children.toArray(children)
  return (
    <article className={cn(QT.frame, "my-4 scroll-mt-28", className)} {...rest}>
      {parts.filter(isMeta)}
      <div className={QT.body}>{parts.filter((p) => !isMeta(p))}</div>
    </article>
  )
}

/**
 * The question-tool header row: its question icon, "Question" in the `label` style and the badges on the left; an
 * optional control (or "n of N") on the right, where a control's Label reads in `foreground`.
 */
export function QuestionMeta({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className={cn(QT.header, "flex-wrap gap-x-4 gap-y-1 py-1")}>
      <div className={cn(QT.headerLabel, "flex-wrap")}>
        <IconQuestion className="w-3.5 h-3.5" />
        {children}
      </div>
      {right && <div className="ml-auto flex items-center gap-2 text-foreground">{right}</div>}
    </div>
  )
}

/** "n of N", as the question-tool header shows it, in the `data` style; n zero-padded to N's width ("03 of 60"). */
export function QuestionCount({ index, total }: { index: number; total: number }) {
  return (
    <span className={QT.headerCount}>
      {String(index).padStart(String(total).length, "0")} of {total}
    </span>
  )
}

/** A stem's code (Surfaces, Code block): a Terminal window titled CODE, the code's lines as output, shown at once. */
function CodeBlock({ code }: { code: string }) {
  const lines = useMemo(() => code.split("\n").map((text) => ({ text, type: "output" as const })), [code])
  return <Terminal title="CODE" lines={lines} typewriter={false} idleCursor={false} />
}

/** The question-tool title row (index + prompt), then the prompt's code, if any, as a Terminal window. */
export function QuestionText({ html, code, index }: { html: string; code?: string; index?: ReactNode }) {
  return (
    <>
      <div className={cn(QT.title, "items-start")}>
        {index !== undefined && <span className={cn(QT.titleIndex, "flex-none")}>{index}</span>}
        <Rich className="min-w-0 max-w-[68ch] flex-1 break-words" html={html} />
      </div>
      {code && <CodeBlock code={code} />}
    </>
  )
}

/* ── Answer options ─────────────────────────────────────────────────────── */

/** The question-tool option list. */
export function QuestionOptions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(QT.options, className)} {...props} />
}

export type OptionState = "" | "sel" | "right" | "wrong"

/**
 * One lettered option row. Only a selected option fills its letter key (gold = your pick); right and wrong get a
 * base-badge with a Check / X icon and the word, and their letters stay outlined. Review rows (disabled) drop the hover.
 * `locked` (a guide's graded practice card after a pick) keeps the row focusable: no `disabled` attribute, so focus
 * stays on the tapped row, but `aria-disabled="true"`, no `onClick`, no `aria-pressed` and the review rows' look.
 */
export function OptionButton({
  index,
  text,
  mono,
  state,
  disabled,
  locked = false,
  onClick,
  note,
  buttonRef,
}: {
  index: number
  text: ReactNode
  mono?: boolean
  state: OptionState
  disabled?: boolean
  /** Read-only but still focusable (CONTRACTS, Assignments): aria-disabled instead of disabled. Default false */
  locked?: boolean
  onClick?: () => void
  /** small trailing note, e.g. "your answer" */
  note?: ReactNode
  buttonRef?: React.Ref<HTMLButtonElement>
}) {
  const filled = state === "sel"
  const still = disabled || locked
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-disabled={locked ? "true" : undefined}
      onClick={locked ? undefined : onClick}
      aria-pressed={!still ? state === "sel" : undefined}
      className={cn(
        QT.optionRow,
        "items-start",
        still && "cursor-default hover:bg-transparent pointer-coarse:active:bg-transparent",
      )}
    >
      <span className={cn(QT.badgeBase, "flex-none", filled ? QT.badgeOn : QT.badgeOff)}>{LETTERS[index]}</span>
      <span className={cn(QT.optionLabel, "min-w-0 flex-1 break-words", mono && QT.optionMono)}>
        {text}
        {note && <span className={QT.optionDescription}> {note}</span>}
      </span>
      {state === "right" && (
        <Badge variant="success" appearance="light" size="sm" className="flex-none">
          <Check aria-hidden="true" />
          Correct
        </Badge>
      )}
      {state === "wrong" && (
        <Badge variant="destructive" appearance="light" size="sm" className="flex-none">
          <X aria-hidden="true" />
          Wrong
        </Badge>
      )}
    </button>
  )
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

/** The question-tool footer: an optional start group (Previous, hints) and the actions on the right. */
export function QuestionFooter({ start, children }: { start?: ReactNode; children?: ReactNode }) {
  return (
    <div className={cn(QT.footer, start ? "justify-between" : "justify-end", "flex-wrap")}>
      {start && <div className="flex items-center gap-2">{start}</div>}
      <div className="flex items-center justify-end gap-2">{children}</div>
    </div>
  )
}

/** A question-tool footer button: "nav" (Previous / Next) and "skip" (quiet) are ghost, "submit" the default (gold). */
export function QuestionButton({
  look = "skip",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { look?: "nav" | "skip" | "submit" }) {
  return <button type={type} className={cn(QT[look], "gap-2", className)} {...props} />
}

/** Footer hint text: a short sentence (`body-sm` sans) in the muted footer colour. */
export function QuestionHint({ children }: { children: ReactNode }) {
  return <span className="font-sans text-sm text-muted-foreground">{children}</span>
}

/* ── The full breakdown ─────────────────────────────────────────────────── */

/**
 * Like-you're-5, why it's right, why the others are wrong, flip-it twists and the confidence note, as shadcn Alerts.
 * role="note": these are static explanations, not alerts (role="alert" would make screen readers shout every box).
 * Titles carry font-mono themselves: the breakdown also sits inside sans containers (Accordion content on Misses and
 * Results), where an inherited family would turn them sans.
 */
export function Explanation({ q }: { q: Question }) {
  const correct = correctOf(q)
  return (
    <div className="mt-4 grid gap-4">
      <Alert role="note">
        <Lightbulb className="h-4 w-4" aria-hidden="true" />
        <AlertTitle className="font-mono">Like you're 5</AlertTitle>
        <AlertDescription>
          <Rich html={q.kid} />
        </AlertDescription>
      </Alert>
      <Alert role="note">
        <CircleCheck className="h-4 w-4" aria-hidden="true" />
        <AlertTitle className="font-mono">
          Why {correct.length > 1 ? "these are" : "it's"} right: {correct.map((i) => q.o[i]).join(" + ")}
        </AlertTitle>
        <AlertDescription>
          <Rich html={q.why} />
        </AlertDescription>
      </Alert>
      <Alert role="note">
        <CircleX className="h-4 w-4" aria-hidden="true" />
        <AlertTitle className="font-mono">Why the others are wrong</AlertTitle>
        <AlertDescription>
          <ul className="grid gap-2">
            {q.o.map((o, i) =>
              q.w[i] ? (
                <li key={i} className="grid grid-cols-[auto_1fr] gap-2">
                  <X className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-foreground">{o}</span>: <Rich as="span" html={q.w[i]!} />
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        </AlertDescription>
      </Alert>
      {q.f?.length > 0 && (
        <Alert role="note">
          <Repeat className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="font-mono">Flip it: how a wrong answer becomes right</AlertTitle>
          <AlertDescription>
            <ul className="grid gap-4">
              {q.f.map((f, i) => (
                <li key={i} className="grid gap-1">
                  {i > 0 && <Separator className="mb-2" />}
                  <Rich className="font-medium text-foreground" html={f.q} />
                  {f.a !== null && (
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <ArrowRight className="size-4" aria-hidden="true" />
                      {q.o[f.a]}
                    </div>
                  )}
                  <Rich className="text-muted-foreground" html={f.why} />
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {q.conf === "med" && (
        <Alert role="note">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="font-mono">Medium confidence.</AlertTitle>
          <AlertDescription>
            This answer follows the textbook's reasoning. Learn the <i>why</i> so you can still pick the best answer if
            your exam words it differently.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/* ── Learn-mode question card ───────────────────────────────────────────── */

/**
 * Guess-first card: pick an answer (or several for "Choose N"), then the breakdown opens.
 * A wrong guess adds the question to My Misses. "I've got this" marks it mastered.
 * forceOpen: true = reveal, false = reset, null = leave alone (driven by Show all / Hide all).
 * Focus: after an answer, focus moves to the result (announced via a live region); after "Try again", to option A.
 * The breakdown appears at once: a checked answer is a change of state, and state changes are instant (BlurFade).
 */
export function QuestionCard({
  q,
  store,
  update,
  forceOpen,
}: {
  q: Question
  store: Store
  update: Update
  forceOpen: boolean | null
}) {
  const multi = Array.isArray(q.a)
  const correct = correctOf(q)
  const [picked, setPicked] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<number[] | null>(null)
  const [status, setStatus] = useState("")
  const resultRef = useRef<HTMLDivElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const focusAfter = useRef<"result" | "first" | null>(null)
  const masteredId = useId()

  useEffect(() => {
    if (forceOpen === true) setOpen(true)
    if (forceOpen === false) {
      setOpen(false)
      setResult(null)
      setPicked([])
      setStatus("")
    }
  }, [forceOpen])

  // Move focus after the DOM has switched between the guessing and revealed states.
  useEffect(() => {
    const target = focusAfter.current
    focusAfter.current = null
    if (target === "result") resultRef.current?.focus({ preventScroll: true })
    if (target === "first") firstOptionRef.current?.focus({ preventScroll: true })
  }, [open])

  const answerText = correct.map((i) => q.o[i]).join(" + ")

  const reveal = (choice: number[] | null) => {
    focusAfter.current = "result"
    setOpen(true)
    setResult(choice)
    if (choice && choice.length) {
      const ok = choice.length === correct.length && choice.every((c) => correct.includes(c))
      setStatus(ok ? "Correct." : `Not quite. The answer is ${answerText}.`)
      if (!ok)
        update((d) => {
          d.miss[q.n] = (d.miss[q.n] || 0) + 1
        })
    } else {
      setStatus(`Answer: ${answerText}.`)
    }
  }

  const reset = () => {
    focusAfter.current = "first"
    setOpen(false)
    setResult(null)
    setPicked([])
    setStatus("")
  }

  const ok = !!result && result.length === correct.length && result.every((c) => correct.includes(c))
  const mastered = !!store.mastered[q.n]

  return (
    <QuestionFrame id={`q-${q.n}`}>
      <QuestionMeta
        right={
          // on touch the row, box and Label, is the 44px target; the box stays 16px (Checkbox README)
          <div className="flex items-center gap-2 pointer-coarse:min-h-11">
            <Checkbox
              id={masteredId}
              checked={mastered}
              onCheckedChange={(c) =>
                update((d) => {
                  d.mastered[q.n] = c === true
                  if (c === true) delete d.miss[q.n]
                })
              }
              aria-label={`I've got this, question ${q.n}`}
            />
            <Label htmlFor={masteredId} className="pointer-coarse:flex pointer-coarse:items-center pointer-coarse:self-stretch">
              I've got this
            </Label>
          </div>
        }
      >
        <span>Question</span>
        {multi && (
          <Badge variant="secondary" size="sm">
            Choose {correct.length}
          </Badge>
        )}
        {q.conf === "med" && (
          <Badge variant="outline" size="sm">
            Medium confidence
          </Badge>
        )}
        {mastered && (
          <Badge variant="success" appearance="light" size="sm">
            <Check aria-hidden="true" />
            Mastered
          </Badge>
        )}
      </QuestionMeta>

      <QuestionText html={q.q} code={q.code} index={padQ(q.n)} />

      <QuestionOptions>
        {q.o.map((text, i) => {
          let state: OptionState = ""
          if (open) state = correct.includes(i) ? "right" : result?.includes(i) ? "wrong" : ""
          else if (picked.includes(i)) state = "sel"
          return (
            <OptionButton
              key={i}
              index={i}
              text={text}
              mono={q.mono}
              state={state}
              disabled={open}
              buttonRef={i === 0 ? firstOptionRef : undefined}
              onClick={() =>
                multi ? setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])) : reveal([i])
              }
            />
          )
        })}
      </QuestionOptions>

      {/* always mounted so screen readers announce the result */}
      <p role="status" className="sr-only">
        {status}
      </p>

      {!open ? (
        <QuestionFooter start={multi ? <QuestionHint>Pick {correct.length}, then check.</QuestionHint> : undefined}>
          <QuestionButton look="skip" onClick={() => reveal(null)}>
            Just show me
          </QuestionButton>
          {multi && (
            <QuestionButton look="submit" disabled={picked.length === 0} onClick={() => reveal(picked)}>
              Check my answers
            </QuestionButton>
          )}
        </QuestionFooter>
      ) : (
        <div ref={resultRef} tabIndex={-1} className="outline-none">
          {result && result.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
              {ok ? (
                <Badge variant="success" appearance="light">
                  <Check aria-hidden="true" />
                  Correct
                </Badge>
              ) : (
                <Badge variant="destructive" appearance="light">
                  <X aria-hidden="true" />
                  Not quite
                </Badge>
              )}
              <span className="font-sans">
                {ok ? "Nice work." : "Read why below, then try the Flip-it questions in your head."}
              </span>
            </div>
          )}
          <Explanation q={q} />
          <div className="mt-4">
            <QuestionFooter>
              <QuestionButton look="skip" onClick={reset}>
                Try again
              </QuestionButton>
            </QuestionFooter>
          </div>
        </div>
      )}
    </QuestionFrame>
  )
}
