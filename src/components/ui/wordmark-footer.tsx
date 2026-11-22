// Footer with Big Wordmark by vilqor: https://21st.dev/@vilqor/components/wordmark-footer (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// at least 44 px tall wherever a finger taps it
const tap = "max-md:inline-flex max-md:min-h-11 max-md:items-center pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
// main's gutters (16, 24 from 640, 32 from 1024), each side at least its safe-area inset
const gutters =
  "pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] sm:pl-[max(24px,env(safe-area-inset-left))] sm:pr-[max(24px,env(safe-area-inset-right))] lg:pl-[max(32px,env(safe-area-inset-left))] lg:pr-[max(32px,env(safe-area-inset-right))]"

export type FooterColumn = { title: string; links: { label: string; href: string }[] }

export interface WordmarkFooterProps extends React.HTMLAttributes<HTMLElement> {
  /** The product name: the wordmark top left and the large name at the bottom. */
  name: string
  /** The name in the © line. */
  legalName?: string
  year: number
  description?: string
  email?: string
  /** A short status line next to a green dot, such as "All systems normal". */
  status?: string
  /** What screen readers call the footer navigation. */
  navLabel?: string
  columns: FooterColumn[]
  /** A small link at the end of the bottom line. */
  credit?: { label: string; href: string }
  /** The license, a link after the © text: "© 2026 Name · MIT License". */
  license?: { label: string; href: string }
  /** A line of its own after the © line, such as "Not affiliated with …". */
  notice?: string
  /** Settings shown in the bottom line right after the © line, such as a Switch and its Label. */
  controls?: React.ReactNode
}

/**
 * A footer with a short description, link columns that fold on phones, and the product name set large,
 * fading into the background.
 */
export function WordmarkFooter({
  name,
  legalName,
  year,
  description,
  email,
  status,
  navLabel = "Footer",
  columns,
  credit,
  license,
  notice,
  controls,
  className,
  ...props
}: WordmarkFooterProps) {
  return (
    <footer className={cn("relative overflow-hidden text-foreground", className)} {...props}>
      <div className={cn("mx-auto grid w-full max-w-[1120px] gap-12 pt-16 pb-10 max-md:gap-6 max-md:pt-12 max-md:pb-6 md:grid-cols-12", gutters)}>
        <div className="md:col-span-5">
          <span className="block font-mono text-2xl font-semibold tracking-[-0.01em]">
            {name}
          </span>
          {description && <p className="mt-4 max-w-[300px] font-sans text-sm text-muted-foreground">{description}</p>}
          {status && (
            <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
              {status}
            </p>
          )}
        </div>
        <nav aria-label={navLabel} className="grid grid-cols-2 gap-8 max-md:hidden md:col-span-6 md:col-start-7 lg:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{col.title}</p>
              <ul className="mt-4 grid gap-2.5 pointer-coarse:mt-2 pointer-coarse:gap-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={cn("text-sm text-muted-foreground transition-colors hover:text-foreground", tap)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {/* phones: each column folds away; tap a heading to open it */}
        <nav aria-label={navLabel} className="-mx-4 grid gap-1 md:hidden">
          {columns.map((col) => (
            <details key={col.title} className="group rounded-sm open:bg-muted">
              <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{col.title}</span>
                <Plus className="size-4 text-muted-foreground transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" strokeWidth={1.75} aria-hidden="true" />
              </summary>
              <ul className="px-4 pb-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </div>
      {/* the bottom row wraps from 640: the notice takes a line of its own under it (after the © line below 640) */}
      <div className={cn("mx-auto flex w-full max-w-[1120px] flex-col gap-2 pb-6 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2", gutters)}>
        <p className="font-mono tabular-nums">
          © {year} {legalName ?? name}
          {license && (
            <>
              {" · "}
              <a href={license.href} className={cn("transition-colors hover:text-foreground", tap)}>
                {license.label}
              </a>
            </>
          )}
        </p>
        {notice && <p className="sm:order-last sm:basis-full">{notice}</p>}
        {/* print:hidden! because tap's max-md: and pointer-coarse: display classes come later, and a page prints under 768 */}
        {controls && <div className={cn("flex items-center gap-2 print:hidden!", tap)}>{controls}</div>}
        {email && (
          <a href={`mailto:${email}`} className={cn("transition-colors hover:text-foreground", tap)}>
            {email}
          </a>
        )}
        {credit && (
          <a href={credit.href} className={cn("transition-colors hover:text-foreground sm:ml-auto", tap)}>
            {credit.label}
          </a>
        )}
      </div>
      {/* the name, set large and fading into the background */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.2em] text-center font-mono text-[10.5vw] font-semibold leading-none tracking-[-0.02em] text-transparent select-none [background-clip:text] [-webkit-background-clip:text] [background-image:linear-gradient(to_bottom,color-mix(in_oklab,var(--color-foreground)_32%,transparent),transparent_85%)]"
      >
        {name}
      </p>
    </footer>
  )
}

export default WordmarkFooter
