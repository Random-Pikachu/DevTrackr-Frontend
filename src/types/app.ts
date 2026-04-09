export type RouteMatch =
  | { name: 'home' }
  | { name: 'authenticate' }
  | { name: 'github-callback' }
  | { name: 'onboarding' }
  | { name: 'profile'; username: string }
  | { name: 'not-found' }

export type AuthSession = {
  status: 'idle' | 'pending' | 'connected'
  oauthState?: string
  oauthCode?: string
  githubHandle?: string
  email?: string
  backendUserId?: string
  backendUsername?: string
  publicSlug?: string
  accessToken?: string
  connectedAt?: string
  error?: string
}

export type AuthSessionUpdate = Partial<AuthSession>

export type ProfileDraft = {
  username: string
  leetcodeId: string
  codeforcesId: string
  backendUserId?: string
}

export type BackendSyncResult = {
  ok: boolean
  userId?: string
  routeUsername?: string
  warning?: string
}

export type AuthPopupPayload = {
  type: 'devtrackr:github-auth'
  state?: string
  code?: string
  login?: string
  email?: string
  token?: string
  userId?: string
  error?: string
}

export type BackendNullableString = {
  String: string
  Valid: boolean
}

export type BackendUserRecord = {
  id: string
  username?: BackendNullableString
  github_handle?: BackendNullableString
  leetcode_handle?: BackendNullableString
  codeforces_handle?: BackendNullableString
  email: string
  public_slug?: BackendNullableString
  profile_public?: boolean
}

export type BackendUser = {
  id: string
  email: string
  username?: string
  githubHandle?: string
  leetcodeHandle?: string
  codeforcesHandle?: string
  publicSlug?: string
  profilePublic?: boolean
}

export type BackendHeatmapDay = {
  date: string
  total_contributions: number
  github_commits: number
  lc_easy_solved: number
  lc_medium_solved: number
  lc_hard_solved: number
  cf_problems_solved: number
}

export type BackendHeatmapResponse = {
  user_id: string
  start: string
  end: string
  days: BackendHeatmapDay[]
}

export type BackendActivityMetadata = {
  repo?: string
  messages?: string[]
  commit_count?: number
  tags?: string[]
  rating?: number
  verdict?: string
  problem_name?: string
  difficulty?: string
  title?: string
  title_slug?: string
  status?: string
}

export type BackendActivity = {
  id: string
  user_id: string
  integration_id: string
  platform: string
  activity_date: string
  activity_type: string
  metadata?: BackendActivityMetadata
  fetched_at: string
}

export type BackendActivitiesResponse = {
  activities: BackendActivity[]
  date: string
  user_id: string
}
