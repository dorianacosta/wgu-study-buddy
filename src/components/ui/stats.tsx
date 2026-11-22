// Stats (stats-info) by meschacirung: https://21st.dev/@meschacirung/components/stats/stats-info (license not listed; permission pending)
// Modified by Dorian Acosta for WGU Study Buddy (MIT)
import { Card } from '@/components/ui/card'
import { CornerFrame } from '@/components/ui/corner-frame'

export type Stat = {
  value: string
  label: string
}

const STATS: Stat[] = [
  { value: '+1200', label: 'Stars on GitHub' },
  { value: '56%', label: 'Conversion rate' },
  { value: '+500', label: 'Powered Apps' },
]

export default function StatsSection({
  stats = STATS,
  label = 'Key product stats',
}: {
  /** Added for content: the figures to show (defaults to the prompt's three). */
  stats?: Stat[]
  /** Added for content: what screen readers call the list (defaults to the prompt's label). */
  label?: string
}) {
  return (
    // The list is the grid: 2 columns, 4 from lg. Each figure is its own window (a readout, two brackets).
    // Below 400px (max-[400px]: is width < 400px) a tile pads p-4 and its value clamps, so it fits a 136px tile at 320.
    <div role="list" aria-label={label} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s, i) => (
        <CornerFrame key={i} asChild corners={["top-left", "bottom-right"]} size="16px" thickness="2px" inset="8px">
          <Card role="listitem" className="p-6 max-[400px]:p-4">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-mono text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-foreground whitespace-nowrap max-[400px]:text-[clamp(32px,10vw,40px)]">
              {s.value}
            </p>
          </Card>
        </CornerFrame>
      ))}
    </div>
  )
}
