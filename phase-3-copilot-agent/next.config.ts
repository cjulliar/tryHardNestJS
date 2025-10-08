// next.config.ts
import type { NextConfig } from "next";

const nextConfig = {
  // Force le root Turbopack sur ce dossier (évite l’ambiguïté multi-lockfiles)
  // Typage non officiel mais accepté par Next au runtime
  turbopack: { root: __dirname },
} as unknown as NextConfig;

export default nextConfig;