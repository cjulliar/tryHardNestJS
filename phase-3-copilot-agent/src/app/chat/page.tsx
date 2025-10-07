"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotActions } from "@/components/CopilotActions";

// ---------------------------------------------
// Page Chat CopilotKit
// ---------------------------------------------
// - Utilise l'UI fournie par CopilotKit (<CopilotChat />)
// - Enregistre des actions (tools) via <CopilotActions />
// - Le provider (CopilotProvider) instancié dans le layout rend ces
//   composants fonctionnels et connectés au runtime (Cloud ou self-hosted)
export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Chat CopilotKit</h1>
      {/* Enregistre les actions côté frontend (utilisent /api/tools) */}
      <CopilotActions
        getLastMessages={() => ""}
        onAssistant={() => {}}
      />
      <CopilotChat />
    </div>
  );
}


