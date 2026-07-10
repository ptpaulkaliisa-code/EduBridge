import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  school_admin: "/admin",
  bursar: "/admin/fees",
  teacher: "/teacher",
  parent: "/parent",
};

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/verify",
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
  "/api/auth/logout",
];

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase project has been provisioned yet (Week 1) — let requests
  // through unauthenticated rather than crashing every route.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based redirect after login is finalized once the `users` table
  // is queried for role — done in the (dashboard) layout, not here, so
  // proxy.ts stays limited to optimistic auth checks per Next.js guidance.

  return supabaseResponse;
}

export { ROLE_HOME };
