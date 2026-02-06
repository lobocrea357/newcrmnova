"use client";

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Handle authentication errors specifically
    if (
      error?.message?.includes("Invalid Refresh Token") ||
      error?.message?.includes("refresh_token_not_found") ||
      error?.message?.includes("JWT expired") ||
      error?.message?.includes("Session expired")
    ) {
      // Clear any invalid session data
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.clear();

        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  render() {
    if (this.state.hasError) {
      const isAuthError =
        this.state.error?.message?.includes("Invalid Refresh Token") ||
        this.state.error?.message?.includes("refresh_token_not_found") ||
        this.state.error?.message?.includes("JWT expired") ||
        this.state.error?.message?.includes("Session expired");

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAuthError ? "Sesión Expirada" : "Error de la Aplicación"}
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                {isAuthError
                  ? "Tu sesión ha expirado. Serás redirigido al inicio de sesión."
                  : "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."}
              </p>

              <details className="text-left bg-gray-50 p-3 rounded mb-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Detalles del error
                </summary>
                <div className="text-xs text-red-600 whitespace-pre-wrap font-mono">
                  <div className="mb-2">
                    <strong>Error:</strong>
                    <br />
                    {this.state.error && this.state.error.toString()}
                  </div>
                  <div className="mb-2">
                    <strong>Stack Trace:</strong>
                    <br />
                    {this.state.error && this.state.error.stack}
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <br />
                    {this.state.errorInfo &&
                      this.state.errorInfo.componentStack}
                  </div>
                </div>
              </details>

              <div className="flex space-x-3">
                {isAuthError ? (
                  <button
                    onClick={this.handleGoToLogin}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Ir al Login
                  </button>
                ) : (
                  <>
                    <button
                      onClick={this.handleRetry}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Recargar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
