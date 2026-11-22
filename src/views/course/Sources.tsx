/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** A guide's Learn, Sources tab: the numbered list of the sources the guide cites. */
import { cn } from "@/lib/utils"
import { Heading, LINK, NewTab, TABS, TAP_LINK, plain, type Guide } from "@/views/course/shared"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card, CardContent } from "@/components/ui/card"

function Sources({ items }: { items: Guide["sources"] }) {
  return (
    <>
      <Heading title={TABS.sources.title} aside={items.length === 1 ? "1 source" : `${items.length} sources`} />
      <BlurFade inView>
        <Card>
          <CardContent className="pt-6">
            {/* numbers in `data`, zero-padded to the total's width (two digits from ten sources on) */}
            <ol
              className={cn(
                "space-y-2 text-sm marker:text-muted-foreground",
                items.length >= 10 ? "list-[decimal-leading-zero] pl-8" : "list-decimal pl-5",
              )}
            >
              {items.map((s, i) => (
                <li key={i} className="break-words">
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={cn("font-medium", LINK, TAP_LINK)}>
                    {plain(s.label) || s.host}
                    <NewTab />
                  </a>
                  <span className="text-muted-foreground"> · {s.host}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </BlurFade>
    </>
  )
}

export { Sources }
