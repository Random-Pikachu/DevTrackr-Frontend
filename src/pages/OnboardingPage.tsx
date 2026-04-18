import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { AuthSession, BackendSyncResult, ProfileDraft } from '../types/app'

type OnboardingPageProps = {
  authSession: AuthSession
  initialProfileDraft: ProfileDraft
  onDraftChange: (draft: ProfileDraft) => void
  onCreateProfile: (draft: ProfileDraft) => Promise<BackendSyncResult>
  onBackToAuth: () => void
}

type StepId = 'username' | 'leetcode' | 'codeforces' | 'review'

const steps: { id: StepId; label: string; optional?: boolean }[] = [
  { id: 'username', label: 'Username' },
  { id: 'leetcode', label: 'LeetCode', optional: true },
  { id: 'codeforces', label: 'Codeforces', optional: true },
  { id: 'review', label: 'Review' },
]

function getInitialStep(draft: ProfileDraft): StepId {
  if (!draft.username) return 'username'
  if (!draft.leetcodeId) return 'leetcode'
  if (!draft.codeforcesId) return 'codeforces'
  return 'review'
}

function buildDraft(
  base: ProfileDraft,
  username: string,
  leetcodeId: string,
  codeforcesId: string,
  overrides: Partial<ProfileDraft> = {},
): ProfileDraft {
  return { ...base, username, leetcodeId, codeforcesId, ...overrides }
}

export function OnboardingPage({
  authSession,
  initialProfileDraft,
  onDraftChange,
  onCreateProfile,
  onBackToAuth,
}: OnboardingPageProps) {
  const [username, setUsername] = useState(initialProfileDraft.username)
  const [leetcodeId, setLeetcodeId] = useState(initialProfileDraft.leetcodeId)
  const [codeforcesId, setCodeforcesId] = useState(initialProfileDraft.codeforcesId)
  const [step, setStep] = useState<StepId>(getInitialStep(initialProfileDraft))
  const [stepKey, setStepKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const usernameValue = username.trim().replace(/^@+/, '')
  const leetcodeValue = leetcodeId.trim()
  const codeforcesValue = codeforcesId.trim()
  const stepOrder = useMemo<StepId[]>(() => ['username', 'leetcode', 'codeforces', 'review'], [])
  const activeIndex = stepOrder.indexOf(step)

  const advance = (nextStep: StepId) => {
    setStepKey((c) => c + 1)
    setStep(nextStep)
    setWarning(null)
  }

  const commitDraft = (overrides: Partial<ProfileDraft>) => {
    onDraftChange(buildDraft(initialProfileDraft, usernameValue, leetcodeValue, codeforcesValue, overrides))
  }

  const handleContinueUsername = () => {
    if (!usernameValue) { setWarning('Username is required.'); return }
    commitDraft({ username: usernameValue })
    advance('leetcode')
  }

  const handleLeetcodeEnter = () => {
    if (!leetcodeValue) { setWarning('Enter your handle or skip.'); return }
    commitDraft({ leetcodeId: leetcodeValue })
    advance('codeforces')
  }

  const handleCodeforcesEnter = () => {
    if (!codeforcesValue) { setWarning('Enter your handle or skip.'); return }
    commitDraft({ codeforcesId: codeforcesValue })
    advance('review')
  }

  const handleCreateProfile = async () => {
    if (!usernameValue) { setWarning('Username is required.'); advance('username'); return }
    setIsSubmitting(true)
    setWarning(null)
    const result = await onCreateProfile(buildDraft(initialProfileDraft, usernameValue, leetcodeValue, codeforcesValue))
    setIsSubmitting(false)
    if (!result.ok && result.warning) setWarning(result.warning)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'TEXTAREA' || target?.getAttribute('data-skip-enter') === 'true') return
      event.preventDefault()
      if (step === 'username') { handleContinueUsername(); return }
      if (step === 'leetcode') { handleLeetcodeEnter(); return }
      if (step === 'codeforces') { handleCodeforcesEnter(); return }
      if (step === 'review' && !isSubmitting) void handleCreateProfile()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [codeforcesValue, isSubmitting, leetcodeValue, step, usernameValue])

  if (authSession.status !== 'connected') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6" style={{ background: '#000' }}>
        <div className="animate-fade-up card w-full" style={{ maxWidth: 400, padding: '32px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}>
            GitHub auth required
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.44)', marginTop: 8, lineHeight: 1.6 }}>
            Complete the GitHub OAuth step before continuing to onboarding.
          </p>
          <button className="btn-ghost mt-6" onClick={onBackToAuth} type="button">
            Back to authentication
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex min-h-screen items-start justify-center px-6 py-16"
      style={{ background: '#000' }}
    >
      <div className="animate-fade-up w-full" style={{ maxWidth: 760, paddingTop: 48 }}>

        {/* Step progress row */}
        <div className="mb-10 flex items-center gap-0">
          {steps.map((s, i) => {
            const isComplete = i < activeIndex
            const isActive = s.id === step

            return (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: isActive
                        ? '1px solid rgba(255,255,255,0.5)'
                        : isComplete
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: isComplete ? '#fff' : isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isComplete ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="mono" style={{ fontSize: 9, color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'rgba(255,255,255,0.8)' : isComplete ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.24)',
                    }}
                  >
                    {s.label}
                    {s.optional && (
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}> (optional)</span>
                    )}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step card */}
        <div className="card" style={{ padding: '36px 36px 40px', borderRadius: 14 }} key={`${step}-${stepKey}`}>
          <div style={{ marginBottom: 28 }}>
            <span className="section-label" style={{ marginBottom: 8, display: 'block' }}>
              {steps[activeIndex]?.label}
              {steps[activeIndex]?.optional && ' — optional'}
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2 }}>
              {step === 'username' && 'Choose your public profile handle.'}
              {step === 'leetcode' && 'Link your LeetCode account.'}
              {step === 'codeforces' && 'Link your Codeforces account.'}
              {step === 'review' && 'Looks good? Publish your profile.'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginTop: 8, lineHeight: 1.6 }}>
              {step === 'username' && 'This becomes your route: devtrackr.app/@yourname. Only alphanumeric and dashes.'}
              {step === 'leetcode' && 'We will track accepted submissions and include them in your streak and heatmap.'}
              {step === 'codeforces' && 'Contest-style problem solves will appear in your daily digest and contribution map.'}
              {step === 'review' && 'Once created, you will be taken straight to your live profile page.'}
            </p>
          </div>

          {/* Field */}
          {step === 'username' && (
            <div>
              <div className="flex items-center overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,0.24)', background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                  @
                </span>
                <input
                  autoFocus
                  className="dt-input"
                  style={{ border: 'none', borderRadius: 0 }}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourhandle"
                  type="text"
                  value={username}
                />
              </div>
              {authSession.githubHandle && (
                <button
                  className="mt-2 text-left"
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setUsername(authSession.githubHandle || '')}
                  type="button"
                >
                  Use GitHub handle: {authSession.githubHandle}
                </button>
              )}
            </div>
          )}

          {(step === 'leetcode' || step === 'codeforces') && (
            <input
              autoFocus
              className="dt-input"
              onChange={(e) => step === 'leetcode' ? setLeetcodeId(e.target.value) : setCodeforcesId(e.target.value)}
              placeholder="tourist"
              type="text"
              value={step === 'leetcode' ? leetcodeId : codeforcesId}
            />
          )}

          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Username', value: `@${usernameValue}` },
                { label: 'GitHub', value: authSession.githubHandle || '—' },
                { label: 'LeetCode', value: leetcodeValue || 'Not connected' },
                { label: 'Codeforces', value: codeforcesValue || 'Not connected' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                  }}
                >
                  <span className="section-label">{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Warning */}
          {warning && (
            <div
              className="mt-4 rounded-lg px-3.5 py-3"
              style={{ border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.06)', fontSize: 12, color: 'rgba(255,160,160,0.9)' }}
            >
              {warning}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3">
            {step !== 'review' ? (
              <>
                <button
                  className="btn-primary"
                  style={{ height: 38 }}
                  onClick={
                    step === 'username' ? handleContinueUsername
                    : step === 'leetcode' ? handleLeetcodeEnter
                    : handleCodeforcesEnter
                  }
                  type="button"
                >
                  Continue <ArrowRight size={13} />
                </button>
                {(step === 'leetcode' || step === 'codeforces') && (
                  <button
                    className="btn-ghost"
                    style={{ height: 38 }}
                    onClick={step === 'leetcode'
                      ? () => { setWarning(null); setLeetcodeId(''); commitDraft({ leetcodeId: '' }); advance('codeforces') }
                      : () => { setWarning(null); setCodeforcesId(''); commitDraft({ codeforcesId: '' }); advance('review') }}
                    type="button"
                  >
                    Skip
                  </button>
                )}
              </>
            ) : (
              <button
                className="btn-primary"
                style={{ height: 38, opacity: isSubmitting ? 0.6 : 1 }}
                disabled={isSubmitting}
                onClick={() => void handleCreateProfile()}
                type="button"
              >
                {isSubmitting ? 'Creating profile…' : 'Create profile'}
              </button>
            )}
          </div>

          <p className="mt-5 section-label">
            Press Enter to continue at each step
          </p>
        </div>
      </div>
    </main>
  )
}
