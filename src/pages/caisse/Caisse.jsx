import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import SaisieCoupures from './SaisieCoupures'

const COUPURES_VIDES = { billet10000: '', billet5000: '', billet2000: '', billet1000: '', billet500: '', pieces: '' }

function versPayload(valeurs) {
  return {
    billet10000: Number(valeurs.billet10000) || 0,
    billet5000: Number(valeurs.billet5000) || 0,
    billet2000: Number(valeurs.billet2000) || 0,
    billet1000: Number(valeurs.billet1000) || 0,
    billet500: Number(valeurs.billet500) || 0,
    pieces: Number(valeurs.pieces) || 0,
  }
}

export default function Caisse() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()

  const [session, setSession] = useState(null)
  const [historique, setHistorique] = useState([])
  const [chargement, setChargement] = useState(true)

  const [coupuresOuverture, setCoupuresOuverture] = useState(COUPURES_VIDES)
  const [observationOuverture, setObservationOuverture] = useState('')
  const [envoiOuverture, setEnvoiOuverture] = useState(false)

  const [modalFermeture, setModalFermeture] = useState(false)
  const [coupuresFermeture, setCoupuresFermeture] = useState(COUPURES_VIDES)
  const [observationFermeture, setObservationFermeture] = useState('')
  const [envoiFermeture, setEnvoiFermeture] = useState(false)
  const [resultatFermeture, setResultatFermeture] = useState(null)

  async function charger() {
    if (!idBoutique) return
    setChargement(true)
    try {
      const [histo] = await Promise.all([api.get('/caisse/historique', { params: { idBoutique } })])
      setHistorique(histo.data)
      try {
        const { data } = await api.get('/caisse/ouverte', { params: { idBoutique } })
        setSession(data)
      } catch {
        setSession(null)
      }
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger la caisse'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [idBoutique]) // eslint-disable-line

  async function ouvrirCaisse(e) {
    e.preventDefault()
    setEnvoiOuverture(true)
    try {
      const { data } = await api.post('/caisse/ouvrir', {
        idBoutique,
        coupures: versPayload(coupuresOuverture),
        observation: observationOuverture || null,
      })
      setSession(data)
      setCoupuresOuverture(COUPURES_VIDES)
      setObservationOuverture('')
      notifier('Caisse ouverte')
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Ouverture impossible'), 'erreur')
    } finally {
      setEnvoiOuverture(false)
    }
  }

  async function fermerCaisse(e) {
    e.preventDefault()
    setEnvoiFermeture(true)
    try {
      const { data } = await api.post(`/caisse/${session.idSession}/fermer`, {
        coupures: versPayload(coupuresFermeture),
        observation: observationFermeture || null,
      })
      setResultatFermeture(data)
      setSession(null)
      notifier('Caisse fermee')
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Fermeture impossible'), 'erreur')
    } finally {
      setEnvoiFermeture(false)
    }
  }

  return (
    <>
      <PageHeader titre="Caisse" description="Declarez le fond de caisse a l'ouverture et le montant compte a la fermeture." />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : session ? (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Badge couleur="vert">Session ouverte</Badge>
              <p className="mt-2 text-sm text-ink/60">
                Ouverte le {formaterDate(session.dateOuverture)} par <strong>{session.utilisateur}</strong>
              </p>
            </div>
            <p className="text-right">
              <span className="block text-xs text-ink/50">Fond de caisse declare</span>
              <span className="font-mono text-xl font-bold text-forest-800">{formaterMontant(session.fondCaisse)}</span>
            </p>
          </div>
          <button onClick={() => setModalFermeture(true)} className="btn-primary">🔒 Fermer la caisse</button>
        </div>
      ) : (
        <form onSubmit={ouvrirCaisse} className="card flex flex-col gap-4 p-5">
          <p className="font-display font-semibold text-forest-800">Ouverture de caisse</p>
          <SaisieCoupures valeurs={coupuresOuverture} onChange={setCoupuresOuverture} />
          <div>
            <label className="label">Observation</label>
            <input value={observationOuverture} onChange={(e) => setObservationOuverture(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={envoiOuverture} className="btn-gold w-fit">{envoiOuverture && <Spinner />} Ouvrir la caisse</button>
        </form>
      )}

      {historique.length > 0 && (
        <div className="card overflow-x-auto">
          <p className="p-4 pb-0 font-display font-semibold text-forest-800">Historique des sessions</p>
          <table className="table-erp">
            <thead><tr><th>Ouverture</th><th>Fermeture</th><th>Fond</th><th>Theorique</th><th>Compte</th><th>Ecart</th><th>Statut</th></tr></thead>
            <tbody>
              {historique.map((s) => (
                <tr key={s.idSession}>
                  <td className="whitespace-nowrap text-xs">{formaterDate(s.dateOuverture)}</td>
                  <td className="whitespace-nowrap text-xs">{s.dateFermeture ? formaterDate(s.dateFermeture) : '-'}</td>
                  <td className="font-mono">{formaterMontant(s.fondCaisse)}</td>
                  <td className="font-mono">{s.statut === 'FERMEE' ? formaterMontant(s.montantTheorique) : '-'}</td>
                  <td className="font-mono">{s.statut === 'FERMEE' ? formaterMontant(s.montantCompte) : '-'}</td>
                  <td className={`font-mono font-semibold ${s.ecart < 0 ? 'text-red-600' : s.ecart > 0 ? 'text-gold-600' : ''}`}>
                    {s.statut === 'FERMEE' ? formaterMontant(s.ecart) : '-'}
                  </td>
                  <td><Badge couleur={s.statut === 'OUVERTE' ? 'vert' : 'gris'}>{s.statut}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={modalFermeture} onFermer={() => setModalFermeture(false)} titre="Fermeture de caisse" largeur="max-w-xl">
        <form onSubmit={fermerCaisse} className="flex flex-col gap-4">
          <SaisieCoupures valeurs={coupuresFermeture} onChange={setCoupuresFermeture} />
          <div>
            <label className="label">Observation</label>
            <input value={observationFermeture} onChange={(e) => setObservationFermeture(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={envoiFermeture} className="btn-primary">{envoiFermeture && <Spinner />} Confirmer la fermeture</button>
        </form>
      </Modal>

      <Modal ouvert={!!resultatFermeture} onFermer={() => setResultatFermeture(null)} titre="Resultat de la fermeture" largeur="max-w-sm">
        {resultatFermeture && (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Montant theorique</span><span className="font-mono">{formaterMontant(resultatFermeture.montantTheorique)}</span></div>
            <div className="flex justify-between"><span className="text-ink/60">Montant compte</span><span className="font-mono">{formaterMontant(resultatFermeture.montantCompte)}</span></div>
            <div className={`flex justify-between rounded-lg px-3 py-2 font-bold ${resultatFermeture.ecart === 0 ? 'bg-leaf-400/10 text-forest-800' : 'bg-red-50 text-red-700'}`}>
              <span>Ecart</span><span className="font-mono">{formaterMontant(resultatFermeture.ecart)}</span>
            </div>
            <button onClick={() => setResultatFermeture(null)} className="btn-primary mt-2">Fermer</button>
          </div>
        )}
      </Modal>
    </>
  )
}
