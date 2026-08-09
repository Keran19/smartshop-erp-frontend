export default function EmptyState({ titre, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-forest-200 bg-forest-50/40 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-forest-800">{titre}</p>
      {description && <p className="max-w-sm text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
