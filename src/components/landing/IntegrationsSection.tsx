import { SectionHeading } from './SectionHeading'

type IntegrationCard = {
  name: string
  description: string
  tags: string[]
}

type IntegrationsSectionProps = {
  integrations: IntegrationCard[]
}

export function IntegrationsSection({
  integrations,
}: IntegrationsSectionProps) {
  return (
    <section
      className="border-t border-white/10 bg-white/[0.01] px-6 py-24 md:px-8"
      id="integrations"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Connected platforms"
          title="Connect in seconds"
          description="Scheduled workers collect events from platform APIs, map them into a standard activity format, calculate daily metrics, and dispatch a personalized digest to your inbox."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {integrations.map((integration) => (
            <article
              key={integration.name}
              className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold tracking-[-0.03em] text-white">
                {integration.name}
              </h3>
              <p className="mb-6 mt-4 text-sm leading-7 text-white/60">
                {integration.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {integration.tags.map((tag) => (
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
