import {PropsWithChildren} from 'react';

type Props = PropsWithChildren<{ label: string; hint?: string }>;

export function FieldBlock({ label, hint, children }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-base font-semibold text-slate-900 dark:text-white">
        <span>{label}</span>
        {hint ? <span className="text-sm font-medium text-slate-500 dark:text-zinc-500">({hint})</span> : null}
      </div>
      {children}
    </div>
  );
};