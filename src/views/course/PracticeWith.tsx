/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * "Practice with" (decisions 57 and 60): a Practice page's mode switch, a RadioGroup of compact mode cards over the
 * modes the course has data for, in this order: Exam (the practice exam's mode picker), Questions (a guide's questions
 * graded in place) and Flashcards. A guide's Practice shows it in its header (GuidePractice: Exam · Questions ·
 * Flashcards); C952's Practice Exam shows it in its start screen's header (Exam · Flashcards), never while an exam runs
 * or on Results (src/views/exam/Setup.tsx). It shows only with two or more modes. Switching modes is a RadioGroup's
 * job, so Tabs stay one level deep. A switch moves no focus: it stays on the radio, and the group stays mounted.
 */
import { useId } from "react"
import { ClipboardCheck, ListChecks, Sigma, type LucideIcon } from "lucide-react"
import { isPracticeMode, type PracticeMode } from "@/lib/course"
import { cn } from "@/lib/utils"
import { LABEL } from "@/views/course/shared"
import { Card } from "@/components/ui/card"
import { CornerFrame } from "@/components/ui/corner-frame"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * Target frame variants for a mode card, as Setup's (Surfaces, Target frame): its focusable element (the radio) sits
 * inside, so the brackets turn gold on hover, with keyboard focus on the radio and while it is checked. Never
 * `focus-within:`.
 */
const MODE_FRAME_ON =
  "hover:[--corner-frame-color:var(--primary)] has-[:focus-visible]:[--corner-frame-color:var(--primary)] has-[[data-state=checked]]:[--corner-frame-color:var(--primary)]"
/** Magic UI bento-grid's icon, as Setup's mode cards and Learn's topic cards show it: bare, muted, shrinking on hover */
const MODE_ICON = "size-6 origin-left transform-gpu text-muted-foreground transition-all duration-300 ease-in-out group-hover:scale-75"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/**
 * Each mode's card: ClipboardCheck for the exam (as the bar's Practice), ListChecks for the questions and Sigma for the
 * key facts (as their Learn badge and Cheat Sheet section show them), with the count as its description.
 */
const LOOK: Record<PracticeMode, { icon: LucideIcon; title: string; meta: (n: number) => string }> = {
  exam: { icon: ClipboardCheck, title: "Exam", meta: (n) => `${plural(n, "question")}, timed` },
  questions: { icon: ListChecks, title: "Questions", meta: (n) => plural(n, "question") },
  cards: { icon: Sigma, title: "Flashcards", meta: (n) => plural(n, "card") },
}

/**
 * One mode as a compact target window: Setup's ModeCard at the size of Learn's topic cards, a Card in a four-corner
 * CornerFrame with the mode's 24px icon, its RadioGroupItem, the name (its Label) and the count (its description). A
 * click anywhere on the card picks the mode; keyboard users move through the radio group. The radio sits on the
 * icon's row, so the name has the card's full width; below 360px the padding is 12px, so two fit side by side at 320.
 */
function ModeCard({
  value,
  count,
  onSelect,
  className,
}: {
  value: PracticeMode
  count: number
  onSelect: () => void
  className?: string
}) {
  const id = useId()
  const { icon: Icon, title, meta } = LOOK[value]
  return (
    <CornerFrame asChild size="16px" thickness="2px" inset="8px" className={MODE_FRAME_ON}>
      <Card className={cn("group flex h-full cursor-pointer flex-col p-4 max-[360px]:p-3", className)} onClick={onSelect}>
        <div className="flex items-start justify-between gap-4">
          <Icon aria-hidden="true" className={MODE_ICON} />
          <RadioGroupItem value={value} id={id} aria-describedby={`${id}-m`} />
        </div>
        {/* a name inside a target window: `subheading` (Label README) */}
        <Label htmlFor={id} className="mt-4 text-base leading-6 font-semibold">
          {title}
        </Label>
        <p id={`${id}-m`} className="text-sm text-muted-foreground">
          {meta(count)}
        </p>
      </Card>
    </CornerFrame>
  )
}

/**
 * The switch, `mt-6` under the page's lead: the `label` "Practice with" naming a RadioGroup (`aria-labelledby`) of one
 * mode card per option. Two sit side by side at every width (`max-w-[520px]`); three sit in a row from 640
 * (`sm:max-w-[720px]`), and below 640 the Exam card takes the first row alone, so each card fits at 320. `onChange`
 * runs for a pick on the radio or a tap anywhere on a card, so it may name the mode already shown (a tap on a radio
 * runs it twice): the page ignores a pick of its current mode. Renders nothing with fewer than two options.
 */
export function PracticeWith({
  mode,
  onChange,
  options,
}: {
  /** the mode shown */
  mode: PracticeMode
  onChange: (mode: PracticeMode) => void
  /** the modes the course has data for, in Exam, Questions, Flashcards order, each with its count */
  options: readonly { mode: PracticeMode; count: number }[]
}) {
  const id = useId()
  if (options.length < 2) return null
  const three = options.length > 2
  return (
    <div className="mt-6">
      <p id={id} className={LABEL}>
        Practice with
      </p>
      <RadioGroup
        value={mode}
        onValueChange={(value) => {
          if (isPracticeMode(value)) onChange(value)
        }}
        aria-labelledby={id}
        className={cn("mt-2 grid grid-cols-2 gap-4", three ? "sm:max-w-[720px] sm:grid-cols-3" : "max-w-[520px]")}
      >
        {options.map((o) => (
          <ModeCard
            key={o.mode}
            value={o.mode}
            count={o.count}
            onSelect={() => onChange(o.mode)}
            className={three && o.mode === "exam" ? "max-sm:col-span-2" : undefined}
          />
        ))}
      </RadioGroup>
    </div>
  )
}
