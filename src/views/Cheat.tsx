/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Cheat Sheet: everything worth memorizing on one page.
 * A sticky quick-jump Card (with scroll-spy) leads to one Card per section: the formulas, a filterable signal-words
 * table, four reference tables and the 8 great ideas. The formulas, signal words and ARM reference are also C952's
 * flashcards (decision 57), so the last of the three, ARM / LEGv8, ends with a secondary "Drill as flashcards" link to
 * the Practice Exam's Flashcards (while a C952 exam runs, a line saying to submit or quit it first). Built from the
 * collected 21st.dev components: shadcn Card, Table, Button, Input, Kbd, Separator and Alert, ReUI Badge, Magic UI
 * BlurFade, serafimcloud EmptyState and the Motiq DecryptText h1 (Surfaces, #cheat).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import {
  ArrowRight,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Grid2x2,
  HardDrive,
  Lightbulb,
  MoveHorizontal,
  Pyramid,
  Radar,
  SearchX,
  Sigma,
  Sparkles,
  Terminal,
  X,
} from "lucide-react"
import { ARM_REF, C952_CARDS, FLYNN, FORMULAS, GREAT_IDEAS, MEMORY, RAID, SIGNALS, SIGNALS_HEAD, SIGNALS_LEAD } from "@/data"
import { C952, drillPatch } from "@/lib/course"
import { hrefFor, onPlainClick } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { C952CheatProps } from "@/views/types"
import { Rich } from "@/components/kit"
import { ExamInProgressNotice } from "@/components/notices"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { DecryptText } from "@/components/ui/decrypt-text"
import { EmptyState } from "@/components/ui/empty-state"
// shadcn Input: the input.tsx bundled with the collected kbd, card, tabs and dialog prompts (no standalone input prompt)
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/* Type styles (Surfaces, Style shorthand) */
const PAGE_TITLE = "Cheat Sheet"
/** the Title decrypt recipe's className (`title`) */
const TITLE = "mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
const LEAD = "mt-4 max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"
/** `heading`: CardTitle's style, for section headings that must be an h2 (CardTitle renders an h3) */
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
/** The current jump item: the active-tab look (Surfaces, Sticky bar), the same current-item bar as Tabs */
const CURRENT_ITEM = "bg-accent text-foreground shadow-[inset_0_-2px_0_var(--primary)]"

const SECTIONS = [
  { id: "cheat-formulas", label: "Formulas", title: "The formulas", icon: Sigma },
  {
    id: "cheat-signals",
    label: "Signal words",
    // interface arrows are the lucide icon, never the → character (Geist Mono lacks it); screen readers keep the →
    title: (
      <>
        Signal words <ArrowRight className="inline-block size-5 align-middle" aria-hidden="true" />
        <span className="sr-only">→</span> answer
      </>
    ),
    icon: Radar,
  },
  { id: "cheat-flynn", label: "Flynn's taxonomy", title: "Flynn's taxonomy", icon: Grid2x2 },
  { id: "cheat-raid", label: "RAID", title: "RAID levels", icon: HardDrive },
  { id: "cheat-arm", label: "ARM / LEGv8", title: "ARM / LEGv8 quick reference", icon: Terminal },
  { id: "cheat-ideas", label: "8 great ideas", title: "The 8 great ideas", icon: Sparkles },
  { id: "cheat-memory", label: "Memory pyramid", title: "Memory pyramid", icon: Pyramid },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

/** Space between the bottom of the jump bar and a section's card after a jump. */
const GAP = 16

const pad = (n: number) => String(n).padStart(2, "0")

/** JS-driven smooth scrolling ignores the global CSS reduced-motion rule, so check it here. */
function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

/* ── Signal-word highlighting ───────────────────────────────────────────── */

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

/** Plain text to HTML, wrapping every case-insensitive match of `q` in <mark>. */
function highlight(text: string, q: string) {
  if (!q) return escapeHtml(text)
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text
    .split(re)
    .map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join("")
}

/* ── Scroll-spy ─────────────────────────────────────────────────────────── */

/** Keys that scroll the page when focus isn't in a text field. */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "])

/**
 * Which section sits under the jump bar.
 * `hold(id, top)` lights the clicked button at once and keeps it lit while the jump's own scroll runs and after it
 * lands, so it stays lit even when a short last section can't reach the bar. The hold ends with the first scroll
 * that isn't the jump's: one that follows the reader's own input (wheel, pointer, scroll keys) or one that moves
 * away from the jump's target. So the buttons follow the reader from the first frame and never freeze on the
 * clicked one. The timer is only a fallback for a take-over that leaves no trace (dragging the scrollbar toward
 * the target and letting go short of it).
 */
function useScrollSpy(barBottom: () => number, barRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<SectionId | null>(null)
  const held = useRef<{ top: number; last: number; reader: boolean; timer: number } | null>(null)

  const measure = useCallback(() => {
    const doc = document.documentElement
    // at the very bottom the last, short sections can never reach the bar: count the last one as current
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
      setActive(SECTIONS[SECTIONS.length - 1].id)
      return
    }
    const line = barBottom() + GAP + 8
    let current: SectionId | null = null
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el && el.getBoundingClientRect().top <= line) current = s.id
    }
    setActive(current)
  }, [barBottom])

  /** End a jump's hold and light the section the page is really on. */
  const release = useCallback(() => {
    const h = held.current
    if (!h) return
    window.clearTimeout(h.timer)
    held.current = null
    measure()
  }, [measure])

  useEffect(() => {
    // scroll and resize already fire at most once per frame, so no extra throttling is needed
    const onScroll = () => {
      const h = held.current
      if (!h) {
        measure()
        return
      }
      const y = window.scrollY
      // the jump's own scroll only ever closes in on its target; anything else is the reader's
      if (h.reader || Math.abs(h.top - y) > Math.abs(h.top - h.last) + 1) {
        release()
        return
      }
      h.last = y
      window.clearTimeout(h.timer)
      h.timer = window.setTimeout(() => {
        if (held.current === h && Math.abs(window.scrollY - h.top) > 4) release()
      }, 200)
    }
    // the reader's own input: whatever scroll follows is theirs (a tap alone changes nothing)
    const onWheel = () => {
      if (held.current) held.current.reader = true
    }
    const onPointer = (e: PointerEvent) => {
      const h = held.current
      // a press on a jump button is most likely another jump, which sets a hold of its own
      if (h && !(e.target instanceof Node && barRef.current?.contains(e.target))) h.reader = true
    }
    const onKey = (e: KeyboardEvent) => {
      const h = held.current
      if (!h || !SCROLL_KEYS.has(e.key)) return
      const t = e.target
      if (t instanceof HTMLElement) {
        if (t.isContentEditable || t.closest("input, textarea, select")) return
        // Space on a button presses it rather than scrolling
        if (e.key === " " && t.closest("button, a, summary, [role='button']")) return
      }
      h.reader = true
    }
    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("pointerdown", onPointer, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      if (held.current) window.clearTimeout(held.current.timer)
      held.current = null
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [measure, release, barRef])

  const hold = useCallback((id: SectionId, top: number) => {
    if (held.current) window.clearTimeout(held.current.timer)
    held.current = { top, last: window.scrollY, reader: false, timer: 0 }
    setActive(id)
  }, [])

  return [active, hold] as const
}

/* ── Table ──────────────────────────────────────────────────────────────── */

/**
 * Tracks whether a Table's own scroll box (the overflow wrapper the shadcn Table renders around its <table>)
 * overflows sideways and whether it's scrolled to either end. While it overflows, that box is made a focusable,
 * named region so keyboard users can scroll it.
 */
function useSideScroll(tableRef: RefObject<HTMLTableElement | null>, label: string) {
  const [state, setState] = useState({ scrollable: false, atStart: true, atEnd: true })
  useEffect(() => {
    const table = tableRef.current
    const el = table?.parentElement
    if (!table || !el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      const next = { scrollable: max > 1, atStart: el.scrollLeft <= 1, atEnd: el.scrollLeft >= max - 1 }
      setState((s) => (s.scrollable === next.scrollable && s.atStart === next.atStart && s.atEnd === next.atEnd ? s : next))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    ro.observe(table)
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", update)
    }
  }, [tableRef])

  useEffect(() => {
    const el = tableRef.current?.parentElement
    if (!el) return
    if (state.scrollable) {
      el.tabIndex = 0
      el.setAttribute("role", "region")
      el.setAttribute("aria-label", `${label} (scrolls sideways)`)
    } else {
      el.removeAttribute("tabindex")
      el.removeAttribute("role")
      el.removeAttribute("aria-label")
    }
  }, [state.scrollable, label, tableRef])

  return state
}

/**
 * One shadcn Table for the whole sheet. The first column names the row, so it renders as a row header: data, not a
 * column label, so it drops the header's `label` style (Table README). Cells are mono like the rest of the interface
 * (terms, numbers, codes, formulas); the columns of sentences people read are set in sans (`sansCols`).
 */
function DataTable({
  head,
  rows,
  label,
  minWidth,
  nowrapFirst = false,
  sansCols = [],
}: {
  head: string[]
  rows: ReactNode[][]
  /** accessible name: the table caption, and the scroll region when it overflows */
  label: string
  /** px; wide tables keep this width and scroll sideways on phones instead of squashing */
  minWidth?: number
  /** keep short row labels ("RAID 0", "Main memory") on one line */
  nowrapFirst?: boolean
  /** prose columns (explanations, notes), set in sans */
  sansCols?: number[]
}) {
  const tableRef = useRef<HTMLTableElement>(null)
  const { scrollable, atStart, atEnd } = useSideScroll(tableRef, label)
  const nudge = (dir: 1 | -1) => {
    const el = tableRef.current?.parentElement
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: reducedMotion() ? "auto" : "smooth" })
  }
  return (
    <>
      {/* visible while the table overflows: the cut-off cells otherwise look clipped, and the region's
          "(scrolls sideways)" name only reaches screen readers (so this line is hidden from them) */}
      {scrollable && (
        <CardDescription aria-hidden="true" className="mb-4 flex items-center gap-2 print:hidden">
          <MoveHorizontal className="h-4 w-4 flex-none" />
          Scroll sideways to see every column
        </CardDescription>
      )}
      <div className="relative">
        <Table
          ref={tableRef}
          style={{ minWidth }}
          // keep code tokens whole; filter matches use the theme's selection colors instead of the browser's yellow <mark>
          className="[&_code]:whitespace-nowrap [&_mark]:bg-primary [&_mark]:text-primary-foreground"
        >
          <TableCaption className="sr-only">{label}</TableCaption>
          <TableHeader>
            <TableRow>
              {head.map((h, i) =>
                h ? (
                  <TableHead key={i} scope="col">
                    {h}
                  </TableHead>
                ) : (
                  // empty corner cell above the row headers (Flynn's taxonomy)
                  <TableCell key={i} />
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, r) => (
              <TableRow key={r}>
                {/* content HTML renders through Rich, whose `.rich` class is sans: mono cells set it back on Rich too */}
                {row.map((cell, c) =>
                  c === 0 ? (
                    <TableHead
                      key={c}
                      scope="row"
                      className={cn(
                        "text-sm normal-case tracking-normal text-foreground [&_.rich]:font-mono",
                        nowrapFirst && "whitespace-nowrap",
                      )}
                    >
                      {cell}
                    </TableHead>
                  ) : (
                    <TableCell key={c} className={sansCols.includes(c) ? "font-sans" : "[&_.rich]:font-mono"}>
                      {cell}
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* visible "more this way" cue + pointer shortcut; keyboard users scroll the focusable region itself */}
        {scrollable && !atStart && <NudgeButton side="left" label={label} onClick={() => nudge(-1)} />}
        {scrollable && !atEnd && <NudgeButton side="right" label={label} onClick={() => nudge(1)} />}
      </div>
    </>
  )
}

/**
 * The outline Button is transparent now (Button restyle), and this one sits over the table's header row, so it takes
 * the window's own fill (`card`) to stay legible; its hover is still `accent`. Out of the tab order (keyboard users
 * scroll the named region), but a named button for screen readers rather than an aria-hidden one, which must never
 * hold a focusable element.
 */
function NudgeButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      tabIndex={-1}
      aria-label={`Scroll ${label} ${side}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("absolute top-1 bg-card print:hidden", side === "left" ? "left-1" : "right-1")}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  )
}

/** HTML table cells from the C952 content (bold, code) as Rich spans. */
const htmlRows = (rows: string[][] | null) => (rows ?? []).map((row) => row.map((html) => <Rich as="span" html={html} />))

/* ── Section shell ──────────────────────────────────────────────────────── */

function CheatSection({ id, lead, children }: { id: SectionId; lead?: ReactNode; children: ReactNode }) {
  const n = SECTIONS.findIndex((s) => s.id === id)
  const { title, icon: Icon } = SECTIONS[n]
  // The page's scroll padding already clears the app's top chrome + jump bar (see Cheat), so native scrolls only need
  // the jump's gap here. The h2 takes focus after a jump (tabIndex -1: focusable by script, not in the tab order).
  return (
    <section id={id} className="mt-6 scroll-mt-4">
      <BlurFade inView>
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              <Icon aria-hidden="true" />
              <span aria-hidden="true">
                {pad(n + 1)} / {pad(SECTIONS.length)}
              </span>
              <span className="sr-only">
                Section {n + 1} of {SECTIONS.length}
              </span>
            </Badge>
            <h2 tabIndex={-1} className={cn("w-fit rounded-md", HEADING)}>
              {title}
            </h2>
            {lead && <CardDescription>{lead}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </BlurFade>
    </section>
  )
}

/* ── View ───────────────────────────────────────────────────────────────── */

export default function Cheat({ navigate, store, runningExam }: C952CheatProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLUListElement>(null)
  const filterRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  /**
   * Viewport y of the stuck jump bar's bottom edge (its `top`, which clears the app's nav, plus its height); 0 while
   * the bar doesn't stick.
   */
  const barBottom = useCallback(() => {
    const bar = barRef.current
    if (!bar) return 0
    const cs = getComputedStyle(bar)
    // on short screens the bar unpins and scrolls away (the app header does too), so nothing covers the top of the page
    return cs.position === "sticky" ? (parseFloat(cs.top) || 0) + bar.offsetHeight : 0
  }, [])

  const [active, hold] = useScrollSpy(barBottom, barRef)

  // Keyboard focus must never land under the app chrome + jump bar (WCAG 2.4.11). While the bar sticks, the page's
  // scroll padding follows its real bottom edge (+12px), and only its top while focus is inside the bar, so focusing
  // a jump button never scrolls the page; otherwise "" hands it back to index.css (CONTRACTS, convention 9). The
  // previous inline value comes back on unmount.
  useLayoutEffect(() => {
    const root = document.documentElement
    const bar = barRef.current
    const prev = root.style.scrollPaddingTop
    let inside = !!bar?.contains(document.activeElement)
    const sync = () => {
      const bottom = barBottom()
      const top = bar && bottom ? parseFloat(getComputedStyle(bar).top) || 0 : 0
      root.style.scrollPaddingTop = !bottom ? "" : `${Math.ceil(inside ? top : bottom + 12)}px`
    }
    // focusout names the control focus moves to (relatedTarget) and runs before the browser scrolls that control into
    // view, so the padding is set in time; focusin runs after the scroll and settles focus that came from nowhere
    const onFocusOut = (e: FocusEvent) => {
      inside = !!bar && e.relatedTarget instanceof Node && bar.contains(e.relatedTarget)
      sync()
    }
    // focus from <body> (no focusout names it, as after a click in Safari) is scrolled before focusin runs: a key that
    // moves it into the stuck bar puts the page back where the key found it
    let keyY: number | null = null
    const onKeyDown = () => {
      const cs = bar && getComputedStyle(bar)
      const stuck = !!bar && cs?.position === "sticky" && Math.abs(bar.getBoundingClientRect().top - (parseFloat(cs.top) || 0)) < 1
      keyY = stuck ? window.scrollY : null
      setTimeout(() => (keyY = null))
    }
    const onFocusIn = (e: FocusEvent) => {
      inside = !!bar && e.target instanceof Node && bar.contains(e.target)
      if (inside && !e.relatedTarget && keyY !== null && window.scrollY !== keyY) window.scrollTo({ top: keyY, behavior: "instant" })
      sync()
    }
    sync()
    // the bar's height can change without a window resize (text-only zoom scales the rem-sized buttons); its top
    // changes with the window (16px, 56px under the top band from 640, plus the top inset; unpinned on short screens)
    const ro = new ResizeObserver(sync)
    if (bar) ro.observe(bar)
    document.addEventListener("focusout", onFocusOut)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("resize", sync)
    return () => {
      ro.disconnect()
      document.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("resize", sync)
      root.style.scrollPaddingTop = prev
    }
  }, [barBottom])

  const jump = useCallback(
    (id: SectionId, focusTarget?: HTMLElement | null) => {
      const el = document.getElementById(id)
      if (!el) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const top = Math.round(Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - barBottom() - GAP)))
      hold(id, top)
      window.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" })
      // carry keyboard / screen-reader focus to the section too, without a second scroll
      const target = focusTarget ?? el.querySelector<HTMLElement>("h2")
      target?.focus({ preventScroll: true })
    },
    [barBottom, hold],
  )

  // keep the lit button centered in the sideways-scrolling bar (phones); back to the start above the first section
  useEffect(() => {
    const list = pillsRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const pill = active ? list.querySelector<HTMLElement>(`[data-section="${active}"]`) : null
    list.scrollTo({
      left: pill ? pill.offsetLeft - (list.clientWidth - pill.offsetWidth) / 2 : 0,
      behavior: reducedMotion() ? "auto" : "smooth",
    })
  }, [active])

  // "/" jumps to the signal-word filter, like most search boxes on the web
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select"))) return
      e.preventDefault()
      jump("cheat-signals", filterRef.current)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [jump])

  const q = query.trim()
  const signalRows = useMemo(() => {
    const needle = q.toLowerCase()
    return SIGNALS.filter(([say, think]) => say.toLowerCase().includes(needle) || think.toLowerCase().includes(needle)).map(
      ([say, think]) => [<Rich as="span" html={highlight(say, q)} />, <Rich as="span" html={`<b>${highlight(think, q)}</b>`} />],
    )
  }, [q])

  // the clear button disappears once the filter is empty, so focus goes back to the field
  const clear = () => {
    setQuery("")
    filterRef.current?.focus()
  }

  // The Practice Exam, opened on Flashcards, as a guide's Cheat Sheet opens its Practice (drillPatch: the card list
  // used last, or All when that list has no cards now). A finished exam's Results give way to them (examEntryOpens)
  const practice = hrefFor("exam", C952)
  const drill = () => navigate(practice, drillPatch(C952, C952_CARDS.length, store))

  return (
    <>
      {/* While a C952 exam runs: the exam Alert at the top (decision 28), taking the header's top margin; the header
          then mt-8 (CONTRACTS, open question 17) */}
      <ExamInProgressNotice exam={runningExam} navigate={navigate} className="mt-12 sm:mt-16 short:mt-6" />
      {/* The page header: nothing frames it (it sits on the dimmed field) and it takes no BlurFade, since the h1
          decrypt is its one entrance */}
      <header className={runningExam ? "mt-8" : "mt-12 sm:mt-16 short:mt-6"}>
        <Badge variant="secondary">
          <BookMarked aria-hidden="true" />
          C952 · Reference
        </Badge>
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
        <p className={LEAD}>Everything worth memorizing on one page. Read it right before your exam.</p>
      </header>

      {/* ── Quick-jump bar: a sticky Card under the app's nav (16px plus the top inset on phones, where the nav is
            docked at the bottom; under the top band from 640), static on short screens (decision 40)
            (keep it a direct child of <main>, outside any BlurFade, or it can't stick) ── */}
      <Card
        ref={barRef}
        className="sticky top-[calc(16px+env(safe-area-inset-top))] z-30 mt-8 sm:top-[calc(max(24px,env(safe-area-inset-top))+56px)] short:static"
      >
        <nav aria-label="Jump to section">
          <ul
            ref={pillsRef}
            role="list"
            className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SECTIONS.map((s) => {
              const on = active === s.id
              return (
                <li key={s.id} className="flex-none">
                  <Button
                    size="sm"
                    variant="ghost"
                    data-section={s.id}
                    aria-current={on ? "location" : undefined}
                    onClick={() => jump(s.id)}
                    className={cn(on && CURRENT_ITEM)}
                  >
                    {s.label}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      </Card>

      <BlurFade delay={0.08} className="mt-8">
        {/* role="note": a static study note, not an alert to announce (Alert sets role="alert") */}
        <Alert role="note">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Like you're 5</AlertTitle>
          <AlertDescription>
            Formulas are recipes. You don't have to understand the oven to follow a recipe. Plug numbers into the boxes,
            and watch your units (GHz ↔ ns, ps = 10⁻¹²).
          </AlertDescription>
        </Alert>
      </BlurFade>

      {/* ── Formulas ─────────────────────────────────────────── */}
      <CheatSection id="cheat-formulas">
        <DataTable
          label="The formulas"
          head={["Formula", "Equation", "Example / note"]}
          rows={FORMULAS.map(([name, formula, example]) => [name, formula, example])}
          minWidth={640}
          sansCols={[2]}
        />
      </CheatSection>

      {/* ── Signal words ─────────────────────────────────────── */}
      <CheatSection id="cheat-signals" lead={SIGNALS_LEAD}>
        {/* below 640 the field takes its own line, so its placeholder (its only visible label) shows whole; Clear
            and the count share the next line */}
        <div className="mb-4 flex items-center gap-2 max-sm:flex-wrap">
          <div className="relative min-w-0 flex-1 max-sm:basis-full sm:max-w-[380px]">
            <Input
              ref={filterRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault()
                  setQuery("")
                }
              }}
              placeholder="Filter signal words…"
              aria-label="Filter signal words"
              aria-keyshortcuts="/"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              // 16px below md so iOS doesn't zoom into the field; room for the key hint; one clear button (ours), not the browser's too
              className="text-base md:text-sm [@media(any-hover:hover)]:pr-12 [&::-webkit-search-cancel-button]:hidden"
            />
            {/* key hints for keyboard users ("/" gets here, Esc clears), under any-hover: an iPad with a trackpad shows
                them, a bare touch screen does not (Kbd README) */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 hidden items-center [@media(any-hover:hover)]:flex"
            >
              <Kbd>{query ? "Esc" : "/"}</Kbd>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear filter"
            onClick={clear}
            className={cn("flex-none", !query && "invisible")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
          <p aria-live="polite" className="ml-auto flex-none text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{signalRows.length}</span> of {SIGNALS.length}
            <span className="sr-only"> signal words shown</span>
          </p>
        </div>
        {signalRows.length > 0 ? (
          <DataTable label="Signal words" head={SIGNALS_HEAD} rows={signalRows} />
        ) : (
          <div className="flex justify-center">
            <EmptyState
              title="No matches"
              description={`No signal words contain “${q}”.`}
              icons={[SearchX]}
              action={{ label: "Clear filter", onClick: clear }}
            />
          </div>
        )}
      </CheatSection>

      {/* ── Reference tables ─────────────────────────────────── */}
      <CheatSection id="cheat-flynn">
        <DataTable
          label="Flynn's taxonomy"
          head={FLYNN.head}
          rows={htmlRows(FLYNN.rows)}
          minWidth={520}
          nowrapFirst
          sansCols={[1, 2]}
        />
      </CheatSection>

      <CheatSection id="cheat-raid">
        <DataTable label="RAID levels" head={RAID.head} rows={htmlRows(RAID.rows)} minWidth={720} nowrapFirst sansCols={[4]} />
      </CheatSection>

      <CheatSection id="cheat-arm">
        {/* two columns read better wrapped than scrolled on phones, so no min width here (same as Signal words) */}
        <DataTable label="ARM / LEGv8 quick reference" head={ARM_REF.head} rows={htmlRows(ARM_REF.rows)} sansCols={[1]} />
        {/* decision 57: the way on to C952's flashcards, at the end of the last of their three sections (formulas,
            signal words, this one), as a guide's Key facts ends (secondary: the Cheat Sheet has no gold fill). A
            running exam takes #exam/c952, so while one runs the row says how to get there instead of linking to the
            runner; the exam Alert at the top has "Back to exam" */}
        <Separator className="mt-8" />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {runningExam ? (
            <p className="font-sans text-sm text-muted-foreground">
              Done reading? Submit or quit your C952 exam to test yourself on the formulas, signal words and ARM
              reference as flashcards.
            </p>
          ) : (
            <>
              <p className="font-sans text-sm text-muted-foreground">
                Done reading? Test yourself on the formulas, signal words and ARM reference, one card at a time.
              </p>
              <Button variant="secondary" asChild>
                <a href={practice} data-focus-key="cheat:drill-flashcards" onClick={onPlainClick(drill)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  Drill as flashcards
                </a>
              </Button>
            </>
          )}
        </div>
      </CheatSection>

      {/* ── 8 great ideas: numbered outline Badges ───────────── */}
      <CheatSection id="cheat-ideas">
        <ol role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GREAT_IDEAS.map((idea, i) => (
            <li key={idea} className="flex items-start gap-2">
              <Badge variant="outline" className="flex-none">
                {pad(i + 1)}
              </Badge>
              <span className="text-sm leading-6 font-medium">{idea}</span>
            </li>
          ))}
        </ol>
      </CheatSection>

      <CheatSection id="cheat-memory">
        <DataTable label="Memory pyramid" head={MEMORY.head} rows={htmlRows(MEMORY.rows)} minWidth={560} nowrapFirst />
      </CheatSection>
    </>
  )
}
