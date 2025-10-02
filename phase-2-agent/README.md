Phase 2 — Agent + intégration propre (Next.js 15, TS, Tailwind v4)

## Installation et démarrage

1) Installer les dépendances:
```bash
npm install
```
2) Copier `.env.local.example` en `.env.local` et remplir les variables si besoin.
3) Démarrer:
```bash
npm run dev
```
Ouvre http://localhost:3000

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Variables d'environnement

Créer `.env.local` avec ces variables obligatoires:
- `AGENT_API_URL` — URL de l'API Hugging Face (ex: `https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium`)
- `AGENT_API_KEY` — clé secrète HF (token "Read", ex: `hf_...`) jamais exposée côté client
  - Pour générer un token: https://huggingface.co/settings/tokens
  - Choisir "Read" (pas fine-grained)
  - Permissions: accès à l'Inference API
- Variables publiques CopilotKit (optionnelles):
  - `NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY` — clé publique CopilotKit Cloud
  - `NEXT_PUBLIC_COPILOT_RUNTIME_URL` — URL du runtime CopilotKit si déployé
  - `NEXT_PUBLIC_COPILOT_PUBLIC_LICENSE_KEY` — licence publique CopilotKit
  - Au moins une de ces 3 variables doit être renseignée pour activer le provider CopilotKit

## Architecture

Front (Chat UI) ←→ `/api/agent` (Next server) ←→ `AGENT_API_URL` (fournisseur agent)

- `/api/agent` reçoit `{ messages: { role, content }[] }`
- Si `USE_AGENT_MOCK=true` ou pas d’URL clé: renvoie un flux simulé
- Sinon: proxy vers `AGENT_API_URL` avec `Authorization: Bearer <clé>` et stream la réponse

## Middleware

- Refuse les méthodes ≠ POST sur `/api/agent` (405)
- Ajoute un header `x-frame-options: DENY`

## UI & composants

- `src/components/Chat.tsx` — historique, input, envoi, réception du stream
- `src/components/MessageBubble.tsx` — bulle de message (user/assistant)
- `src/components/Button.tsx` — bouton réutilisable

## Lib

- `src/lib/types.ts` — types des messages et erreurs
- `src/lib/streaming.ts` — util de lecture d’un flux textuel

## CopilotKit

- Intégré: provider dans `layout.tsx`, action "summarizeLastMessages"
- Packages: `@copilotkit/react-core`, `@copilotkit/react-ui`
- Config: définis une clé/URL publique dans `.env.local` pour activer le provider
- Bouton "Demander un résumé" dans le chat envoie les 5 derniers messages à `/api/agent`
- Doc officielle: https://docs.copilotkit.ai/


## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — build de prod
- `npm start` — serveur de prod

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
