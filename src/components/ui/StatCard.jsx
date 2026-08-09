export default function StatCard({ label, valeur, sousTexte, accent = 'forest' }) {
  const accents = {
    forest: 'text-forest-700',
    gold: 'text-gold-600',
    leaf: 'text-leaf-600',
  }
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold ${accents[accent] || accents.forest}`}>
        {valeur}
      </p>
      {sousTexte && <p className="mt-1 text-xs text-ink/50">{sousTexte}</p>}
    </div>
  )
}
