import { useEffect, useMemo, useState } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import {
  fetchUserProfileByUsername,
  fetchYearHeatmapForUser,
  refreshAggregateForUser,
} from '../lib/backend'
import type {
  AuthSession,
  BackendHeatmapDay,
  BackendUser,
  ProfileDraft,
} from '../types/app'

type ProfilePageProps = {
  requestedUsername: string
  profileDraft: ProfileDraft
  authSession: AuthSession
  onRestart: () => void
}

export function ProfilePage({
  requestedUsername,
  profileDraft,
  authSession,
  onRestart,
}: ProfilePageProps) {
  const username =
    authSession.publicSlug ||
    authSession.backendUsername ||
    requestedUsername ||
    profileDraft.username

  const [profileUser, setProfileUser] = useState<BackendUser | null>(null)
  const [heatmapDays, setHeatmapDays] = useState<BackendHeatmapDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const githubHandle = profileUser?.githubHandle || authSession.githubHandle

  return (
    <main className="page-shell min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[40px] border border-white/10 bg-white px-6 py-8 text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:px-10 md:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
                /@{headingUsername}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-black md:text-6xl">
                GitHub activity from January to December {yearRange.label}.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-black/60">
                A year-wide contribution view powered by your backend heatmap API.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                {githubHandle || 'GitHub linked'}
              </span>
              <span className="rounded-full bg-[#f4ede6] px-4 py-2 text-sm font-semibold text-[#8e4b10]">
                Pastel orange scale
              </span>
            </div>
          </div>

          <div className="heatmap-shell mt-10 overflow-x-auto rounded-[32px] bg-[#fff8f2] px-4 py-6 md:px-6">
            {isLoading ? (
              <div className="flex h-[220px] min-w-[760px] items-center justify-center rounded-[24px] border border-[#f0dcc9] bg-white text-sm text-black/55">
                Loading yearly activity...
              </div>
            ) : error ? (
              <div className="flex h-[220px] min-w-[760px] items-center justify-center rounded-[24px] border border-[#f0dcc9] bg-white px-6 text-center text-sm leading-6 text-black/55">
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
                  titleForValue={(value) => {
                    if (!value?.date) {
                      return 'No GitHub activity'
                    }

                    const commitCount = value.count || 0
                    return `${value.date}: ${commitCount} GitHub commit${commitCount === 1 ? '' : 's'}`
                  }}
                  values={heatmapValues}
                  weekdayLabels={['Sun', '', 'Tue', '', 'Thu', '', 'Sat']}
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[40px] border border-white/10 bg-white px-8 py-14 text-center text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
            Profile
          </p>
          <h2 className="mt-6 text-5xl font-bold tracking-[-0.06em] text-black md:text-7xl">
            Hello WOorld
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-black/60">
            Your route is now backed by backend user identity and yearly activity data.
          </p>
          <button
            className="mt-10 inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
            onClick={onRestart}
            type="button"
          >
            Edit profile
          </button>
        </section>
      </div>
    </main>
  )
}
