import { createElement } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Den fælles Jarvis-chat-widget (v2) fra jarvis.asa-el.dk.
 * Scriptet indlæses én gang i index.html (klassisk script, defer); her renderes kun elementet —
 * og KUN når en godkendt bruger er logget ind. Edge-funktionen `jarvis-widget` (core) afgør
 * rettigheder, rolle og loft.
 *
 * supabase-url SKAL være det projekt, hvor Dialerens login-session ligger (widgetten læser
 * sb-<ref>-auth-token fra localStorage). Dialeren kører i dag på ulfgtlievrweikqsskme (ikke core),
 * så vi tager samme URL som Supabase-klienten.
 */
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://ulfgtlievrweikqsskme.supabase.co";

export function JarvisWidget() {
  const { user, loading, isApproved } = useAuth();
  if (loading || !user || !isApproved) return null;
  return createElement("jarvis-widget", { system: "dialer", "supabase-url": SUPABASE_URL });
}
