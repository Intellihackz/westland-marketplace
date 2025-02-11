import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Add routes that require authentication
const protectedRoutes = [
  '/profile',
  '/create-listing',
  '/my-listings',
  '/messages',
];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  try {
    // Verify JWT token
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification error:', error);
    // Token is invalid
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}

export const config = {
  matcher: [
    // Match all request paths except:
    '/((?!api/auth|api/listings/my-listings|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 