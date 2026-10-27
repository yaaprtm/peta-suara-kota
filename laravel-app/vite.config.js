import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor libraries
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-map': ['mapbox-gl', 'react-map-gl'],
                    'vendor-charts': ['recharts'],
                    'vendor-ui': ['@headlessui/react', 'clsx'],
                    'vendor-date': ['date-fns'],
                    'vendor-i18n': ['i18next', 'react-i18next'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'mapbox-gl',
            'react-map-gl',
        ],
    },
});
