import { defineConfig, loadEnv } from "vite";
import type { Plugin, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const tonConnectManifest = (): Plugin => {
    const manifestPath = path.resolve(
      __dirname,
      "public/tonconnect-manifest.json",
    );
    return {
      name: "tonconnect-manifest",
      apply: "serve",
      configureServer(server: ViteDevServer) {
        server.middlewares.use(
          (
            req: IncomingMessage,
            res: ServerResponse,
            next: () => void,
          ) => {
            if (req.url === "/tonconnect-manifest.json") {
              const raw = fs.readFileSync(manifestPath, "utf-8");
              const origin = env.VITE_ORIGIN || `http://${req.headers.host}`;
              res.setHeader("Content-Type", "application/json");
              res.end(raw.replace("%VITE_ORIGIN%", origin));
              return;
            }
            next();
          },
        );
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
