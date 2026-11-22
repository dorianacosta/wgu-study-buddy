/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Where whole guides come from on the hosted site (`npm run build`): each guide is its own file under /guides/, its
 * name carrying a hash of its content (vite.config.ts, guideIndex). The app fetches a guide when its course first
 * opens, and the browser keeps the file for a year (netlify.toml), so the page stays small however many courses there
 * are. `npm run dev` and the one-file build use guide-source.embed.ts; both export the same two functions.
 */
import type { CourseGuide } from "@/data/courses"
import { GUIDE_URLS } from "virtual:guide-index"

/** Nothing is built into the page here: every guide loads with loadRawGuide. */
export function peekRawGuide(_slug: string): CourseGuide | undefined {
  return undefined
}

/**
 * The guide, or undefined for a course without one. Rejects when the file can't be fetched: with `status` set when
 * the server answered (404: the site was redeployed since this page loaded, so its guide names are out of date), and
 * without it when there was no answer (offline, say).
 */
export async function loadRawGuide(slug: string): Promise<CourseGuide | undefined> {
  const url = GUIDE_URLS[slug]
  if (!url) return undefined
  const res = await fetch(url, { credentials: "same-origin" })
  if (!res.ok) throw Object.assign(new Error(`Study guide ${slug}: HTTP ${res.status}`), { status: res.status })
  return (await res.json()) as CourseGuide
}
