import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    srcDir: 'src',
    outDir: 'dist',

    manifest: {
        name: 'LeetOne',
        description:
            'Your all-in-one LeetCode extension — real difficulty ratings, YouTube solutions, and a one-click code copy button.',
        permissions: ['storage'],

        host_permissions:
            process.env.NODE_ENV === 'development'
                ? [
                    'http://localhost:*/*',
                    'https://leet-code-extension-five.vercel.app/*',
                ]
                : ['https://leet-code-extension-five.vercel.app/*'],

        icons: {
            16: '/icon6/16.png',
            32: '/icon6/32.png',
            48: '/icon6/48.png',
            96: '/icon6/96.png',
            128: '/icon6/128.png',
        },
    },
});