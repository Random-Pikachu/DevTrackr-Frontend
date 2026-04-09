import type {
  AuthSession,
  BackendHeatmapResponse,
  BackendNullableString,
  BackendSyncResult,
  BackendUser,
  BackendUserRecord,
  ProfileDraft,
} from '../types/app'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

type SyncProfileParams = {
  authSession: AuthSession
  profileDraft: ProfileDraft
}

function getNullableStringValue(field?: BackendNullableString) {
  if (!field?.Valid) {
    return undefined
  }

  return field.String || undefined
}

async function readResponseBody<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  return (await response.json()) as T
}

function normalizeUser(user: BackendUserRecord): BackendUser {
  return {
    id: user.id,
    email: user.email,
    username: getNullableStringValue(user.username),
    githubHandle: getNullableStringValue(user.github_handle),
    leetcodeHandle: getNullableStringValue(user.leetcode_handle),
    codeforcesHandle: getNullableStringValue(user.codeforces_handle),
    publicSlug: getNullableStringValue(user.public_slug),
    profilePublic: user.profile_public,
  }
}

function getRouteUsername(user: BackendUser | null) {
  return user?.publicSlug || user?.username
}

async function fetchUserByEmail(email: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/by-email?email=${encodeURIComponent(email)}`,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to fetch user by email.')
  }

  const user = await readResponseBody<BackendUserRecord>(response)
  return user ? normalizeUser(user) : null
}

async function fetchUserByUsername(username: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/by-username?username=${encodeURIComponent(username)}`,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to fetch user by username.')
  }

  const user = await readResponseBody<BackendUserRecord>(response)
  return user ? normalizeUser(user) : null
}

async function fetchUserHeatmap(userId: string, start: string, end: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/heatmap?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to fetch user heatmap.')
  }

  return await readResponseBody<BackendHeatmapResponse>(response)
}

async function runAggregateForUser(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/aggregate`, {
    method: 'POST',
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to refresh aggregated metrics.')
}

async function patchUsername(userId: string, username: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/username`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
    }),
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to update username.')
}

async function createIntegration(
  userId: string,
  platform: 'github' | 'leetcode' | 'codeforces',
  handle: string,
) {
  const response = await fetch(`${API_BASE_URL}/integrations`, {
    method: 'POST',
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

  if (!resolvedExistingUserId) {
    return {
      ok: false,
      warning: 'GitHub authentication did not provide a backend user id.',
    }
  }

  try {
    const username = profileDraft.username.trim()
    const leetcodeHandle = profileDraft.leetcodeId.trim()
    const codeforcesHandle = profileDraft.codeforcesId.trim()
    const userId = resolvedExistingUserId

    if (username) {
      await patchUsername(userId, username)
    }

    const integrationJobs: Promise<void>[] = []

    if (leetcodeHandle) {
      integrationJobs.push(
        createIntegration(userId, 'leetcode', leetcodeHandle),
      )
    }

    if (codeforcesHandle) {
      integrationJobs.push(
        createIntegration(userId, 'codeforces', codeforcesHandle),
      )
    }

    await Promise.all(integrationJobs)

    let syncedUser: BackendUser | null = null

    if (authSession.email) {
      syncedUser = await fetchUserByEmail(authSession.email)
    } else if (username) {
      syncedUser = await fetchUserByUsername(username)
    }

    return {
      ok: true,
      userId,
      routeUsername: getRouteUsername(syncedUser) || username || authSession.githubHandle,
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

export async function fetchUserProfileByUsername(username: string) {
  return await fetchUserByUsername(username)
}

export async function fetchYearHeatmapForUser(
  userId: string,
  start: string,
  end: string,
) {
  return await fetchUserHeatmap(userId, start, end)
}

export async function refreshAggregateForUser(userId: string) {
  await runAggregateForUser(userId)
}
