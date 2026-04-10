import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Code2, GitBranch, UserRound } from 'lucide-react'
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

const stepMeta: Record<
  StepId,
  {
    description: string
    label: string
    title: string
  }
> = {
  username: {
    label: 'Account',
    title: 'Choose the route name for your DevTrackr page.',
    description:
      'This becomes your public profile slug and the main identity for your shared page.',
  },
  leetcode: {
    label: 'LeetCode',
    title: 'Add your LeetCode handle if you want solves to count too.',
    description:
      'You can skip it for now and come back later from settings without losing progress.',
  },
  codeforces: {
    label: 'Codeforces',
    title: 'Add your Codeforces handle to bring contest solves into the same streak.',
    description:
      'This is optional as well, but it helps keep the contribution map complete.',
  },
  review: {
    label: 'Review',
    title: 'Review the profile details before publishing your route.',
    description:
      'Once created, we will send you straight to your public DevTrackr profile.',
  },
}

function buildDraft(
  initialProfileDraft: ProfileDraft,
  username: string,
  leetcodeId: string,
  codeforcesId: string,
  overrides: Partial<ProfileDraft> = {},
) {
  return {
    ...initialProfileDraft,
    username,
    leetcodeId,
    codeforcesId,
    ...overrides,
  }
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
  const usernameValue = username.trim().replace(/^@+/, '')
  const leetcodeValue = leetcodeId.trim()
  const codeforcesValue = codeforcesId.trim()

  const stepOrder = useMemo<StepId[]>(
    () => ['username', 'leetcode', 'codeforces', 'review'],
    [],
  )

  const activeStepNumber = stepOrder.indexOf(step) + 1

  const advance = (nextStep: StepId) => {
    setStepKey((current) => current + 1)
    setStep(nextStep)
  }

  const commitDraft = (overrides: Partial<ProfileDraft>) => {
    onDraftChange(
      buildDraft(
        initialProfileDraft,
        usernameValue,
        leetcodeValue,
        codeforcesValue,
        overrides,
      ),
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

    const result = await onCreateProfile(
      buildDraft(initialProfileDraft, usernameValue, leetcodeValue, codeforcesValue),
    )

    setIsSubmitting(false)

    if (!result.ok && result.warning) {
      setWarning(result.warning)
    }
  }

  const handleSkipLeetcode = () => {
    setWarning(null)
    setLeetcodeId('')
    commitDraft({ leetcodeId: '' })
    advance('codeforces')
  }

  const handleSkipCodeforces = () => {
    setWarning(null)
    setCodeforcesId('')
    commitDraft({ codeforcesId: '' })
    advance('review')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName || ''

      if (tagName === 'TEXTAREA' || target?.getAttribute('data-skip-enter') === 'true') {
        return
      }

      event.preventDefault()

      if (step === 'username') {
        handleContinueUsername()
        return
      }

      if (step === 'leetcode') {
        handleLeetcodeEnter()
        return
      }

      if (step === 'codeforces') {
        handleCodeforcesEnter()
        return
      }

      if (step === 'review' && !isSubmitting) {
        void handleCreateProfile()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [codeforcesValue, isSubmitting, leetcodeValue, step, usernameValue])

  if (authSession.status !== 'connected') {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#080808] px-8 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
            Onboarding
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-white">
            GitHub needs to be connected before onboarding starts.
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/50">
            Your onboarding flow is locked until the GitHub OAuth step is completed.
          </p>
          <button
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
            onClick={onBackToAuth}
            type="button"
          >
            Back to authentication
          </button>
        </div>
      </main>
    )
  }

  const meta = stepMeta[step]

  return (
    <main className="page-shell min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-12">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Onboarding
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-white md:text-6xl">
              Shape your public developer profile one handle at a time.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
              GitHub is already connected. We just need a route name and any extra
              coding handles you want included in the same annual contribution map.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75">
                <GitBranch className="h-4 w-4 text-white/55" />
                {githubLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75">
                Step {activeStepNumber} of {stepOrder.length}
              </span>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {stepOrder.map((item, index) => {
                const isActive = item === step
                const isComplete = stepOrder.indexOf(item) < activeStepNumber - 1

                return (
                  <div
                    className={`rounded-[18px] border px-4 py-4 transition ${
                      isActive
                        ? 'border-white/20 bg-white/[0.05]'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                    key={item}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                        0{index + 1}
                      </p>
                      {isComplete ? (
                        <Check className="h-4 w-4 text-white/65" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">
                      {stepMeta[item].label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {stepMeta[item].description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <section className="stage-card rounded-[28px] border border-white/10 bg-[#090909] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              {meta.label}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-white">
              {meta.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/50">{meta.description}</p>

            <div className="mt-8" key={`${step}-${stepKey}`}>
              {step === 'username' ? (
                <div>
                  <label className="block">
                    <span className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
                      <UserRound className="h-4 w-4 text-white/45" />
                      Username
                    </span>
                    <input
                      autoFocus
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/20"
                      onChange={(event) => {
                        setUsername(event.target.value)
                      }}
                      placeholder="@yourname"
                      type="text"
                      value={username}
                    />
                  </label>

                  <button
                    className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
                    onClick={handleContinueUsername}
                    type="button"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              {step === 'leetcode' ? (
                <div>
                  <label className="block">
                    <span className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
                      <Code2 className="h-4 w-4 text-white/45" />
                      LeetCode handle
                    </span>
                    <input
                      autoFocus
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/20"
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
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
                      onClick={handleLeetcodeEnter}
                      type="button"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={handleSkipLeetcode}
                      type="button"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 'codeforces' ? (
                <div>
                  <label className="block">
                    <span className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
                      <Code2 className="h-4 w-4 text-white/45" />
                      Codeforces handle
                    </span>
                    <input
                      autoFocus
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/20"
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
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
                      onClick={handleCodeforcesEnter}
                      type="button"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={handleSkipCodeforces}
                      type="button"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 'review' ? (
                <div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Username
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        @{usernameValue}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        GitHub
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {githubLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        LeetCode
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {leetcodeValue || 'Skipped for now'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Codeforces
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {codeforcesValue || 'Skipped for now'}
                      </p>
                    </div>
                  </div>

                  <button
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleCreateProfile()
                    }}
                    type="button"
                  >
                    {isSubmitting ? 'Creating profile...' : 'Create profile'}
                  </button>
                </div>
              ) : null}

              {warning ? (
                <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
                  {warning}
                </p>
              ) : null}

              <p className="mt-6 text-xs leading-6 text-white/35">
                Press Enter to continue on each step.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
