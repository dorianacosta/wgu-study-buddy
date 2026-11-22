/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * Content helpers: render the study content's HTML. They carry no design of their own; the look comes from the
 * collected 21st.dev components around them and the minimal `.rich` rules in index.css.
 */
import { createElement } from "react"
import { cn } from "@/lib/utils"
import { safeHtml } from "@/lib/safe-html"

/** Renders the C952 content's own HTML (bold, italics, code, lists). Content is bundled, not user input. */
export function Rich({ html, className, as = "div" }: { html: string; className?: string; as?: "div" | "span" | "p" }) {
  return createElement(as, { className: cn("rich", className), dangerouslySetInnerHTML: { __html: html } })
}

/** Like Rich, but for researched text (course guides): passed through the allow-list sanitizer first. */
export function SafeRich({ html, className, as = "div" }: { html: string; className?: string; as?: "div" | "span" | "p" }) {
  return createElement(as, { className: cn("rich", className), dangerouslySetInnerHTML: { __html: safeHtml(html) } })
}
