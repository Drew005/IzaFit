// Helpers de formatação compartilhados entre o painel admin e a loja pública.
export function currency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
