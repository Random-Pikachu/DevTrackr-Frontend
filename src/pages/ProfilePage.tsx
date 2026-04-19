import { useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, Settings } from 'lucide-react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { ActivityDetailsSection } from '../components/profile/ActivityDetailsSection'
import { SettingsDialog } from '../components/profile/SettingsDialog'
import logoMark from '../assets/devtrackr-mark.svg'
import {
  fetchUserActivitiesForDate,
  fetchUserProfileByUsername,
  fetchYearHeatmapForUser,
  refreshAggregateForUser,
} from '../lib/backend'
import type {
  AuthSession,
  BackendActivity,
  BackendHeatmapDay,
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


function heatClass(count: number) {
  if (!count) return 'heat-empty'
  if (count >= 8) return 'heat-level-4'
  if (count >= 5) return 'heat-level-3'
  if (count >= 2) return 'heat-level-2'
  return 'heat-level-1'
}

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

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activities, setActivities] = useState<BackendActivity[]>([])
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [heatmapDays, setHeatmapDays] = useState<BackendHeatmapDay[]>([])
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

  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return {
      startKey: `${currentYear}-01-01`,
      endKey: `${currentYear}-12-31`,
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 11, 31),
      label: currentYear,
    }
  }, [])

  useEffect(() => {
    if (!requestedUsername) { setIsLoading(false); return }
    let active = true
    setIsLoading(true); setError(null); setProfileUser(null);
    setHeatmapDays([]); setActivities([]); setSelectedDate(null);
    void fetchUserProfileByUsername(requestedUsername)
      .then(async (user) => {
        if (!active) return
        if (!user) throw new Error('User not found.')
        setProfileUser(user)
        if (canManageProfile || user.profilePublic) {
          await refreshAggregateForUser(user.id).catch(() => { })
          const heatmap = await fetchYearHeatmapForUser(user.id, yearRange.startKey, yearRange.endKey)
          if (active) setHeatmapDays(heatmap?.days || [])
        }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load profile.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [requestedUsername, canManageProfile, yearRange.startKey, yearRange.endKey])

  const heatmapValues = useMemo(() => {
    const totalsByDate = new Map(heatmapDays.map((day) => [day.date, day.total_contributions ?? 0]))
    const values: Array<{ date: Date; dateKey: string; count: number; total: number }> = []
    for (let cursor = new Date(yearRange.startDate); cursor <= yearRange.endDate; cursor.setDate(cursor.getDate() + 1)) {
      const localDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
      const dateKey = toDateKey(localDate)
      const total = totalsByDate.get(dateKey) ?? 0
      values.push({ date: localDate, dateKey, count: total, total })
    }
    return values
  }, [heatmapDays, yearRange])

  const loadActivitiesForDate = async (userId: string, date: string) => {
    setSelectedDate(date)
    setIsActivitiesLoading(true)
    setActivitiesError(null)
    try {
      const resp = await fetchUserActivitiesForDate(userId, date)
      setActivities(resp as unknown as BackendActivity[])
    } catch (err) {
      setActivitiesError(err instanceof Error ? err.message : 'Unable to load activities for this date.')
      setActivities([])
    } finally {
      setIsActivitiesLoading(false)
    }
  }

  useEffect(() => {
    if (isLoading || isPrivateForViewer || !profileUser?.id || selectedDate) return
    const today = new Date().toISOString().slice(0, 10)
    void loadActivitiesForDate(profileUser.id, today)
  }, [isLoading, isPrivateForViewer, profileUser?.id, selectedDate])

  const handleDayClick = (date: string) => {
    if (!profileUser?.id) return
    void loadActivitiesForDate(profileUser.id, date)
    setTimeout(() => activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  const stats = useMemo(() => {
    let activeDays = 0, totalGH = 0, totalLC = 0, totalCF = 0
    for (const day of heatmapDays) {
      if ((day.total_contributions || 0) > 0) activeDays++
      totalGH += day.github_commits || 0
      totalLC += (day.lc_easy_solved || 0) + (day.lc_medium_solved || 0) + (day.lc_hard_solved || 0)
      totalCF += day.cf_problems_solved || 0
    }
    return { activeDays, totalGH, totalLC, totalCF }
  }, [heatmapDays])

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
  const formattedDate = !selectedDate ? '' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.82)' }}>
        <div className="mx-auto flex items-center justify-between px-6" style={{ maxWidth: 1040, height: 56 }}>
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

      <main className="mx-auto px-6 py-14" style={{ maxWidth: 1040 }}>
        {isUserNotFound && (
          <div className="animate-fade-up card" style={{ padding: '28px 24px', borderRadius: 12 }}>
            <span className="section-label" style={{ fontSize: 13 }}>404</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginTop: 12 }}>Profile not found</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.6 }}>No profile at /@{requestedUsername}.</p>
          </div>
        )}
        {isPrivateForViewer && (
          <div className="animate-fade-up card" style={{ padding: '28px 24px', borderRadius: 12 }}>
            <span className="section-label" style={{ fontSize: 13 }}>Private</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginTop: 12 }}>This profile is private</h2>
          </div>
        )}

        {!isUserNotFound && !isPrivateForViewer && (
          <>
            {/* Heading */}
            <div className="animate-fade-up mb-8">
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1 }}>
                @{displayName}
              </h1>
              <p className="mono" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {yearRange.label} · {stats.activeDays} active days
              </p>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" style={{ animationDelay: '50ms' }}>
              {[
                { label: 'Active days', value: stats.activeDays },
                { label: 'GitHub commits', value: stats.totalGH },
                { label: 'LC solved', value: stats.totalLC },
                { label: 'CF solved', value: stats.totalCF },
              ].map((stat) => (
                <div key={stat.label} className="card" style={{ padding: '16px 18px', borderRadius: 12 }}>
                  <p className="mono" style={{ fontSize: 26, fontWeight: 600, color: '#fff', letterSpacing: '-0.04em' }}>
                    {stat.value > 999 ? `${(stat.value / 1000).toFixed(1)}k` : stat.value}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 mb-3 text-xs text-white/45">
              * In heatmap, color intensity is based on GitHub commits and correct submissions on LeetCode & Codeforces.
            </p>

            {/* Heatmap */}
            <div className="animate-fade-up card mb-5" style={{ borderRadius: 14, overflow: 'hidden', animationDelay: '90ms' }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="section-label">Contribution heatmap — {yearRange.label}</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>Less</span>
                  {['#111111', '#1e3a2f', '#1e6040', '#26a05a', '#3dd68c'].map(c => (
                    <span key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>More</span>
                </div>
              </div>

              <div className="heatmap-shell overflow-x-auto px-6 py-8">
                <div style={{ minWidth: 840 }}>
                  <CalendarHeatmap
                    classForValue={(value) => heatClass(value?.count ?? 0)}
                    endDate={yearRange.endDate}
                    gutterSize={4}
                    monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                    showWeekdayLabels
                    startDate={new Date(yearRange.startDate.getTime() - 86400000)}
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
                    weekdayLabels={['Sun', '', 'Tue', '', 'Thu', '', 'Sat']}
                  />
                </div>
              </div>

              <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>GitHub + LeetCode + Codeforces</p>
                <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>hover to preview · click to inspect</p>
              </div>
            </div>

            <p className="mt-2 mb-8 text-right text-[11px] leading-5 text-white/40">
              (For some historical data, LeetCode&apos;s public API does not expose solved questions,
              so we use an alternate method to at least estimate submission count.)
            </p>

            {/* Activity section */}
            <div ref={activityRef} className="animate-fade-up card" style={{ padding: '28px', borderRadius: 14, animationDelay: '130ms' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>Day details</h2>
                  {formattedDate && (
                    <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                      {formattedDate}
                    </span>
                  )}
                </div>
                <input
                  className="dt-input mono"
                  style={{ width: 148, fontSize: 11 }}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => { if (e.target.value) handleDayClick(e.target.value) }}
                  type="date"
                  value={selectedDate || ''}
                />
              </div>

              {activities.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', padding: '8px 0' }}>No activity recorded for this date.</p>
              ) : (
                <ActivityDetailsSection
                  activities={activities}
                  error={activitiesError}
                  isLoading={isActivitiesLoading}
                  selectedDate={selectedDate}
                />
              )}
            </div>

            <p className="mono mt-4 text-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)' }}>
              Refreshed {new Date().toLocaleString()}
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
