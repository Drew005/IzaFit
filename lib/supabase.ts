import { createClient } from "@supabase/supabase-js";

// Módulo server-only: cria o cliente Supabase com a SERVICE_ROLE_KEY (acesso
// total ao Storage, ignora RLS). Como só é importado por lib/upload.ts (que é
// "use server"), o código nunca é enviado ao navegador e a chave não vaza.
// Não usamos "use server" aqui porque getSupabaseAdmin retorna o cliente
// (não serializável) — server actions precisam ser async.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  // Lê as variáveis em tempo de chamada (não apenas ao carregar o módulo) para
  // que a função pegue os valores atuais do ambiente em qualquer momento (dev,
  // build, SSR). Relata exatamente qual variável falta para facilitar o debug.
  const supabaseUrl = process.env.SUPABASE_URL ?? url;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? serviceKey;

  if (!supabaseUrl || !supabaseKey) {
    const missing = [
      !supabaseUrl ? "SUPABASE_URL" : null,
      !supabaseKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(", ")} — configure-as no Vercel (Produção).`
    );
  }

  // Após o guard acima, supabaseUrl e supabaseKey são strings definidas.
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
