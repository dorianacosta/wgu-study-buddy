// Progress by shadcn: https://21st.dev/@shadcn/components/progress (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    value={value}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-none bg-secondary",
      className,
    )}
    {...props}
  >
    {/* sized by width, not shifted out of view: at 0% nothing paints, where a shifted bar left a 1px gold edge
        on a fractional pixel */}
    <ProgressPrimitive.Indicator
      className="h-full rounded-none bg-primary transition-[width]"
      style={{ width: `${value ?? 0}%` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
