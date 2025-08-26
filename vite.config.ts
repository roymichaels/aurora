import { defineConfig, loadEnv } from "vite";
import type { Plugin, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const publicOrigin = env.VITE_PUBLIC_ORIGIN || "";
  const originUrl = publicOrigin ? new URL(publicOrigin) : undefined;
  const tunnelHost = originUrl?.hostname;
  const hmrProtocol = originUrl?.protocol === "https:" ? "wss" : "ws";
  const hmrPort = originUrl?.port
    ? Number(originUrl.port)
    : originUrl?.protocol === "https:" ? 443 : 80;

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
            if (req.method === "OPTIONS") {
              // CORS preflight
              res.statusCode = 204;
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "*");
              res.end();
              return;
            }

            if (req.url === "/tonconnect-manifest.json") {
              const raw = fs.readFileSync(manifestPath, "utf-8");
              res.setHeader(
                "Content-Type",
                "application/json; charset=utf-8",
              );
              res.setHeader("Cache-Control", "no-store");
              res.setHeader("Access-Control-Allow-Origin", "*"); // allow Tonkeeper web to fetch
              res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "*");
              res.end(raw.replaceAll("%VITE_ORIGIN%", publicOrigin));
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
      host: true, // listen on 0.0.0.0
      port: 8080,
      cors: true, // add CORS for dev
      allowedHosts: tunnelHost ? [tunnelHost] : [],
      hmr: tunnelHost
        ? {
            protocol: hmrProtocol,
            host: tunnelHost,
            port: hmrPort,
          }
        : undefined,
    },
    preview: {
      port: 8080,
      cors: true,
      allowedHosts: tunnelHost ? [tunnelHost] : [],
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        devOptions: { enabled: false }, // keep SW off during dev; avoids stale caches
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
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
      "process.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL),
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["@mlc-ai/web-llm"],
      esbuildOptions: {
        define: { global: "globalThis" },
        plugins: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          NodeGlobalsPolyfillPlugin({ buffer: true, process: true }) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          NodeModulesPolyfillPlugin() as any,
        ],
      },
    },
    ssr: { noExternal: ["@mlc-ai/web-llm"] },
    build: {
      chunkSizeWarningLimit: 6000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react-vendor";
              if (id.includes("@mlc-ai/web-llm")) return "llm";
              if (id.includes("three/examples")) return "three-examples";
              if (id.includes("three")) return "three-core";
              if (id.includes("@react-three/fiber")) return "r3f";
              if (id.includes("@react-three/drei")) return "drei";
              if (id.includes("@react-three/postprocessing")) return "postprocessing";
            }
          },
        },
      },
    },
  };
});
