import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ rolesAutorises }) {
  const { utilisateur } = useAuth()

  if (!utilisateur) return <Navigate to="/connexion" replace />

  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
