import { Select as RadixSelect } from 'radix-ui';
import s from './Select.module.css';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { type Ref, useId } from 'react';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
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
  placeholder = 'Select option',
  className,
  error,
  defaultOpen,
  onOpenChange,
  open,
  defaultValue,
  id,
  value,
  label,
  required,
  disabled,
  name,
  ref,
}: Props) => {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const wrapperClassName = [s.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName}>
      <label className={s.label} htmlFor={triggerId}>
        {label}
      </label>
      <RadixSelect.Root
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        <RadixSelect.Trigger ref={ref} id={triggerId} className={s.trigger} aria-invalid={!!error}>
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
      {error && <span className={s.error}>{error}</span>}
    </div>
  );
};
