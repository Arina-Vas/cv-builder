import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type CSSProperties, useId } from 'react';
import { expect, within } from 'storybook/test';

import { LevelBar } from './LevelBar';
import { LEVEL_MAX, LEVEL_MIN, type LevelType } from './LevelBar.types';

const LEVELS: LevelType[] = [0, 1, 2, 3, 4, 5];

const meta = {
  title: 'Shared/LevelBar',
  component: LevelBar,
  args: {
    level: 3,
    label: 'Intermediate',
    // a meter needs a name (axe "aria-meter-name"): what is measured
    'aria-label': 'React',
  },
  argTypes: {
    level: { control: 'inline-radio', options: LEVELS },
    label: {
      control: 'text',
      description: 'Text value for screen readers (aria-valuetext): mastery or proficiency',
    },
    'aria-label': {
      control: 'text',
      description: 'Name of what is measured. Next to a visible name use aria-labelledby instead',
    },
    className: { control: false },
  },
} satisfies Meta<typeof LevelBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Single bar, driven by Controls                                      */
/* ------------------------------------------------------------------ */

export const Playground: Story = {
  play: async ({ args, canvasElement, step }) => {
    const meter = within(canvasElement).getByRole('meter');

    await step('meter has a name', async () => {
      await expect(meter).toHaveAccessibleName(args['aria-label']);
    });

    await step('meter range and value', async () => {
      await expect(meter).toHaveAttribute('aria-valuemin', String(LEVEL_MIN));
      await expect(meter).toHaveAttribute('aria-valuemax', String(LEVEL_MAX));
      await expect(meter).toHaveAttribute('aria-valuenow', String(args.level));
    });

    await step('label is the text value', async () => {
      await expect(meter).toHaveAttribute('aria-valuetext', args.label);
    });

    await step('fill width = level / max', async () => {
      const fill = meter.firstElementChild as HTMLElement;
      const expected = (meter.clientWidth * args.level) / LEVEL_MAX;
      await expect(fill.getBoundingClientRect().width).toBeCloseTo(expected, 0);
    });
  },
};

export const WithoutLabel: Story = {
  args: { label: undefined },
  play: async ({ canvasElement }) => {
    // no label → no empty aria-valuetext, the reader falls back to the number
    const meter = within(canvasElement).getByRole('meter');
    await expect(meter).not.toHaveAttribute('aria-valuetext');
  },
};

/* ------------------------------------------------------------------ */
/* Overview: Level 0–5, Light and Dark (Figma: Notifications › Frame)  */
/* ------------------------------------------------------------------ */

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '100px auto',
  alignItems: 'center',
  gap: '20px 24px',
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
};

function LevelsGrid({ theme }: { theme: 'light' | 'dark' }) {
  const id = useId();

  return (
    <div data-theme={theme} style={gridStyle}>
      <strong style={{ gridColumn: '1 / -1' }}>{theme === 'light' ? 'Light' : 'Dark'}</strong>
      {LEVELS.map((level) => (
        <div key={level} style={{ display: 'contents' }}>
          <span id={`${id}-${level}`}>
            {level === LEVEL_MAX ? `Level ${level} (Max)` : `Level ${level}`}
          </span>
          <LevelBar level={level} aria-labelledby={`${id}-${level}`} />
        </div>
      ))}
    </div>
  );
}

// Fill width and colours of every level; compare with the Figma frame.
export const AllLevels: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <LevelsGrid theme="light" />
      <LevelsGrid theme="dark" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const meters = within(canvasElement).getAllByRole('meter');

    await step('6 levels × 2 themes, none collapsed to 0×0', async () => {
      await expect(meters).toHaveLength(LEVELS.length * 2);
      for (const meter of meters) {
        const { width, height } = meter.getBoundingClientRect();
        await expect(width).toBeGreaterThan(0);
        await expect(height).toBeGreaterThan(0);
      }
    });

    await step('each bar is named by its "Level N" caption', async () => {
      await expect(meters[0]).toHaveAccessibleName('Level 0');
      await expect(meters[LEVEL_MAX]).toHaveAccessibleName(`Level ${LEVEL_MAX} (Max)`);
    });

    await step('track is drawn (::before), fill grows by level', async () => {
      for (const meter of meters) {
        const track = getComputedStyle(meter, '::before');
        await expect(track.content).not.toBe('none');

        const level = Number(meter.getAttribute('aria-valuenow'));
        const fill = meter.firstElementChild as HTMLElement;
        await expect(fill.getBoundingClientRect().width).toBeCloseTo(
          (meter.clientWidth * level) / LEVEL_MAX,
          0,
        );
      }
    });
  },
};

/* ------------------------------------------------------------------ */
/* In context: skill and language items (Notion: User Skills/Languages) */
/* ------------------------------------------------------------------ */

// mastery / proficiency → level: Notion values, mapping from tokens.css
const SKILLS: { name: string; level: LevelType; mastery: string }[] = [
  { name: 'TypeScript', level: 1, mastery: 'Beginner' },
  { name: 'React', level: 2, mastery: 'Elementary' },
  { name: 'Next.js', level: 3, mastery: 'Intermediate' },
  { name: 'GraphQL', level: 4, mastery: 'Advanced' },
  { name: 'CSS', level: 5, mastery: 'Expert' },
];

const LANGUAGES: { name: string; level: LevelType; proficiency: string }[] = [
  { name: 'English', level: 3, proficiency: 'B2' },
  { name: 'Russian', level: 5, proficiency: 'Native' },
  { name: 'German', level: 1, proficiency: 'A1' },
];

const itemStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16 };

// The README pattern: the visible name names the bar via aria-labelledby.
function Item({ name, level, value }: { name: string; level: LevelType; value: string }) {
  const nameId = useId();

  return (
    <div style={itemStyle} title={value}>
      <LevelBar level={level} label={value} aria-labelledby={nameId} />
      <span id={nameId}>{name}</span>
    </div>
  );
}

function Items({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      data-theme={theme}
      style={{ ...gridStyle, gridTemplateColumns: 'repeat(2, max-content)', gap: '16px 48px' }}
    >
      {SKILLS.map(({ name, level, mastery }) => (
        <Item key={name} name={name} level={level} value={mastery} />
      ))}
      {LANGUAGES.map(({ name, level, proficiency }) => (
        <Item key={name} name={name} level={level} value={proficiency} />
      ))}
    </div>
  );
}

// Bar on the left of the name, as on the User Skills / Languages screens.
// Hover an item to see its mastery / proficiency.
export const InList: Story = {
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <Items theme="light" />
      <Items theme="dark" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('every bar is named by the text next to it', async () => {
      for (const { name } of [...SKILLS, ...LANGUAGES]) {
        // one per theme
        await expect(canvas.getAllByRole('meter', { name })).toHaveLength(2);
      }
    });

    await step('and carries its mastery / proficiency as text', async () => {
      const [react] = canvas.getAllByRole('meter', { name: 'React' });
      await expect(react).toHaveAttribute('aria-valuetext', 'Elementary');

      const [english] = canvas.getAllByRole('meter', { name: 'English' });
      await expect(english).toHaveAttribute('aria-valuetext', 'B2');
    });
  },
};
