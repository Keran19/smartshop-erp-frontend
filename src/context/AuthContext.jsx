import { createContext, useContext, useState, useCallback } from 'react'
import { api, stockerTokens, effacerTokens } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const brut = localStorage.getItem('smartshop_utilisateur')
    return brut ? JSON.parse(brut) : null
  })

  const connecter = useCallback(async (email, motDePasse) => {
    const { data } = await api.post('/auth/login', { email, motDePasse })
    stockerTokens(data)
    const profil = {
      idUtilisateur: data.idUtilisateur,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      role: data.role,
    }
    localStorage.setItem('smartshop_utilisateur', JSON.stringify(profil))
    setUtilisateur(profil)
    return { ...profil, doitChangerMotDePasse: data.doitChangerMotDePasse }
  }, [])

  const deconnecter = useCallback(async () => {
    const refreshToken = localStorage.getItem('smartshop_refresh_token')
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } catch {
      // deconnexion locale malgre tout
    }
    effacerTokens()
    setUtilisateur(null)
  }, [])

  const aleRole = useCallback(
    (...roles) => !!utilisateur && roles.includes(utilisateur.role),
    [utilisateur]
  )

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, deconnecter, aleRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit etre utilise a l\'interieur de AuthProvider')
  return ctx
}
