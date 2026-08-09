import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, messageErreur } from '../lib/api'
import { formaterDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/ui/Spinner'

export default function MonProfil() {
  const { utilisateur } = useAuth()
  const { notifier } = useToast()
  const [searchParams] = useSearchParams()
  const forcerChangement = searchParams.get('forcer-changement') === '1'

  const [profil, setProfil] = useState(null)
  const [ancienMotDePasse, setAncienMotDePasse] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api.get('/utilisateurs/me').then(({ data }) => setProfil(data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (nouveauMotDePasse !== confirmation) {
      notifier('La confirmation ne correspond pas au nouveau mot de passe', 'erreur')
      return
    }
    setEnvoi(true)
    try {
      await api.post('/utilisateurs/me/changer-mot-de-passe', { ancienMotDePasse, nouveauMotDePasse })
      notifier('Mot de passe modifie avec succes')
      setAncienMotDePasse(''); setNouveauMotDePasse(''); setConfirmation('')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de changer le mot de passe'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Mon profil" description="Vos informations de compte et la securite de votre acces." />

      {profil && (
        <div className="card p-5">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-ink/50">Nom</p><p className="font-semibold">{profil.nom} {profil.prenom}</p></div>
            <div><p className="text-ink/50">Email</p><p className="font-semibold">{profil.email}</p></div>
            <div><p className="text-ink/50">Role</p><p className="font-semibold">{profil.role}</p></div>
            <div><p className="text-ink/50">Derniere connexion</p><p className="font-semibold">{formaterDate(profil.derniereConnexion)}</p></div>
          </div>
        </div>
      )}

      <div className="card max-w-md p-5">
        {forcerChangement && (
          <p className="mb-4 rounded-lg bg-gold-400/15 px-3 py-2 text-sm font-medium text-gold-600">
            Pour des raisons de securite, vous devez changer votre mot de passe temporaire avant de continuer.
          </p>
        )}
        <p className="mb-4 font-display font-semibold text-forest-800">Changer mon mot de passe</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input required type="password" className="input" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)} />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input required type="password" className="input" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} />
            <p className="mt-1 text-xs text-ink/50">8 caracteres min., une majuscule, une minuscule, un chiffre.</p>
          </div>
          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input required type="password" className="input" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Mettre a jour</button>
        </form>
      </div>
    </>
  )
}
