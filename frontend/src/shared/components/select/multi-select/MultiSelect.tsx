import { useId, useRef, useState, type KeyboardEvent, type MouseEvent, type Ref } from 'react';
import { Popover } from 'radix-ui';

import { Chip } from '@/shared/components/chip/Chip';
import { Field, getErrorId } from '@/shared/components/field/Field';
import { CheckIcon } from '@/shared/components/icons/CheckIcon';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { useControllableState } from '@/shared/lib/useControllableState';
import type { SelectOption } from '../Select.types';
import s from './MultiSelect.module.css';
import { useTranslations } from 'next-intl';

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  label: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  filter?: (option: SelectOption, query: string) => boolean;
  emptyText?: string;
  ref?: Ref<HTMLInputElement>;
}

const defaultFilter = (option: SelectOption, query: string) =>
  option.label.toLowerCase().includes(query.trim().toLowerCase());

export function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  error,
  disabled = false,
  required = false,
  name,
  id,
  className,
  open,
  defaultOpen,
  onOpenChange,
  filter = defaultFilter,
  emptyText,
  ref,
}: MultiSelectProps) {
  const t = useTranslations('common.select');
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-listbox`;

  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- state ---------------- */

  const [selected, setSelected] = useControllableState(value, defaultValue ?? [], onValueChange);
  const [isOpen, setIsOpen] = useControllableState(open, defaultOpen ?? false, onOpenChange);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  // highlighted option in `filtered`; focus stays in the input, the list follows aria-activedescendant
  const [activeIndex, setActiveIndex] = useState(-1);

  /* ---------------- derived ---------------- */

  const filtered = options.filter((option) => filter(option, query));
  const selectedOptions = selected
    .map((v) => options.find((option) => option.value === v))
    .filter((option): option is SelectOption => option !== undefined);
  const isSelected = (v: string) => selected.includes(v);
  const optionId = (index: number) => `${listId}-option-${index}`;
  const activeOption = isOpen ? filtered[activeIndex] : undefined;

  /* ---------------- transitions ---------------- */

  const openList = () => {
    if (disabled || isOpen) return;
    setActiveIndex(0);
    setIsOpen(true);
  };

  const closeList = () => {
    if (isOpen) setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
  };

  const changeQuery = (next: string) => {
    setQuery(next);
    setActiveIndex(0); // the first match, so Enter picks it right away
    if (!disabled && !isOpen) setIsOpen(true);
  };

  const toggle = (v: string) => {
    setSelected(isSelected(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  const selectOption = (option: SelectOption) => {
    if (option.disabled) return;
    toggle(option.value);
    setQuery('');
    setActiveIndex(options.filter((o) => filter(o, '')).findIndex((o) => o.value === option.value));
  };

  const removeLast = () => {
    if (selected.length > 0) setSelected(selected.slice(0, -1));
  };

  /* ---------------- handlers ---------------- */

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const handleFieldMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (disabled || target.closest('button')) return;

    if (target === inputRef.current) {
      openList();
      return;
    }
    e.preventDefault();
    inputRef.current?.focus();
    if (isOpen) closeList();
    else openList();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) openList();
        else setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) openList();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;

      case 'Enter':
        if (!isOpen) return; // closed: Enter submits the form, like in any input
        e.preventDefault(); // open: pick, don't submit
        if (activeOption) selectOption(activeOption);
        break;

      case 'Backspace':
        if (query === '') removeLast();
        break;
    }
  };

  return (
    <Field
      id={inputId}
      label={label}
      error={error}
      disabled={disabled}
      filled={selected.length > 0 || query !== ''}
      active={isOpen || isFocused}
      className={className}
    >
      <Popover.Root open={isOpen} onOpenChange={(next) => (next ? openList() : closeList())}>
        <Popover.Anchor asChild>
          <div
            ref={fieldRef}
            className={s.field}
            data-open={isOpen || undefined}
            onMouseDown={handleFieldMouseDown}
          >
            {selectedOptions.map((option) => (
              <Chip
                className={s.chip}
                key={option.value}
                label={option.label}
                disabled={disabled}
                onRemove={() => toggle(option.value)}
              />
            ))}

            <input
              ref={setInputRef}
              id={inputId}
              className={s.input}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeOption ? optionId(activeIndex) : undefined}
              aria-required={required || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? getErrorId(inputId) : undefined}
              autoComplete="off"
              placeholder=" "
              disabled={disabled}
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                openList();
              }}
              onBlur={() => {
                setIsFocused(false);
                closeList();
              }}
              onKeyDown={handleKeyDown}
            />

            <ChevronIcon direction="down" className={s.icon} />

            {name && selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className={s.content}
            side="bottom"
            align="start"
            sideOffset={0}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (fieldRef.current?.contains(e.target as Node)) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (query) {
                e.preventDefault();
                setQuery('');
              }
            }}
          >
            <ul
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              className={s.list}
            >
              {filtered.map((option, index) => {
                const checked = isSelected(option.value);
                return (
                  <li
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={checked}
                    aria-disabled={option.disabled || undefined}
                    data-highlighted={index === activeIndex || undefined}
                    className={s.option}
                    onMouseMove={() => {
                      if (!option.disabled && index !== activeIndex) setActiveIndex(index);
                    }}
                    onMouseLeave={() => setActiveIndex(-1)}
                    onClick={() => selectOption(option)}
                  >
                    <span className={s.checkbox} aria-hidden>
                      {checked && <CheckIcon />}
                    </span>
                    <span className={s.optionLabel}>{option.label}</span>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 && <p className={s.empty}>{emptyText ?? t('noOptions')}</p>}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </Field>
  );
}
