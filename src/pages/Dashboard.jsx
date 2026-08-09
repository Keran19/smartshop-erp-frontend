import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, messageErreur } from '../lib/api'
import { formaterMontant } from '../lib/format'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [statsMois, setStatsMois] = useState(null)
  const [alertes, setAlertes] = useState([])
  const [chargement, setChargement] = useState(true)
  const { notifier } = useToast()
  const { utilisateur } = useAuth()

  useEffect(() => {
    let actif = true
    async function charger() {
      try {
        const [jour, mois, produitsAlerte] = await Promise.all([
          api.get('/statistiques/aujourdhui'),
          api.get('/statistiques/mensuel'),
          api.get('/produits/alertes'),
        ])
        if (!actif) return
        setStats(jour.data)
        setStatsMois(mois.data)
        setAlertes(produitsAlerte.data)
      } catch (err) {
        notifier(messageErreur(err, 'Impossible de charger le tableau de bord'), 'erreur')
      } finally {
        if (actif) setChargement(false)
      }
    }
    charger()
    return () => { actif = false }
  }, [notifier])

  return (
    <>
      <PageHeader
        titre={`Bonjour ${utilisateur?.prenom || ''}`}
        description="Voici un apercu de votre activite aujourd'hui et ce mois-ci."
        actions={
          <Link to="/vente" className="btn-gold">
            🛒 Nouvelle vente
          </Link>
        }
      />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-forest-800">Aujourd'hui</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Chiffre d'affaires" valeur={formaterMontant(stats?.chiffreAffaires)} accent="forest" />
              <StatCard label="Ventes" valeur={stats?.nombreVentes ?? 0} accent="leaf" />
              <StatCard label="Benefice" valeur={formaterMontant(stats?.beneficeTotal)} accent="gold" />
              <StatCard label="Nouveaux clients" valeur={stats?.nombreNouveauxClients ?? 0} accent="forest" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-forest-800">Ce mois-ci</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Chiffre d'affaires" valeur={formaterMontant(statsMois?.chiffreAffaires)} accent="forest" />
              <StatCard label="Ventes" valeur={statsMois?.nombreVentes ?? 0} accent="leaf" />
              <StatCard label="Benefice" valeur={formaterMontant(statsMois?.beneficeTotal)} accent="gold" />
              <StatCard
                label="Produit vedette"
                valeur={statsMois?.produitLePlusVendu?.nom || '—'}
                sousTexte={statsMois?.produitLePlusVendu ? `${statsMois.produitLePlusVendu.quantiteVendue} unites vendues` : ''}
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-forest-800">Alertes de stock</h2>
              <Link to="/produits" className="text-sm font-semibold text-forest-700 hover:underline">
                Voir tous les produits →
              </Link>
            </div>
            {alertes.length === 0 ? (
              <EmptyState titre="Aucune alerte" description="Tous les produits sont au-dessus de leur seuil d'alerte." />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-erp">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Code-barres</th>
                      <th>Stock restant</th>
                      <th>Seuil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertes.map((p) => (
                      <tr key={`${p.idProduit}-${p.stocks?.[0]?.idBoutique}`}>
                        <td className="font-medium">{p.nom}</td>
                        <td className="font-mono text-xs">{p.codeBarres}</td>
                        <td className="font-mono text-red-600 font-semibold">{p.quantiteTotale}</td>
                        <td className="font-mono">{p.seuilAlerte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
