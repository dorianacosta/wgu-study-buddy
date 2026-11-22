/* WGU Study Buddy · © 2026 Dorian Acosta · SPDX-License-Identifier: MIT */
/** A guide's Learn, Resources tab: the resources table, in kind order (official, community, video, practice, tools). */
import { ExternalLink } from "lucide-react"
import {
  Heading,
  LINK,
  NewTab,
  RESOURCE_GROUPS,
  TABS,
  TAP_LINK,
  plain,
  type Resource,
  type ResourceKind,
} from "@/views/course/shared"
import { cn } from "@/lib/utils"
import { SafeRich } from "@/components/kit"
import { Badge } from "@/components/ui/base-badge"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function Resources({ items }: { items: Resource[] }) {
  const order = (k: ResourceKind) => RESOURCE_GROUPS.findIndex((g) => g.kind === k)
  const rows = items
    .map((r, i) => ({ r, i }))
    .sort((x, y) => order(x.r.kind) - order(y.r.kind) || x.i - y.i)
    .map(({ r }) => r)
  return (
    <>
      <Heading title={TABS.resources.title} aside={items.length === 1 ? "1 resource" : `${items.length} resources`} />
      <BlurFade inView>
        {/* a table sits in a window, never on the field; overflow-hidden keeps row hovers inside the rounded edge */}
        <Card className="overflow-hidden">
          <Table>
            <TableCaption className="sr-only">{TABS.resources.title}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const group = RESOURCE_GROUPS.find((g) => g.kind === r.kind) ?? RESOURCE_GROUPS[RESOURCE_GROUPS.length - 1]
                const label = plain(r.label) || r.host || "Resource"
                return (
                  <TableRow key={i}>
                    {/* [overflow-wrap:anywhere] lets a long token break inside its cell (decision 22) */}
                    <TableCell className="font-medium [overflow-wrap:anywhere]">
                      {r.href ? (
                        <a href={r.href} target="_blank" rel="noopener noreferrer" className={cn(LINK, TAP_LINK)}>
                          {label}
                          <ExternalLink className="ml-2 inline h-4 w-4" aria-hidden="true" />
                          <NewTab />
                        </a>
                      ) : (
                        label
                      )}
                      {r.host && <span className="mt-1 block text-xs font-normal text-muted-foreground">{r.host}</span>}
                      {/* phones: the note goes under the link instead of its own column */}
                      {r.note && (
                        <SafeRich as="p" html={r.note} className="mt-2 font-normal text-muted-foreground md:hidden" />
                      )}
                    </TableCell>
                    {/* the Kind is one word: the column takes the badge's width and the badge never wraps */}
                    <TableCell className="w-px whitespace-nowrap">
                      <Badge variant="secondary">
                        <group.icon aria-hidden="true" />
                        {group.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground [overflow-wrap:anywhere] md:table-cell">
                      {r.note && <SafeRich as="span" html={r.note} />}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </BlurFade>
    </>
  )
}

export { Resources }
