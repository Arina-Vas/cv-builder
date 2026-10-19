import type { Preview } from '@storybook/nextjs-vite';

import '../src/shared/theme/tokens.css';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // appDirectory: true crashes on Next 16.4: Storybook 10.6 app-router mock lacks
    // LayoutRouterContext.parentRenderTree (useRouter reads .data from it).
    // Enable per story only once Storybook ships a fix.
    nextjs: { appDirectory: false },

    a11y: {
      // test show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
