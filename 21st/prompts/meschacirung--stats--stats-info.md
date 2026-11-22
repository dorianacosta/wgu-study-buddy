You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
stats.tsx
import { Card } from '@/components/ui/card'

type Stat = {
  value: string
  label: string
}

const STATS: Stat[] = [
  { value: '+1200', label: 'Stars on GitHub' },
  { value: '56%', label: 'Conversion rate' },
  { value: '+500', label: 'Powered Apps' },
]

export default function StatsSection() {
  return (
    <section className="bg-muted py-12 md:py-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Card
          role="list"
          aria-label="Key product stats"
          className={[
            // Always 3 columns, never wrap
            "grid grid-cols-3",
            // Equal width and spacing
            "gap-2 sm:gap-4 md:gap-6",
            "p-3 sm:p-4 md:p-6",
            // Vertical dividers between items
            "divide-x",
          ].join(' ')}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              role="listitem"
              className="flex flex-col items-center justify-center px-3 text-center"
            >
              <div
                className={[
                  "text-foreground font-semibold tracking-tight whitespace-nowrap",
                  // Fluid font size
                  "text-[clamp(1.75rem,5vw,2.5rem)] leading-none",
                ].join(' ')}
              >
                {s.value}
              </div>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {s.label}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </section>
  )
}


demo.tsx
export default function StatsSection() {
    return (
        <section>
            <div className="bg-muted/50 py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <div>
                        <h2 className="text-4xl font-semibold lg:text-5xl">Tailark in numbers</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">Our platform continues to grow with developers and businesses using our tools to create innovative solutions and enhance productivity.</p>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-4">
                        <div>
                            <div className="text-foreground text-4xl font-bold">90+</div>
                            <p className="text-muted-foreground">Integrations</p>
                        </div>
                        <div>
                            <div className="text-foreground text-4xl font-bold">56%</div>
                            <p className="text-muted-foreground">Productivity Boost</p>
                        </div>
                        <div>
                            <div className="text-foreground text-4xl font-bold">24/7</div>
                            <p className="text-muted-foreground">Customer Support</p>
                        </div>
                        <div>
                            <div className="text-foreground text-4xl font-bold">10k+</div>
                            <p className="text-muted-foreground">Active Users</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
```

Copy-paste these files for dependencies:
```tsx
shadcn/card
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```
