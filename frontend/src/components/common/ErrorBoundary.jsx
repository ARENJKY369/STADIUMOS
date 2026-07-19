import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
            <h2 className="font-bold text-lg">Oops! Something went wrong</h2>
            <p className="text-sm text-slate-500 mt-2">Stadium Operations encountered an error. Our team has been notified.</p>
            <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-left overflow-auto max-h-32">
              <p className="text-xs font-mono text-red-600">{this.state.error?.message}</p>
            </div>
            <div className="mt-6 flex gap-2 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm">Reload Page</button>
              <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm">Try Again</button>
            </div>
            <p className="text-xs text-slate-400 mt-4">Error ID: {Date.now().toString(36)} • Contact support@arena.ai</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
