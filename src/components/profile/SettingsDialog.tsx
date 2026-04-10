import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Shield,
  X,
} from 'lucide-react'
import {
  createIntegrationForUser,
  disconnectIntegrationForUser,
  fetchActiveIntegrationsForUser,
  updateDigestTimeForUser,
  updateEmailOptInForUser,
  updateProfilePublicForUser,
  updateUsernameForUser,
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

type ToggleRowProps = {
  checked: boolean
  description: string
  disabled?: boolean
  label: string
  onChange: (nextChecked: boolean) => void
}

function ToggleRow({
  checked,
  description,
  disabled,
  label,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
      </div>
      <button
        aria-pressed={checked}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? 'border-orange-400 bg-orange-400'
            : 'border-white/15 bg-white/[0.06]'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        disabled={disabled}
        onClick={() => {
          onChange(!checked)
        }}
        type="button"
      >
        <span
          className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition ${
            checked ? 'left-[23px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function IntegrationCard({
  actionLabel,
  description,
  handleValue,
  inputPlaceholder,
  isBusy,
  isConnected,
  onAction,
  onDisconnect,
  onHandleChange,
  title,
}: {
  actionLabel: string
  description: string
  handleValue: string
  inputPlaceholder: string
  isBusy: boolean
  isConnected: boolean
  onAction: () => void
  onDisconnect?: () => void
  onHandleChange?: (value: string) => void
  title: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isConnected
              ? 'bg-orange-400/15 text-orange-300'
              : 'bg-white/[0.06] text-white/45'
          }`}
        >
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {onHandleChange ? (
        <input
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20"
          onChange={(event) => {
            onHandleChange(event.target.value)
          }}
          placeholder={inputPlaceholder}
          type="text"
          value={handleValue}
        />
      ) : handleValue ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
          {handleValue}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={onAction}
          type="button"
        >
          {isBusy ? 'Working...' : actionLabel}
        </button>
        {isConnected && onDisconnect ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={onDisconnect}
            type="button"
          >
            Disconnect
          </button>
        ) : null}
      </div>
    </div>
  )
}

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
  const [isPublicProfile, setIsPublicProfile] = useState(
    profileUser.profilePublic ?? false,
  )
  const [emailOptIn, setEmailOptIn] = useState(profileUser.emailOptIn ?? true)
  const [digestTime, setDigestTime] = useState(profileUser.digestTime || '20:00')
  const [integrations, setIntegrations] = useState<BackendIntegration[]>([])
  const [leetcodeHandle, setLeetcodeHandle] = useState(
    initialProfileDraft.leetcodeId || profileUser.leetcodeHandle || '',
  )
  const [codeforcesHandle, setCodeforcesHandle] = useState(
    initialProfileDraft.codeforcesId || profileUser.codeforcesHandle || '',
  )
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [busyIntegration, setBusyIntegration] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const githubIntegration = useMemo(
    () => integrations.find((integration) => integration.platform === 'github'),
    [integrations],
  )
  const leetcodeIntegration = useMemo(
    () => integrations.find((integration) => integration.platform === 'leetcode'),
    [integrations],
  )
  const codeforcesIntegration = useMemo(
    () => integrations.find((integration) => integration.platform === 'codeforces'),
    [integrations],
  )
  const timezoneLabel =
    !profileUser.timezone || profileUser.timezone === 'UTC'
      ? 'IST'
      : profileUser.timezone

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setUsername(profileUser.publicSlug || profileUser.username || '')
    setIsPublicProfile(profileUser.profilePublic ?? false)
    setEmailOptIn(profileUser.emailOptIn ?? true)
    setDigestTime(profileUser.digestTime || '20:00')
    setLeetcodeHandle(initialProfileDraft.leetcodeId || profileUser.leetcodeHandle || '')
    setCodeforcesHandle(
      initialProfileDraft.codeforcesId || profileUser.codeforcesHandle || '',
    )
    setFeedback(null)
    setError(null)

    void fetchActiveIntegrationsForUser(profileUser.id)
      .then((items) => {
        setIntegrations(items)
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load integrations.'
        setError(message)
      })
  }, [initialProfileDraft.codeforcesId, initialProfileDraft.leetcodeId, isOpen, profileUser])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const syncDraft = (overrides: Partial<ProfileDraft>) => {
    if (typeof onDraftChange !== 'function') {
      return
    }

    onDraftChange({
      ...initialProfileDraft,
      ...overrides,
    })
  }

  const handleSaveUsername = async () => {
    const trimmedUsername = username.trim().replace(/^@+/, '')

    if (!trimmedUsername) {
      setError('Username cannot be empty.')
      return
    }

    setIsSavingUsername(true)
    setError(null)
    setFeedback(null)

    try {
      await updateUsernameForUser(profileUser.id, trimmedUsername)
      syncDraft({ username: trimmedUsername })
      await onProfileUpdated(trimmedUsername)
      setFeedback('Username updated.')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update username.'
      setError(message)
    } finally {
      setIsSavingUsername(false)
    }
  }

  const handleToggleEmailOptIn = async (nextValue: boolean) => {
    setIsSavingNotifications(true)
    setError(null)
    setFeedback(null)

    try {
      await updateEmailOptInForUser(profileUser.id, nextValue)
      setEmailOptIn(nextValue)
      await onProfileUpdated()
      setFeedback('Email digest preference updated.')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update email digest preference.'
      setError(message)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handleTogglePublicProfile = async (nextValue: boolean) => {
    setIsSavingPrivacy(true)
    setError(null)
    setFeedback(null)

    try {
      await updateProfilePublicForUser(profileUser.id, nextValue)
      setIsPublicProfile(nextValue)
      await onProfileUpdated()
      setFeedback(
        nextValue ? 'Public profile enabled.' : 'Public profile disabled.',
      )
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update profile privacy.'
      setError(message)
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleSaveDigestTime = async () => {
    if (!digestTime) {
      setError('Choose a digest time first.')
      return
    }

    setIsSavingNotifications(true)
    setError(null)
    setFeedback(null)

    try {
      await updateDigestTimeForUser(profileUser.id, digestTime)
      await onProfileUpdated()
      setFeedback('Digest time updated.')
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update digest time.'
      setError(message)
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const reloadIntegrations = async () => {
    const items = await fetchActiveIntegrationsForUser(profileUser.id)
    setIntegrations(items)
    await onProfileUpdated()
  }

  const handleConnectManualIntegration = async (
    platform: 'leetcode' | 'codeforces',
    handle: string,
  ) => {
    const trimmedHandle = handle.trim()
    const currentIntegration =
      platform === 'leetcode' ? leetcodeIntegration : codeforcesIntegration

    if (!trimmedHandle) {
      setError(`Enter your ${platform} handle first.`)
      return
    }

    setBusyIntegration(platform)
    setError(null)
    setFeedback(null)

    try {
      if (
        currentIntegration &&
        currentIntegration.handle.toLowerCase() !== trimmedHandle.toLowerCase()
      ) {
        await disconnectIntegrationForUser(currentIntegration.id)
      }

      await createIntegrationForUser(profileUser.id, platform, trimmedHandle)
      if (platform === 'leetcode') {
        syncDraft({ leetcodeId: trimmedHandle })
      } else {
        syncDraft({ codeforcesId: trimmedHandle })
      }
      await reloadIntegrations()
      setFeedback(`${platform} integration updated.`)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : `Unable to connect ${platform}.`
      setError(message)
    } finally {
      setBusyIntegration(null)
    }
  }

  const handleDisconnectIntegration = async (
    integration: BackendIntegration,
  ) => {
    setBusyIntegration(integration.platform)
    setError(null)
    setFeedback(null)

    try {
      await disconnectIntegrationForUser(integration.id)
      if (integration.platform === 'leetcode') {
        setLeetcodeHandle('')
        syncDraft({ leetcodeId: '' })
      }

      if (integration.platform === 'codeforces') {
        setCodeforcesHandle('')
        syncDraft({ codeforcesId: '' })
      }

      await reloadIntegrations()
      setFeedback(`${integration.platform} integration disconnected.`)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to disconnect integration.'
      setError(message)
    } finally {
      setBusyIntegration(null)
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/72 px-4 py-6 backdrop-blur-sm md:px-6 md:py-10"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="settings-scrollbar max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#080808] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Settings
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">
              Manage your DevTrackr profile and sync preferences.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              This dialog only exposes controls that match the current backend APIs.
            </p>
          </div>
          <button
            aria-label="Close settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {feedback ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <Check className="h-4 w-4 shrink-0" />
            {feedback}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-5">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-white/55" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
                Account
              </h3>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/70">
                  Username
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20"
                  onChange={(event) => {
                    setUsername(event.target.value)
                  }}
                  placeholder="@username"
                  type="text"
                  value={username}
                />
              </label>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingUsername}
                onClick={handleSaveUsername}
                type="button"
              >
                {isSavingUsername ? 'Saving...' : 'Save username'}
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Email</p>
              <p className="mt-2 text-sm text-white/75">{profileUser.email}</p>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              Privacy
            </h3>
            <div className="mt-4 grid gap-4">
              <ToggleRow
                checked={isPublicProfile}
                description="Control whether other people can open your public /@username profile page."
                disabled={isSavingPrivacy}
                label="Public profile"
                onChange={handleTogglePublicProfile}
              />
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Public URL preview
                </p>
                <p className="mt-2 text-sm text-white/75">
                  /@{profileUser.publicSlug || profileUser.username || username.trim()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              Notifications & Digest
            </h3>
            <div className="mt-4 grid gap-4">
              <ToggleRow
                checked={emailOptIn}
                description="Enable the daily digest email from your aggregated activity."
                disabled={isSavingNotifications}
                label="Email digest enabled"
                onChange={handleToggleEmailOptIn}
              />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-white/70">
                    Digest time
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
                    onChange={(event) => {
                      setDigestTime(event.target.value)
                    }}
                    type="time"
                    value={digestTime}
                  />
                </label>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSavingNotifications}
                  onClick={handleSaveDigestTime}
                  type="button"
                >
                  Save time
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Timezone</p>
                <p className="mt-2 text-sm text-white/75">
                  {timezoneLabel}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Timezone editing is not available yet.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              Integrations
            </h3>
            <div className="mt-4 grid gap-4">
              <IntegrationCard
                actionLabel={githubIntegration ? 'Reconnect GitHub' : 'Connect GitHub'}
                description="GitHub uses the existing OAuth flow for secure account linking."
                handleValue={
                  githubIntegration?.handle ||
                  profileUser.githubHandle ||
                  authSession.githubHandle ||
                  ''
                }
                inputPlaceholder=""
                isBusy={busyIntegration === 'github'}
                isConnected={Boolean(githubIntegration || profileUser.githubHandle)}
                onAction={() => {
                  onNavigateToAuthenticate()
                }}
                onDisconnect={
                  githubIntegration
                    ? () => {
                        void handleDisconnectIntegration(githubIntegration)
                      }
                    : undefined
                }
                title="GitHub"
              />
              <IntegrationCard
                actionLabel={leetcodeIntegration ? 'Update LeetCode' : 'Connect LeetCode'}
                description="Add the handle you want DevTrackr to track for accepted problems."
                handleValue={leetcodeHandle}
                inputPlaceholder="tourist"
                isBusy={busyIntegration === 'leetcode'}
                isConnected={Boolean(leetcodeIntegration)}
                onAction={() => {
                  void handleConnectManualIntegration('leetcode', leetcodeHandle)
                }}
                onDisconnect={
                  leetcodeIntegration
                    ? () => {
                        void handleDisconnectIntegration(leetcodeIntegration)
                      }
                    : undefined
                }
                onHandleChange={setLeetcodeHandle}
                title="LeetCode"
              />
              <IntegrationCard
                actionLabel={
                  codeforcesIntegration ? 'Update Codeforces' : 'Connect Codeforces'
                }
                description="Add the handle you want DevTrackr to track for contest-style solves."
                handleValue={codeforcesHandle}
                inputPlaceholder="tourist"
                isBusy={busyIntegration === 'codeforces'}
                isConnected={Boolean(codeforcesIntegration)}
                onAction={() => {
                  void handleConnectManualIntegration('codeforces', codeforcesHandle)
                }}
                onDisconnect={
                  codeforcesIntegration
                    ? () => {
                        void handleDisconnectIntegration(codeforcesIntegration)
                      }
                    : undefined
                }
                onHandleChange={setCodeforcesHandle}
                title="Codeforces"
              />
            </div>
          </section>

          {/* <section className="rounded-[24px] border border-white/10 bg-white/[0.015] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
              Send Digest
            </h3>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Send your digest immediately</p>
                <p className="mt-1 text-sm leading-6 text-white/45">
                  Send the current digest email right away using your saved preferences.
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSendingDigest}
                onClick={handleSendDigestNow}
                type="button"
              >
                {isSendingDigest ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {isSendingDigest ? 'Sending...' : 'Send digest now'}
              </button>
            </div>
          </section> */}
        </div>
      </div>
    </div>
  )
}
