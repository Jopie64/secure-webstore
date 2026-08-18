import { defineConfig } from 'tsup';

export default defineConfig([
  // 1. Dual ESM / CJS module build with TypeScript declaration files
  {
    entry: {
      index: 'src/secure-webstore.ts',
      'cjs/secure-webstore': 'src/secure-webstore.ts',
      'esm/secure-webstore': 'src/secure-webstore.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    shims: true,
  },
  // 2. Standalone browser bundle (iife/global SecureStore) for direct <script> tag usage
  {
    entry: {
      'secure-webstore': 'src/secure-webstore.ts',
    },
    format: ['iife'],
    globalName: 'SecureStore',
    platform: 'browser',
    sourcemap: true,
    minify: true,
  }
]);
