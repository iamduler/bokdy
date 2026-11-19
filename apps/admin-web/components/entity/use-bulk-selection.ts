"use client";

import { useMemo, useState } from "react";

export function useBulkSelection() {
  const [selected, setSelected] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleMany(ids: string[]) {
    setSelected((current) => {
      const allOn = ids.length > 0 && ids.every((id) => current.includes(id));
      if (allOn) return current.filter((id) => !ids.includes(id));
      return [...new Set([...current, ...ids])];
    });
  }

  function keep(ids: string[]) {
    setSelected(ids);
  }

  function clear() {
    setSelected([]);
  }

  return { selected, selectedSet, toggle, toggleMany, keep, clear };
}
