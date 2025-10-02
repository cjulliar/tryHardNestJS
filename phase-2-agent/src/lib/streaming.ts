// ============================================
// streaming.ts — Utilitaire de lecture de flux texte
// ============================================
//
// ROLE DE CE FICHIER :
// - Fournit une fonction pour lire un ReadableStream (flux de données) texte
// - Décode les chunks (morceaux de données) en UTF-8
// - Appelle une fonction callback à chaque chunk reçu
//
// TECHNOLOGIES UTILISÉES :
// - ReadableStream API (API Web standard pour les flux)
// - TextDecoder (décode les bytes en texte UTF-8)
//
// POURQUOI UN FLUX (STREAM) ?
// - Permet de recevoir la réponse de l'agent progressivement (chunk par chunk)
// - Meilleure UX : l'utilisateur voit la réponse s'écrire en temps réel
// - Évite d'attendre la réponse complète avant de l'afficher
//
// ============================================

/**
 * Lit un flux texte (ReadableStream) et appelle onChunk pour chaque morceau reçu
 * @param stream - Le flux de données (body d'une Response fetch)
 * @param onChunk - Fonction callback appelée à chaque chunk de texte reçu
 */
export async function readTextStream(
  stream: ReadableStream<Uint8Array>, // Flux binaire (bytes)
  onChunk: (text: string) => void // Fonction appelée à chaque chunk de texte
): Promise<void> {
  // Récupère un "lecteur" du flux (permet de lire chunk par chunk)
  const reader = stream.getReader();
  
  // TextDecoder décode les bytes en texte UTF-8
  const decoder = new TextDecoder();
  
  // Boucle infinie : lit le flux jusqu'à la fin
  while (true) {
    // Lit le prochain chunk (morceau de données)
    const { value, done } = await reader.read();
    
    // Si done = true, le flux est terminé → on sort de la boucle
    if (done) break;
    
    // Si value existe, on le décode en texte et on appelle onChunk
    // { stream: true } permet de gérer les caractères multi-bytes entre plusieurs chunks
    if (value) onChunk(decoder.decode(value, { stream: true }));
  }
}
