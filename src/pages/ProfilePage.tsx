import { useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, Settings } from 'lucide-react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { ActivityDetailsSection } from '../components/profile/ActivityDetailsSection'
import { SettingsDialog } from '../components/profile/SettingsDialog'
import logoMark from '../assets/devtrackr-mark.svg'
import {
  fetchUserProfileByUsername,
  refreshAggregateForUser,
} from '../lib/backend'
import {
  HEATMAP_DATA,
  YEAR_STATS,
  getActivitiesForDate,
  type ActivityEntry,
} from '../data/dummyData'
import type {
  AuthSession,
  BackendActivity,
  BackendUser,
  ProfileDraft,
} from '../types/app'

type ProfilePageProps = {
  onLogout: () => void
  onDraftChange: (draft: ProfileDraft) => void
  onNavigate: (path: string, options?: { replace?: boolean }) => void
  requestedUsername: string
  profileDraft: ProfileDraft
  authSession: AuthSession
}

function dummyToBackendActivity(entry: ActivityEntry, date: string): BackendActivity {
  if (entry.platform === 'github') {
    return {
      id: `gh-${date}-${entry.repo}`,
      user_id: 'dummy', integration_id: 'gh', platform: 'github',
      activity_date: date, activity_type: 'push',
      fetched_at: new Date().toISOString(),
      metadata: { repo: entry.repo, commit_count: entry.commits, messages: entry.messages },
    }
  }
  if (entry.platform === 'leetcode') {
    return {
      id: `lc-${date}-${entry.titleSlug}`,
      user_id: 'dummy', integration_id: 'lc', platform: 'leetcode',
      activity_date: date, activity_type: 'accepted',
      fetched_at: new Date().toISOString(),
      metadata: { problem_name: entry.title, title: entry.title, title_slug: entry.titleSlug, difficulty: entry.difficulty, status: entry.status },
    }
  }
  return {
    id: `cf-${date}-${entry.problem}`,
    user_id: 'dummy', integration_id: 'cf', platform: 'codeforces',
    activity_date: date, activity_type: entry.verdict,
    fetched_at: new Date().toISOString(),
    metadata: { problem_name: entry.problem, verdict: entry.verdict, rating: entry.rating, tags: entry.tags },
  }
}

function heatClass(count: number) {
  if (!count) return 'heat-empty'
  if (count >= 8) return 'heat-level-4'
  if (count >= 5) return 'heat-level-3'
  if (count >= 2) return 'heat-level-2'
  return 'heat-level-1'
}

const DEFAULT_DATE = '2025-04-14'

export function ProfilePage({
  onLogout,
  onDraftChange,
  onNavigate,
  requestedUsername,
  profileDraft,
  authSession,
}: ProfilePageProps) {
  const pad2 = (v: number) => String(v).padStart(2, '0')
  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

  const normalizedRequestedUsername = requestedUsername.trim().toLowerCase()

  const [profileUser, setProfileUser] = useState<BackendUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string>(DEFAULT_DATE)
  const [activities, setActivities] = useState<BackendActivity[]>(() =>
    getActivitiesForDate(DEFAULT_DATE).map((e) => dummyToBackendActivity(e, DEFAULT_DATE))
  )
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; total: number } | null>(null)
  const activityRef = useRef<HTMLDivElement>(null)

  const sessionRouteUsernames = [authSession.publicSlug, authSession.backendUsername, profileDraft.username]
    .map((v) => v?.trim().toLowerCase()).filter((v): v is string => Boolean(v))
  const canManageByRoute = authSession.status === 'connected' && Boolean(normalizedRequestedUsername) && sessionRouteUsernames.includes(normalizedRequestedUsername)
  const canManageByUserId = authSession.status === 'connected' && Boolean(authSession.backendUserId) && authSession.backendUserId === profileUser?.id
  const canManageProfile = canManageByRoute || canManageByUserId

  const normalizedError = error?.toLowerCase() || ''
  const isUserNotFound = !isLoading && !profileUser && (normalizedError.includes('not found') || normalizedError.includes('unable to fetch'))
  const isPrivateForViewer = Boolean(profileUser) && profileUser?.profilePublic !== true && !canManageProfile

  const yearRange = useMemo(() => ({
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 11, 31),
    label: 2025,
  }), [])

  useEffect(() => {
    if (!requestedUsername) { setIsLoading(false); return }
    let active = true
    setIsLoading(true); setError(null); setProfileUser(null)
    void fetchUserProfileByUsername(requestedUsername)
      .then(async (user) => {
        if (!active) return
        if (!user) throw new Error('User not found.')
        setProfileUser(user)
        if (canManageProfile || user.profilePublic) {
          await refreshAggregateForUser(user.id).catch(() => {})
        }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load profile.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [requestedUsername])

  const heatmapValues = useMemo(() => {
    const values: Array<{ date: Date; dateKey: string; count: number; total: number }> = []
    for (let cursor = new Date(yearRange.startDate); cursor <= yearRange.endDate; cursor.setDate(cursor.getDate() + 1)) {
      const localDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
      const dateKey = toDateKey(localDate)
      const total = HEATMAP_DATA.get(dateKey)?.total ?? 0
      values.push({ date: localDate, dateKey, count: total, total })
    }
    return values
  }, [yearRange])

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setActivities(getActivitiesForDate(date).map((e) => dummyToBackendActivity(e, date)))
    setTimeout(() => activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  const refreshProfileState = async (nextUsername?: string) => {
    const routeUsername = nextUsername || requestedUsername
    const user = await fetchUserProfileByUsername(routeUsername)
    if (!user) throw new Error('User not found.')
    setProfileUser(user)
    if (nextUsername && nextUsername !== requestedUsername) {
      onNavigate(`/@${encodeURIComponent(nextUsername)}`, { replace: true })
    }
  }

  const displayName = profileUser?.publicSlug || profileUser?.username || requestedUsername
  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.82)' }}>
        <div className="mx-auto flex items-center justify-between px-6" style={{ maxWidth: 900, height: 52 }}>
          <a href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md" style={{ width: 22, height: 22, background: '#fff' }}>
              <img src={logoMark} alt="" style={{ width: 12, height: 12 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.02em' }}>DevTrackr</span>
          </a>
          {canManageProfile && (
            <div className="flex items-center gap-2">
              <button aria-label="Settings" className="btn-ghost" style={{ width: 34, height: 34, padding: 0 }} onClick={() => setIsSettingsOpen(true)} type="button">
                <Settings size={14} />
              </button>
              <button className="btn-ghost" style={{ height: 34, fontSize: 12, gap: 6 }} onClick={onLogout} type="button">
                <LogOut size={13} />Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto px-6 py-12" style={{ maxWidth: 900 }}>
        {isUserNotFound && (
          <div className="animate-fade-up card" style={{ padding: '28px 24px', borderRadius: 12 }}>
            <span className="section-label">404</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginTop: 12 }}>Profile not found</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.6 }}>No profile at /@{requestedUsername}.</p>
          </div>
        )}
        {isPrivateForViewer && (
          <div className="animate-fade-up card" style={{ padding: '28px 24px', borderRadius: 12 }}>
            <span className="section-label">Private</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginTop: 12 }}>This profile is private</h2>
          </div>
        )}

        {!isUserNotFound && !isPrivateForViewer && (
          <>
            {/* Heading */}
            <div className="animate-fade-up mb-8">
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1 }}>
                @{displayName}
              </h1>
              <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
                {yearRange.label} · {YEAR_STATS.activeDays} active days
              </p>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" style={{ animationDelay: '50ms' }}>
              {[
                { label: 'Active days',    value: YEAR_STATS.activeDays },
                { label: 'GitHub commits', value: YEAR_STATS.totalGH },
                { label: 'LC solved',      value: YEAR_STATS.totalLC },
                { label: 'CF solved',      value: YEAR_STATS.totalCF },
              ].map((stat) => (
                <div key={stat.label} className="card" style={{ padding: '14px 16px', borderRadius: 10 }}>
                  <p className="mono" style={{ fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '-0.04em' }}>
                    {stat.value > 999 ? `${(stat.value / 1000).toFixed(1)}k` : stat.value}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="animate-fade-up card mb-5" style={{ borderRadius: 12, overflow: 'hidden', animationDelay: '90ms' }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="section-label">Contribution heatmap — {yearRange.label}</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>Less</span>
                  {['#111111','#1e3a2f','#1e6040','#26a05a','#3dd68c'].map(c => (
                    <span key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>More</span>
                </div>
              </div>

              <div className="heatmap-shell overflow-x-auto px-5 py-6">
                <div style={{ minWidth: 720 }}>
                  <CalendarHeatmap
                    classForValue={(value) => heatClass(value?.count ?? 0)}
                    endDate={yearRange.endDate}
                    gutterSize={3}
                    monthLabels={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
                    showWeekdayLabels
                    startDate={yearRange.startDate}
                    onMouseLeave={() => setTooltip(null)}
                    onMouseOver={(event, value) => {
                      if (!value?.date || typeof value.dateKey !== 'string') { setTooltip(null); return }
                      const rect = event.currentTarget.getBoundingClientRect()
                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, date: value.dateKey, total: Number(value.total ?? 0) })
                    }}
                    onClick={(value) => {
                      if (!value?.date || typeof value.dateKey !== 'string') return
                      handleDayClick(value.dateKey)
                    }}
                    values={heatmapValues}
                    weekdayLabels={['Sun','','Tue','','Thu','','Sat']}
                  />
                </div>
              </div>

              <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>GitHub + LeetCode + Codeforces</p>
                <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.16)' }}>hover to preview · click to inspect</p>
              </div>
            </div>

            {/* Activity section */}
            <div ref={activityRef} className="animate-fade-up card" style={{ padding: '22px', borderRadius: 12, animationDelay: '130ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>Day details</h2>
                  <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                    {formattedDate}
                  </span>
                  {activities.length > 0 && (
                    <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5 }}>
                      {activities.length} {activities.length === 1 ? 'entry' : 'entries'}
                    </span>
                  )}
                </div>
                <input
                  className="dt-input mono"
                  style={{ width: 148, fontSize: 11 }}
                  max="2025-12-31" min="2025-01-01"
                  onChange={(e) => { if (e.target.value) handleDayClick(e.target.value) }}
                  type="date"
                  value={selectedDate}
                />
              </div>

              {activities.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', padding: '8px 0' }}>No activity recorded for this date.</p>
              ) : (
                <ActivityDetailsSection
                  activities={activities}
                  error={null}
                  isLoading={false}
                  selectedDate={selectedDate}
                  onSelectedDateChange={handleDayClick}
                />
              )}
            </div>

            <p className="mono mt-4 text-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)' }}>
              Dummy dataset · refreshed {new Date().toLocaleString()}
            </p>
          </>
        )}
      </main>

      {/* Tooltip */}
      {tooltip && (
        <div className="pointer-events-none mono" style={{
          position: 'fixed', zIndex: 9999,
          left: tooltip.x, top: tooltip.y,
          transform: 'translate(-50%, calc(-100% - 10px))',
          background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 7, padding: '5px 10px',
          fontSize: 11, color: 'rgba(255,255,255,0.82)',
          whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          letterSpacing: '-0.01em',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.42)' }}>{tooltip.date}</span>
          {' — '}
          <strong style={{ fontWeight: 600 }}>{tooltip.total}</strong>
          {' '}contribution{tooltip.total !== 1 ? 's' : ''}
        </div>
      )}

      {profileUser && canManageProfile && (
        <SettingsDialog
          authSession={authSession}
          initialProfileDraft={profileDraft}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onDraftChange={onDraftChange}
          onNavigateToAuthenticate={() => { setIsSettingsOpen(false); onNavigate('/authenticate') }}
          onProfileUpdated={refreshProfileState}
          profileUser={profileUser}
        />
      )}
    </div>
  )
}
