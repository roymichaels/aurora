import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const tonConnectManifest = () => {
    const manifestPath = path.resolve(__dirname, "public/tonconnect-manifest.json");
    return {
      name: "tonconnect-manifest",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/tonconnect-manifest.json") {
            const raw = fs.readFileSync(manifestPath, "utf-8");
            const origin = env.VITE_ORIGIN || `http://${req.headers.host}`;
            res.setHeader("Content-Type", "application/json");
            res.end(raw.replace("%VITE_ORIGIN%", origin));
            return;
          }
          next();
        });
      },
    };
  };
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] }
      }),
      tonConnectManifest(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    optimizeDeps: {
      exclude: ["@mlc-ai/web-llm"],
    },
    ssr: {
      noExternal: ["@mlc-ai/web-llm"],
    },
  };
});
