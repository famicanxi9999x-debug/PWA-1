import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
            <div className="bg-[#111113] border border-[#2A2D35] rounded-md shadow-lg p-4 flex flex-col gap-3 min-w-[300px]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-white font-medium text-sm mb-1">
                            {offlineReady ? 'App ready to work offline' : 'New Update Available'}
                        </h3>
                        <p className="text-white/60 text-xs">
                            {offlineReady
                                ? 'You can now use Fameo without an internet connection.'
                                : 'A new version of Fameo is available. Update now to get the latest features.'}
                        </p>
                    </div>
                    <button onClick={close} className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={14} className="animate-spin" />
                        Reload & Update
                    </button>
                )}
            </div>
        </div>
    );
}
