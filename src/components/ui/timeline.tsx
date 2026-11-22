// Timeline by Aceternity UI (manuarora700): https://21st.dev/@aceternity/components/timeline (MIT)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data,
  title = "Changelog from my journey",
  description = "I've been working on Aceternity for the past 2 years. Here's a timeline of my journey.",
}: {
  data: TimelineEntry[];
  /** Added for content: the heading above the timeline (defaults to the prompt's copy). */
  title?: React.ReactNode;
  /** Added for content: the line under the heading (defaults to the prompt's copy). */
  description?: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full font-sans md:px-10"
      ref={containerRef}
    >
      {/* below 640 the header and entries pad less, so the tasks get 216px at 320 (Timeline README, v2) */}
      <div className="max-w-7xl mx-auto px-0 py-8 sm:px-4 sm:py-20 md:px-8 lg:px-10">
        <h2 className="font-mono text-2xl font-semibold tracking-[-0.01em] mb-4 text-foreground max-w-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base tabular-nums max-w-sm">
          {description}
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-background flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-muted border border-input p-2" />
              </div>
              <h3 className="hidden md:block md:pl-20 font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-muted-foreground ">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-14 sm:pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block mb-4 text-left font-mono text-[clamp(28px,5vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em] text-muted-foreground">
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-linear-to-b from-transparent from-[0%] via-input to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-muted-foreground rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
