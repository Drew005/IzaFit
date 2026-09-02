import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session");

  if (!session && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // O layout valida a role consultando o usuário no banco. Este header evita
  // tentar importar Prisma no middleware (que roda no Edge Runtime).
  const headers = new Headers(request.headers);
  headers.set("x-izafit-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
