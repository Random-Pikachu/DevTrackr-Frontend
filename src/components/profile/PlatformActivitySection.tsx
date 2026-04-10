import { ChevronDown, Code2, GitBranch, Zap } from 'lucide-react'
import { useState } from 'react'
import type { BackendActivity } from '../../types/app'

type PlatformActivitySectionProps = {
  activities: BackendActivity[]
  description: string
  platform: 'github' | 'codeforces' | 'leetcode'
  title: string
}

const platformIcons = {
  github: GitBranch,
  codeforces: Code2,
  leetcode: Zap,
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
  const Icon = platformIcons[platform]

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
        <Icon className="h-4 w-4 text-white/55" />
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
          <ChevronDown
            className={`h-4 w-4 text-white/35 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
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
