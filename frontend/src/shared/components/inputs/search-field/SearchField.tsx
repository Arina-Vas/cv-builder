'use client';

import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { IconButton } from '../../buttons';
import { CrossIcon } from '../../icons/CrossIcon';
import { SearchIcon } from '../../icons/SearchIcon';
import styles from './SearchField.module.css';
import { useTranslations } from 'next-intl';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export function SearchField({ value, onChange, delay = 300 }: SearchFieldProps) {
  const t = useTranslations('common.searchField');
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [lastSent, setLastSent] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (value !== prevValue) {
    setPrevValue(value);

    if (value !== lastSent) {
      setLastSent(value);
      setDraft(value);
    }
  }

  const send = (searchValue: string) => {
    setLastSent(searchValue);
    onChange(searchValue);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;

    setDraft(searchValue);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => send(searchValue), delay);
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    setDraft('');
    send('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || !draft) return;

    event.preventDefault();
    event.stopPropagation();
    handleClear();
  };

  return (
    <div className={styles.root}>
      <SearchIcon className={styles.icon} />
      <input
        ref={inputRef}
        type="search"
        value={draft}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        aria-label={t('label')}
        placeholder={t('label')}
        className={styles.input}
      />
      {draft && (
        <IconButton onClick={handleClear} aria-label={t('clear')} className={styles.clear}>
          <CrossIcon />
        </IconButton>
      )}
    </div>
  );
}
