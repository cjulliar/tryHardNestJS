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
