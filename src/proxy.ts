import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const token = await getToken({ req: request, secret: authSecret });
  const hasSession = Boolean(token?.sub);

  if (!hasSession && !isPublicRoute) {
    return redirectToLogin(request);
  }

  if (hasSession && pathname === "/login") {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = "/";
    portalUrl.search = "";
    return NextResponse.redirect(portalUrl);
  }

  return NextResponse.next({ request });
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
