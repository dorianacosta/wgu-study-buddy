/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/**
 * A guide's Learn, Topics tab: one fold per topic (the like-you're-5 version, the detail, the points), then the way on
 * to Practice.
 */
import { ClipboardCheck, Lightbulb } from "lucide-react"
import { hrefFor, onPlainClick, type Navigate } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { Bullets, GuideRich, Heading, PROSE, TABS, pad, plain, type Topic } from "@/views/course/shared"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

/** Each topic folds open to the like-you're-5 version, then the detail and the points. */
function Topics({
  topics,
  slug,
  hasPractice,
  navigate,
}: {
  topics: Topic[]
  slug: string
  /** the end points at Practice only when the guide has questions there */
  hasPractice: boolean
  navigate: Navigate
}) {
  const practice = hrefFor("exam", slug)
  return (
    <>
      <Heading title={TABS.topics.title} aside={topics.length === 1 ? "1 topic" : `${topics.length} topics`} />
      <BlurFade inView>
        <Accordion type="multiple" className="w-full">
          {topics.map((t, i) => (
            <AccordionItem key={i} value={`topic-${i}`}>
              <AccordionTrigger>
                <span className="flex min-w-0 items-baseline gap-2 text-left">
                  <span className="text-sm font-normal text-muted-foreground" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="min-w-0 break-words">{plain(t.title) || `Topic ${i + 1}`}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className={cn("grid grid-cols-1 gap-4", PROSE)}>
                {t.eli5 && (
                  <Alert role="note">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    {/* AccordionContent is sans, so the mono `subheading` title carries font-mono itself */}
                    <AlertTitle className="font-mono">Like you're 5</AlertTitle>
                    <AlertDescription>
                      <GuideRich html={t.eli5} className="whitespace-pre-line break-words" />
                    </AlertDescription>
                  </Alert>
                )}
                {t.detail && <GuideRich html={t.detail} className="whitespace-pre-line break-words" />}
                <Bullets items={t.points} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </BlurFade>

      {/* decision 21: the Topics panel ends with the way on to Practice (secondary: Learn has no gold fill) */}
      {hasPractice && (
        <>
          <Separator className="mt-8" />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="font-sans text-sm text-muted-foreground">Done with the topics? Quiz yourself while it's fresh.</p>
            <Button variant="secondary" asChild>
              <a href={practice} data-focus-key="learn:start-practice" onClick={onPlainClick(() => navigate(practice))}>
                <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Start practice
              </a>
            </Button>
          </div>
        </>
      )}
    </>
  )
}

export { Topics }
