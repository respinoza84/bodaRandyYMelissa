import { NextResponse, type NextRequest } from "next/server";

// Protege /admin (excepto /admin/login). La validación real de la cookie se hace en las páginas
// con isAdmin(); aquí solo redirigimos rápido si no hay cookie.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get("boda_admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
