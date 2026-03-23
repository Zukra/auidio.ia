import { PropsWithChildren } from 'react';

export const OutputBox = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-[260px] rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-4 sm:p-5 dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(18,22,33,0.96)_0%,rgba(15,18,28,0.98)_100%)]">
      <div className="w-full overflow-auto text-sm">{children}</div>
    </div>
  );
};