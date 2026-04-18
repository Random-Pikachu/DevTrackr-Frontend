// ─── Dummy heatmap data for 2025 ─────────────────────────────────────────────
// Generates a realistic-looking year of contributions

export type HeatmapDay = {
  date: string          // YYYY-MM-DD
  total: number         // 0–12
  github: number
  leetcode: number
  codeforces: number
}

export type ActivityEntry =
  | {
      platform: 'github'
      repo: string
      commits: number
      messages: string[]
    }
  | {
      platform: 'leetcode'
      title: string
      difficulty: 'Easy' | 'Medium' | 'Hard'
      status: 'Accepted'
      titleSlug: string
    }
  | {
      platform: 'codeforces'
      problem: string
      verdict: 'OK' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED'
      rating: number
      tags: string[]
    }

// ─── Activity pool ────────────────────────────────────────────────────────────

const GITHUB_REPOS: { repo: string; messages: string[] }[] = [
  { repo: 'Random-Pikachu/devtrackr', messages: ['feat: add email digest scheduler', 'fix: handle null timezone in user record'] },
  { repo: 'Random-Pikachu/devtrackr', messages: ['refactor: extract platform collectors', 'chore: update go.sum'] },
  { repo: 'Random-Pikachu/plasma-workspace', messages: ['wallpaper: add SHA-256 content-hash caching', 'fix: persist wallpaper directory across restarts'] },
  { repo: 'Random-Pikachu/devtrackr', messages: ['feat: implement codeforces collector', 'test: add unit tests for heatmap aggregator'] },
  { repo: 'Random-Pikachu/codeRivals', messages: ['feat: deploy piston executor on EC2', 'fix: nginx mixed content on vercel'] },
  { repo: 'Random-Pikachu/devtrackr', messages: ['feat: send HTML digest email', 'style: update landing page hero'] },
  { repo: 'KDE/plasma-workspace', messages: ['MR !6280: wallpaper gallery SHA-256 deduplication'] },
  { repo: 'Random-Pikachu/devtrackr', messages: ['fix: leetcode cookie rotation', 'feat: add heatmap endpoint with date range'] },
]

const LEETCODE_PROBLEMS: Omit<ActivityEntry & { platform: 'leetcode' }, 'platform'>[] = [
  { title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', status: 'Accepted', titleSlug: 'binary-tree-level-order-traversal' },
  { title: 'Maximum Subarray', difficulty: 'Medium', status: 'Accepted', titleSlug: 'maximum-subarray' },
  { title: 'Two Sum', difficulty: 'Easy', status: 'Accepted', titleSlug: 'two-sum' },
  { title: 'Merge Intervals', difficulty: 'Medium', status: 'Accepted', titleSlug: 'merge-intervals' },
  { title: 'Trapping Rain Water', difficulty: 'Hard', status: 'Accepted', titleSlug: 'trapping-rain-water' },
  { title: 'Longest Palindromic Substring', difficulty: 'Medium', status: 'Accepted', titleSlug: 'longest-palindromic-substring' },
  { title: 'Valid Parentheses', difficulty: 'Easy', status: 'Accepted', titleSlug: 'valid-parentheses' },
  { title: 'LRU Cache', difficulty: 'Medium', status: 'Accepted', titleSlug: 'lru-cache' },
  { title: 'Word Ladder', difficulty: 'Hard', status: 'Accepted', titleSlug: 'word-ladder' },
  { title: 'Course Schedule', difficulty: 'Medium', status: 'Accepted', titleSlug: 'course-schedule' },
  { title: 'Find Median from Data Stream', difficulty: 'Hard', status: 'Accepted', titleSlug: 'find-median-from-data-stream' },
  { title: 'Climbing Stairs', difficulty: 'Easy', status: 'Accepted', titleSlug: 'climbing-stairs' },
]

const CF_PROBLEMS: Omit<ActivityEntry & { platform: 'codeforces' }, 'platform'>[] = [
  { problem: 'Gregor and the Two Painters', verdict: 'OK', rating: 1800, tags: ['math', 'combinatorics'] },
  { problem: 'Permutation Game', verdict: 'OK', rating: 1600, tags: ['games', 'math'] },
  { problem: 'Yet Another Segment Covering', verdict: 'OK', rating: 2000, tags: ['data structures', 'greedy'] },
  { problem: 'String Reversal', verdict: 'OK', rating: 1700, tags: ['sortings', 'strings'] },
  { problem: 'Gardener and the Array', verdict: 'OK', rating: 1400, tags: ['greedy', 'implementation'] },
  { problem: 'Kefa and Park', verdict: 'OK', rating: 1500, tags: ['dfs', 'graphs', 'trees'] },
  { problem: 'Vitaly and Strings', verdict: 'WRONG_ANSWER', rating: 1900, tags: ['strings', 'brute force'] },
  { problem: 'Road to Cinema', verdict: 'OK', rating: 1600, tags: ['binary search', 'math'] },
]

// ─── Deterministic seeded random ─────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return ((s >>> 0) / 0xffffffff)
  }
}

// ─── Generate full year ───────────────────────────────────────────────────────

function generateYear(): Map<string, HeatmapDay> {
  const map = new Map<string, HeatmapDay>()
  const start = new Date(2025, 0, 1)
  const end   = new Date(2025, 11, 31)
  const rng   = seededRng(42)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const dow  = d.getDay()

    // More active on weekdays, streaks in certain months
    const month = d.getMonth()
    const baseProb = dow === 0 || dow === 6 ? 0.4 : 0.72
    const monthBoost = [0.9, 0.85, 1.0, 0.95, 1.1, 0.8, 0.75, 0.9, 1.05, 1.15, 1.0, 0.7][month] ?? 1

    if (rng() > baseProb * monthBoost) {
      map.set(date, { date, total: 0, github: 0, leetcode: 0, codeforces: 0 })
      continue
    }

    const github     = Math.floor(rng() * 8)
    const leetcode   = Math.floor(rng() * 4)
    const codeforces = rng() > 0.7 ? Math.floor(rng() * 3) : 0
    const total      = github + leetcode + codeforces

    map.set(date, { date, total, github, leetcode, codeforces })
  }

  return map
}

export const HEATMAP_DATA: Map<string, HeatmapDay> = generateYear()

// ─── Summary stats ────────────────────────────────────────────────────────────

export const YEAR_STATS = (() => {
  let activeDays = 0, totalGH = 0, totalLC = 0, totalCF = 0
  for (const day of HEATMAP_DATA.values()) {
    if (day.total > 0) activeDays++
    totalGH += day.github
    totalLC += day.leetcode
    totalCF += day.codeforces
  }
  return { activeDays, totalGH, totalLC, totalCF }
})()

// ─── Activity per day ─────────────────────────────────────────────────────────

export function getActivitiesForDate(date: string): ActivityEntry[] {
  const day = HEATMAP_DATA.get(date)
  if (!day || day.total === 0) return []

  const rng      = seededRng(date.split('-').reduce((a, b) => a + Number(b), 0))
  const entries: ActivityEntry[] = []

  if (day.github > 0) {
    const repo = GITHUB_REPOS[Math.floor(rng() * GITHUB_REPOS.length)]
    entries.push({ platform: 'github', repo: repo.repo, commits: day.github, messages: repo.messages })
  }

  for (let i = 0; i < day.leetcode; i++) {
    const p = LEETCODE_PROBLEMS[Math.floor(rng() * LEETCODE_PROBLEMS.length)]
    // avoid exact dupe titles in one day
    if (!entries.some((e) => e.platform === 'leetcode' && e.title === p.title)) {
      entries.push({ platform: 'leetcode', ...p })
    }
  }

  for (let i = 0; i < day.codeforces; i++) {
    const p = CF_PROBLEMS[Math.floor(rng() * CF_PROBLEMS.length)]
    if (!entries.some((e) => e.platform === 'codeforces' && e.problem === p.problem)) {
      entries.push({ platform: 'codeforces', ...p })
    }
  }

  return entries
}

// ─── Profile preview: pick a recent active streak ────────────────────────────

export const PREVIEW_STREAK = 23
export const PREVIEW_USERNAME = 'sangam'

// Heatmap array for the profile preview component (compact, current month +/- 2)
export function getPreviewHeatmapRows(): { date: string; total: number }[][] {
  const days: { date: string; total: number }[] = []

  // Show Jan–Apr 2025 for the preview (14 weeks = 98 days)
  const start = new Date(2025, 0, 1)
  for (let i = 0; i < 112; i++) {
    const d    = new Date(start)
    d.setDate(d.getDate() + i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ date, total: HEATMAP_DATA.get(date)?.total ?? 0 })
  }

  // split into rows of 7
  const rows: { date: string; total: number }[][] = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}
