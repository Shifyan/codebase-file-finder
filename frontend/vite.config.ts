import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Komponen hasil `shadcn add` mengimpor lewat alias "@/...", jadi alias ini
    // harus tersedia di Vite, bukan hanya di tsconfig.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
