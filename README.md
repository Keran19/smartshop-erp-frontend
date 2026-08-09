# SmartShop ERP - Frontend

Interface web React (Vite + Tailwind CSS) pour le backend Spring Boot
SmartShop ERP. Design coherent avec l'identite de marque (logo + photo de
boutique fournis) : vert forêt / vert vif du logo, or de l'ampoule et de
l'eclairage boutique, charbon des étagères.

## Demarrage

1. Installer les dependances :
   ```
   npm install
   ```

2. Configurer l'URL de l'API backend : copiez `.env.example` en `.env`
   et ajustez si besoin :
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

3. Lancer le serveur de developpement :
   ```
   npm run dev
   ```
   L'application est servie sur `http://localhost:5173`.

4. Build de production :
   ```
   npm run build
   ```
   Les fichiers statiques sont generes dans `dist/`, prets a etre servis
   par n'importe quel serveur web (Nginx, Apache, etc.) ou par Spring Boot
   lui-meme (copier `dist/` dans `src/main/resources/static` du backend).

## Identite visuelle

- **Logo** (`src/assets/logo-smartshop.png`) : utilise sur l'ecran de
  connexion et dans la barre laterale.
- **Photo de boutique** (`src/assets/boutique-hero.jpg`) : utilisee comme
  panneau plein cadre sur l'ecran de connexion, et comme bandeau d'en-tete
  (assombri, degrade vert de marque) en haut de chaque page interne — un
  choix deliberement mesure pour ancrer l'identite de la marque sans jamais
  nuire a la lisibilite des tableaux et formulaires en dessous.
- **Couleurs** (`tailwind.config.js`) : `forest` (vert profond du sac du
  logo), `leaf` (vert vif du degrade), `gold` (jaune de l'ampoule / eclairage
  boutique), `charcoal` (etageres sombres), `cream` (fond clair).
- **Typographies** : Baloo 2 (titres, arrondi et affirme comme le logo),
  Inter (texte courant), IBM Plex Mono (montants, codes-barres, references).

## Authentification

Utilise le flux JWT du backend : access token (15 min) stocke en
`localStorage`, rafraichi automatiquement et de maniere transparente via un
intercepteur Axios (`src/lib/api.js`) en cas de reponse 401, grace au refresh
token (7 jours). Si le refresh echoue, l'utilisateur est redirige vers
`/connexion`.

Un compte cree par un administrateur doit changer son mot de passe a la
premiere connexion : l'utilisateur est automatiquement redirige vers
`/mon-profil` dans ce cas.

## Fonctionnalites couvertes

- **Connexion** avec gestion des erreurs (compte verrouille, desactive, etc.)
- **Tableau de bord** : chiffre d'affaires et benefice du jour / du mois,
  alertes de stock
- **Caisse** : ouverture/fermeture de session par saisie des coupures CEMAC,
  calcul automatique de l'ecart a la fermeture, historique des sessions
- **Point de vente** : scan de code-barres avec incrementation automatique
  de la quantite, redirection vers la creation produit si le code-barres est
  inconnu, calcul automatique de la monnaie a rendre, apercu/confirmation
  avant impression, impression PDF de la facture
- **Historique des ventes** : filtrage par periode, benefice par vente,
  export PDF de la liste, impression individuelle
- **Retours & echanges** : remboursement, echange a valeur egale, echange a
  valeur differente (complement/remboursement calcules automatiquement),
  avec suivi des quantites deja retournees
- **Acomptes** : creation avec verification du client par telephone et
  redirection vers sa creation si necessaire, versements successifs
- **Credits clients** : suivi des soldes, encaissement des paiements
- **Produits & stock** : liste avec disponibilite par boutique, creation
  avec prix d'achat + prix de vente, historique de vente d'un produit par
  code-barres sur une periode choisie
- **Approvisionnements** : reception de stock aupres d'un fournisseur avec
  mise a jour immediate du stock
- **Inventaire** : comptage physique avec calcul et ajustement automatique
  des ecarts de stock
- **Depenses** : saisie et suivi par periode/boutique
- **Statistiques** : CA, ventes, benefice, nouveaux clients, produit vedette
  et classement complet, sur une periode libre, avec graphique
- **Boutiques, clients, fournisseurs, categories/marques** : gestion CRUD
- **Utilisateurs** (admin) : creation de comptes, activation/desactivation,
  deverrouillage, reinitialisation de mot de passe
- **Mon profil** : changement de mot de passe en self-service

## Stack technique

React 18, React Router 6, Axios, Tailwind CSS, Recharts (graphiques), Vite.
