import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { useBoutique } from '../context/BoutiqueContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const VIDE = { nom: '', adresse: '', telephone: '', principale: false }

export default function Boutiques() {
  const { notifier } = useToast()
  const { rechargerBoutiques } = useBoutique()
  const [boutiques, setBoutiques] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState(VIDE)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/boutiques')
      setBoutiques(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() { setEdition(null); setForm(VIDE); setModalOuvert(true) }
  function ouvrirEdition(b) {
    setEdition(b)
    setForm({ nom: b.nom, adresse: b.adresse || '', telephone: b.telephone || '', principale: b.principale })
    setModalOuvert(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      if (edition) {
        await api.put(`/boutiques/${edition.idBoutique}`, form)
        notifier('Boutique mise a jour')
      } else {
        await api.post('/boutiques', form)
        notifier('Point de vente cree')
      }
      setModalOuvert(false)
      await charger()
      await rechargerBoutiques()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader
        titre="Points de vente"
        description="Gerez vos differentes boutiques."
        actions={<button onClick={ouvrirCreation} className="btn-gold">➕ Ajouter un point de vente</button>}
      />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Nom</th><th>Adresse</th><th>Telephone</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {boutiques.map((b) => (
                <tr key={b.idBoutique}>
                  <td className="font-medium">{b.nom}</td>
                  <td>{b.adresse || '-'}</td>
                  <td>{b.telephone || '-'}</td>
                  <td>
                    {b.principale && <Badge couleur="or">Principale</Badge>}
                    {!b.actif && <Badge couleur="rouge">Inactive</Badge>}
                  </td>
                  <td><button onClick={() => ouvrirEdition(b)} className="text-forest-700 hover:underline">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier le point de vente' : 'Nouveau point de vente'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div><label className="label">Nom *</label><input required className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
          <div><label className="label">Adresse</label><input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
          <div><label className="label">Telephone</label><input className="input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.principale} onChange={(e) => setForm({ ...form, principale: e.target.checked })} />
            Boutique principale
          </label>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Enregistrer</button>
        </form>
      </Modal>
    </>
  )
}
