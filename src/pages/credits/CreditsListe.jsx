import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate, formaterDateCourte } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const COULEUR_STATUT = { EN_COURS: 'or', SOLDE: 'vert', EN_RETARD: 'rouge' }

export default function CreditsListe() {
  const { notifier } = useToast()
  const [credits, setCredits] = useState([])
  const [filtreStatut, setFiltreStatut] = useState('EN_COURS')
  const [chargement, setChargement] = useState(true)

  const [modalDetail, setModalDetail] = useState(null)
  const [montant, setMontant] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/credits', { params: { statut: filtreStatut || undefined } })
      setCredits(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les credits'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [filtreStatut]) // eslint-disable-line

  async function ouvrirDetail(c) {
    try {
      const { data } = await api.get(`/credits/${c.idCredit}`)
      setModalDetail(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  async function payer(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      const { data } = await api.post(`/credits/${modalDetail.idCredit}/paiements`, { montant: Number(montant) })
      setModalDetail(data)
      setMontant('')
      notifier('Paiement enregistre')
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Paiement impossible'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Crédits clients" description="Suivez les ventes a credit et enregistrez les remboursements." />

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink/50">Statut :</span>
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="input !w-auto">
            <option value="">Tous</option>
            <option value="EN_COURS">En cours</option>
            <option value="SOLDE">Solde</option>
            <option value="EN_RETARD">En retard</option>
          </select>
        </label>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : credits.length === 0 ? (
        <EmptyState titre="Aucun credit" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Client</th><th>Vente</th><th>Montant initial</th><th>Paye</th><th>Reste</th><th>Date limite</th><th>Statut</th></tr></thead>
            <tbody>
              {credits.map((c) => (
                <tr key={c.idCredit} className="cursor-pointer" onClick={() => ouvrirDetail(c)}>
                  <td className="font-medium">{c.client}</td>
                  <td className="font-mono text-xs">{c.numeroVente}</td>
                  <td className="font-mono">{formaterMontant(c.montantInitial)}</td>
                  <td className="font-mono text-forest-700">{formaterMontant(c.montantPaye)}</td>
                  <td className="font-mono font-semibold">{formaterMontant(c.resteAPayer)}</td>
                  <td className="text-xs">{c.dateLimite ? formaterDateCourte(c.dateLimite) : '-'}</td>
                  <td><Badge couleur={COULEUR_STATUT[c.statut]}>{c.statut.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={!!modalDetail} onFermer={() => setModalDetail(null)} titre={`Credit - ${modalDetail?.client || ''}`} largeur="max-w-lg">
        {modalDetail && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-forest-50 p-3 text-sm">
              <div className="flex justify-between"><span>Montant initial</span><span className="font-mono font-bold">{formaterMontant(modalDetail.montantInitial)}</span></div>
              <div className="flex justify-between"><span>Deja paye</span><span className="font-mono">{formaterMontant(modalDetail.montantPaye)}</span></div>
              <div className="flex justify-between font-bold text-gold-600"><span>Reste a payer</span><span className="font-mono">{formaterMontant(modalDetail.resteAPayer)}</span></div>
            </div>

            {modalDetail.paiements.length > 0 && (
              <div>
                <p className="label !mb-2">Historique des paiements</p>
                <ul className="divide-y divide-forest-50 text-sm">
                  {modalDetail.paiements.map((p) => (
                    <li key={p.idPaiement} className="flex justify-between py-1.5">
                      <span className="text-ink/60">{formaterDate(p.datePaiement)}</span>
                      <span className="font-mono font-semibold">{formaterMontant(p.montant)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modalDetail.statut !== 'SOLDE' && (
              <form onSubmit={payer} className="flex gap-2">
                <input type="number" min="0" max={modalDetail.resteAPayer} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant du paiement" className="input flex-1" required />
                <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Encaisser</button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
