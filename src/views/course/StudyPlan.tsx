/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** A guide's Learn, Study plan tab: StudyPlan (the Timeline) and PlanDay (one day's focus, tasks and Done tick). */
import { courseDraft, type Update } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Bullets, TABS, plain, type Guide } from "@/views/course/shared"
import { SafeRich } from "@/components/kit"
import { BlurFade } from "@/components/ui/blur-fade"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Timeline } from "@/components/ui/timeline"

/** One timeline entry: the day's focus and tasks, and its "done" tick. */
function PlanDay({
  slug,
  index,
  day,
  focus,
  tasks,
  done,
  update,
}: {
  slug: string
  index: number
  day: string
  focus: string
  tasks: string[]
  done: boolean
  update: Update
}) {
  const id = `${slug}-plan-${index}`
  return (
    <div className="grid grid-cols-1 gap-4 pb-2">
      {focus && (
        <SafeRich
          as="p"
          html={focus}
          className={cn("text-sm font-medium break-words text-foreground", done && "text-muted-foreground line-through")}
        />
      )}
      <Bullets items={tasks} className="text-sm text-muted-foreground" />
      {/* on touch the row with its Label is the target, 44px tall; the 16px box stays (Checkbox README) */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={done}
          onCheckedChange={(c) =>
            update((d) => {
              courseDraft(d, slug).plan[index] = c === true
            })
          }
        />
        <Label htmlFor={id} className="pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
          Done<span className="sr-only">: {day}</span>
        </Label>
      </div>
    </div>
  )
}

function StudyPlan({
  slug,
  plan,
  done,
  update,
}: {
  slug: string
  plan: Guide["plan"]
  done: Record<number, boolean> | undefined
  update: Update
}) {
  const doneCount = plan.filter((_, i) => done?.[i]).length
  const data = plan.map((p, i) => {
    const day = plain(p.day) || `Step ${i + 1}`
    return {
      title: day,
      content: (
        <PlanDay slug={slug} index={i} day={day} focus={p.focus} tasks={p.tasks} done={!!done?.[i]} update={update} />
      ),
    }
  })
  return (
    // BlurFade also keeps the timeline's z-40 sticky titles inside its own stacking context, under the tab bar
    <BlurFade inView>
      <Timeline title={TABS.plan.title} description={`${doneCount} of ${plan.length} done`} data={data} />
    </BlurFade>
  )
}

export { PlanDay, StudyPlan }
