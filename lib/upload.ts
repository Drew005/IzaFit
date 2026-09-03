"use server";

import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Buckets públicos que guardam imagens exibidas na loja.
const PRODUCT_BUCKET = "products";
const BRANDING_BUCKET = "store-branding";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Tipos de imagem aceitos e extensão correspondente.
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

// Garante que o bucket "products" exista (cria se necessário), tornando-o público.
async function ensureBucket(bucket: string) {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const exists = buckets?.some((b) => b.name === bucket);
  if (!exists) {
    await supabase.storage.createBucket(bucket, { public: true });
  }
}

/**
 * Envia um arquivo de imagem para o Supabase Storage e devolve a URL pública
 * (ex.: https://xxxx.supabase.co/storage/v1/object/public/products/abc.jpg).
 * Retorna null se o campo vier vazio.
 */
export async function uploadImageToBucket(
  file: File | null | undefined,
  bucket: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter no máximo 10 MB.");
  }
  if (!MIME_EXT[file.type]) {
    throw new Error("Formato de imagem não aceito. Use JPG, PNG, WEBP, GIF ou AVIF.");
  }

  const ext = MIME_EXT[file.type];
  const path = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const supabase = getSupabaseAdmin();
  await ensureBucket(bucket);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImage(
  file: File | null | undefined
): Promise<string | null> {
  return uploadImageToBucket(file, PRODUCT_BUCKET);
}

export async function uploadBrandingImage(
  file: File | null | undefined
): Promise<string | null> {
  return uploadImageToBucket(file, BRANDING_BUCKET);
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
    const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
    const idx = url.indexOf(marker);
    return idx >= 0 ? [url.slice(idx + marker.length)] : [];
  });

  // Remove em lotes de até 100 (limite do Supabase Storage).
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove(chunk);
    if (error) throw error;
  }
}
