import { ProfilePreview } from './ProfilePreview'

type HeroSectionProps = {
  onGetStarted: () => void
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section
      id="top"
      style={{
        position: 'relative',
        paddingTop: 120,
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 100% 55% at 50% 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 55% at 50% 0%, black 30%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 40px' }}>

        {/* Headline */}
        <h1
          className="animate-fade-up"
          style={{
            fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 700, letterSpacing: '-0.04em',
            lineHeight: 1.1, color: '#fff', maxWidth: 1000, margin: '0 auto 30px', textAlign: 'center',
          }}
        >
          The coding habit tracker for<br />
          <span style={{ color: 'rgba(255,255,255,0.28)' }}>developers who ship.</span>
        </h1>

        {/* CTAs */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 44, animationDelay: '100ms' }}>
          <button
            onClick={onGetStarted} type="button"
            style={{
              height: 38, padding: '0 18px', background: '#fff', color: '#000', border: '1px solid #fff',
              borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '-0.01em', transition: 'opacity 0.15s', display: 'inline-flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Get Started
          </button>
          <a
            href="#product"
            style={{
              height: 38, padding: '0 16px', background: 'transparent', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 500,
              letterSpacing: '-0.01em', textDecoration: 'none', transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
          >
            how it works
          </a>
        </div>

        {/* Profile preview — fades out at bottom */}
        <div className="animate-fade-up" style={{ position: 'relative', width: '100%', maxWidth: 1000, margin: '0 auto', transform: 'scale(1.4)', transformOrigin: 'top center', marginTop: -32, animationDelay: '180ms' }}>
          <div style={{ position: 'relative', zIndex: 1, boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.8)', borderRadius: 14 }}>
            <ProfilePreview />
          </div>
          {/* Gradient fade overlay */}
          <div
            aria-hidden
            style={{
              position: 'absolute', bottom: -2, left: -2, right: -2, height: '45%',
              background: 'linear-gradient(to bottom, transparent 0%, #000 100%)',
              zIndex: 2, pointerEvents: 'none', borderRadius: '0 0 14px 14px',
            }}
          />
        </div>
      </div>
    </section>
  )
}
