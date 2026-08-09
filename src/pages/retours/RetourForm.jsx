import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'

const TYPES = [
  { valeur: 'REMBOURSEMENT', label: 'Remboursement', description: 'Le client rend des produits et se fait rembourser.' },
  { valeur: 'ECHANGE_MEME_VALEUR', label: 'Echange - meme valeur', description: 'Echange contre des produits de valeur strictement identique.' },
  { valeur: 'ECHANGE_VALEUR_DIFFERENTE', label: 'Echange - valeur differente', description: 'Complement a payer ou remboursement de la difference, calcules automatiquement.' },
]

export default function RetourForm() {
  const { idVente } = useParams()
  const navigate = useNavigate()
  const { notifier } = useToast()

  const [vente, setVente] = useState(null)
  const [dejaRetourne, setDejaRetourne] = useState({}) // idProduit -> quantite deja retournee
  const [chargement, setChargement] = useState(true)
  const [typeRetour, setTypeRetour] = useState('REMBOURSEMENT')
  const [quantitesRetour, setQuantitesRetour] = useState({}) // idProduit -> qte
  const [motifs, setMotifs] = useState({})
  const [codeBarresEchange, setCodeBarresEchange] = useState('')
  const [lignesEchange, setLignesEchange] = useState([]) // {idProduit, nom, quantite, prixUnitaire}
  const [observation, setObservation] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/ventes/${idVente}`), api.get(`/retours/vente/${idVente}`)])
      .then(([v, retours]) => {
        setVente(v.data)
        const cumul = {}
        retours.data.filter((r) => r.statut === 'VALIDE').forEach((r) => {
          r.lignesRetour.forEach((l) => { cumul[l.idProduit] = (cumul[l.idProduit] || 0) + l.quantite })
        })
        setDejaRetourne(cumul)
      })
      .catch((err) => notifier(messageErreur(err, 'Vente introuvable'), 'erreur'))
      .finally(() => setChargement(false))
  }, [idVente]) // eslint-disable-line

  function restant(ligne) {
    return ligne.quantite - (dejaRetourne[ligne.idProduit] || 0)
  }

  function definirQuantite(idProduit, valeur) {
    setQuantitesRetour((q) => ({ ...q, [idProduit]: valeur }))
  }

  async function ajouterProduitEchange(e) {
    e.preventDefault()
    const code = codeBarresEchange.trim()
    if (!code) return
    try {
      const { data: produit } = await api.get(`/produits/scan/${encodeURIComponent(code)}`)
      setLignesEchange((actuel) => {
        const existant = actuel.find((l) => l.idProduit === produit.idProduit)
        if (existant) return actuel.map((l) => l.idProduit === produit.idProduit ? { ...l, quantite: l.quantite + 1 } : l)
        return [...actuel, { idProduit: produit.idProduit, nom: produit.nom, quantite: 1, prixUnitaire: produit.prixVente }]
      })
      setCodeBarresEchange('')
    } catch {
      notifier('Produit introuvable', 'erreur')
    }
  }

  const estEchange = typeRetour !== 'REMBOURSEMENT'
  const totalRetourne = vente?.lignes.reduce((s, l) => s + (Number(quantitesRetour[l.idProduit]) || 0) * l.prixUnitaire, 0) || 0
  const totalEchange = lignesEchange.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    const lignesRetour = Object.entries(quantitesRetour)
      .filter(([, qte]) => Number(qte) > 0)
      .map(([idProduit, qte]) => ({ idProduit: Number(idProduit), quantite: Number(qte), motif: motifs[idProduit] || null }))

    if (lignesRetour.length === 0) { notifier('Selectionnez au moins un produit a retourner', 'erreur'); return }
    if (estEchange && lignesEchange.length === 0) { notifier('Ajoutez au moins un produit en echange', 'erreur'); return }

    setEnvoi(true)
    try {
      const { data } = await api.post('/retours', {
        idVente: Number(idVente),
        typeRetour,
        lignesRetour,
        lignesEchange: estEchange ? lignesEchange.map((l) => ({ idProduit: l.idProduit, quantite: l.quantite })) : [],
        observation: observation || null,
      })
      notifier(`Retour ${data.numeroRetour} enregistre`)
      navigate('/retours')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer le retour'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) return <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
  if (!vente) return null

  return (
    <>
      <PageHeader titre={`Retour sur la vente ${vente.numeroVente}`} description="Selectionnez les produits rendus, puis le type de retour souhaite." />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="card p-5">
          <p className="mb-3 label !mb-2">Type de retour</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.valeur}
                onClick={() => setTypeRetour(t.valeur)}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  typeRetour === t.valeur ? 'border-forest-600 bg-forest-50' : 'border-forest-100 hover:bg-forest-50/50'
                }`}
              >
                <p className="font-semibold text-forest-800">{t.label}</p>
                <p className="mt-0.5 text-xs text-ink/60">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="label !mb-2">Produits a retourner</p>
          <div className="overflow-x-auto">
            <table className="table-erp">
              <thead><tr><th>Produit</th><th>Vendu</th><th>Deja retourne</th><th>Restant</th><th>Qte a retourner</th><th>Motif</th></tr></thead>
              <tbody>
                {vente.lignes.map((l) => (
                  <tr key={l.idProduit}>
                    <td className="font-medium">{l.nomProduit}</td>
                    <td className="font-mono">{l.quantite}</td>
                    <td className="font-mono">{dejaRetourne[l.idProduit] || 0}</td>
                    <td className="font-mono">{restant(l)}</td>
                    <td>
                      <input
                        type="number" min="0" max={restant(l)}
                        value={quantitesRetour[l.idProduit] || ''}
                        onChange={(e) => definirQuantite(l.idProduit, e.target.value)}
                        className="input !w-20"
                        disabled={restant(l) <= 0}
                      />
                    </td>
                    <td>
                      <input
                        value={motifs[l.idProduit] || ''}
                        onChange={(e) => setMotifs((m) => ({ ...m, [l.idProduit]: e.target.value }))}
                        className="input !w-36" placeholder="Motif (optionnel)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {estEchange && (
          <div className="card p-5">
            <p className="label !mb-2">Produits donnes en echange</p>
            <form onSubmit={ajouterProduitEchange} className="mb-3 flex gap-2">
              <input value={codeBarresEchange} onChange={(e) => setCodeBarresEchange(e.target.value)} className="input flex-1" placeholder="Scanner le code-barres du nouveau produit…" />
              <button type="submit" className="btn-primary">Ajouter</button>
            </form>
            {lignesEchange.length > 0 && (
              <table className="table-erp">
                <thead><tr><th>Produit</th><th>Qte</th><th>P.U.</th><th>Total</th></tr></thead>
                <tbody>
                  {lignesEchange.map((l) => (
                    <tr key={l.idProduit}>
                      <td>{l.nom}</td>
                      <td className="font-mono">{l.quantite}</td>
                      <td className="font-mono">{formaterMontant(l.prixUnitaire)}</td>
                      <td className="font-mono">{formaterMontant(l.quantite * l.prixUnitaire)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="card p-5">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-ink/50">Valeur retournee</p><p className="font-mono font-bold">{formaterMontant(totalRetourne)}</p></div>
            {estEchange && <div><p className="text-ink/50">Valeur echangee</p><p className="font-mono font-bold">{formaterMontant(totalEchange)}</p></div>}
            {estEchange && totalEchange !== totalRetourne && (
              <div>
                <p className="text-ink/50">{totalEchange > totalRetourne ? 'Complement a payer' : 'A rembourser au client'}</p>
                <p className="font-mono font-bold text-gold-600">{formaterMontant(Math.abs(totalEchange - totalRetourne))}</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="label">Observation</label>
            <textarea rows={2} className="input" value={observation} onChange={(e) => setObservation(e.target.value)} />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Valider le retour</button>
            <button type="button" onClick={() => navigate('/retours')} className="btn-ghost">Annuler</button>
          </div>
        </div>
      </form>
    </>
  )
}
