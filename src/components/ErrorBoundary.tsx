import { Component, ReactNode } from 'react'
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          {this.state.error && (
            <pre className="max-w-full overflow-auto rounded bg-red-100 p-2 text-sm text-red-800">
              {this.state.error.message}
            </pre>
          )}
          {this.state.error?.stack && (
            <details className="w-full max-w-full">
              <summary className="cursor-pointer text-blue-600 underline">View stack trace</summary>
              <pre className="max-h-64 overflow-auto rounded bg-red-50 p-2 text-left text-xs text-red-800">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-4">
            <Button
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={this.handleReload}
            >
              Reload App
            </Button>
            <a
              className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
              href="https://github.com/AuroraInteractive/aurora/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report Issue
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
