import { useEffect, useState } from 'react'
import { api, messageErreur } from '../lib/api'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/ui/Spinner'

function BlocGestion({ titre, endpoint, cleId, notifier }) {
  const [items, setItems] = useState([])
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    setChargement(true)
    try {
      const { data } = await api.get(endpoint)
      setItems(data)
    } catch (err) {
      notifier(messageErreur(err), 'erreur')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, []) // eslint-disable-line

  async function ajouter(e) {
    e.preventDefault()
    if (!nom.trim()) return
    setEnvoi(true)
    try {
      await api.post(endpoint, { nom, description: description || null })
      setNom(''); setDescription('')
      charger()
      notifier(`${titre.slice(0, -1)} ajoutee`)
    } catch (err) {
      notifier(messageErreur(err, 'Impossible d\'ajouter'), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  async function supprimer(id) {
    try {
      await api.delete(`${endpoint}/${id}`)
      charger()
    } catch (err) {
      notifier(messageErreur(err, 'Suppression impossible'), 'erreur')
    }
  }

  return (
    <div className="card p-5">
      <p className="mb-3 font-display font-semibold text-forest-800">{titre}</p>
      <form onSubmit={ajouter} className="mb-4 flex flex-wrap gap-2">
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className="input flex-1" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnel)" className="input flex-1" />
        <button type="submit" disabled={envoi} className="btn-primary">{envoi && <Spinner />} Ajouter</button>
      </form>

      {chargement ? (
        <Spinner className="text-forest-600" />
      ) : (
        <ul className="divide-y divide-forest-50">
          {items.map((it) => (
            <li key={it[cleId]} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{it.nom}</span>
              <button onClick={() => supprimer(it[cleId])} className="text-red-500 hover:text-red-700">Supprimer</button>
            </li>
          ))}
          {items.length === 0 && <p className="py-3 text-sm text-ink/40">Aucun element</p>}
        </ul>
      )}
    </div>
  )
}

export default function CategoriesMarques() {
  const { notifier } = useToast()
  return (
    <>
      <PageHeader titre="Catégories & marques" description="Organisez votre catalogue produits." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BlocGestion titre="Catégories" endpoint="/categories" cleId="idCategorie" notifier={notifier} />
        <BlocGestion titre="Marques" endpoint="/marques" cleId="idMarque" notifier={notifier} />
      </div>
    </>
  )
}
