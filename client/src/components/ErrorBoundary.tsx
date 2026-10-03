import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f5ef] px-4 py-16 text-navy">
          <div className="max-w-md w-full bg-white border border-navy/10 p-8 text-center shadow-lg">
            <h2 className="font-serif text-2xl font-medium text-navy">Something went wrong</h2>
            <p className="mt-3 text-sm text-navy/70">
              The application encountered an unexpected issue while rendering this page.
            </p>
            {this.state.error?.message && (
              <p className="mt-2 text-xs font-mono bg-navy/5 p-2 text-navy/80 rounded overflow-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy hover:bg-gold-dark hover:text-white transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="border border-navy/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy hover:border-gold transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
