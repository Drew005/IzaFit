// Dados de exemplo para o painel funcionar visualmente antes de conectar
// o Prisma a um banco real. Troque cada `get...` por uma query real
// (ex.: prisma.order.findMany(...)) mantendo o mesmo formato de retorno.

export const revenueTrend = [
  { month: "Mar", receita: 18200, gastos: 11400 },
  { month: "Abr", receita: 21500, gastos: 12100 },
  { month: "Mai", receita: 19800, gastos: 13200 },
  { month: "Jun", receita: 24700, gastos: 12900 },
  { month: "Jul", receita: 27300, gastos: 14100 },
  { month: "Ago", receita: 31200, gastos: 15600 },
];

export const kpis = {
  receitaMes: 31200,
  receitaVariacao: 14.3,
  lucroMes: 15600,
  lucroVariacao: 9.8,
  ticketMedio: 187.4,
  ticketVariacao: -2.1,
  pedidosMes: 167,
  pedidosVariacao: 6.5,
};

export const lowStock = [
  { produto: "Legging Performance", variante: "P / Preto", restante: 2, minimo: 5 },
  { produto: "Top Fitness Cross", variante: "M / Grafite", restante: 3, minimo: 5 },
  { produto: "Camiseta Dry Fit", variante: "G / Branco", restante: 1, minimo: 8 },
  { produto: "Short Compressão", variante: "M / Preto", restante: 4, minimo: 6 },
];

export const recentOrders = [
  { id: "PD-1042", cliente: "Marina Souza", total: 249.9, pagamento: "PIX", status: "Pago" },
  { id: "PD-1041", cliente: "Rafael Lima", total: 389.7, pagamento: "Cartão de crédito", status: "Pago" },
  { id: "PD-1040", cliente: "Beatriz Alves", total: 129.0, pagamento: "Cartão de débito", status: "Enviado" },
  { id: "PD-1039", cliente: "João Pedro", total: 512.4, pagamento: "PIX", status: "Pago" },
  { id: "PD-1038", cliente: "Camila Rocha", total: 79.9, pagamento: "Dinheiro", status: "Concluído" },
];

export const paymentSplit = [
  { name: "PIX", value: 48 },
  { name: "Cartão de crédito", value: 31 },
  { name: "Cartão de débito", value: 14 },
  { name: "Dinheiro", value: 7 },
];

export const products = [
  { id: "1", nome: "Legging Performance", categoria: "Leggings", variantes: 6, preco: 149.9, estoque: 38, status: "Ativo" },
  { id: "2", nome: "Top Fitness Cross", categoria: "Tops", variantes: 4, preco: 89.9, estoque: 21, status: "Ativo" },
  { id: "3", nome: "Camiseta Dry Fit", categoria: "Camisetas", variantes: 8, preco: 79.9, estoque: 9, status: "Ativo" },
  { id: "4", nome: "Short Compressão", categoria: "Shorts", variantes: 5, preco: 99.9, estoque: 27, status: "Ativo" },
  { id: "5", nome: "Whey Protein 900g", categoria: "Suplementos", variantes: 3, preco: 179.9, estoque: 54, status: "Ativo" },
  { id: "6", nome: "Coqueteleira 600ml", categoria: "Acessórios", variantes: 1, preco: 34.9, estoque: 60, status: "Ativo" },
];

export const customers = [
  { id: "1", nome: "Marina Souza", pedidos: 12, gastoTotal: 2140.5, pontos: 320, ultimaCompra: "28/08/2026" },
  { id: "2", nome: "Rafael Lima", pedidos: 7, gastoTotal: 1580.0, pontos: 210, ultimaCompra: "27/08/2026" },
  { id: "3", nome: "Beatriz Alves", pedidos: 3, gastoTotal: 420.7, pontos: 60, ultimaCompra: "25/08/2026" },
  { id: "4", nome: "João Pedro", pedidos: 19, gastoTotal: 4390.2, pontos: 610, ultimaCompra: "29/08/2026" },
];

export const coupons = [
  { codigo: "BEMVINDO10", tipo: "Percentual", valor: "10%", usos: "84/∞", validade: "sem prazo", status: "Ativo" },
  { codigo: "FRETEZERO", tipo: "Fixo", valor: "R$ 20,00", usos: "40/100", validade: "30/09/2026", status: "Ativo" },
  { codigo: "BLACKFIT", tipo: "Percentual", valor: "25%", usos: "0/500", validade: "24/11/2026", status: "Agendado" },
];

export const gifts = [
  { nome: "Munhequeira Núcleo", condicao: "Compras acima de R$ 250", estoque: 45 },
  { nome: "Squeeze 500ml", condicao: "Troca por 200 pontos", estoque: 30 },
];

export const expenses = [
  { categoria: "Aluguel", descricao: "Loja física — Setembro", valor: 4200, vencimento: "05/09/2026", status: "Pendente" },
  { categoria: "Marketing", descricao: "Impulsionamento Instagram", valor: 850, vencimento: "01/09/2026", status: "Pago" },
  { categoria: "Salários", descricao: "Folha de pagamento", valor: 9800, vencimento: "05/09/2026", status: "Pendente" },
  { categoria: "Logística", descricao: "Transportadora — lote agosto", valor: 610, vencimento: "30/08/2026", status: "Pago" },
];
