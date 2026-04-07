import { useEffect } from 'react'
import type { AuthPopupPayload } from '../types/app'

export function GitHubAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const payload: AuthPopupPayload = {
      type: 'devtrackr:github-auth',
      state: params.get('state') || undefined,
      code: params.get('code') || undefined,
      login:
        params.get('login') ||
        params.get('github_login') ||
        params.get('username') ||
        params.get('handle') ||
        undefined,
      email: params.get('email') || undefined,
      token: params.get('token') || undefined,
      userId:
        params.get('user_id') ||
        params.get('userId') ||
        params.get('id') ||
        undefined,
      error:
        params.get('error_description') ||
        params.get('error') ||
        undefined,
    }

    window.opener?.postMessage(payload, window.location.origin)

    const closeTimeout = window.setTimeout(() => {
      window.close()
    }, 220)

    return () => {
      window.clearTimeout(closeTimeout)
    }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-white/70">
        Closing GitHub login...
      </div>
    </main>
  )
}
