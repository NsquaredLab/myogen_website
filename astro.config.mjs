import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// NOTE(deploy): base is '/' for local dev. Before the first GitHub Pages deploy,
// confirm the final URL and update site/base:
//   - Project page:  site 'https://NsquaredLab.github.io', base '/<repo-name>'
//   - Custom domain / org page: keep base '/'
// All asset/link refs use import.meta.env.BASE_URL so they follow whatever base is set.
export default defineConfig({
  site: 'https://NsquaredLab.github.io',
  // base is '/' for local dev / GitHub; GitLab Pages (namespace-in-path) sets
  // PAGES_BASE to the served subpath so assets resolve under it.
  base: process.env.PAGES_BASE ?? '/',
  output: 'static',
  integrations: [react()],
});
