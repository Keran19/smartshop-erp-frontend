import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'

export default function ApprovisionnementForm() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [fournisseurs, setFournisseurs] = useState([])
  const [idFournisseur, setIdFournisseur] = useState('')
  const [codeBarres, setCodeBarres] = useState('')
  const [prixAchatSaisie, setPrixAchatSaisie] = useState('')
  const [lignes, setLignes] = useState([])
  const [observation, setObservation] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api.get('/fournisseurs').then(({ data }) => setFournisseurs(data)).catch(() => {})
  }, [])

  async function ajouterProduit(e) {
    e.preventDefault()
    const code = codeBarres.trim()
    if (!code) return
    try {
      const { data: produit } = await api.get(`/produits/scan/${encodeURIComponent(code)}`)
      const prix = prixAchatSaisie ? Number(prixAchatSaisie) : produit.prixAchat
      setLignes((actuel) => {
        const existant = actuel.find((l) => l.idProduit === produit.idProduit)
        if (existant) return actuel.map((l) => l.idProduit === produit.idProduit ? { ...l, quantite: l.quantite + 1 } : l)
        return [...actuel, { idProduit: produit.idProduit, nom: produit.nom, quantite: 1, prixAchat: prix }]
      })
      setCodeBarres('')
      setPrixAchatSaisie('')
    } catch (err) {
      if (err.response?.data?.code === 'PRODUIT_INCONNU') {
        notifier('Produit inconnu : creez-le d\'abord', 'erreur')
        navigate(`/produits/nouveau?codeBarres=${encodeURIComponent(code)}`)
      } else {
        notifier('Produit introuvable', 'erreur')
      }
    }
  }

  function modifierLigne(idProduit, champ, valeur) {
    setLignes((actuel) => actuel.map((l) => l.idProduit === idProduit ? { ...l, [champ]: valeur } : l))
  }

  function retirerLigne(idProduit) {
    setLignes((actuel) => actuel.filter((l) => l.idProduit !== idProduit))
  }

  const total = lignes.reduce((s, l) => s + l.quantite * (Number(l.prixAchat) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!idFournisseur) { notifier('Selectionnez un fournisseur', 'erreur'); return }
    if (lignes.length === 0) { notifier('Ajoutez au moins un produit', 'erreur'); return }

    setEnvoi(true)
    try {
      await api.post('/approvisionnements', {
        idFournisseur: Number(idFournisseur),
        idBoutique,
        lignes: lignes.map((l) => ({ idProduit: l.idProduit, quantite: l.quantite, prixAchat: Number(l.prixAchat) })),
        observation: observation || null,
      })
      notifier('Approvisionnement enregistre, le stock a ete mis a jour')
      navigate('/approvisionnements')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Nouvel approvisionnement" description="La reception est immediate : le stock de la boutique sera mis a jour des la validation." />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="card p-5">
          <label className="label">Fournisseur *</label>
          <select required className="input max-w-sm" value={idFournisseur} onChange={(e) => setIdFournisseur(e.target.value)}>
            <option value="">Choisir…</option>
            {fournisseurs.map((f) => <option key={f.idFournisseur} value={f.idFournisseur}>{f.nom}</option>)}
          </select>
        </div>

        <div className="card p-5">
          <p className="label !mb-2">Produits recus</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <input value={codeBarres} onChange={(e) => setCodeBarres(e.target.value)} placeholder="Scanner le code-barres…" className="input flex-1 min-w-[200px]" />
            <input type="number" min="0" value={prixAchatSaisie} onChange={(e) => setPrixAchatSaisie(e.target.value)} placeholder="Prix d'achat (optionnel)" className="input w-48" />
            <button onClick={ajouterProduit} className="btn-primary">Ajouter</button>
          </div>

          {lignes.length > 0 && (
            <table className="table-erp">
              <thead><tr><th>Produit</th><th>Qte</th><th>Prix achat</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.idProduit}>
                    <td>{l.nom}</td>
                    <td><input type="number" min="1" value={l.quantite} onChange={(e) => modifierLigne(l.idProduit, 'quantite', Number(e.target.value))} className="input !w-20" /></td>
                    <td><input type="number" min="0" value={l.prixAchat} onChange={(e) => modifierLigne(l.idProduit, 'prixAchat', e.target.value)} className="input !w-28" /></td>
                    <td className="font-mono">{formaterMontant(l.quantite * (Number(l.prixAchat) || 0))}</td>
                    <td><button type="button" onClick={() => retirerLigne(l.idProduit)} className="text-red-500">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 rounded-lg bg-forest-50 p-3 text-right text-sm font-bold text-forest-800">
            Montant total : <span className="font-mono">{formaterMontant(total)}</span>
          </div>
          <label className="label">Observation</label>
          <textarea rows={2} className="input" value={observation} onChange={(e) => setObservation(e.target.value)} />
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Valider la reception</button>
            <button type="button" onClick={() => navigate('/approvisionnements')} className="btn-ghost">Annuler</button>
          </div>
        </div>
      </form>
    </>
  )
}
