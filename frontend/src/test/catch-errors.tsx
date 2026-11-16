import { Component, type ReactNode } from 'react';

// notFound() / redirect() throw (like the real Next.js ones), so something has to catch them
export class CatchErrors extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? null : this.props.children;
  }
}
