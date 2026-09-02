import { createClient } from "@supabase/supabase-js";

// Módulo server-only: cria o cliente Supabase com a SERVICE_ROLE_KEY (acesso
// total ao Storage, ignora RLS). Como só é importado por lib/upload.ts (que é
// "use server"), o código nunca é enviado ao navegador e a chave não vaza.
// Não usamos "use server" aqui porque getSupabaseAdmin retorna o cliente
// (não serializável) — server actions precisam ser async.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configurados no .env"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
