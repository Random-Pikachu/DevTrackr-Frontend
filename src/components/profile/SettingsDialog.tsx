import { useEffect, useMemo, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createIntegrationForUser,
  disconnectIntegrationForUser,
  fetchActiveIntegrationsForUser,
  updateDigestTimeForUser,
  updateEmailOptInForUser,
  updateProfilePublicForUser,
  updateUsernameForUser,
  requestPasswordSetupCode,
  confirmPasswordSetup,
} from '../../lib/backend'
import type {
  AuthSession,
  BackendIntegration,
  BackendUser,
  ProfileDraft,
} from '../../types/app'

type SettingsDialogProps = {
  authSession: AuthSession
  initialProfileDraft: ProfileDraft
  isOpen: boolean
  onClose: () => void
  onDraftChange?: (draft: ProfileDraft) => void
  onNavigateToAuthenticate: () => void
  onProfileUpdated: (nextUsername?: string) => Promise<void>
  profileUser: BackendUser
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      aria-pressed={checked}
      className="dt-toggle"
      data-checked={checked ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      type="button"
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
  )
}

// ─── Row with label ───────────────────────────────────────────────────────────
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start justify-between gap-6"
      style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{label}</p>
        {description && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p
        className="section-label"
        style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── Integration row ──────────────────────────────────────────────────────────
function IntegrationRow({
  title,
  description,
  isConnected,
  connectedHandle,
  handleValue,
  onHandleChange,
  onConnect,
  onDisconnect,
  isBusy,
  inputPlaceholder,
}: {
  title: string
  description: string
  isConnected: boolean
  connectedHandle?: string
  handleValue: string
  onHandleChange?: (v: string) => void
  onConnect: () => void
  onDisconnect?: () => void
  isBusy: boolean
  inputPlaceholder: string
}) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.015)',
        marginBottom: 8,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{title}</p>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: isConnected ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
                color: isConnected ? 'rgba(52,211,153,0.85)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {isConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      </div>

      {isConnected && connectedHandle && !onHandleChange && (
        <div
          className="mono mt-3"
          style={{
            fontSize: 12,
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {connectedHandle}
        </div>
      )}

      {onHandleChange && (
        <input
          className="dt-input mt-3"
          onChange={(e) => onHandleChange(e.target.value)}
          placeholder={inputPlaceholder}
          type="text"
          value={handleValue}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="btn-primary"
          style={{ height: 32, fontSize: 12 }}
          disabled={isBusy}
          onClick={onConnect}
          type="button"
        >
          {isBusy ? 'Working…' : isConnected ? `Update ${title}` : `Connect ${title}`}
        </button>
        {isConnected && onDisconnect && (
          <button
            className="btn-ghost"
            style={{ height: 32, fontSize: 12 }}
            disabled={isBusy}
            onClick={onDisconnect}
            type="button"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────
export function SettingsDialog({
  authSession,
  initialProfileDraft,
  isOpen,
  onClose,
  onDraftChange,
  onNavigateToAuthenticate,
  onProfileUpdated,
  profileUser,
}: SettingsDialogProps) {
  const [username, setUsername] = useState(profileUser.publicSlug || profileUser.username || '')
  const [isPublicProfile, setIsPublicProfile] = useState(profileUser.profilePublic ?? false)
  const [emailOptIn, setEmailOptIn] = useState(profileUser.emailOptIn ?? true)
  const [digestTime, setDigestTime] = useState(profileUser.digestTime || '20:00')
  const [integrations, setIntegrations] = useState<BackendIntegration[]>([])
  const [leetcodeHandle, setLeetcodeHandle] = useState(initialProfileDraft.leetcodeId || profileUser.leetcodeHandle || '')
  const [codeforcesHandle, setCodeforcesHandle] = useState(initialProfileDraft.codeforcesId || profileUser.codeforcesHandle || '')
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [busyIntegration, setBusyIntegration] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // OTP set-password flow
  const [setupPasswordMode, setSetupPasswordMode] = useState<'idle' | 'otp' | 'success'>('idle')
  const [setupCode, setSetupCode] = useState('')
  const [setupNewPassword, setSetupNewPassword] = useState('')
  const [setupError, setSetupError] = useState<string | null>(null)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [passwordSetLocally, setPasswordSetLocally] = useState(false)

  const hasPasswordSet = authSession.passwordSet || passwordSetLocally

  const githubIntegration = useMemo(() => integrations.find((i) => i.platform === 'github'), [integrations])
  const leetcodeIntegration = useMemo(() => integrations.find((i) => i.platform === 'leetcode'), [integrations])
  const codeforcesIntegration = useMemo(() => integrations.find((i) => i.platform === 'codeforces'), [integrations])

  const timezoneLabel = !profileUser.timezone || profileUser.timezone === 'UTC' ? 'IST' : profileUser.timezone

  useEffect(() => {
    if (!isOpen) return
    setUsername(profileUser.publicSlug || profileUser.username || '')
    setIsPublicProfile(profileUser.profilePublic ?? false)
    setEmailOptIn(profileUser.emailOptIn ?? true)
    setDigestTime(profileUser.digestTime || '20:00')
    setLeetcodeHandle(initialProfileDraft.leetcodeId || profileUser.leetcodeHandle || '')
    setCodeforcesHandle(initialProfileDraft.codeforcesId || profileUser.codeforcesHandle || '')

    setError(null)

    void fetchActiveIntegrationsForUser(profileUser.id)
      .then(setIntegrations)
      .catch((error) => setError(getErrorMessage(error, 'Unable to load integrations.')))
  }, [
    initialProfileDraft.codeforcesId,
    initialProfileDraft.leetcodeId,
    isOpen,
    profileUser.codeforcesHandle,
    profileUser.digestTime,
    profileUser.emailOptIn,
    profileUser.id,
    profileUser.leetcodeHandle,
    profileUser.profilePublic,
    profileUser.publicSlug,
    profileUser.username,
  ])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const syncDraft = (overrides: Partial<ProfileDraft>) => {
    if (typeof onDraftChange !== 'function') return
    onDraftChange({ ...initialProfileDraft, ...overrides })
  }

  const setMsg = (msg: string) => { toast.success(msg, { duration: 2000 }); setError(null) }
  const setErr = (msg: string) => { setError(msg) }

  const handleSaveUsername = async () => {
    const trimmed = username.trim().replace(/^@+/, '')
    if (!trimmed) { setErr('Username cannot be empty.'); return }
    setIsSavingUsername(true); setError(null);
    try {
      await updateUsernameForUser(profileUser.id, trimmed)
      syncDraft({ username: trimmed })
      await onProfileUpdated(trimmed)
      setMsg('Username updated.')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Unable to update username.') }
    finally { setIsSavingUsername(false) }
  }

  const handleToggleEmailOptIn = async (next: boolean) => {
    setIsSavingNotifications(true); setError(null);
    try {
      await updateEmailOptInForUser(profileUser.id, next)
      setEmailOptIn(next); await onProfileUpdated()
      setMsg('Email digest preference updated.')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Unable to update preference.') }
    finally { setIsSavingNotifications(false) }
  }

  const handleTogglePublicProfile = async (next: boolean) => {
    setIsSavingPrivacy(true); setError(null);
    try {
      await updateProfilePublicForUser(profileUser.id, next)
      setIsPublicProfile(next); await onProfileUpdated()
      setMsg(next ? 'Profile is now public.' : 'Profile is now private.')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Unable to update privacy.') }
    finally { setIsSavingPrivacy(false) }
  }

  const handleSaveDigestTime = async () => {
    if (!digestTime) { setErr('Choose a digest time first.'); return }
    setIsSavingNotifications(true); setError(null);
    try {
      await updateDigestTimeForUser(profileUser.id, digestTime)
      await onProfileUpdated()
      setMsg('Digest time updated.')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Unable to update digest time.') }
    finally { setIsSavingNotifications(false) }
  }

  const handleRequestPasswordSetup = async () => {
    if (!profileUser.email) { setSetupError('No email linked.'); return }
    setIsSettingPassword(true); setSetupError(null)
    try {
      await requestPasswordSetupCode(profileUser.email)
      setSetupPasswordMode('otp')
      setMsg('Verification code sent to your email.')
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Failed to send code.'))
    } finally { setIsSettingPassword(false) }
  }

  const handleConfirmPasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileUser.email) return
    setIsSettingPassword(true); setSetupError(null)
    try {
      await confirmPasswordSetup(profileUser.email, setupCode, setupNewPassword)
      setSetupPasswordMode('idle')
      setPasswordSetLocally(true)
      setSetupCode('')
      setSetupNewPassword('')
      toast.success('You can now login using either GitHub or Email + Password.')
    } catch (error) {
      setSetupError(getErrorMessage(error, 'Failed to verify code.'))
    } finally { setIsSettingPassword(false) }
  }

  const reloadIntegrations = async () => {
    const items = await fetchActiveIntegrationsForUser(profileUser.id)
    setIntegrations(items); await onProfileUpdated()
  }

  const handleConnectManualIntegration = async (platform: 'leetcode' | 'codeforces', handle: string) => {
    const trimmed = handle.trim()
    if (!trimmed) { setErr(`Enter your ${platform} handle first.`); return }
    const current = platform === 'leetcode' ? leetcodeIntegration : codeforcesIntegration
    setBusyIntegration(platform); setError(null);
    try {
      if (current && current.handle.toLowerCase() !== trimmed.toLowerCase()) {
        await disconnectIntegrationForUser(current.id)
      }
      await createIntegrationForUser(profileUser.id, platform, trimmed)
      if (platform === 'leetcode') syncDraft({ leetcodeId: trimmed })
      else syncDraft({ codeforcesId: trimmed })
      await reloadIntegrations()
      setMsg(`${platform} integration saved.`)
    } catch (e) { setErr(e instanceof Error ? e.message : `Unable to connect ${platform}.`) }
    finally { setBusyIntegration(null) }
  }

  const handleDisconnectIntegration = async (integration: BackendIntegration) => {
    setBusyIntegration(integration.platform); setError(null);
    try {
      await disconnectIntegrationForUser(integration.id)
      if (integration.platform === 'leetcode') { setLeetcodeHandle(''); syncDraft({ leetcodeId: '' }) }
      if (integration.platform === 'codeforces') { setCodeforcesHandle(''); syncDraft({ codeforcesId: '' }) }
      await reloadIntegrations()
      setMsg(`${integration.platform} disconnected.`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Unable to disconnect.') }
    finally { setBusyIntegration(null) }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 md:py-12"
      role="dialog"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="dt-scrollbar w-full overflow-y-auto animate-fade-up"
        style={{
          maxWidth: 800,
          maxHeight: 'calc(100vh - 64px)',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 1 }}
        >
          <div>
            <p className="section-label" style={{ marginBottom: 4 }}>Settings</p>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>
              Profile & Preferences
            </h2>
          </div>
          <button
            aria-label="Close"
            className="btn-ghost"
            style={{ width: 32, height: 32, padding: 0 }}
            onClick={onClose}
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Feedback / error banner */}
          {error && (
            <div
              className="mb-5 flex items-center gap-2.5 rounded-lg px-3.5 py-3"
              style={{ border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.07)', fontSize: 12, color: 'rgba(255,180,180,0.9)' }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}


          {/* Account */}
          <Section title="Account">
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Username</p>
              <div className="flex items-center gap-2">
                <input
                  className="dt-input"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  type="text"
                  value={username}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-primary"
                  style={{ height: 36, flexShrink: 0, fontSize: 12 }}
                  disabled={isSavingUsername}
                  onClick={() => void handleSaveUsername()}
                  type="button"
                >
                  {isSavingUsername ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
              }}
            >
              <p className="section-label" style={{ marginBottom: 4 }}>Email</p>
              <p className="mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{profileUser.email}</p>
            </div>
          </Section>

          {/* Privacy */}
          <Section title="Privacy">
            <SettingRow
              label="Public profile"
              description="Allow anyone to view your contribution heatmap and activity at /@username."
            >
              <Toggle checked={isPublicProfile} onChange={(v) => void handleTogglePublicProfile(v)} disabled={isSavingPrivacy} />
            </SettingRow>

            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <p className="section-label" style={{ marginBottom: 4 }}>Public URL</p>
              <p className="mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                /@{profileUser.publicSlug || profileUser.username || username.trim()}
              </p>
            </div>
          </Section>

          {/* Digest */}
          <Section title="Digest & Notifications">
            <SettingRow
              label="Daily email digest"
              description="Receive a nightly summary of your aggregated activity."
            >
              <Toggle checked={emailOptIn} onChange={(v) => void handleToggleEmailOptIn(v)} disabled={isSavingNotifications} />
            </SettingRow>

            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                Digest time
                <span className="mono" style={{ marginLeft: 6, fontSize: 11, color: 'rgba(255,255,255,0.24)' }}>
                  {timezoneLabel}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="dt-input"
                  style={{ flex: 1 }}
                  onChange={(e) => setDigestTime(e.target.value)}
                  type="time"
                  value={digestTime}
                />
                <button
                  className="btn-ghost"
                  style={{ height: 36, flexShrink: 0, fontSize: 12 }}
                  disabled={isSavingNotifications}
                  onClick={() => void handleSaveDigestTime()}
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </Section>

          {/* Integrations */}
          <Section title="Integrations">
            <IntegrationRow
              title="GitHub"
              description="Uses OAuth. Reconnect to refresh the token or update the linked account."
              isConnected={Boolean(githubIntegration || profileUser.githubHandle)}
              connectedHandle={githubIntegration?.handle || profileUser.githubHandle || authSession.githubHandle}
              handleValue={githubIntegration?.handle || profileUser.githubHandle || authSession.githubHandle || ''}
              onConnect={() => onNavigateToAuthenticate()}
              onDisconnect={githubIntegration ? () => void handleDisconnectIntegration(githubIntegration) : undefined}
              isBusy={busyIntegration === 'github'}
              inputPlaceholder=""
            />
            <IntegrationRow
              title="LeetCode"
              description="Track accepted submissions by handle. No API key required."
              isConnected={Boolean(leetcodeIntegration)}
              connectedHandle={leetcodeIntegration?.handle}
              handleValue={leetcodeHandle}
              onHandleChange={setLeetcodeHandle}
              onConnect={() => void handleConnectManualIntegration('leetcode', leetcodeHandle)}
              onDisconnect={leetcodeIntegration ? () => void handleDisconnectIntegration(leetcodeIntegration) : undefined}
              isBusy={busyIntegration === 'leetcode'}
              inputPlaceholder="tourist"
            />
            <IntegrationRow
              title="Codeforces"
              description="Track contest problem solves by handle. Verdict and rating are included."
              isConnected={Boolean(codeforcesIntegration)}
              connectedHandle={codeforcesIntegration?.handle}
              handleValue={codeforcesHandle}
              onHandleChange={setCodeforcesHandle}
              onConnect={() => void handleConnectManualIntegration('codeforces', codeforcesHandle)}
              onDisconnect={codeforcesIntegration ? () => void handleDisconnectIntegration(codeforcesIntegration) : undefined}
              isBusy={busyIntegration === 'codeforces'}
              inputPlaceholder="tourist"
            />
          </Section>

          {/* Security */}
          <Section title="Security">
            <div style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, background: 'rgba(255,255,255,0.015)' }}>
              {setupPasswordMode === 'idle' ? (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {hasPasswordSet ? 'Change Password' : 'Email Login'}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5 }}>
                    {hasPasswordSet
                      ? 'Update your current password. A verification code will be sent to your email.'
                      : 'Set a password to enable logging in with your email in addition to GitHub.'}
                  </p>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: 12, height: 32, fontSize: 12 }}
                    onClick={() => void handleRequestPasswordSetup()}
                    disabled={isSettingPassword}
                    type="button"
                  >
                    {isSettingPassword ? 'Sending OTP…' : hasPasswordSet ? 'Change Password' : 'Set Password'}
                  </button>
                  {setupError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{setupError}</p>}
                </div>
              ) : (
                <form onSubmit={handleConfirmPasswordSetup}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Verify your Email</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.5, marginBottom: 16 }}>
                    Check your inbox and enter the 6-digit verification code sent to {profileUser.email}.
                  </p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      className="dt-input"
                      placeholder="6-digit code"
                      value={setupCode}
                      onChange={e => setSetupCode(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      className="dt-input"
                      placeholder="New password"
                      value={setupNewPassword}
                      onChange={e => setSetupNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button type="submit" className="btn-primary" style={{ height: 32, fontSize: 12 }} disabled={isSettingPassword}>
                      {isSettingPassword ? 'Verifying…' : 'Confirm'}
                    </button>
                    <button type="button" className="btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => setSetupPasswordMode('idle')} disabled={isSettingPassword}>
                      Cancel
                    </button>
                  </div>
                  {setupError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{setupError}</p>}
                </form>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
