/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Allow-list sanitizer for researched study-guide text.
 * Everything is escaped, then only these inline tags are restored, without attributes:
 *   b, strong, i, em, code, br, sub, sup
 * plus <a href="http(s)://..."> links, which open in a new tab.
 */
const ALLOWED = ["b", "strong", "i", "em", "code", "br", "sub", "sup"]

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function safeHtml(input: string | undefined | null): string {
  if (!input) return ""
  // keep already-escaped entities readable: decode the few common ones first, then escape everything. &nbsp; becomes
  // a real non-breaking space (code indents in the guides), which is plain text and stays safe.
  const decoded = input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  let out = escapeHtml(decoded)

  for (const tag of ALLOWED) {
    out = out
      .replace(new RegExp(`&lt;${tag}\\s*/?&gt;`, "gi"), `<${tag}>`)
      .replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`)
  }
  out = out.replace(/<br>/gi, "<br/>")

  // <a href="https://..."> … </a>
  out = out.replace(
    /&lt;a\s+href=&quot;(https?:\/\/(?:[^\s&]|&amp;)+?)&quot;\s*&gt;([\s\S]*?)&lt;\/a&gt;/gi,
    (_m, href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  )
  return out
}
