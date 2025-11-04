import React, { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, info: null } as State;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log minimal, but keep stack for debugging
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.setState({ info });
    // TODO: send to remote logging/monitoring if available
  }

  render() {
    if (this.state.hasError) {
      // Allow a custom fallback, otherwise show a compact UI with details
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6">
          <h2 className="text-lg font-bold text-red-600">Se ha producido un error</h2>
          <p className="text-sm text-gray-700">Revisa la consola para más detalles.</p>
          <details className="mt-4 whitespace-pre-wrap text-xs text-gray-600">
            {this.state.error?.toString()}
            {'\n'}
            {this.state.info?.componentStack}
          </details>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}