// Bento Grid by Magic UI (dillionverma): https://21st.dev/@magicui/components/bento-grid (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
import { useRef } from "react";
import type { MouseEvent as ReactMouseEvent, MouseEventHandler, ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CornerFrame } from "@/components/ui/corner-frame";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  onClick,
  focusKey,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
  /** Added for routing: runs when the call-to-action link is clicked. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Added for Home's focus keys: written as `data-focus-key` on the link, so Back returns focus to it. */
  focusKey?: string;
}) => {
  // Added for touch: the card's one link, so a click or tap anywhere else on the card can be passed on to it.
  const linkRef = useRef<HTMLAnchorElement>(null);
  const onCardClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const link = linkRef.current;
    const target = e.target as Element;
    const control = target.closest("a, button, input, select, textarea, label");
    if (!link || e.defaultPrevented || (control && e.currentTarget.contains(control))) return;
    // same modifier keys as the original click, so the link's own handler and the browser treat it like a click on the link
    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      }),
    );
  };

  return (
    <CornerFrame
      asChild
      size="16px"
      thickness="2px"
      inset="8px"
      className="hover:[--corner-frame-color:var(--primary)] has-[:focus-visible]:[--corner-frame-color:var(--primary)]"
    >
      <div
        key={name}
        onClick={onCardClick}
        className={cn(
          "group relative col-span-3 flex cursor-pointer flex-col justify-between overflow-hidden rounded-lg border bg-card",
          className,
        )}
      >
        <div>{background}</div>
        {/* [@media(hover:none)]: touch screens can't hover (Tailwind 4 applies group-hover only where hover works),
            so there the hover layout is the resting layout and the call to action stays visible */}
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10 group-focus-within:-translate-y-10 [@media(hover:none)]:-translate-y-10">
          <Icon className="h-12 w-12 origin-left transform-gpu text-muted-foreground transition-all duration-300 ease-in-out group-hover:scale-75 group-focus-within:scale-75 [@media(hover:none)]:scale-75" />
          <h3 className="text-base font-semibold text-foreground">
            {name}
          </h3>
          <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          )}
        >
          <Button variant="ghost" asChild size="sm" className="pointer-events-auto">
            <a ref={linkRef} href={href} onClick={onClick} data-focus-key={focusKey}>
              {cta}
              {/* added: names the card, so a list of links doesn't read "Learn" eight times */}
              <span className="sr-only"> {name}</span>
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </CornerFrame>
  );
};

export { BentoCard, BentoGrid };
