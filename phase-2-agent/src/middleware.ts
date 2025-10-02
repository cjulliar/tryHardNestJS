// ============================================
// middleware.ts — Middleware Next.js (App Router)
// ============================================
//
// QU'EST-CE QU'UN MIDDLEWARE ?
// - Du code qui s'exécute AVANT d'atteindre une route (page ou API)
// - Permet d'intercepter toutes les requêtes et d'appliquer des règles globales
// - Utile pour : auth, headers de sécurité, redirections, rate limiting, etc.
//
// ROLE DE CE FICHIER :
// - Bloque les méthodes HTTP autres que POST sur /api/agent (renvoie 405)
// - Ajoute un header de sécurité `x-frame-options: DENY` (empêche l'iframe)
//
// TECHNOLOGIES UTILISÉES :
// - Next.js Middleware (fonction middleware exportée)
// - NextRequest/NextResponse (types Next.js pour req/res)
//
// POURQUOI CE MIDDLEWARE ?
// - Sécurité : refuse GET/PUT/DELETE sur /api/agent (seul POST est autorisé)
// - Header x-frame-options: DENY empêche le site d'être affiché dans une iframe
//   → Protection contre les attaques de type clickjacking
//
// ============================================

import { NextRequest, NextResponse } from "next/server";

/**
 * Fonction middleware : s'exécute pour chaque requête
 * @param req - Requête Next.js
 * @returns NextResponse (soit une réponse directe, soit next() pour continuer)
 */
export function middleware(req: NextRequest) {
  // Récupère le pathname de l'URL (ex: /api/agent, /, /about)
  const { pathname } = new URL(req.url);

  // ============================================
  // RÈGLE 1 : REFUSE LES MÉTHODES ≠ POST SUR /api/agent
  // ============================================
  
  // Si la requête cible /api/agent ET que la méthode n'est pas POST
  if (pathname === "/api/agent" && req.method !== "POST") {
    // Renvoie une réponse 405 Method Not Allowed
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "content-type": "application/json",
        "x-frame-options": "DENY", // Header de sécurité
      },
    });
  }

  // ============================================
  // RÈGLE 2 : AJOUTE UN HEADER DE SÉCURITÉ À TOUTES LES REQUÊTES
  // ============================================
  
  // Laisse passer la requête et ajoute un header de sécurité
  const res = NextResponse.next(); // Continue vers la route normale
  res.headers.set("x-frame-options", "DENY"); // Empêche l'affichage dans une iframe
  return res;
}

// ============================================
// CONFIG : MATCHER (QUELLES ROUTES SONT INTERCEPTÉES)
// ============================================

/**
 * Matcher : définit les routes où le middleware s'applique
 * Ici : toutes les routes SAUF _next/static, _next/image, favicon.ico
 * (on ne veut pas intercepter les assets statiques)
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
