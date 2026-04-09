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
  const githubActivities = activities.filter(
    (activity) => activity.platform === 'github',
  )
  const codeforcesActivities = activities.filter(
    (activity) => activity.platform === 'codeforces',
  )
  const leetcodeActivities = activities.filter(
    (activity) => activity.platform === 'leetcode',
  )

  return (
    <section className="stage-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-white md:text-4xl">
            Day details
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            {selectedDate
              ? `Activity for ${selectedDate}`
              : 'Select a day from the heatmap'}
          </p>
        </div>
        <input
          className="w-full rounded-md border border-white/15 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 md:w-[156px]"
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => {
            if (!event.target.value) {
              return
            }

            onSelectedDateChange(event.target.value)
          }}
          type="date"
          value={selectedDate || ''}
        />
      </div>

      <div className="mt-8 space-y-3">
        {!selectedDate ? (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.01] px-5 py-6 text-sm leading-7 text-white/50">
            Choose a square in the heatmap to load that day&apos;s activities.
          </div>
        ) : isLoading ? (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.01] px-5 py-6 text-sm leading-7 text-white/50">
            Loading activity entries...
          </div>
        ) : error ? (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.01] px-5 py-6 text-sm leading-7 text-white/50">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.01] px-5 py-6 text-sm leading-7 text-white/50">
            No activity entries were returned for this day.
          </div>
        ) : null}

        <PlatformActivitySection
          activities={githubActivities}
          description="Repository push activity, commit totals, and commit messages for the selected day."
          platform="github"
          title="GitHub"
        />
        <PlatformActivitySection
          activities={codeforcesActivities}
          description="Problem submissions, verdicts, rating context, and tags captured from Codeforces."
          platform="codeforces"
          title="Codeforces"
        />
        <PlatformActivitySection
          activities={leetcodeActivities}
          description="Problem progress, status, difficulty, and title information from LeetCode."
          platform="leetcode"
          title="LeetCode"
        />
      </div>
    </section>
  )
}
