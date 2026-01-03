import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Simple Error Boundary to catch runtime errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          backgroundColor: '#0f0f12', 
          color: '#ef4444', 
          height: '100vh', 
          fontFamily: 'monospace',
          overflow: 'auto'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#18181b', 
            borderRadius: '0.5rem',
            border: '1px solid #27272a'
          }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
