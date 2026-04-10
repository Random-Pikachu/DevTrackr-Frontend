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

  if (customAuthUrl) {
    return customAuthUrl
  }

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

  useEffect(() => {
    onAuthSessionUpdateRef.current = onAuthSessionUpdate
  }, [onAuthSessionUpdate])

  useEffect(() => {
    onContinueRef.current = onContinue
  }, [onContinue])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<AuthPopupPayload>) => {
      if (event.origin !== window.location.origin) {
        return
      }

      const payload = event.data

      if (!payload || payload.type !== 'devtrackr:github-auth') {
        return
      }

      if (payload.error) {
        setNotice(payload.error)
        onAuthSessionUpdateRef.current({
          status: 'idle',
          oauthState: undefined,
          isNewUser: undefined,
          error: payload.error,
        })
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
          } catch {
            routeUsername = undefined
          }
        }

        if (!routeUsername && normalizedIsNewUser === false) {
          routeUsername = payload.login
        }

        setNotice(
          normalizedIsNewUser === false
            ? 'GitHub connected. Redirecting to your profile...'
            : 'GitHub connected. Moving into onboarding...',
        )

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

        if (continueTimeoutRef.current !== null) {
          window.clearTimeout(continueTimeoutRef.current)
        }

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

      if (continueTimeoutRef.current !== null) {
        window.clearTimeout(continueTimeoutRef.current)
      }
    }
  }, [])

  const handleGitHubLogin = () => {
    const authUrl = buildBackendAuthUrl()

    onAuthSessionUpdateRef.current({
      status: 'pending',
      oauthState: undefined,
      isNewUser: undefined,
      error: undefined,
    })

    setNotice(
      'GitHub opened through the backend auth flow. Finish the consent there and we will continue here.',
    )
    const authWindow = window.open(authUrl, '_blank')

    if (!authWindow) {
      setNotice('The browser blocked the new tab. Allow popups for this site and try again.')
      onAuthSessionUpdateRef.current({
        status: 'idle',
        oauthState: undefined,
        isNewUser: undefined,
        error: 'Popup blocked',
      })
    }
  }

  return (
    <main className="page-shell flex min-h-screen items-center bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Authenticate
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl">
              Connect GitHub to start tracking your coding activity.
            </h1>
            
          </div>

          <section className="stage-card rounded-[28px] border border-white/10 bg-[#090909] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(255,255,255,0.08)]">
              <img className="h-8 w-8" src={logoMark} alt="" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              GitHub Sign In
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-white">
              Continue with GitHub
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/50">
              A new tab opens for consent, then automatically returns here.
            </p>

            <button
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={authSession.status === 'pending'}
              onClick={handleGitHubLogin}
              type="button"
            >
              {authSession.status === 'pending'
                ? 'Waiting for GitHub...'
                : 'Login with GitHub'}
            </button>

            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/65">
              {notice ||
                'Once authentication completes, we continue to the right next step automatically.'}
            </p>
          </section>
        </section>
      </div>
    </main>
  )
}
