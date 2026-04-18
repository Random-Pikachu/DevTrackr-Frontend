import { ClosingSection } from '../components/landing/ClosingSection'
import { HeroSection } from '../components/landing/HeroSection'
import { IntegrationsSection } from '../components/landing/IntegrationsSection'
import { SignalSection } from '../components/landing/SignalSection'
import { SiteFooter } from '../components/landing/SiteFooter'
import { SiteHeader } from '../components/landing/SiteHeader'

const signalCards = [
  {
    kicker: 'Collect',
    title: 'Multi-platform aggregation',
    description:
      'Scheduled workers pull GitHub push events, LeetCode accepted submissions, and Codeforces verdicts into a single normalized timeline—automatically.',
    tags: ['GitHub', 'LeetCode', 'Codeforces'],
  },
  {
    kicker: 'Normalize',
    title: 'One unified streak',
    description:
      'Activity on any connected platform extends the same streak. No more checking three dashboards to know if your chain is alive.',
    tags: ['Streak tracking', 'Daily habit'],
  },
  {
    kicker: 'Dispatch',
    title: 'Nightly email digest',
    description:
      'A clean summary lands in your inbox each night—commit count, problems solved, streak length. Digest time is configurable per timezone.',
    tags: ['Email digest', 'Scheduled'],
  },
]

const integrationCards = [
  {
    name: 'GitHub',
    description:
      'Connects via OAuth. Push events from all your repositories are fetched daily and mapped to the contribution heatmap.',
    tags: ['OAuth', 'Push events', 'Repos'],
  },
  {
    name: 'LeetCode',
    description:
      'Handle-based tracking of accepted submissions. Easy, Medium, and Hard counts are broken out and included in the digest.',
    tags: ['Handle', 'Accepted only', 'Difficulty'],
  },
  {
    name: 'Codeforces',
    description:
      'Contest-style solves pulled by handle. Problem rating and tags are preserved and displayed on your day-detail view.',
    tags: ['Handle', 'Verdicts', 'Rating'],
  },
]

type HomePageProps = {
  onGetStarted: () => void
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <SiteHeader onGetStarted={onGetStarted} />
      <main>
        <HeroSection onGetStarted={onGetStarted} />
        <SignalSection cards={signalCards} />
        <IntegrationsSection integrations={integrationCards} />
        <ClosingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
