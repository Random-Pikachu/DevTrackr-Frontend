import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BackendActivity } from '../../types/app'

type PlatformActivitySectionProps = {
  activities: BackendActivity[]
  description: string
  platform: 'github' | 'codeforces' | 'leetcode'
  title: string
}

function GitHubEntry({ activity }: { activity: BackendActivity }) {
  const meta = activity.metadata || {}
  const repoUrl = meta.repo ? `https://github.com/${meta.repo}` : null
  const messages: string[] = meta.messages || []

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {repoUrl ? (
            <a
              href={repoUrl}
              rel="noreferrer"
              target="_blank"
              style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)', textUnderlineOffset: 3 }}
            >
              {meta.repo}
            </a>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{meta.repo || 'Repository activity'}</p>
          )}
          <p className="mono mt-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {meta.commit_count || 0} commit{(meta.commit_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {messages.length > 0 && (
        <div className="mt-2.5 space-y-1 border-l-2 pl-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {messages.map((msg) => (
            <p key={msg} style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', lineHeight: 1.5 }}>
              {msg.trim()}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function CodeforcesEntry({ activity }: { activity: BackendActivity }) {
  const meta = activity.metadata || {}
  const tags: string[] = meta.tags || []

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {meta.problem_name || 'Problem submission'}
          </p>
          <p className="mono mt-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {/* {meta.verdict || activity.activity_type} */}
            {meta.rating ? `Rating ${meta.rating}` : ''}
          </p>
        </div>
        {meta.verdict && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              padding: '2px 7px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: meta.verdict === 'OK' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
              color: meta.verdict === 'OK' ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.verdict}
          </span>
        )}
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function LeetCodeEntry({ activity }: { activity: BackendActivity }) {
  const meta = activity.metadata || {}
  const status = meta.status || meta.verdict || activity.activity_type

  const difficultyColor: Record<string, string> = {
    Easy: 'rgba(52,211,153,0.9)',
    Medium: 'rgba(251,191,36,0.9)',
    Hard: 'rgba(248,113,113,0.9)',
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {meta.problem_name || meta.title || 'LeetCode problem'}
          </p>
          <p className="mono mt-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {status}
            {meta.difficulty ? ` · ${meta.difficulty}` : ''}
          </p>
        </div>
        {meta.difficulty && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: difficultyColor[meta.difficulty] || 'rgba(255,255,255,0.4)',
            }}
          >
            {meta.difficulty}
          </span>
        )}
      </div>
    </div>
  )
}

const platformColors: Record<string, string> = {
  github: 'rgba(255,255,255,0.9)',
  leetcode: 'rgba(251,191,36,0.8)',
  codeforces: 'rgba(96,165,250,0.8)',
}

export function PlatformActivitySection({
  activities,
  description,
  platform,
  title,
}: PlatformActivitySectionProps) {
  const hasActivity = activities.length > 0
  const [isExpanded, setIsExpanded] = useState(hasActivity)

  useEffect(() => {
    setIsExpanded(hasActivity)
  }, [hasActivity])

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 text-left"
        style={{
          padding: '12px 16px',
          background: hasActivity ? 'rgba(255,255,255,0.02)' : 'transparent',
          cursor: hasActivity ? 'pointer' : 'default',
          border: 'none',
          transition: 'background 0.15s',
        }}
        onClick={() => { if (hasActivity) setIsExpanded((c) => !c) }}
        onMouseEnter={(e) => { if (hasActivity) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = hasActivity ? 'rgba(255,255,255,0.02)' : 'transparent' }}
        type="button"
      >
        {/* Dot */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: hasActivity ? platformColors[platform] : 'rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: hasActivity ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.24)',
          }}
        >
          {title}
        </span>

        <span
          className="mono"
          style={{
            fontSize: 11,
            color: hasActivity ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
          }}
        >
          {activities.length} {activities.length === 1 ? 'entry' : 'entries'}
        </span>

        {hasActivity && (
          <ChevronDown
            size={13}
            style={{
              color: 'rgba(255,255,255,0.3)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s',
            }}
          />
        )}
      </button>

      {/* Empty */}
      {!hasActivity && (
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            No {title} activity for this date.
          </p>
        </div>
      )}

      {/* Content */}
      {hasActivity && isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 16px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', padding: '10px 0 4px', lineHeight: 1.5 }}>
            {description}
          </p>
          {activities.map((activity) =>
            platform === 'github' ? (
              <GitHubEntry key={activity.id} activity={activity} />
            ) : platform === 'codeforces' ? (
              <CodeforcesEntry key={activity.id} activity={activity} />
            ) : (
              <LeetCodeEntry key={activity.id} activity={activity} />
            )
          )}
        </div>
      )}
    </div>
  )
}
