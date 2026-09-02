import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  // --- 1. Proteção de rotas Admin ---
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = payload.role as string;

      // Restrições por role
      const restrictedForSeller =
        pathname.startsWith("/admin/financeiro") ||
        pathname.startsWith("/admin/compras") ||
        pathname.startsWith("/admin/cupons");

      if (role === "SELLER" && restrictedForSeller) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      if (role !== "ADMIN" && pathname.startsWith("/admin/usuarios")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch {
      // Token inválido ou expirado
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }
  }

  // --- 2. Headers de Segurança ---
  const response = NextResponse.next();
  
  response.headers.set("x-izafit-pathname", pathname);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Content Security Policy (CSP)
  // Permitimos imagens do Supabase Storage e scripts do Next.js.
  // 'unsafe-inline'/'unsafe-eval' são necessários porque o Next.js emite
  // scripts/styles inline; em produção, idealmente usar nonces (ver nota).
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://*.supabase.co data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join("; ");
  
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  // Aplica os headers de segurança em todas as rotas da aplicação,
  // mas pula assets estáticos, API e arquivos do Next.js.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
