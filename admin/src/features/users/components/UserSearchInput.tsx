import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export function UserSearchInput({
  value,
  onChange,
  delay = 300,
}: {
  value: string;
  onChange: (v: string) => void;
  delay?: number;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, delay);
    return () => clearTimeout(t);
  }, [local]);

  return (
    <Input
      placeholder="Поиск по email / имени"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      className="w-72"
    />
  );
}
