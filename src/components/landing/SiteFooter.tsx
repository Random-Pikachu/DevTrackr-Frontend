import logoMark from '../../assets/devtrackr-mark.svg'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img
            className="h-8 w-8 rounded-md bg-white object-cover p-1.5"
            src={logoMark}
            alt=""
          />
          <span className="text-sm font-semibold text-white">DevTrackr</span>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-white/50">
            Aggregate daily developer activity across GitHub, LeetCode, and
            Codeforces into one lightweight summary and a streak worth keeping.
        </p>
      </div>
    </footer>
  )
}
