import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://standkids.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
