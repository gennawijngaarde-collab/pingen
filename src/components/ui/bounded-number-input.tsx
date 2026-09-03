'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface BoundedNumberInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  className?: string;
  onCommit: (value: number) => void;
}

export function BoundedNumberInput({
  id,
  value,
  min,
  max,
  className,
  onCommit,
}: BoundedNumberInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(max, Math.max(min, parsed));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      className={className}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value.replace(/[^\d]/g, ''));
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}
