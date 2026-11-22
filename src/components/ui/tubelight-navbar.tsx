// Tubelight Navbar by ayushmxxn: https://21st.dev/@ayushmxxn/components/tubelight-navbar (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  /** The link's accessible name when it must say more than its visible words ("Learn, D281"). Default: `name`. */
  ariaLabel?: string
  /** Shown after the icon in icon cells (`aria-hidden`: the name already says it); none at 0. */
  count?: number
  /** An invisible copy that sets a named link's width, so a changing count never moves the bar ("My Misses 60"). */
  reserve?: string
  /** The link's `data-focus-key`, so Back puts focus back on it (the app's router reads it). */
  focusKey?: string
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  /** Added for hash routing: the name of the item to highlight, driven by the current route. */
  activeTab?: string
  /** Added for hash routing: runs on click, before the browser follows the link. */
  onNavigate?: (item: NavItem, event: React.MouseEvent<HTMLAnchorElement>) => void
  /** One extra cell after the item at `slotAfter` (the course switcher). It never takes the lamp. */
  slot?: React.ReactNode
  /** How many items come before the slot. */
  slotAfter?: number
}

// Named links (from 744px): the visible name centred over an invisible copy of `reserve`, which sets the width.
function Name({ item }: { item: NavItem }) {
  return (
    <span className="inline-grid place-items-center whitespace-nowrap">
      <span className="[grid-area:1/1]">{item.name}</span>
      {item.reserve && (
        <span aria-hidden="true" className="invisible [grid-area:1/1]">
          {item.reserve}
        </span>
      )}
    </span>
  )
}

export function NavBar({ items, className, activeTab: activeTabProp, onNavigate, slot, slotAfter = 2 }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)

  // The overflow guard: whenever the named row (an invisible copy, measured) is wider than the viewport less twice
  // the page gutter, the bar shows icons as from 640 to 743 (text-only zoom, page translation, a fallback font).
  const copyRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const [tooWide, setTooWide] = useState(false)
  useEffect(() => {
    const copy = copyRef.current
    if (!copy) return
    const check = () => {
      const vw = document.documentElement.clientWidth
      const need = copy.offsetWidth + (slotRef.current ? slotRef.current.offsetWidth + 8 : 0)
      setTooWide(copy.offsetWidth > 0 && need > vw - 2 * (vw >= 1024 ? 32 : 24))
    }
    check()
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check)
    ro?.observe(copy)
    window.addEventListener("resize", check)
    return () => {
      ro?.disconnect()
      window.removeEventListener("resize", check)
    }
  }, [])

  const named = (cls: string) => (tooWide ? "hidden" : cls)
  const link = "relative flex h-12 items-center justify-center rounded-sm text-sm font-medium sm:h-10 sm:px-3 lg:px-4"

  const cells: React.ReactNode[] = items.map((item, i) => {
    const Icon = item.icon
    const isActive = (activeTabProp ?? activeTab) === item.name
    const counted = item.count !== undefined

    return (
      <a
        key={i}
        href={item.url}
        data-focus-key={item.focusKey}
        onClick={(event) => {
          setActiveTab(item.name)
          onNavigate?.(item, event)
        }}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.ariaLabel ?? item.name}
        className={cn(
          link,
          "cursor-pointer text-muted-foreground transition-colors hover:text-foreground",
          "sm:pointer-coarse:h-11 sm:pointer-coarse:min-w-11 pointer-coarse:active:bg-accent",
          isActive && "text-foreground forced-colors:underline",
        )}
      >
        <span className={named("hidden min-[744px]:inline")}>
          <Name item={item} />
        </span>
        <span className={cn("flex items-center", !tooWide && "min-[744px]:hidden")}>
          <Icon size={18} strokeWidth={2.5} />
          {counted && (
            // the count after the icon; at 0 only the top bar keeps its 2ch slot, so the bar's width never moves
            <span
              aria-hidden="true"
              className={cn(
                "ml-1 min-w-[2ch] font-mono text-xs font-normal",
                isActive ? "text-foreground" : "text-muted-foreground",
                !item.count && "hidden sm:inline-block",
              )}
            >
              {item.count || ""}
            </span>
          )}
        </span>
        {isActive && (
          <motion.div
            layoutId="lamp"
            className="absolute inset-0 w-full -z-10 rounded-sm bg-accent"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-primary forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight]" />
          </motion.div>
        )}
      </a>
    )
  })
  if (slot) {
    cells.splice(
      slotAfter,
      0,
      <div key="slot" ref={slotRef} className="relative flex items-center">
        {slot}
      </div>,
    )
  }

  return (
    <div
      className={cn(
        // below 640 docked edge to edge at the bottom; from 640 floating at the top, clear of the top inset
        // pointer-events-none: the band above the floating bar never swallows clicks on the page under it
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 print:hidden",
        "sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-0 sm:bottom-auto sm:pt-[max(24px,env(safe-area-inset-top))] sm:short:pt-[max(8px,env(safe-area-inset-top))]",
        className,
      )}
    >
      {/* isolate: a stacking context for the lamp's -z-10 (the removed backdrop-blur made one); without it the
          lamp drops behind the opaque bg-card and the current cell disappears */}
      <div
        className={cn(
          "pointer-events-auto isolate grid grid-cols-7 rounded-t-lg border border-b-0 border-border bg-card pt-1",
          "pl-[max(4px,env(safe-area-inset-left))] pr-[max(4px,env(safe-area-inset-right))] pb-[max(4px,env(safe-area-inset-bottom))]",
          "sm:flex sm:items-center sm:gap-2 sm:rounded-lg sm:border-b sm:p-1",
        )}
      >
        {cells}
      </div>
      {/* the overflow guard's copy of the named row (links only; the slot's width is added when measured) */}
      <div
        ref={copyRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 hidden w-max gap-2 border p-1 min-[744px]:flex"
      >
        {items.map((item, i) => (
          <span key={i} className={link}>
            <Name item={item} />
          </span>
        ))}
      </div>
    </div>
  )
}
