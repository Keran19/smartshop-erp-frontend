import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { useBoutique } from '../context/BoutiqueContext'

export default function Layout() {
  const [sidebarOuverte, setSidebarOuverte] = useState(false)
  const { deconnecter, utilisateur } = useAuth()
  const { boutiques, idBoutique, setIdBoutique } = useBoutique()

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar ouverte={sidebarOuverte} onFermer={() => setSidebarOuverte(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-forest-100 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOuverte(true)}
            className="rounded-lg p-2 text-forest-700 hover:bg-forest-50"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <span className="font-display font-bold text-forest-800">SmartShop ERP</span>
          <button onClick={deconnecter} className="text-sm font-medium text-forest-700">
            Sortir
          </button>
        </header>

        <div className="hidden items-center justify-between gap-4 border-b border-forest-100 bg-white px-6 py-2.5 lg:flex">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink/50">Boutique :</span>
            <select
              value={idBoutique || ''}
              onChange={(e) => setIdBoutique(Number(e.target.value))}
              className="rounded-lg border border-forest-200 bg-forest-50/50 px-2.5 py-1.5 text-sm font-semibold text-forest-800"
            >
              {boutiques.map((b) => (
                <option key={b.idBoutique} value={b.idBoutique}>
                  {b.nom}{b.principale ? ' (principale)' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink/60">
              Connecte en tant que <strong className="text-ink">{utilisateur?.prenom}</strong>
            </span>
            <button onClick={deconnecter} className="btn-ghost !px-3 !py-1.5 text-xs">
              Se deconnecter
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
