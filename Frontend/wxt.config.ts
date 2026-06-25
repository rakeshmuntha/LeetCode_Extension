import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'], srcDir: 'src', outDir: "dist",
  manifest: {
    permissions: ["storage"],
    host_permissions: ["http://localhost:*/*", "https://leet-code-extension-five.vercel.app/*"]
  }
});
