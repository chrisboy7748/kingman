import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return ["", "/inscription", "/connexion", "/mentions-legales", "/confidentialite", "/cgv"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "weekly" : "yearly",
    priority: path === "" ? 1 : 0.5,
  }));
}
