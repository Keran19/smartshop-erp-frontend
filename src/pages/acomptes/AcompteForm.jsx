import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { formaterMontant } from '../../lib/format'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function AcompteForm() {
  const { idBoutique } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [telephone, setTelephone] = useState('')
  const [client, setClient] = useState(null)
  const [clientIntrouvable, setClientIntrouvable] = useState(false)
  const [rechercheEnCours, setRechercheEnCours] = useState(false)

  const [modalCreationClient, setModalCreationClient] = useState(false)
  const [formClient, setFormClient] = useState({ nom: '', prenom: '', email: '', adresse: '' })
  const [envoiClient, setEnvoiClient] = useState(false)

  const [codeBarres, setCodeBarres] = useState('')
  const [lignes, setLignes] = useState([])
  const [versementInitial, setVersementInitial] = useState('')
  const [observation, setObservation] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function chercherClient(e) {
    e.preventDefault()
    if (!telephone.trim()) return
    setRechercheEnCours(true)
    setClientIntrouvable(false)
    setClient(null)
    try {
      const { data } = await api.get(`/clients/telephone/${encodeURIComponent(telephone.trim())}`)
      setClient(data)
    } catch (err) {
      if (err.response?.data?.code === 'CLIENT_INCONNU') {
        setClientIntrouvable(true)
      } else {
        notifier(messageErreur(err, 'Recherche impossible'), 'erreur')
      }
    } finally {
      setRechercheEnCours(false)
    }
  }

  async function creerClient(e) {
    e.preventDefault()
    setEnvoiClient(true)
    try {
      const { data } = await api.post('/clients', { ...formClient, telephone: telephone.trim() })
      setClient(data)
      setClientIntrouvable(false)
      setModalCreationClient(false)
      notifier('Client cree, vous pouvez continuer l\'acompte')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de creer le client'), 'erreur')
    } finally {
      setEnvoiClient(false)
    }
  }

  async function ajouterProduit(e) {
    e.preventDefault()
    const code = codeBarres.trim()
    if (!code) return
    try {
      const { data: produit } = await api.get(`/produits/scan/${encodeURIComponent(code)}`)
      setLignes((actuel) => {
        const existant = actuel.find((l) => l.idProduit === produit.idProduit)
        const prix = produit.stocks?.find((s) => s.idBoutique === idBoutique)?.prixVente ?? produit.prixVente
        if (existant) return actuel.map((l) => l.idProduit === produit.idProduit ? { ...l, quantite: l.quantite + 1 } : l)
        return [...actuel, { idProduit: produit.idProduit, nom: produit.nom, quantite: 1, prixUnitaire: prix }]
      })
      setCodeBarres('')
    } catch (err) {
      if (err.response?.data?.code === 'PRODUIT_INCONNU') {
        notifier('Produit inconnu : creez-le d\'abord', 'erreur')
        navigate(`/produits/nouveau?codeBarres=${encodeURIComponent(code)}`)
      } else {
        notifier('Produit introuvable', 'erreur')
      }
    }
  }

  function retirerLigne(idProduit) {
    setLignes((actuel) => actuel.filter((l) => l.idProduit !== idProduit))
  }

  const total = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!client) { notifier('Recherchez et selectionnez un client d\'abord', 'erreur'); return }
    if (lignes.length === 0) { notifier('Ajoutez au moins un produit', 'erreur'); return }

    setEnvoi(true)
    try {
      await api.post('/acomptes', {
        idClient: client.idClient,
        idBoutique,
        lignes: lignes.map((l) => ({ idProduit: l.idProduit, quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
        versementInitial: versementInitial ? Number(versementInitial) : null,
        observation: observation || null,
      })
      notifier('Acompte cree')
      navigate('/acomptes')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible de creer l\'acompte'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <PageHeader titre="Nouvel acompte" description="Verifiez d'abord le client, puis ajoutez les produits reserves." />

      <div className="card p-5">
        <p className="label !mb-2">1. Client</p>
        {!client ? (
          <form onSubmit={chercherClient} className="flex gap-2">
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Telephone du client" className="input flex-1" />
            <button type="submit" disabled={rechercheEnCours} className="btn-primary">{rechercheEnCours && <Spinner />} Rechercher</button>
          </form>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2">
            <span className="font-semibold text-forest-800">{client.nom} {client.prenom} &middot; {client.telephone}</span>
            <button onClick={() => { setClient(null); setTelephone('') }} className="text-xs text-forest-700 hover:underline">Changer</button>
          </div>
        )}

        {clientIntrouvable && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gold-400/15 px-3 py-2 text-sm">
            <span className="text-gold-700">Aucun client n'est enregistre avec ce numero.</span>
            <button onClick={() => { setFormClient({ nom: '', prenom: '', email: '', adresse: '' }); setModalCreationClient(true) }} className="btn-gold !px-3 !py-1.5 text-xs">
              Creer ce client
            </button>
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="label !mb-2">2. Produits reserves</p>
        <form onSubmit={ajouterProduit} className="mb-3 flex gap-2">
          <input value={codeBarres} onChange={(e) => setCodeBarres(e.target.value)} placeholder="Scanner le code-barres…" className="input flex-1" disabled={!client} />
          <button type="submit" disabled={!client} className="btn-primary">Ajouter</button>
        </form>

        {lignes.length > 0 && (
          <table className="table-erp">
            <thead><tr><th>Produit</th><th>Qte</th><th>P.U.</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.idProduit}>
                  <td>{l.nom}</td>
                  <td className="font-mono">{l.quantite}</td>
                  <td className="font-mono">{formaterMontant(l.prixUnitaire)}</td>
                  <td className="font-mono">{formaterMontant(l.quantite * l.prixUnitaire)}</td>
                  <td><button onClick={() => retirerLigne(l.idProduit)} className="text-red-500">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
        <p className="label !mb-0">3. Versement initial &amp; validation</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Versement initial (optionnel)</label>
            <input type="number" min="0" max={total} value={versementInitial} onChange={(e) => setVersementInitial(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Observation</label>
            <input value={observation} onChange={(e) => setObservation(e.target.value)} className="input" />
          </div>
        </div>
        <div className="rounded-lg bg-forest-50 p-3 text-sm font-bold">Montant total de l'acompte : <span className="font-mono">{formaterMontant(total)}</span></div>
        <div className="flex gap-3">
          <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Creer l'acompte</button>
          <button type="button" onClick={() => navigate('/acomptes')} className="btn-ghost">Annuler</button>
        </div>
      </form>

      <Modal ouvert={modalCreationClient} onFermer={() => setModalCreationClient(false)} titre="Creer le client" largeur="max-w-sm">
        <form onSubmit={creerClient} className="flex flex-col gap-4">
          <div><label className="label">Nom *</label><input required className="input" value={formClient.nom} onChange={(e) => setFormClient({ ...formClient, nom: e.target.value })} /></div>
          <div><label className="label">Prenom</label><input className="input" value={formClient.prenom} onChange={(e) => setFormClient({ ...formClient, prenom: e.target.value })} /></div>
          <div><label className="label">Telephone</label><input className="input bg-forest-50" value={telephone} disabled /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={formClient.email} onChange={(e) => setFormClient({ ...formClient, email: e.target.value })} /></div>
          <button type="submit" disabled={envoiClient} className="btn-primary">{envoiClient && <Spinner />} Creer et continuer</button>
        </form>
      </Modal>
    </>
  )
}
