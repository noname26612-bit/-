import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // На машине есть посторонний package-lock.json в домашнем каталоге, из-за которого
  // Next иначе ошибочно считает корнем воркспейса $HOME. Пиним корень на папку проекта.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
