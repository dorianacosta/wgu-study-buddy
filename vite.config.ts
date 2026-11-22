/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { viteSingleFile } from "vite-plugin-singlefile"
import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, URL } from "node:url"

/** The C952 content behind the "@c952-content" import: the 60 original C952 practice questions. */
const CONTENT = "src/data/content.json"
/** One study guide per course, `<slug>.json` (src/data/courses.ts, CourseGuide). */
const GUIDES_DIR = "src/data/guides"
const BANNER = "/*! WGU Study Buddy · © 2026 Dorian Acosta · MIT License */"

const fromRoot = (file: string) => fileURLToPath(new URL(`./${file}`, import.meta.url))

/** Writes dist/build-info.json (the C952 bank the build holds, from the content's meta), which scripts/single-file.mjs reads. */
function buildInfo(mode: string, fetchGuides: boolean): Plugin {
  return {
    name: "wgu-study-buddy:build-info",
    // After vite-plugin-singlefile, so the build info is not reported as an asset it could not inline.
    enforce: "post",
    generateBundle: {
      order: "post",
      handler() {
        const { meta } = JSON.parse(readFileSync(fromRoot(CONTENT), "utf8")) as { meta?: { bank?: string } }
        // "guides": built into the page ("embedded", which works offline) or fetched from /guides/ ("fetched")
        const info = { app: "WGU Study Buddy", bank: meta?.bank ?? null, private: false, mode, guides: fetchGuides ? "fetched" : "embedded" }
        this.emitFile({ type: "asset", fileName: "build-info.json", source: `${JSON.stringify(info, null, 2)}\n` })
      },
    },
  }
}

/* ── The guide index ─────────────────────────────────────────────────────── */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
const DOT = "·"
const LINK = "https://link.invalid/"
const asList = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : [])
const asObj = (v: Json | undefined): { [key: string]: Json } =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {}
const text = (v: Json | undefined) => (typeof v === "string" ? v : "")
/** "·" for a filled string, "" for an empty one: keeps the field's presence, not its words. */
const mark = (v: Json | undefined) => (text(v).trim() ? DOT : "")
const marks = (v: Json | undefined) => asList(v).map(mark)
const href = (v: Json | undefined) => (/^https?:\/\//i.test(text(v)) ? LINK : "")

/**
 * A guide's outline: the CourseGuide shape with only what the app needs before the guide itself loads. The plan's
 * days, the topics' titles, the assessment's type and format and the research month stay as written; every other
 * string becomes "·" (or a placeholder link), so the counts and "has this section" checks in src/lib/course.ts
 * (guideFacts) and src/views/course/shared.tsx (normalizeGuide) read the outline exactly as they read the guide.
 */
function outline(raw: Json): Json {
  const g = asObj(raw)
  const a = asObj(g.assessment)
  const cm = asObj(g.community)
  return {
    code: text(g.code),
    summary: mark(g.summary),
    updated: text(g.updated),
    assessment: { type: text(a.type), format: text(a.format), details: marks(a.details), tips: marks(a.tips) },
    competencies: marks(g.competencies),
    topics: asList(g.topics).map((t) => {
      const o = asObj(t)
      return { title: text(o.title), eli5: mark(o.eli5), detail: mark(o.detail), points: marks(o.points) }
    }),
    keyFacts: asList(g.keyFacts).map((f) => ({ label: mark(asObj(f).label), value: mark(asObj(f).value) })),
    plan: asList(g.plan).map((p) => {
      const o = asObj(p)
      return { day: text(o.day), focus: text(o.focus), tasks: marks(o.tasks) }
    }),
    practice: asList(g.practice).map((p) => {
      const o = asObj(p)
      return { q: mark(o.q), answer: mark(o.answer), why: mark(o.why) }
    }),
    pitfalls: marks(g.pitfalls),
    resources: asList(g.resources).map((r) => ({ label: mark(asObj(r).label), url: href(asObj(r).url), kind: text(asObj(r).kind) })),
    community: {
      summary: mark(cm.summary),
      posts: asList(cm.posts).map((p) => ({ title: mark(asObj(p).title), url: href(asObj(p).url) })),
    },
    sources: asList(g.sources).map((s) => ({ label: mark(asObj(s).label), url: href(asObj(s).url) })),
    caveats: marks(g.caveats),
  }
}

const INDEX_ID = "virtual:guide-index"
const RESOLVED_INDEX_ID = `\0${INDEX_ID}`

/**
 * `virtual:guide-index`: every guide's outline (GUIDE_INDEX) and, on the hosted build, its file's address
 * (GUIDE_URLS). With `fetchGuides` the guides are not built into the page: each is written to
 * dist/guides/<slug>.<content hash>.json, which the app fetches when its course first opens (src/data/
 * guide-source.fetch.ts), so the page stays small however many courses there are. Without it (dev, and the one-file
 * build) src/data/guide-source.embed.ts builds every guide into the page instead, and GUIDE_URLS is empty.
 */
function guideIndex(fetchGuides: boolean): Plugin {
  const dir = fromRoot(GUIDES_DIR)
  const read = () =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => {
        const data = JSON.parse(readFileSync(join(dir, f), "utf8")) as Json
        const json = JSON.stringify(data)
        const slug = f.slice(0, -".json".length).toLowerCase()
        const hash = createHash("sha256").update(json).digest("hex").slice(0, 10)
        return { slug, path: join(dir, f), json, outline: outline(data), file: `guides/${slug}.${hash}.json` }
      })
  let guides: ReturnType<typeof read> = []

  return {
    name: "wgu-study-buddy:guide-index",
    // After vite-plugin-singlefile, so the guide files are not reported as assets it could not inline.
    enforce: "post",
    resolveId: (id) => (id === INDEX_ID ? RESOLVED_INDEX_ID : null),
    load(id) {
      if (id !== RESOLVED_INDEX_ID) return null
      guides = read()
      for (const g of guides) this.addWatchFile(g.path)
      const index = Object.fromEntries(guides.map((g) => [g.slug, g.outline]))
      const urls = fetchGuides ? Object.fromEntries(guides.map((g) => [g.slug, `/${g.file}`])) : {}
      return `export const GUIDE_INDEX = ${JSON.stringify(index)}\nexport const GUIDE_URLS = ${JSON.stringify(urls)}\n`
    },
    generateBundle: {
      order: "post",
      handler() {
        if (!fetchGuides) return
        for (const g of guides) this.emitFile({ type: "asset", fileName: g.file, source: g.json })
      },
    },
  }
}

/* ── The Content-Security-Policy ─────────────────────────────────────────── */

/**
 * Writes a Content-Security-Policy <meta> tag into the finished page (dist/index.html). The app is one inline
 * script, so the policy allows exactly that script, by its SHA-256 hash, and blocks everything else: other
 * scripts (including inline event handlers in content HTML), eval, frames and plugins. Network requests are blocked
 * too, except, on the hosted build (`fetchGuides`), same-origin fetches of the guide files. The policy lives in the
 * page, so the Netlify site and WGU_Study_Buddy.html both carry it. A <meta> policy cannot set frame-ancestors;
 * netlify.toml sends that part as a header.
 */
function contentSecurityPolicy(fetchGuides: boolean): Plugin {
  return {
    name: "wgu-study-buddy:csp",
    // After vite-plugin-singlefile (also post/post), so the script it hashes is the final inlined one.
    enforce: "post",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const page = bundle["index.html"]
        if (page?.type !== "asset" || typeof page.source !== "string") return this.error("csp: no index.html in the bundle")
        const html = page.source
        const hashes: string[] = []
        for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
          if (/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue // a data block: never runs
          if (/\bsrc\s*=/i.test(attrs)) this.error(`csp: the page loads an external script (<script${attrs}>)`)
          // Browsers hash the script text after turning CRLF into LF.
          const digest = createHash("sha256").update(body.replace(/\r\n?/g, "\n"), "utf8").digest("base64")
          hashes.push(`'sha256-${digest}'`)
        }
        if (hashes.length === 0) this.error("csp: the page has no inline script to allow")
        const policy = [
          "default-src 'none'",
          `script-src ${hashes.join(" ")}`,
          "style-src 'unsafe-inline'",
          "img-src data:",
          "font-src data:",
          ...(fetchGuides ? ["connect-src 'self'"] : []),
          "base-uri 'none'",
          "form-action 'none'",
        ].join("; ")
        const charset = /<meta charset="UTF-8"\s*\/?>/i
        if (!charset.test(html)) this.error('csp: <meta charset="UTF-8"> not found, so the policy has no place')
        page.source = html.replace(charset, (tag) => `${tag}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
      },
    },
  }
}

/*
 * Builds the app (code, styles, fonts) into ONE self-contained HTML file, dist/index.html.
 * - `npm run build` (mode "production", the hosted site): the guides stay out of the page and are written to
 *   dist/guides/, fetched when a course opens.
 * - `npm run build:file` (mode "single") and `npm run dev`: every guide is built into the page, which works offline.
 */
export default defineConfig(({ command, mode }) => {
  const fetchGuides = command === "build" && mode === "production"
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      guideIndex(fetchGuides),
      buildInfo(mode, fetchGuides),
      contentSecurityPolicy(fetchGuides),
    ],
    resolve: {
      alias: {
        "@c952-content": fromRoot(CONTENT),
        "@guide-source": fromRoot(fetchGuides ? "src/data/guide-source.fetch.ts" : "src/data/guide-source.embed.ts"),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      // Vite 8 minifies with comments.legal off, which strips a /*! comment added by output.banner.
      // Rolldown's postBanner is prepended after minification, so the notice stays in the bundle.
      rolldownOptions: { output: { postBanner: BANNER } },
    },
  }
})
