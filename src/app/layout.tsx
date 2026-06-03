import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VanMark Drive",
  description: "Сервис планирования и учёта задач водителей VanMark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
