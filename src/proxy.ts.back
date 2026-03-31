import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const pages = { signIn: '/auth/signin', error: '/auth/signin' };

export default withAuth(
  function proxy(request: NextRequestWithAuth) {
    if (request.nextauth.token) {
      return NextResponse.next();
    }

    const signInUrl = new URL(pages.signIn, request.url);
    const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    signInUrl.searchParams.set('callbackUrl', callbackUrl);
    signInUrl.searchParams.set('error', 'SessionRequired');

    return NextResponse.redirect(signInUrl);
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: pages, // Matches the pages config in `[...nextauth]`
  },
);

export const config = {
  matcher: ['/profile/:path*'],
};
