const STYLES = {
  vert: 'bg-leaf-400/15 text-forest-700',
  or: 'bg-gold-400/20 text-gold-600',
  rouge: 'bg-red-100 text-red-700',
  gris: 'bg-charcoal-900/5 text-ink/60',
}

export default function Badge({ children, couleur = 'gris' }) {
  return <span className={`badge ${STYLES[couleur] || STYLES.gris}`}>{children}</span>
}
