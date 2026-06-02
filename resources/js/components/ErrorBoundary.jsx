import React, { Component } from 'react';
import Icon from './shared/Icon';

/**
 * GlobalErrorPage: Premium fallback UI when a fatal React rendering crash occurs.
 * Features a modern card design, soft color palette, and clean action states.
 */
export const GlobalErrorPage = ({ error, resetErrorBoundary }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8 text-center md:p-12 transition-all duration-300 hover:shadow-2xl">
                {/* Visual Premium Error Icon Wrapper */}
                <div className="mx-auto w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Icon name="alert" className="w-10 h-10" size={40} strokeWidth={2} />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
                    Đã xảy ra lỗi hệ thống
                </h1>
                <p className="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto">
                    Có vẻ như một số tính năng đã gặp sự cố không mong muốn. Đừng lo lắng, dữ liệu của bạn vẫn an toàn. Hãy thử tải lại trang hoặc quay lại sau.
                </p>

                {error?.message && (
                    <div className="bg-slate-50 rounded-2xl p-4 text-left font-mono text-xs text-rose-600 border border-slate-100 mb-8 max-h-40 overflow-y-auto break-all shadow-inner">
                        <strong className="block mb-1 text-slate-700">Chi tiết lỗi:</strong>
                        {error.message}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={resetErrorBoundary || (() => window.location.reload())}
                        className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:shadow-xl active:scale-[0.98] transform"
                    >
                        Tải lại trang
                    </button>
                    <a
                        href="/"
                        className="px-8 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all hover:text-slate-700 active:scale-[0.98] transform"
                    >
                        Về Trang Chủ
                    </a>
                </div>
            </div>
        </div>
    );
};

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("FATAL REACT RENDER ERROR BOUNDARY CAUGHT:", error, errorInfo);
        // [WHY] Future integration point for third-party logging tools (Sentry, LogRocket, etc.)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            window.location.href = '/';
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return React.cloneElement(this.props.fallback, {
                    error: this.state.error,
                    resetErrorBoundary: this.handleReset
                });
            }
            return (
                <GlobalErrorPage
                    error={this.state.error}
                    resetErrorBoundary={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}
