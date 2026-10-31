import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['en', 'es'];
const defaultLocale = 'es';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  // Parse "fr-FR,fr;q=0.9,en;q=0.8" into languages ordered by their q weight
  // (header order breaks ties), then pick the first one we support by its
  // primary subtag, so en-GB -> en and es-MX -> es.
  const preferred = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? parseFloat(q.trim().slice(2)) : 1;
      return { lang: tag.split("-")[0], weight: Number.isNaN(weight) ? 0 : weight, index };
    })
    .filter((l) => l.lang && l.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  return preferred.find((l) => locales.includes(l.lang))?.lang ?? defaultLocale;
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
  // TEMP debug (remove): which language each browser asks for
  if (process.env.NODE_ENV === "development") {
    console.log(`[locale] ${request.headers.get("user-agent")?.slice(0, 60)} | accept-language="${request.headers.get("accept-language")}" -> ${locale}`);
  }
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, public files like images)
    '/((?!_next|.*\\..*).*)',
  ],
};
