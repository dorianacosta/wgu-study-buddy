// Empty State by serafimcloud: https://21st.dev/@serafimcloud/components/empty-state (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icons?: LucideIcon[]
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "bg-card border-input hover:border-muted-foreground text-center",
      "border-2 border-dashed rounded-lg p-8 sm:p-14 w-full max-w-[620px]",
      "group transition duration-500 hover:duration-200",
      className
    )}>
      <div className="flex justify-center isolate">
        {icons.length === 3 ? (
          <>
            <div className="bg-card size-12 grid place-items-center rounded-lg relative left-2.5 top-1.5 -rotate-6 ring-1 ring-border group-hover:-translate-x-5 group-hover:-rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
              {React.createElement(icons[0], {
                className: "w-6 h-6 text-muted-foreground"
              })}
            </div>
            <div className="bg-card size-12 grid place-items-center rounded-lg relative z-10 ring-1 ring-border group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
              {React.createElement(icons[1], {
                className: "w-6 h-6 text-muted-foreground"
              })}
            </div>
            <div className="bg-card size-12 grid place-items-center rounded-lg relative right-2.5 top-1.5 rotate-6 ring-1 ring-border group-hover:translate-x-5 group-hover:rotate-12 group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
              {React.createElement(icons[2], {
                className: "w-6 h-6 text-muted-foreground"
              })}
            </div>
          </>
        ) : (
          <div className="bg-card size-12 grid place-items-center rounded-lg ring-1 ring-border group-hover:-translate-y-0.5 transition duration-500 group-hover:duration-200">
            {icons[0] && React.createElement(icons[0], {
              className: "w-6 h-6 text-muted-foreground"
            })}
          </div>
        )}
      </div>
      <h2 className="text-foreground text-base font-semibold mt-6">{title}</h2>
      <p className="font-sans text-sm text-muted-foreground mt-2 whitespace-pre-line">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className={cn(
            "mt-4"
          )}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
