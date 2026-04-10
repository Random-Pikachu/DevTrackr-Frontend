import { useEffect, useMemo, useState } from 'react'
import { LogOut, Settings } from 'lucide-react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { ActivityDetailsSection } from '../components/profile/ActivityDetailsSection'
import { SettingsDialog } from '../components/profile/SettingsDialog'
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

export function ProfilePage({
  onLogout,
  onDraftChange,
  onNavigate,
  requestedUsername,
  profileDraft,
  authSession,
}: ProfilePageProps) {
  const username =
    authSession.publicSlug ||
    authSession.backendUsername ||
    requestedUsername ||
    profileDraft.username

  const [profileUser, setProfileUser] = useState<BackendUser | null>(null)
  const [heatmapDays, setHeatmapDays] = useState<BackendHeatmapDay[]>([])
  const [hoveredDay, setHoveredDay] = useState<{
    date: string
    total: number
    x: number
    y: number
  } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<BackendActivity[]>([])
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return {
      start: `${currentYear}-01-01`,
      end: `${currentYear}-12-31`,
      label: currentYear,
    }
  }, [])

  useEffect(() => {
    if (!requestedUsername) {
      setIsLoading(false)
      return
    }

    let isActive = true

    setIsLoading(true)
    setError(null)

    void fetchUserProfileByUsername(requestedUsername)
      .then(async (user) => {
        if (!isActive) {
          return
        }

        if (!user) {
          throw new Error('User not found for this route.')
        }

        setProfileUser(user)

        await refreshAggregateForUser(user.id)

        const heatmap = await fetchYearHeatmapForUser(
          user.id,
          yearRange.start,
          yearRange.end,
        )

        if (!isActive) {
          return
        }

        setHeatmapDays(heatmap?.days || [])
      })
      .catch((caughtError) => {
        if (!isActive) {
          return
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load this profile.'
        setError(message)
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [requestedUsername, yearRange.end, yearRange.start])

  useEffect(() => {
    if (isLoading || !profileUser?.id || selectedDate) {
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    void loadActivitiesForDate(profileUser.id, today)
  }, [isLoading, profileUser?.id, selectedDate])

  const heatmapValues = useMemo(
    () =>
      heatmapDays.map((day) => ({
        date: day.date,
        count: day.github_commits,
        total: day.total_contributions,
      })),
    [heatmapDays],
  )

  const headingUsername =
    profileUser?.publicSlug ||
    profileUser?.username ||
    username ||
    requestedUsername

  const loadActivitiesForDate = async (userId: string, date: string) => {
    setSelectedDate(date)
    setIsActivitiesLoading(true)
    setActivitiesError(null)

    try {
      const activities = await fetchUserActivitiesForDate(userId, date)
      setSelectedActivities(activities)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load activities for this day.'
      setActivitiesError(message)
      setSelectedActivities([])
    } finally {
      setIsActivitiesLoading(false)
    }
  }

  const refreshProfileState = async (nextUsername?: string) => {
    const routeUsername = nextUsername || requestedUsername
    const user = await fetchUserProfileByUsername(routeUsername)

    if (!user) {
      throw new Error('User not found for this route.')
    }

    setProfileUser(user)
    await refreshAggregateForUser(user.id)

    const heatmap = await fetchYearHeatmapForUser(
      user.id,
      yearRange.start,
      yearRange.end,
    )

    setHeatmapDays(heatmap?.days || [])

    if (selectedDate) {
      await loadActivitiesForDate(user.id, selectedDate)
    }

    if (nextUsername && nextUsername !== requestedUsername) {
      onNavigate(`/@${encodeURIComponent(nextUsername)}`, { replace: true })
    }
  }

  return (
    <main className="page-shell min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-12">
        <header className="sticky top-0 z-40 -mt-10 bg-black/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-end py-4">
            <div className="flex items-center gap-2">
              <button
                aria-label="Open settings"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsSettingsOpen(true)
                }}
                type="button"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                onClick={onLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="stage-card">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              /@{headingUsername}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl">
              One annual contribution map for GitHub, LeetCode, and Codeforces in {yearRange.label}.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
              Refreshed from your latest aggregated backend metrics so each square reflects the full DevTrackr activity mix.
            </p>
          </div>

          <div className="heatmap-shell relative mt-12 overflow-x-auto rounded-[18px] border border-white/10 bg-[#050505] px-6 py-8 md:px-8">
            {isLoading ? (
              <div className="flex h-[220px] min-w-[760px] items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.01] text-sm text-white/55">
                Loading yearly activity...
              </div>
            ) : error ? (
              <div className="flex h-[220px] min-w-[760px] items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.01] px-6 text-center text-sm leading-6 text-white/55">
                {error}
              </div>
            ) : (
              <div className="min-w-[760px]">
                <CalendarHeatmap
                  classForValue={(value) => {
                    if (!value || !value.count) {
                      return 'heat-empty'
                    }

                    if (value.count >= 7) {
                      return 'heat-level-4'
                    }

                    if (value.count >= 4) {
                      return 'heat-level-3'
                    }

                    if (value.count >= 2) {
                      return 'heat-level-2'
                    }

                    return 'heat-level-1'
                  }}
                  endDate={yearRange.end}
                  gutterSize={5}
                  monthLabels={[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ]}
                  showWeekdayLabels
                  startDate={yearRange.start}
                  onMouseLeave={() => {
                    setHoveredDay(null)
                  }}
                  onMouseOver={(event, value) => {
                    if (!value?.date) {
                      setHoveredDay(null)
                      return
                    }

                    const rect = event.currentTarget.getBoundingClientRect()

                    setHoveredDay({
                      date: String(value.date),
                      total: Number(value.total || 0),
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    })
                  }}
                  onClick={(value) => {
                    if (!value?.date || !profileUser?.id) {
                      return
                    }

                    void loadActivitiesForDate(profileUser.id, String(value.date))
                  }}
                  values={heatmapValues}
                  weekdayLabels={['Sun', '', 'Tue', '', 'Thu', '', 'Sat']}
                />
              </div>
            )}

            {hoveredDay ? (
              <div
                className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
                style={{
                  left: hoveredDay.x,
                  top: hoveredDay.y,
                }}
              >
                {hoveredDay.date}: {hoveredDay.total} Total Contribution
                {hoveredDay.total === 1 ? '' : 's'}
              </div>
            ) : null}
          </div>
        </section>

        <ActivityDetailsSection
          activities={selectedActivities}
          error={activitiesError}
          isLoading={isActivitiesLoading}
          selectedDate={selectedDate}
          onSelectedDateChange={(date) => {
            if (!profileUser?.id) {
              setSelectedDate(date)
              return
            }

            void loadActivitiesForDate(profileUser.id, date)
          }}
        />

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/35">
          Last refreshed: {new Date().toLocaleString()}
        </div>
      </div>

      {profileUser ? (
        <SettingsDialog
          authSession={authSession}
          initialProfileDraft={profileDraft}
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false)
          }}
          onDraftChange={onDraftChange}
          onNavigateToAuthenticate={() => {
            setIsSettingsOpen(false)
            onNavigate('/authenticate')
          }}
          onProfileUpdated={refreshProfileState}
          profileUser={profileUser}
        />
      ) : null}
    </main>
  )
}
