"use server";

import { createClient } from "@supabase/supabase-js";

// Cliente do Supabase usado apenas no servidor (server actions / RSC).
// Usa a SERVICE_ROLE_KEY, que tem acesso total ao Storage e ignora RLS.
// Por isso este arquivo NUNCA deve ser importado por componentes de cliente.
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
