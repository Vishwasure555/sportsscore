import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const build = process.env.GITHUB_RUN_NUMBER ? `${pkg.version}+${process.env.GITHUB_RUN_NUMBER}` : `${pkg.version}-dev`;

// The app is served from https://<user>.github.io/sportsscore/
export default defineConfig({
  base: '/sportsscore/',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(build) },
});
