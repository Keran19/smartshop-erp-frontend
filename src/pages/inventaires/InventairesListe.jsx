import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterDate } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

export default function InventairesListe() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()
  const [liste, setListe] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalDetail, setModalDetail] = useState(null)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/inventaires', { params: { idBoutique } })
      setListe(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les inventaires'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [idBoutique]) // eslint-disable-line

  async function ouvrirDetail(i) {
    try {
      const { data } = await api.get(`/inventaires/${i.idInventaire}`)
      setModalDetail(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    }
  }

  return (
    <>
      <PageHeader
        titre="Inventaire"
        description="Comptages physiques et ajustements de stock."
        actions={<button onClick={() => navigate('/inventaires/nouveau')} className="btn-gold">➕ Nouvel inventaire</button>}
      />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : liste.length === 0 ? (
        <EmptyState titre="Aucun inventaire" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead><tr><th>Date</th><th>Boutique</th><th>Realise par</th><th>Observation</th></tr></thead>
            <tbody>
              {liste.map((i) => (
                <tr key={i.idInventaire} className="cursor-pointer" onClick={() => ouvrirDetail(i)}>
                  <td className="whitespace-nowrap text-xs">{formaterDate(i.dateInventaire)}</td>
                  <td>{i.boutique}</td>
                  <td>{i.utilisateur}</td>
                  <td className="text-ink/60">{i.observation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={!!modalDetail} onFermer={() => setModalDetail(null)} titre="Detail de l'inventaire" largeur="max-w-lg">
        {modalDetail && (
          <table className="table-erp">
            <thead><tr><th>Produit</th><th>Theorique</th><th>Physique</th><th>Ecart</th></tr></thead>
            <tbody>
              {modalDetail.lignes.map((l) => (
                <tr key={l.idProduit}>
                  <td>{l.nomProduit}</td>
                  <td className="font-mono">{l.quantiteTheorique}</td>
                  <td className="font-mono">{l.quantitePhysique}</td>
                  <td className={`font-mono font-semibold ${l.ecart < 0 ? 'text-red-600' : l.ecart > 0 ? 'text-gold-600' : ''}`}>
                    {l.ecart > 0 ? `+${l.ecart}` : l.ecart}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </>
  )
}
