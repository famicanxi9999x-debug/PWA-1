import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        // Hard reload ignoring cache
        window.location.reload();
    };

    private handleClearData = () => {
        if (window.confirm("This will clear your local settings to try and fix the crash. Your Supabase cloud data is safe. Proceed?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="bg-[#1e293b] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-500 rounded-t-2xl"></div>

                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <RotateCcw size={32} />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-white/60 mb-6 text-sm">
                            We encountered an unexpected error while rendering this page.
                        </p>

                        <div className="bg-black/20 rounded-lg p-3 text-left mb-8 overflow-y-auto max-h-32 border border-white/5">
                            <code className="text-xs text-red-400 font-mono break-words">
                                {this.state.error?.message || "Unknown rendering error"}
                            </code>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <RefreshCw size={18} /> Reload Application
                            </button>

                            <button
                                onClick={this.handleClearData}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium py-3 rounded-xl transition-colors border border-white/10 text-sm"
                            >
                                Clear Local Cache & Restart
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
