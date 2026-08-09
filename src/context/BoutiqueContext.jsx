import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const BoutiqueContext = createContext(null)

export function BoutiqueProvider({ children }) {
  const { utilisateur } = useAuth()
  const [boutiques, setBoutiques] = useState([])
  const [idBoutique, setIdBoutiqueState] = useState(() => {
    const stocke = localStorage.getItem('smartshop_boutique_active')
    return stocke ? Number(stocke) : null
  })

  const charger = useCallback(async () => {
    const { data } = await api.get('/boutiques')
    setBoutiques(data)
    setIdBoutiqueState((actuel) => {
      if (actuel && data.some((b) => b.idBoutique === actuel)) return actuel
      const principale = data.find((b) => b.principale) || data[0]
      return principale ? principale.idBoutique : null
    })
  }, [])

  // Recharge la liste des boutiques des qu'un utilisateur est authentifie (connexion initiale
  // ou changement de compte), car l'appel echoue silencieusement tant qu'aucun token n'existe.
  useEffect(() => {
    if (utilisateur) charger().catch(() => {})
  }, [utilisateur, charger])

  const setIdBoutique = useCallback((id) => {
    setIdBoutiqueState(id)
    localStorage.setItem('smartshop_boutique_active', String(id))
  }, [])

  return (
    <BoutiqueContext.Provider value={{ boutiques, idBoutique, setIdBoutique, rechargerBoutiques: charger }}>
      {children}
    </BoutiqueContext.Provider>
  )
}

export function useBoutique() {
  const ctx = useContext(BoutiqueContext)
  if (!ctx) throw new Error('useBoutique doit etre utilise a l\'interieur de BoutiqueProvider')
  return ctx
}
