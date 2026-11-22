/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/*
 * The curtain over the field (Background.md, FieldScrim, useFieldCut and useFieldExposed). Layout plumbing, not a
 * 21st.dev asset, so it stays out of ui/.
 *
 * The curtain lives in page coordinates: an absolute layer in the App root, from the cut down to the root's bottom.
 * It scrolls with the content on the compositor, so its top edge stays glued to the hero's bottom with no scroll
 * listener and no per-frame style write.
 */
import { useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react"

let cutTarget: HTMLElement | null = null        // the Home hero box while Home is mounted
let exposed = false                              // is any full-strength field on screen?
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

/** Home's hero box only: the curtain's top edge moves to this box's bottom, so the field shows at full strength
 *  only there, and useFieldExposed() reports whether the box intersects the viewport. */
export function useFieldCut(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current
    cutTarget = el
    emit()
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      exposed = entries[entries.length - 1].isIntersecting
      emit()
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cutTarget = null
      exposed = false
      emit()
    }
  }, [ref])
}

/** True while the hero box intersects the viewport, so some full-strength field is on screen.
 *  The App passes curtained={!useFieldExposed()} to TrippinSpiral. */
export const useFieldExposed = () => useSyncExternalStore(subscribe, () => exposed, () => false)

/** The curtain: second child of the App root (relative, no padding on top), right after <TrippinSpiral />. Its top
 *  is the cut (the hero box's bottom in App-root coordinates), else 0 so it covers the whole page. */
export function FieldScrim() {
  const scrim = useRef<HTMLDivElement>(null)
  const target = useSyncExternalStore(subscribe, () => cutTarget, () => null)
  useLayoutEffect(() => {
    const el = scrim.current, root = el?.parentElement        // the App root: relative, no padding on top
    if (!el || !root) return
    if (!target) {
      el.style.top = "0px"
      return
    }
    const place = () => {
      el.style.top = `${Math.round(target.getBoundingClientRect().bottom - root.getBoundingClientRect().top)}px`
    }
    place()
    const ro = new ResizeObserver(place)                      // the hero box and everything around it
    ro.observe(target)
    ro.observe(root)
    return () => {
      ro.disconnect()
      el.style.top = "0px"
    }
  }, [target])
  return (
    <div
      ref={scrim}
      aria-hidden="true"
      data-slot="field-scrim"
      data-field-scrim=""
      className="pointer-events-none absolute inset-x-0 top-0 bottom-0 -z-10 bg-scrim"
    />
  )
}
