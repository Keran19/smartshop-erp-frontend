import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant, formaterDate, aujourdhuiISO } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const LIBELLES_STATUT_VALIDATION = {
  NON_TRAITE: { texte: 'A examiner', couleur: 'gris' },
  VALIDE: { texte: 'Validé', couleur: 'vert' },
  IMPUTE_SALAIRE: { texte: 'Imputé sur salaire', couleur: 'rouge' },
}

export default function GestionCaisseAdmin() {
  const { notifier } = useToast()
  const [date, setDate] = useState(aujourdhuiISO())
  const [sessions, setSessions] = useState([])
  const [chargement, setChargement] = useState(true)

  const [modalSession, setModalSession] = useState(null)
  const [choixStatut, setChoixStatut] = useState('VALIDE')
  const [montantImpute, setMontantImpute] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get('/caisse/admin/sessions', { params: { date } })
      setSessions(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de charger les caisses'), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [date]) // eslint-disable-line

  const totaux = sessions.reduce(
    (acc, s) => ({
      ventes: acc.ventes + (s.montantVenteEspeces || 0) + (s.montantVenteCredit || 0),
      credit: acc.credit + (s.montantVenteCredit || 0),
      depenses: acc.depenses + (s.depensesJournee || 0),
      ecarts: acc.ecarts + (s.statut === 'FERMEE' ? (s.ecart || 0) : 0),
    }),
    { ventes: 0, credit: 0, depenses: 0, ecarts: 0 }
  )

  function ouvrirValidation(session) {
    setModalSession(session)
    setChoixStatut('VALIDE')
    setMontantImpute(Math.abs(session.ecart || 0).toString())
    setCommentaire('')
  }

  async function soumettreValidation(e) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post(`/caisse/${modalSession.idSession}/valider-ecart`, {
        statut: choixStatut,
        commentaire: commentaire || null,
        montantImpute: choixStatut === 'IMPUTE_SALAIRE' ? Number(montantImpute) || 0 : null,
      })
      notifier('Ecart traité')
      setModalSession(null)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de traiter cet écart'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Gestion de caisse" description="Vue globale de toutes les caisses de la journée, tous vendeurs et boutiques confondus." />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Journée</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      {!chargement && sessions.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-4"><p className="text-xs text-ink/50">Ventes du jour</p><p className="font-mono text-lg font-bold text-forest-800">{formaterMontant(totaux.ventes)}</p></div>
          <div className="card p-4"><p className="text-xs text-ink/50">Dont crédit</p><p className="font-mono text-lg font-bold text-gold-600">{formaterMontant(totaux.credit)}</p></div>
          <div className="card p-4"><p className="text-xs text-ink/50">Dépenses</p><p className="font-mono text-lg font-bold text-red-600">{formaterMontant(totaux.depenses)}</p></div>
          <div className="card p-4"><p className="text-xs text-ink/50">Total des écarts</p><p className={`font-mono text-lg font-bold ${totaux.ecarts < 0 ? 'text-red-600' : totaux.ecarts > 0 ? 'text-gold-600' : 'text-forest-800'}`}>{formaterMontant(totaux.ecarts)}</p></div>
        </div>
      )}

      {chargement ? (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>
      ) : sessions.length === 0 ? (
        <EmptyState titre="Aucune caisse ce jour-là" description="Personne n'a ouvert de caisse a cette date." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-erp">
            <thead>
              <tr>
                <th>Vendeur</th><th>Boutique</th><th>Ouverture</th><th>Ventes esp.</th><th>Ventes crédit</th>
                <th>Dépenses</th><th>Théorique</th><th>Renseigné</th><th>Écart</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const val = LIBELLES_STATUT_VALIDATION[s.statutValidationEcart] || LIBELLES_STATUT_VALIDATION.NON_TRAITE
                return (
                  <tr key={s.idSession}>
                    <td className="font-medium">{s.vendeur}</td>
                    <td className="text-xs">{s.boutique}</td>
                    <td className="whitespace-nowrap text-xs text-ink/60">{formaterDate(s.dateOuverture)}</td>
                    <td className="font-mono">{formaterMontant(s.montantVenteEspeces)}</td>
                    <td className="font-mono text-gold-600">{formaterMontant(s.montantVenteCredit)}</td>
                    <td className="font-mono text-red-600">{formaterMontant(s.depensesJournee)}</td>
                    <td className="font-mono">{formaterMontant(s.montantTheoriqueAttendu)}</td>
                    <td className="font-mono">{s.statut === 'FERMEE' ? formaterMontant(s.montantRenseigne) : '—'}</td>
                    <td className={`font-mono font-semibold ${s.ecart < 0 ? 'text-red-600' : s.ecart > 0 ? 'text-gold-600' : ''}`}>
                      {s.statut === 'FERMEE' ? formaterMontant(s.ecart) : '—'}
                    </td>
                    <td>
                      <Badge couleur={s.statut === 'OUVERTE' ? 'vert' : val.couleur}>
                        {s.statut === 'OUVERTE' ? 'Ouverte' : val.texte}
                      </Badge>
                    </td>
                    <td>
                      {s.statut === 'FERMEE' && s.statutValidationEcart === 'NON_TRAITE' && (
                        <button onClick={() => ouvrirValidation(s)} className="text-xs font-semibold text-forest-700 hover:underline">
                          Examiner
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal ouvert={!!modalSession} onFermer={() => setModalSession(null)} titre="Traiter l'écart de caisse" largeur="max-w-md">
        {modalSession && (
          <form onSubmit={soumettreValidation} className="flex flex-col gap-4">
            <div className="rounded-lg bg-forest-50 p-3 text-sm">
              <p className="font-medium">{modalSession.vendeur} — {modalSession.boutique}</p>
              <div className="mt-1 flex justify-between"><span className="text-ink/60">Écart constaté</span>
                <span className={`font-mono font-bold ${modalSession.ecart < 0 ? 'text-red-600' : 'text-gold-600'}`}>{formaterMontant(modalSession.ecart)}</span>
              </div>
            </div>

            <div>
              <label className="label">Decision</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setChoixStatut('VALIDE')} className={`btn flex-1 ${choixStatut === 'VALIDE' ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-700'}`}>
                  Valider tel quel
                </button>
                <button type="button" onClick={() => setChoixStatut('IMPUTE_SALAIRE')} className={`btn flex-1 ${choixStatut === 'IMPUTE_SALAIRE' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>
                  Imputer sur salaire
                </button>
              </div>
            </div>

            {choixStatut === 'IMPUTE_SALAIRE' && (
              <div>
                <label className="label">Montant à imputer</label>
                <input type="number" min="0" value={montantImpute} onChange={(e) => setMontantImpute(e.target.value)} className="input" />
              </div>
            )}

            <div>
              <label className="label">Commentaire (optionnel)</label>
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="input" rows={2} />
            </div>

            <button type="submit" disabled={envoi} className="btn-primary w-full">
              {envoi && <Spinner />} Confirmer
            </button>
          </form>
        )}
      </Modal>
    </>
  )
}
