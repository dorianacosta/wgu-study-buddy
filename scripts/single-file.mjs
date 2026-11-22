/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
// Copies the one-file build (dist/index.html) to WGU_Study_Buddy.html. Node only, no dependencies.
//
//   node scripts/single-file.mjs [--out-dir <dir>]
//
// npm run build:file runs vite build first. dist/build-info.json (written by vite.config.ts) must say
// "private": false, and the HTML must not carry the marker of the retired private bank (a safety net for a
// stale or hand-made dist/): otherwise the script stops and writes nothing. The default output folder is the
// project root.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DIST = join(ROOT, "dist")
const NAME = "WGU_Study_Buddy.html"
const PRIVATE_MARKER = "WGU-STUDY-BUDDY-PRIVATE-BANK-DO-NOT-PUBLISH"
const USAGE = "usage: node scripts/single-file.mjs [--out-dir <dir>]"

function fail(message) {
  console.error(`single-file: ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const opts = { outDir: ROOT, check: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--out-dir" || arg === "--check") {
      const value = argv[++i]
      if (!value || value.startsWith("--")) fail(`${arg} needs a path.\n${USAGE}`)
      if (arg === "--out-dir") opts.outDir = resolve(value)
      else opts.check = resolve(value)
    } else {
      fail(`unknown argument "${arg}".\n${USAGE}`)
    }
  }
  return opts
}

/** Why `html` must not be written as WGU_Study_Buddy.html, or null when it may be. */
function htmlProblem(html) {
  return html.includes(PRIVATE_MARKER) ? `it contains the private-bank marker ${PRIVATE_MARKER}` : null
}

function formatSize(bytes) {
  const size = bytes >= 1e6 ? `${(bytes / 1e6).toFixed(2)} MB` : `${(bytes / 1e3).toFixed(1)} kB`
  return `${size}, ${bytes.toLocaleString("en-US")} bytes`
}

const opts = parseArgs(process.argv.slice(2))

// Hidden test hook: runs the marker check on any file and writes nothing.
if (opts.check) {
  if (!existsSync(opts.check)) fail(`no such file: ${opts.check}`)
  const problem = htmlProblem(readFileSync(opts.check))
  if (problem) fail(`refusing ${opts.check} as ${NAME}: ${problem}.`)
  console.log(`single-file: ${opts.check} passes the ${NAME} check.`)
  process.exit(0)
}

const htmlPath = join(DIST, "index.html")
const infoPath = join(DIST, "build-info.json")
if (!existsSync(htmlPath) || !existsSync(infoPath)) {
  fail("dist/index.html or dist/build-info.json is missing. Build first: npm run build:file.")
}

let info
try {
  info = JSON.parse(readFileSync(infoPath, "utf8"))
} catch (error) {
  fail(`cannot read dist/build-info.json: ${error.message}`)
}
if (info && typeof info === "object" && info.guides !== "embedded") {
  fail('dist/ holds the hosted build, which fetches its guides from /guides/ (npm run build). The offline file needs every guide built in: npm run build:file.')
}
if (!info || typeof info !== "object" || info.private !== false) {
  fail('dist/build-info.json does not say "private": false (a stale or foreign build). Rebuild: npm run build:file.')
}

const html = readFileSync(htmlPath)
const problem = htmlProblem(html)
if (problem) fail(`refusing to write ${NAME}: ${problem}. Rebuild: npm run build:file.`)

const outPath = join(opts.outDir, NAME)
try {
  mkdirSync(opts.outDir, { recursive: true })
  writeFileSync(outPath, html)
} catch (error) {
  fail(`cannot write ${outPath}: ${error.message}`)
}
console.log(`single-file: wrote ${outPath} (${formatSize(html.length)}), bank "${info.bank}", mode "${info.mode}".`)
