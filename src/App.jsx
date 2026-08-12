import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { BoutiqueProvider } from './context/BoutiqueContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Connexion from './pages/Connexion'
import Dashboard from './pages/Dashboard'
import Caisse from './pages/caisse/Caisse'
import GestionCaisseAdmin from './pages/admin/GestionCaisseAdmin'
import PointDeVente from './pages/ventes/PointDeVente'
import HistoriqueVentes from './pages/ventes/HistoriqueVentes'
import RetoursListe from './pages/retours/RetoursListe'
import RetourForm from './pages/retours/RetourForm'
import AcomptesListe from './pages/acomptes/AcomptesListe'
import AcompteForm from './pages/acomptes/AcompteForm'
import CreditsListe from './pages/credits/CreditsListe'
import ProduitsListe from './pages/produits/ProduitsListe'
import ProduitForm from './pages/produits/ProduitForm'
import HistoriqueProduit from './pages/produits/HistoriqueProduit'
import ApprovisionnementsListe from './pages/approvisionnements/ApprovisionnementsListe'
import ApprovisionnementForm from './pages/approvisionnements/ApprovisionnementForm'
import InventairesListe from './pages/inventaires/InventairesListe'
import InventaireForm from './pages/inventaires/InventaireForm'
import Depenses from './pages/Depenses'
import Statistiques from './pages/Statistiques'
import Boutiques from './pages/Boutiques'
import Clients from './pages/Clients'
import Fournisseurs from './pages/Fournisseurs'
import CategoriesMarques from './pages/CategoriesMarques'
import Utilisateurs from './pages/Utilisateurs'
import MonProfil from './pages/MonProfil'

function RedirectionAccueil() {
  const { utilisateur } = useAuth()
  return <Navigate to={utilisateur ? '/' : '/connexion'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <BoutiqueProvider>
            <Routes>
              <Route path="/connexion" element={<Connexion />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/caisse" element={<Caisse />} />
                  <Route path="/vente" element={<PointDeVente />} />
                  <Route path="/ventes" element={<HistoriqueVentes />} />
                  <Route path="/retours" element={<RetoursListe />} />
                  <Route path="/retours/nouveau/:idVente" element={<RetourForm />} />
                  <Route path="/acomptes" element={<AcomptesListe />} />
                  <Route path="/acomptes/nouveau" element={<AcompteForm />} />
                  <Route path="/credits" element={<CreditsListe />} />
                  <Route path="/produits" element={<ProduitsListe />} />
                  <Route path="/produits/historique" element={<HistoriqueProduit />} />
                  <Route path="/produits/nouveau" element={<ProduitForm />} />
                  <Route path="/produits/:id/modifier" element={<ProduitForm />} />
                  <Route path="/statistiques" element={<Statistiques />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/mon-profil" element={<MonProfil />} />

                  <Route element={<ProtectedRoute rolesAutorises={['ADMIN', 'GERANT']} />}>
                    <Route path="/fournisseurs" element={<Fournisseurs />} />
                    <Route path="/approvisionnements" element={<ApprovisionnementsListe />} />
                    <Route path="/approvisionnements/nouveau" element={<ApprovisionnementForm />} />
                    <Route path="/inventaires" element={<InventairesListe />} />
                    <Route path="/inventaires/nouveau" element={<InventaireForm />} />
                    <Route path="/depenses" element={<Depenses />} />
                    <Route path="/catalogue" element={<CategoriesMarques />} />
                    <Route path="/gestion-caisse" element={<GestionCaisseAdmin />} />
                  </Route>

                  <Route element={<ProtectedRoute rolesAutorises={['ADMIN']} />}>
                    <Route path="/boutiques" element={<Boutiques />} />
                    <Route path="/utilisateurs" element={<Utilisateurs />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<RedirectionAccueil />} />
            </Routes>
          </BoutiqueProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
