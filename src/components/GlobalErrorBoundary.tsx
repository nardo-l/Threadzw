import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Wrench, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorCode: string | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCode: null
    };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, errorCode: 'ERR_COMPONENT_CRASH' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[10000] bg-background flex flex-col max-w-[430px] mx-auto overflow-hidden">
          {/* Header */}
          <header className="p-6 flex flex-col items-center gap-4">
            <h1 className="text-2xl font-pacifico text-primary">thread</h1>
            <div className="w-full h-[3px] bg-gradient-to-r from-primary to-purple" />
          </header>

          <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-card border border-red/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl text-red">
              <Wrench size={40} />
            </div>

            <h2 className="text-3xl font-syne font-bold text-white mb-4">
              Something went wrong
            </h2>

            <p className="text-base font-sans text-muted leading-relaxed mb-8">
              Thread ZW ran into an unexpected error.
            </p>

            <div className="flex flex-col gap-2 mb-12">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                Error Code: {this.state.errorCode}
              </span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                We've noted the issue.
              </span>
            </div>

            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={this.handleReload}
                className="w-full py-4 bg-primary text-white font-syne font-bold rounded-pill shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reload App
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="w-full py-4 border border-white/10 text-white font-syne font-bold rounded-pill transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Go to Feed
              </button>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
