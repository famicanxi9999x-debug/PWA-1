import { lazy, Suspense } from 'react';

// Lazy load the heavy Three.js component
const HorizonHeroSection = lazy(() =>
    import('./horizon-hero-section').then(m => ({ default: m.HorizonHeroSection }))
);

/**
 * Lazy-loaded wrapper for HorizonHeroSection
 * Reduces initial bundle size by ~500KB
 * Shows loading state while Three.js loads
 */
export const LazyHeroSection = () => {
    return (
        <Suspense
            fallback={
                <div className="w-screen h-screen bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-white text-4xl font-bold animate-pulse bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            FAMEO
                        </div>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            }
        >
            <HorizonHeroSection />
        </Suspense>
    );
};
