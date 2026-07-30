// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const localEnv = {};
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator < 1 || line.trimStart().startsWith('#')) continue;
    localEnv[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
}

const getEnv = (name) => process.env[name] || localEnv[name];
const analyticsBaseUrl = getEnv('ANALYTICS_API_BASE_URL') || 'http://3.149.74.186:8080/v1';
const analyticsToken = getEnv('ANALYTICS_BEARER_TOKEN');

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
          headers: analyticsToken
            ? { Authorization: `Bearer ${analyticsToken}` }
            : {}
        }
      }
    }
  }
});
