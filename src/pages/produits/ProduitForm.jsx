import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, messageErreur } from '../../lib/api'
import { useBoutique } from '../../context/BoutiqueContext'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/ui/Spinner'

const VIDE = {
  codeBarres: '', reference: '', nom: '', description: '',
  prixAchat: '', prixVente: '', seuilAlerte: '5',
  idCategorie: '', idMarque: '', idFournisseur: '',
  idBoutique: '', quantiteInitiale: '',
}

export default function ProduitForm() {
  const { id } = useParams()
  const estEdition = !!id
  const [searchParams] = useSearchParams()
  const { idBoutique, boutiques } = useBoutique()
  const { notifier } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ ...VIDE, codeBarres: searchParams.get('codeBarres') || '', idBoutique: idBoutique || '' })
  const [categories, setCategories] = useState([])
  const [marques, setMarques] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [chargement, setChargement] = useState(estEdition)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/marques'), api.get('/fournisseurs')])
      .then(([c, m, f]) => { setCategories(c.data); setMarques(m.data); setFournisseurs(f.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!estEdition) return
    api.get(`/produits/${id}`)
      .then(({ data }) => setForm({
        codeBarres: data.codeBarres, reference: data.reference || '', nom: data.nom,
        description: data.description || '', prixAchat: data.prixAchat, prixVente: data.prixVente,
        seuilAlerte: data.seuilAlerte ?? 5, idCategorie: data.idCategorie || '',
        idMarque: data.idMarque || '', idFournisseur: data.idFournisseur || '',
        idBoutique: '', quantiteInitiale: '',
      }))
      .catch((err) => notifier(messageErreur(err, 'Produit introuvable'), 'erreur'))
      .finally(() => setChargement(false))
  }, [id, estEdition]) // eslint-disable-line

  function champ(nomChamp) {
    return {
      value: form[nomChamp],
      onChange: (e) => setForm((f) => ({ ...f, [nomChamp]: e.target.value })),
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    const payload = {
      ...form,
      prixAchat: Number(form.prixAchat),
      prixVente: Number(form.prixVente),
      seuilAlerte: Number(form.seuilAlerte) || 0,
      idCategorie: Number(form.idCategorie),
      idMarque: form.idMarque ? Number(form.idMarque) : null,
      idFournisseur: form.idFournisseur ? Number(form.idFournisseur) : null,
      idBoutique: form.idBoutique ? Number(form.idBoutique) : null,
      quantiteInitiale: form.quantiteInitiale ? Number(form.quantiteInitiale) : null,
    }
    try {
      if (estEdition) {
        await api.put(`/produits/${id}`, payload)
        notifier('Produit mis a jour')
      } else {
        await api.post('/produits', payload)
        notifier('Produit cree')
      }
      navigate('/produits')
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'enregistrer le produit'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) return <div className="flex justify-center py-16"><Spinner className="h-8 w-8 text-forest-600" /></div>

  return (
    <>
      <PageHeader titre={estEdition ? 'Modifier le produit' : 'Nouveau produit'} description="Le prix d'achat et le prix de vente permettent de calculer automatiquement le benefice a chaque vente." />

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <div>
          <label className="label">Code-barres *</label>
          <input required className="input" {...champ('codeBarres')} />
        </div>
        <div>
          <label className="label">Reference</label>
          <input className="input" {...champ('reference')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Nom du produit *</label>
          <input required className="input" {...champ('nom')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea rows={2} className="input" {...champ('description')} />
        </div>

        <div>
          <label className="label">Prix d'achat (FCFA) *</label>
          <input required type="number" min="0" className="input" {...champ('prixAchat')} />
        </div>
        <div>
          <label className="label">Prix de vente (FCFA) *</label>
          <input required type="number" min="0" className="input" {...champ('prixVente')} />
        </div>

        <div>
          <label className="label">Seuil d'alerte stock</label>
          <input type="number" min="0" className="input" {...champ('seuilAlerte')} />
        </div>
        <div>
          <label className="label">Categorie *</label>
          <select required className="input" {...champ('idCategorie')}>
            <option value="">Choisir…</option>
            {categories.map((c) => <option key={c.idCategorie} value={c.idCategorie}>{c.nom}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Marque</label>
          <select className="input" {...champ('idMarque')}>
            <option value="">Aucune</option>
            {marques.map((m) => <option key={m.idMarque} value={m.idMarque}>{m.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fournisseur</label>
          <select className="input" {...champ('idFournisseur')}>
            <option value="">Aucun</option>
            {fournisseurs.map((f) => <option key={f.idFournisseur} value={f.idFournisseur}>{f.nom}</option>)}
          </select>
        </div>

        {!estEdition && (
          <>
            <div>
              <label className="label">Boutique (stock initial)</label>
              <select className="input" {...champ('idBoutique')}>
                <option value="">Aucun stock initial</option>
                {boutiques.map((b) => <option key={b.idBoutique} value={b.idBoutique}>{b.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantite initiale</label>
              <input type="number" min="0" className="input" {...champ('quantiteInitiale')} disabled={!form.idBoutique} />
            </div>
          </>
        )}

        <div className="sm:col-span-2 mt-2 flex gap-3">
          <button type="submit" disabled={envoi} className="btn-primary">
            {envoi && <Spinner />} {estEdition ? 'Enregistrer' : 'Creer le produit'}
          </button>
          <button type="button" onClick={() => navigate('/produits')} className="btn-ghost">Annuler</button>
        </div>
      </form>
    </>
  )
}
