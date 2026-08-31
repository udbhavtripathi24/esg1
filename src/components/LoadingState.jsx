/**
 * Reusable loading indicator. Uses Tailwind's built-in animate-spin (no
 * custom CSS needed) and the app's existing color tokens (brand-green,
 * ink-500) for visual consistency with the rest of the UI.
 */
export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-surface-border border-t-brand-green animate-spin"
        role="status"
        aria-label={label}
      />
      {label && <p className="mt-3 text-xs text-ink-500">{label}</p>}
    </div>
  )
}
