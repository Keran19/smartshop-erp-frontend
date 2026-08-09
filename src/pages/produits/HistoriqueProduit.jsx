import { useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate, aujourdhuiISO, premierJourDuMoisISO } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function HistoriqueProduit() {
  const { notifier } = useToast()
  const [codeBarres, setCodeBarres] = useState('')
  const [dateDebut, setDateDebut] = useState(premierJourDuMoisISO())
  const [dateFin, setDateFin] = useState(aujourdhuiISO())
  const [resultat, setResultat] = useState(null)
  const [chargement, setChargement] = useState(false)

  async function rechercher(e) {
    e.preventDefault()
    if (!codeBarres.trim()) return
    setChargement(true)
    setResultat(null)
    try {
      const { data } = await api.get(`/produits/scan/${encodeURIComponent(codeBarres.trim())}/historique-ventes`, {
        params: { dateDebut, dateFin },
      })
      setResultat(data)
    } catch (err) {
      if (err.response?.data?.code === 'PRODUIT_INCONNU') {
        notifier('Aucun produit ne correspond a ce code-barres', 'erreur')
      } else {
        notifier(messageErreur(err, 'Recherche impossible'), 'erreur')
      }
    } finally {
      setChargement(false)
    }
  }

  return (
    <>
      <PageHeader titre="Historique de vente d'un produit" description="Entrez un code-barres pour voir comment ce produit s'est vendu sur une periode." />

      <form onSubmit={rechercher} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="label">Code-barres</label>
          <input value={codeBarres} onChange={(e) => setCodeBarres(e.target.value)} className="input" placeholder="Scanner ou saisir…" />
        </div>
        <div><label className="label">Du</label><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" /></div>
        <div><label className="label">Au</label><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" /></div>
        <button type="submit" disabled={chargement} className="btn-primary">{chargement && <Spinner />} Rechercher</button>
      </form>

      {resultat && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-ink/50">Produit</p><p className="font-display text-lg font-bold text-forest-800">{resultat.nomProduit}</p></div>
            <div className="card p-4"><p className="text-xs text-ink/50">Quantite vendue</p><p className="font-mono text-xl font-bold">{resultat.quantiteTotale}</p></div>
            <div className="card p-4"><p className="text-xs text-ink/50">Montant total</p><p className="font-mono text-xl font-bold text-forest-800">{formaterMontant(resultat.montantTotal)}</p></div>
            <div className="card p-4"><p className="text-xs text-ink/50">Benefice</p><p className="font-mono text-xl font-bold text-gold-600">{formaterMontant(resultat.beneficeTotal)}</p></div>
          </div>

          {resultat.ventes.length === 0 ? (
            <EmptyState titre="Aucune vente de ce produit sur cette periode" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="table-erp">
                <thead><tr><th>N° Vente</th><th>Date</th><th>Boutique</th><th>Qte</th><th>P.U.</th><th>Total</th><th>Benefice</th></tr></thead>
                <tbody>
                  {resultat.ventes.map((v, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{v.numeroVente}</td>
                      <td className="whitespace-nowrap text-xs">{formaterDate(v.dateVente)}</td>
                      <td>{v.boutique}</td>
                      <td className="font-mono">{v.quantite}</td>
                      <td className="font-mono">{formaterMontant(v.prixUnitaire)}</td>
                      <td className="font-mono">{formaterMontant(v.sousTotal)}</td>
                      <td className="font-mono text-forest-700">{formaterMontant(v.benefice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
