import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            workbox: { clientsClaim: false, skipWaiting: false, cleanupOutdatedCaches: true },
            injectRegister: 'auto',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
            },
            manifest: {
                name: 'Fameo Life OS',
                short_name: 'Fameo',
                description: 'The ultimate operating system for your flow state.',
                theme_color: '#111113',
                background_color: '#111113',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                shortcuts: [
                    {
                        name: "Focus Timer",
                        short_name: "Focus",
                        description: "Start a Pomodoro session",
                        url: "/?action=focus",
                        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
                    },
                    {
                        name: "New Note",
                        short_name: "Note",
                        description: "Quickly capture a new idea",
                        url: "/?action=new-note",
                        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
                    },
                    {
                        name: "New Task",
                        short_name: "Task",
                        description: "Add a new action item",
                        url: "/?action=new-task",
                        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }]
                    }
                ],
                screenshots: [
                    {
                        src: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=640&h=480&auto=format&fit=crop",
                        sizes: "640x480",
                        type: "image/jpeg",
                        form_factor: "wide",
                        label: "Fameo Dashboard"
                    },
                    {
                        src: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=320&h=640&auto=format&fit=crop",
                        sizes: "320x640",
                        type: "image/jpeg",
                        form_factor: "narrow",
                        label: "Fameo Mobile Task List"
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
    build: {
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'],
            },
            format: {
                comments: false,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core — critical for first paint, cache separately
                    'react-vendor': ['react', 'react-dom'],
                    // Three.js into its own chunk (lazy loaded for landing page)
                    'three-vendor': ['three', 'gsap'],
                    // TipTap editor in separate chunk
                    'editor-vendor': [
                        '@tiptap/react',
                        '@tiptap/starter-kit',
                        '@tiptap/extension-image',
                        '@tiptap/extension-link',
                        '@tiptap/extension-table',
                        '@tiptap/extension-table-row',
                        '@tiptap/extension-table-cell',
                        '@tiptap/extension-table-header',
                        '@tiptap/extension-code-block-lowlight',
                    ],
                    // Icons in separate chunk
                    'ui-vendor': ['lucide-react'],
                    // Animation library
                    'motion-vendor': ['framer-motion'],
                    // Database SDK
                    'supabase-vendor': ['@supabase/supabase-js'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: false, // Disable sourcemaps in production for smaller builds
    },
    optimizeDeps: {
        include: ['three', 'gsap', '@tiptap/react'],
        exclude: [], // Add any deps that should not be pre-bundled
    },
    preview: {
        port: 4173,
        open: false,
    },
});
