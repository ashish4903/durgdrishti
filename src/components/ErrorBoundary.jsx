import { Component } from 'react';

// Shows a short message and a reload button instead of a blank page if any part of the app
// throws while rendering. The text is in all three languages because the selected language
// is no longer known once the app has crashed.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('DurgDrishti stopped because of an error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="app-error" role="alert">
        <h1>Something went wrong.</h1>
        <p lang="mr">काहीतरी चूक झाली.</p>
        <p lang="hi">कुछ गलत हो गया।</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload · <span lang="mr">पुन्हा लोड करा</span> · <span lang="hi">फिर से लोड करें</span>
        </button>
      </main>
    );
  }
}
