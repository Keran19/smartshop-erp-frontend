import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { messageErreur } from '../lib/api'
import logo from '../assets/logo-smartshop.png'
import boutiqueHero from '../assets/boutique-hero.jpg'
import Spinner from '../components/ui/Spinner'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const { connecter } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setChargement(true)
    try {
      const profil = await connecter(email, motDePasse)
      if (profil.doitChangerMotDePasse) {
        navigate('/mon-profil?forcer-changement=1', { replace: true })
      } else {
        navigate(location.state?.from || '/', { replace: true })
      }
    } catch (err) {
      setErreur(messageErreur(err, 'Email ou mot de passe incorrect'))
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau gauche : formulaire */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <img src={logo} alt="SmartShop" className="h-20 w-20 object-contain" />
          <h1 className="mt-6 font-display text-3xl font-bold text-forest-800">
            Content de vous revoir
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Connectez-vous pour gerer vos ventes, votre stock et vos boutiques.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="label">Adresse email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="vous@smartshop.com"
              />
            </div>
            <div>
              <label htmlFor="motDePasse" className="label">Mot de passe</label>
              <input
                id="motDePasse"
                type="password"
                required
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {erreur && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {erreur}
              </p>
            )}

            <button type="submit" disabled={chargement} className="btn-primary mt-2 w-full">
              {chargement && <Spinner />}
              Se connecter
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-ink/40">
            SmartShop ERP &middot; Gestion multi-boutique
          </p>
        </div>
      </div>

      {/* Panneau droit : photo de boutique en pleine hauteur */}
      <div
        className="relative hidden overflow-hidden bg-charcoal-950 lg:block"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(14,26,18,.15) 0%, rgba(14,26,18,.75) 100%), url(${boutiqueHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-3xl font-bold leading-tight text-white">
            Pilotez chaque boutique,
            <br />depuis un seul endroit.
          </p>
          <p className="mt-3 max-w-md text-sm text-cream/80">
            Ventes, stock, credits, retours et statistiques : SmartShop ERP reunit toute
            votre activite commerciale, boutique par boutique.
          </p>
        </div>
      </div>
    </div>
  )
}
