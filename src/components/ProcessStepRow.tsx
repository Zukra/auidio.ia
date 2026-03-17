import { cn } from '@/lib/utils';
import { CheckCircle2, LoaderCircle, User } from 'lucide-react';

function getStepIcon(status: ProcessingStepStatus) {
  if (status === 'running') {
    return <LoaderCircle className="size-4 animate-spin" />;
  }
  if (status === 'success') {
    return <CheckCircle2 className="size-4" />;
  }
  return <User className="size-4" />;
}

export const ProcessStepRow = ({ step }: { step: ProcessingStep }) => {
  const icon = getStepIcon(step.status);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/8 dark:bg-[rgba(15,20,29,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex size-4 items-center justify-center rounded-xl', step.status === 'success' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : step.status === 'running' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-zinc-500')}>
          {icon}
        </div>
        <span className="truncate text-sm font-semibold tracking-[0.02em] text-slate-800 dark:text-zinc-100">{step.title}</span>
      </div>
      <div className="text-emerald-600 dark:text-emerald-300">
        {
          step.status === 'idle'
            ? <div className="size-2.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
            : step.status === 'running'
              ? <LoaderCircle className="size-4 animate-spin" />
              : <CheckCircle2 className="size-4" />
        }
      </div>
    </div>
  );
};