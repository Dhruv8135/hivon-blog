import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname === "/posts/new" ||
    pathname === "/admin" ||
    /^\/posts\/[^/]+\/edit$/.test(pathname);

  if (!isProtected) {
    return response;
  }

  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  if (hasAuthCookie) {
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
