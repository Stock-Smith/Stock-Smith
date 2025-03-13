import { fileURLToPath } from "url";
import { dirname } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "tailwindcss";

// Fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": `${__dirname}/src`,
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
