// ==========================================================================
// CARACTERÍSTICAS & DETALHES do produto
//
// O campo `Product.details` (JSONB) guarda uma lista de seções no formato:
//   [{ "title": "Características", "items": ["Compressão média", "..."] },
//    { "title": "Composição", "items": ["77% Poliamida | 12% Poliéster"] }]
//
// Este módulo é compartilhado entre server components (leitura exibição)
// e server actions (gravação/validação), por isso fica livre de "use client".
// ==========================================================================

export type ProductDetailsSection = {
  title?: string | null;
  items: string[];
};

export type ProductDetails = ProductDetailsSection[];

const MAX_SECTIONS = 20;
const MAX_ITEMS_PER_SECTION = 50;
const MAX_ITEM_LENGTH = 300;
const MAX_TITLE_LENGTH = 120;

// Normaliza e valida um valor vindo do banco (JsonValue) ou do form (string JSON).
// Nunca lança: entradas inválidas viram uma lista vazia, então a UI nunca quebra.
export function parseProductDetails(value: unknown): ProductDetails {
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      return parseProductDetails(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) return [];

  const result: ProductDetails = [];
  for (const section of value) {
    if (!section || typeof section !== "object") continue;
    const obj = section as Record<string, unknown>;
    const items = Array.isArray(obj.items)
      ? obj.items
          .filter((i): i is string => typeof i === "string")
          .map((i) => i.trim())
          .filter(Boolean)
          .slice(0, MAX_ITEMS_PER_SECTION)
      : [];

    if (items.length === 0) continue;

    const title =
      typeof obj.title === "string" && obj.title.trim()
        ? obj.title.trim().slice(0, MAX_TITLE_LENGTH)
        : null;

    result.push(title ? { title, items } : { items });

    if (result.length >= MAX_SECTIONS) break;
  }

  return result;
}

// Serializa a lista de seções pra JSON (usado no hidden input dos forms),
// truncando cada item pra não estourar o campo.
export function detailsToJson(details: ProductDetails): string {
  return JSON.stringify(
    details.map((s) => ({
      ...(s.title ? { title: s.title } : {}),
      items: s.items.map((i) => i.slice(0, MAX_ITEM_LENGTH)),
    }))
  );
}

// Converte o JsonValue cru do Prisma em ProductDetails tipado (seguro).
export function normalizeDetails(value: unknown): ProductDetails {
  return parseProductDetails(value);
}