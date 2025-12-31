import React, { Component, ErrorInfo, ReactNode } from 'react';

// Define the shape of the component's props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional fallback UI prop
}

// Define the shape of the component's state
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class ChunkErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error : Error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error, and check if it is a ChunkLoadError
    console.error("Error caught by boundary:", error);
    if (error.name === 'ChunkLoadError') {
      const refreshed = sessionStorage.getItem('chunk-error-refreshed');
      if (!refreshed) {
        // Reload the page once to get the latest code
        sessionStorage.setItem('chunk-error-refreshed', 'true');
        window.location.reload();
      } else {
        // If it's already refreshed and still failing, display an error
        this.setState({ hasError: true, errorMessage: 'Failed to load the application resources. Please try again.' });
      }
    } else {
      this.setState({ hasError: true, errorMessage: 'An unexpected error occurred.' });
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <h1>{this.state.errorMessage}</h1>;
    }

    // Render children normally
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
