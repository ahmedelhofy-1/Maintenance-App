import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple Error Boundary Fallback
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full">
      <div className="text-4xl mb-4">⚠️</div>
      <h1 className="text-xl font-black text-slate-900 mb-2 uppercase">Application Error</h1>
      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
        The application encountered an unexpected error and could not render.
      </p>
      <div className="bg-red-50 p-4 rounded-xl mb-6 overflow-x-auto">
        <code className="text-[10px] text-red-600 font-mono whitespace-pre">
          {error.message}
        </code>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
      >
        Reload Application
      </button>
    </div>
  </div>
);

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Critical Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);