/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * "Practice with" (decision 57): a Practice page's mode switch, Questions or Flashcards, as a RadioGroup of two compact
 * mode cards named by its `label`. A guide's Practice shows it in its header when the guide has both practice
 * questions and key facts (GuidePractice); C952's Practice Exam shows it in its start screen's header, never while an
 * exam runs or on Results (src/views/exam/Setup.tsx). Switching modes is a RadioGroup's job, so Tabs stay one level
 * deep. A switch moves no focus: it stays on the radio, and the group stays mounted.
 */
import { useId } from "react"
import { ListChecks, Sigma, type LucideIcon } from "lucide-react"
import { isPracticeMode, type PracticeMode } from "@/lib/course"
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
 * One mode as a compact target window: Setup's ModeCard (src/views/exam/Setup.tsx) at the size of Learn's topic
 * cards, a Card in a four-corner CornerFrame with the mode's 24px icon (ListChecks for questions, Sigma for the key
 * facts, as their Learn badge and Cheat Sheet section show them), its RadioGroupItem, the name (its Label) and the
 * count (its description). A click anywhere on the card picks the mode; keyboard users move through the radio group.
 * Two fit side by side at 320px: the radio sits on the icon's row, so the name has the card's full width.
 */
function ModeCard({
  value,
  icon: Icon,
  title,
  meta,
  onSelect,
}: {
  value: PracticeMode
  icon: LucideIcon
  title: string
  meta: string
  onSelect: () => void
}) {
  const id = useId()
  return (
    <CornerFrame asChild size="16px" thickness="2px" inset="8px" className={MODE_FRAME_ON}>
      <Card className="group flex h-full cursor-pointer flex-col p-4" onClick={onSelect}>
        <div className="flex items-start justify-between gap-4">
          <Icon aria-hidden="true" className={MODE_ICON} />
          <RadioGroupItem value={value} id={id} aria-describedby={`${id}-m`} />
        </div>
        {/* a name inside a target window: `subheading` (Label README) */}
        <Label htmlFor={id} className="mt-4 text-base leading-6 font-semibold">
          {title}
        </Label>
        <p id={`${id}-m`} className="text-sm text-muted-foreground">
          {meta}
        </p>
      </Card>
    </CornerFrame>
  )
}

/**
 * The switch, `mt-6` under the page's lead: the `label` "Practice with" naming a RadioGroup (`aria-labelledby`) of two
 * mode cards side by side at every width, Questions ("{N} questions") and Flashcards ("{F} cards"). `onChange` runs
 * for a pick on the radio or a tap anywhere on a card, so it may name the mode already shown (a tap on a radio runs it
 * twice): the page ignores a pick of its current mode.
 */
export function PracticeWith({
  mode,
  onChange,
  questions,
  cards,
}: {
  /** the mode shown */
  mode: PracticeMode
  onChange: (mode: PracticeMode) => void
  /** the counts on the two cards: the questions to practice and the cards in the deck */
  questions: number
  cards: number
}) {
  const id = useId()
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
        className="mt-2 grid max-w-[520px] grid-cols-2 gap-4"
      >
        <ModeCard
          value="questions"
          icon={ListChecks}
          title="Questions"
          meta={plural(questions, "question")}
          onSelect={() => onChange("questions")}
        />
        <ModeCard value="cards" icon={Sigma} title="Flashcards" meta={plural(cards, "card")} onSelect={() => onChange("cards")} />
      </RadioGroup>
    </div>
  )
}
