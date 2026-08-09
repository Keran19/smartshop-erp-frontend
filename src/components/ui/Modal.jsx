export default function Modal({ ouvert, onFermer, titre, children, largeur = 'max-w-lg' }) {
  if (!ouvert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal-950/50 backdrop-blur-sm"
        onClick={onFermer}
        aria-hidden="true"
      />
      <div className={`card relative z-10 w-full ${largeur} max-h-[90vh] overflow-y-auto p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest-800">{titre}</h2>
          <button
            onClick={onFermer}
            className="rounded-full p-1 text-ink/40 hover:bg-forest-50 hover:text-ink"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
