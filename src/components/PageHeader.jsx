import boutiqueHero from '../assets/boutique-hero.jpg'

/**
 * Bandeau d'en-tete utilise en haut de chaque page interne : reprend la photo de la
 * boutique en fond (assombrie dans un degrade vert de marque) pour ancrer l'identite
 * SmartShop sur l'ensemble de l'application, sans jamais nuire a la lisibilite des
 * tableaux/formulaires qui suivent en dessous sur fond clair.
 */
export default function PageHeader({ titre, description, actions }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl2 border border-forest-100 bg-charcoal-950 bg-cover bg-center px-6 py-7 shadow-card"
      style={{ backgroundImage: `linear-gradient(100deg, rgba(14,26,18,.94) 20%, rgba(18,63,40,.75) 60%, rgba(232,171,46,.35)), url(${boutiqueHero})` }}
    >
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{titre}</h1>
          {description && <p className="mt-1 max-w-xl text-sm text-cream/80">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
