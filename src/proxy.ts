import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionFromToken } from "@/lib/auth";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionFromToken } from "@/lib/customerAuth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionFromToken(token) : null;

    if (pathname === "/admin/login") {
      if (session) {
        const url = req.nextUrl.clone();
        url.pathname = req.nextUrl.searchParams.get("next") || "/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Every other page requires a logged-in customer.
  const token = req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = token ? await verifyCustomerSessionFromToken(token) : null;

  if (pathname === "/account/login" || pathname === "/account/signup") {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$).*)",
  ],
};
