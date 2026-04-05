import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define protected routes
const protectedRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Middleware] Supabase environment variables missing');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Create response object to return
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for server-side operations
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setCookie(name, value, options) {
        response.cookies.set({
          name,
          value,
          ...options,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      },
      removeCookie(name, options) {
        response.cookies.delete(name);
      },
    },
  });

  // Try to get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login
  if (!session) {
    console.log('[Middleware] No session found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session exists, return response with updated cookies
  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/admin/:path*'],
};
