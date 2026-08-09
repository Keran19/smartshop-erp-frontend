import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const COULEUR_STATUT = { EN_ATTENTE: 'or', SOLDE: 'vert', ANNULE: 'rouge' }

export default function AcomptesListe() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [acomptes, setAcomptes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')

  const [modalDetail, setModalDetail] = useState(null)
  const [montantVersement, setMontantVersement] = useState('')
  const [envoiVersement, setEnvoiVersement] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/acomptes', { params: { statut: filtreStatut || undefined, idBoutique } })
      setAcomptes(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les acomptes'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [filtreStatut, idBoutique]) // eslint-disable-line

  async function ouvrirDetail(a) {
    try {
      const { data } = await api.get(`/acomptes/${a.idAcompte}`)
      setModalDetail(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  async function enregistrerVersement(e) {
    e.preventDefault()
    setEnvoiVersement(true)
    try {
      const { data } = await api.post(`/acomptes/${modalDetail.idAcompte}/versements`, { montant: Number(montantVersement) })
      setModalDetail(data)
      setMontantVersement('')
      notifier('Versement enregistre')
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Versement impossible'), 'erreur')
    } finally {
      setEnvoiVersement(false)
    }
  }

  return (
    <>
      <PageHeader
        titre="Acomptes"
        description="Suivez les acomptes verses par vos clients sur des produits reserves."
        actions={<button onClick={() => navigate('/acomptes/nouveau')} className="btn-gold">➕ Nouvel acompte</button>}
      />

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink/50">Statut :</span>
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="input !w-auto">
            <option value="">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="SOLDE">Solde</option>
            <option value="ANNULE">Annule</option>
          </select>
        </label>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : acomptes.length === 0 ? (
        <EmptyState titre="Aucun acompte" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>N° Acompte</th><th>Date</th><th>Client</th><th>Total</th><th>Verse</th><th>Reste</th><th>Statut</th></tr></thead>
            <tbody>
              {acomptes.map((a) => (
                <tr key={a.idAcompte} className="cursor-pointer" onClick={() => ouvrirDetail(a)}>
                  <td className="font-mono text-xs">{a.numeroAcompte}</td>
                  <td className="whitespace-nowrap text-xs">{formaterDate(a.dateCreation)}</td>
                  <td className="font-medium">{a.client}</td>
                  <td className="font-mono">{formaterMontant(a.montantTotal)}</td>
                  <td className="font-mono text-forest-700">{formaterMontant(a.montantVerse)}</td>
                  <td className="font-mono font-semibold">{formaterMontant(a.resteAPayer)}</td>
                  <td><Badge couleur={COULEUR_STATUT[a.statut]}>{a.statut.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={!!modalDetail} onFermer={() => setModalDetail(null)} titre={`Acompte ${modalDetail?.numeroAcompte || ''}`} largeur="max-w-xl">
        {modalDetail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-ink/50">Client</p><p className="font-semibold">{modalDetail.client}</p></div>
              <div><p className="text-ink/50">Boutique</p><p className="font-semibold">{modalDetail.boutique}</p></div>
            </div>

            <table className="table-erp">
              <thead><tr><th>Produit</th><th>Qte</th><th>P.U.</th><th>Total</th></tr></thead>
              <tbody>
                {modalDetail.lignes.map((l) => (
                  <tr key={l.idProduit}>
                    <td>{l.nomProduit}</td>
                    <td className="font-mono">{l.quantite}</td>
                    <td className="font-mono">{formaterMontant(l.prixUnitaire)}</td>
                    <td className="font-mono">{formaterMontant(l.sousTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="rounded-lg bg-forest-50 p-3 text-sm">
              <div className="flex justify-between"><span>Montant total</span><span className="font-mono font-bold">{formaterMontant(modalDetail.montantTotal)}</span></div>
              <div className="flex justify-between"><span>Deja verse</span><span className="font-mono">{formaterMontant(modalDetail.montantVerse)}</span></div>
              <div className="flex justify-between font-bold text-gold-600"><span>Reste a payer</span><span className="font-mono">{formaterMontant(modalDetail.resteAPayer)}</span></div>
            </div>

            {modalDetail.versements.length > 0 && (
              <div>
                <p className="label !mb-2">Historique des versements</p>
                <ul className="divide-y divide-forest-50 text-sm">
                  {modalDetail.versements.map((v) => (
                    <li key={v.idVersement} className="flex justify-between py-1.5">
                      <span className="text-ink/60">{formaterDate(v.dateVersement)}</span>
                      <span className="font-mono font-semibold">{formaterMontant(v.montant)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modalDetail.statut === 'EN_ATTENTE' && (
              <form onSubmit={enregistrerVersement} className="flex gap-2">
                <input
                  type="number" min="0" max={modalDetail.resteAPayer}
                  value={montantVersement} onChange={(e) => setMontantVersement(e.target.value)}
                  placeholder="Montant du versement" className="input flex-1" required
                />
                <button type="submit" disabled={envoiVersement} className="btn-primary">{envoiVersement && <Spinner />} Verser</button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
