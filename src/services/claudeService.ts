// src/services/claudeService.ts
// Servizio per chiamare Claude tramite Supabase Edge Function

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Invia messaggi a Claude tramite la Edge Function di Supabase
 * @param messages  Storico della conversazione
 * @param system    Prompt di sistema opzionale (personalità / contesto)
 * @param maxTokens Numero massimo di token nella risposta (default 1024)
 */
export async function askClaude(
  messages: ClaudeMessage[],
  system?: string,
  maxTokens = 1024
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/claude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ messages, system, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Errore sconosciuto dalla Edge Function");
  }

  const data: ClaudeResponse = await res.json();
  return data.content[0]?.text ?? "";
}

/**
 * Chiamata semplice con un singolo messaggio (no storico)
 */
export async function askClaudeOnce(
  userMessage: string,
  system?: string
): Promise<string> {
  return askClaude([{ role: "user", content: userMessage }], system);
}