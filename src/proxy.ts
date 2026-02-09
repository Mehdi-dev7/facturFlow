import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Récupérer la session utilisateur
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // Si pas de session et tentative d'accès au dashboard → redirect vers /login
  if (!session && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si session existe et sur /login ou /signup → redirect vers /dashboard
  if (session && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api/auth (routes d'authentification)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico, images
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
  ],
}
