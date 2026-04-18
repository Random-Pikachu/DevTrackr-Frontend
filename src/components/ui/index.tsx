import { type ReactNode } from 'react'

// ─── Simple CSS-animation wrappers ───────────────────────────────────────────
// These use the CSS animations defined in index.css for zero-dependency motion.
// For anything needing JS-driven animation, framer-motion can be layered in.

type FadeUpProps = {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeUp({ children, delay = 0, className = '' }: FadeUpProps) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}

export function FadeIn({ children, delay = 0, className = '' }: FadeUpProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}

// ─── Stagger container ────────────────────────────────────────────────────────
type StaggerProps = {
  children: ReactNode[]
  baseDelay?: number
  step?: number
  className?: string
}

export function Stagger({ children, baseDelay = 0, step = 60, className = '' }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className="animate-fade-up"
          style={{ animationDelay: `${baseDelay + i * step}ms`, animationFillMode: 'both' }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
type SkeletonProps = {
  className?: string
  height?: number | string
  width?: number | string
}

export function Skeleton({ className = '', height, width }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded-md ${className}`}
      style={{ height, width }}
    />
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeProps = {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-white/[0.06] text-white/55 border-white/8',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error:   'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide font-mono ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

// ─── Dot indicator ────────────────────────────────────────────────────────────
export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        active ? 'bg-emerald-400' : 'bg-white/20'
      }`}
    />
  )
}

// ─── Section separator with label ────────────────────────────────────────────
export function SectionSep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="section-label">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}

// ─── Inline error / feedback ─────────────────────────────────────────────────
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3.5 py-3 text-sm text-red-300">
      <span className="mt-0.5 text-red-400">✕</span>
      {message}
    </div>
  )
}

export function InlineFeedback({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3.5 py-3 text-sm text-emerald-300">
      <span className="text-emerald-400">✓</span>
      {message}
    </div>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
