/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * The 29 WGU B.S. Computer Science courses the app covers, grouped by subject, and the shape of a study guide.
 * Guide content lives in src/data/guides/<slug>.json (researched, cited). The app loads a guide only when its course
 * is opened (src/data/guide-source.*.ts); a small index of every guide is built in (vite.config.ts, guideIndex).
 */

export type AssessmentType = "Objective" | "Performance"

/** The subject groups of the degree plan, in the order the Courses page and the course switcher show them. */
export const COURSE_GROUPS = [
  { id: "programming", label: "Programming foundations" },
  { id: "java", label: "Java and back end" },
  { id: "softeng", label: "Software engineering" },
  { id: "data", label: "Data" },
  { id: "security", label: "Security and networks" },
  { id: "systems", label: "Systems and architecture" },
  { id: "math", label: "Algorithms and math" },
  { id: "ai", label: "AI" },
  { id: "professional", label: "Professional skills" },
] as const

export type CourseGroup = (typeof COURSE_GROUPS)[number]["id"]

export interface Course {
  code: string
  slug: string
  name: string
  /** competency units */
  cu: number | null
  assessment: AssessmentType | null
  /** the subject group the Courses page and the switcher file it under */
  group: CourseGroup
  /** C952 has the full interactive toolkit (Learn, Cheat Sheet, Practice Exam, My Misses) */
  hasTools?: boolean
}

/** Every course, by group, in a sensible study order within each group (the switcher's and the Courses page's order). */
export const COURSES: Course[] = [
  { code: "D278", slug: "d278", name: "Scripting and Programming - Foundations", cu: 3, assessment: "Objective", group: "programming" },
  { code: "C867", slug: "c867", name: "Scripting and Programming - Applications", cu: 4, assessment: "Performance", group: "programming" },
  { code: "D276", slug: "d276", name: "Web Development Foundations", cu: 3, assessment: "Performance", group: "programming" },
  { code: "D197", slug: "d197", name: "Version Control", cu: 1, assessment: "Performance", group: "programming" },

  { code: "D286", slug: "d286", name: "Java Fundamentals", cu: 3, assessment: "Objective", group: "java" },
  { code: "D287", slug: "d287", name: "Java Frameworks", cu: 3, assessment: "Performance", group: "java" },
  { code: "D288", slug: "d288", name: "Back-End Programming", cu: 3, assessment: "Performance", group: "java" },
  { code: "D387", slug: "d387", name: "Advanced Java", cu: 3, assessment: "Performance", group: "java" },

  { code: "D284", slug: "d284", name: "Software Engineering", cu: 4, assessment: "Performance", group: "softeng" },
  { code: "D480", slug: "d480", name: "Software Design and Quality Assurance", cu: 3, assessment: "Performance", group: "softeng" },
  {
    code: "D687",
    slug: "d687",
    name: "Computer Science Project Development with a Team",
    cu: 3,
    assessment: "Performance",
    group: "softeng",
  },

  { code: "D426", slug: "d426", name: "Data Management - Foundations", cu: 3, assessment: "Objective", group: "data" },
  { code: "D427", slug: "d427", name: "Data Management - Applications", cu: 4, assessment: "Objective", group: "data" },

  { code: "D315", slug: "d315", name: "Network and Security - Foundations", cu: 3, assessment: "Objective", group: "security" },
  { code: "D430", slug: "d430", name: "Fundamentals of Information Security", cu: 3, assessment: "Objective", group: "security" },

  { code: "D281", slug: "d281", name: "Linux Foundations", cu: 3, assessment: "Objective", group: "systems" },
  { code: "C952", slug: "c952", name: "Computer Architecture", cu: 3, assessment: "Objective", group: "systems", hasTools: true },
  { code: "D686", slug: "d686", name: "Operating Systems for Computer Scientists", cu: 3, assessment: "Objective", group: "systems" },

  { code: "C960", slug: "c960", name: "Discrete Mathematics II", cu: 4, assessment: "Objective", group: "math" },
  { code: "C949", slug: "c949", name: "Data Structures and Algorithms I", cu: 4, assessment: "Objective", group: "math" },
  { code: "C950", slug: "c950", name: "Data Structures and Algorithms II", cu: 4, assessment: "Performance", group: "math" },

  { code: "D685", slug: "d685", name: "Practical Applications of Prompt", cu: 2, assessment: "Objective", group: "ai" },
  { code: "D429", slug: "d429", name: "Introduction to AI for Computer Scientists", cu: 2, assessment: "Objective", group: "ai" },
  { code: "D682", slug: "d682", name: "Artificial Intelligence Optimization for Computer Scientists", cu: 3, assessment: "Performance", group: "ai" },
  { code: "D683", slug: "d683", name: "Advanced AI and ML", cu: 3, assessment: "Performance", group: "ai" },

  { code: "D459", slug: "d459", name: "Introduction to Systems Thinking and Applications", cu: 3, assessment: "Performance", group: "professional" },
  { code: "D333", slug: "d333", name: "Ethics in Technology", cu: 3, assessment: "Performance", group: "professional" },
  // the assessment is the ITIL 4 Foundation certification exam
  { code: "D336", slug: "d336", name: "Business of IT - Applications", cu: 4, assessment: "Objective", group: "professional" },
  { code: "C458", slug: "c458", name: "Health, Fitness, and Wellness", cu: 4, assessment: "Objective", group: "professional" },
]

export const COURSE_BY_SLUG = Object.fromEntries(COURSES.map((c) => [c.slug, c])) as Record<string, Course>

/* ── Study guide shape ─────────────────────────────────────────────────────
   Text fields may contain a small set of inline HTML tags (b, i, em, strong, code, br, a[href]) and are
   sanitized again at render time. */

export interface GuideResource {
  label: string
  url?: string
  note?: string
  kind: "official" | "community" | "video" | "practice" | "tool"
}

export interface CourseGuide {
  code: string
  /** 2–3 sentence overview */
  summary: string
  /** month and year the research was done, e.g. "Nov 2026" (the page prints "Researched {updated}") */
  updated: string
  assessment: {
    /** e.g. "Objective assessment (proctored)" or "Performance assessment (WGUPS routing program)" */
    type: string
    /** one-line format summary, e.g. "~70 questions · 2 hours · proctored" */
    format: string
    details: string[]
    tips: string[]
  }
  competencies: string[]
  topics: { title: string; eli5: string; detail: string; points: string[] }[]
  /** formulas, commands, complexities, definitions */
  keyFacts: { label: string; value: string; note?: string }[]
  plan: { day: string; focus: string; tasks: string[] }[]
  practice: { q: string; choices?: string[]; answer: string; why: string }[]
  pitfalls: string[]
  resources: GuideResource[]
  /** what students are saying in subreddit posts (r/WGU_CompSci, r/WGU), any year, newest first; newer posts win on conflicts */
  community?: {
    /** consensus summary (based on the newest posts) */
    summary: string
    /** e.g. "24 posts, Apr 2025 – Oct 2026, r/WGU_CompSci and r/WGU" */
    coverage?: string
    posts: { title: string; subreddit: string; url: string; date: string; takeaway?: string }[]
  }
  sources: { label: string; url: string }[]
  /** honest uncertainty notes (new course, sparse public info, version changes) */
  caveats?: string[]
  /** the guide's author, part of its signature (decision 47); the renderer ignores it */
  author?: string
  /** the guide's license, "MIT" (decision 47); the renderer ignores it */
  license?: string
}

/* Guides are not imported here. `virtual:guide-index` (vite.config.ts, guideIndex) carries a light outline of every
   guide (counts, plan days, topic titles, the assessment line) for the views that need them at startup, and
   `@guide-source` loads a whole guide when its course opens: built into the page for `npm run dev` and the one-file
   build, fetched from /guides/ on the hosted site. */
