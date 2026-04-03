'use client';

import { ReactNode } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Monitor, MoonStar, Settings2, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

type ThemeName = 'light' | 'dark' | 'system';

export const ToggleTheme = () => {
  const { setTheme } = useTheme();

  const items: { value: ThemeName; label: string; icon: ReactNode }[] = [
    { value: 'light', label: 'Светлая', icon: <Sun className="size-4" /> },
    { value: 'dark', label: 'Темная', icon: <MoonStar className="size-4" /> },
    { value: 'system', label: 'Системная', icon: <Monitor className="size-4" /> },
  ];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Settings2 size={24} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl border-slate-200 bg-white/95 text-slate-800 dark:border-white/10 dark:bg-[#171c29]/95 dark:text-zinc-100">
        {items.map((item) => (
          <DropdownMenuItem key={item.value} onClick={() => setTheme(item.value)} className="gap-2 rounded-xl py-2 ps-2 text-sm">
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
