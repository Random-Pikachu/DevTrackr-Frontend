import { useEffect, useRef, useState } from 'react'
import logoMark from '../assets/devtrackr-mark.svg'
import { fetchUserProfileByEmail } from '../lib/backend'
import type { AuthPopupPayload, AuthSession, AuthSessionUpdate } from '../types/app'

type AuthenticatePageProps = {
  authSession: AuthSession
  onAuthSessionUpdate: (update: AuthSessionUpdate) => void
  onContinue: (nextPath: string) => void
}

function buildBackendAuthUrl() {
  const customAuthUrl = import.meta.env.VITE_GITHUB_AUTH_URL?.trim()
  if (customAuthUrl) return customAuthUrl
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
  return `${apiBaseUrl}/auth/github/login`
}

export function AuthenticatePage({
  authSession,
  onAuthSessionUpdate,
  onContinue,
}: AuthenticatePageProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const continueTimeoutRef = useRef<number | null>(null)
  const onAuthSessionUpdateRef = useRef(onAuthSessionUpdate)
  const onContinueRef = useRef(onContinue)

  useEffect(() => { onAuthSessionUpdateRef.current = onAuthSessionUpdate }, [onAuthSessionUpdate])
  useEffect(() => { onContinueRef.current = onContinue }, [onContinue])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<AuthPopupPayload>) => {
      if (event.origin !== window.location.origin) return
      const payload = event.data
      if (!payload || payload.type !== 'devtrackr:github-auth') return

      if (payload.error) {
        setNotice(payload.error)
        onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: payload.error })
        return
      }

      const normalizedIsNewUser =
        payload.isNewUser ??
        (typeof payload.is_new_user === 'string'
          ? payload.is_new_user.trim().toLowerCase() === 'true'
          : undefined)

      const resolveRouteAndContinue = async () => {
        let routeUsername: string | undefined

        if (normalizedIsNewUser === false && payload.email) {
          try {
            const user = await fetchUserProfileByEmail(payload.email)
            routeUsername = user?.publicSlug || user?.username
          } catch { routeUsername = undefined }
        }

        if (!routeUsername && normalizedIsNewUser === false) routeUsername = payload.login

        setNotice(normalizedIsNewUser === false
          ? 'Authenticated. Redirecting to your profile…'
          : 'Authenticated. Setting up your profile…')

        onAuthSessionUpdateRef.current({
          status: 'connected',
          oauthState: undefined,
          oauthCode: payload.code,
          githubHandle: payload.login,
          email: payload.email,
          isNewUser: normalizedIsNewUser,
          backendUserId: payload.userId,
          backendUsername: routeUsername,
          publicSlug: routeUsername,
          accessToken: payload.token,
          connectedAt: new Date().toISOString(),
          error: undefined,
        })

        if (continueTimeoutRef.current !== null) window.clearTimeout(continueTimeoutRef.current)

        continueTimeoutRef.current = window.setTimeout(() => {
          if (normalizedIsNewUser === false && routeUsername) {
            onContinueRef.current(`/@${encodeURIComponent(routeUsername)}`)
            return
          }
          onContinueRef.current('/onboarding')
        }, 420)
      }

      void resolveRouteAndContinue()
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      if (continueTimeoutRef.current !== null) window.clearTimeout(continueTimeoutRef.current)
    }
  }, [])

  const handleGitHubLogin = () => {
    const authUrl = buildBackendAuthUrl()
    onAuthSessionUpdateRef.current({ status: 'pending', oauthState: undefined, isNewUser: undefined, error: undefined })
    setNotice('A new tab opened for GitHub consent. Complete it there and we will continue here automatically.')
    const authWindow = window.open(authUrl, '_blank')

    if (!authWindow) {
      setNotice('Popup blocked. Allow popups for this site and try again.')
      onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: 'Popup blocked' })
    }
  }

  const isPending = authSession.status === 'pending'

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-16"
      style={{ background: '#000' }}
    >
      <div className="animate-fade-up w-full" style={{ maxWidth: 400 }}>
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: '#fff' }}
          >
            <img src={logoMark} alt="" style={{ width: 16, height: 16 }} />
          </div>
          <span
            className="font-semibold"
            style={{ fontSize: 14, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.8)' }}
          >
            DevTrackr
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          Continue with GitHub
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          A new tab opens for OAuth consent, then you are automatically returned here.
        </p>

        {/* GitHub button */}
        <button
          className="w-full"
          disabled={isPending}
          onClick={handleGitHubLogin}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 42,
            background: '#fff',
            color: '#000',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 0.15s, background 0.15s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
        >
          {/* GitHub icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          {isPending ? 'Waiting for GitHub…' : 'Login with GitHub'}
        </button>

        {/* Status notice */}
        {notice ? (
          <div
            className="mt-4 rounded-lg px-3.5 py-3"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}
          >
            {notice}
          </div>
        ) : (
          <p
            className="mt-4"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', lineHeight: 1.6 }}
          >
            By continuing you agree to our terms of service. No passwords stored.
          </p>
        )}
      </div>
    </main>
  )
}
