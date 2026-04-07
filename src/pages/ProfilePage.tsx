import type { ProfileDraft } from '../types/app'

type ProfilePageProps = {
  requestedUsername: string
  profileDraft: ProfileDraft
  onRestart: () => void
}

export function ProfilePage({
  requestedUsername,
  profileDraft,
  onRestart,
}: ProfilePageProps) {
  const username = profileDraft.username || requestedUsername

  return (
    <main className="page-shell flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
      <div className="w-full max-w-3xl rounded-[40px] border border-white/10 bg-white px-8 py-14 text-center text-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
          /@{username}
        </p>
        <h1 className="mt-6 text-5xl font-bold tracking-[-0.06em] text-black md:text-7xl">
          Hello WOorld
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-black/60">
          Your route is live and ready for the next dashboard iteration.
        </p>
        <button
          className="mt-10 inline-flex min-h-13 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#1c1c1c]"
          onClick={onRestart}
          type="button"
        >
          Edit profile
        </button>
      </div>
    </main>
  )
}
