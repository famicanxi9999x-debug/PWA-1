import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Wifi } from 'lucide-react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up w-[calc(100%-2rem)] max-w-md">
            <div className="bg-[#111113] border border-[#2A2D35] rounded-2xl shadow-2xl shadow-black/60 p-4 flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    {needRefresh
                        ? <RefreshCw size={18} className="text-indigo-400" />
                        : <Wifi size={18} className="text-green-400" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">
                        {offlineReady ? 'Ready for offline use' : 'New version available!'}
                    </h3>
                    <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
                        {offlineReady
                            ? 'Fameo is now cached and works without internet.'
                            : 'Update now to get the latest features and fixes.'}
                    </p>
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            <RefreshCw size={11} />
                            Reload to update
                        </button>
                    )}
                </div>
                <button onClick={close} className="shrink-0 text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                    <X size={15} />
                </button>
            </div>
        </div>
    );
}
