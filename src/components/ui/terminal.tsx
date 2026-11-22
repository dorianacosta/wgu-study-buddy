// Terminal by thegridcn (The Gridcn library): https://21st.dev/@thegridcn/components/terminal (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
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
  idleCursor?: boolean;
  variant?: "default" | "danger" | "locked";
}

const linePrefix: Record<string, string> = {
  error: "! ",
  input: "> ",
  output: "  ",
  system: ":: ",
};

const lineColor: Record<string, string> = {
  error: "text-destructive",
  input: "text-primary",
  output: "text-foreground",
  system: "text-muted-foreground",
};

const variantBorder: Record<string, string> = {
  danger: "border-destructive",
  default: "border-border",
  locked: "border-chart-2",
};

const variantHeader: Record<string, string> = {
  danger: "border-destructive text-destructive",
  default: "border-border",
  locked: "border-chart-2 text-chart-2",
};

export function Terminal({
  lines,
  title = "TERMINAL",
  variant = "default",
  typewriter = true,
  idleCursor = true,
  className,
  ...props
}: TerminalProps) {
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

  return (
    <div
      data-slot="tron-terminal"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card",
        variantBorder[variant],
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2",
          variantHeader[variant],
        )}
      >
        <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </span>
        {variant === "locked" && (
          <span className="ml-auto animate-pulse text-[10px] text-chart-2 uppercase tracking-widest">
            LOCKED
          </span>
        )}
      </div>

      {/* Lines: long tokens break instead of widening the window, and a wrapped line hangs 2ch in from the text.
          The 2-character marker ("  ", "> ", "! ") sits in its own 2ch gutter, out of the flow: in the flow its
          spaces lined a continuation up with the code (2ch) and gave a long first token a blank first line */}
      <div
        className="p-4 font-mono text-sm whitespace-pre-wrap [overflow-wrap:anywhere]"
      >
        {lines.map((line, i) => {
          const type = line.type ?? "output";
          // Already fully revealed lines
          if (i < revealedLines) {
            return (
              <div key={i} className={cn("relative leading-6 pl-[4ch] -indent-[2ch]", lineColor[type])}>
                <span className="absolute left-0 indent-0">{linePrefix[type]}</span>
                {line.text}
              </div>
            );
          }
          // Currently typing line
          if (i === revealedLines && charCount > 0) {
            return (
              <div key={i} className={cn("relative leading-6 pl-[4ch] -indent-[2ch]", lineColor[type])}>
                <span className="absolute left-0 indent-0">{linePrefix[type]}</span>
                {line.text.slice(0, charCount)}
                <span className="animate-[caret-blink_1.1s_steps(1)_infinite] text-primary motion-reduce:animate-none">▌</span>
              </div>
            );
          }
          // Not yet revealed
          return null;
        })}

        {/* Idle cursor (shown when all lines typed) */}
        {idleCursor && revealedLines >= lines.length && (
          <div className="inline-flex items-center text-primary leading-6">
            <span>{"> "}</span>
            <span className="animate-[caret-blink_1.1s_steps(1)_infinite] motion-reduce:animate-none">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminal;
