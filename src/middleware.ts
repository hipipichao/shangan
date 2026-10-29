import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/about", "/", "/idioms", "/geometry"];

const PWA_PATHS = [
  "/manifest.webmanifest",
  "/sw.js",
  "/workbox-",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => {
    if (p === "/" || p === "/idioms" || p === "/geometry") {
      return pathname === p;
    }
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  const isPublic = isPublicPath(pathname);
  const isApi = pathname.startsWith("/api/");
  const isPwa = PWA_PATHS.some((p) => pathname.startsWith(p));
  const isStatic =
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/);

  if (!session && !isPublic && !isApi && !isStatic && !isPwa) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};