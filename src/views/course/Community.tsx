/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** A guide's Learn, Community tab: what students say (the consensus, then each post as a card linking to it). */
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Heading, LINK, NewTab, PROSE, TABS, TAP_LINK, plain, type Guide } from "@/views/course/shared"
import { SafeRich } from "@/components/kit"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** What students said: the consensus, then each post as a card whose title links to it. */
function Community({ data }: { data: Guide["community"] }) {
  if (!data) return null
  return (
    <>
      <Heading title={TABS.community.title} aside={data.coverage ? plain(data.coverage) : undefined} />
      {data.summary && (
        <BlurFade inView>
          <Card>
            <CardHeader>
              <CardTitle>The consensus</CardTitle>
            </CardHeader>
            <CardContent>
              <SafeRich html={data.summary} className={cn("whitespace-pre-line break-words", PROSE)} />
            </CardContent>
          </Card>
        </BlurFade>
      )}
      {data.posts.length > 0 && (
        <ul role="list" className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", data.summary && "mt-4")}>
          {data.posts.map((p, i) => (
            <li key={i}>
              <BlurFade inView delay={0.02 * (i % 6)} className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{p.subreddit || p.host}</Badge>
                      {p.date && <Badge variant="outline">{plain(p.date)}</Badge>}
                    </div>
                    {/* a post's title is a name in a window (`subheading`), and a guide link (prose link) */}
                    <CardTitle className="text-base break-words">
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className={cn(LINK, TAP_LINK)}>
                        {plain(p.title) || p.host}
                        <ExternalLink className="ml-2 inline h-4 w-4" aria-hidden="true" />
                        <NewTab />
                      </a>
                    </CardTitle>
                  </CardHeader>
                  {p.takeaway && (
                    <CardContent>
                      <SafeRich as="p" html={p.takeaway} className="text-sm break-words text-muted-foreground" />
                    </CardContent>
                  )}
                </Card>
              </BlurFade>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export { Community }
