import { Select as RadixSelect } from 'radix-ui';
import s from './Select.module.css';
import { Field, getErrorId } from '@/shared/components/field/Field';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { type Ref, useId } from 'react';
import { useControllableState } from '@/shared/lib/useControllableState';
import type { SelectOption } from '@/shared/components/select/Select.types';

type Props = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
};

export const Select = ({
  options,
  onValueChange,
  className,
  error,
  defaultOpen,
  onOpenChange,
  open,
  defaultValue,
  id,
  value,
  label,
  placeholder = label,
  required,
  disabled = false,
  name,
  ref,
}: Props) => {
  const autoId = useId();
  const triggerId = id ?? autoId;

  const [selected, setSelected] = useControllableState(value, defaultValue ?? '', onValueChange);
  const [isOpen, setIsOpen] = useControllableState(open, defaultOpen ?? false, onOpenChange);

  return (
    <Field
      id={triggerId}
      label={label}
      error={error}
      disabled={disabled}
      filled={selected !== ''}
      active={isOpen}
      className={className}
    >
      <RadixSelect.Root
        value={selected}
        onValueChange={setSelected}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
        required={required}
        name={name}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={triggerId}
          className={s.trigger}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? getErrorId(triggerId) : undefined}
        >
          <span className={s.value}>
            <RadixSelect.Value placeholder={placeholder} />
          </span>
          <RadixSelect.Icon asChild>
            <ChevronIcon direction="down" className={s.icon} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position={'popper'}
            side="bottom"
            sideOffset={0}
            className={s.content}
          >
            <RadixSelect.Viewport>
              {options.map((option: SelectOption) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className={s.item}
                  disabled={option.disabled}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </Field>
  );
};
