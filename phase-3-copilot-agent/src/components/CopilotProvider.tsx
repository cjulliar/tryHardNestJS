"use client";

// ---------------------------------------------
// CopilotProvider
// ---------------------------------------------
// Rôle:
// - Instancie le provider CopilotKit côté client et englobe toute l'UI.
// - C'est ce composant qui "branche" l'application au runtime CopilotKit Cloud
//   (ou à un runtime self-hosted si NEXT_PUBLIC_COPILOT_RUNTIME_URL est défini).
//
// Variables d'env publiques (fichier .env.local):
// - NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY: clé publique CopilotKit Cloud
// - NEXT_PUBLIC_COPILOT_RUNTIME_URL: URL d'un runtime CopilotKit (optionnel)
// - NEXT_PUBLIC_COPILOT_PUBLIC_LICENSE_KEY: licence publique (optionnel)
//
// Effet:
// - Fournit un contexte React qui permet:
//   * d'afficher l'UI CopilotKit (ex: <CopilotChat />)
//   * d'enregistrer des tools/actions côté frontend (useCopilotAction)
//   * d'interagir avec un runtime serveur (Cloud ou self-hosted)
// ---------------------------------------------

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

type Props = { children: React.ReactNode };

export function CopilotProvider({ children }: Props) {
  const publicApiKey = process.env.NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY;
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_RUNTIME_URL; // optionnel si cloud
  const license = process.env.NEXT_PUBLIC_COPILOT_PUBLIC_LICENSE_KEY; // optionnel

  // Le provider accepte plusieurs modes de configuration (clé publique, runtime URL, licence)
  // Ici on passe la clé publique si disponible; sinon, si un runtime URL est fourni, CopilotKit peut l'utiliser.
  return (
    <CopilotKit
      publicApiKey={publicApiKey}
      runtimeUrl={runtimeUrl}
      publicLicenseKey={license}
    >
      {children}
    </CopilotKit>
  );
}


