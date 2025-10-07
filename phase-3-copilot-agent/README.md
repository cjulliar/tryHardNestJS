Projet Next.js dédié à CopilotKit Agent (Phase 3).

## Démarrage

Installer puis lancer le serveur de dev:

```bash
cp .env.local.example .env.local  # puis remplir OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) pour voir l’app.

Pages clés:
- `src/app/chat/page.tsx` – UI du chat
- `src/app/api/agent/route.ts` – API proxy vers OpenAI (gpt-4o-mini)
 - `src/app/api/tools/route.ts` – Tools runtime (résumé, fetch, mini-mémoire)

Variables d’environnement:
- `OPENAI_API_KEY` (obligatoire)
- `OPENAI_API_URL` (par défaut: `https://api.openai.com/v1/chat/completions`)
- `NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY` (optionnel pour activer le provider frontend)

## CopilotKit – comment ça marche ici

- Le provider est instancié dans `src/components/CopilotProvider.tsx` et monté dans `src/app/layout.tsx`.
- L’UI CopilotKit est utilisée via `<CopilotChat />` dans `src/app/chat/page.tsx`.
- Des tools côté frontend sont enregistrés via `useCopilotAction` dans `src/components/CopilotActions.tsx`.
- Ces tools appellent un endpoint serveur `/api/tools` (résumé N messages, fetch URL, contexte set/get).
- Si tu ajoutes un runtime CopilotKit serveur (Cloud/self-hosted), tu peux migrer les tools côté serveur,
  garder les mêmes actions côté UI, et profiter du streaming/observabilité.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
