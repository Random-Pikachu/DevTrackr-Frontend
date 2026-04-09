import { useState } from 'react'
import type { BackendActivity } from '../../types/app'

type PlatformActivitySectionProps = {
  activities: BackendActivity[]
  description: string
  platform: 'github' | 'codeforces' | 'leetcode'
  title: string
}

function PlatformIcon({
  platform,
  className,
}: {
  className?: string
  platform: 'github' | 'codeforces' | 'leetcode'
}) {
  if (platform === 'github') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M6 6V18M18 8V13M6 6C6 4.89543 6.89543 4 8 4C9.10457 4 10 4.89543 10 6C10 7.10457 9.10457 8 8 8C6.89543 8 6 7.10457 6 6ZM18 8C18 6.89543 18.8954 6 20 6C21.1046 6 22 6.89543 22 8C22 9.10457 21.1046 10 20 10C18.8954 10 18 9.10457 18 8ZM6 18C6 16.8954 6.89543 16 8 16C9.10457 16 10 16.8954 10 18C10 19.1046 9.10457 20 8 20C6.89543 20 6 19.1046 6 18ZM8 8L18.2 8M8 16.5L18.2 9.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (platform === 'codeforces') {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M8 8L4 16M8 8L12 10M8 8L12 4M12 10L8 16M12 10L16 12M8 16L12 20M16 12L12 20M16 12L20 8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M13 2L4 14H11L10 22L20 9H13L13 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ChevronIcon({
  className,
  isExpanded,
}: {
  className?: string
  isExpanded: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      className={`${className || ''} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ActivityEntry({ activity }: { activity: BackendActivity }) {
  const metadata = activity.metadata || {}

  if (activity.platform === 'github') {
    const repoUrl = metadata.repo ? `https://github.com/${metadata.repo}` : null
    const messages = metadata.messages || []

    return (
      <div className="space-y-2 text-xs">
        {repoUrl ? (
          <a
            className="font-semibold text-white transition hover:text-orange-300"
            href={repoUrl}
            rel="noreferrer"
            target="_blank"
          >
            {metadata.repo}
          </a>
        ) : (
          <p className="font-semibold text-white">
            {metadata.repo || 'Repository activity'}
          </p>
        )}
        <p className="text-white/50">
          {metadata.commit_count || 0} commit
          {(metadata.commit_count || 0) === 1 ? '' : 's'} captured
        </p>
        {messages.length > 0 ? (
          <div className="space-y-1 border-l border-white/10 pl-3">
            {messages.map((message) => (
              <p className="text-white/40 italic" key={message}>
                {message.trim()}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (activity.platform === 'codeforces') {
    const tags = metadata.tags || []

    return (
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-white">
          {metadata.problem_name || 'Problem submission'}
        </p>
        <p className="text-white/50">
          Verdict: {metadata.verdict || activity.activity_type} • Rating: +
          {metadata.rating || 0}
        </p>
        {tags.length > 0 ? (
          <p className="text-white/40">{tags.join(', ')}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 text-xs">
      <p className="font-semibold text-white">
        {metadata.problem_name || metadata.title || 'LeetCode problem'}
      </p>
      <p className="text-white/50">
        Difficulty: {metadata.difficulty || 'Unknown'} • Status:{' '}
        {metadata.status || metadata.verdict || activity.activity_type}
      </p>
      {metadata.title_slug ? (
        <p className="text-white/40">{metadata.title_slug}</p>
      ) : null}
    </div>
  )
}

export function PlatformActivitySection({
  activities,
  description,
  platform,
  title,
}: PlatformActivitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(platform === 'github')

  return (
    <section className="overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.01]">
      <button
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03]"
        onClick={() => {
          if (activities.length === 0) {
            return
          }

          setIsExpanded((current) => !current)
        }}
        type="button"
      >
        <PlatformIcon className="h-4 w-4 text-white/55" platform={platform} />
        <span className="flex-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
          {title}
        </span>
        <span
          className={`text-xs ${
            activities.length > 0 ? 'font-medium text-orange-400' : 'text-white/30'
          }`}
        >
          {activities.length} entr{activities.length === 1 ? 'y' : 'ies'}
        </span>
        {activities.length > 0 ? (
          <ChevronIcon className="h-4 w-4 text-white/35" isExpanded={isExpanded} />
        ) : null}
      </button>

      {activities.length === 0 ? (
        <div className="border-t border-white/10 px-4 pb-4 pt-2 text-xs text-white/40">
          No {title.toLowerCase()} activity recorded for this date.
        </div>
      ) : isExpanded ? (
        <div className="space-y-3 border-t border-white/10 p-4">
          <p className="text-xs leading-5 text-white/35">{description}</p>
          {activities.map((activity) => (
            <ActivityEntry activity={activity} key={activity.id} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
