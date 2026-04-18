import { PlatformActivitySection } from './PlatformActivitySection'
import type { BackendActivity } from '../../types/app'

type ActivityDetailsSectionProps = {
  activities: BackendActivity[]
  error: string | null
  isLoading: boolean
  onSelectedDateChange: (date: string) => void
  selectedDate: string | null
}

export function ActivityDetailsSection({
  activities,
  error,
  isLoading,
  onSelectedDateChange,
  selectedDate,
}: ActivityDetailsSectionProps) {
  const githubActivities = activities.filter((a) => a.platform === 'github')
  const codeforcesActivities = activities.filter((a) => a.platform === 'codeforces')
  const leetcodeActivities = activities.filter((a) => a.platform === 'leetcode')

  const totalCount = activities.length
  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <section>
      {/* Section header */}
      <div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        style={{ marginBottom: 16 }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#fff',
              }}
            >
              Day details
            </h2>
            {formattedDate && (
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.32)',
                  padding: '2px 8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {formattedDate}
              </span>
            )}
            {totalCount > 0 && (
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  padding: '2px 8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          {!selectedDate && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Click a square in the heatmap or pick a date below.
            </p>
          )}
        </div>

        {/* Date picker */}
        <input
          className="dt-input"
          style={{ width: 'auto', minWidth: 148, maxWidth: 180 }}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => { if (e.target.value) onSelectedDateChange(e.target.value) }}
          type="date"
          value={selectedDate || ''}
        />
      </div>

      {/* Status states */}
      {!selectedDate && (
        <div
          style={{
            padding: '20px 18px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            Select a day from the heatmap to inspect its activity.
          </p>
        </div>
      )}

      {selectedDate && isLoading && (
        <div
          style={{
            padding: '20px 18px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <div className="flex items-center gap-3">
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading activity…</p>
          </div>
        </div>
      )}

      {selectedDate && !isLoading && error && (
        <div
          style={{
            padding: '14px 18px',
            border: '1px solid rgba(255,80,80,0.15)',
            borderRadius: 10,
            background: 'rgba(255,80,80,0.04)',
            marginBottom: 10,
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,150,150,0.8)' }}>{error}</p>
        </div>
      )}

      {selectedDate && !isLoading && !error && activities.length === 0 && (
        <div
          style={{
            padding: '20px 18px',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            No activity recorded for this date.
          </p>
        </div>
      )}

      {/* Platform sections */}
      {selectedDate && !isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PlatformActivitySection
            activities={githubActivities}
            description="Repository push events, commit totals, and commit messages captured from GitHub."
            platform="github"
            title="GitHub"
          />
          <PlatformActivitySection
            activities={leetcodeActivities}
            description="Accepted problem submissions with difficulty and status from LeetCode."
            platform="leetcode"
            title="LeetCode"
          />
          <PlatformActivitySection
            activities={codeforcesActivities}
            description="Problem verdicts, rating context, and topic tags from Codeforces."
            platform="codeforces"
            title="Codeforces"
          />
        </div>
      )}
    </section>
  )
}
