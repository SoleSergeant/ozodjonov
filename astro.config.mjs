import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Pages stay static; only the admin (/keystatic) runs on the server.
  adapter: vercel(),
  integrations: [react(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
  },
});
