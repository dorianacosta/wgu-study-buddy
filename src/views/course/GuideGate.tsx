/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The guide tools' loading gate. On the hosted site a course's guide is fetched the first time one of its tools opens
 * (src/data/guide-source.fetch.ts; the active course's guide preloads in the background, so this is rare). Until it
 * arrives the tool shows its page header (the course code and the tool's h1) and a loading line with the Conveyor
 * Loop, in a window: each moving block masks the track with a box of --mask-color, so the loader sits on card, never
 * on the field. If it can't load, an Alert says why: offline (Try again) or out of date because the site was
 * redeployed since the page loaded (Reload page). The Alerts are role="note" ("Course not found" is the app's one
 * role="alert"); an always-mounted sr-only role="status" line says the failure, and "Trying again…" while a retry
 * runs, so a second failure is heard too. Guides built into the page (dev, the one-file build) and loaded ones render
 * at once; when a loaded guide replaces the gate and focus left with it, the loaded page's h1 takes focus.
 */
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { RotateCw } from "lucide-react"
import { COURSE_BY_SLUG } from "@/data/courses"
import { focusH1 } from "@/lib/routes"
import { HEADER, HEADER_AFTER_NOTICE, LABEL, PageTitle, useGuide, type Guide } from "@/views/course/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConveyorLoop } from "@/components/ui/conveyor-loop"

/** What each failure's Alert says; the status line says the same words */
const FAILURE = {
  offline: { title: "Couldn't load this study guide", text: "Check your connection, then try again." },
  outdated: {
    title: "This study guide was updated",
    text: "The site changed since you opened this page. Reload to get the latest version.",
  },
} as const

export function GuideGate({
  course,
  title,
  afterNotice = false,
  children,
}: {
  course: string
  /** the tool's h1 ("Cheat Sheet"); Learn's is the course name, its default */
  title?: string
  /** the exam-in-progress Alert sits above (the tool renders it, decision 60): the loading header then takes mt-8 */
  afterNotice?: boolean
  children: (guide: Guide | null) => ReactNode
}) {
  const { guide, failure, retrying, retry } = useGuide(course)
  const waited = useRef(guide === undefined)

  useLayoutEffect(() => {
    if (guide === undefined || !waited.current) return
    waited.current = false
    // App focuses the page's h1 60 ms after a route change; when that was the loading header's h1, focus went with
    // it, so the loaded page's h1 takes it, as the route change meant
    if (!document.activeElement || document.activeElement === document.body) focusH1()
  }, [guide])

  if (guide !== undefined) return <>{children(guide)}</>

  const c = COURSE_BY_SLUG[course]
  const code = c?.code ?? course.toUpperCase()
  // nothing while it loads (the loading line says so); "Trying again…" between failures, so the words change and a
  // second failure is said again
  const said = !failure ? "" : retrying ? "Trying again…" : `${FAILURE[failure].title}. ${FAILURE[failure].text}`
  return (
    <>
      <header className={afterNotice ? HEADER_AFTER_NOTICE : HEADER}>
        <p className={LABEL}>{title && c ? `${code} · ${c.name}` : code}</p>
        <PageTitle text={title ?? c?.name ?? code} />
      </header>
      {failure === "outdated" ? (
        // the site was redeployed since this page loaded: the new page knows the new guide files
        <Alert role="note" className="mt-8 max-w-[680px]">
          <AlertTitle>{FAILURE.outdated.title}</AlertTitle>
          <AlertDescription>
            <p>{FAILURE.outdated.text}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
              <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reload page
            </Button>
          </AlertDescription>
        </Alert>
      ) : failure === "offline" ? (
        <Alert role="note" className="mt-8 max-w-[680px]">
          <AlertTitle>{FAILURE.offline.title}</AlertTitle>
          <AlertDescription>
            <p>{FAILURE.offline.text}</p>
            {/* the button stays in place while it retries (aria-disabled, not disabled), so focus stays on it; its
                icon holds still, since a wait is ConveyorLoop's blocks, never a spinning icon */}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              aria-disabled={retrying || undefined}
              onClick={() => !retrying && retry()}
            >
              <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
              {retrying ? "Trying again…" : "Try again"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="mt-8 max-w-[680px] p-4">
          <p role="status" className="flex items-start gap-3 font-mono text-sm text-muted-foreground">
            {/* the color only: a size class through cn() drops the base leading-none. shrink-0 keeps the 12ch track
                beside the words when they wrap (320px); under reduced motion the blocks hide, leaving the still
                track. --mask-color is the card it sits on */}
            <ConveyorLoop
              trackLength={12}
              aria-hidden="true"
              className="shrink-0 text-primary motion-reduce:[&>[style]]:hidden"
              style={{ "--mask-color": "var(--card)" } as CSSProperties}
            />
            Loading the study guide…
          </p>
        </Card>
      )}
      {/* always mounted while the gate shows: the Alerts are notes, so this line is what says a failure aloud */}
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  )
}
