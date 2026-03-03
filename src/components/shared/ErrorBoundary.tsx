import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {this.state.error?.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
