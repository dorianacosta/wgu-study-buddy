// Number Ticker by Magic UI (dillionverma): https://21st.dev/@magicui/components/number-ticker (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

function format(n: number, decimalPlaces: number) {
  return Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(n.toFixed(decimalPlaces)))
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: {
  value: number
  direction?: "up" | "down"
  className?: string
  delay?: number // delay in s
  decimalPlaces?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })
  // useSpring ignores MotionConfig's reducedMotion, so reduced motion writes the final number at once (decision 37)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = format(direction === "down" ? 0 : value, decimalPlaces)
      return
    }
    isInView &&
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)
  }, [motionValue, isInView, delay, value, direction, reduce, decimalPlaces])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = format(latest, decimalPlaces)
        }
      }),
    [springValue, decimalPlaces],
  )

  return (
    <span
      className={cn(
        "inline-block tabular-nums text-foreground",
        className,
      )}
      ref={ref}
    />
  )
}
