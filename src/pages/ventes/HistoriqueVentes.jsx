import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate, aujourdhuiISO } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

export default function HistoriqueVentes() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const [dateDebut, setDateDebut] = useState(aujourdhuiISO())
  const [dateFin, setDateFin] = useState(aujourdhuiISO())
  const [ventes, setVentes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [exportEnCours, setExportEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/ventes/historique', { params: { dateDebut, dateFin, idBoutique } })
      setVentes(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger l\'historique'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { if (idBoutique) charger() }, [idBoutique]) // eslint-disable-line

  async function exporterPdf() {
    setExportEnCours(true)
    try {
      const { data } = await api.get('/ventes/historique/pdf', {
        params: { dateDebut, dateFin, idBoutique },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-ventes-${dateDebut}-${dateFin}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de generer le PDF'), 'erreur')
    } finally {
      setExportEnCours(false)
    }
  }

  async function imprimer(idVente) {
    try {
      const { data } = await api.get(`/ventes/${idVente}/imprimer`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(data)
      window.open(url, '_blank')
    } catch (err) {
      notifier(messageErreur(err, 'Impression impossible'), 'erreur')
    }
  }

  const totalCA = ventes.reduce((s, v) => s + v.montantFinal, 0)
  const totalBenefice = ventes.reduce((s, v) => s + (v.benefice || 0), 0)

  return (
    <>
      <PageHeader titre="Historique des ventes" description="Consultez et exportez vos ventes sur la periode de votre choix." />

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Du</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Au</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" />
        </div>
        <button onClick={charger} className="btn-primary">Filtrer</button>
        <button onClick={exporterPdf} disabled={exportEnCours || ventes.length === 0} className="btn-gold ml-auto">
          {exportEnCours ? <Spinner /> : '⬇️'} Exporter en PDF
        </button>
      </div>

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : ventes.length === 0 ? (
        <EmptyState titre="Aucune vente sur cette periode" description="Modifiez la periode ou effectuez une nouvelle vente." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-ink/50">Nombre de ventes</p><p className="font-display text-xl font-bold text-forest-800">{ventes.length}</p></div>
            <div className="card p-4"><p className="text-xs text-ink/50">Chiffre d'affaires</p><p className="font-display text-xl font-bold text-forest-800">{formaterMontant(totalCA)}</p></div>
            <div className="card p-4"><p className="text-xs text-ink/50">Benefice total</p><p className="font-display text-xl font-bold text-gold-600">{formaterMontant(totalBenefice)}</p></div>
          </div>

          <div className="card overflow-x-auto">
            <table className="table-erp">
              <thead>
                <tr>
                  <th>N° Vente</th><th>Date</th><th>Client</th><th>Vendeur</th>
                  <th>Reglement</th><th>Montant final</th><th>Benefice</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {ventes.map((v) => (
                  <tr key={v.idVente}>
                    <td className="font-mono text-xs">{v.numeroVente}</td>
                    <td className="whitespace-nowrap text-xs">{formaterDate(v.dateVente)}</td>
                    <td>{v.client || 'Client de passage'}</td>
                    <td>{v.vendeur}</td>
                    <td><Badge couleur={v.modeReglement === 'CREDIT' ? 'or' : 'vert'}>{v.modeReglement}</Badge></td>
                    <td className="font-mono font-semibold">{formaterMontant(v.montantFinal)}</td>
                    <td className="font-mono text-forest-700">{formaterMontant(v.benefice)}</td>
                    <td><Badge couleur={v.statut === 'VALIDEE' ? 'vert' : v.statut === 'ANNULEE' ? 'rouge' : 'gris'}>{v.statut}</Badge></td>
                    <td>
                      <button onClick={() => imprimer(v.idVente)} className="text-forest-700 hover:underline" title="Imprimer">🖨️</button>
                    </td>
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
