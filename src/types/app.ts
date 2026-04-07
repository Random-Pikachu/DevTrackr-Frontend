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
