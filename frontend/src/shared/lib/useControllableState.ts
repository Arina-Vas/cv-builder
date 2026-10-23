import { useState } from 'react';

export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : inner;

  const setValue = (next: T) => {
    if (!isControlled) setInner(next);
    onChange?.(next);
  };

  return [value, setValue] as const;
}
