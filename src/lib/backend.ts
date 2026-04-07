import type { AuthSession, BackendSyncResult, ProfileDraft } from '../types/app'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'

type UserRecord = {
  id?: string
  user_id?: string
}

type SyncProfileParams = {
  authSession: AuthSession
  profileDraft: ProfileDraft
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function getUserId(user: UserRecord | null) {
  return user?.id ?? user?.user_id
}

async function readResponseBody<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  return (await response.json()) as T
}

async function createUser(email: string) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      email_frequency: 'daily',
      timezone: getTimezone(),
      digest_time: '20:00',
      email_opt_in: true,
      profile_public: true,
    }),
  })

  if (response.ok) {
    return await readResponseBody<UserRecord>(response)
  }

  if (response.status === 409) {
    return null
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to create user.')
}

async function fetchUserByEmail(email: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/by-email?email=${encodeURIComponent(email)}`,
    {
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to fetch user by email.')
  }

  return await readResponseBody<UserRecord>(response)
}

async function createIntegration(
  userId: string,
  platform: 'github' | 'leetcode' | 'codeforces',
  handle: string,
) {
  const response = await fetch(`${API_BASE_URL}/integrations`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      platform,
      handle,
      is_active: true,
    }),
  })

  if (response.ok || response.status === 409) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || `Unable to save ${platform} integration.`)
}

export async function syncProfileToBackend({
  authSession,
  profileDraft,
}: SyncProfileParams): Promise<BackendSyncResult> {
  const resolvedExistingUserId =
    authSession.backendUserId || profileDraft.backendUserId

  if (!resolvedExistingUserId && !authSession.email) {
    return {
      ok: false,
      warning:
        'GitHub OAuth finished without an email in the callback, so the profile stayed local-only.',
    }
  }

  try {
    let userId = resolvedExistingUserId

    if (!userId && authSession.email) {
      const createdUser = await createUser(authSession.email)
      const existingUser =
        getUserId(createdUser) !== undefined
          ? createdUser
          : await fetchUserByEmail(authSession.email)

      userId = getUserId(existingUser)
    }

    if (!userId) {
      return {
        ok: false,
        warning: 'The backend did not return a user id after authentication.',
      }
    }

    const integrationJobs: Promise<void>[] = []

    if (authSession.githubHandle) {
      integrationJobs.push(
        createIntegration(userId, 'github', authSession.githubHandle),
      )
    }

    if (profileDraft.leetcodeId) {
      integrationJobs.push(
        createIntegration(userId, 'leetcode', profileDraft.leetcodeId),
      )
    }

    if (profileDraft.codeforcesId) {
      integrationJobs.push(
        createIntegration(userId, 'codeforces', profileDraft.codeforcesId),
      )
    }

    await Promise.all(integrationJobs)

    return {
      ok: true,
      userId,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Backend sync failed.'

    return {
      ok: false,
      warning: message,
    }
  }
}
