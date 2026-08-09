import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function InventaireForm() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [produits, setProduits] = useState([])
  const [comptages, setComptages] = useState({}) // idProduit -> quantite physique
  const [observation, setObservation] = useState('')
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!idBoutique) return
    setChargement(true)
    api.get('/produits', { params: { idBoutique } })
      .then(({ data }) => setProduits(data))
      .catch((err) => notifier(messageErreur(err), 'erreur'))
      .finally(() => setChargement(false))
  }, [idBoutique]) // eslint-disable-line

  function definirComptage(idProduit, valeur) {
    setComptages((c) => ({ ...c, [idProduit]: valeur }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const lignes = Object.entries(comptages)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([idProduit, v]) => ({ idProduit: Number(idProduit), quantitePhysique: Number(v) }))

    if (lignes.length === 0) { notifier('Saisissez au moins un comptage', 'erreur'); return }

    setEnvoi(true)
    try {
      await api.post('/inventaires', { idBoutique, lignes, observation: observation || null })
      notifier('Inventaire enregistre, le stock a ete ajuste')
      navigate('/inventaires')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Nouvel inventaire" description="Saisissez la quantite physique comptee pour chaque produit ; le stock sera ajuste automatiquement." />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : produits.length === 0 ? (
        <EmptyState titre="Aucun produit en stock dans cette boutique" />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="card overflow-x-auto">
            <table className="table-erp">
              <thead><tr><th>Produit</th><th>Stock theorique</th><th>Quantite physique comptee</th></tr></thead>
              <tbody>
                {produits.map((p) => (
                  <tr key={p.idProduit}>
                    <td className="font-medium">{p.nom}</td>
                    <td className="font-mono">{p.quantiteTotale ?? 0}</td>
                    <td>
                      <input
                        type="number" min="0"
                        value={comptages[p.idProduit] ?? ''}
                        onChange={(e) => definirComptage(p.idProduit, e.target.value)}
                        className="input !w-28"
                        placeholder={String(p.quantiteTotale ?? 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <label className="label">Observation</label>
            <textarea rows={2} className="input" value={observation} onChange={(e) => setObservation(e.target.value)} />
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Valider l'inventaire</button>
              <button type="button" onClick={() => navigate('/inventaires')} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </form>
      )}
    </>
  )
}
