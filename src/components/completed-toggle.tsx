/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The Completed toggle (decision 56): the one control that marks a course completed, the same on the Courses cards, the
 * Learn headers and Home. An outline Button with `aria-pressed`, so no gold (Courses, Learn and Cheat Sheet have no
 * gold fill). The label stays "Completed" in both states (a toggle's name never flips); the state shows as the icon,
 * an empty circle or a checked one, and the pressed look, never as colour alone. Where several toggles share a page
 * (the Courses cards), or where nothing around it names the course (C952's Learn, whose header is a topic's), `withCode`
 * adds the course code to the accessible name in an sr-only suffix (": D278").
 *
 * The caller writes the mark with markCompleted (src/lib/course.ts) and says it in an always-mounted sr-only
 * `role="status"` line with completedText.
 */
import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { Circle, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CompletedToggleProps
  extends Omit<ComponentPropsWithoutRef<"button">, "onClick" | "children" | "aria-pressed"> {
  /** "D278" */
  code: string
  pressed: boolean
  onPressedChange(next: boolean): void
  /** Adds ": {code}" to the accessible name: for a page with one toggle per course, or one whose context names no course */
  withCode?: boolean
  size?: "sm" | "default"
}

export const CompletedToggle = forwardRef<HTMLButtonElement, CompletedToggleProps>(function CompletedToggle(
  { code, pressed, onPressedChange, withCode = false, size = "sm", className, ...props },
  ref,
) {
  const Icon = pressed ? CircleCheck : Circle
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size={size}
      aria-pressed={pressed}
      className={cn(
        "gap-2 aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground",
        className,
      )}
      onClick={() => onPressedChange(!pressed)}
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
      Completed
      {withCode && <span className="sr-only">: {code}</span>}
    </Button>
  )
})
