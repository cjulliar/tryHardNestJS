Projet [Next.js](https://nextjs.org) initialisé avec [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) (App Router, TypeScript, Tailwind v4).

## Démarrage en local

Dans le dossier `my-first-next` :

```bash
npm install
npm run dev
# ou
yarn dev
```

Ouvre `http://localhost:3000` dans le navigateur.

- La page d’accueil est dans `src/app/page.tsx`.
- La mise en page racine est dans `src/app/layout.tsx`.
- Les styles globaux (avec Tailwind) sont dans `src/app/globals.css`.
- Les composants réutilisables sont dans `src/components/`.

## Structure et concepts

- App Router : chaque dossier dans `src/app` devient une route. Un fichier `page.tsx` rend la page, `layout.tsx` définit le layout parent.
- Composants React : UI réutilisable (`src/components/Button.tsx`, `src/components/JokeCard.tsx`).
- Tailwind v4 : classes utilitaires, configuration minimale via `@tailwindcss/postcss` (voir `postcss.config.mjs`).
- Typage : projet en TypeScript pour une meilleure DX.

## Scripts

- `npm run dev` : lance le serveur de dev Next.js (Turbopack).
- `npm run build` : build de production.
- `npm start` : démarre le serveur en production après build.
- `npm run lint` : exécute ESLint.

## Déploiement (Vercel)

1. Versionne le projet sur GitHub (le dossier racine de l’app est `my-first-next`).
2. Sur Vercel : New Project → Import depuis GitHub.
3. Assure-toi que le “Project Root” pointe vers `my-first-next` (pas la racine du repo si différente).
4. Build Command : `next build` (valeur par défaut OK). Output : `.next`.
5. Déploie. L’URL de preview est fournie automatiquement.

Docs utiles :
- [Doc Next.js](https://nextjs.org/docs)
- [Tutoriel Learn Next.js](https://nextjs.org/learn)
- [Déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying)

### Récap Vercel (GitHub → Vercel)

1) Préparer le repo GitHub
- Assure-toi que l’app est dans un dossier dédié (ici `my-first-next`) avec un `package.json` à sa racine.
- Push sur GitHub.

2) Importer sur Vercel
- Vercel → New Project → Import depuis GitHub → choisis le repo.
- Important : “Root Directory” = `my-first-next` (pas la racine du repo si l’app est dans un sous-dossier).
- Framework : Next.js (auto-détecté).
- Install Command : `npm install`.
- Build Command : `next build`.
- Output Directory : `.next`.

3) Déployer et vérifier
- Lancer le déploiement.
- Ouvrir les “Build Logs” : vérifier que les chemins pointent bien vers `my-first-next`.
- Une fois “Ready”, tester l’URL de Preview.

4) Résolution des erreurs fréquentes
- 404 `not_found` : le plus souvent, mauvais “Root Directory”. Reconfigurer le projet ou réimporter en sélectionnant `my-first-next`.
- Build échoue : vérifier versions Node (>= 18), commande de build, dépendances.

---

## Fichiers importants — résumé

- `src/app/layout.tsx` : layout racine (polices via `next/font`, langue, metadata par défaut, import de `globals.css`).
- `src/app/page.tsx` : page d’accueil (routing par fichier, boutons, section blague).
- `src/app/about/page.tsx` : seconde page pour illustrer le routing (`/about`).
- `src/app/globals.css` : Tailwind v4 via `@import "tailwindcss";`, variables CSS pour thème clair/sombre, mapping `@theme`.
- `src/components/Button.tsx` : composant bouton réutilisable (variants : primary/secondary/ghost ; tailles : sm/md/lg).
- `src/components/JokeCard.tsx` : composant client qui `fetch` une blague (API publique) + gestion du chargement et des erreurs.
- `postcss.config.mjs` : active `@tailwindcss/postcss` (config minimale Tailwind v4).
- `tsconfig.json` : chemins d’alias `@/* → ./src/*`, options TypeScript.
- `next.config.ts` : configuration Next (laissée par défaut).

### Flux de données (exemple API blague)
- Côté client (`JokeCard`) : `fetch("https://api.chucknorris.io/jokes/random")` → met à jour l’état `joke`, `loading`, `error`.
- Alternative (recommandée en prod) : créer un route handler `/api/joke` côté Next pour proxy (cache, erreurs, rate limit), puis `fetch('/api/joke')` côté client.

### Tailwind v4 en bref
- Plus de `tailwind.config.js` obligatoire : config minimale via PostCSS plugin.
- Les tokens définis dans `@theme` (couleurs, fontes) se consomment en classes utilitaires (`bg-background`, `text-foreground`, `font-sans`, etc.).

## Statut du déploiement
- Ce projet est actuellement déployé via Vercel : https://try-hard-nest-js.vercel.app
