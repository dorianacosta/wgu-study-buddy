/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * A guide's Learn: the sticky tab bar ("Study guide sections") and one panel per tab with data, then the research
 * line. The tab rides on the history entry (initialLearnTab, patchEntry): reload and Back keep it.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import type { Course } from "@/data/courses"
import { LEARN_TABS, type LearnTab } from "@/lib/course"
import { initialLearnTab, patchEntry, type EntryState, type Navigate } from "@/lib/routes"
import type { Store, Update } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  STICKY,
  TABS,
  TAB_HAS,
  assessmentLabel,
  assessmentOf,
  useStickyPadding,
  type Guide,
} from "@/views/course/shared"
import { Overview } from "@/views/course/Overview"
import { Topics } from "@/views/course/Topics"
import { StudyPlan } from "@/views/course/StudyPlan"
import { Community } from "@/views/course/Community"
import { Resources } from "@/views/course/Resources"
import { Sources } from "@/views/course/Sources"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function GuideTabs({
  course,
  guide,
  store,
  update,
  navigate,
  entry,
}: {
  course: Course
  guide: Guide
  store: Store
  update: Update
  navigate: Navigate
  entry: Readonly<EntryState>
}) {
  const slug = course.slug
  const still = useReducedMotion()
  // decision 21: Overview, Topics, Study plan, Community, Resources, Sources, only those with data
  const keys = useMemo(() => LEARN_TABS.filter((k) => TAB_HAS[k](guide)), [guide])
  const [tab, setTab] = useState<LearnTab>(() => initialLearnTab(slug, entry, keys))
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const realign = useRef(false)

  useStickyPadding(barRef)

  // after a switch made from inside a panel (bar stuck), start the new panel right under the bar
  useEffect(() => {
    if (!realign.current) return
    realign.current = false
    const root = rootRef.current
    const bar = barRef.current
    if (!root || !bar) return
    const top = parseFloat(getComputedStyle(bar).top) || 0
    window.scrollTo({ top: window.scrollY + root.getBoundingClientRect().top - top })
  }, [tab])

  // keep the active tab centred in the sideways-scrolling bar (phones); it jumps under reduced motion (decision 37)
  useEffect(() => {
    const list = scrollerRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!active) return
    const left = active.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft
    list.scrollTo({ left: left - (list.clientWidth - active.offsetWidth) / 2, behavior: still ? "auto" : "smooth" })
  }, [tab, still])

  const changeTab = (value: string) => {
    const next = keys.find((k) => k === value)
    if (!next) return
    const root = rootRef.current?.getBoundingClientRect()
    const bar = barRef.current?.getBoundingClientRect()
    realign.current = !!root && !!bar && bar.top - root.top > 1
    setTab(next)
    patchEntry({ courseTab: { slug, tab: next } })
  }

  const progress = store.courses?.[slug]
  const panels: Record<LearnTab, () => ReactNode> = {
    overview: () => <Overview guide={guide} fallbackTitle={assessmentLabel(assessmentOf(course))} />,
    topics: () => (
      <Topics topics={guide.topics} slug={slug} hasPractice={guide.practice.length > 0} navigate={navigate} />
    ),
    plan: () => <StudyPlan slug={slug} plan={guide.plan} done={progress?.plan} update={update} />,
    community: () => <Community data={guide.community} />,
    resources: () => <Resources items={guide.resources} />,
    sources: () => <Sources items={guide.sources} />,
  }

  return (
    <>
      <Tabs ref={rootRef} value={tab} onValueChange={changeTab} className="mt-8">
        {/* the sticky tab bar (keep it outside any BlurFade, or it can't stick) */}
        <Card ref={barRef} className={cn(STICKY, "p-2")}>
          <div ref={scrollerRef} className="flex overflow-x-auto">
            <TabsList aria-label="Study guide sections">
              {keys.map((k) => (
                <TabsTrigger key={k} value={k}>
                  {TABS[k].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Card>
        {keys.map((k) => (
          <TabsContent key={k} value={k} className="mt-8">
            {panels[k]()}
          </TabsContent>
        ))}
      </Tabs>

      <Separator className="mt-20" />
      <p className="mt-6 max-w-[720px] font-sans text-sm text-muted-foreground">
        {guide.updated ? `Researched ${guide.updated}. ` : ""}Course details change; confirm requirements on your WGU course
        page.
      </p>
    </>
  )
}

export { GuideTabs }
