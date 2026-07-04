import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['en', 'es'];
const defaultLocale = 'es';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  // Simple parser: check if 'en' appears before 'es', or just default to es.
  // We can just check if 'en' is requested and supported.
  if (acceptLanguage.toLowerCase().includes('en')) {
    const enIndex = acceptLanguage.toLowerCase().indexOf('en');
    const esIndex = acceptLanguage.toLowerCase().indexOf('es');
    if (enIndex !== -1 && (esIndex === -1 || enIndex < esIndex)) {
      return 'en';
    }
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, public files like images)
    '/((?!_next|.*\\..*).*)',
  ],
};
