import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Never intercept API routes
  if (path.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Merchant route protection
  const isMerchantRoute = path.startsWith("/merchant");
  const isAuthRoute =
    path.startsWith("/merchant/login") ||
    path.startsWith("/merchant/signup") ||
    path.startsWith("/merchant/pending") ||
    path.startsWith("/merchant/expired");

  if (isMerchantRoute && !isAuthRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/merchant/login";
    return NextResponse.redirect(url);
  }

  // If logged in and visiting login/signup → dashboard
  const isLoginOrSignup =
    path.startsWith("/merchant/login") ||
    path.startsWith("/merchant/signup");

  if (isLoginOrSignup && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/merchant/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin route protection
  const isAdminRoute =
    path.startsWith("/admin") && !path.startsWith("/admin/login");
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};