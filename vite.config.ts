import { defineConfig, loadEnv } from "vite";
import type { Plugin, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

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
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        }
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
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["@mlc-ai/web-llm"],
        esbuildOptions: {
          define: {
            global: "globalThis",
          },
          plugins: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            NodeGlobalsPolyfillPlugin({ buffer: true, process: true }) as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            NodeModulesPolyfillPlugin() as any,
          ],
        },
      },
    ssr: {
      noExternal: ["@mlc-ai/web-llm"],
    },
    build: {
      chunkSizeWarningLimit: 6000,
      rollupOptions: {
        plugins: [],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) {
                return 'react-vendor';
              }
              if (id.includes('@mlc-ai/web-llm')) {
                return 'llm';
              }
              if (id.includes('three/examples')) {
                return 'three-examples';
              }
              if (id.includes('three')) {
                return 'three-core';
              }
              if (id.includes('@react-three/fiber')) {
                return 'r3f';
              }
              if (id.includes('@react-three/drei')) {
                return 'drei';
              }
              if (id.includes('@react-three/postprocessing')) {
                return 'postprocessing';
              }
            }
          },
        },
      },
    },
  };
});
