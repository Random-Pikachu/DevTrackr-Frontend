import { useMemo, useState } from 'react'
import {
  getActivitiesForDate,
  getPreviewHeatmapRows,
  PREVIEW_USERNAME,
  YEAR_STATS,
  type ActivityEntry,
} from '../../data/dummyData'

// ─── Mini heatmap cell ────────────────────────────────────────────────────────
const HEAT_COLORS = ['#151515', '#1b3328', '#1a5c3a', '#239554', '#2fcb6e']

function heatColor(n: number) {
  if (n === 0) return HEAT_COLORS[0]
  if (n >= 8) return HEAT_COLORS[4]
  if (n >= 5) return HEAT_COLORS[3]
  if (n >= 2) return HEAT_COLORS[2]
  return HEAT_COLORS[1]
}

// ─── Tiny activity entry row ──────────────────────────────────────────────────
function TinyEntry({ entry }: { entry: ActivityEntry }) {
  if (entry.platform === 'github') {
    return (
      <div style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em' }}>
          {entry.repo.split('/')[1]}
        </p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: 1 }}>
          {entry.commits} commit{entry.commits !== 1 ? 's' : ''}
          {entry.messages[0] ? ` · ${entry.messages[0]}` : ''}
        </p>
      </div>
    )
  }
  if (entry.platform === 'leetcode') {
    const dc: Record<string, string> = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#f87171' }
    return (
      <div style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.title}
        </p>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: dc[entry.difficulty], flexShrink: 0 }}>{entry.difficulty}</span>
      </div>
    )
  }
  // codeforces
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.problem}
      </p>
      <span style={{
        fontSize: 9, fontFamily: 'monospace',
        color: entry.verdict === 'OK' ? '#34d399' : '#f87171',
        flexShrink: 0,
      }}>
        {entry.verdict === 'OK' ? 'AC' : 'WA'}
      </span>
    </div>
  )
}

// ─── Main ProfilePreview ──────────────────────────────────────────────────────
export function ProfilePreview() {
  const rows = useMemo(() => getPreviewHeatmapRows(), [])
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('2025-04-14')
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const activities = useMemo(() => getActivitiesForDate(selectedDate), [selectedDate])

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      style={{
        width: '100%',
        background: '#0c0c0c',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 12,
        color: '#fff',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        {/* User heading */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: 2 }}>
            @{PREVIEW_USERNAME}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            2025 contributions
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { v: YEAR_STATS.activeDays, l: 'active days' },
            { v: YEAR_STATS.totalGH, l: 'commits' },
            { v: YEAR_STATS.totalLC, l: 'lc solved' },
            { v: YEAR_STATS.totalCF, l: 'cf solved' },
          ].map(s => (
            <div key={s.l} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 7,
              padding: '7px 9px',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', fontFamily: 'monospace' }}>
                {s.v > 999 ? `${(s.v / 1000).toFixed(1)}k` : s.v}
              </p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 9,
          padding: '10px 12px 8px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              Contribution heatmap
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {HEAT_COLORS.map(c => (
                <span key={c} style={{ width: 7, height: 7, borderRadius: 1.5, background: c, display: 'inline-block' }} />
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {row.map((cell) => (
                  <div
                    key={cell.date}
                    onMouseEnter={(e) => {
                      setHoveredDate(cell.date)
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        text: `${cell.date} — ${cell.total} contribution${cell.total !== 1 ? 's' : ''}`,
                      })
                    }}
                    onMouseLeave={() => { setHoveredDate(null); setTooltip(null) }}
                    onClick={() => {
                      if (cell.total > 0) setSelectedDate(cell.date)
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: hoveredDate === cell.date
                        ? 'rgba(255,255,255,0.6)'
                        : heatColor(cell.total),
                      cursor: cell.total > 0 ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                      outline: selectedDate === cell.date ? '1px solid rgba(255,255,255,0.5)' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Day detail */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 9,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.8)' }}>
              Day details
            </span>
            <span style={{
              fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)',
              padding: '2px 6px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
            }}>
              {formatDate(selectedDate)}
            </span>
          </div>

          {activities.length === 0 ? (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', padding: '4px 0' }}>No activity recorded.</p>
          ) : (
            activities.slice(0, 4).map((entry, i) => <TinyEntry key={i} entry={entry} />)
          )}
        </div>
      </div>

      {/* Tooltip portal (fixed-position, outside clip) */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
