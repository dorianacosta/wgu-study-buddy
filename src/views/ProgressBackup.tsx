/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The Courses page's last section, "Your progress" (decision 59): save everything this browser holds as one JSON file,
 * and restore from such a file. The file work is src/lib/backup.ts; this section is its only surface.
 *
 * - The subject sections' rhythm: `mt-16`, the Heading with the eyebrow "Backup" and the h2 "Your progress", then one
 *   Window holding a short note and two outline buttons. No gold: Courses has no gold fill.
 * - "Save backup" hands the browser the file (downloadBackup).
 * - "Restore from file" clicks a hidden file input. The picked file is checked (readBackupFile), then an AlertDialog
 *   opened from state asks first; its destructive "Replace progress" writes the backup (restoreBackup) and reloads the
 *   page. Focus starts on "Keep my progress" and goes back to "Restore from file" when the dialog closes.
 * - The load after a restore reopens at the same place (noteRestoreForReload). The reload took focus away with
 *   "Replace progress" and the router moves none on a load, so "Restore from file" takes it (scrolled to only when it
 *   is out of view), unless the student has already put it somewhere.
 * - That load says "Progress restored", in a note under the buttons and in the status line, once: later visits to
 *   Courses leave it out, and a save or a new pick clears it.
 * - Errors show where they happen, as a destructive Alert under the buttons (`role="note"`: the app's one
 *   `role="alert"` is "Course not found"). A new pick, a save or closing the dialog clears an old one.
 * - Every outcome is said in an always-mounted sr-only status line. A failed restore is said once the dialog has
 *   closed: while it is open, the page behind it is hidden from screen readers.
 * - No form and no network (the CSP has `default-src 'none'` and `form-action 'none'`): everything stays in the
 *   browser.
 */
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { CircleCheck, Download, TriangleAlert, Upload } from "lucide-react"
import {
  BACKUP_ERRORS,
  backupFileName,
  downloadBackup,
  readBackupFile,
  restoreBackup,
  type BackupData,
  type BackupSummary,
} from "@/lib/backup"
import { FOCUS_DELAY, getRoute, noteRestoreForReload, restoredThisLoad } from "@/lib/routes"
import type { Store } from "@/lib/store"
import { Heading } from "@/views/course/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { BlurFade } from "@/components/ui/blur-fade"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardDescription } from "@/components/ui/card"

export interface ProgressBackupProps {
  /** The progress on screen: what "Save backup" puts in the file */
  store: Store
}

/** An error, shown where it happened: the Alert's title and its sentence (one of BACKUP_ERRORS). */
interface Problem {
  title: string
  message: string
}

/** A picked file that passed the checks: what a restore writes, and what the dialog says about it. */
interface Checked {
  data: BackupData
  summary: BackupSummary
}

const SAVE_FAILED = "Backup not saved"
const NOT_RESTORED = "Progress not restored"
const RESTORED = "Progress restored"
const RESTORED_TEXT = "Everything saved in this browser now comes from your backup file."
/** After the reload, the status line speaks this long after mounting, once the page's own load has been read out. */
const RESTORED_SAY_DELAY = 250
/**
 * This load's "Progress restored" has been said, or a save or a new pick has cleared it: later visits to Courses (the
 * view remounts on each) leave the note out. Like routes.ts's restoredOnLoad, it lasts one page load.
 */
let restoreNoted = false

/** The status line's words for an error: its title, then its sentence. */
const spoken = (p: Problem) => `${p.title}. ${p.message}`

/** The whole element shows between the shell's bars, which the page's scroll padding keeps clear (WCAG 2.4.11). */
function unobscured(el: Element): boolean {
  const r = el.getBoundingClientRect()
  const pad = getComputedStyle(document.documentElement)
  const top = parseFloat(pad.scrollPaddingTop) || 0
  const bottom = parseFloat(pad.scrollPaddingBottom) || 0
  return r.height > 0 && r.top >= top && r.bottom <= window.innerHeight - bottom
}

/** "Nov 21, 2026 backup · progress in 4 courses · 1 completed." ("This backup" when the file doesn't say when). */
function BackupLine({ summary }: { summary: BackupSummary }) {
  const { exportedLabel, courses, completed } = summary
  return (
    <>
      <b className="text-foreground">{exportedLabel ? `${exportedLabel} backup` : "This backup"}</b>
      {` · progress in ${courses} ${courses === 1 ? "course" : "courses"} · ${completed} completed.`}
    </>
  )
}

export function ProgressBackup({ store }: ProgressBackupProps) {
  const [problem, setProblem] = useState<Problem | null>(null)
  // the load right after a restore says so, here and in the status line, on its first visit only (restoreNoted); a
  // save or a new pick clears it
  const [restored, setRestored] = useState(() => restoredThisLoad() && !restoreNoted)
  // the backup the dialog asks about; kept after the dialog closes, so its words stay while it fades out
  const [checked, setChecked] = useState<Checked | null>(null)
  const [asking, setAsking] = useState(false)
  // the status line: `n` re-keys its text, so the same words said twice (a second save on one day) are heard again
  const [said, setSaid] = useState({ text: "", n: 0 })
  const restoreRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // the latest pick: a read that finishes after a newer pick began is dropped
  const readId = useRef(0)
  // what the status line says once the dialog has closed
  const sayOnClose = useRef<string | null>(null)

  const say = (text: string) => setSaid((s) => ({ text, n: s.n + 1 }))

  // the reload took focus away with "Replace progress": it comes back to "Restore from file", unless the student has
  // put it somewhere since, scrolling to it only when it is out of view (the restored marks can move the lists above)
  const refocus = () => {
    const button = restoreRef.current
    const active = document.activeElement
    if (!button?.isConnected || (active && active !== document.body)) return
    button.focus({ preventScroll: unobscured(button) })
  }

  // A restore reloads the page, and the load says it worked, once (the always-mounted line needs a change to be heard).
  // restoreNoted is set when it is said, not before, so StrictMode's remount and a visit cut short still say it.
  useEffect(() => {
    if (!restoredThisLoad() || restoreNoted) return
    const t = setTimeout(() => {
      if (restoreNoted) return // a save or a new pick came first
      restoreNoted = true
      say(`${RESTORED}. ${RESTORED_TEXT}`)
    }, RESTORED_SAY_DELAY)
    // focus only on the page the reload opened, after the router's one-frame scroll restore; after a push or Back,
    // App's focus (decision 33) is the one that moves it
    const f = getRoute().change.cause === "load" ? setTimeout(refocus, FOCUS_DELAY) : undefined
    return () => {
      clearTimeout(t)
      clearTimeout(f)
    }
  }, [])

  const save = () => {
    restoreNoted = true
    setRestored(false)
    // one Date for the file and the status line, so both name the same day (a save at midnight)
    const now = new Date()
    if (downloadBackup(store, now)) {
      setProblem(null)
      say(`Backup saved: ${backupFileName(now)}.`)
      return
    }
    const p = { title: SAVE_FAILED, message: BACKUP_ERRORS.saveFailed }
    setProblem(p)
    say(spoken(p))
  }

  const read = async (input: HTMLInputElement) => {
    const file = input.files?.[0]
    // emptied at once, so picking the same file again is a new pick (and a new change event)
    input.value = ""
    if (!file) return
    const id = ++readId.current
    setProblem(null)
    restoreNoted = true
    setRestored(false)
    const check = await readBackupFile(file)
    if (id !== readId.current) return
    if (check.ok) {
      setChecked({ data: check.data, summary: check.summary })
      setAsking(true)
      return
    }
    const p = { title: NOT_RESTORED, message: check.error }
    setProblem(p)
    say(spoken(p))
  }

  const replace = (e: MouseEvent<HTMLButtonElement>) => {
    // the Action would close the dialog by itself: it stays open while the page reloads, and a failure closes it below
    // rather than through onOpenChange, which clears errors
    e.preventDefault()
    if (!checked) return
    const result = restoreBackup(checked.data)
    if (result.ok) {
      // the load after the reload reopens here and says the restore worked
      noteRestoreForReload()
      window.location.reload()
      return
    }
    const p = { title: NOT_RESTORED, message: result.error }
    setProblem(p)
    sayOnClose.current = spoken(p)
    setAsking(false)
  }

  // Cancel or Escape: the safe choice; an old error goes with the dialog
  const onOpenChange = (open: boolean) => {
    if (open) return
    setAsking(false)
    setProblem(null)
  }

  // The dialog opens from state, with no Trigger, so Radix would leave focus on <body>: it goes back to "Restore from
  // file". This runs after the dialog has gone, so the page is no longer hidden and the status line is heard.
  const onCloseAutoFocus = (e: Event) => {
    const button = restoreRef.current
    if (button?.isConnected) {
      e.preventDefault()
      button.focus()
    }
    const text = sayOnClose.current
    sayOnClose.current = null
    if (text) say(text)
  }

  return (
    <section aria-labelledby="courses-backup" className="mt-16">
      <Heading id="courses-backup" kicker="Backup" title="Your progress" />
      <BlurFade inView>
        <Card className="p-6">
          <CardDescription className="max-w-[680px]">
            Your progress is saved only in this browser. Save a backup file to keep it safe or to move it to another
            device. Restoring from a file replaces everything saved here.
          </CardDescription>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={save}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Save backup
            </Button>
            <Button ref={restoreRef} variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Restore from file
            </Button>
          </div>
          {/* no box, no tab stop and out of the accessibility tree: only "Restore from file" opens it. No form */}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => void read(e.currentTarget)}
          />
          {/* under the buttons, so they never move when it comes or goes */}
          {restored && !problem && (
            <Alert role="note" className="mt-6 max-w-[680px]">
              <CircleCheck className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{RESTORED}</AlertTitle>
              <AlertDescription>{RESTORED_TEXT}</AlertDescription>
            </Alert>
          )}
          {problem && (
            <Alert role="note" variant="destructive" className="mt-6 max-w-[680px]">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{problem.title}</AlertTitle>
              <AlertDescription>{problem.message}</AlertDescription>
            </Alert>
          )}
        </Card>
      </BlurFade>

      {/* always mounted, so screen readers hear every save and every error */}
      <p role="status" className="sr-only">
        <span key={said.n}>{said.text}</span>
      </p>

      <AlertDialog open={asking} onOpenChange={onOpenChange}>
        <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your progress?</AlertDialogTitle>
            <AlertDialogDescription>
              {checked && <BackupLine summary={checked.summary} />} It replaces everything saved in this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my progress</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={replace}>
              Replace progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
