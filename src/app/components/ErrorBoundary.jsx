import React from 'react';

/**
 * Error boundary that catches render errors in the component tree
 * and shows a recovery UI instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Coriolis caught an error:', error, errorInfo);
  }

  _handleReload = () => {
    window.location.reload();
  };

  _handleClearAndReload = () => {
    // Clear only the current build from the URL, not all localStorage
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: '#ff8c00',
          backgroundColor: '#000',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
        }}>
          <h1 style={{ color: '#ff8c00' }}>Something went wrong</h1>
          <p>Coriolis encountered an error and couldn't recover. This is usually caused by a corrupted build or a browser extension interfering with the app.</p>
          <p style={{ color: '#888', fontSize: '0.9em' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={this._handleReload}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: '#ff8c00',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1em',
              }}
            >
              Reload Page
            </button>
            <button
              onClick={this._handleClearAndReload}
              style={{
                padding: '10px 20px',
                backgroundColor: '#333',
                color: '#ff8c00',
                border: '1px solid #ff8c00',
                cursor: 'pointer',
                fontSize: '1em',
              }}
            >
              Clear Current Build &amp; Reload
            </button>
          </div>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '0.85em' }}>
            If this keeps happening, try disabling browser extensions or clearing your browser cache.
            Your saved builds in localStorage are not affected by the Reload button.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
