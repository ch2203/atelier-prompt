# Atelier de Prompt — App mobile (PWA)

Application installable sur Android, qui génère un prompt optimisé via l'API de Claude.
Interface en français ou en hébreu (RTL), avec traduction anglaise du prompt final.

La clé API reste **côté serveur** (fonction Vercel `/api/claude`), jamais dans le navigateur.

---

## Installation en 6 étapes

### 1. Mettre le projet sur GitHub
- Crée un dépôt sur github.com (ex : `atelier-prompt`).
- Téléverse tout le contenu de ce dossier (bouton "Add file → Upload files", glisse tous les fichiers).

### 2. Connecter à Vercel
- Va sur https://vercel.com → "Add New… → Project".
- Importe ton dépôt GitHub.
- Vercel détecte Vite automatiquement. Laisse les réglages par défaut.

### 3. Ajouter ta clé API
- Avant de déployer, ouvre "Environment Variables".
- Nom : `ANTHROPIC_API_KEY`
- Valeur : ta clé (celle qui commence par `sk-ant-...`).
- Clique "Add", puis "Deploy".

### 4. Attendre le déploiement
- Vercel build et te donne une URL du type `https://atelier-prompt.vercel.app`.

### 5. Ouvrir sur Android (Chrome)
- Ouvre l'URL dans Chrome sur ton téléphone.
- Vérifie que ça marche : tape une tâche → "Analyser avec Claude".

### 6. Installer comme app
- Menu Chrome (⋮ en haut à droite) → **"Ajouter à l'écran d'accueil"** / "Installer l'application".
- Une icône apparaît sur ton écran d'accueil. Elle s'ouvre en plein écran, sans barre de navigateur, comme une app normale.

---

## Développer en local (optionnel)
```bash
npm install
npm run dev
```
Pour tester l'API en local il faut `vercel dev` (npm i -g vercel) avec la variable d'environnement définie.

## Notes
- Modèle utilisé : `claude-sonnet-4-20250514` (modifiable dans `api/claude.js`).
- Chaque génération = 2 à 3 appels API (analyse, affinage éventuel, optimisation). Surveille ta consommation sur console.anthropic.com.
- Les données saisies ne sont pas stockées : tout reste en mémoire le temps de la session.
