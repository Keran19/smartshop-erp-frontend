import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
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

/** Ligne simple "libelle / montant" utilisee dans la mini-fenetre des mouvements. */
function LigneMontant({ label, valeur, accent }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/60">{label}</span>
      <span className={`font-mono ${accent || ''}`}>{formaterMontant(valeur)}</span>
    </div>
  )
}

const LIBELLES_TYPE = {
  VENTE_ESPECES: { texte: 'Vente', couleur: 'bg-forest-100 text-forest-800' },
  VENTE_CREDIT: { texte: 'Vente credit', couleur: 'bg-gold-100 text-gold-800' },
  REMBOURSEMENT_CREDIT: { texte: 'Remb. credit', couleur: 'bg-forest-100 text-forest-800' },
  ACOMPTE: { texte: 'Acompte', couleur: 'bg-forest-100 text-forest-800' },
  RETOUR: { texte: 'Retour/echange', couleur: 'bg-orange-100 text-orange-800' },
  DEPENSE: { texte: 'Depense', couleur: 'bg-red-100 text-red-800' },
}

/** Tableau detaille : une ligne par operation individuelle de la session (retours, remboursements, depenses...). */
function JournalCaisse({ journal }) {
  if (journal.length === 0) return null
  return (
    <div className="card overflow-x-auto p-5">
      <p className="mb-3 font-display font-semibold text-forest-800">Journal des mouvements</p>
      <table className="table-erp">
        <thead><tr><th>Heure</th><th>Type</th><th>Reference</th><th>Detail</th><th>Montant</th></tr></thead>
        <tbody>
          {journal.map((m, i) => {
            const info = LIBELLES_TYPE[m.type] || { texte: m.type, couleur: 'bg-ink/10' }
            return (
              <tr key={i}>
                <td className="whitespace-nowrap text-xs text-ink/60">{formaterDate(m.date)}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.couleur}`}>{info.texte}</span></td>
                <td className="text-xs">{m.reference || '-'}</td>
                <td className="text-sm">{m.libelle}</td>
                <td className={`font-mono font-semibold ${m.montant < 0 ? 'text-red-600' : m.montant > 0 ? 'text-forest-700' : 'text-ink/40'}`}>
                  {m.montant > 0 ? '+' : ''}{formaterMontant(m.montant)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Caisse() {
  const { utilisateur } = useAuth()
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()

  const [session, setSession] = useState(null)
  const [mouvements, setMouvements] = useState(null)
  const [journal, setJournal] = useState([])
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
    setChargement(true)
    try {
      const histo = await api.get('/caisse/mon-historique')
      setHistorique(histo.data)

      try {
        const { data } = await api.get('/caisse/ouverte')
        setSession(data)
        const mvts = await api.get(`/caisse/${data.idSession}/mouvements`)
        setMouvements(mvts.data)
        const jour = await api.get(`/caisse/${data.idSession}/journal`)
        setJournal(jour.data)
      } catch {
        setSession(null)
        setMouvements(null)
        setJournal([])
      }
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger la caisse'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, []) // eslint-disable-line

  // Rafraichit les mouvements toutes les 30s pendant qu'une session est ouverte, pour que
  // le total des ventes/credits/depenses reste a jour sans que l'utilisateur recharge la page.
  useEffect(() => {
    if (!session) return
    const intervalle = setInterval(async () => {
      try {
        const { data } = await api.get(`/caisse/${session.idSession}/mouvements`)
        setMouvements(data)
        const jour = await api.get(`/caisse/${session.idSession}/journal`)
        setJournal(jour.data)
      } catch { /* silencieux : pas grave si un rafraichissement echoue */ }
    }, 30000)
    return () => clearInterval(intervalle)
  }, [session])

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

  async function ouvrirModalFermeture() {
    // On rafraichit les mouvements juste avant d'ouvrir la boite de dialogue, pour que le
    // montant du credit de la journee affiche soit bien celui du tout dernier instant.
    try {
      const { data } = await api.get(`/caisse/${session.idSession}/mouvements`)
      setMouvements(data)
    } catch { /* on garde les derniers mouvements connus si ca echoue */ }
    setModalFermeture(true)
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
      setMouvements(null)
      setModalFermeture(false)
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
      <PageHeader
        titre="Ma caisse"
        description={utilisateur ? `Caisse personnelle de ${utilisateur.nom ?? ''} ${utilisateur.prenom ?? ''}`.trim() : 'Declarez le fond de caisse a l\'ouverture et le montant compte a la fermeture.'}
      />

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : session ? (
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Badge couleur="vert">Session ouverte</Badge>
                <p className="mt-2 text-sm text-ink/60">
                  Ouverte le {formaterDate(session.dateOuverture)} &middot; {session.boutique}
                </p>
              </div>
              <p className="text-right">
                <span className="block text-xs text-ink/50">Fond de caisse declare</span>
                <span className="font-mono text-xl font-bold text-forest-800">{formaterMontant(session.fondCaisse)}</span>
              </p>
            </div>
            <button onClick={ouvrirModalFermeture} className="btn-primary">🔒 Fermer la caisse</button>
          </div>

          {mouvements && (
            <div className="card flex flex-col gap-2 p-5">
              <p className="mb-2 font-display font-semibold text-forest-800">Mouvements de la journee</p>
              <LigneMontant label={`Ventes especes (${mouvements.nombreVentes})`} valeur={mouvements.ventesEspeces} />
              <LigneMontant label="Ventes a credit (non encaisse)" valeur={mouvements.ventesCredit} accent="text-gold-600" />
              <LigneMontant label="Remboursements de credit recus" valeur={mouvements.remboursementsCredit} />
              <LigneMontant label="Acomptes recus" valeur={mouvements.acomptesRecus} />
              <LigneMontant label="Complements recus (echanges)" valeur={mouvements.retoursComplements} />
              <LigneMontant label="Retours rembourses" valeur={mouvements.retoursRembourses.toString().startsWith('-') ? mouvements.retoursRembourses : -mouvements.retoursRembourses} accent="text-red-600" />
              <LigneMontant label="Depenses" valeur={-mouvements.depenses} accent="text-red-600" />
              <div className="mt-2 flex justify-between rounded-lg bg-forest-50 px-3 py-2 font-bold text-forest-800">
                <span>Montant theorique actuel</span>
                <span className="font-mono">{formaterMontant(mouvements.montantTheoriqueCourant)}</span>
              </div>
            </div>
          )}

          <JournalCaisse journal={journal} />
        </div>
      ) : (
        <form onSubmit={ouvrirCaisse} className="card flex flex-col gap-4 p-5">
          <p className="font-display font-semibold text-forest-800">Ouverture de caisse</p>
          <p className="text-sm text-ink/60">Le comptage des coupures est obligatoire a l'ouverture comme a la fermeture.</p>
          <SaisieCoupures valeurs={coupuresOuverture} onChange={setCoupuresOuverture} />
          <div>
            <label className="label">Observation</label>
            <input value={observationOuverture} onChange={(e) => setObservationOuverture(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={envoiOuverture} className="btn-gold w-fit">{envoiOuverture && <Spinner />} Ouvrir la caisse</button>
        </form>
      )}

      {historique.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <p className="p-4 pb-0 font-display font-semibold text-forest-800">Mon historique de sessions</p>
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
          {mouvements && (
            <div className="rounded-lg bg-forest-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Ventes a credit de la journee (non encaisse, informatif)</span>
                <span className="font-mono font-semibold text-gold-700">{formaterMontant(mouvements.ventesCredit)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-ink/60">Montant theorique attendu (hors credit)</span>
                <span className="font-mono font-semibold text-forest-800">{formaterMontant(mouvements.montantTheoriqueCourant)}</span>
              </div>
            </div>
          )}
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
            <div className="flex justify-between"><span className="text-ink/60">Ventes a credit (non encaisse)</span><span className="font-mono">{formaterMontant(resultatFermeture.creditNonEncaisse)}</span></div>
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
