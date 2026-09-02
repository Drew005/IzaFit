"use server";

import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Bucket no Supabase Storage que guarda as fotos dos produtos.
const BUCKET = "products";

// Tipos de imagem aceitos e extensão correspondente.
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

// Garante que o bucket "products" exista (cria se necessário), tornando-o público.
async function ensureBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

/**
 * Envia um arquivo de imagem para o Supabase Storage e devolve a URL pública
 * (ex.: https://xxxx.supabase.co/storage/v1/object/public/products/abc.jpg).
 * Retorna null se o campo vier vazio.
 */
export async function uploadImage(
  file: File | null | undefined
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = MIME_EXT[file.type] ?? ".jpg";
  const path = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const supabase = getSupabaseAdmin();
  await ensureBucket();

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Remove arquivos do Supabase Storage a partir de URLs públicas.
 * Ignora URLs vazias e URLs que não pertencem ao bucket "products".
 */
export async function deleteUploadedImages(
  urls: (string | null | undefined)[]
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Extrai só o path relativo das URLs do nosso bucket.
  const paths = (urls.filter(Boolean) as string[]).flatMap((url) => {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    return idx >= 0 ? [url.slice(idx + marker.length)] : [];
  });

  // Remove em lotes de até 100 (limite do Supabase Storage).
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) throw error;
  }
}
