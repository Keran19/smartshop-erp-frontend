import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo-smartshop.png'

const LIENS = [
  { to: '/', label: 'Tableau de bord', icone: '🏠', roles: null },
  { to: '/caisse', label: 'Caisse', icone: '💵', roles: null },
  { to: '/vente', label: 'Point de vente', icone: '🛒', roles: null },
  { to: '/ventes', label: 'Historique des ventes', icone: '🧾', roles: null },
  { to: '/retours', label: 'Retours & échanges', icone: '↩️', roles: null },
  { to: '/acomptes', label: 'Acomptes', icone: '💰', roles: null },
  { to: '/credits', label: 'Crédits clients', icone: '📇', roles: null },
  { to: '/produits', label: 'Produits & stock', icone: '📦', roles: null },
  { to: '/statistiques', label: 'Statistiques', icone: '📊', roles: null },
  { to: '/clients', label: 'Clients', icone: '👥', roles: null },
  { to: '/gestion-caisse', label: 'Gestion de caisse', icone: '🗄️', roles: ['ADMIN', 'GERANT'] },
  { to: '/fournisseurs', label: 'Fournisseurs', icone: '🚚', roles: ['ADMIN', 'GERANT'] },
  { to: '/approvisionnements', label: 'Approvisionnements', icone: '📥', roles: ['ADMIN', 'GERANT'] },
  { to: '/inventaires', label: 'Inventaire', icone: '📋', roles: ['ADMIN', 'GERANT'] },
  { to: '/depenses', label: 'Dépenses', icone: '🧮', roles: ['ADMIN', 'GERANT'] },
  { to: '/catalogue', label: 'Catégories & marques', icone: '🏷️', roles: ['ADMIN', 'GERANT'] },
  { to: '/boutiques', label: 'Points de vente', icone: '🏬', roles: ['ADMIN'] },
  { to: '/utilisateurs', label: 'Utilisateurs', icone: '🔐', roles: ['ADMIN'] },
]

export default function Sidebar({ ouverte, onFermer }) {
  const { utilisateur, aleRole } = useAuth()

  const liensVisibles = LIENS.filter((lien) => !lien.roles || aleRole(...lien.roles))

  return (
    <>
      {ouverte && (
        <div
          className="fixed inset-0 z-30 bg-charcoal-950/40 lg:hidden"
          onClick={onFermer}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-charcoal-950 text-cream transition-transform duration-200
        lg:static lg:translate-x-0 ${ouverte ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src={logo} alt="SmartShop" className="h-9 w-9 rounded-lg object-contain bg-white/5 p-1" />
          <div>
            <p className="font-display text-lg font-bold leading-none text-white">SmartShop</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-leaf-400">ERP</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {liensVisibles.map((lien) => (
            <NavLink
              key={lien.to}
              to={lien.to}
              end={lien.to === '/'}
              onClick={onFermer}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest-700 text-white'
                    : 'text-cream/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span aria-hidden="true">{lien.icone}</span>
              {lien.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-semibold text-white">
            {utilisateur?.prenom} {utilisateur?.nom}
          </p>
          <p className="text-xs text-gold-400">{utilisateur?.role}</p>
        </div>
      </aside>
    </>
  )
}
