/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * `#learn/<slug>` for a guide course (decision 21; CourseTools, Learn): the header ("All courses", the code, the
 * course name, badges, the research line, then the course's status: the Completed toggle and the exam date, decisions
 * 56 and 58), then the study guide's tabs. While an exam runs (any course's, decision 60), its Alert sits above the
 * header, which then takes mt-8. And the page every tool of a course with no usable guide shows (decision 26): the
 * same kicker and h1, then "Study guide in progress".
 */
import { ArrowLeft, BookDashed, FileText, Search } from "lucide-react"
import { COURSES } from "@/data/courses"
import { codeOf, courseInfo } from "@/lib/course"
import { hrefFor, onPlainClick, type Navigate } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { GuideLearnProps, GuidePendingProps } from "@/views/types"
import { CourseBadges, HEADER, HEADER_AFTER_NOTICE, LABEL, PageTitle, type Guide } from "@/views/course/shared"
import { CourseStatus } from "@/views/course/CourseStatus"
import { GuideGate } from "@/views/course/GuideGate"
import { GuideTabs } from "@/views/course/GuideTabs"
import { ExamInProgressNotice } from "@/components/notices"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

/** "Study guide in progress": the EmptyState with its shipped tiles, action "All courses". */
function InProgress({ navigate }: { navigate: Navigate }) {
  return (
    <BlurFade delay={0.08} className="mt-8 flex justify-center">
      {/* EmptyState gives no access to its button, so the focus key sits on a wrapper (convention 3) */}
      <div data-focus-key="pending:all-courses" className="flex w-full justify-center">
        <EmptyState
          title="Study guide in progress"
          description="This course's guide is being researched. Check back soon."
          icons={[BookDashed, FileText, Search]}
          action={{ label: "All courses", onClick: () => navigate(hrefFor("courses")) }}
        />
      </div>
    </BlurFade>
  )
}

export function GuideLearn(props: GuideLearnProps) {
  const notice = !!props.runningExam
  return (
    <>
      <ExamInProgressNotice exam={props.runningExam} navigate={props.navigate} className={HEADER} />
      <GuideGate course={props.course} afterNotice={notice}>
        {(guide) => <GuideLearnPage {...props} guide={guide} />}
      </GuideGate>
    </>
  )
}

function GuideLearnPage({ course, navigate, store, update, entry, runningExam, guide }: GuideLearnProps & { guide: Guide | null }) {
  const c = COURSES.find((x) => x.slug === course)
  if (!c || !guide) return <GuidePending course={course} navigate={navigate} afterNotice={!!runningExam} />
  const meta = guide.updated ? `Researched ${guide.updated}` : ""
  const courses = hrefFor("courses")

  return (
    <>
      {/* the page header on the dimmed field: back link, kicker, the decrypting h1, badges, the research line, then
          the course's status, unframed (no gold: Learn has none) */}
      <header className={runningExam ? HEADER_AFTER_NOTICE : HEADER}>
        <Button variant="ghost" size="sm" className="-ml-3" asChild>
          <a href={courses} data-focus-key="learn:all-courses" onClick={onPlainClick(() => navigate(courses))}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            All courses
          </a>
        </Button>
        <p className={cn(LABEL, "mt-8")}>{c.code}</p>
        <PageTitle text={c.name} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CourseBadges course={c} />
        </div>
        {meta && <p className="mt-4 text-xs text-muted-foreground">{meta}</p>}
        <CourseStatus course={course} store={store} update={update} className="mt-6" />
      </header>

      <GuideTabs course={c} guide={guide} store={store} update={update} navigate={navigate} entry={entry} />
    </>
  )
}

/** All four tools of a course with no usable guide (decision 26): the Learn header's kicker and h1, then the EmptyState. */
export function GuidePending({ course, navigate, afterNotice = false }: GuidePendingProps) {
  return (
    <>
      <header className={afterNotice ? HEADER_AFTER_NOTICE : HEADER}>
        <p className={LABEL}>{codeOf(course)}</p>
        <PageTitle text={courseInfo(course)?.name ?? codeOf(course)} />
      </header>
      <InProgress navigate={navigate} />
    </>
  )
}
