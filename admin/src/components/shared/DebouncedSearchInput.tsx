import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export interface DebouncedSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function DebouncedSearchInput({
  value,
  onChange,
  placeholder = 'Поиск',
  debounceMs = 300,
  className = 'w-72',
}: DebouncedSearchInputProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local]);

  return (
    <Input
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      className={className}
    />
  );
}
