import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function PointDeVente() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [codeBarres, setCodeBarres] = useState('')
  const [panier, setPanier] = useState([]) // { idProduit, nom, codeBarres, quantite, prixUnitaire }
  const [clients, setClients] = useState([])
  const [rechercheClient, setRechercheClient] = useState('')
  const [idClient, setIdClient] = useState('')
  const [modeReglement, setModeReglement] = useState('COMPTANT')
  const [montantRecu, setMontantRecu] = useState('')
  const [remise, setRemise] = useState('')
  const [dateLimiteCredit, setDateLimiteCredit] = useState('')
  const [scanEnCours, setScanEnCours] = useState(false)
  const [apercu, setApercu] = useState(null)
  const [validationEnCours, setValidationEnCours] = useState(false)
  const [derniereVente, setDerniereVente] = useState(null)
  const champScanRef = useRef(null)

  useEffect(() => {
    champScanRef.current?.focus()
  }, [])

  useEffect(() => {
    if (rechercheClient.trim().length < 2) { setClients([]); return }
    const t = setTimeout(() => {
      api.get('/clients/recherche', { params: { q: rechercheClient } })
        .then((res) => setClients(res.data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [rechercheClient])

  async function ajouterAuPanier(e) {
    e.preventDefault()
    const code = codeBarres.trim()
    if (!code) return
    setScanEnCours(true)
    try {
      const { data: produit } = await api.get(`/produits/scan/${encodeURIComponent(code)}`)

      setPanier((actuel) => {
        const existant = actuel.find((l) => l.idProduit === produit.idProduit)
        const prix = produit.stocks?.find((s) => s.idBoutique === idBoutique)?.prixVente ?? produit.prixVente
        if (existant) {
          return actuel.map((l) =>
            l.idProduit === produit.idProduit ? { ...l, quantite: l.quantite + 1 } : l
          )
        }
        return [...actuel, {
          idProduit: produit.idProduit,
          nom: produit.nom,
          codeBarres: produit.codeBarres,
          quantite: 1,
          prixUnitaire: prix,
        }]
      })
      setCodeBarres('')

      // Alerte marge : si le prix de vente actuel ne couvre plus le cout du lot le plus ancien
      // encore en stock (achete a un prix different), on previent tout de suite le vendeur.
      try {
        const { data: lot } = await api.get('/approvisionnements/lot-actuel', {
          params: { idProduit: produit.idProduit, idBoutique },
        })
        if (lot.alerteMarge) {
          notifier(
            `Attention : "${lot.nomProduit}" est vendu a perte au prix actuel (lot achete a ${lot.prixAchatLotActuel} FCFA)`,
            'erreur'
          )
        }
      } catch { /* pas bloquant si l'info de lot n'est pas disponible */ }
    } catch (err) {
      if (err.response?.data?.code === 'PRODUIT_INCONNU') {
        notifier('Produit inconnu : creez-le pour continuer', 'erreur')
        navigate(`/produits/nouveau?codeBarres=${encodeURIComponent(code)}`)
      } else {
        notifier(messageErreur(err, 'Produit introuvable'), 'erreur')
      }
    } finally {
      setScanEnCours(false)
      champScanRef.current?.focus()
    }
  }

  function modifierQuantite(idProduit, delta) {
    setPanier((actuel) =>
      actuel
        .map((l) => (l.idProduit === idProduit ? { ...l, quantite: l.quantite + delta } : l))
        .filter((l) => l.quantite > 0)
    )
  }

  /** Modification manuelle du prix unitaire d'une ligne du panier (vendeurs et gerants). */
  function modifierPrixLigne(idProduit, valeur) {
    const prix = Number(valeur)
    setPanier((actuel) =>
      actuel.map((l) => (l.idProduit === idProduit ? { ...l, prixUnitaire: Number.isFinite(prix) && prix >= 0 ? prix : 0 } : l))
    )
  }

  function retirerLigne(idProduit) {
    setPanier((actuel) => actuel.filter((l) => l.idProduit !== idProduit))
  }

  const totalPanier = panier.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)
  const montantFinalEstime = totalPanier - (Number(remise) || 0)
  const monnaieEstimee = Math.max(0, (Number(montantRecu) || 0) - montantFinalEstime)

  function construireRequete() {
    return {
      idBoutique,
      idClient: idClient || null,
      modeReglement,
      remiseGlobale: Number(remise) || 0,
      montantRecu: montantRecu === '' ? null : Number(montantRecu),
      dateLimiteCredit: modeReglement === 'CREDIT' ? (dateLimiteCredit || null) : null,
      // prixUnitaire est envoye tel qu'ajuste dans le panier : le backend l'utilise directement
      // comme prix force pour la ligne (aucune restriction de role sur cet override).
      lignes: panier.map((l) => ({ idProduit: l.idProduit, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
    }
  }

  async function ouvrirApercu() {
    if (panier.length === 0) { notifier('Le panier est vide', 'erreur'); return }
    if (modeReglement === 'CREDIT' && !idClient) { notifier('Un client est requis pour une vente a credit', 'erreur'); return }
    try {
      const { data } = await api.post('/ventes/apercu', construireRequete())
      setApercu(data)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de calculer l\'apercu'), 'erreur')
    }
  }

  async function validerVente() {
    setValidationEnCours(true)
    try {
      const { data } = await api.post('/ventes', construireRequete())
      setDerniereVente(data)
      setApercu(null)
      setPanier([])
      setMontantRecu('')
      setRemise('')
      setIdClient('')
      setRechercheClient('')
      notifier(`Vente ${data.numeroVente} validee`)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de valider la vente'), 'erreur')
    } finally {
      setValidationEnCours(false)
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

  return (
    <>
      <PageHeader titre="Point de vente" description="Scannez ou recherchez un produit pour l'ajouter au panier." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Panier */}
        <div className="card flex flex-col p-5 lg:col-span-2">
          <form onSubmit={ajouterAuPanier} className="mb-4 flex gap-2">
            <input
              ref={champScanRef}
              value={codeBarres}
              onChange={(e) => setCodeBarres(e.target.value)}
              placeholder="Scanner ou saisir un code-barres…"
              className="input flex-1"
              autoFocus
            />
            <button type="submit" disabled={scanEnCours} className="btn-primary">
              {scanEnCours ? <Spinner /> : '➕'} Ajouter
            </button>
          </form>

          {panier.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl2 border border-dashed border-forest-200 py-16 text-center text-sm text-ink/50">
              Le panier est vide. Scannez un produit pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-erp">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Qte</th>
                    <th>P.U.</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {panier.map((l) => (
                    <tr key={l.idProduit}>
                      <td className="font-medium">{l.nom}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => modifierQuantite(l.idProduit, -1)} className="rounded bg-forest-50 px-2 py-0.5 font-bold text-forest-700 hover:bg-forest-100">−</button>
                          <span className="w-8 text-center font-mono">{l.quantite}</span>
                          <button onClick={() => modifierQuantite(l.idProduit, 1)} className="rounded bg-forest-50 px-2 py-0.5 font-bold text-forest-700 hover:bg-forest-100">+</button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="1"
                          value={l.prixUnitaire}
                          onChange={(e) => modifierPrixLigne(l.idProduit, e.target.value)}
                          className="input !w-24 font-mono"
                          title="Modifier le prix unitaire pour cette vente"
                        />
                      </td>
                      <td className="font-mono font-semibold">{formaterMontant(l.quantite * l.prixUnitaire)}</td>
                      <td>
                        <button onClick={() => retirerLigne(l.idProduit)} className="text-red-500 hover:text-red-700" aria-label="Retirer">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recapitulatif / paiement */}
        <div className="card flex flex-col gap-4 p-5">
          <div>
            <label className="label">Client (optionnel)</label>
            <input
              value={rechercheClient}
              onChange={(e) => { setRechercheClient(e.target.value); setIdClient('') }}
              placeholder="Nom ou telephone…"
              className="input"
            />
            {clients.length > 0 && !idClient && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-forest-100">
                {clients.map((c) => (
                  <button
                    key={c.idClient}
                    onClick={() => { setIdClient(c.idClient); setRechercheClient(`${c.nom} ${c.prenom || ''}`.trim()); setClients([]) }}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-forest-50"
                  >
                    {c.nom} {c.prenom} {c.telephone ? `· ${c.telephone}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Mode de reglement</label>
            <div className="flex gap-2">
              <button onClick={() => setModeReglement('COMPTANT')} className={`btn flex-1 ${modeReglement === 'COMPTANT' ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-700'}`}>Comptant</button>
              <button onClick={() => setModeReglement('CREDIT')} className={`btn flex-1 ${modeReglement === 'CREDIT' ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-700'}`}>Credit</button>
            </div>
          </div>

          {modeReglement === 'CREDIT' && (
            <div>
              <label className="label">Date limite de paiement</label>
              <input type="date" value={dateLimiteCredit} onChange={(e) => setDateLimiteCredit(e.target.value)} className="input" />
            </div>
          )}

          <div>
            <label className="label">Remise globale</label>
            <input type="number" min="0" value={remise} onChange={(e) => setRemise(e.target.value)} className="input" placeholder="0" />
          </div>

          <div>
            <label className="label">Montant recu</label>
            <input type="number" min="0" value={montantRecu} onChange={(e) => setMontantRecu(e.target.value)} className="input" placeholder="0" />
          </div>

          <div className="rounded-lg bg-forest-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Total</span><span className="font-mono font-semibold">{formaterMontant(totalPanier)}</span></div>
            <div className="flex justify-between"><span className="text-ink/60">A payer</span><span className="font-mono font-bold text-forest-800">{formaterMontant(montantFinalEstime)}</span></div>
            {montantRecu !== '' && (
              <div className="flex justify-between"><span className="text-ink/60">Monnaie a rendre</span><span className="font-mono font-bold text-gold-600">{formaterMontant(monnaieEstimee)}</span></div>
            )}
          </div>

          <button onClick={ouvrirApercu} className="btn-gold w-full">
            🖨️ Confirmer l'impression
          </button>
        </div>
      </div>

      {/* Apercu avant validation */}
      <Modal ouvert={!!apercu} onFermer={() => setApercu(null)} titre="Recapitulatif de la vente" largeur="max-w-xl">
        {apercu && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="table-erp">
                <thead><tr><th>Produit</th><th>Qte</th><th>P.U.</th><th>Total</th></tr></thead>
                <tbody>
                  {apercu.lignes.map((l) => (
                    <tr key={l.idProduit}>
                      <td>{l.nomProduit}</td>
                      <td className="font-mono">{l.quantite}</td>
                      <td className="font-mono">{formaterMontant(l.prixUnitaire)}</td>
                      <td className="font-mono">{formaterMontant(l.sousTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg bg-forest-50 p-3 text-sm">
              <div className="flex justify-between"><span>Montant total</span><span className="font-mono">{formaterMontant(apercu.montantTotal)}</span></div>
              <div className="flex justify-between"><span>Remise</span><span className="font-mono">{formaterMontant(apercu.remiseGlobale)}</span></div>
              <div className="flex justify-between font-bold"><span>Montant a payer</span><span className="font-mono">{formaterMontant(apercu.montantFinal)}</span></div>
              {apercu.montantRecu != null && (
                <>
                  <div className="flex justify-between"><span>Montant recu</span><span className="font-mono">{formaterMontant(apercu.montantRecu)}</span></div>
                  <div className="flex justify-between font-bold text-gold-600"><span>Monnaie a rendre</span><span className="font-mono">{formaterMontant(apercu.monnaieRendue)}</span></div>
                </>
              )}
            </div>
            <button onClick={validerVente} disabled={validationEnCours} className="btn-primary w-full">
              {validationEnCours && <Spinner />} Valider la vente
            </button>
          </div>
        )}
      </Modal>

      {/* Vente validee */}
      <Modal ouvert={!!derniereVente} onFermer={() => setDerniereVente(null)} titre="Vente validee ✅" largeur="max-w-sm">
        {derniereVente && (
          <div className="flex flex-col gap-3 text-sm">
            <p>La vente <strong>{derniereVente.numeroVente}</strong> a ete enregistree.</p>
            <p className="text-ink/60">Monnaie a rendre : <span className="font-mono font-bold text-gold-600">{formaterMontant(derniereVente.monnaieRendue)}</span></p>
            <button onClick={() => imprimer(derniereVente.idVente)} className="btn-primary w-full">🖨️ Imprimer la facture</button>
            <button onClick={() => setDerniereVente(null)} className="btn-ghost w-full">Nouvelle vente</button>
          </div>
        )}
      </Modal>
    </>
  )
}
