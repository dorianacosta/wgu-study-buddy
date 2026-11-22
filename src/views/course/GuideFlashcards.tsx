/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Practice's Flashcards mode (decision 57): a deck of cards, one at a time in a question window. A guide course's deck
 * is its own key facts (GuidePractice renders it); C952's is its formulas, signal words and ARM reference (C952_CARDS,
 * on the Practice Exam start screen, src/views/exam/Setup.tsx), each card naming its kind above its front. The front
 * is the card's label ("Fact {n}" without one). "Show answer" reveals the back in place (FactAnswer: the value and its
 * note); "Study again" or "Knew it" records a mark in `courses[slug].cards[i]` (markCard) and moves to the next card
 * of the list, where focus lands on its "Show answer"; "Hide answer" folds the card back. Each state of the card shows one gold fill. Previous and Next move without
 * marking, in a footer that stays mounted, so focus on them survives a move. After the last card the same window sums
 * up the whole deck, whichever list it ran through ("All {F} cards: {k} knew it · {a} to study again"), with "Start
 * over" (back to card 1, marks kept) and, while a card is marked to study again, "Study again list" (a fresh snapshot
 * of that list).
 *
 * The list ("Which cards": All, Study again, New) is the page's, written to the history entry (patchEntry). Each list
 * is a snapshot taken when the mode opens or a list is chosen, so a card you mark keeps its place, while the counts in
 * the tabs stay live. The place in the list is page state only. One always-mounted status line says what each step
 * did. Built from the app's question window (QuestionFrame) and the collected 21st.dev components: shadcn Tabs,
 * Button and Alert, ReUI Badge, Magic UI BlurFade and serafimcloud EmptyState.
 */
import { useId, useLayoutEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Check, CircleCheck, Eye, EyeOff, ListChecks, X } from "lucide-react"
import { isCardFilter, type CardFilter } from "@/lib/course"
import { patchEntry } from "@/lib/routes"
import { cardMark, markCard, type CardCounts, type Store, type Update } from "@/lib/store"
import { cn } from "@/lib/utils"
import { FactAnswer, GuideRich, LABEL, PROSE, padTo, plain, type Flashcard } from "@/views/course/shared"
import { QuestionButton, QuestionCount, QuestionFooter, QuestionFrame, QuestionMeta } from "@/components/question"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** A card's mark: `true` knew it, `false` study again, null new. */
type Mark = boolean | null

/** What takes focus once a step has rendered: the card's "Show answer", its revealed back, or the end's next action. */
type FocusTarget = "show" | "answer" | "end"

const LISTS: { value: CardFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "again", label: "Study again" },
  { value: "new", label: "New" },
]

/**
 * Previous at the first card and Next at the end can't move: they stay focusable (aria-disabled, never disabled), so
 * focus on them survives the move that turned them off, and look as the exam's disabled Previous does.
 */
const NAV_OFF = "aria-disabled:pointer-events-none aria-disabled:opacity-60"

const cardsOf = (n: number) => `${n} ${n === 1 ? "card" : "cards"}`

/** The front's HTML: the fact's label, "Fact {n}" for a fact with a value alone. */
const frontOf = (fact: Flashcard, n: number) => fact.label || `Fact ${n}`

/** The front as the status line says it after Previous or Next: its kind first when the deck names one (C952's). */
const spokenFront = (fact: Flashcard, n: number) => {
  const front = plain(frontOf(fact, n))
  return fact.kind ? `${fact.kind}, ${front}` : front
}

/** The status line's words at the end of a list: the whole deck's counts, named as the end window names them. */
const endText = (total: number, knew: number, again: number) =>
  `End of list. All ${cardsOf(total)}: ${knew} knew it, ${again} to study again.`

/** The cards on a list (0-based deck indexes), in deck order: Study again is every `false`, New every unmarked. */
function cardList(filter: CardFilter, total: number, store: Store, slug: string): number[] {
  const all = Array.from({ length: total }, (_, i) => i)
  if (filter === "again") return all.filter((i) => cardMark(store, slug, i) === false)
  if (filter === "new") return all.filter((i) => cardMark(store, slug, i) === null)
  return all
}

/** The status badge: "Knew it" or "Study again", none while the card is new. */
function CardBadge({ mark }: { mark: Mark }) {
  if (mark === true)
    return (
      <Badge variant="success" appearance="light" size="sm">
        <Check aria-hidden="true" />
        Knew it
      </Badge>
    )
  if (mark === false)
    return (
      <Badge variant="destructive" appearance="light" size="sm">
        <X aria-hidden="true" />
        Study again
      </Badge>
    )
  return null
}

export function GuideFlashcards({
  slug,
  facts,
  counts,
  store,
  update,
  filter,
  onFilter,
  enter,
}: {
  slug: string
  /**
   * the deck in its order, card i marked in `courses[slug].cards[i]`: a guide's keyFacts in guide order, or C952's
   * C952_CARDS, whose cards each carry a kind
   */
  facts: readonly Flashcard[]
  /** the deck's live counts (cardCounts over `facts`) */
  counts: CardCounts
  store: Store
  update: Update
  /** the list, kept by the page, so a switch to Questions and back finds it again */
  filter: CardFilter
  onFilter: (filter: CardFilter) => void
  /**
   * true when Flashcards is the page's first view: only then does the card window fade in (a switch is instant, the
   * window resting where the fade settles)
   */
  enter: boolean
}) {
  const total = facts.length
  // a list is a snapshot: a card you mark keeps its place until you choose a list again or leave
  const [shown, setShown] = useState(() => cardList(filter, total, store, slug))
  // the place in the list: 0 to shown.length - 1 is a card, shown.length the end of the list
  const [pos, setPos] = useState(0)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("")
  const [fade] = useState(enter)
  const still = useReducedMotion()
  const frontId = useId()
  const allRef = useRef<HTMLButtonElement>(null)
  const frameRef = useRef<HTMLElement>(null)
  const showRef = useRef<HTMLButtonElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLButtonElement>(null)
  // set by a step, run once it has rendered: `focus` null leaves focus on the button that was pressed
  const pending = useRef<{ focus: FocusTarget | null } | null>(null)

  // After a step: focus its target before paint, then bring the window into view where it no longer fits on screen
  // (a longer or shorter card moves its own buttons). The page's scroll padding keeps it clear of the nav.
  useLayoutEffect(() => {
    const step = pending.current
    if (!step) return
    pending.current = null
    const target =
      step.focus === "show"
        ? showRef.current
        : step.focus === "answer"
          ? answerRef.current
          : step.focus === "end"
            ? endRef.current
            : null
    target?.focus({ preventScroll: true })
    frameRef.current?.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" })
  })

  const len = shown.length
  const fact = pos < len ? facts[shown[pos]] : null
  const index = fact ? shown[pos] : -1
  const n = index + 1
  const mark: Mark = fact ? cardMark(store, slug, index) : null
  // the end's next action, the one gold fill there: the Study again list while it has cards, else Start over
  const againNext = counts.again > 0

  /** Goes to place `p` of the list with the card folded, says `said`, and focuses `focus` once it has rendered. */
  const go = (p: number, focus: FocusTarget | null, said: string) => {
    setPos(p)
    setOpen(false)
    setStatus(said)
    pending.current = { focus }
  }

  const reveal = (next: boolean) => {
    setOpen(next)
    setStatus("")
    pending.current = { focus: next ? "answer" : "show" }
  }

  const markAs = (knew: boolean) => {
    if (!fact) return
    update((d) => markCard(d, slug, index, knew))
    // the deck's counts once this mark lands (the store updates in the same render as the move)
    const k = counts.knew - (mark === true ? 1 : 0) + (knew ? 1 : 0)
    const a = counts.again - (mark === false ? 1 : 0) + (knew ? 0 : 1)
    const p = pos + 1
    const said = knew ? "Marked knew it." : "Marked to study again."
    go(p, p < len ? "show" : "end", `${said} ${p < len ? `Card ${p + 1} of ${len}.` : endText(total, k, a)}`)
  }

  // Previous and Next keep focus where it is, so the status line names the card they land on
  const move = (delta: number) => {
    const p = pos + delta
    if (p < 0 || p > len) return
    const said =
      p < len
        ? `Card ${p + 1} of ${len}: ${spokenFront(facts[shown[p]], shown[p] + 1)}`
        : endText(total, counts.knew, counts.again)
    go(p, null, said)
  }

  /** A fresh snapshot of a list, from its first card: a tab, "Study again list" or "Show all". */
  const take = (next: CardFilter) => {
    const list = cardList(next, total, store, slug)
    onFilter(next)
    setShown(list)
    setPos(0)
    setOpen(false)
    patchEntry({ cardFilter: next })
    return list
  }

  // a tab keeps focus on itself (Radix calls this only for a list other than the current one)
  const choose = (value: string) => {
    if (!isCardFilter(value)) return
    take(value)
    setStatus("")
  }

  const studyAgainList = () => {
    const list = take("again")
    setStatus(`Study again list: ${cardsOf(list.length)}. Card 1 of ${list.length}.`)
    pending.current = { focus: "show" }
  }

  const startOver = () => go(0, "show", `Card 1 of ${len}.`)

  const showAll = () => {
    take("all")
    setStatus("")
    // the empty state's button leaves with the empty list, so focus goes to the All tab first
    allRef.current?.focus()
  }

  const tabCounts: Record<CardFilter, number> = { all: total, again: counts.again, new: counts.unseen }

  const body =
    len === 0 ? (
      <div className="flex justify-center">
        <EmptyState
          title="Nothing here"
          description="No cards in this list yet."
          icons={[ListChecks]}
          action={{ label: "Show all", onClick: showAll }}
        />
      </div>
    ) : (
      // one window for the whole list: a move changes what it holds, never the window, so its footer stays mounted
      <QuestionFrame ref={frameRef} className="my-0 scroll-mt-4" aria-label={fact ? `Flashcard ${n}` : "End of list"}>
        <QuestionMeta right={fact ? <QuestionCount index={pos + 1} total={len} /> : undefined}>
          {fact ? (
            <>
              <span>Card</span>
              <Badge variant="outline" size="sm">
                F{padTo(n, total)}
              </Badge>
              <CardBadge mark={mark} />
            </>
          ) : (
            <span>End of list</span>
          )}
        </QuestionMeta>

        {fact ? (
          // the front, in `subheading`, under its kind in `label` when the deck names one (C952's: what to recall);
          // "Show answer" is described by both, so landing there names the card
          <div id={frontId}>
            {fact.kind && <p className={cn(LABEL, "mt-2")}>{fact.kind}</p>}
            <GuideRich
              html={frontOf(fact, n)}
              className={cn("my-2 font-mono text-base font-semibold text-foreground break-words", PROSE)}
            />
          </div>
        ) : (
          // the whole deck's counts, as the lead and the tabs give them; "All" says so after a shorter list
          <p className="my-2 font-mono text-base font-semibold text-foreground">
            All {cardsOf(total)}: {counts.knew} knew it · {counts.again} to study again
          </p>
        )}

        {/* the back, in place: no motion, a reveal is a change of state */}
        {fact && open && <FactAnswer ref={answerRef} fact={fact} />}

        {/* the card's own actions, one gold fill at a time; three buttons wrap at 375, so the row wraps itself */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {!fact ? (
            <>
              <Button
                key="over"
                ref={againNext ? undefined : endRef}
                size="sm"
                variant={againNext ? "outline" : "default"}
                onClick={startOver}
              >
                Start over
              </Button>
              {againNext && (
                <Button key="again-list" ref={endRef} size="sm" onClick={studyAgainList}>
                  Study again list
                </Button>
              )}
            </>
          ) : open ? (
            <>
              <Button key="hide" size="sm" variant="ghost" onClick={() => reveal(false)}>
                <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                Hide answer
              </Button>
              <Button key="again" size="sm" variant="outline" aria-pressed={mark === false} onClick={() => markAs(false)}>
                Study again
              </Button>
              <Button key="knew" size="sm" aria-pressed={mark === true} onClick={() => markAs(true)}>
                Knew it
              </Button>
            </>
          ) : (
            <Button key="show" ref={showRef} size="sm" aria-describedby={frontId} onClick={() => reveal(true)}>
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              Show answer
            </Button>
          )}
        </div>

        {/* stays mounted across moves and at the end of the list, so focus on Previous or Next survives a move; never
            gold, since moving records nothing */}
        <div className="mt-4">
          <QuestionFooter
            start={
              <QuestionButton
                look="nav"
                aria-disabled={pos === 0 || undefined}
                className={NAV_OFF}
                onClick={() => move(-1)}
              >
                Previous<span className="sr-only"> card</span>
              </QuestionButton>
            }
          >
            <QuestionButton look="nav" aria-disabled={!fact || undefined} className={NAV_OFF} onClick={() => move(1)}>
              Next<span className="sr-only"> card</span>
            </QuestionButton>
          </QuestionFooter>
        </div>
      </QuestionFrame>
    )

  return (
    <>
      {/* always mounted, so screen readers hear every mark and move */}
      <p role="status" className="sr-only">
        {status}
      </p>

      {/* a change of state (the last card marked) can bring it in, so it appears at once, with no fade */}
      {counts.knew === total && (
        <Alert role="note" className="mt-8">
          <CircleCheck className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Every card knew it</AlertTitle>
          <AlertDescription>Come back in a day and try them cold.</AlertDescription>
        </Alert>
      )}

      <Tabs value={filter} onValueChange={choose} className="mt-8">
        {/* below 360px the triggers take px-2, so "Study again 29" fits at 320; the scroller only catches text zoom */}
        <div className="flex overflow-x-auto">
          <TabsList aria-label="Which cards">
            {LISTS.map((l) => (
              <TabsTrigger
                key={l.value}
                value={l.value}
                ref={l.value === "all" ? allRef : undefined}
                className="max-[360px]:px-2"
              >
                {l.label} {tabCounts[l.value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {/* One panel whose value follows the list: Radix keeps it mounted, so the card window (and the focus in its
            footer) survives a change of list, and "Study again list" lands focus in the new list's first card */}
        <TabsContent value={filter} className="mt-6">
          {/* still after a switch, 6px up where the fade settles, as Questions' cards rest */}
          {fade ? <BlurFade inView>{body}</BlurFade> : <div className="-translate-y-1.5">{body}</div>}
        </TabsContent>
      </Tabs>
    </>
  )
}
