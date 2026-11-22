/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { Fragment, useCallback, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { MotionConfig, useReducedMotion } from "motion/react"
import { MotionConfig as FramerMotionConfig } from "framer-motion"
import { BookOpen, ClipboardCheck, GraduationCap, House, ScrollText, Target } from "lucide-react"
import { NavBar, type NavItem } from "@/components/ui/tubelight-navbar"
import { TrippinSpiral } from "@/components/ui/trippin-spiral"
import { FieldScrim, useFieldExposed } from "@/components/field-scrim"
import { WordmarkFooter, type FooterColumn } from "@/components/ui/wordmark-footer"
import { CourseSwitcher } from "@/components/course-switcher"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
import { QUESTIONS } from "@/data"
import { NEW_C952_QUESTIONS, masteredCount, planCounts, practiceCounts, useStore } from "@/lib/store"
import { buildExam, examItemKnown, fmtTime, isRight, recordExam, type Exam, type ExamBank, type ExamMode } from "@/lib/exam"
import { loadExam, runningExamOf, saveExam } from "@/lib/exam-session"
import { APP_NAME, FOCUS_DELAY, focusAfterChange, hrefFor, isPlainClick, isToolView, navigate, titleFor, useRoute } from "@/lib/routes"
import { COURSE_LIST, codeOf, courseInfo, courseMissCount, loadCourse, nowStudyingText, saveCourse } from "@/lib/course"
import { examTitle } from "@/components/notices"
import type { PageProps } from "@/views/types"
import Home from "@/views/Home"
import Courses from "@/views/Courses"
import Learn from "@/views/Learn"
import Cheat from "@/views/Cheat"
import ExamView from "@/views/Exam"
import Misses from "@/views/Misses"
import { GuideCheat, GuideLearn, GuideMisses, GuidePending, GuidePractice } from "@/views/course"
import { preloadGuide } from "@/views/course/shared"

/** The background's pause ("Animate background" in the footer): a device setting, "on" | "off"; absent = on. */
const FIELD_MOTION_KEY = "c952-field-motion"

/** Nav labels keep their words on one line (the navbar's pill is shrink-to-fit inside half the viewport). */
const oneLine = (s: string) => s.replace(/ /g, " ")

/** Footer credits: 21st.dev and the authors of the components this app is built from (the system's Credits page:
 *  the ASCII language, the components it restyles or keeps, then icons and fonts; retired assets leave the list). */
const REPO = "https://github.com/dorianacosta/wgu-study-buddy"

const CREDITS: FooterColumn[] = [
  {
    title: "Project",
    links: [
      { label: "Source code", href: REPO },
      { label: "Report an issue", href: `${REPO}/issues` },
      { label: "MIT License", href: `${REPO}/blob/main/LICENSE` },
    ],
  },
  {
    title: "ASCII language",
    links: [
      {
        label: "Trippin Spiral by jobsrip",
        href: "https://21st.dev/community/ascii/trippin-spiral-fa23bfd9-dad9-49f9-be46-6f4ce2e61c29",
      },
      { label: "Decrypt Text by rmahammad", href: "https://21st.dev/@rmahammad/components/decrypt-text" },
      { label: "Scramble Link Button by hyperiux", href: "https://21st.dev/@hyperiux/components/scramble-link-button" },
      { label: "Corner Frame by kevingirelli", href: "https://21st.dev/@kevingirelli/components/corner-frame" },
      { label: "Terminal by thegridcn", href: "https://21st.dev/@thegridcn/components/terminal" },
      { label: "Tree Box Drawing by nikolas-sapa", href: "https://21st.dev/@nikolas-sapa/components/tree-box-drawing" },
      { label: "Conveyor Loop by loading-ui", href: "https://21st.dev/@loading-ui/components/conveyor-loop" },
    ],
  },
  {
    title: "Components",
    links: [
      { label: "Tubelight Navbar by ayushmxxn", href: "https://21st.dev/@ayushmxxn/components/tubelight-navbar" },
      { label: "Stats by meschacirung", href: "https://21st.dev/@meschacirung/components/stats/stats-info" },
      { label: "Dot Text by jahed", href: "https://21st.dev/@jahed/components/dot-text" },
      { label: "Wordmark Footer by vilqor", href: "https://21st.dev/@vilqor/components/wordmark-footer" },
      { label: "shadcn/ui by shadcn", href: "https://21st.dev/@shadcn" },
      { label: "Magic UI by dillionverma", href: "https://21st.dev/@dillionverma" },
      { label: "Aceternity UI by manuarora700", href: "https://21st.dev/@manuarora700" },
      { label: "ReUI Badge by sean0205", href: "https://21st.dev/@sean0205/components/base-badge" },
      { label: "Empty State by serafimcloud", href: "https://21st.dev/@serafimcloud/components/empty-state" },
      {
        label: "Question Tool by serafimcloud",
        href: "https://21st.dev/@serafimcloud/components/question-tool/multiple-choice",
      },
    ],
  },
  {
    title: "Also",
    links: [
      { label: "Lucide icons (ISC)", href: "https://lucide.dev" },
      { label: "Radix Icons (MIT)", href: "https://www.radix-ui.com/icons" },
      { label: "Geist fonts (OFL)", href: "https://github.com/vercel/geist-font" },
    ],
  },
]

export default function App() {
  const snap = useRoute()
  const { route, entry, change } = snap
  const [picked, setPicked] = useState(() => route.course ?? loadCourse()) // the URL, else saved, else c952
  const active = route.course ?? picked // the URL wins (decision 6)
  const [store, update] = useStore()
  // one exam slot for the whole app (decision 60): any course's, kept in c952-exam-session-v1 across reloads
  const [exam, setExam] = useState<Exam | null>(() => loadExam(undefined, examItemKnown))
  const runningExam = runningExamOf(exam)
  const runningCourse = runningExam?.course ?? null

  useEffect(() => {
    if (route.course) setPicked(route.course)
  }, [route.course])
  useEffect(() => saveCourse(active), [active])
  // the active course's guide loads in the background (the hosted site fetches guides), so its tools open at once
  useEffect(() => preloadGuide(active), [active])
  useEffect(() => {
    document.title = titleFor(route)
  }, [route])
  // decision 33: the new h1 after a push; the control that left the page after Back or Forward; nothing on load.
  // After a mouse or touch pick in the switcher (pickCourse), once focusAfterChange has focused the new h1, it is
  // focused again without the keyboard ring; this timer is set after focusAfterChange's, so it always runs after it.
  const pointerPick = useRef(false)
  useEffect(() => {
    const cancel = focusAfterChange(snap)
    if (!pointerPick.current) return cancel
    pointerPick.current = false
    const t = setTimeout(() => {
      const h = document.querySelector<HTMLElement>("#app h1")
      if (h && document.activeElement === h) {
        h.blur()
        h.focus({ preventScroll: true, focusVisible: false })
      }
    }, FOCUS_DELAY + 1)
    return () => {
      cancel()
      clearTimeout(t)
    }
  }, [change.seq]) // snap changes only with change.seq

  // decision 34: one polite status region says the new course whenever the active course changes after load, and that
  // another course's exam keeps running (decision 60)
  const [status, setStatus] = useState("")
  const announced = useRef(active)
  useEffect(() => {
    if (announced.current === active) return
    announced.current = active
    setStatus(nowStudyingText(active, runningCourse))
  }, [active, runningCourse])

  // decision 11: data-keyboard="open" on <html> while the on-screen keyboard is open (index.css hides the bar on touch)
  useEffect(() => {
    const vv = window.visualViewport
    const vk = (navigator as Navigator & { virtualKeyboard?: EventTarget & { boundingRect: DOMRect } }).virtualKeyboard
    const tallest = new Map<string, number>()
    const check = () => {
      const o = screen.orientation?.type ?? (innerWidth > innerHeight ? "landscape" : "portrait")
      const h = vv ? vv.height * vv.scale : innerHeight
      const most = Math.max(tallest.get(o) ?? 0, h)
      tallest.set(o, most)
      const open = (vk?.boundingRect.height ?? 0) > 0 || most - h > 150
      if (open) document.documentElement.dataset.keyboard = "open"
      else delete document.documentElement.dataset.keyboard
    }
    check()
    const target = vv ?? window
    target.addEventListener("resize", check)
    vk?.addEventListener("geometrychange", check)
    return () => {
      target.removeEventListener("resize", check)
      vk?.removeEventListener("geometrychange", check)
    }
  }, [])

  // The background (Background.md): the field runs at 24 fps while some full-strength field is on screen (the Home
  // hero), 12 fps under the curtain; the reader can hold it still from the footer, saved per device.
  const fieldExposed = useFieldExposed()
  const [fieldMotion, setFieldMotion] = useState(() => {
    try {
      const saved = localStorage.getItem(FIELD_MOTION_KEY)
      if (saved) return saved !== "off"
    } catch {
      /* storage blocked: as nothing saved */
    }
    // decision 42: with nothing saved, Save-Data starts the field on its still frame (the footer switch still runs it)
    return !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  })
  const reduced = useReducedMotion() // the OS setting already holds the field still, so the Switch is not shown
  const motionId = useId()
  const toggleFieldMotion = (on: boolean) => {
    setFieldMotion(on)
    try {
      localStorage.setItem(FIELD_MOTION_KEY, on ? "on" : "off")
    } catch {
      /* storage blocked: the choice lasts for this visit only */
    }
  }

  useEffect(() => {
    saveExam(exam)
  }, [exam])

  // a running exam is never an entry: starting one opens #exam/<its course> (on it already, the router scrolls to the
  // top), on Exam, since an exam is the Exam mode's (decision 60), so Quit and "Other modes" land on the mode picker.
  // The exam is built here, never inside an updater: it shuffles, and StrictMode runs updaters twice
  const doStartExam = useCallback(
    (bank: ExamBank, mode: ExamMode, opt: { topic?: string } = {}) => {
      setExam(buildExam(bank, mode, opt, store))
      navigate(hrefFor("exam", bank.course), { practiceMode: "exam" })
    },
    [store],
  )

  // One exam at a time for the whole app (decision 60): starting any course's exam while any course's exam with
  // answers is still running asks first instead of silently discarding it.
  const [pendingStart, setPendingStart] = useState<{ bank: ExamBank; mode: ExamMode; opt: { topic?: string } } | null>(null)
  const startExam = useCallback(
    (bank: ExamBank, mode: ExamMode, opt: { topic?: string } = {}) => {
      if (exam && !exam.done && exam.ans.some((a) => a.length > 0)) setPendingStart({ bank, mode, opt })
      else doStartExam(bank, mode, opt)
    },
    [exam, doStartExam],
  )
  const runningAnswered = exam && !exam.done ? exam.ans.filter((a) => a.length > 0).length : 0
  // The confirm dialog opens from state, not from a trigger: remember what had focus and hand it back on close.
  const opener = useRef<HTMLElement | null>(null)

  // grades the running exam and records it (recordExam: C952's misses, or a guide's practice marks; the attempt; the
  // best Full exam), the time taken outside the updater (StrictMode runs updaters twice)
  const submitExam = () => {
    if (!exam) return
    const at = Date.now()
    const done: Exam = { ...exam, done: true, time: fmtTime(at - exam.start) }
    const right = done.items.map((_, i) => isRight(done, i))
    done.score = right.filter(Boolean).length
    update((d) => recordExam(d, done, right, at))
    setExam(done)
    // Results replace the runner on the same #exam/<slug>, so this scroll stays (CONTRACTS, convention 10)
    try {
      window.scrollTo(0, 0)
    } catch {
      /* ignore */
    }
  }

  const misses = courseMissCount(active, store)
  const code = codeOf(active)

  // the footer's status follows the active course (decision 53)
  const info = courseInfo(active)
  let footerStatus = `${masteredCount(store)} of ${QUESTIONS.length} C952 questions mastered`
  if (info?.kind === "pending") footerStatus = `${code} study guide in progress`
  else if (info?.kind === "guide" && info.practiceTotal > 0)
    footerStatus = `${code} practice: ${practiceCounts(info, store).got} of ${info.practiceTotal} got it`
  else if (info?.kind === "guide") {
    const plan = planCounts(info, store)
    footerStatus = `${code} study plan: ${plan.done} of ${plan.total} done`
  }
  const missName = misses ? `My Misses ${misses}` : "My Misses"

  // decision 9: Home, Courses, the switcher (the slot), then the four tools of the active course
  const tool = (name: string, view: "learn" | "cheat" | "exam" | "misses", icon: NavItem["icon"]): NavItem => ({
    name: oneLine(name),
    url: hrefFor(view, active),
    icon,
    ariaLabel: `${name}, ${code}`,
    focusKey: `nav:${view}`,
  })
  const navItems: NavItem[] = [
    { name: "Home", url: hrefFor("home"), icon: House, focusKey: "nav:home" },
    { name: "Courses", url: hrefFor("courses"), icon: GraduationCap, focusKey: "nav:courses" },
    tool("Learn", "learn", BookOpen),
    tool("Cheat Sheet", "cheat", ScrollText),
    tool("Practice", "exam", ClipboardCheck),
    // the count lives in the name and in icon cells; "My Misses 60" reserves the width, so the bar never moves
    { ...tool(missName, "misses", Target), count: misses, reserve: oneLine("My Misses 60") },
  ]
  // the lamp follows the route, wherever the change came from (nav, links, Back/Forward); never the switcher
  const activeTab = navItems.find((item) => item.url === snap.href)?.name

  // decision 16: on a tool page a pick opens the same tool for the new course (focus to its h1); on Home or Courses
  // the course switches in place and focus stays on the trigger. Returns whether the page changed.
  const pickCourse = (b: string, byPointer = false): boolean => {
    if (b === active) return false
    if (isToolView(route.view)) {
      pointerPick.current = navigate(hrefFor(route.view, b), undefined, { focusKey: "nav:switcher" }) === "pushed" && byPointer
      return true
    }
    setPicked(b)
    return false
  }

  const onNavigate = (item: NavItem, e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(item.url)
  }

  const page: PageProps = { course: active, navigate, store, update, entry }
  const kind = courseInfo(route.course)?.kind
  // the exam-in-progress Alert shows everywhere but on #exam/<its course>, where the exam itself shows (decision 60)
  const shownRunning = route.view === "exam" && runningExam?.course === route.course ? null : runningExam
  const examProps = { exam, setExam, startExam, submit: submitExam }
  let view: ReactNode
  if (route.view === "home") {
    view = <Home {...page} runningExam={shownRunning} newQuestions={NEW_C952_QUESTIONS} />
  } else if (route.view === "courses") {
    view = (
      <Courses
        {...page}
        runningExam={shownRunning}
        notFound={change.notFound}
        notFoundDelayed={change.notFound !== null && change.cause === "load"}
      />
    )
  } else if (kind === "pending") {
    view = <GuidePending course={route.course} navigate={navigate} />
  } else if (kind === "guide") {
    if (route.view === "learn") view = <GuideLearn {...page} runningExam={shownRunning} />
    else if (route.view === "cheat") view = <GuideCheat {...page} runningExam={shownRunning} />
    else if (route.view === "exam") view = <GuidePractice {...page} runningExam={shownRunning} {...examProps} />
    else view = <GuideMisses {...page} runningExam={shownRunning} startExam={startExam} />
  } else if (route.view === "learn") {
    view = <Learn {...page} runningExam={shownRunning} newQuestions={NEW_C952_QUESTIONS} startExam={startExam} />
  } else if (route.view === "cheat") {
    view = <Cheat {...page} runningExam={shownRunning} />
  } else if (route.view === "exam") {
    view = <ExamView {...page} runningExam={shownRunning} {...examProps} />
  } else {
    view = <Misses {...page} runningExam={shownRunning} startExam={startExam} />
  }

  return (
    <MotionConfig reducedMotion="user">
      <FramerMotionConfig reducedMotion="user">
        {/* below 640 the root pads past the docked bar (and the home indicator), so the footer scrolls clear of it */}
        <div className="relative min-h-dvh pb-[calc(80px+env(safe-area-inset-bottom))] sm:pb-0">
          {/* the field and its curtain come first (Background.md, Layers): the canvas fixed at z-field, the curtain
              absolute in this root at z-scrim from the Home hero's bottom (or the top) down. This root stays relative
              with no z-index and no fill, so nothing between them and body makes a stacking context */}
          <TrippinSpiral still={!fieldMotion} curtained={!fieldExposed} />
          <FieldScrim />

          <Button
            asChild
            className="fixed top-[max(16px,env(safe-area-inset-top))] left-[max(16px,env(safe-area-inset-left))] z-skip not-focus:sr-only print:hidden"
          >
            <a
              href="#app"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("app")?.focus()
              }}
            >
              Skip to content
            </a>
          </Button>

          <nav aria-label="Main" className="print:hidden">
            <NavBar
              items={navItems}
              activeTab={activeTab}
              onNavigate={onNavigate}
              slot={<CourseSwitcher value={active} onPick={pickCourse} store={store} />}
              slotAfter={2}
            />
          </nav>

          {/* decision 34: "Now studying …" after a course change (never on load) */}
          <div role="status" aria-live="polite" className="sr-only">
            {status}
          </div>

          {/* gutters 16 / 24 from 640 / 32 from 1024, each at least the side inset; the top clears the top inset
              below 640 and the nav band from 640, less on short landscape screens (decision 39) */}
          <main
            id="app"
            tabIndex={-1}
            className={cn(
              "relative mx-auto max-w-[1120px] pb-24 outline-none",
              "pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] sm:pr-[max(24px,env(safe-area-inset-right))] sm:pl-[max(24px,env(safe-area-inset-left))] lg:pr-[max(32px,env(safe-area-inset-right))] lg:pl-[max(32px,env(safe-area-inset-left))]",
              "pt-[calc(64px+env(safe-area-inset-top))] short:pt-[calc(16px+env(safe-area-inset-top))] sm:pt-[calc(max(24px,env(safe-area-inset-top))+48px)] sm:short:pt-[calc(max(8px,env(safe-area-inset-top))+58px)]",
            )}
          >
            <Fragment key={entry.id}>{view}</Fragment>
          </main>

          <AlertDialog
            open={!!pendingStart}
            onOpenChange={(o) => {
              if (!o) setPendingStart(null)
            }}
          >
            <AlertDialogContent
              onOpenAutoFocus={() => {
                // record the opener; the AlertDialog then puts focus on Cancel, the safe choice
                const a = document.activeElement
                opener.current = a instanceof HTMLElement && a !== document.body ? a : null
              }}
              onCloseAutoFocus={(e) => {
                const el = opener.current
                opener.current = null
                if (el && el.isConnected) {
                  e.preventDefault()
                  el.focus({ preventScroll: true })
                }
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Replace your exam in progress?</AlertDialogTitle>
                {/* the running exam's course and name, whichever course's exam it is (decision 60) */}
                <AlertDialogDescription>
                  <b className="text-foreground">{runningExam ? examTitle(runningExam) : exam?.name}</b>: {runningAnswered} of{" "}
                  {exam?.items.length ?? 0} answered. Starting a new exam discards it. Nothing is recorded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep current exam</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const p = pendingStart
                    setPendingStart(null)
                    if (p) doStartExam(p.bank, p.mode, p.opt)
                  }}
                >
                  Start new exam
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <WordmarkFooter
            name={APP_NAME}
            legalName="Dorian Acosta"
            year={2026}
            license={{ label: "MIT License", href: `${REPO}/blob/main/LICENSE` }}
            notice="Not affiliated with Western Governors University."
            description={`${COURSE_LIST.filter((c) => c.kind === "guide").length} course guides · ${QUESTIONS.length} C952 practice questions · progress saves in this browser only`}
            status={footerStatus}
            navLabel="Footer"
            columns={CREDITS}
            credit={{ label: "Components from 21st.dev", href: "https://21st.dev" }}
            // the field's pause (WCAG 2.2.2); under reduced motion the field is already one still frame
            controls={
              reduced ? null : (
                <>
                  <Switch id={motionId} checked={fieldMotion} onCheckedChange={toggleFieldMotion} />
                  {/* caption muted like the © line beside it: font-normal leading-4 undo Label's 500 weight and 1.0 line;
                      on touch the Label is 44px tall, so the row with its Label is the target (decision 36) */}
                  <Label
                    htmlFor={motionId}
                    className="text-xs font-normal leading-4 text-muted-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                  >
                    Animate background
                  </Label>
                </>
              )
            }
          />
        </div>
      </FramerMotionConfig>
    </MotionConfig>
  )
}
