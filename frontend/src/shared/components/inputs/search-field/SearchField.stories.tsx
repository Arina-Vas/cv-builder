import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Button } from '../../buttons';
import { SearchField, type SearchFieldProps } from './SearchField';

const meta = {
  title: 'Shared/SearchField',
  component: SearchField,
  args: {
    value: '',
    onChange: fn(),
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { value: 'React' },
};

function InteractiveSearchField(args: SearchFieldProps) {
  const [value, setValue] = useState(args.value);

  return (
    <SearchField
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange(next);
      }}
    />
  );
}

export const Interactive: Story = {
  render: (args) => <InteractiveSearchField {...args} />,
};

function ExternalValueSearchField(args: SearchFieldProps) {
  const [value, setValue] = useState(args.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <SearchField
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" onClick={() => setValue('Angular')}>
          Set value to Angular
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setValue('')}>
          Reset value
        </Button>
      </div>
      <span>
        Current value: <code>{JSON.stringify(value)}</code>
      </span>
    </div>
  );
}

export const ExternalValueChange: Story = {
  render: (args) => <ExternalValueSearchField {...args} />,
};
