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
terminal.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TerminalLine {
  text: string;
  type?: "input" | "output" | "error" | "system";
}

interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  lines: TerminalLine[];
  title?: string;
  typewriter?: boolean;
  variant?: "default" | "danger" | "locked";
}

const linePrefix: Record<string, string> = {
  error: "! ",
  input: "> ",
  output: "  ",
  system: ":: ",
};

const lineColor: Record<string, string> = {
  error: "text-red-500",
  input: "text-primary",
  output: "text-foreground/90",
  system: "text-amber-500",
};

const variantBorder: Record<string, string> = {
  danger: "border-red-500/50",
  default: "border-primary/50",
  locked: "border-amber-500/50",
};

const variantHeader: Record<string, string> = {
  danger: "border-red-500/30 text-red-500",
  default: "border-primary/30 text-primary",
  locked: "border-amber-500/30 text-amber-500",
};

export function Terminal({
  lines,
  title = "TERMINAL",
  variant = "default",
  typewriter = true,
  className,
  ...props
}: TerminalProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Typewriter: reveal lines one by one, then characters within each line
  const [revealedLines, setRevealedLines] = React.useState(
    typewriter ? 0 : lines.length,
  );
  const [charCount, setCharCount] = React.useState(
    typewriter ? 0 : Number.POSITIVE_INFINITY,
  );

  React.useEffect(() => {
    if (!typewriter) {
      setRevealedLines(lines.length);
      setCharCount(Number.POSITIVE_INFINITY);
      return;
    }

    setRevealedLines(0);
    setCharCount(0);
    let lineIdx = 0;
    let charIdx = 0;
    let cancelled = false;

    function typeNext() {
      if (cancelled || lineIdx >= lines.length) {
        return;
      }

      const currentLine = lines[lineIdx];
      if (charIdx < currentLine.text.length) {
        charIdx++;
        setCharCount(charIdx);
        setTimeout(typeNext, 20 + Math.random() * 20);
      } else {
        // Line complete, move to next
        lineIdx++;
        charIdx = 0;
        setRevealedLines(lineIdx);
        setCharCount(0);
        if (lineIdx < lines.length) {
          setTimeout(typeNext, 200 + Math.random() * 150);
        }
      }
    }

    const startTimer = setTimeout(typeNext, 400);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [lines, typewriter]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div
      data-slot="tron-terminal"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden rounded border bg-card/80 backdrop-blur-sm",
        variantBorder[variant],
        className,
      )}
      {...props}
    >
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* Scan sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute right-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{ animation: "terminalScan 5s ease-in-out infinite" }}
        />
      </div>

      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2",
          variantHeader[variant],
        )}
      >
        <span className="text-[10px] text-foreground/80 uppercase tracking-widest">
          {title}
        </span>
        {variant === "locked" && (
          <span className="ml-auto animate-pulse text-[10px] text-amber-500 uppercase tracking-widest">
            LOCKED
          </span>
        )}
      </div>

      {/* Lines */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.map((line, i) => {
          const type = line.type ?? "output";
          // Already fully revealed lines
          if (i < revealedLines) {
            return (
              <div key={i} className={cn("leading-relaxed", lineColor[type])}>
                <span className="opacity-60">{linePrefix[type]}</span>
                {line.text}
              </div>
            );
          }
          // Currently typing line
          if (i === revealedLines && charCount > 0) {
            return (
              <div key={i} className={cn("leading-relaxed", lineColor[type])}>
                <span className="opacity-60">{linePrefix[type]}</span>
                {line.text.slice(0, charCount)}
                <span className="animate-pulse text-primary">▌</span>
              </div>
            );
          }
          // Not yet revealed
          return null;
        })}

        {/* Idle cursor (shown when all lines typed) */}
        {revealedLines >= lines.length && (
          <div className="inline-flex items-center text-primary leading-relaxed">
            <span className="opacity-60">{"> "}</span>
            <span className="animate-pulse">▌</span>
          </div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="pointer-events-none absolute top-0 left-0 h-4 w-4 border-primary/50 border-t-2 border-l-2" />
      <div className="pointer-events-none absolute top-0 right-0 h-4 w-4 border-primary/50 border-t-2 border-r-2" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-primary/50 border-b-2 border-l-2" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-4 w-4 border-primary/50 border-r-2 border-b-2" />
    </div>
  );
}

export default Terminal;


demo.tsx
"use client";

import { Terminal } from "@/components/ui/terminal";

export default function TerminalDemo() {
  return (
    <div className="flex w-full min-h-[400px] items-center justify-center bg-background p-10">
      <Terminal
        className="w-full max-w-md"
        lines={[
          { type: "system", text: "SYSTEM BOOT SEQUENCE INITIATED" },
          { type: "input", text: "connect --grid=encom" },
          { type: "output", text: "Connection established. Welcome, User." },
          { type: "error", text: "Access to Sector 7 denied." },
        ]}
      />
    </div>
  );
}

```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --background: oklch(0.06 0.02 250);
  --foreground: oklch(0.95 0.02 220);
  --card: oklch(0.1 0.02 250);
  --card-foreground: oklch(0.92 0.02 220);
  --primary: oklch(0.75 0.18 195);
  --primary-foreground: oklch(0.1 0 0);
  --border: oklch(0.3 0.1 195);
  --ring: oklch(0.75 0.18 195);
}


@keyframes terminalScan {
  0%, 100% {
    top: 0%;
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  50% {
    top: 100%;
  }
}
```
