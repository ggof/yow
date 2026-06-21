import { defineConfig } from 'rolldown';
import gzipPlugin from 'rollup-plugin-gzip';
import { brotliCompressSync } from 'node:zlib';

export default defineConfig([
  // 1. Unminified bundle (Development)
  {
    input: './src/yow.js',
    output: {
      dir: 'dist',
      entryFileNames: 'yow.js',
      format: 'iife'
    }
  },
  // 2. Minified bundle with Gzip & Brotli (Production)
  {
    input: './src/yow.js',
    plugins: [
      // Standard Gzip compression
      gzipPlugin(),
      // Brotli compression using native zlib.brotliCompressSync
      gzipPlugin({
        customCompression: content => brotliCompressSync(Buffer.from(content)),
        fileName: '.br'
      })
    ],
    output: {
      dir: 'dist',
      entryFileNames: 'yow.min.js',
      format: 'iife',
      minify: true
    }
  }
]);
