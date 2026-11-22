/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * A course's status (decisions 56 and 58): the Completed toggle and the planned exam date, with its countdown and the
 * pacing against the course's study plan. One block for both Learn headers (a guide's and C952's, unframed) and Home's
 * status card (the caller frames it). No gold anywhere: the toggle is an outline Button, every other control a ghost.
 *
 * - No date: a ghost "Set exam date" beside the toggle opens the editor, a Collapsible under the row.
 * - A date: the date line in `data` ("Exam Sat, Dec 5 · 12 days to go"), a ghost "Change" beside it, and one pacing
 *   sentence in `body-sm` under the row, starting under the toggle: "On pace: …" or "Behind: …" (plan days left, from
 *   examStatus; C952's one-day plan counts as 1), "Study plan done: …", "{d} days to go." (no plan), "Exam today.", or
 *   after the date "Exam date passed. Passed? Mark {CODE} completed.". A completed course has no sentence; its date line
 *   stays, muted, with no countdown.
 * - The editor: the Label "Exam date", an `<input type="date">` with `min` today and `max` 9999-12-31 (a 4-digit year,
 *   the only kind parseLocalDay reads) that saves each whole day from today on as it is picked (emptying every part
 *   clears the date), and, while a date is saved, a ghost "Clear date". An entry it can't save (a day before today, a
 *   year that isn't 4 digits, or one left half typed) shows the Input's invalid state, a destructive boundary and words
 *   under the field, when focus leaves it.
 * - Names: visible text names the block as a group (`labelledBy`): Home's card title, and on C952's Learn, whose header
 *   is a topic's, the caption "C952 · Course status". There `withCode` also names the toggle "Completed: C952", so it
 *   says its course even out of context (a screen reader's list of buttons).
 * - Focus: the editor has one trigger, which stays mounted in every state and reads "Close" while the editor is open
 *   (not "Done", the app's word for a finished plan day). Opening moves focus to the date field. Every close ("Close",
 *   Escape inside the editor, "Clear date") puts focus on the trigger before the editor unmounts, so it never falls to
 *   the page.
 * - Every change is said in an always-mounted sr-only `role="status"` line: completedText, "Exam date set to Sat,
 *   Dec 5.", "Exam date cleared.", or that an entry wasn't saved.
 *
 * Everything shown is read from `store` on each render (examStatus, isCompleted); the block keeps only its editor's
 * open state and its last words. Home isn't keyed by course and re-renders this block for the next course after a
 * switcher pick: the editor then closes and the status line empties, so nothing carries over to the next course.
 */
import { useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react"
import { CalendarDays, CalendarPlus, CalendarX, CircleAlert } from "lucide-react"
import {
  codeOf,
  completedText,
  examStatus,
  isCompleted,
  markCompleted,
  saveExamDate,
  type ExamStatus,
} from "@/lib/course"
import { examDateOf, localDayString, parseLocalDay, type Store, type Update } from "@/lib/store"
import { cn } from "@/lib/utils"
import { CompletedToggle } from "@/components/completed-toggle"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** "1 day", "12 days", "1 plan day", "3 plan days" */
const count = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`

/** The words under the field, and in the status line, for an entry the editor can't save. */
const NOT_SAVED = "Enter a full date, today or later."

/** The countdown after the date: "12 days to go", "1 day to go", "today", "3 days ago"; none once completed. */
function countdownOf(status: ExamStatus, completed: boolean): string | null {
  if (completed) return null
  const d = status.daysLeft
  return d > 0 ? `${count(d, "day")} to go` : d === 0 ? "today" : `${count(-d, "day")} ago`
}

/**
 * The exam's date line: "Exam Sat, Dec 5 · 12 days to go" ("1 day to go", "today", "3 days ago"), or "Exam Sat, Dec 5"
 * alone once the course is completed. Home's hero shows the same words as its countdown caption.
 */
export function examLine(status: ExamStatus, completed = false): string {
  const when = countdownOf(status, completed)
  return when ? `Exam ${status.label} · ${when}` : `Exam ${status.label}`
}

/**
 * The pacing sentence for a course not yet completed, from examStatus: a lead-in set in `foreground` (the state is its
 * words, never a colour) and the rest.
 */
function pacing(status: ExamStatus, code: string): { lead: string; rest: string } {
  const d = status.daysLeft
  if (d < 0) return { lead: "Exam date passed.", rest: `Passed? Mark ${code} completed.` }
  if (d === 0) return { lead: "", rest: "Exam today." }
  const to = `${count(d, "day")} to go.`
  if (status.planDaysLeft === 0) return { lead: "Study plan done:", rest: to }
  const left = count(status.planDaysLeft ?? 0, "plan day")
  if (status.pace === "on-pace") return { lead: "On pace:", rest: `${left} left, ${to}` }
  if (status.pace === "behind") return { lead: "Behind:", rest: `${left} left in ${count(d, "day")}.` }
  return { lead: "", rest: to }
}

/** What the status line last said, worded at render time from the store (so "set" names the day just saved). */
type Said = "completed" | "not-completed" | "set" | "cleared" | "not-saved"

function saidText(said: Said | null, course: string, status: ExamStatus | null): string {
  switch (said) {
    case "completed":
      return completedText(course, true)
    case "not-completed":
      return completedText(course, false)
    case "set":
      return status ? `Exam date set to ${status.label}.` : ""
    case "cleared":
      return "Exam date cleared."
    case "not-saved":
      return `Exam date not saved. ${NOT_SAVED}`
    default:
      return ""
  }
}

export interface CourseStatusProps {
  /** The course's slug ("d278") */
  course: string
  store: Store
  update: Update
  /**
   * The id of the visible text that names this block (Home's card title, the caption on C952's Learn): the block
   * becomes a group with that name
   */
  labelledBy?: string
  /**
   * Adds the code to the toggle's accessible name ("Completed: C952"), so the toggle says its course even out of
   * context (a screen reader's list of buttons): C952's Learn, whose header is a topic's
   */
  withCode?: boolean
  className?: string
}

export function CourseStatus({ course, store, update, labelledBy, withCode = false, className }: CourseStatusProps) {
  const code = codeOf(course)
  const [editing, setEditing] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [said, setSaid] = useState<Said | null>(null)
  // Home re-renders this block in place for the next course after a switcher pick (it isn't keyed by course): that
  // course starts with its editor closed and nothing said (React's "adjust state when a prop changes", during render)
  const [shownCourse, setShownCourse] = useState(course)
  if (shownCourse !== course) {
    setShownCourse(course)
    setEditing(false)
    setInvalid(false)
    setSaid(null)
  }
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const hintId = useId()

  // Opening the editor moves focus to the date field; a close leaves focus where the close put it
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const now = new Date()
  const today = localDayString(now)
  const date = examDateOf(store, course)
  const status = examStatus(course, store, now)
  const completed = isCompleted(course, store)
  const when = status ? countdownOf(status, completed) : null
  const sentence = status && !completed ? pacing(status, code) : null

  const toggle = (next: boolean) => {
    markCompleted(update, course, next)
    setSaid(next ? "completed" : "not-completed")
  }

  /** Closes the editor, focus first on the trigger: it stays mounted, so focus never falls to the page. */
  const close = () => {
    triggerRef.current?.focus()
    setEditing(false)
  }

  // the trigger opens or closes the editor; a close by pointer still lands focus on it (Safari focuses no clicked button)
  const openChange = (open: boolean) => {
    if (!open) {
      close()
      return
    }
    setInvalid(false)
    setEditing(true)
  }

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const field = e.currentTarget
    const day = field.value
    if (day === "") {
      // every part emptied (a date picker's Clear, or each part deleted) clears the date; one still being typed waits
      if (!field.validity.valid) return
      setInvalid(false)
      if (date === null) return
      saveExamDate(update, course, null)
      setSaid("cleared")
      return
    }
    // a day before today (`min`), or a year still being typed ("0202") or not 4 digits, isn't saved: blur says so
    if (!field.validity.valid || !parseLocalDay(day)) return
    setInvalid(false)
    if (day === date) return
    saveExamDate(update, course, day)
    setSaid("set")
  }

  const blur = (e: FocusEvent<HTMLInputElement>) => {
    const field = e.currentTarget
    const v = field.value
    // an entry that can't be saved: one left half typed, or any but the saved date that the field rejects (before
    // today, past `max`) or parseLocalDay does (a year that isn't 4 digits), whatever range the browser allows
    const unsaved =
      field.validity.badInput || (v !== (date ?? "") && (!field.validity.valid || (v !== "" && !parseLocalDay(v))))
    setInvalid(unsaved)
    if (unsaved) setSaid("not-saved")
  }

  const clear = () => {
    close()
    saveExamDate(update, course, null)
    setSaid("cleared")
  }

  const escape = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape" || e.defaultPrevented) return
    e.preventDefault()
    close()
  }

  return (
    <Collapsible
      open={editing}
      onOpenChange={openChange}
      role={labelledBy ? "group" : undefined}
      aria-labelledby={labelledBy}
      className={className}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <CompletedToggle code={code} pressed={completed} onPressedChange={toggle} withCode={withCode} />
        {/* the date line and the editor's one trigger wrap together; the trigger keeps its place in every state */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {/* examLine's words; at 320 the line breaks at the "·", never inside the date or the countdown */}
          {status && (
            <p className={cn("font-mono text-sm", completed ? "text-muted-foreground" : "text-foreground")}>
              Exam <span className="whitespace-nowrap">{status.label}</span>
              {when && (
                <>
                  {" · "}
                  <span className="whitespace-nowrap">{when}</span>
                </>
              )}
            </p>
          )}
          <CollapsibleTrigger asChild ref={triggerRef}>
            <Button variant="ghost" size="sm">
              {editing ? (
                <>
                  <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                  Close<span className="sr-only"> exam date editor</span>
                </>
              ) : status ? (
                <>
                  <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                  Change<span className="sr-only"> exam date</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Set exam date
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* under the row, so it starts right under the toggle ("Passed? Mark {CODE} completed.") */}
      {sentence && (
        <p className="mt-2 max-w-[60ch] font-sans text-sm text-muted-foreground tabular-nums">
          {sentence.lead && (
            <>
              <span className="text-foreground">{sentence.lead}</span>{" "}
            </>
          )}
          {sentence.rest}
        </p>
      )}

      <CollapsibleContent>
        <div className="mt-4 grid gap-2" onKeyDown={escape}>
          <Label htmlFor={inputId} className="block">
            Exam date
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            {/* uncontrolled: a date half typed stays as typed; only whole days from today on are saved. `max` keeps
                the year to parseLocalDay's 4 digits (with none, Chrome takes up to 6 and calls them valid) */}
            <Input
              key={course}
              ref={inputRef}
              id={inputId}
              type="date"
              min={today}
              max="9999-12-31"
              defaultValue={date ?? ""}
              onChange={change}
              onBlur={blur}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? hintId : undefined}
              className="w-full max-w-[240px] aria-invalid:border-destructive"
            />
            {date && (
              <Button variant="ghost" size="sm" onClick={clear}>
                <CalendarX className="mr-2 h-4 w-4" aria-hidden="true" />
                Clear date
              </Button>
            )}
          </div>
          {invalid && (
            <p id={hintId} className="flex items-start gap-2 font-sans text-sm text-destructive">
              <CircleAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              Not saved. {NOT_SAVED}
            </p>
          )}
        </div>
      </CollapsibleContent>

      {/* always mounted, so every change is heard */}
      <p role="status" className="sr-only">
        {saidText(said, course, status)}
      </p>
    </Collapsible>
  )
}
