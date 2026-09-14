import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * If the user is already authenticated,
   * don't show the login page again.
   */
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }

  if (!user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(url);
  }
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }

  /*
   * If the user is not authenticated and tries
   * to access protected application routes,
   * send them to login.
   */
  const protectedPaths = ["/dashboard", "/org", "/scanner"];

  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
