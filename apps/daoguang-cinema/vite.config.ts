import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base:'./',
  server:{watch:{usePolling:true,interval:500}},
  resolve:{alias:Object.fromEntries(['core','project','director','renderer-three','audio','fx'].map(name=>[`@efe/${name}`,fileURLToPath(new URL(`../../packages/${name}/src/index.ts`,import.meta.url))]))},
  build:{target:'es2022',cssCodeSplit:false,assetsInlineLimit:Number.MAX_SAFE_INTEGER,rollupOptions:{output:{inlineDynamicImports:true}}},
});
