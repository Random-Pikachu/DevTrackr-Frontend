import { useEffect, useRef, useState } from 'react'
import logoMark from '../assets/devtrackr-mark.svg'
import type { AuthPopupPayload, AuthSession, AuthSessionUpdate } from '../types/app'

type AuthenticatePageProps = {
  authSession: AuthSession
  onAuthSessionUpdate: (update: AuthSessionUpdate) => void
  onContinue: () => void
}

function buildBackendAuthUrl() {
  const customAuthUrl = import.meta.env.VITE_GITHUB_AUTH_URL?.trim()

  if (customAuthUrl) {
    return customAuthUrl
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'
  return `${apiBaseUrl}/auth/github/login`
}

export function AuthenticatePage({
  authSession,
  onAuthSessionUpdate,
  onContinue,
}: AuthenticatePageProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const continueTimeoutRef = useRef<number | null>(null)

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
        onAuthSessionUpdate({
          status: 'idle',
          oauthState: undefined,
          error: payload.error,
        })
        return
      }

      setNotice('GitHub connected. Moving into onboarding...')
      onAuthSessionUpdate({
        status: 'connected',
        oauthState: undefined,
        oauthCode: payload.code,
        githubHandle: payload.login,
        email: payload.email,
        backendUserId: payload.userId,
        accessToken: payload.token,
        connectedAt: new Date().toISOString(),
        error: undefined,
      })

      continueTimeoutRef.current = window.setTimeout(() => {
        onContinue()
      }, 420)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)

      if (continueTimeoutRef.current !== null) {
        window.clearTimeout(continueTimeoutRef.current)
      }
    }
  }, [authSession.oauthState, onAuthSessionUpdate, onContinue])

  const handleGitHubLogin = () => {
    const authUrl = buildBackendAuthUrl()

    onAuthSessionUpdate({
      status: 'pending',
      oauthState: undefined,
      error: undefined,
    })

    setNotice(
      'GitHub opened through the backend auth flow. Finish the consent there and we will continue here.',
    )
    const authWindow = window.open(authUrl, '_blank')

    if (!authWindow) {
      setNotice('The browser blocked the new tab. Allow popups for this site and try again.')
      onAuthSessionUpdate({
        status: 'idle',
        oauthState: undefined,
        error: 'Popup blocked',
      })
    }
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(255,255,255,0.08)]">
          <img className="h-8 w-8" src={logoMark} alt="" />
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Authenticate
            </p>
            <h1 className="text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl">
              Connect GitHub to begin.
            </h1>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white px-6 py-6 text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <button
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-black px-8 text-base font-semibold text-white transition hover:bg-[#1c1c1c] disabled:cursor-not-allowed disabled:bg-[#3a3a3a]"
              disabled={authSession.status === 'pending'}
              onClick={handleGitHubLogin}
              type="button"
            >
              {authSession.status === 'pending'
                ? 'Waiting for GitHub...'
                : 'Login with GitHub'}
            </button>

            <p className="mt-4 text-sm leading-6 text-black/65">
              {notice ||
                'A new tab will open through your backend, then return to this app and close itself before onboarding starts.'}
            </p>
            <p className="mt-3 text-xs leading-5 text-black/45">
              Frontend now expects backend-owned OAuth. Set `VITE_GITHUB_AUTH_URL`
              or let it default to `VITE_API_BASE_URL/auth/github/login`.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
