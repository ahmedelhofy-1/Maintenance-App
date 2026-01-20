
import React, { Component, ErrorInfo, ReactNode } from 'react';
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

// Define explicit interfaces for class component props and state
interface GlobalErrorBoundaryProps {
  children?: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Fix: Use the named Component import directly to ensure 'props' and 'state' are correctly resolved by TypeScript
class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  // Fix: Explicitly declare the state property on the class with the correct generic type
  public state: GlobalErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Fix: Ensure the constructor correctly passes props to super
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
  }

  // Fix: Correct static method return type for state updates on error
  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  // Fix: Use standard ErrorInfo type for robust error handling
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Render Error:", error, errorInfo);
  }

  render() {
    // Fix: Correctly accessing state and props from 'this' now that base class generics are correctly applied
    const { hasError, error } = this.state;
    if (hasError && error) {
      return <ErrorFallback error={error} />;
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
// Fix: Providing nested children correctly fulfills the ErrorBoundaryProps requirements
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
