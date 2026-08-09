import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { formaterMontant, formaterDate, aujourdhuiISO } from '../lib/format'
import { useBoutique } from '../context/BoutiqueContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

const VIDE = { libelle: '', categorie: '', montant: '', observation: '' }

export default function Depenses() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const [dateDebut, setDateDebut] = useState(aujourdhuiISO())
  const [dateFin, setDateFin] = useState(aujourdhuiISO())
  const [depenses, setDepenses] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [form, setForm] = useState(VIDE)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/depenses', { params: { dateDebut, dateFin, idBoutique } })
      setDepenses(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les depenses'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { if (idBoutique) charger() }, [idBoutique]) // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/depenses', { ...form, idBoutique, montant: Number(form.montant) })
      notifier('Depense enregistree')
      setModalOuvert(false)
      setForm(VIDE)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const total = depenses.reduce((s, d) => s + d.montant, 0)

  return (
    <>
      <PageHeader titre="Dépenses" description="Suivez les depenses de vos boutiques." actions={<button onClick={() => setModalOuvert(true)} className="btn-gold">➕ Nouvelle depense</button>} />

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="label">Du</label><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" /></div>
        <div><label className="label">Au</label><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" /></div>
        <button onClick={charger} className="btn-primary">Filtrer</button>
        <div className="ml-auto text-sm"><span className="text-ink/50">Total periode : </span><span className="font-mono font-bold text-forest-800">{formaterMontant(total)}</span></div>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : depenses.length === 0 ? (
        <EmptyState titre="Aucune depense sur cette periode" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Date</th><th>Libelle</th><th>Categorie</th><th>Montant</th><th>Enregistre par</th></tr></thead>
            <tbody>
              {depenses.map((d) => (
                <tr key={d.idDepense}>
                  <td className="whitespace-nowrap text-xs">{formaterDate(d.dateDepense)}</td>
                  <td className="font-medium">{d.libelle}</td>
                  <td>{d.categorie || '-'}</td>
                  <td className="font-mono font-semibold">{formaterMontant(d.montant)}</td>
                  <td>{d.utilisateur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre="Nouvelle depense">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div><label className="label">Libelle *</label><input required className="input" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
          <div><label className="label">Categorie</label><input className="input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Loyer, transport, fournitures…" /></div>
          <div><label className="label">Montant *</label><input required type="number" min="0" className="input" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
          <div><label className="label">Observation</label><textarea rows={2} className="input" value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} /></div>
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Enregistrer</button>
        </form>
      </Modal>
    </>
  )
}
