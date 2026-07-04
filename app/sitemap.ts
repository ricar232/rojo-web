import type { MetadataRoute } from "next";

const baseUrl = "https://www.rmtsolutions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["es", "en"].map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  }));
}
