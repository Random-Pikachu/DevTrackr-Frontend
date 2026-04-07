type NotFoundPageProps = {
  onGoHome: () => void
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
          Route not found
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-[-0.06em] text-white">
          This page does not exist yet.
        </h1>
        <button
          className="mt-8 inline-flex min-h-13 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-[#e2e2e2]"
          onClick={onGoHome}
          type="button"
        >
          Return home
        </button>
      </div>
    </main>
  )
}
