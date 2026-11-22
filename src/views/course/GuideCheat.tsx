/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * `#cheat/<slug>` for a guide course (decision 22; CourseTools, Cheat Sheet): The exam, Key facts (filterable) and
 * Pitfalls on one page, as C952's Cheat Sheet. Key facts ends with the way on to Practice's Flashcards, which drill
 * the same facts (decision 57): a secondary "Drill as flashcards" link, as Topics ends with "Start practice". The jump
 * bar, its scroll-spy, the section window and the filter row are copied from src/views/Cheat.tsx (_build/CONTRACTS.md,
 * Assignments), generalized to the sections this guide has. Built from the collected 21st.dev components: shadcn Card,
 * Table, Button, Input, Kbd, Separator and Alert, ReUI Badge, Magic UI BlurFade, serafimcloud EmptyState and the Motiq
 * DecryptText h1 (Surfaces, #cheat/<slug>).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { BookMarked, ClipboardCheck, FileText, SearchX, Sigma, TriangleAlert, X, type LucideIcon } from "lucide-react"
import { codeOf, drillPatch } from "@/lib/course"
import { hrefFor, onPlainClick } from "@/lib/routes"
import { safeHtml } from "@/lib/safe-html"
import { cn } from "@/lib/utils"
import type { GuideCheatProps } from "@/views/types"
import {
  Bullets,
  HEADER,
  HEADING,
  LEAD,
  PageTitle,
  STICKY,
  pad,
  plain,
  stuckBottom,
  useStickyPadding,
  type Guide,
} from "@/views/course/shared"
import { GuideGate } from "@/views/course/GuideGate"
import { GuidePending } from "@/views/course/GuideLearn"
import { Rich, SafeRich } from "@/components/kit"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

/** The current jump item: the active-tab look (Surfaces, Sticky bar), underlined in forced colors (decision 34) */
const CURRENT_ITEM = "bg-accent text-foreground shadow-[inset_0_-2px_0_var(--primary)] forced-colors:underline"

/** Space between the bottom of the jump bar and a section's card after a jump. */
const GAP = 16

/** JS-driven smooth scrolling ignores the global CSS reduced-motion rule, so check it here. */
function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

interface Section {
  id: string
  /** the jump bar's word */
  label: string
  /** the section's h2 */
  title: string
  icon: LucideIcon
}

/* ── Key facts matches (CONTRACTS, Assignments: the <mark> method) ──────── */

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }
const UNESCAPES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' }
const escapeText = (s: string) => s.replace(/[&<>"]/g, (c) => ESCAPES[c])
const unescapeText = (s: string) => s.replace(/&(?:amp|lt|gt|quot);/g, (m) => UNESCAPES[m])

/**
 * The sanitizer's output for researched HTML, with every case-insensitive match of `q` wrapped in a gold <mark>, in
 * text nodes only: the guide's own tags (and a link's href) are never touched. Safe for Rich: its input is safeHtml's.
 */
function marked(html: string, q: string) {
  const safe = safeHtml(html)
  if (!q) return safe
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return safe
    .split(/(<[^>]*>)/)
    .map((part, i) =>
      i % 2
        ? part
        : unescapeText(part)
            .split(re)
            .map((t, j) =>
              j % 2 ? `<mark class="bg-primary text-primary-foreground">${escapeText(t)}</mark>` : escapeText(t),
            )
            .join(""),
    )
    .join("")
}

/* ── Scroll-spy (Cheat.tsx's, over this guide's sections) ───────────────── */

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
function useScrollSpy(ids: readonly string[], barBottom: () => number, barRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<string | null>(null)
  const held = useRef<{ top: number; last: number; reader: boolean; timer: number } | null>(null)

  const measure = useCallback(() => {
    const doc = document.documentElement
    // at the very bottom the last, short sections can never reach the bar: count the last one as current
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
      setActive(ids[ids.length - 1] ?? null)
      return
    }
    const line = barBottom() + GAP + 8
    let current: string | null = null
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= line) current = id
    }
    setActive(current)
  }, [ids, barBottom])

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

  const hold = useCallback((id: string, top: number) => {
    if (held.current) window.clearTimeout(held.current.timer)
    held.current = { top, last: window.scrollY, reader: false, timer: 0 }
    setActive(id)
  }, [])

  return [active, hold] as const
}

/* ── Section shell (Cheat.tsx's CheatSection, numbered over this guide's sections) ── */

function CheatSection({
  section,
  index,
  total,
  lead,
  children,
}: {
  section: Section
  index: number
  total: number
  lead?: ReactNode
  children: ReactNode
}) {
  const { id, title, icon: Icon } = section
  // The page's scroll padding already clears the app's top chrome + jump bar, so native scrolls only need the
  // jump's gap here. The h2 takes focus after a jump (tabIndex -1: focusable by script, not in the tab order).
  return (
    <section id={id} className="mt-6 scroll-mt-4">
      <BlurFade inView>
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              <Icon aria-hidden="true" />
              <span aria-hidden="true">
                {pad(index + 1)} / {pad(total)}
              </span>
              <span className="sr-only">
                Section {index + 1} of {total}
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

/** A row header cell as C952's tables draw it: data, not a column label (Table README). */
const ROW_HEAD = "text-sm normal-case tracking-normal text-foreground"
/** Key facts cells (decision 22): long tokens break inside the cell; tighter sides on phones. */
const FACT_CELL = "[overflow-wrap:anywhere] max-sm:px-3"
/** The Fact name: break-word does not shrink the column below its longest word (anywhere does), so from 768, where
 *  the table sizes its columns, names stay whole; below 768 the fixed 2/5 column breaks a word that cannot fit,
 *  hyphenated where the language allows (only there: hyphens let the sized column shrink inside words too). */
const FACT_NAME = "[overflow-wrap:break-word] max-md:hyphens-auto max-sm:px-3"

/* ── View ───────────────────────────────────────────────────────────────── */

export function GuideCheat(props: GuideCheatProps) {
  return (
    <GuideGate course={props.course} title="Cheat Sheet">
      {(guide) => <GuideCheatPage {...props} guide={guide} />}
    </GuideGate>
  )
}

function GuideCheatPage({ course, navigate, store, guide }: GuideCheatProps & { guide: Guide | null }) {
  const code = codeOf(course)
  const barRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLUListElement>(null)
  const filterRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  const a = guide?.assessment ?? null
  const facts = useMemo(() => guide?.keyFacts ?? [], [guide])
  const pitfalls = guide?.pitfalls ?? []
  const hasExam = !!a && (!!a.type || !!a.format || a.tips.length > 0)

  // a section without data leaves the page and the jump bar, and the badges renumber
  const sections = useMemo(
    () =>
      [
        hasExam && { id: "cheat-exam", label: "The exam", title: "The exam", icon: FileText },
        facts.length > 0 && { id: "cheat-facts", label: "Key facts", title: "Key facts", icon: Sigma },
        pitfalls.length > 0 && { id: "cheat-pitfalls", label: "Pitfalls", title: "Common pitfalls", icon: TriangleAlert },
      ].filter((s): s is Section => !!s),
    [hasExam, facts.length, pitfalls.length],
  )
  const ids = useMemo(() => sections.map((s) => s.id), [sections])

  /** Viewport y of the stuck jump bar's bottom edge; 0 while the bar doesn't stick (short screens unpin it). */
  const barBottom = useCallback(() => stuckBottom(barRef.current), [])
  const [active, hold] = useScrollSpy(ids, barBottom, barRef)
  useStickyPadding(barRef)

  const jump = useCallback(
    (id: string, focusTarget?: HTMLElement | null) => {
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

  // "/" jumps to the Key facts filter, like most search boxes on the web
  const hasFacts = facts.length > 0
  useEffect(() => {
    if (!hasFacts) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select"))) return
      e.preventDefault()
      jump("cheat-facts", filterRef.current)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [jump, hasFacts])

  const q = query.trim()
  const factRows = useMemo(() => {
    const needle = q.toLowerCase()
    return facts
      .map((f, i) => ({ ...f, i }))
      .filter((f) => [f.label, f.value, f.note].some((t) => plain(t).toLowerCase().includes(needle)))
  }, [facts, q])

  // the clear button disappears once the filter is empty, so focus goes back to the field
  const clear = () => {
    setQuery("")
    filterRef.current?.focus()
  }

  if (!guide) return <GuidePending course={course} navigate={navigate} />
  const numbered = (id: string) => ({ index: sections.findIndex((s) => s.id === id), total: sections.length })
  const sectionOf = (id: string) => sections.find((s) => s.id === id)!
  // Practice, opened on Flashcards: its cards are these key facts, on the card list the student used last, or All when
  // that list has no cards now (drillPatch), so the link never lands on an empty list
  const practice = hrefFor("exam", course)
  const drill = () => navigate(practice, drillPatch(course, facts.length, store))

  return (
    <>
      {/* The page header: nothing frames it (it sits on the dimmed field) and it takes no BlurFade, since the h1
          decrypt is its one entrance */}
      <header className={HEADER}>
        <Badge variant="secondary">
          <BookMarked aria-hidden="true" />
          {code} · Reference
        </Badge>
        <PageTitle text="Cheat Sheet" />
        <p className={cn(LEAD, "mt-4")}>
          Everything worth memorizing for {code} on one page. Read it right before your exam.
        </p>
      </header>

      {/* ── Quick-jump bar: a sticky Card (keep it a direct child of <main>, outside any BlurFade, or it can't
            stick); below 360px the three items take px-2 and gap-1, so all three show whole at 320 ── */}
      {sections.length > 0 && (
        <Card ref={barRef} className={cn(STICKY, "mt-8")}>
          <nav aria-label="Jump to section">
            <ul
              ref={pillsRef}
              role="list"
              className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none] max-[360px]:gap-1 [&::-webkit-scrollbar]:hidden"
            >
              {sections.map((s) => {
                const on = active === s.id
                return (
                  <li key={s.id} className="flex-none">
                    <Button
                      size="sm"
                      variant="ghost"
                      data-section={s.id}
                      aria-current={on ? "location" : undefined}
                      onClick={() => jump(s.id)}
                      className={cn("max-[360px]:px-2", on && CURRENT_ITEM)}
                    >
                      {s.label}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </Card>
      )}

      {/* ── 01 The exam: Type and Format, then How to pass ── */}
      {hasExam && a && (
        <CheatSection section={sectionOf("cheat-exam")} {...numbered("cheat-exam")}>
          {(a.type || a.format) && (
            <Table>
              <TableCaption className="sr-only">The exam</TableCaption>
              <TableBody>
                {a.type && (
                  <TableRow>
                    <TableHead scope="row" className={cn(ROW_HEAD, "whitespace-nowrap max-sm:px-3")}>
                      Type
                    </TableHead>
                    <TableCell className="font-sans [overflow-wrap:anywhere] max-sm:px-3">
                      <SafeRich as="span" html={a.type} />
                    </TableCell>
                  </TableRow>
                )}
                {a.format && (
                  <TableRow>
                    <TableHead scope="row" className={cn(ROW_HEAD, "whitespace-nowrap max-sm:px-3")}>
                      Format
                    </TableHead>
                    <TableCell className="font-sans [overflow-wrap:anywhere] max-sm:px-3">
                      <SafeRich as="span" html={a.format} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {a.tips.length > 0 && (
            <>
              <h3 className={cn("font-mono text-base font-semibold text-foreground", (a.type || a.format) && "mt-6")}>
                How to pass
              </h3>
              <Bullets items={a.tips} className="mt-4" />
            </>
          )}
        </CheatSection>
      )}

      {/* ── 02 Key facts: C952's filter pattern over Fact · Value · Note ── */}
      {hasFacts && (
        <CheatSection section={sectionOf("cheat-facts")} {...numbered("cheat-facts")}>
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
                placeholder="Filter key facts…"
                aria-label="Filter key facts"
                aria-keyshortcuts="/"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                // room for the key hint where one shows; one clear button (ours), not the browser's too
                className="text-base md:text-sm [@media(any-hover:hover)]:pr-12 [&::-webkit-search-cancel-button]:hidden"
              />
              {/* key hints for keyboard users, where a hover pointer exists: "/" gets here, Esc clears */}
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
              <span className="font-medium text-foreground">{factRows.length}</span> of {facts.length}
              <span className="sr-only"> key facts shown</span>
            </p>
          </div>
          {factRows.length > 0 ? (
            // below 768px the note moves under the value and the table is fixed, the Fact column 2/5 wide
            <Table className="max-md:table-fixed">
              <TableCaption className="sr-only">Key facts</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="max-md:w-2/5 max-sm:px-3">
                    Fact
                  </TableHead>
                  <TableHead scope="col" className="max-sm:px-3">
                    Value
                  </TableHead>
                  <TableHead scope="col" className="hidden md:table-cell">
                    Note
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factRows.map((f) => (
                  <TableRow key={f.i}>
                    <TableHead scope="row" className={cn(ROW_HEAD, FACT_NAME)}>
                      {/* content HTML renders through Rich, whose `.rich` class is sans: mono cells set it back */}
                      <Rich as="span" html={marked(f.label || `Fact ${f.i + 1}`, q)} className="font-mono" />
                    </TableHead>
                    <TableCell className={FACT_CELL}>
                      {f.value && <Rich as="span" html={marked(f.value, q)} className="font-mono" />}
                      {f.note && (
                        <Rich as="p" html={marked(f.note, q)} className="mt-1 font-sans text-muted-foreground md:hidden" />
                      )}
                    </TableCell>
                    <TableCell className={cn("hidden font-sans text-muted-foreground md:table-cell", FACT_CELL)}>
                      {f.note && <Rich as="span" html={marked(f.note, q)} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center">
              <EmptyState
                title="No matches"
                description={`No key facts contain “${q}”.`}
                icons={[SearchX]}
                action={{ label: "Clear filter", onClick: clear }}
              />
            </div>
          )}
          {/* decision 57: the way on to the same facts as flashcards, as Topics' "Start practice" (secondary: the
              Cheat Sheet has no gold fill) */}
          <Separator className="mt-8" />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="font-sans text-sm text-muted-foreground">Done reading? Test yourself one card at a time.</p>
            <Button variant="secondary" asChild>
              <a href={practice} data-focus-key="cheat:drill-flashcards" onClick={onPlainClick(drill)}>
                <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Drill as flashcards
              </a>
            </Button>
          </div>
        </CheatSection>
      )}

      {/* ── 03 Pitfalls: destructive Alerts, two columns from 1024px ── */}
      {pitfalls.length > 0 && (
        <CheatSection section={sectionOf("cheat-pitfalls")} {...numbered("cheat-pitfalls")}>
          <ul role="list" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pitfalls.map((p, i) => (
              <li key={i}>
                <Alert role="note" variant="destructive" className="h-full">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    <SafeRich html={p} className="break-words" />
                  </AlertDescription>
                </Alert>
              </li>
            ))}
          </ul>
        </CheatSection>
      )}
    </>
  )
}
