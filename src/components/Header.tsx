import { Sparkles } from 'lucide-react';
import { ThemeMenu } from '@/components/ThemeMenu';

type Props = {};

export const Header = (props: Props) => {
  return (
    <header className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_10px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:px-5 dark:border-white/8 dark:bg-white/[0.03] dark:shadow-[0_10px_60px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-slate-900 shadow-lg shadow-orange-500/20">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            Test_audio
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Панель запуска обработки
          </p>
        </div>
      </div>
      <ThemeMenu />
    </header>
  );
};