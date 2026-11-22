/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * `#exam/<slug>` for a guide course (decisions 23 and 57; CourseTools, Practice), in two modes. When the guide has
 * both, the header's "Practice with" RadioGroup (PracticeWith: two compact mode cards, as on C952's Practice Exam
 * start screen) picks one; otherwise the page shows the mode
 * it has data for, or "No practice questions yet" when it has neither.
 * - Questions: every practice question, graded where you read it. A card whose answer names one choice
 *   (correctChoice) is graded by a tap; any other is self-graded with "Reveal answer", then "I missed it" or "I got
 *   it". Marks go to `courses[slug].practice[i]` (markPractice).
 * - Flashcards: the guide's own key facts, one card at a time (GuideFlashcards); marks go to `courses[slug].cards[i]`.
 * The header's lead and Progress follow the mode, and a switch moves no focus. The mode and each mode's list ("Which
 * questions", "Which cards") ride on the history entry and live in this page's state, so a switch to the other mode
 * and back keeps the list. Each list is a snapshot taken when its mode opens or the list is chosen; its counts stay
 * live.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Check, CircleCheck, ClipboardX, Eye, EyeOff, ListChecks, X } from "lucide-react"
import { codeOf, courseInfo, type CardFilter, type PracticeFilter, type PracticeMode } from "@/lib/course"
import { hrefFor, initialCardFilter, initialPracticeFilter, initialPracticeMode, patchEntry } from "@/lib/routes"
import { cardCounts, markPractice, practiceCounts, type PracticeCounts, type Store, type Update } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { GuidePracticeProps } from "@/views/types"
import {
  GuideAnswer,
  GuideRich,
  HEADER,
  LABEL,
  LEAD,
  PROSE,
  PageTitle,
  StaticChoices,
  correctChoice,
  letter,
  padTo,
  percent,
  stripLetter,
  type Guide,
  type Practice,
} from "@/views/course/shared"
import { GuideFlashcards } from "@/views/course/GuideFlashcards"
import { GuideGate } from "@/views/course/GuideGate"
import { GuidePending } from "@/views/course/GuideLearn"
import { PracticeWith } from "@/views/course/PracticeWith"
import { SafeRich } from "@/components/kit"
import {
  OptionButton,
  QuestionButton,
  QuestionCount,
  QuestionFooter,
  QuestionFrame,
  QuestionMeta,
  QuestionOptions,
  type OptionState,
} from "@/components/question"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Mark = boolean | undefined

/** The card's mark: `true` got it, `false` missed, undefined not tried. */
const markOf = (store: Store, slug: string, i: number): Mark => {
  const v = store.courses?.[slug]?.practice?.[i]
  return v === true || v === false ? v : undefined
}

/** The question numbers on a list, in guide order. */
function listOf(filter: PracticeFilter, total: number, store: Store, slug: string) {
  const all = Array.from({ length: total }, (_, i) => i)
  if (filter === "missed") return all.filter((i) => markOf(store, slug, i) === false)
  if (filter === "new") return all.filter((i) => markOf(store, slug, i) === undefined)
  return all
}

/** The status badge: "Got it" or "Missed", none when new. */
function MarkBadge({ mark }: { mark: Mark }) {
  if (mark === true)
    return (
      <Badge variant="success" appearance="light" size="sm">
        <Check aria-hidden="true" />
        Got it
      </Badge>
    )
  if (mark === false)
    return (
      <Badge variant="destructive" appearance="light" size="sm">
        <X aria-hidden="true" />
        Missed
      </Badge>
    )
  return null
}

/**
 * One practice question (CourseTools, Practice 4 to 8). Graded: a tap locks the rows (focus stays on the tapped
 * one), grades it and records it; "Just show me" shows the answer and records nothing; "Try again" clears the card.
 * Self-graded: "Reveal answer" shows the answer, then "I missed it" or "I got it" records a mark that stays
 * changeable; "Hide answer" folds the card back. Focus: "Just show me" and "Reveal answer" go to the Answer Alert,
 * "Try again" to the first option, "Hide answer" back to "Reveal answer".
 */
function PracticeCard({
  slug,
  index,
  total,
  item,
  mark,
  update,
}: {
  slug: string
  index: number
  total: number
  item: Practice
  mark: Mark
  update: Update
}) {
  const n = index + 1
  const right = useMemo(() => correctChoice(item.answer, item.choices), [item])
  const graded = item.choices.length > 0 && right !== null
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const answerRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)
  const revealRef = useRef<HTMLButtonElement>(null)
  const focusAfter = useRef<"answer" | "first" | "reveal" | null>(null)

  // move focus once the DOM has switched between the closed and open states
  useEffect(() => {
    const target = focusAfter.current
    focusAfter.current = null
    if (target === "answer") answerRef.current?.focus({ preventScroll: true })
    if (target === "first") firstRef.current?.focus({ preventScroll: true })
    if (target === "reveal") revealRef.current?.focus({ preventScroll: true })
  }, [open])

  const record = (got: boolean) => update((d) => markPractice(d, slug, index, got))

  const pick = (j: number) => {
    const ok = j === right
    setPicked(j)
    setOpen(true)
    setStatus(ok ? "Correct." : `Not quite. The answer is ${letter(right!)}.`)
    record(ok)
  }
  const show = (after: "answer" | "first" | "reveal", next: boolean) => {
    focusAfter.current = after
    setOpen(next)
    if (!next) setPicked(null)
    setStatus("")
  }
  const markAs = (got: boolean) => {
    record(got)
    setStatus(got ? "Marked as got it." : "Marked as missed. It's on your My Misses list.")
  }

  const stateOf = (j: number): OptionState => (!open ? "" : j === right ? "right" : j === picked ? "wrong" : "")
  const ok = picked !== null && picked === right

  return (
    <QuestionFrame className="my-0" aria-label={`Practice question ${n}`}>
      <QuestionMeta right={<QuestionCount index={n} total={total} />}>
        <span>Question</span>
        <Badge variant="outline" size="sm">
          Q{padTo(n, total)}
        </Badge>
        <MarkBadge mark={mark} />
      </QuestionMeta>

      {/* the stem in `body`; code written as lines of its own becomes a Terminal under it */}
      <GuideRich html={item.q} className={cn("my-2 text-base whitespace-pre-line break-words", PROSE)} />

      {graded ? (
        <QuestionOptions className={PROSE}>
          {item.choices.map((c, j) => (
            <OptionButton
              key={j}
              index={j}
              text={<SafeRich as="span" html={stripLetter(c, j)} />}
              state={stateOf(j)}
              locked={open}
              buttonRef={j === 0 ? firstRef : undefined}
              onClick={() => pick(j)}
            />
          ))}
        </QuestionOptions>
      ) : (
        <StaticChoices choices={item.choices} />
      )}

      {/* always mounted, so screen readers hear every verdict and mark */}
      <p role="status" className="sr-only">
        {status}
      </p>

      {graded && open && picked !== null && (
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
          <span className="font-sans">{ok ? "Nice work." : "Read why below, then try it again later."}</span>
        </div>
      )}

      {open && <GuideAnswer ref={answerRef} item={item} />}

      <div className="mt-4">
        {graded ? (
          <QuestionFooter>
            {open ? (
              <QuestionButton look="skip" onClick={() => show("first", false)}>
                Try again
              </QuestionButton>
            ) : (
              <QuestionButton look="skip" onClick={() => show("answer", true)}>
                Just show me
              </QuestionButton>
            )}
          </QuestionFooter>
        ) : open ? (
          // three buttons wrap at 375 ("I got it" takes the second row), so this footer wraps its buttons itself
          <div className="flex flex-wrap items-center justify-end gap-2">
            {mark !== undefined && (
              <Button size="sm" variant="ghost" onClick={() => show("reveal", false)}>
                <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                Hide answer
              </Button>
            )}
            <Button size="sm" variant="outline" aria-pressed={mark === false} onClick={() => markAs(false)}>
              I missed it
            </Button>
            <Button size="sm" aria-pressed={mark === true} onClick={() => markAs(true)}>
              I got it
            </Button>
          </div>
        ) : (
          <QuestionFooter>
            <Button ref={revealRef} size="sm" onClick={() => show("answer", true)}>
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              Reveal answer
            </Button>
          </QuestionFooter>
        )}
      </div>
    </QuestionFrame>
  )
}

const LISTS: { value: PracticeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "missed", label: "Missed" },
  { value: "new", label: "New" },
]

/**
 * A question card's way in: in a panel that opened with the page, a BlurFade as it scrolls into view; after a mode
 * switch (`fade` false), still, resting 6px up where the fade settles, so the cards sit as they do after one.
 */
function Entrance({ fade, children }: { fade: boolean; children: ReactNode }) {
  if (!fade) return <div className="-translate-y-1.5">{children}</div>
  return <BlurFade inView>{children}</BlurFade>
}

/**
 * Questions mode, as Practice was before Flashcards: the "Every question got it" Alert, then the "Which questions"
 * Tabs over one PracticeCard per question. The list is the page's (`filter`, on the history entry); the questions
 * shown are a snapshot taken when the panel mounts or a list is chosen, so a card you answer keeps its place until you
 * change list or leave, while the counts in the tabs and the lead update at once. The Alert and the cards fade in as
 * before only when Questions is the page's first view (`enter`): a mode switch is a change of state, so after one the
 * panel, and any list chosen in it, is there at once.
 */
function QuestionsPanel({
  slug,
  items,
  counts,
  store,
  update,
  filter,
  onFilter,
  enter,
}: {
  slug: string
  items: Practice[]
  /** the live counts (practiceCounts) */
  counts: PracticeCounts
  store: Store
  update: Update
  filter: PracticeFilter
  onFilter: (filter: PracticeFilter) => void
  /** true when Questions is the page's first view: only then do its windows fade in (a switch is instant) */
  enter: boolean
}) {
  const total = items.length
  const { got, missed, untried } = counts
  // a list is a snapshot: a card you answer keeps its place until you change list or leave
  const [shown, setShown] = useState(() => listOf(filter, total, store, slug))
  const [fade] = useState(enter)
  const allRef = useRef<HTMLButtonElement>(null)

  const choose = (value: string) => {
    const next = LISTS.find((l) => l.value === value)?.value
    if (!next) return
    onFilter(next)
    setShown(listOf(next, total, store, slug))
    patchEntry({ practiceFilter: next })
  }
  const tabCounts: Record<PracticeFilter, number> = { all: total, missed, new: untried }
  // after a mode switch the Alert is there at once, as Flashcards' "Every card knew it" is
  const allGot = (
    <Alert role="note" className={fade ? undefined : "mt-8"}>
      <CircleCheck className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Every question got it</AlertTitle>
      <AlertDescription>Come back in a day and try them cold, or review the Cheat Sheet.</AlertDescription>
    </Alert>
  )

  return (
    <>
      {got === total &&
        (fade ? (
          <BlurFade delay={0.08} className="mt-8">
            {allGot}
          </BlurFade>
        ) : (
          allGot
        ))}

      <Tabs value={filter} onValueChange={choose} className="mt-8">
        <TabsList aria-label="Which questions">
          {LISTS.map((l) => (
            <TabsTrigger key={l.value} value={l.value} ref={l.value === "all" ? allRef : undefined}>
              {l.label} {tabCounts[l.value]}
            </TabsTrigger>
          ))}
        </TabsList>
        {LISTS.map((l) => (
          <TabsContent key={l.value} value={l.value} className="mt-6">
            {shown.length === 0 ? (
              <div className="flex justify-center">
                <EmptyState
                  title="Nothing here"
                  description="No questions in this list yet."
                  icons={[ListChecks]}
                  action={{
                    label: "Show all",
                    onClick: () => {
                      choose("all")
                      allRef.current?.focus()
                    },
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {shown.map((i) => (
                  <Entrance key={i} fade={fade}>
                    <PracticeCard
                      slug={slug}
                      index={i}
                      total={total}
                      item={items[i]}
                      mark={markOf(store, slug, i)}
                      update={update}
                    />
                  </Entrance>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}

export function GuidePractice(props: GuidePracticeProps) {
  return (
    <GuideGate course={props.course} title="Practice">
      {(guide) => <GuidePracticePage {...props} guide={guide} />}
    </GuideGate>
  )
}

function GuidePracticePage({ course, navigate, store, update, entry, guide }: GuidePracticeProps & { guide: Guide | null }) {
  const info = courseInfo(course)
  const items = guide?.practice ?? []
  const facts = guide?.keyFacts ?? []
  const total = items.length
  const cardTotal = facts.length
  const code = codeOf(course)
  // a mode this guide has data for (the router fits the entry's the same way): Flashcards needs key facts, Questions
  // needs questions
  const fit = (m: PracticeMode): PracticeMode =>
    m === "cards" && cardTotal === 0 ? "questions" : m === "questions" && total === 0 && cardTotal > 0 ? "cards" : m
  const [mode, setMode] = useState<PracticeMode>(() => fit(initialPracticeMode(course, entry)))
  // Both lists live here, not in their panels: a panel unmounts with its mode, and `entry` is the entry as it was when
  // the page opened, so a list chosen since then would be lost on the way back to that mode
  const [filter, setFilter] = useState<PracticeFilter>(() => initialPracticeFilter(course, entry))
  const [cardFilter, setCardFilter] = useState<CardFilter>(() => initialCardFilter(course, entry))
  // each mode's windows fade in with the page only: a mode switch is a change of state, and those are instant
  const [switched, setSwitched] = useState(false)

  if (!guide || !info) return <GuidePending course={course} navigate={navigate} />
  const both = total > 0 && cardTotal > 0
  const cards = mode === "cards" && cardTotal > 0
  const questions = practiceCounts(info, store)
  const deck = cardCounts({ slug: course, cardTotal }, store)
  const { got, missed } = questions
  const pct = cards ? percent(deck.knew, cardTotal) : percent(got, total)

  // the switch moves no focus: it stays on the radio, and the radios stay mounted
  const chooseMode = (value: PracticeMode) => {
    if (value === mode) return
    setMode(value)
    setSwitched(true)
    patchEntry({ practiceMode: value })
  }

  const header = (
    <header className={HEADER}>
      <p className={LABEL}>
        {code} · {info.name}
      </p>
      <PageTitle text="Practice" />
      {cards ? (
        <p className={cn(LEAD, "mt-4")}>
          <span className="font-mono text-sm text-foreground">{cardTotal}</span> {cardTotal === 1 ? "card" : "cards"} ·{" "}
          <span className="font-mono text-sm text-foreground">{deck.knew}</span> knew it ·{" "}
          <span className="font-mono text-sm text-foreground">{deck.again}</span> to study again
        </p>
      ) : (
        total > 0 && (
          <p className={cn(LEAD, "mt-4")}>
            <span className="font-mono text-sm text-foreground">{total}</span> questions ·{" "}
            <span className="font-mono text-sm text-foreground">{got}</span> got it ·{" "}
            <span className="font-mono text-sm text-foreground">{missed}</span> missed
          </p>
        )
      )}
      {both && <PracticeWith mode={mode} onChange={chooseMode} questions={total} cards={cardTotal} />}
      {(cards || total > 0) && (
        // keyed by mode: after a switch the bar shows another count, so it is drawn anew instead of sliding over
        <div key={mode} className={cn("flex max-w-[520px] items-center gap-4", both ? "mt-6" : "mt-4")}>
          <Progress
            className="flex-1"
            value={pct}
            aria-label={cards ? "Knew it" : "Got it"}
            aria-valuenow={pct}
            aria-valuetext={cards ? `${deck.knew} of ${cardTotal} knew it` : `${got} of ${total} got it`}
          />
          <span className="w-10 text-right font-mono text-sm text-muted-foreground">{pct}%</span>
        </div>
      )}
    </header>
  )

  // decision 26: a guide with no practice questions (and no key facts to drill as cards)
  if (total === 0 && cardTotal === 0) {
    const learn = hrefFor("learn", course)
    return (
      <>
        {header}
        <BlurFade delay={0.08} className="mt-8 flex justify-center">
          <div data-focus-key="practice:open-learn" className="flex w-full justify-center">
            <EmptyState
              title="No practice questions yet"
              description="This guide has no practice questions yet. Learn and the Cheat Sheet still work."
              icons={[ClipboardX]}
              action={{ label: "Open Learn", onClick: () => navigate(learn) }}
            />
          </div>
        </BlurFade>
      </>
    )
  }

  return (
    <>
      {header}
      {cards ? (
        <GuideFlashcards
          slug={course}
          facts={facts}
          counts={deck}
          store={store}
          update={update}
          filter={cardFilter}
          onFilter={setCardFilter}
          enter={!switched}
        />
      ) : (
        <QuestionsPanel
          slug={course}
          items={items}
          counts={questions}
          store={store}
          update={update}
          filter={filter}
          onFilter={setFilter}
          enter={!switched}
        />
      )}
    </>
  )
}
