import { ClosingSection } from '../components/landing/ClosingSection'
import { HeroSection } from '../components/landing/HeroSection'
import { IntegrationsSection } from '../components/landing/IntegrationsSection'
import { SignalSection } from '../components/landing/SignalSection'
import { SiteFooter } from '../components/landing/SiteFooter'
import { SiteHeader } from '../components/landing/SiteHeader'

const signalCards = [
  {
    tags: ['Daily tracking', 'API sync'],
    title: 'Multi-platform aggregation',
    description:
      'Automatically fetch GitHub push events, LeetCode accepted submissions by difficulty, and Codeforces problem verdicts into one daily view.',
    kicker: 'Collect',
  },
  {
    tags: ['Unified streaks', 'Consistency'],
    title: 'Unified streaks',
    description:
      'Keep one comprehensive streak alive through activity on any connected platform instead of tracking each source by hand.',
    kicker: 'Normalize',
  },
  {
    tags: ['Daily digest', 'Email'],
    title: 'Nightly email digest',
    description:
      'Receive a clean summary of your daily metrics in your inbox every night, without needing to open three separate platforms.',
    kicker: 'Dispatch',
  },
]

const integrationCards = [
  {
    name: 'GitHub',
    description:
      'Track push activity from your repositories so real project work counts toward the same daily habit you are building elsewhere.',
    tags: ['Daily tracking', 'Unified streaks'],
  },
  {
    name: 'LeetCode',
    description:
      'Capture accepted problems with difficulty breakdowns so practice quality is visible, not just total volume.',
    tags: ['Daily tracking', 'Unified streaks'],
  },
  {
    name: 'Codeforces',
    description:
      'Pull contest-style solves into the same timeline so competitive programming contributes to your overall consistency.',
    tags: ['Daily tracking', 'Unified streaks'],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main>
        <HeroSection />
        <SignalSection cards={signalCards} />
        <IntegrationsSection integrations={integrationCards} />
        <ClosingSection />
      </main>
      <SiteFooter />
    </div>
  )
}
