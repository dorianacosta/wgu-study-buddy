/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** The module vite.config.ts (guideIndex) builds from src/data/guides/*.json. */
declare module "virtual:guide-index" {
  import type { CourseGuide } from "@/data/courses"
  /**
   * Every guide's outline, by slug: the CourseGuide shape with the plan's days, the topics' titles, the assessment's
   * type and format and the research month as written, and "·" for every other string (counts and presence only).
   */
  export const GUIDE_INDEX: Readonly<Record<string, CourseGuide>>
  /** Each guide file's address on the hosted site ("/guides/d281.3f2a9c1d0e.json"); empty in dev and the one-file build. */
  export const GUIDE_URLS: Readonly<Record<string, string>>
}
