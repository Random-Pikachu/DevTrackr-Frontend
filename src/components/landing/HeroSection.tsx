const feedRows = [
  { label: 'GitHub push events', value: '12' },
  { label: 'LeetCode accepted', value: '5' },
  { label: 'Codeforces solved', value: '2' },
  { label: 'Unified streak', value: '19 days' },
]

type HeroSectionProps = {
  onGetStarted: () => void
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-32 pt-24 md:px-8" id="top">
      <div className="grid items-center gap-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="max-w-2xl">
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Unified developer streaks
          </span>
          <h1 className="max-w-5xl text-5xl font-bold leading-[0.95] tracking-[-0.06em] md:text-7xl">
            Track your coding habit across GitHub, LeetCode, and Codeforces.
          </h1>
          

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold !text-black transition hover:bg-white/90"
              onClick={onGetStarted}
              type="button"
            >
              Get started
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:p-10">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              <span>Nightly digest</span>
            </div>
            <div className="mb-6 text-xs text-white/40">11:30 PM</div>

            <div>
              <h2 className="max-w-md text-2xl font-bold tracking-[-0.04em] text-white lg:text-3xl">
                One scoreboard for your daily coding output.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
                Activity on any connected platform keeps the streak alive and
                lands in a clean email summary.
              </p>
            </div>

            <div className="mb-6 mt-8 space-y-3">
              {feedRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/10 px-5 py-4"
                >
                  <span className="text-sm text-white/80">{row.label}</span>
                  <strong className="text-base font-semibold text-white">
                    {row.value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 text-xs leading-6 text-white/40">
              Collected, normalized, and dispatched • GitHub • LeetCode •
              Codeforces
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
