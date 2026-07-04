import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { hasLocale, type Locale } from "./dictionaries";

export const viewport: Viewport = {
  themeColor: "#080808",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const seo: Record<Locale, { title: string; description: string; ogDescription: string; ogLocale: string }> = {
  es: {
    title: "RMT Solutions — Remodelación y Construcción de Lujo",
    description:
      "RMT Solutions transforma hogares en obras maestras. Remodelación y construcción de lujo con más de 15 años de experiencia en Orlando, Florida.",
    ogDescription:
      "Transformamos hogares en obras maestras. Diseño innovador, materiales excepcionales y ejecución impecable.",
    ogLocale: "es_US",
  },
  en: {
    title: "RMT Solutions — Luxury Remodeling & Construction",
    description:
      "RMT Solutions turns homes into masterpieces. Luxury remodeling and construction with over 15 years of experience in Orlando, Florida.",
    ogDescription:
      "We turn homes into masterpieces. Innovative design, exceptional materials, and flawless execution.",
    ogLocale: "en_US",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : "es";
  const c = seo[locale];

  return {
    metadataBase: new URL("https://www.rmtsolutions.com"),
    title: c.title,
    description: c.description,
    keywords: [
      "remodelación",
      "construcción",
      "lujo",
      "diseño de interiores",
      "arquitectura",
      "Orlando",
      "Florida",
    ],
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: "/es",
        en: "/en",
      },
    },
    openGraph: {
      title: c.title,
      description: c.ogDescription,
      locale: c.ogLocale,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || "es";
  
  return (
    <html lang={lang} className={`${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}