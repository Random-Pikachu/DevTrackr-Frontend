import { useEffect, useRef, useState } from 'react'
import logoMark from '../assets/devtrackr-mark.svg'
import { fetchUserProfileByEmail, loginWithEmail, registerWithEmail, requestForgotPasswordCode, confirmForgotPassword } from '../lib/backend'
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function AuthenticatePage({
  authSession,
  onAuthSessionUpdate,
  onContinue,
}: AuthenticatePageProps) {
  const [mode, setMode] = useState<'github' | 'login' | 'register' | 'forgot'>('github')
  const [notice, setNotice] = useState<string | null>(null)

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [identifier, setIdentifier] = useState('') // email or username for login

  // Forgot password fields
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')

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

      const normalizedPasswordSet =
        typeof payload.password_set === 'string'
          ? payload.password_set.trim().toLowerCase() === 'true'
          : false

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
          passwordSet: normalizedPasswordSet,
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

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    onAuthSessionUpdateRef.current({ status: 'pending', oauthState: undefined, isNewUser: undefined, error: undefined })
    try {
      const response = await registerWithEmail(email, password)

      onAuthSessionUpdateRef.current({
        status: 'connected',
        oauthState: undefined,
        oauthCode: undefined,
        githubHandle: undefined,
        email: response.user.email,
        isNewUser: response.is_new_user,
        backendUserId: response.user.id,
        backendUsername: response.user.username,
        publicSlug: response.user.publicSlug || response.user.username,
        accessToken: response.token,
        passwordSet: response.password_set,
        connectedAt: new Date().toISOString(),
        error: undefined,
      })

      if (response.is_new_user === false && response.user.username) {
        onContinueRef.current(`/@${encodeURIComponent(response.user.username)}`)
      } else {
        onContinueRef.current('/onboarding')
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed.')
      setNotice(message)
      onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: message })
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    onAuthSessionUpdateRef.current({ status: 'pending', oauthState: undefined, isNewUser: undefined, error: undefined })
    try {
      const response = await loginWithEmail(identifier, password)

      onAuthSessionUpdateRef.current({
        status: 'connected',
        oauthState: undefined,
        oauthCode: undefined,
        githubHandle: undefined,
        email: response.user.email,
        isNewUser: response.is_new_user,
        backendUserId: response.user.id,
        backendUsername: response.user.username,
        publicSlug: response.user.publicSlug || response.user.username,
        accessToken: response.token,
        passwordSet: response.password_set,
        connectedAt: new Date().toISOString(),
        error: undefined,
      })

      if (response.user.username) {
        onContinueRef.current(`/@${encodeURIComponent(response.user.username)}`)
      } else {
        onContinueRef.current('/onboarding')
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed.')
      setNotice(message)
      onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: message })
    }
  }

  const switchMode = (m: 'github' | 'login' | 'register' | 'forgot') => {
    setMode(m)
    setNotice(null)
    if (m === 'forgot') { setForgotStep('email'); setForgotEmail(''); setForgotCode(''); setForgotNewPassword('') }
  }

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    onAuthSessionUpdateRef.current({ status: 'pending', oauthState: undefined, isNewUser: undefined, error: undefined })
    try {
      await requestForgotPasswordCode(forgotEmail)
      setForgotStep('code')
      setNotice('Verification code sent to your email.')
    } catch (error) {
      setNotice(getErrorMessage(error, 'Failed to send reset code.'))
    } finally {
      onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: undefined })
    }
  }

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    onAuthSessionUpdateRef.current({ status: 'pending', oauthState: undefined, isNewUser: undefined, error: undefined })
    try {
      const response = await confirmForgotPassword(forgotEmail, forgotCode, forgotNewPassword)
      onAuthSessionUpdateRef.current({
        status: 'connected',
        oauthState: undefined,
        oauthCode: undefined,
        githubHandle: undefined,
        email: response.user.email,
        isNewUser: response.is_new_user,
        backendUserId: response.user.id,
        backendUsername: response.user.username,
        publicSlug: response.user.publicSlug || response.user.username,
        accessToken: response.token,
        passwordSet: response.password_set,
        connectedAt: new Date().toISOString(),
        error: undefined,
      })
      if (response.user.username) {
        onContinueRef.current(`/@${encodeURIComponent(response.user.username)}`)
      } else {
        onContinueRef.current('/onboarding')
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to reset password.')
      setNotice(message)
      onAuthSessionUpdateRef.current({ status: 'idle', oauthState: undefined, isNewUser: undefined, error: message })
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
        <div className="mb-10 flex items-center justify-center gap-2.5">
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
            textAlign: 'center'
          }}
        >
          {mode === 'github' && 'Sign in to DevTrackr'}
          {mode === 'register' && 'Create an account'}
          {mode === 'login' && 'Welcome back'}
          {mode === 'forgot' && 'Reset your password'}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.6,
            marginBottom: 32,
            textAlign: 'center'
          }}
        >
          {mode === 'github' && 'Select your preferred authentication method below.'}
          {mode === 'register' && 'Enter your details to create a new DevTrackr account.'}
          {mode === 'login' && 'Ready to continue tracking your progress?'}
          {mode === 'forgot' && forgotStep === 'email' && 'Enter your email to receive a reset code.'}
          {mode === 'forgot' && forgotStep === 'code' && 'Enter the code and your new password.'}
        </p>

        {mode === 'github' && (
          <div className="flex flex-col gap-3">
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
                height: 44,
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
              }}
              onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
            >
              {/* GitHub icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {isPending ? 'Waiting for GitHub…' : 'Continue with GitHub'}
            </button>
            <button
              className="w-full btn-ghost"
              disabled={isPending}
              onClick={() => switchMode('login')}
              type="button"
              style={{ height: 44 }}
            >
              Sign in with Email
            </button>
            <button
              className="w-full btn-ghost"
              disabled={isPending}
              onClick={() => switchMode('register')}
              type="button"
              style={{ height: 44, color: 'rgba(255,255,255,0.4)' }}
            >
              Create an account
            </button>
          </div>
        )}

        {mode === 'register' && (
          <form className="flex flex-col gap-3" onSubmit={handleEmailRegister}>
            <input
              type="email"
              required
              className="dt-input"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <input
              type="password"
              required
              minLength={6}
              className="dt-input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <button
              className="w-full btn-primary mt-2"
              disabled={isPending}
              type="submit"
              style={{ height: 44, fontSize: 13 }}
            >
              {isPending ? 'Creating…' : 'Sign up'}
            </button>
            <button
              className="w-full btn-ghost mt-2"
              disabled={isPending}
              onClick={() => switchMode('github')}
              type="button"
              style={{ height: 44, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
            >
              Back
            </button>
          </form>
        )}

        {mode === 'login' && (
          <form className="flex flex-col gap-3" onSubmit={handleEmailLogin}>
            <input
              type="text"
              required
              className="dt-input"
              placeholder="Email or Username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <input
              type="password"
              required
              className="dt-input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <button
              className="w-full btn-primary mt-2"
              disabled={isPending}
              type="submit"
              style={{ height: 44, fontSize: 13 }}
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              className="w-full btn-ghost mt-2"
              disabled={isPending}
              onClick={() => switchMode('github')}
              type="button"
              style={{ height: 44, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
            >
              Back
            </button>
            <button
              className="w-full btn-ghost"
              disabled={isPending}
              onClick={() => switchMode('forgot')}
              type="button"
              style={{ height: 36, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {mode === 'forgot' && forgotStep === 'email' && (
          <form className="flex flex-col gap-3" onSubmit={handleForgotRequest}>
            <input
              type="email"
              required
              className="dt-input"
              placeholder="Email address"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <button className="w-full btn-primary mt-2" disabled={isPending} type="submit" style={{ height: 44, fontSize: 13 }}>
              {isPending ? 'Sending…' : 'Send Reset Code'}
            </button>
            <button className="w-full btn-ghost mt-2" disabled={isPending} onClick={() => switchMode('login')} type="button" style={{ height: 44, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Back to login
            </button>
          </form>
        )}

        {mode === 'forgot' && forgotStep === 'code' && (
          <form className="flex flex-col gap-3" onSubmit={handleForgotConfirm}>
            <input
              type="text"
              required
              className="dt-input"
              placeholder="6-digit code"
              value={forgotCode}
              onChange={e => setForgotCode(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <input
              type="password"
              required
              minLength={6}
              className="dt-input"
              placeholder="New password"
              value={forgotNewPassword}
              onChange={e => setForgotNewPassword(e.target.value)}
              style={{ height: 44, fontSize: 13 }}
            />
            <button className="w-full btn-primary mt-2" disabled={isPending} type="submit" style={{ height: 44, fontSize: 13 }}>
              {isPending ? 'Resetting…' : 'Reset Password'}
            </button>
            <button className="w-full btn-ghost mt-2" disabled={isPending} onClick={() => switchMode('login')} type="button" style={{ height: 44, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Cancel
            </button>
          </form>
        )}

        {/* Status notice */}
        {notice ? (
          <div
            className="mt-6 rounded-lg px-3.5 py-3"
            style={{
              border: notice.toLowerCase().includes('fail') ? '1px solid rgba(255,80,80,0.2)' : '1px solid rgba(255,255,255,0.08)',
              background: notice.toLowerCase().includes('fail') ? 'rgba(255,80,80,0.06)' : 'rgba(255,255,255,0.03)',
              fontSize: 12,
              color: notice.toLowerCase().includes('fail') ? 'rgba(255,160,160,0.9)' : 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}
          >
            {notice}
          </div>
        ) : (
          <p
            className="mt-6 text-center"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', lineHeight: 1.6 }}
          >
            By continuing you agree to our terms of service. No passwords stored in plain text.
          </p>
        )}
      </div>
    </main>
  )
}
