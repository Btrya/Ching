import { defineConfig } from 'vite';

// 站点部署在域名根路径；base 用相对路径，便于任意静态托管移植
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
