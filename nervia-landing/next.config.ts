import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    turbopack: {
      // Вказуємо, що корінь для турбопака — це поточна папка лендінгу
      root: '.', 
    },
  },
};

export default nextConfig;
