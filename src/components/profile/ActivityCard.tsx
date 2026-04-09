import type { BackendActivity } from '../../types/app'

type ActivityCardProps = {
  activity: BackendActivity
}

function formatPlatform(platform: string) {
  if (!platform) {
    return 'Activity'
  }

  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

function formatType(activityType: string) {
  if (!activityType) {
    return 'Entry'
  }

  return activityType.replace(/_/g, ' ')
}

function buildGitHubRepoUrl(repo?: string) {
  if (!repo) {
    return null
  }

  return `https://github.com/${repo}`
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const metadata = activity.metadata || {}
  const platformLabel = formatPlatform(activity.platform)
  const typeLabel = formatType(activity.activity_type)

  if (activity.platform === 'github') {
    const messages = metadata.messages || []
    const repoUrl = buildGitHubRepoUrl(metadata.repo)

    return (
      <article className="rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            {platformLabel}
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/65">
            {typeLabel}
          </span>
        </div>

        {repoUrl ? (
          <a
            className="mt-4 inline-flex items-center gap-2 text-xl font-semibold text-black underline decoration-black/20 underline-offset-4 transition hover:decoration-black"
            href={repoUrl}
            rel="noreferrer"
            target="_blank"
          >
            {metadata.repo || 'Repository activity'}
          </a>
        ) : (
          <h3 className="mt-4 text-xl font-semibold text-black">
            {metadata.repo || 'Repository activity'}
          </h3>
        )}

        <p className="mt-3 text-sm leading-7 text-black/65">
          {metadata.commit_count || 0} commit
          {(metadata.commit_count || 0) === 1 ? '' : 's'} captured on this day.
        </p>

        {messages.length > 0 ? (
          <div className="mt-4 space-y-2">
            {messages.map((message) => (
              <div
                className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-black/72"
                key={message}
              >
                {message.trim()}
              </div>
            ))}
          </div>
        ) : null}
      </article>
    )
  }

  if (activity.platform === 'codeforces') {
    const tags = metadata.tags || []

    return (
      <article className="rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            {platformLabel}
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/65">
            {metadata.verdict || typeLabel}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-black">
          {metadata.problem_name || 'Problem submission'}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/70">
            Rating {metadata.rating || 0}
          </span>
          {tags.map((tag) => (
            <span
              className="rounded-full bg-[#fff1e2] px-3 py-1 text-xs font-semibold text-[#8e4b10]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    )
  }

  if (activity.platform === 'leetcode') {
    const tags = metadata.tags || []

    return (
      <article className="rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            {platformLabel}
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/65">
            {metadata.status || metadata.verdict || typeLabel}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-black">
          {metadata.problem_name || metadata.title || 'LeetCode problem'}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {metadata.difficulty ? (
            <span className="rounded-full bg-[#fff5dd] px-3 py-1 text-xs font-semibold text-[#9f5d00]">
              {metadata.difficulty}
            </span>
          ) : null}
          {metadata.title_slug ? (
            <span className="rounded-full bg-[#f3f3f3] px-3 py-1 text-xs font-semibold text-black/70">
              {metadata.title_slug}
            </span>
          ) : null}
          {tags.map((tag) => (
            <span
              className="rounded-full bg-[#fff1e2] px-3 py-1 text-xs font-semibold text-[#8e4b10]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
          {platformLabel}
        </p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black/65">
          {typeLabel}
        </span>
      </div>

      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-black/65">
        {JSON.stringify(activity.metadata || activity, null, 2)}
      </pre>
    </article>
  )
}
