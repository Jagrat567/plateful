import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Keep Vite's generated dependency cache outside node_modules. On Windows,
  // antivirus/indexing tools can briefly lock node_modules/.vite during rename.
  cacheDir: "../work/vite-cache",
  server: {
    port: 5173,
  },
});
