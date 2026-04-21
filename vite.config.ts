import { defineConfig } from 'vite';
import { fcyThemePlugin } from './fancyfy/cli/vite-plugin.js';

// Vite is used as a pure file emitter — Shopify CLI owns serving.
// See ADR-004 §5: `npm run dev` in one terminal, `npm run dev:shopify` in another.

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    publicDir: false,
    build: {
      // Outputs land in Horizon's assets/ with the fcy- prefix rule (ADR-001 §3).
      // We must NOT wipe assets/ — it contains Horizon's own compiled assets.
      outDir: 'assets',
      emptyOutDir: false,
      minify: isDev ? false : 'esbuild',
      sourcemap: isDev,
      target: 'es2022',
      cssCodeSplit: true,
      rollupOptions: {
        // Inputs registered by fcyThemePlugin at the `config` hook.
        input: {},
        output: {
          entryFileNames: 'fcy-[name]-[hash].js',
          chunkFileNames: 'fcy-[name]-chunk-[hash].js',
          assetFileNames: (info) => {
            const name = info.name ?? 'asset';
            if (name.endsWith('.css')) return 'fcy-[name]-[hash][extname]';
            return 'fcy-[name]-[hash][extname]';
          },
        },
      },
    },
    define: {
      // Dead-code-elimination gate for the logger (ADR-007 §4).
      __FCY_DEV__: JSON.stringify(isDev),
    },
    plugins: [fcyThemePlugin({ commitSchema: process.argv.includes('--commit-schema') })],
    resolve: {
      alias: {
        '@fancyfy/ds': '/fancyfy/ds/main',
        '@fancyfy/shared': '/fancyfy/shared/index',
      },
    },
  };
});
