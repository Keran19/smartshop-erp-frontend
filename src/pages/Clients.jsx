import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const VIDE = { nom: '', prenom: '', telephone: '', email: '', adresse: '' }

export default function Clients() {
  const { notifier } = useToast()
  const [clients, setClients] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState(VIDE)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/clients')
      setClients(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() { setEdition(null); setForm(VIDE); setModalOuvert(true) }
  function ouvrirEdition(c) {
    setEdition(c)
    setForm({ nom: c.nom, prenom: c.prenom || '', telephone: c.telephone || '', email: c.email || '', adresse: c.adresse || '' })
    setModalOuvert(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      if (edition) {
        await api.put(`/clients/${edition.idClient}`, form)
        notifier('Client mis a jour')
      } else {
        await api.post('/clients', form)
        notifier('Client cree')
      }
      setModalOuvert(false)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const filtres = clients.filter((c) => {
    const q = recherche.toLowerCase()
    return !q || c.nom.toLowerCase().includes(q) || c.telephone?.includes(q)
  })

  return (
    <>
      <PageHeader titre="Clients" description="Gerez votre fichier client." actions={<button onClick={ouvrirCreation} className="btn-gold">➕ Nouveau client</button>} />

      <div className="card p-4">
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par nom ou telephone…" className="input" />
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : filtres.length === 0 ? (
        <EmptyState titre="Aucun client" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Nom</th><th>Telephone</th><th>Email</th><th></th></tr></thead>
            <tbody>
              {filtres.map((c) => (
                <tr key={c.idClient}>
                  <td className="font-medium">{c.nom} {c.prenom}</td>
                  <td className="font-mono">{c.telephone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td><button onClick={() => ouvrirEdition(c)} className="text-forest-700 hover:underline">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier le client' : 'Nouveau client'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom *</label><input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label className="label">Prenom</label><input className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
          </div>
          <div><label className="label">Telephone</label><input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Adresse</label><input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Enregistrer</button>
        </form>
      </Modal>
    </>
  )
}
