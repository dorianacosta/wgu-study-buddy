/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The course switcher in the nav bar's slot (Navigation, The course switcher; decisions 14 to 18 and 56): the system's
 * Select, controlled by the active course, commit-only, showing the code alone. Each option reads "{CODE} {Name}"; a
 * course the student marked completed adds a muted "Completed" caption inside the option's text, after an sr-only
 * comma, so it is part of the option's name ("D278 Scripting and Programming - Foundations, Completed"). It is plain
 * type, not a badge, an icon or gold: the gold Check stays the selected course's one mark. `onPick` returns true when
 * the pick changed page, so focus stays on the new h1 instead of returning to the trigger; it is told whether the
 * pick was by pointer, so that h1 takes focus without the keyboard ring.
 */
import { useId, useRef, useSyncExternalStore, type KeyboardEvent } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COURSE_GROUP_LIST, courseInfo, isCompleted } from "@/lib/course"
import type { Store } from "@/lib/store"

/** A group's label in the list: the system's `label` style (mono, uppercase, muted), lined up with the items' text. */
const GROUP_LABEL = "pt-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"

const DOCKED = "(width < 640px)"
const subscribe = (fn: () => void) => {
  const m = window.matchMedia(DOCKED)
  m.addEventListener("change", fn)
  return () => m.removeEventListener("change", fn)
}
const isDocked = () => window.matchMedia(DOCKED).matches

// a single character on the closed trigger would pick a course, and change page, on one key (decision 15)
const commitOnly = (e: KeyboardEvent) => {
  if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.altKey && !e.metaKey) e.preventDefault()
}

const RING = "focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
// both shapes drop the base trigger's line-clamp: WebKit counts the sr-only name inside the clamped value as cut-off
// text and draws its ellipsis over the code's last glyph ("C95…")
const TRIGGER = {
  docked: `h-12 pointer-coarse:h-12 w-full flex-col justify-center gap-0 px-0 py-1 text-sm font-medium max-sm:[&>svg]:rotate-180 max-[320px]:text-xs [&>span]:line-clamp-none ${RING}`,
  top: `h-10 w-auto gap-2 px-3 text-sm font-medium pointer-coarse:h-11 [&>span]:line-clamp-none ${RING}`,
}
// below 640 options wrap with a hanging indent (decision 17); from 640 the list is 680px wide, or the viewport less the
// 16px collision padding a side where that is narrower. The longest option, D682's 65 characters (546px of 14px mono),
// plus " Completed" (a space, the caption's 4px margin and 64.8px of 12px mono), with the item's 40px of check column
// and padding, the list's 8px of padding and its 2px border, is 673.2px, so every option stays on one line from a
// 706px window. From 640 to 705 a completed D682's caption alone wraps, hanging under the name: D682 without it needs
// 596px, and the list is at least 608 (592 before D682's full name; 512 before the caption)
const CONTENT = {
  docked:
    "w-[min(100vw-32px,384px)] max-h-[min(424px,calc(var(--radix-select-content-available-height)-env(safe-area-inset-top)))] pointer-coarse:max-h-[min(456px,calc(var(--radix-select-content-available-height)-env(safe-area-inset-top)))]",
  top: "w-[min(680px,100vw-32px)] max-h-[min(424px,calc(var(--radix-select-content-available-height)-env(safe-area-inset-bottom)))] pointer-coarse:max-h-[min(456px,calc(var(--radix-select-content-available-height)-env(safe-area-inset-bottom)))]",
}

/** The caption of a completed course's option: the `caption` style, muted; `indent-0` undoes the hanging indent. */
const COMPLETED_CAPTION = "ml-1 indent-0 font-mono text-xs text-muted-foreground"

export function CourseSwitcher({
  value,
  onPick,
  store,
}: {
  value: string
  onPick: (slug: string, byPointer: boolean) => boolean
  /** The progress record: which courses are marked completed (decision 56) */
  store: Store
}) {
  const labelId = useId()
  const triggerId = useId()
  const docked = useSyncExternalStore(subscribe, isDocked, () => false)
  const shape = docked ? "docked" : "top"
  const changedPage = useRef(false)
  // the last input in the open list was a pointer: focus returns to the trigger without the keyboard ring (decision
  // 12), which Chrome would otherwise draw when the list took focus by script from <body> (a fresh page, a blank click)
  const byPointer = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const info = courseInfo(value)

  return (
    <>
      <span id={labelId} className="sr-only">
        Course
      </span>
      <Select value={value} onValueChange={(slug) => (changedPage.current = onPick(slug, byPointer.current))}>
        <SelectTrigger
          ref={triggerRef}
          id={triggerId}
          aria-labelledby={`${labelId} ${triggerId}`}
          data-focus-key="nav:switcher"
          onKeyDown={(e) => {
            byPointer.current = false
            commitOnly(e)
          }}
          className={TRIGGER[shape]}
        >
          <SelectValue>
            {info?.code}
            <span className="sr-only"> {info?.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          side={docked ? "top" : "bottom"}
          align={docked ? "center" : "start"}
          sideOffset={8}
          collisionPadding={16}
          onPointerDown={() => (byPointer.current = true)}
          onPointerDownOutside={() => (byPointer.current = true)}
          onKeyDown={() => (byPointer.current = false)}
          onCloseAutoFocus={(e) => {
            // a pick that changed page leaves focus to the new h1 (App focuses it)
            if (changedPage.current) e.preventDefault()
            else if (byPointer.current) {
              e.preventDefault()
              triggerRef.current?.focus({ preventScroll: true, focusVisible: false })
            }
            changedPage.current = false
            byPointer.current = false
          }}
          className={CONTENT[shape]}
        >
          {/* the degree plan by subject: each group's label, then its courses in study order */}
          {COURSE_GROUP_LIST.map((g) => (
            <SelectGroup key={g.id}>
              <SelectLabel className={GROUP_LABEL}>{g.label}</SelectLabel>
              {g.courses.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {/* a wrapped line hangs under the name, not the code. The caption sits inside ItemText, which alone
                      names the option, after an sr-only comma and a real space: the comma gives screen readers a
                      pause before the state, as Learn's topic picker does, and the space keeps the words apart (a
                      margin alone would run them together in the name). The visible text and typeahead (which
                      matches the start) stay the same */}
                  <span className="block pl-[5ch] -indent-[5ch]">
                    {c.code} {c.name}
                    {isCompleted(c.slug, store) && (
                      <>
                        <span className="sr-only">,</span>{" "}
                        <span className={COMPLETED_CAPTION}>Completed</span>
                      </>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
