import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const VIDE = { nom: '', telephone: '', email: '', adresse: '' }

export default function Fournisseurs() {
  const { notifier } = useToast()
  const [fournisseurs, setFournisseurs] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState(VIDE)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/fournisseurs')
      setFournisseurs(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() { setEdition(null); setForm(VIDE); setModalOuvert(true) }
  function ouvrirEdition(f) {
    setEdition(f)
    setForm({ nom: f.nom, telephone: f.telephone || '', email: f.email || '', adresse: f.adresse || '' })
    setModalOuvert(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      if (edition) {
        await api.put(`/fournisseurs/${edition.idFournisseur}`, form)
        notifier('Fournisseur mis a jour')
      } else {
        await api.post('/fournisseurs', form)
        notifier('Fournisseur cree')
      }
      setModalOuvert(false)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Fournisseurs" description="Gerez vos partenaires d'approvisionnement." actions={<button onClick={ouvrirCreation} className="btn-gold">➕ Nouveau fournisseur</button>} />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : fournisseurs.length === 0 ? (
        <EmptyState titre="Aucun fournisseur" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Nom</th><th>Telephone</th><th>Email</th><th></th></tr></thead>
            <tbody>
              {fournisseurs.map((f) => (
                <tr key={f.idFournisseur}>
                  <td className="font-medium">{f.nom}</td>
                  <td className="font-mono">{f.telephone || '-'}</td>
                  <td>{f.email || '-'}</td>
                  <td><button onClick={() => ouvrirEdition(f)} className="text-forest-700 hover:underline">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div><label className="label">Nom *</label><input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
          <div><label className="label">Telephone</label><input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Adresse</label><input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Enregistrer</button>
        </form>
      </Modal>
    </>
  )
}
