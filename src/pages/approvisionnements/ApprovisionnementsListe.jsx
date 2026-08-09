import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function ApprovisionnementsListe() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const [liste, setListe] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalDetail, setModalDetail] = useState(null)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/approvisionnements', { params: { idBoutique } })
      setListe(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les approvisionnements'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [idBoutique]) // eslint-disable-line

  async function ouvrirDetail(a) {
    try {
      const { data } = await api.get(`/approvisionnements/${a.idApprovisionnement}`)
      setModalDetail(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  return (
    <>
      <PageHeader
        titre="Approvisionnements"
        description="Historique des receptions de stock aupres de vos fournisseurs."
        actions={<button onClick={() => navigate('/approvisionnements/nouveau')} className="btn-gold">➕ Nouvel approvisionnement</button>}
      />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : liste.length === 0 ? (
        <EmptyState titre="Aucun approvisionnement" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>N°</th><th>Date</th><th>Fournisseur</th><th>Boutique</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.idApprovisionnement} className="cursor-pointer" onClick={() => ouvrirDetail(a)}>
                  <td className="font-mono text-xs">{a.numeroApprovisionnement}</td>
                  <td className="whitespace-nowrap text-xs">{formaterDate(a.dateCreation)}</td>
                  <td className="font-medium">{a.fournisseur}</td>
                  <td>{a.boutique}</td>
                  <td className="font-mono font-semibold">{formaterMontant(a.montantTotal)}</td>
                  <td><Badge couleur="vert">{a.statut}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={!!modalDetail} onFermer={() => setModalDetail(null)} titre={`Approvisionnement ${modalDetail?.numeroApprovisionnement || ''}`} largeur="max-w-lg">
        {modalDetail && (
          <table className="table-erp">
            <thead><tr><th>Produit</th><th>Qte</th><th>Prix achat</th><th>Total</th></tr></thead>
            <tbody>
              {modalDetail.lignes.map((l) => (
                <tr key={l.idProduit}>
                  <td>{l.nomProduit}</td>
                  <td className="font-mono">{l.quantite}</td>
                  <td className="font-mono">{formaterMontant(l.prixAchat)}</td>
                  <td className="font-mono">{formaterMontant(l.sousTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </>
  )
}
