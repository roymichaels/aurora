import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
// @ts-ignore - no type definitions for picomatch
import picomatch from "picomatch";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
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
      mode === 'development' && (() => {
        const tagger = componentTagger();
        const excludeGlobs = [
          'src/components/avatar/**',
          'src/components/controls/**',
          'src/components/roadmap/**',
          'src/components/WebGLContextManager.tsx',
          'src/game/**',
          'src/views/HomeGalaxy.tsx',
          'src/views/RoadmapGalaxy.tsx',
        ];
        const isExcluded = picomatch(excludeGlobs);
        return {
          ...tagger,
          transform(this: any, code: string, id: string, ...args: any[]) {
            const rel = path.relative(process.cwd(), id);
            if (isExcluded(rel)) return null;
            return (tagger.transform as any)?.call(this, code, id, ...args);
          },
        };
      })(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
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
