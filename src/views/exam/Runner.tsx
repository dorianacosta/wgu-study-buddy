/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { ArrowLeft, ArrowRight, ClipboardX, Flag, Repeat, Timer } from "lucide-react"
import { QUESTIONS } from "@/data"
import { fmtTime, type Exam, type ExamItem } from "@/lib/exam"
import { cn } from "@/lib/utils"
import type { RunnerProps } from "@/views/exam/props"
import {
  OptionButton,
  QuestionButton,
  QuestionCount,
  QuestionFooter,
  QuestionFrame,
  QuestionMeta,
  QuestionOptions,
  QuestionText,
} from "@/components/question"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge, BadgeDot } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

/** Single-key shortcuts can be switched off (WCAG 2.1.4). The choice is remembered on this device. */
const SHORTCUTS_KEY = "c952-shortcuts"

/** Zero-pads a sequence number to the width of its total: `01`–`60`, `1`–`9` (README, Numbers). */
const pad = (n: number, total: number) => String(n).padStart(String(total).length, "0")

function readShortcuts() {
  try {
    return localStorage.getItem(SHORTCUTS_KEY) !== "off"
  } catch {
    return true
  }
}

function saveShortcuts(on: boolean) {
  try {
    localStorage.setItem(SHORTCUTS_KEY, on ? "on" : "off")
  } catch {
    /* storage blocked: the choice lasts until the page is closed */
  }
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

/** Bottom edge of the exam bar while it is pinned, in viewport px. 0 on short screens, where the bar scrolls away. */
function pinnedBottom(bar: HTMLElement) {
  return getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().bottom : 0
}

/**
 * Keeps keyboard focus clear of the pinned exam bar (WCAG 2.4.11): while the bar sticks, the page's scroll padding
 * follows its real bottom edge + 12px, so browsers scroll a focused control out from under it, and only its top while
 * focus is inside the bar, so focusing one of the bar's own controls never scrolls the page; otherwise "" hands it
 * back to index.css (CONTRACTS, convention 9). The previous inline value comes back on unmount.
 */
function useScrollPaddingBelow(barRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const root = document.documentElement
    const before = root.style.scrollPaddingTop
    let inside = bar.contains(document.activeElement)
    const apply = () => {
      const cs = getComputedStyle(bar)
      const top = parseFloat(cs.top) || 0
      root.style.scrollPaddingTop =
        cs.position === "sticky" ? `${Math.ceil(inside ? top : top + bar.offsetHeight + 12)}px` : ""
    }
    // focusout names the control focus moves to (relatedTarget) and runs before the browser scrolls that control into
    // view, so the padding is set in time; focusin runs after the scroll and settles focus that came from nowhere
    const onFocusOut = (e: FocusEvent) => {
      inside = e.relatedTarget instanceof Node && bar.contains(e.relatedTarget)
      apply()
    }
    // focus from <body> (no focusout names it, as after a click in Safari) is scrolled before focusin runs: a key that
    // moves it into the stuck bar puts the page back where the key found it
    let keyY: number | null = null
    const onKeyDown = () => {
      const cs = getComputedStyle(bar)
      const stuck = cs.position === "sticky" && Math.abs(bar.getBoundingClientRect().top - (parseFloat(cs.top) || 0)) < 1
      keyY = stuck ? window.scrollY : null
      setTimeout(() => (keyY = null))
    }
    const onFocusIn = (e: FocusEvent) => {
      inside = e.target instanceof Node && bar.contains(e.target)
      if (inside && !e.relatedTarget && keyY !== null && window.scrollY !== keyY) window.scrollTo({ top: keyY, behavior: "instant" })
      apply()
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(bar)
    document.addEventListener("focusout", onFocusOut)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("resize", apply)
    return () => {
      ro.disconnect()
      document.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("resize", apply)
      root.style.scrollPaddingTop = before
    }
  }, [barRef])
}

/**
 * The dialogs open from state, and Submit opens from two buttons, so Radix has no Trigger to hand focus back to.
 * Remember what had focus when a dialog opened and return there on close (if it still exists).
 */
function useOpenerFocus() {
  const opener = useRef<HTMLElement | null>(null)
  return {
    remember: () => {
      const a = document.activeElement
      opener.current = a instanceof HTMLElement && a !== document.body ? a : null
    },
    onCloseAutoFocus: (e: Event) => {
      const el = opener.current
      opener.current = null
      if (el && el.isConnected) {
        e.preventDefault()
        el.focus({ preventScroll: true })
      }
    },
  }
}

/**
 * When the runner closes (submitted or quit) the control that had focus disappears with it. Land keyboard focus on
 * the next page's title instead of <body>, unless something else has already taken it.
 */
function focusNextTitle() {
  window.setTimeout(() => {
    const active = document.activeElement
    if (active && active !== document.body) return
    document.querySelector<HTMLElement>("#app h1")?.focus({ preventScroll: true })
  }, 80)
}

/** Single choice replaces the answer; "Choose N" toggles. Always returns a new exam object. */
function withAnswer(e: Exam, k: number): Exam {
  const cur = e.ans[e.i] ?? []
  const next = e.items[e.i].multi ? (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]) : [k]
  const ans = e.ans.slice()
  ans[e.i] = next
  return { ...e, ans }
}

/** Elapsed time, ticking every second. Its own component so only the clock re-renders. */
function ExamTimer({ start }: { start: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  // m:ss in `data`; the Timer icon keeps its 14px (README, Iconography)
  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm tabular-nums">
      <Timer className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Time elapsed</span>
      {fmtTime(Math.max(0, now - start))}
    </span>
  )
}

/**
 * Key to the navigator's marks, drawn with the same badges (numbers padded like the cells; the flagged swatch has the
 * unanswered cell's `muted-foreground` boundary). `caption` muted. Decorative: every cell's name already states its state.
 */
function NavLegend({ total }: { total: number }) {
  const one = pad(1, total)
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <Badge variant="primary" size="sm">
          {one}
        </Badge>
        Current
      </span>
      <span className="inline-flex items-center gap-2">
        <Badge variant="secondary" size="sm">
          {one}
          <BadgeDot />
        </Badge>
        Answered
      </span>
      <span className="inline-flex items-center gap-2">
        <Badge variant="outline" size="sm" className="border-muted-foreground">
          {one}
          <Flag />
        </Badge>
        Flagged
      </span>
    </div>
  )
}

/**
 * A base-badge button per question (Surfaces, Exam navigator), numbered `01` to `N`. Wraps from sm up; on phones and
 * short screens it is one swipeable row that follows the current question; cells 44 tall on touch (decision 36).
 * States never rely on color alone: current = primary
 * (solid, `aria-current="step"`), answered = secondary + dot, flagged = flag icon, not answered = outline with a
 * `muted-foreground` boundary (a button's boundary is never the 1.18:1 `border`).
 */
function Navigator({ exam, current, onGo }: { exam: Exam; current: number; onGo: (idx: number) => void }) {
  const stripRef = useRef<HTMLDivElement>(null)
  const total = exam.items.length

  useEffect(() => {
    const strip = stripRef.current
    if (!strip || strip.scrollWidth <= strip.clientWidth) return
    const btn = strip.children[current] as HTMLElement | undefined
    if (!btn) return
    strip.scrollTo({
      left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }, [current])

  return (
    <nav aria-label="Questions" className="mt-4">
      <NavLegend total={total} />
      <div
        ref={stripRef}
        className="mt-2 flex gap-2 overflow-x-auto px-1 py-2 sm:flex-wrap sm:overflow-visible short:flex-nowrap short:overflow-x-auto"
      >
        {exam.items.map((_, idx) => {
          const answered = (exam.ans[idx]?.length ?? 0) > 0
          const flagged = !!exam.flags[idx]
          const isCurrent = idx === current
          return (
            <Badge
              key={idx}
              render={<button type="button" />}
              onClick={() => onGo(idx)}
              aria-label={`Question ${idx + 1}, ${answered ? "answered" : "not answered"}${flagged ? ", flagged" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
              variant={isCurrent ? "primary" : answered ? "secondary" : "outline"}
              size="lg"
              className={cn(
                "flex-none tabular-nums pointer-coarse:h-11 pointer-coarse:min-w-11",
                !isCurrent && !answered && "border-muted-foreground",
              )}
            >
              {pad(idx + 1, total)}
              {answered && <BadgeDot />}
              {flagged && <Flag aria-hidden="true" />}
            </Badge>
          )
        })}
      </div>
    </nav>
  )
}

/** Title row and options of one question. Remounts (and blur-fades in) on every question change. */
function QuestionBody({
  item,
  index,
  total,
  picked,
  onChoose,
}: {
  item: ExamItem
  index: number
  total: number
  picked: number[]
  onChoose: (k: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // If the previous question held focus (an option was focused), its controls just unmounted:
  // keep keyboard focus in the card instead of dropping it to <body>.
  useEffect(() => {
    const active = document.activeElement
    if (!active || active === document.body) ref.current?.focus({ preventScroll: true })
  }, [])

  const k = item.correct.length
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-label={`Question ${index + 1} of ${total}`}
      className="space-y-2 outline-none"
    >
      <QuestionText html={item.text} code={item.code} index={pad(index + 1, total)} />
      <QuestionOptions role="group" aria-label={item.multi ? `Answer choices, choose ${k}` : "Answer choices"}>
        {item.opts.map((o, idx) => (
          <OptionButton
            key={o.k}
            index={idx}
            text={o.t}
            mono={item.mono}
            state={picked.includes(o.k) ? "sel" : ""}
            onClick={() => onChoose(o.k)}
          />
        ))}
      </QuestionOptions>
    </div>
  )
}

function ExamRunner({ exam, setExam, submit }: RunnerProps) {
  const [submitOpen, setSubmitOpen] = useState(false)
  const [quitOpen, setQuitOpen] = useState(false)
  const [keysOn, setKeysOn] = useState(readShortcuts)
  const barRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const submitActionRef = useRef<HTMLButtonElement>(null)
  const submitFocus = useOpenerFocus()
  const quitFocus = useOpenerFocus()
  const keysId = useId()
  useScrollPaddingBelow(barRef)

  const total = exam.items.length
  const i = Math.min(Math.max(exam.i, 0), total - 1)
  const item = exam.items[i]
  const picked = exam.ans[i] ?? []
  const answered = exam.ans.filter((a) => a.length > 0).length
  const unanswered = total - answered
  const flaggedCount = Object.values(exam.flags).filter(Boolean).length
  const flagged = !!exam.flags[i]
  const first = i === 0
  const last = i === total - 1

  const goTo = useCallback((idx: number) => setExam((e) => e && { ...e, i: idx }), [setExam])
  // Relative moves and picks read the live exam, so fast key presses never act on a stale question.
  const step = useCallback(
    (delta: number) =>
      setExam((e) => {
        if (!e) return e
        const to = e.i + delta
        return to >= 0 && to < e.items.length ? { ...e, i: to } : e
      }),
    [setExam],
  )
  const choose = useCallback((k: number) => setExam((e) => e && withAnswer(e, k)), [setExam])
  const chooseAt = useCallback(
    (pos: number) =>
      setExam((e) => {
        const opt = e?.items[e.i]?.opts[pos]
        return e && opt ? withAnswer(e, opt.k) : e
      }),
    [setExam],
  )
  const toggleFlag = useCallback(
    () => setExam((e) => e && { ...e, flags: { ...e.flags, [e.i]: !e.flags[e.i] } }),
    [setExam],
  )

  const toggleKeys = (on: boolean) => {
    setKeysOn(on)
    saveShortcuts(on)
  }

  const confirmSubmit = () => {
    setSubmitOpen(false)
    submit()
    focusNextTitle()
  }

  // Leave without recording anything: no history entry, no misses, back to the mode picker.
  const quit = () => {
    setQuitOpen(false)
    setExam(null)
    window.scrollTo({ top: 0 })
    focusNextTitle()
  }

  // Keys: 1–N pick by displayed position, ← → move. Off when switched off, while a dialog is open, or while typing.
  // The course switcher, its list and tab lists keep their own keys (decision 19: "d2" in the open list never answers).
  useEffect(() => {
    if (!keysOn || submitOpen || quitOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || ev.isComposing) return
      const t = ev.target
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          t.closest("input, select, textarea, [role=combobox], [role=listbox], [role=tablist]"))
      )
        return
      if (/^[1-9]$/.test(ev.key)) {
        if (!ev.repeat) chooseAt(Number(ev.key) - 1)
      } else if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        // a focused code block that overflows keeps its arrows for scrolling sideways
        const pre = t instanceof HTMLElement ? t.closest("pre") : null
        if (pre && pre.scrollWidth > pre.clientWidth) return
        ev.preventDefault()
        step(ev.key === "ArrowRight" ? 1 : -1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [keysOn, submitOpen, quitOpen, chooseAt, step])

  // Previous turns disabled on the first question. If it had focus, hand focus to Next instead of losing it.
  useLayoutEffect(() => {
    if (first && document.activeElement === prevRef.current) nextRef.current?.focus({ preventScroll: true })
  }, [first])

  // After a move, if the card's top has scrolled up behind the pinned bar, glide it back into view.
  const shownIndex = useRef(i)
  useEffect(() => {
    if (shownIndex.current === i) return
    shownIndex.current = i
    const card = cardRef.current
    const bar = barRef.current
    if (!card || !bar) return
    const edge = pinnedBottom(bar)
    const top = card.getBoundingClientRect().top
    if (top < edge) {
      window.scrollTo({
        top: window.scrollY + top - edge - 12,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      })
    }
  }, [i])

  return (
    <>
      {/* The h1 is the exam name, plain text: below 768 the visible name line above the bar (`subheading`, wrapping
          between words, scrolling away), sr-only from 768, where the bar's Badge shows the name (decision 40) */}
      <h1 tabIndex={-1} className="mt-8 font-mono text-base font-semibold text-foreground md:sr-only">
        {exam.name}
      </h1>

      {/* ── Exam bar: a sticky bar (Surfaces): 16px plus the top inset on phones (the nav is docked at the bottom),
             under the top band from 640, static on short screens. Below 768 two rows: Progress with its count, then
             the timer, Quit and Submit; one row with the name Badge from 768. ── */}
      <Card
        ref={barRef}
        className="sticky top-[calc(16px+env(safe-area-inset-top))] z-30 mt-4 sm:top-[calc(max(24px,env(safe-area-inset-top))+56px)] md:mt-8 short:static"
      >
        <CardContent className="flex flex-wrap items-center gap-2 p-4 md:flex-nowrap md:gap-x-4">
          <Badge variant="outline" size="lg" className="hidden min-w-0 md:inline-flex">
            <span className="truncate">{exam.name}</span>
          </Badge>
          <div className="flex basis-full items-center gap-4 md:flex-1 md:basis-0">
            {/* Progress forwards `value` to the Radix root; the rounded aria-valuenow and the count as aria-valuetext
                read better than a fractional percentage */}
            <Progress
              value={(100 * answered) / total}
              aria-label="Exam progress"
              aria-valuenow={Math.round((100 * answered) / total)}
              aria-valuetext={`${answered} of ${total} answered`}
              className="min-w-[120px] flex-1"
            />
            <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
              {answered}/{total} answered
            </span>
          </div>
          <div className="ml-auto md:ml-0">
            <ExamTimer start={exam.start} />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setQuitOpen(true)}>
            Quit<span className="sr-only"> exam</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSubmitOpen(true)}>
            Submit
          </Button>
        </CardContent>
      </Card>

      <BlurFade delay={0.04}>
        <Navigator exam={exam} current={i} onGo={goTo} />
      </BlurFade>

      <BlurFade delay={0.08}>
        <div ref={cardRef}>
          <QuestionFrame>
            <QuestionMeta right={<QuestionCount index={i + 1} total={total} />}>
              <span>Question</span>
              {item.remix && (
                <Badge variant="info" appearance="light" size="sm">
                  <Repeat aria-hidden="true" />
                  <span>
                    Remix of <span className="font-mono">Q{pad(item.n, QUESTIONS.length)}</span>
                  </span>
                </Badge>
              )}
              {item.multi && (
                <Badge variant="secondary" size="sm">
                  Choose {item.correct.length}
                </Badge>
              )}
            </QuestionMeta>

            <BlurFade key={i} duration={0.25}>
              <QuestionBody item={item} index={i} total={total} picked={picked} onChoose={choose} />
            </BlurFade>

            {/* Footer stays mounted across questions so focus on Previous / Next survives a move. */}
            <QuestionFooter
              start={
                <QuestionButton ref={prevRef} look="nav" disabled={first} onClick={() => step(-1)}>
                  Previous
                </QuestionButton>
              }
            >
              <QuestionButton look="skip" aria-pressed={flagged} onClick={toggleFlag}>
                <Flag className={cn("size-3.5", flagged && "fill-current")} aria-hidden="true" />
                {flagged ? "Flagged" : "Flag for review"}
              </QuestionButton>
              <QuestionButton ref={nextRef} look="submit" onClick={last ? () => setSubmitOpen(true) : () => step(1)}>
                {last ? "Submit exam" : "Next"}
              </QuestionButton>
            </QuestionFooter>
          </QuestionFrame>
        </div>

        {/* Keys hint (Kbd README: only under any-hover, so a bare touch screen shows none; arrow keys as lucide icons
            in the caps) + the switch that turns the single-key shortcuts off, shown everywhere. Only the hint is
            muted: the Switch's Label stays `foreground`. */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
          {keysOn && (
            <div className="hidden flex-wrap items-center justify-end gap-x-2 gap-y-1 text-muted-foreground [@media(any-hover:hover)]:flex">
              <span>Keys:</span>
              <KbdGroup>
                <Kbd>1</Kbd>
                <span>–</span>
                <Kbd>{item.opts.length}</Kbd>
              </KbdGroup>
              <span>pick</span>
              <span aria-hidden="true">·</span>
              <KbdGroup aria-hidden="true">
                <Kbd>
                  <ArrowLeft />
                </Kbd>
                <Kbd>
                  <ArrowRight />
                </Kbd>
              </KbdGroup>
              <span className="sr-only">left and right arrow keys</span>
              <span>move</span>
            </div>
          )}
          {/* on touch the row with its Label is the 44px target (Switch README) */}
          <div className="flex items-center gap-2 pointer-coarse:min-h-11">
            <Switch id={keysId} checked={keysOn} onCheckedChange={toggleKeys} />
            <Label htmlFor={keysId} className="pointer-coarse:flex pointer-coarse:items-center pointer-coarse:self-stretch">
              <span className="sr-only">Keyboard </span>Shortcuts
            </Label>
          </div>
        </div>
      </BlurFade>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            // Not destructive: start on Submit, as before (no autoFocus, so a held Enter can't fire it).
            submitFocus.remember()
            e.preventDefault()
            submitActionRef.current?.focus()
          }}
          onCloseAutoFocus={submitFocus.onCloseAutoFocus}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {unanswered > 0 ? (
                <>
                  <b className="text-foreground">{unanswered}</b> unanswered (they count as wrong).{" "}
                </>
              ) : (
                "Every question answered. "
              )}
              {flaggedCount > 0 && (
                <>
                  <b className="text-foreground">{flaggedCount}</b> flagged for review.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction ref={submitActionRef} onClick={confirmSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={quitOpen} onOpenChange={setQuitOpen}>
        {/* Destructive: Radix starts on Cancel. */}
        <AlertDialogContent onOpenAutoFocus={quitFocus.remember} onCloseAutoFocus={quitFocus.onCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this exam?</AlertDialogTitle>
            <AlertDialogDescription>Nothing will be recorded.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={quit}>
              Leave exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function Runner(props: RunnerProps) {
  const { exam, setExam } = props
  if (exam.items.length === 0) {
    return (
      <>
        <h1 tabIndex={-1} className="sr-only">
          {exam.name}
        </h1>
        <div className="mt-12 flex justify-center sm:mt-16">
          <EmptyState
            icons={[ClipboardX]}
            title="Nothing to practice"
            description="This exam came up empty. Pick another mode and try again."
            action={{
              label: "Other modes",
              onClick: () => {
                setExam(null)
                focusNextTitle()
              },
            }}
          />
        </div>
      </>
    )
  }
  // keyed by start time so a brand-new exam never inherits the previous run's UI state
  return <ExamRunner key={exam.start} {...props} />
}
