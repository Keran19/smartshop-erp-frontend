import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_URL,
})

function getTokens() {
  return {
    accessToken: localStorage.getItem('smartshop_access_token'),
    refreshToken: localStorage.getItem('smartshop_refresh_token'),
  }
}

export function stockerTokens({ accessToken, refreshToken }) {
  localStorage.setItem('smartshop_access_token', accessToken)
  localStorage.setItem('smartshop_refresh_token', refreshToken)
}

export function effacerTokens() {
  localStorage.removeItem('smartshop_access_token')
  localStorage.removeItem('smartshop_refresh_token')
  localStorage.removeItem('smartshop_utilisateur')
}

// Injecte l'access token sur chaque requete
api.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// En cas de 401 (access token expire), tente un rafraichissement transparent une seule fois,
// puis rejoue la requete d'origine. Si le refresh echoue, deconnecte l'utilisateur.
let rafraichissementEnCours = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requeteOriginale = error.config
    const statut = error.response?.status

    if (statut === 401 && !requeteOriginale._dejaReessaye && !requeteOriginale.url?.includes('/auth/')) {
      requeteOriginale._dejaReessaye = true
      const { refreshToken } = getTokens()

      if (!refreshToken) {
        effacerTokens()
        window.location.href = '/connexion'
        return Promise.reject(error)
      }

      try {
        if (!rafraichissementEnCours) {
          rafraichissementEnCours = axios
            .post(`${API_URL}/auth/refresh`, { refreshToken })
            .then((res) => {
              stockerTokens(res.data)
              return res.data
            })
            .finally(() => {
              rafraichissementEnCours = null
            })
        }
        const nouveauxTokens = await rafraichissementEnCours
        requeteOriginale.headers.Authorization = `Bearer ${nouveauxTokens.accessToken}`
        return api(requeteOriginale)
      } catch (erreurRefresh) {
        effacerTokens()
        window.location.href = '/connexion'
        return Promise.reject(erreurRefresh)
      }
    }

    return Promise.reject(error)
  }
)

/** Extrait un message d'erreur lisible depuis une reponse d'erreur de l'API. */
export function messageErreur(error, messageParDefaut = 'Une erreur est survenue') {
  return error?.response?.data?.message || error?.message || messageParDefaut
}
