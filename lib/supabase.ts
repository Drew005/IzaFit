import { createClient } from "@supabase/supabase-js";

// Módulo server-only: cria o cliente Supabase com a secret key (acesso total
// ao Storage, ignora RLS). Como só é importado por lib/upload.ts (que é
// "use server"), o código nunca é enviado ao navegador e a chave não vaza.
// Não usamos "use server" aqui porque getSupabaseAdmin retorna o cliente
// (não serializável) — server actions precisam ser async.
//
// Supabase deprecou a JWT `service_role` em favor de secret keys
// (`sb_secret_...`). Aceitamos as duas variáveis para facilitar a migração.

function readSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    undefined
  );
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = readSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    const missing = [
      !supabaseUrl ? "SUPABASE_URL" : null,
      !supabaseKey ? "SUPABASE_SECRET_KEY" : null,
    ].filter(Boolean);
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(", ")} — configure-as no Vercel (Produção).`
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
