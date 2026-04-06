import logoMark from '../../assets/devtrackr-mark.svg'

const navItems = [
  { label: 'Overview', href: '#product' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'How it works', href: '#launchpad' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="DevTrackr home">
          <img
            className="h-8 w-8 rounded-md bg-white object-cover p-1.5"
            src={logoMark}
            alt=""
          />
          <span className="text-lg font-bold tracking-[-0.03em] text-white">
            DevTrackr
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-white/70 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold !text-black transition hover:bg-white/90"
  
        >
          Get started
        </a>
      </div>
    </header>
  )
}
