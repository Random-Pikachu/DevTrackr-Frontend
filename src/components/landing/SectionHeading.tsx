type SectionHeadingProps = {
  eyebrow: string
  title: string
  description: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-4xl">
      <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
        {eyebrow}
      </span>
      <h2 className="max-w-4xl text-4xl font-bold leading-[1.04] tracking-[-0.05em] text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
        {description}
      </p>
    </div>
  )
}
