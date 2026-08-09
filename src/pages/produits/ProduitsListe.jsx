import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

export default function ProduitsListe() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const [produits, setProduits] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/produits', { params: idBoutique ? { idBoutique } : {} })
      setProduits(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les produits'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [idBoutique]) // eslint-disable-line

  const filtres = produits.filter((p) => {
    const q = recherche.toLowerCase()
    return !q || p.nom.toLowerCase().includes(q) || p.codeBarres?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)
  })

  return (
    <>
      <PageHeader
        titre="Produits & stock"
        description="Liste des produits et de leur disponibilite en stock, boutique par boutique."
        actions={
          <>
            <Link to="/produits/historique" className="btn-ghost">🔎 Historique par produit</Link>
            <Link to="/produits/nouveau" className="btn-gold">➕ Nouveau produit</Link>
          </>
        }
      />

      <div className="card p-4">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, reference ou code-barres…"
          className="input"
        />
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : filtres.length === 0 ? (
        <EmptyState titre="Aucun produit" description="Commencez par ajouter votre premier produit." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead>
              <tr>
                <th>Produit</th><th>Code-barres</th><th>Categorie</th>
                <th>Prix achat</th><th>Prix vente</th><th>Stock</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((p) => {
                const enAlerte = p.stocks?.some((s) => s.enAlerte)
                return (
                  <tr key={p.idProduit}>
                    <td className="font-medium">{p.nom}</td>
                    <td className="font-mono text-xs">{p.codeBarres}</td>
                    <td>{p.categorie || '-'}</td>
                    <td className="font-mono">{formaterMontant(p.prixAchat)}</td>
                    <td className="font-mono">{formaterMontant(p.prixVente)}</td>
                    <td>
                      <Badge couleur={enAlerte ? 'rouge' : 'vert'}>{p.quantiteTotale ?? 0} en stock</Badge>
                    </td>
                    <td>
                      <Link to={`/produits/${p.idProduit}/modifier`} className="text-forest-700 hover:underline">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
