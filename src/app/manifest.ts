import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rapor Program Unggulan MTs KH. A. Wahab Muhsin",
    short_name: "Rapor Unggulan",
    description: "Aplikasi rapor Program Unggulan MTs KH. A. Wahab Muhsin Sukahideng",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064e3b",
    orientation: "portrait-primary",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
