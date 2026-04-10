import type {
  BackendActivity,
  BackendActivitiesResponse,
  AuthSession,
  BackendIntegration,
  BackendIntegrationRecord,
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
    timezone:
      'timezone' in user && typeof user.timezone === 'string'
        ? user.timezone
        : undefined,
    digestTime:
      'digest_time' in user && typeof user.digest_time === 'string'
        ? user.digest_time
        : undefined,
    emailOptIn:
      'email_opt_in' in user && typeof user.email_opt_in === 'boolean'
        ? user.email_opt_in
        : undefined,
  }
}

function normalizeIntegration(
  integration: BackendIntegrationRecord,
): BackendIntegration {
  return {
    id: integration.id,
    userId: integration.user_id,
    platform: integration.platform,
    handle: integration.handle,
    isActive: integration.is_active,
    lastSyncedAt: getNullableStringValue(integration.last_synced_at),
    createdAt: integration.created_at,
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

async function fetchUserActivities(userId: string, date: string) {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/activities?date=${encodeURIComponent(date)}`,
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to fetch user activities.')
  }

  const body = await readResponseBody<
    BackendActivitiesResponse | BackendActivity[] | BackendActivity
  >(response)

  if (body && typeof body === 'object' && 'activities' in body) {
    return Array.isArray(body.activities) ? body.activities : []
  }

  if (Array.isArray(body)) {
    return body
  }

  if (body && typeof body === 'object') {
    return [body]
  }

  return []
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

async function sendDigestForUser(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/send-digest`, {
    method: 'POST',
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to send digest right now.')
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

async function patchProfilePublic(userId: string, profilePublic: boolean) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-public`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile_public: profilePublic,
    }),
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to update profile visibility.')
}

async function patchEmailOptIn(userId: string, emailOptIn: boolean) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/email-opt-in`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_opt_in: emailOptIn,
    }),
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to update email digest setting.')
}

async function patchDigestTime(userId: string, digestTime: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/digest-time`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      digest_time: digestTime,
    }),
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to update digest time.')
}

async function fetchActiveUserIntegrations(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/integrations/active`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to load integrations.')
  }

  const body = await readResponseBody<BackendIntegrationRecord[]>(response)
  return Array.isArray(body) ? body.map(normalizeIntegration) : []
}

async function deactivateIntegration(integrationId: string) {
  const response = await fetch(`${API_BASE_URL}/integrations/${integrationId}`, {
    method: 'DELETE',
  })

  if (response.ok) {
    return
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Unable to disconnect integration.')
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

export async function fetchUserActivitiesForDate(userId: string, date: string) {
  return await fetchUserActivities(userId, date)
}

export async function sendDigestNowForUser(userId: string) {
  await sendDigestForUser(userId)
}

export async function updateUsernameForUser(userId: string, username: string) {
  await patchUsername(userId, username)
}

export async function updateProfilePublicForUser(
  userId: string,
  profilePublic: boolean,
) {
  await patchProfilePublic(userId, profilePublic)
}

export async function updateEmailOptInForUser(
  userId: string,
  emailOptIn: boolean,
) {
  await patchEmailOptIn(userId, emailOptIn)
}

export async function updateDigestTimeForUser(userId: string, digestTime: string) {
  await patchDigestTime(userId, digestTime)
}

export async function fetchActiveIntegrationsForUser(userId: string) {
  return await fetchActiveUserIntegrations(userId)
}

export async function createIntegrationForUser(
  userId: string,
  platform: 'github' | 'leetcode' | 'codeforces',
  handle: string,
) {
  await createIntegration(userId, platform, handle)
}

export async function disconnectIntegrationForUser(integrationId: string) {
  await deactivateIntegration(integrationId)
}
