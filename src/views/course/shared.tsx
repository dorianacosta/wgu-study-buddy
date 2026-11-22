/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The guide's shared module: the parts the course list borrows (style shorthand, PageTitle, Heading, CourseBadges,
 * OUTLINE, assessmentOf, percent; _build/CONTRACTS.md), the guide loader (useGuide, preloadGuide) and the guide-wide
 * helpers (answer matching, tab tables, code blocks, the practice answer Alerts and the flashcard's back, the sticky
 * bars' rules).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { BadgeCheck, Check, CircleCheck, CirclePlay, Link2, Target, Users, Wrench, type LucideIcon } from "lucide-react"
import { GUIDE_INDEX } from "virtual:guide-index"
import { loadRawGuide, peekRawGuide } from "@guide-source"
import { COURSES, type AssessmentType, type Course, type CourseGuide, type GuideResource } from "@/data/courses"
import { cn } from "@/lib/utils"
import { SafeRich } from "@/components/kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/base-badge"
import { DecryptText } from "@/components/ui/decrypt-text"
import { Terminal } from "@/components/ui/terminal"

/* ── Type: the design system's style shorthand (Surfaces, Style shorthand) ─ */

/** `label`: kickers, eyebrows, stat labels, course codes, the Index title */
const LABEL = "font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
/** `lead`, muted: the page lead and a guide's summary */
const LEAD = "max-w-[60ch] font-sans text-base text-muted-foreground sm:text-lg"
/** `heading`: section h2s (CardTitle's own default is the same style) */
const HEADING = "font-mono text-2xl font-semibold tracking-[-0.01em]"
/** the reading column for guide prose (`prose-max`) */
const PROSE = "max-w-[720px]"
/** a prose link outside `.rich` (Surfaces, Prose link): underlined at a 3px offset, gold only under the pointer */
const LINK = "underline underline-offset-[3px] transition-colors hover:text-primary"
/** a link in a table or list on touch: 44px tall (Responsive, Touch targets) */
const TAP_LINK = "pointer-coarse:inline-block pointer-coarse:min-h-11 pointer-coarse:py-2.5"
/** page headers: Surfaces' Page header, `short:mt-6` on short screens (decision 39) */
const HEADER = "mt-12 sm:mt-16 short:mt-6"
/**
 * a page header under the exam-in-progress Alert, which takes HEADER's top margin instead (decision 60, as C952's
 * Cheat Sheet and My Misses do)
 */
const HEADER_AFTER_NOTICE = "mt-8"

/* ── Small helpers ───────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0")
/** n zero-padded to the width of `total` ("07" of 15): Practice's "Q07" and My Misses' "Question 07" */
const padTo = (n: number, total: number) => String(n).padStart(String(total).length, "0")
const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1))
const percent = (n: number, total: number) => (total > 0 ? Math.round((100 * n) / total) : 0)

/** Every page h1: Surfaces' Title decrypt recipe, prop for prop (the App focuses `#app h1` after a route change). */
function PageTitle({ text }: { text: string }) {
  return (
    <DecryptText
      as="h1"
      text={text}
      variant="display"
      trigger="mount"
      loop={false}
      retriggerOnHover={false}
      glyphs="0123456789ABCDEF"
      speed={45}
      stagger={Math.min(40, Math.round(1000 / text.length))}
      startDelay={150}
      jitter={80}
      tabIndex={-1}
      className="mt-4 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
    />
  )
}

/* ── Guide data, coerced at runtime ──────────────────────────────────────── */

const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : ""
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const strs = (v: unknown) => arr(v).map(str).filter(Boolean)
const obj = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }
const decode = (s: string) => s.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
const BREAK_TAGS = /<\/?(?:br|p|div|ul|ol|li)\b[^>]*>/gi
const INLINE_TAGS = /<\/?(?:a|b|strong|i|em|code|sub|sup|span|mark|small|u|s)\b[^>]*>/gi

/** Researched HTML as plain text: for text inside links (a link can't hold a link), labels and answer matching. */
const plain = (html: string) =>
  decode(decode(html).replace(BREAK_TAGS, " ").replace(INLINE_TAGS, "")).replace(/\s+/g, " ").trim()

/** Only http(s) URLs become links. */
function safeHref(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null
  } catch {
    return null
  }
}

function hostOf(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "")
  } catch {
    return ""
  }
}

type ResourceKind = GuideResource["kind"] | "other"

const RESOURCE_GROUPS: { kind: ResourceKind; label: string; icon: LucideIcon }[] = [
  { kind: "official", label: "Official", icon: BadgeCheck },
  { kind: "community", label: "Community", icon: Users },
  { kind: "video", label: "Video", icon: CirclePlay },
  { kind: "practice", label: "Practice", icon: Target },
  { kind: "tool", label: "Tools", icon: Wrench },
  { kind: "other", label: "More", icon: Link2 },
]

function resourceKind(v: unknown): ResourceKind {
  const k = str(v).toLowerCase().replace(/s$/, "")
  return RESOURCE_GROUPS.some((g) => g.kind === k) ? (k as ResourceKind) : "other"
}

/** A study guide after coercion: every array exists and every text field is a string. */
interface Guide {
  summary: string
  /** e.g. "Nov 2026": a leading "Researched" is dropped, the page adds its own */
  updated: string
  assessment: { type: string; format: string; details: string[]; tips: string[] } | null
  competencies: string[]
  topics: { title: string; eli5: string; detail: string; points: string[] }[]
  keyFacts: { label: string; value: string; note: string }[]
  plan: { day: string; focus: string; tasks: string[] }[]
  practice: { q: string; choices: string[]; answer: string; why: string }[]
  pitfalls: string[]
  /** what students said in subreddit posts (any year, shown newest first) */
  community: {
    summary: string
    coverage: string
    posts: { title: string; subreddit: string; date: string; takeaway: string; href: string; host: string }[]
  } | null
  resources: { label: string; note: string; href: string | null; host: string; kind: ResourceKind }[]
  sources: { label: string; href: string; host: string }[]
  caveats: string[]
}

type Topic = Guide["topics"][number]
/** One key fact: the Cheat Sheet's table row and Practice's flashcard (label = front, value and note = back). */
type Fact = Guide["keyFacts"][number]
/**
 * A flashcard (Practice, Flashcards): a key fact and, in a deck that mixes kinds of card (C952's, C952_CARDS in
 * src/data/index.ts), what its front is: "Formula", "Signal word" or "ARM reference", shown above the front. A guide's
 * key facts have no kind, so their cards stay as they are.
 */
type Flashcard = Fact & { kind?: string }
type Practice = Guide["practice"][number]
type Resource = Guide["resources"][number]

/** The guide's parts. A guide is usable when at least one of them has content (normalizeGuide's check). */
const SECTION_ORDER = ["assessment", "topics", "facts", "plan", "practice", "pitfalls", "community", "resources"] as const
type SectionKey = (typeof SECTION_ORDER)[number]

const HAS: Record<SectionKey, (g: Guide) => boolean> = {
  assessment: (g) => !!g.assessment || g.competencies.length > 0,
  topics: (g) => g.topics.length > 0,
  facts: (g) => g.keyFacts.length > 0,
  plan: (g) => g.plan.length > 0,
  practice: (g) => g.practice.length > 0,
  pitfalls: (g) => g.pitfalls.length > 0,
  community: (g) => !!g.community,
  resources: (g) => g.resources.length > 0 || g.sources.length > 0 || g.caveats.length > 0,
}

/** "WGU_CompSci", "r/WGU" or "/r/WGU" → "r/WGU…" */
function subredditOf(v: unknown) {
  const name = plain(str(v)).replace(/^\/?r\//i, "")
  return name ? `r/${name}` : ""
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
/** "Mar 2026" → sortable number (year*12 + month); unparseable → -Infinity so it sorts last. */
function postTime(date: string): number {
  const m = /([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/.exec(date) || /^(\d{4})$/.exec(date.trim())
  if (!m) return -Infinity
  if (m.length === 2) return Number(m[1]) * 12
  const mi = MONTHS.indexOf(m[1].toLowerCase())
  return Number(m[2]) * 12 + (mi < 0 ? 0 : mi)
}

function normalizeGuide(raw: CourseGuide | undefined): Guide | null {
  const g = obj(raw)
  const a = obj(g.assessment)
  const assessment = { type: str(a.type), format: str(a.format), details: strs(a.details), tips: strs(a.tips) }
  const cm = obj(g.community)
  const community = {
    summary: str(cm.summary),
    coverage: str(cm.coverage),
    posts: arr(cm.posts)
      .map(obj)
      .flatMap((p) => {
        const href = safeHref(str(p.url))
        const post = { title: str(p.title), subreddit: subredditOf(p.subreddit), date: str(p.date), takeaway: str(p.takeaway) }
        return href && (post.title || post.takeaway) ? [{ ...post, href, host: hostOf(href) }] : []
      })
      // newest first (dates look like "Mar 2026"); undated posts go last, original order kept within a month
      .map((p, i) => ({ p, i, t: postTime(p.date) }))
      .sort((x, y) => y.t - x.t || x.i - y.i)
      .map(({ p }) => p),
  }
  const guide: Guide = {
    summary: str(g.summary),
    updated: str(g.updated).replace(/^researched\b[\s:,-]*/i, ""),
    assessment:
      assessment.type || assessment.format || assessment.details.length || assessment.tips.length ? assessment : null,
    competencies: strs(g.competencies),
    topics: arr(g.topics)
      .map(obj)
      .map((t) => ({ title: str(t.title), eli5: str(t.eli5), detail: str(t.detail), points: strs(t.points) }))
      .filter((t) => t.title || t.eli5 || t.detail || t.points.length),
    keyFacts: arr(g.keyFacts)
      .map(obj)
      .map((f) => ({ label: str(f.label), value: str(f.value), note: str(f.note) }))
      .filter((f) => f.label || f.value),
    plan: arr(g.plan)
      .map(obj)
      .map((p) => ({ day: str(p.day), focus: str(p.focus), tasks: strs(p.tasks) }))
      .filter((p) => p.focus || p.tasks.length),
    practice: arr(g.practice)
      .map(obj)
      .map((p) => ({ q: str(p.q), choices: strs(p.choices), answer: str(p.answer), why: str(p.why) }))
      .filter((p) => p.q && (p.answer || p.why)),
    pitfalls: strs(g.pitfalls),
    community: community.summary || community.posts.length ? community : null,
    resources: arr(g.resources)
      .map(obj)
      .map((r) => {
        const href = safeHref(str(r.url))
        return { label: str(r.label), note: str(r.note), href, host: href ? hostOf(href) : "", kind: resourceKind(r.kind) }
      })
      .filter((r) => r.label || r.href),
    sources: arr(g.sources)
      .map(obj)
      .flatMap((s) => {
        const href = safeHref(str(s.url))
        return href ? [{ label: str(s.label), href, host: hostOf(href) }] : []
      }),
    caveats: strs(g.caveats),
  }
  return SECTION_ORDER.some((k) => HAS[k](guide)) ? guide : null
}

/**
 * Each guide's outline, coerced, by course slug (null = not researched yet, or nothing usable in the file): ready at
 * startup, with the topics' titles and point counts, the plan's days and the assessment's type and format as written
 * and "·" in every other string (vite.config.ts, guideIndex). Read only those parts; the whole guide comes from
 * useGuide.
 */
const OUTLINE: Record<string, Guide | null> = Object.fromEntries(
  COURSES.map((c) => [c.slug, normalizeGuide(GUIDE_INDEX[c.slug])]),
)

/* ── Loading whole guides ────────────────────────────────────────────────── */

/** Whole guides, coerced, once loaded (null: the course has no usable guide), and the loads in flight. */
const LOADED = new Map<string, Guide | null>()
const LOADING = new Map<string, Promise<Guide | null>>()

/** The whole guide if it's ready now; undefined while it still has to load (the hosted site's first visit). */
function readyGuide(slug: string): Guide | null | undefined {
  if (LOADED.has(slug)) return LOADED.get(slug)
  const raw = peekRawGuide(slug)
  // built into the page (dev, the one-file build), or a course with no guide file: nothing to wait for
  if (raw !== undefined || !GUIDE_INDEX[slug]) {
    const guide = normalizeGuide(raw)
    LOADED.set(slug, guide)
    return guide
  }
  return undefined
}

function loadGuide(slug: string): Promise<Guide | null> {
  const ready = readyGuide(slug)
  if (ready !== undefined) return Promise.resolve(ready)
  let load = LOADING.get(slug)
  if (!load) {
    load = loadRawGuide(slug).then(
      (raw) => {
        const guide = normalizeGuide(raw)
        LOADED.set(slug, guide)
        LOADING.delete(slug)
        return guide
      },
      (error: unknown) => {
        LOADING.delete(slug)
        throw error
      },
    )
    LOADING.set(slug, load)
  }
  return load
}

/** Starts loading a course's guide in the background (the active course's), so it's ready when its tools open. */
function preloadGuide(slug: string) {
  loadGuide(slug).catch(() => {})
}

/** Why a guide didn't load: no answer from the network, or a file the server doesn't have (a newer deploy). */
type GuideFailure = "offline" | "outdated"

/**
 * A course's whole guide for the four guide tools: `guide` is undefined while it loads, null when the course has no
 * usable guide. When loading fails, `failure` says why: "offline" (no answer; `retry` tries again, and `retrying` is
 * true while it does) or "outdated" (the site was redeployed since this page loaded, so its guide addresses are gone;
 * only a reload helps).
 */
function useGuide(slug: string): {
  guide: Guide | null | undefined
  failure: GuideFailure | null
  retrying: boolean
  retry: () => void
} {
  const [, loaded] = useReducer((n: number) => n + 1, 0)
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState<{ slug: string; attempt: number; why: GuideFailure } | null>(null)
  const guide = readyGuide(slug)
  const mine = guide === undefined && failed?.slug === slug ? failed : null
  useEffect(() => {
    if (guide !== undefined) return
    // this attempt already failed: wait for retry, which starts the next one
    if (failed?.slug === slug && failed.attempt === attempt) return
    let live = true
    loadGuide(slug).then(
      () => live && loaded(),
      (error: unknown) => {
        const status = (error as { status?: unknown } | null)?.status
        if (live) setFailed({ slug, attempt, why: status === 404 ? "outdated" : "offline" })
      },
    )
    return () => {
      live = false
    }
  }, [slug, guide, attempt, failed])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { guide, failure: mine?.why ?? null, retrying: !!mine && mine.attempt < attempt, retry }
}

/** The degree plan's assessment type, or what the researched guide found when the plan didn't list one. */
function assessmentOf(c: Course): AssessmentType | null {
  if (c.assessment) return c.assessment
  const m = /^(objective|performance)\b/i.exec(plain(OUTLINE[c.slug]?.assessment?.type ?? ""))
  if (!m) return null
  return m[1].toLowerCase() === "objective" ? "Objective" : "Performance"
}

const assessmentLabel = (k: AssessmentType | null) => (k ? `${k} assessment` : "Assessment TBD")

/* ── Practice answer matching ────────────────────────────────────────────── */

/** Drops a choice's own letter prefix ("B. …", "(B) …") so the letter isn't shown twice. */
function stripLetter(html: string, i: number) {
  return i < 26 ? html.replace(new RegExp(`^\\s*\\(?${letter(i)}[).:]\\s+`), "") : html
}

const norm = (s: string) => plain(s).toLowerCase().replace(/[\s.;,:]+$/, "")

/**
 * Which choice the answer names, when it says so unambiguously: the exact choice text, or an explicit letter
 * ("B", "B.", "(B) …", "Answer: B"). Anything looser could light the wrong row, so it returns null instead.
 */
function correctChoice(answer: string, choices: string[]): number | null {
  if (!answer || choices.length === 0) return null
  const text = norm(answer.replace(/^\s*\(?[A-H][).:]\s+/, ""))
  if (text) {
    const hits = choices.flatMap((c, i) => (norm(stripLetter(c, i)) === text ? [i] : []))
    if (hits.length === 1) return hits[0]
  }
  const t = plain(answer)
  const m =
    /^\(?([A-H])\)?[.:]?$/.exec(t) ??
    /^\(?([A-H])[).:]\s/.exec(t) ??
    /^[Aa]nswer\s*[:\-–]?\s*\(?([A-H])(?:[).:]|$)/.exec(t)
  if (!m) return null
  const i = m[1].charCodeAt(0) - 65
  return i < choices.length ? i : null
}

/* ── Guide tabs ──────────────────────────────────────────────────────────── */

const TABS = {
  overview: { label: "Overview", title: "Overview" },
  topics: { label: "Topics", title: "Topics to know" },
  facts: { label: "Key facts", title: "Key facts" },
  plan: { label: "Study plan", title: "Study plan" },
  practice: { label: "Practice", title: "Practice questions" },
  pitfalls: { label: "Pitfalls", title: "Common pitfalls" },
  community: { label: "Community", title: "What students say" },
  resources: { label: "Resources", title: "Resources" },
  sources: { label: "Sources", title: "Sources" },
} satisfies Record<string, { label: string; title: string }>

type TabKey = keyof typeof TABS
const TAB_ORDER = Object.keys(TABS) as TabKey[]

const TAB_HAS: Record<TabKey, (g: Guide) => boolean> = {
  overview: (g) => !!g.summary || HAS.assessment(g) || g.caveats.length > 0,
  topics: HAS.topics,
  facts: HAS.facts,
  plan: HAS.plan,
  practice: HAS.practice,
  pitfalls: HAS.pitfalls,
  community: HAS.community,
  resources: (g) => g.resources.length > 0,
  sources: (g) => g.sources.length > 0,
}

/* ── Code blocks: code the guides write as lines of its own ──────────────── */

/** A line (between <br>s) that is nothing but one whole <code> span. */
const CODE_LINE = /^\s*<code>((?:(?!<\/?code\b)[\s\S])*?)<\/code>\s*$/i
const LINE_BREAK = /<br\s*\/?>/i

/** A code line's text: tags dropped, entities decoded once (as SafeRich shows them), no-break spaces as spaces. */
const codeText = (html: string) => decode(html.replace(INLINE_TAGS, "")).replace(/\u00a0/g, " ")

type Block = { code: false; html: string } | { code: true; text: string }

/**
 * Splits researched HTML into prose and code blocks. A run of lines that are each one whole <code> span is a code
 * block (one line per code line); everything else stays prose: inline code inside a sentence, and a value that is a
 * single <code> span with no line break (a formula, a command), which keeps the `.rich code` chip.
 */
function blocks(html: string): Block[] {
  const lines = html.split(LINE_BREAK)
  if (lines.length < 2) return [{ code: false, html }]
  const out: Block[] = []
  for (const line of lines) {
    const m = CODE_LINE.exec(line)
    const last = out[out.length - 1]
    if (m) {
      const text = codeText(m[1])
      if (last?.code) last.text += `\n${text}`
      else out.push({ code: true, text })
    } else if (last && !last.code) last.html += `<br>${line}`
    else out.push({ code: false, html: line })
  }
  return out
}

/** Surfaces' Code block recipe: the code's lines as output, all at once, no idle caret. */
function CodeBlock({ code }: { code: string }) {
  const lines = useMemo(() => code.split("\n").map((text) => ({ text, type: "output" as const })), [code])
  return <Terminal title="CODE" lines={lines} typewriter={false} idleCursor={false} />
}

/**
 * SafeRich for researched text that may hold a code block: prose goes through SafeRich and each code block becomes a
 * Terminal window. Text without one renders exactly as SafeRich did.
 */
function GuideRich({ html, className, as }: { html: string; className?: string; as?: "div" | "span" | "p" }) {
  const parts = useMemo(() => blocks(html), [html])
  if (!parts.some((b) => b.code)) return <SafeRich as={as} html={html} className={className} />
  return (
    <div className={cn("space-y-2", className)}>
      {parts.map((b, i) => (b.code ? <CodeBlock key={i} code={b.text} /> : <SafeRich key={i} html={b.html} />))}
    </div>
  )
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

/** A researched list (bullets come from .rich). */
function Bullets({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <div className={cn("rich break-words", className)}>
      <ul role="list" className="space-y-2">
        {items.map((t, i) => (
          <li key={i}>
            <GuideRich as="span" html={t} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A question's choices as static lettered rows (self-graded Practice cards, My Misses). */
function StaticChoices({ choices }: { choices: string[] }) {
  if (choices.length === 0) return null
  return (
    <ol role="list" className={cn("my-4 grid grid-cols-1 gap-2", PROSE)}>
      {choices.map((c, j) => (
        <li key={j} className="flex items-start gap-2 text-base">
          {/* letters are square cells like the exam's (rounded-xs) */}
          <Badge variant="outline" className="flex-none rounded-xs">
            {letter(j)}
          </Badge>
          <SafeRich as="span" html={stripLetter(c, j)} className="min-w-0 flex-1 break-words" />
        </li>
      ))}
    </ol>
  )
}

/**
 * The Answer and "Why it's right" Alerts of a practice question. The Answer Alert takes focus after "Just show me"
 * and "Reveal answer" (tabIndex -1). Titles carry font-mono: they also sit inside sans Accordion content.
 */
const GuideAnswer = forwardRef<HTMLDivElement, { item: Practice }>(function GuideAnswer({ item }, ref) {
  return (
    <div className={cn("mt-4 grid grid-cols-1 gap-4", PROSE)}>
      {item.answer && (
        <Alert ref={ref} role="note" tabIndex={-1} className="outline-hidden">
          <Check className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="font-mono">Answer</AlertTitle>
          <AlertDescription>
            <GuideRich html={item.answer} className="whitespace-pre-line break-words" />
          </AlertDescription>
        </Alert>
      )}
      {item.why && (
        <Alert ref={item.answer ? undefined : ref} role="note" tabIndex={item.answer ? undefined : -1} className="outline-hidden">
          <CircleCheck className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="font-mono">Why it's right</AlertTitle>
          <AlertDescription>
            <GuideRich html={item.why} className="whitespace-pre-line break-words" />
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
})

/**
 * A flashcard's back (Practice, Flashcards; decision 57): the key fact's value in mono and its note muted in
 * `body-sm`, in one Answer Alert, as GuideAnswer's. It takes focus after "Show answer" (tabIndex -1). Both break
 * anywhere, so a long token never widens the card at 320px. A fact with no value and no note (normalizeGuide keeps a
 * label alone) shows "—".
 */
const FactAnswer = forwardRef<HTMLDivElement, { fact: Fact; className?: string }>(function FactAnswer(
  { fact, className },
  ref,
) {
  return (
    <Alert ref={ref} role="note" tabIndex={-1} className={cn("mt-4 outline-hidden", PROSE, className)}>
      <Check className="h-4 w-4" aria-hidden="true" />
      <AlertTitle className="font-mono">Answer</AlertTitle>
      <AlertDescription>
        {fact.value || fact.note ? (
          <>
            {fact.value && (
              <GuideRich html={fact.value} className="font-mono text-sm leading-6 text-foreground [overflow-wrap:anywhere]" />
            )}
            {fact.note && (
              <GuideRich html={fact.note} className={cn("text-muted-foreground [overflow-wrap:anywhere]", fact.value && "mt-2")} />
            )}
          </>
        ) : (
          <span className="font-mono text-foreground">—</span>
        )}
      </AlertDescription>
    </Alert>
  )
})

/* ── Sticky bars (decision 40; convention 9) ─────────────────────────────── */

/** Sticky bar classes: under the top inset on phones, under the nav band from 640, static on short screens. */
const STICKY = "sticky top-[calc(16px+env(safe-area-inset-top))] z-30 sm:top-[calc(max(24px,env(safe-area-inset-top))+56px)] short:static"

/** Viewport y of a stuck bar's bottom edge (its `top` plus its height); 0 while it does not stick. */
function stuckBottom(bar: HTMLElement | null) {
  if (!bar) return 0
  const cs = getComputedStyle(bar)
  return cs.position === "sticky" ? (parseFloat(cs.top) || 0) + bar.offsetHeight : 0
}

/** The bar sits at its sticky `top` now (stuck to the top of the viewport, every control on screen). */
function isStuck(bar: HTMLElement) {
  const cs = getComputedStyle(bar)
  return cs.position === "sticky" && Math.abs(bar.getBoundingClientRect().top - (parseFloat(cs.top) || 0)) < 1
}

/**
 * Keyboard focus never lands under the stuck bar (WCAG 2.4.11): while the bar sticks, the page's scroll-padding-top
 * is its bottom plus 12px, and only its top while focus is inside the bar, so focusing one of the bar's own controls
 * never scrolls the page; while it does not stick, "" (index.css holds the values); the previous inline value comes
 * back on unmount (convention 9).
 */
function useStickyPadding(barRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const bar = barRef.current
    const prev = root.style.scrollPaddingTop
    let inside = !!bar?.contains(document.activeElement)
    const sync = () => {
      const bottom = stuckBottom(bar)
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
      keyY = bar && isStuck(bar) ? window.scrollY : null
      setTimeout(() => (keyY = null))
    }
    const onFocusIn = (e: FocusEvent) => {
      inside = !!bar && e.target instanceof Node && bar.contains(e.target)
      if (inside && !e.relatedTarget && keyY !== null && window.scrollY !== keyY) window.scrollTo({ top: keyY, behavior: "instant" })
      sync()
    }
    sync()
    // the bar's height changes with text zoom; its top and position with the window (short screens unpin it)
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
  }, [barRef])
}

function NewTab() {
  return <span className="sr-only"> (opens in a new tab)</span>
}

/** Section heading (Surfaces): an optional eyebrow in `label`, the h2 in `heading`, an optional aside in `caption`. */
function Heading({
  id,
  kicker,
  title,
  aside,
  className,
}: {
  id?: string
  kicker?: ReactNode
  title: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="flex flex-col gap-2">
        {kicker && <p className={LABEL}>{kicker}</p>}
        <h2 id={id} className={HEADING}>
          {title}
        </h2>
      </div>
      {aside && <p className="text-xs text-muted-foreground">{aside}</p>}
    </div>
  )
}

/** Assessment type and CU. */
function CourseBadges({ course }: { course: Course }) {
  const kind = assessmentOf(course)
  return (
    <>
      <Badge variant={kind ? "secondary" : "outline"}>{assessmentLabel(kind)}</Badge>
      {course.cu !== null && <Badge variant="outline">{course.cu} CU</Badge>}
    </>
  )
}

export { LABEL, LEAD, HEADING, PROSE, LINK, TAP_LINK, HEADER, HEADER_AFTER_NOTICE, pad, padTo, letter, percent, PageTitle }
export { plain, safeHref, hostOf, RESOURCE_GROUPS, normalizeGuide, OUTLINE, useGuide, preloadGuide, assessmentOf, assessmentLabel }
export { stripLetter, correctChoice, TABS, TAB_ORDER, TAB_HAS }
export { GuideRich, Bullets, NewTab, Heading, CourseBadges, StaticChoices, GuideAnswer, FactAnswer }
export { STICKY, stuckBottom, useStickyPadding }
export type { Guide, Topic, Fact, Flashcard, Practice, Resource, ResourceKind, TabKey }
