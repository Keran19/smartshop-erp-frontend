import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate, aujourdhuiISO } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function RetoursListe() {
  const { notifier } = useToast()
  const navigate = useNavigate()
  const [dateDebut, setDateDebut] = useState(aujourdhuiISO())
  const [dateFin, setDateFin] = useState(aujourdhuiISO())
  const [retours, setRetours] = useState([])
  const [chargement, setChargement] = useState(true)

  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const [numeroVente, setNumeroVente] = useState('')
  const [recherche, setRecherche] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/retours/historique', { params: { dateDebut, dateFin } })
      setRetours(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les retours'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, []) // eslint-disable-line

  async function chercherVente(e) {
    e.preventDefault()
    setRecherche(true)
    try {
      // L'historique des ventes est filtre cote client sur le numero saisi
      const { data } = await api.get('/ventes/historique', {
        params: { dateDebut: '2000-01-01', dateFin: aujourdhuiISO() },
      })
      const trouvee = data.find((v) => v.numeroVente.toLowerCase().includes(numeroVente.trim().toLowerCase()))
      if (!trouvee) { notifier('Aucune vente trouvee avec ce numero', 'erreur'); return }
      navigate(`/retours/nouveau/${trouvee.idVente}`)
    } catch (err) {
      notifier(messageErreur(err, 'Recherche impossible'), 'erreur')
    } finally {
      setRecherche(false)
    }
  }

  return (
    <>
      <PageHeader
        titre="Retours & échanges"
        description="Remboursements, échanges à valeur égale ou différente."
        actions={<button onClick={() => setRechercheOuverte(true)} className="btn-gold">➕ Nouveau retour</button>}
      />

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="label">Du</label><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" /></div>
        <div><label className="label">Au</label><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" /></div>
        <button onClick={charger} className="btn-primary">Filtrer</button>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : retours.length === 0 ? (
        <EmptyState titre="Aucun retour sur cette periode" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>N° Retour</th><th>Date</th><th>Vente d'origine</th><th>Type</th><th>Retourne</th><th>Complement / Remboursement</th><th>Statut</th></tr></thead>
            <tbody>
              {retours.map((r) => (
                <tr key={r.idRetour}>
                  <td className="font-mono text-xs">{r.numeroRetour}</td>
                  <td className="whitespace-nowrap text-xs">{formaterDate(r.dateRetour)}</td>
                  <td className="font-mono text-xs">{r.numeroVenteOrigine}</td>
                  <td><Badge couleur={r.typeRetour === 'REMBOURSEMENT' ? 'rouge' : 'or'}>{r.typeRetour.replace(/_/g, ' ')}</Badge></td>
                  <td className="font-mono">{formaterMontant(r.montantRetourne)}</td>
                  <td className="font-mono text-gold-600">
                    {r.montantComplement > 0 ? `+${formaterMontant(r.montantComplement)}` : r.montantRembourse > 0 ? `-${formaterMontant(r.montantRembourse)}` : '—'}
                  </td>
                  <td><Badge couleur={r.statut === 'VALIDE' ? 'vert' : 'rouge'}>{r.statut}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={rechercheOuverte} onFermer={() => setRechercheOuverte(false)} titre="Rechercher la vente concernee" largeur="max-w-sm">
        <form onSubmit={chercherVente} className="flex flex-col gap-3">
          <div>
            <label className="label">Numero de vente</label>
            <input value={numeroVente} onChange={(e) => setNumeroVente(e.target.value)} className="input" placeholder="VEN-20260808-000123" autoFocus />
          </div>
          <button type="submit" disabled={recherche} className="btn-primary">{recherche && <Spinner />} Continuer</button>
        </form>
      </Modal>
    </>
  )
}
