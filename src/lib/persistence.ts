import type { AuthSession, ProfileDraft } from '../types/app'

const AUTH_STORAGE_KEY = 'devtrackr.auth-session'
const PROFILE_STORAGE_KEY = 'devtrackr.profile-draft'

const defaultAuthSession: AuthSession = {
  status: 'idle',
}

const defaultProfileDraft: ProfileDraft = {
  username: '',
  leetcodeId: '',
  codeforcesId: '',
}

function loadJSON<T>(storageKey: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

export function loadStoredAuthSession() {
  return loadJSON(AUTH_STORAGE_KEY, defaultAuthSession)
}

export function loadStoredProfile() {
  return loadJSON(PROFILE_STORAGE_KEY, defaultProfileDraft)
}

export function persistAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function persistProfile(profile: ProfileDraft) {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function clearStoredProfile() {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY)
}
