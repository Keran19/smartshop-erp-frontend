import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { formaterDate } from '../lib/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const VIDE_CREATION = { nom: '', prenom: '', email: '', motDePasse: '', telephone: '', role: 'VENDEUR' }

export default function Utilisateurs() {
  const { notifier } = useToast()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalCreation, setModalCreation] = useState(false)
  const [form, setForm] = useState(VIDE_CREATION)
  const [envoi, setEnvoi] = useState(false)

  const [modalReset, setModalReset] = useState(null) // utilisateur cible
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/utilisateurs')
      setUtilisateurs(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  async function creer(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/utilisateurs', form)
      notifier('Utilisateur cree')
      setModalCreation(false)
      setForm(VIDE_CREATION)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de creer l\'utilisateur'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  async function basculerActivation(u) {
    try {
      await api.patch(`/utilisateurs/${u.idUtilisateur}/${u.actif ? 'desactiver' : 'activer'}`)
      notifier(u.actif ? 'Compte desactive' : 'Compte active')
      charger()
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  async function deverrouiller(u) {
    try {
      await api.patch(`/utilisateurs/${u.idUtilisateur}/deverrouiller`)
      notifier('Compte deverrouille')
      charger()
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  async function reinitialiserMotDePasse(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post(`/utilisateurs/${modalReset.idUtilisateur}/reinitialiser-mot-de-passe`, { nouveauMotDePasse })
      notifier('Mot de passe reinitialise')
      setModalReset(null)
      setNouveauMotDePasse('')
    } catch (err) {
      notifier(messageErreur(err, 'Reinitialisation impossible'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Utilisateurs" description="Gerez les comptes et les roles de votre equipe." actions={<button onClick={() => setModalCreation(true)} className="btn-gold">➕ Nouvel utilisateur</button>} />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Derniere connexion</th><th></th></tr></thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.idUtilisateur}>
                  <td className="font-medium">{u.nom} {u.prenom}</td>
                  <td>{u.email}</td>
                  <td><Badge couleur="or">{u.role}</Badge></td>
                  <td className="flex flex-wrap gap-1 py-2.5">
                    <Badge couleur={u.actif ? 'vert' : 'rouge'}>{u.actif ? 'Actif' : 'Inactif'}</Badge>
                    {u.verrouille && <Badge couleur="rouge">Verrouille</Badge>}
                  </td>
                  <td className="text-xs">{formaterDate(u.derniereConnexion)}</td>
                  <td className="flex flex-wrap gap-2 whitespace-nowrap text-xs">
                    <button onClick={() => basculerActivation(u)} className="text-forest-700 hover:underline">
                      {u.actif ? 'Desactiver' : 'Activer'}
                    </button>
                    {u.verrouille && <button onClick={() => deverrouiller(u)} className="text-gold-600 hover:underline">Deverrouiller</button>}
                    <button onClick={() => setModalReset(u)} className="text-ink/60 hover:underline">Reinit. mot de passe</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalCreation} onFermer={() => setModalCreation(false)} titre="Nouvel utilisateur">
        <form onSubmit={creer} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom *</label><input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label className="label">Prenom *</label><input required className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
          </div>
          <div><label className="label">Email *</label><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <label className="label">Mot de passe temporaire *</label>
            <input required type="password" className="input" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} />
            <p className="mt-1 text-xs text-ink/50">8 caracteres min., une majuscule, une minuscule, un chiffre. L'utilisateur devra le changer a sa premiere connexion.</p>
          </div>
          <div><label className="label">Telephone</label><input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="VENDEUR">Vendeur</option>
              <option value="GERANT">Gerant</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Creer le compte</button>
        </form>
      </Modal>

      <Modal ouvert={!!modalReset} onFermer={() => setModalReset(null)} titre={`Reinitialiser le mot de passe de ${modalReset?.prenom || ''}`} largeur="max-w-sm">
        <form onSubmit={reinitialiserMotDePasse} className="flex flex-col gap-4">
          <div>
            <label className="label">Nouveau mot de passe temporaire *</label>
            <input required type="password" className="input" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} />
          </div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Reinitialiser</button>
        </form>
      </Modal>
    </>
  )
}
