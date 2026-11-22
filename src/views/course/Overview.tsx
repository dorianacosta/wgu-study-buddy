/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** A guide's Learn, Overview tab: the summary, the assessment, the competencies, the caveats (How to pass is on the Cheat Sheet). */
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bullets, Heading, LEAD, TABS, type Guide } from "@/views/course/shared"
import { SafeRich } from "@/components/kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function Overview({ guide, fallbackTitle }: { guide: Guide; fallbackTitle: string }) {
  const a = guide.assessment
  return (
    <>
      <Heading title={TABS.overview.title} />
      <div className="grid grid-cols-1 gap-4">
        {guide.summary && (
          <BlurFade inView>
            <SafeRich html={guide.summary} className={cn(LEAD, "mb-4 whitespace-pre-line break-words")} />
          </BlurFade>
        )}
        {(a || guide.competencies.length > 0) && (
          // "How to pass" moved to the Cheat Sheet: from 1024px the assessment window and Competencies sit side by side
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {a && (
              <BlurFade inView className={cn(guide.competencies.length === 0 && "lg:col-span-2")}>
                <Card>
                  <CardHeader>
                    <CardTitle className="break-words">
                      {/* a window title stays mono: font-mono beats .rich's sans */}
                      <SafeRich as="span" html={a.type || fallbackTitle} className="font-mono" />
                    </CardTitle>
                    {a.format && (
                      <CardDescription className="break-words">
                        <SafeRich as="span" html={a.format} />
                      </CardDescription>
                    )}
                  </CardHeader>
                  {a.details.length > 0 && (
                    <CardContent>
                      <Bullets items={a.details} />
                    </CardContent>
                  )}
                </Card>
              </BlurFade>
            )}
            {guide.competencies.length > 0 && (
              <BlurFade inView delay={0.05} className={cn(!a && "lg:col-span-2")}>
                <Card>
                  <CardHeader>
                    <CardTitle>Competencies</CardTitle>
                    <CardDescription>Quoted from WGU's public program documents; see Sources.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className={cn("grid list-decimal gap-x-8 gap-y-2 pl-5 md:grid-cols-2", a && "lg:grid-cols-1")}>
                      {guide.competencies.map((c, i) => (
                        <li key={i}>
                          <SafeRich html={c} className="break-words" />
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </BlurFade>
            )}
          </div>
        )}
        {guide.caveats.length > 0 && (
          <BlurFade inView>
            {/* static content: role="note" instead of the component's live role="alert" */}
            <Alert role="note">
              <Info className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>
                <Bullets items={guide.caveats} />
              </AlertDescription>
            </Alert>
          </BlurFade>
        )}
      </div>
    </>
  )
}

export { Overview }
