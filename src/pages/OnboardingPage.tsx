import { useMemo, useState } from 'react'
import type { AuthSession, BackendSyncResult, ProfileDraft } from '../types/app'

type OnboardingPageProps = {
  authSession: AuthSession
  initialProfileDraft: ProfileDraft
  onDraftChange: (draft: ProfileDraft) => void
  onCreateProfile: (draft: ProfileDraft) => Promise<BackendSyncResult>
  onBackToAuth: () => void
}

type StepId = 'username' | 'leetcode' | 'codeforces' | 'review'

function getInitialStep(profileDraft: ProfileDraft): StepId {
  if (!profileDraft.username) {
    return 'username'
  }

  if (!profileDraft.leetcodeId) {
    return 'leetcode'
  }

  if (!profileDraft.codeforcesId) {
    return 'codeforces'
  }

  return 'review'
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

  const githubLabel = authSession.githubHandle || 'GitHub connected'
  const usernameValue = username.trim()
  const leetcodeValue = leetcodeId.trim()
  const codeforcesValue = codeforcesId.trim()

  const stepOrder = useMemo<StepId[]>(
    () => ['username', 'leetcode', 'codeforces', 'review'],
    [],
  )

  const activeStepNumber = stepOrder.indexOf(step) + 1

  const commitDraft = (overrides: Partial<ProfileDraft>) => {
    onDraftChange({
      ...initialProfileDraft,
      username,
      leetcodeId,
      codeforcesId,
      ...overrides,
    })
  }

  const advance = (nextStep: StepId) => {
    setStepKey((current) => current + 1)
    setStep(nextStep)
  }

  if (authSession.status !== 'connected') {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white px-8 py-10 text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50">
            Onboarding
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-black">
            GitHub needs to be connected before onboarding starts.
          </h1>
          <button
            className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
            onClick={onBackToAuth}
            type="button"
          >
            Back to authentication
          </button>
        </div>
      </main>
    )
  }

  const handleContinueUsername = () => {
    if (!usernameValue) {
      setWarning('Add a username first so we can create your profile route.')
      return
    }

    setWarning(null)
    setUsername(usernameValue)
    commitDraft({ username: usernameValue })
    advance('leetcode')
  }

  const handleLeetcodeEnter = () => {
    if (!leetcodeValue) {
      setWarning('Enter your LeetCode id or use Skip.')
      return
    }

    setWarning(null)
    setLeetcodeId(leetcodeValue)
    commitDraft({ leetcodeId: leetcodeValue })
    advance('codeforces')
  }

  const handleCodeforcesEnter = () => {
    if (!codeforcesValue) {
      setWarning('Enter your Codeforces id or use Skip.')
      return
    }

    setWarning(null)
    setCodeforcesId(codeforcesValue)
    commitDraft({ codeforcesId: codeforcesValue })
    advance('review')
  }

  const handleCreateProfile = async () => {
    if (!usernameValue) {
      setWarning('Username is required before the profile can be created.')
      advance('username')
      return
    }

    setIsSubmitting(true)
    setWarning(null)

    const result = await onCreateProfile({
      ...initialProfileDraft,
      username: usernameValue,
      leetcodeId: leetcodeValue,
      codeforcesId: codeforcesValue,
    })

    setIsSubmitting(false)

    if (!result.ok && result.warning) {
      setWarning(result.warning)
    }
  }

  return (
    <main className="page-shell flex min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-10 lg:flex-row lg:items-center">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Onboarding
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-[-0.06em] text-white md:text-6xl">
            Shape your public developer profile one handle at a time.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/60">
            GitHub is connected, and the rest of your setup moves in compact
            steps so the profile feels intentional instead of overwhelming.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
              {githubLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70">
              Step {activeStepNumber} of {stepOrder.length}
            </span>
          </div>
        </section>

        <section className="w-full max-w-xl">
          <div
            className="stage-card rounded-[32px] bg-white p-8 text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
            key={`${step}-${stepKey}`}
          >
            {step === 'username' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
                  Username
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-black">
                  Choose the route name for your DevTrackr page.
                </h2>
                <label className="mt-8 block">
                  <span className="mb-3 block text-sm font-medium text-black/70">
                    Username
                  </span>
                  <input
                    className="w-full rounded-2xl border border-black px-4 py-4 text-base text-black outline-none transition placeholder:text-black/35 focus:-translate-y-px"
                    onChange={(event) => {
                      setUsername(event.target.value)
                    }}
                    placeholder="@yourname"
                    type="text"
                    value={username}
                  />
                </label>
                <button
                  className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
                  onClick={handleContinueUsername}
                  type="button"
                >
                  Continue
                </button>
              </>
            ) : null}

            {step === 'leetcode' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
                  LeetCode
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-black">
                  Add your LeetCode id if you want daily solves pulled in.
                </h2>
                <label className="mt-8 block">
                  <span className="mb-3 block text-sm font-medium text-black/70">
                    LeetCode id
                  </span>
                  <input
                    className="w-full rounded-2xl border border-black px-4 py-4 text-base text-black outline-none transition placeholder:text-black/35 focus:-translate-y-px"
                    onChange={(event) => {
                      setLeetcodeId(event.target.value)
                    }}
                    placeholder="tourist"
                    type="text"
                    value={leetcodeId}
                  />
                </label>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
                    onClick={handleLeetcodeEnter}
                    type="button"
                  >
                    Enter
                  </button>
                  <button
                    className="inline-flex min-h-13 items-center justify-center rounded-full bg-[#efefef] px-7 text-sm font-semibold text-black transition hover:bg-[#e2e2e2]"
                    onClick={() => {
                      setWarning(null)
                      setLeetcodeId('')
                      commitDraft({ leetcodeId: '' })
                      advance('codeforces')
                    }}
                    type="button"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : null}

            {step === 'codeforces' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
                  Codeforces
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-black">
                  Add your Codeforces id if you want contest solves included too.
                </h2>
                <label className="mt-8 block">
                  <span className="mb-3 block text-sm font-medium text-black/70">
                    Codeforces id
                  </span>
                  <input
                    className="w-full rounded-2xl border border-black px-4 py-4 text-base text-black outline-none transition placeholder:text-black/35 focus:-translate-y-px"
                    onChange={(event) => {
                      setCodeforcesId(event.target.value)
                    }}
                    placeholder="tourist"
                    type="text"
                    value={codeforcesId}
                  />
                </label>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
                    onClick={handleCodeforcesEnter}
                    type="button"
                  >
                    Enter
                  </button>
                  <button
                    className="inline-flex min-h-13 items-center justify-center rounded-full bg-[#efefef] px-7 text-sm font-semibold text-black transition hover:bg-[#e2e2e2]"
                    onClick={() => {
                      setWarning(null)
                      setCodeforcesId('')
                      commitDraft({ codeforcesId: '' })
                      advance('review')
                    }}
                    type="button"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : null}

            {step === 'review' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
                  Create profile
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-black">
                  Lock in the profile and publish your route.
                </h2>

                <div className="mt-8 space-y-3">
                  <div className="rounded-3xl border border-black/10 bg-[#f7f7f7] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                      Username
                    </p>
                    <p className="mt-2 text-lg font-semibold text-black">
                      @{usernameValue}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-[#f7f7f7] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                      GitHub
                    </p>
                    <p className="mt-2 text-lg font-semibold text-black">
                      {githubLabel}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-[#f7f7f7] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                      LeetCode
                    </p>
                    <p className="mt-2 text-lg font-semibold text-black">
                      {leetcodeValue || 'Skipped for now'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-[#f7f7f7] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/45">
                      Codeforces
                    </p>
                    <p className="mt-2 text-lg font-semibold text-black">
                      {codeforcesValue || 'Skipped for now'}
                    </p>
                  </div>
                </div>

                <button
                  className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c] disabled:cursor-not-allowed disabled:bg-[#3a3a3a]"
                  disabled={isSubmitting}
                  onClick={handleCreateProfile}
                  type="button"
                >
                  {isSubmitting ? 'Creating profile...' : 'Create profile'}
                </button>
              </>
            ) : null}

            {warning ? (
              <p className="mt-6 rounded-2xl bg-[#f3f3f3] px-4 py-3 text-sm leading-6 text-black/70">
                {warning}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
