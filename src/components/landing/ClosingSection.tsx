type ClosingSectionProps = {
  onGetStarted: () => void
}

export function ClosingSection({ onGetStarted }: ClosingSectionProps) {
  return (
    <section className="border-t border-white/10 px-6 py-32 md:px-8" id="launchpad">
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
          Why DevTrackr
        </span>
        <h2 className="mx-auto mt-8 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl">
          A single source of truth for your daily coding habit.
        </h2>
        <p className="mx-auto mb-12 mt-8 max-w-2xl text-lg leading-8 text-white/60">
          Your activity is scattered across project work, interview prep, and
          competitive programming. DevTrackr brings those signals together so
          consistency becomes visible and easier to maintain.
        </p>
        <button
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-10 py-4 text-base font-semibold !text-black transition hover:bg-white/90"
          onClick={onGetStarted}
          type="button"
        >
          Start tracking your habit
        </button>
      </div>
    </section>
  )
}
