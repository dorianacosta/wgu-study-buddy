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
corner-frame.tsx
import { Slot, Slottable } from "@radix-ui/react-slot";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

type CornerFrameCorner =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

const CORNERS: CornerFrameCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const LINE = "var(--corner-frame-thickness)";
const INSET = "var(--corner-frame-inset)";

/** Where each bracket sits and which two edges it draws. */
const CORNER_STYLES: Record<CornerFrameCorner, CSSProperties> = {
  "top-left": {
    top: INSET,
    left: INSET,
    borderTopWidth: LINE,
    borderLeftWidth: LINE,
  },
  "top-right": {
    top: INSET,
    right: INSET,
    borderTopWidth: LINE,
    borderRightWidth: LINE,
  },
  "bottom-left": {
    bottom: INSET,
    left: INSET,
    borderBottomWidth: LINE,
    borderLeftWidth: LINE,
  },
  "bottom-right": {
    bottom: INSET,
    right: INSET,
    borderBottomWidth: LINE,
    borderRightWidth: LINE,
  },
};

interface CornerFrameProps extends Omit<ComponentProps<"div">, "color"> {
  /** Which corners get a bracket: "all", or a list of them. */
  corners?: "all" | CornerFrameCorner[];
  /** Length of each arm of a bracket. Any CSS length. */
  size?: string;
  /** Line width of the brackets. Any CSS length. */
  thickness?: string;
  /**
   * Bracket colour: any CSS colour or theme variable. Sets
   * `--corner-frame-color`; without it the brackets use that variable when an
   * ancestor sets it, and `var(--primary)` otherwise.
   */
  color?: string;
  /** How far the brackets sit inside the edges. Negative values move them outside. */
  inset?: string;
  /** Render the single child element as the frame instead of a `<div>`. */
  asChild?: boolean;
}

/**
 * A box with bracket marks on its corners, like a viewfinder. The brackets
 * are decoration: they are hidden from screen readers and ignore the
 * pointer, so the content inside works as usual. It renders no motion and
 * needs no JavaScript.
 *
 * @example
 * <CornerFrame corners={["top-left", "bottom-right"]} size="16px" className="p-6">
 *   <p>Framed content</p>
 * </CornerFrame>
 */
function CornerFrame({
  corners = "all",
  size = "12px",
  thickness = "2px",
  color,
  inset = "0px",
  asChild = false,
  className,
  style,
  children,
  ...props
}: CornerFrameProps) {
  const Comp = asChild ? Slot : "div";
  const shown =
    corners === "all"
      ? CORNERS
      : CORNERS.filter((corner) => corners.includes(corner));

  return (
    <Comp
      data-slot="corner-frame"
      className={cn("relative", className)}
      style={
        {
          "--corner-frame-size": size,
          "--corner-frame-thickness": thickness,
          "--corner-frame-inset": inset,
          ...(color ? { "--corner-frame-color": color } : null),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <Slottable>{children}</Slottable>
      {shown.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          data-slot="corner-frame-corner"
          data-corner={corner}
          className="pointer-events-none absolute border-0 border-solid"
          style={{
            width: "var(--corner-frame-size)",
            height: "var(--corner-frame-size)",
            borderColor: "var(--corner-frame-color, var(--primary))",
            ...CORNER_STYLES[corner],
          }}
        />
      ))}
    </Comp>
  );
}

export default CornerFrame;
export { CornerFrame, type CornerFrameCorner, type CornerFrameProps };


demo.tsx
import { CornerFrame } from "@/components/ui/corner-frame";

export default function CornerFrameDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 rounded-lg border bg-background p-6 sm:grid-cols-3 md:p-10">
        <CornerFrame size="14px" className="flex flex-col gap-1 p-4">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Bearing
          </span>
          <span className="text-2xl font-semibold text-foreground">212°</span>
        </CornerFrame>
        <CornerFrame size="14px" className="flex flex-col gap-1 p-4">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Speed
          </span>
          <span className="text-2xl font-semibold text-foreground">8 kn</span>
        </CornerFrame>
        <CornerFrame size="14px" className="flex flex-col gap-1 p-4">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Depth
          </span>
          <span className="text-2xl font-semibold text-foreground">40 fm</span>
        </CornerFrame>
      </div>
    </div>
  );
}

```

Install NPM dependencies:
```bash
@radix-ui/react-slot
```
