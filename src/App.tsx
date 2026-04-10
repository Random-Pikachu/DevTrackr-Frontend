import { startTransition, useEffect, useState } from 'react'
import { syncProfileToBackend } from './lib/backend'
import {
  clearStoredAuthSession,
  clearStoredProfile,
  loadStoredAuthSession,
  loadStoredProfile,
  persistAuthSession,
  persistProfile,
} from './lib/persistence'
import { AuthenticatePage } from './pages/AuthenticatePage'
import { GitHubAuthCallbackPage } from './pages/GitHubAuthCallbackPage'
import HomePage from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import type {
  AuthSession,
  AuthSessionUpdate,
  BackendSyncResult,
  ProfileDraft,
  RouteMatch,
} from './types/app'

function matchRoute(pathname: string): RouteMatch {
  if (pathname === '/') {
    return { name: 'home' }
  }

  if (pathname === '/authenticate') {
    return { name: 'authenticate' }
  }

  if (pathname === '/authenticate/github/callback') {
    return { name: 'github-callback' }
  }

  if (pathname === '/onboarding') {
    return { name: 'onboarding' }
  }

  const usernameMatch = /^\/@([^/]+)$/.exec(pathname)

  if (usernameMatch) {
    return {
      name: 'profile',
      username: decodeURIComponent(usernameMatch[1]),
    }
  }

  return { name: 'not-found' }
}

function getCurrentPath() {
  return window.location.pathname
}

function mergeAuthSession(
  currentSession: AuthSession,
  update: AuthSessionUpdate,
): AuthSession {
  return {
    ...currentSession,
    ...update,
  }
}

export default function App() {
  const [pathname, setPathname] = useState(getCurrentPath)
  const [authSession, setAuthSession] = useState(loadStoredAuthSession)
  const [profileDraft, setProfileDraft] = useState(loadStoredProfile)

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setPathname(getCurrentPath())
      })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  const navigate = (nextPath: string, options?: { replace?: boolean }) => {
    if (nextPath === window.location.pathname) {
      return
    }

    if (options?.replace) {
      window.history.replaceState({}, '', nextPath)
    } else {
      window.history.pushState({}, '', nextPath)
    }

    startTransition(() => {
      setPathname(nextPath)
    })
  }

  const handleAuthSessionUpdate = (update: AuthSessionUpdate) => {
    setAuthSession((currentSession) => {
      const nextSession = mergeAuthSession(currentSession, update)
      persistAuthSession(nextSession)
      return nextSession
    })
  }

  const handleProfileDraftChange = (nextDraft: ProfileDraft) => {
    setProfileDraft(nextDraft)
    persistProfile(nextDraft)
  }

  const handleLogout = () => {
    clearStoredAuthSession()
    clearStoredProfile()
    setAuthSession(loadStoredAuthSession())
    setProfileDraft(loadStoredProfile())
    navigate('/')
  }

  const handleProfileCreate = async (
    nextDraft: ProfileDraft,
  ): Promise<BackendSyncResult> => {
    handleProfileDraftChange(nextDraft)

    const result = await syncProfileToBackend({
      authSession,
      profileDraft: nextDraft,
    })

    const syncedDraft =
      result.userId !== undefined
        ? {
            ...nextDraft,
            backendUserId: result.userId,
          }
        : nextDraft

    handleProfileDraftChange(syncedDraft)

    if (result.routeUsername) {
      handleAuthSessionUpdate({
        backendUsername: result.routeUsername,
        publicSlug: result.routeUsername,
      })
      navigate(`/@${encodeURIComponent(result.routeUsername)}`)
    }

    return result
  }

  const route = matchRoute(pathname)

  switch (route.name) {
    case 'home':
      return <HomePage onGetStarted={() => navigate('/authenticate')} />

    case 'authenticate':
      return (
        <AuthenticatePage
          authSession={authSession}
          onAuthSessionUpdate={handleAuthSessionUpdate}
          onContinue={() => navigate('/onboarding')}
        />
      )

    case 'github-callback':
      return <GitHubAuthCallbackPage />

    case 'onboarding':
      return (
        <OnboardingPage
          authSession={authSession}
          initialProfileDraft={profileDraft}
          onBackToAuth={() => navigate('/authenticate')}
          onCreateProfile={handleProfileCreate}
          onDraftChange={handleProfileDraftChange}
        />
      )

    case 'profile':
      return (
        <ProfilePage
          onDraftChange={handleProfileDraftChange}
          onLogout={handleLogout}
          onNavigate={navigate}
          requestedUsername={route.username}
          profileDraft={profileDraft}
          authSession={authSession}
        />
      )

    default:
      return <NotFoundPage onGoHome={() => navigate('/')} />
  }
}
