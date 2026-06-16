import type { MetadataRoute } from "next";

// Web App Manifest (ARCHITECTURE §2). Next отдаёт его по /manifest.webmanifest и сам подставляет
// <link rel="manifest">. Делает приложение устанавливаемым на домашний экран Android (Этап 5).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VanMark Drive",
    short_name: "VanMark",
    description: "Задачи водителей VanMark",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    lang: "ru",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
