import { SectionHeading } from './SectionHeading'

type SignalCard = {
  title: string
  description: string
  kicker: string
  tags: string[]
}

type SignalSectionProps = {
  cards: SignalCard[]
}

export function SignalSection({ cards }: SignalSectionProps) {
  return (
    <section className="border-t border-white/10 px-6 py-24 md:px-8" id="product">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Why DevTrackr"
          title="A single source of truth for your daily coding habit."
          description="Your activity is scattered across project work, interview prep, and competitive programming. DevTrackr brings those signals together so consistency becomes visible and easier to maintain."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition hover:bg-white/[0.05]"
            >
              <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                {card.kicker}
              </span>
              <h3 className="text-xl font-bold tracking-[-0.03em] text-white">
                {card.title}
              </h3>
              <p className="mb-6 mt-4 text-sm leading-7 text-white/60">
                {card.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
