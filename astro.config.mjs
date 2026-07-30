// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const analyticsBaseUrl = env.ANALYTICS_API_BASE_URL || 'http://3.149.74.186:8080/v1';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/.netlify/functions/analytics': {
          target: analyticsBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace('/.netlify/functions/analytics', ''),
          headers: env.ANALYTICS_BEARER_TOKEN
            ? { Authorization: `Bearer ${env.ANALYTICS_BEARER_TOKEN}` }
            : {}
        }
      }
    }
  }
});
