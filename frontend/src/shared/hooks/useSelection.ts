import { useState } from 'react';

export const useSelection = () => {
  const [selectingMode, setSelectingMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const start = () => setSelectingMode(true);

  const exit = () => {
    setSelectingMode(false);
    setSelectedIds(new Set());
  };

  return { selectingMode, selectedIds, toggle, start, exit };
};
