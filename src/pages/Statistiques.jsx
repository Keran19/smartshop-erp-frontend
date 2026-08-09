import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api, messageErreur } from '../lib/api'
import { formaterMontant, aujourdhuiISO, premierJourDuMoisISO } from '../lib/format'
import { useBoutique } from '../context/BoutiqueContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'

export default function Statistiques() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const [dateDebut, setDateDebut] = useState(premierJourDuMoisISO())
  const [dateFin, setDateFin] = useState(aujourdhuiISO())
  const [stats, setStats] = useState(null)
  const [chargement, setChargement] = useState(true)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/statistiques/periode', { params: { dateDebut, dateFin, idBoutique } })
      setStats(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les statistiques'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { if (idBoutique) charger() }, [idBoutique]) // eslint-disable-line

  const donneesGraphique = (stats?.classementProduits || []).slice(0, 8).map((p) => ({
    nom: p.nom.length > 14 ? p.nom.slice(0, 14) + '…' : p.nom,
    quantite: p.quantiteVendue,
  }))

  return (
    <>
      <PageHeader titre="Statistiques" description="Chiffre d'affaires, ventes, benefice et produit vedette sur la periode de votre choix." />

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="label">Du</label><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" /></div>
        <div><label className="label">Au</label><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" /></div>
        <button onClick={charger} className="btn-primary">Appliquer</button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setDateDebut(aujourdhuiISO()); setDateFin(aujourdhuiISO()) }} className="btn-ghost !px-3 !py-1.5 text-xs">Aujourd'hui</button>
          <button onClick={() => { setDateDebut(premierJourDuMoisISO()); setDateFin(aujourdhuiISO()) }} className="btn-ghost !px-3 !py-1.5 text-xs">Ce mois-ci</button>
        </div>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Chiffre d'affaires" valeur={formaterMontant(stats.chiffreAffaires)} accent="forest" />
            <StatCard label="Nombre de ventes" valeur={stats.nombreVentes} accent="leaf" />
            <StatCard label="Benefice total" valeur={formaterMontant(stats.beneficeTotal)} accent="gold" />
            <StatCard label="Nouveaux clients" valeur={stats.nombreNouveauxClients} accent="forest" />
          </div>

          {stats.produitLePlusVendu && (
            <div className="card flex items-center gap-4 p-5">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Produit le plus vendu</p>
                <p className="font-display text-lg font-bold text-forest-800">{stats.produitLePlusVendu.nom}</p>
                <p className="text-sm text-ink/60">
                  {stats.produitLePlusVendu.quantiteVendue} unites &middot; {formaterMontant(stats.produitLePlusVendu.montantVentes)}
                </p>
              </div>
            </div>
          )}

          {donneesGraphique.length > 0 && (
            <div className="card p-5">
              <p className="mb-4 font-display font-semibold text-forest-800">Top produits vendus (quantite)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={donneesGraphique}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaf3ec" />
                  <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#155232" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card overflow-x-auto">
            <table className="table-erp">
              <thead><tr><th>Produit</th><th>Reference</th><th>Quantite vendue</th><th>Montant</th><th>Benefice</th></tr></thead>
              <tbody>
                {(stats.classementProduits || []).map((p) => (
                  <tr key={p.idProduit}>
                    <td className="font-medium">{p.nom}</td>
                    <td className="font-mono text-xs">{p.reference || '-'}</td>
                    <td className="font-mono">{p.quantiteVendue}</td>
                    <td className="font-mono">{formaterMontant(p.montantVentes)}</td>
                    <td className="font-mono text-forest-700">{formaterMontant(p.beneficeGenere)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
