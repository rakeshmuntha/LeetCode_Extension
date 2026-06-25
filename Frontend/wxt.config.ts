import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'], srcDir: 'src', outDir: "dist",
  manifest: {
    name: "LeetLens",
    description: "Supercharge LeetCode with real difficulty ratings, embedded YouTube solutions, and a one-click code copy button.",
    permissions: ["storage"],
    host_permissions: ["http://localhost:*/*", "https://leet-code-extension-five.vercel.app/*"],
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      96: "/icon/96.png",
      128: "/icon/128.png",
    },
  }
});
