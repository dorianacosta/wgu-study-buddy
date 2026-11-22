/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Where whole guides come from in `npm run dev` and the one-file build (WGU_Study_Buddy.html): every guide is built
 * into the page, so a guide is ready the moment its course opens, offline too. The hosted site uses
 * guide-source.fetch.ts instead (vite.config.ts picks one as `@guide-source`); both export the same two functions.
 */
import type { CourseGuide } from "@/data/courses"

const modules = import.meta.glob<CourseGuide>("./guides/*.json", { eager: true, import: "default" })

const BY_SLUG = new Map(
  Object.entries(modules).map(([path, guide]) => [path.split("/").pop()!.replace(".json", "").toLowerCase(), guide]),
)

/** The guide when the page already holds it (always, here); undefined for a course without one. */
export function peekRawGuide(slug: string): CourseGuide | undefined {
  return BY_SLUG.get(slug)
}

/** The guide, or undefined for a course without one. */
export function loadRawGuide(slug: string): Promise<CourseGuide | undefined> {
  return Promise.resolve(BY_SLUG.get(slug))
}
