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
                manualChunks(id) {
                    // Split vendor libraries into separate chunks
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        if (id.includes('mapbox-gl') || id.includes('react-map-gl')) {
                            return 'vendor-map';
                        }
                        if (id.includes('recharts')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('@headlessui') || id.includes('clsx')) {
                            return 'vendor-ui';
                        }
                        if (id.includes('date-fns')) {
                            return 'vendor-date';
                        }
                        if (id.includes('i18next')) {
                            return 'vendor-i18n';
                        }
                        // Other node_modules
                        return 'vendor';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 600,
        minify: true,
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'mapbox-gl',
        ],
    },
});
