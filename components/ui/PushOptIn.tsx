import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export const PushOptIn: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Prevent showing if already prompted or permissions already granted/denied
        const hasPrompted = localStorage.getItem('fameo_push_prompted');
        if (hasPrompted || Notification.permission !== 'default') {
            return;
        }

        // Wait for 2 minutes (120,000 ms) of engagement
        const timer = setTimeout(() => {
            setShowPrompt(true);
        }, 120000); // 2 minutes

        return () => clearTimeout(timer);
    }, []);

    const handleLater = () => {
        localStorage.setItem('fameo_push_prompted', 'true');
        setShowPrompt(false);
    };

    const handleEnable = async () => {
        localStorage.setItem('fameo_push_prompted', 'true');
        setShowPrompt(false);

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                
                // Note: In a real environment, you need an applicationServerKey (VAPID public key)
                // For demonstration purposes, we attempt to subscribe if possible, or just rest on the permission
                try {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        // applicationServerKey: urlB64ToUint8Array('YOUR_PUBLIC_VAPID_KEY_HERE')
                        // Without the key, some browsers might reject this, but the permission is secured.
                    });

                    // Mock API call
                    console.log('Push subscription successful:', subscription);
                    fetch('/api/push/subscribe', {
                        method: 'POST',
                        body: JSON.stringify(subscription),
                        headers: { 'Content-Type': 'application/json' }
                    }).catch(() => { /* mock fail silent */ });

                } catch (subErr) {
                    console.warn('Push subscription failed (likely missing VAPID key in demo environment):', subErr);
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] w-80 bg-[#16181D] border border-indigo-500/30 rounded-2xl shadow-2xl p-5 animate-slide-up origin-bottom-right">
            <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bell size={20} />
                </div>
                <button 
                    onClick={handleLater}
                    className="text-white/40 hover:text-white transition-colors p-1"
                >
                    <X size={16} />
                </button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Stay on track</h3>
            <p className="text-white/60 text-sm mb-4">
                Get reminders for your daily habits and focus sessions to maintain your streak.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={handleEnable}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                    Yes, remind me
                </button>
                <button
                    onClick={handleLater}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
};
