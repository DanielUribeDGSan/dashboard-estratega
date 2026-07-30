import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronsUpDown, ExternalLink, Menu, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const STORAGE_KEY = 'analytics-selected-period';

type TopbarProps = { currentPath?: string; onMenuClick?: () => void };

export const Topbar: React.FC<TopbarProps> = ({ currentPath = '/', onMenuClick }) => {
  const now = new Date();
  const defaultValue = `month:${now.getFullYear()}:${now.getMonth()}`;
  const [period, setPeriod] = useState(defaultValue);
  const [periodOpen, setPeriodOpen] = useState(false);

  const options = useMemo(() => {
    const values: Array<{ value: string; label: string }> = [];
    for (let year = now.getFullYear(); year >= now.getFullYear() - 2; year -= 1) {
      const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
      for (let month = lastMonth; month >= 0; month -= 1) {
        values.push({
          value: `month:${year}:${month}`,
          label: `${MONTHS[month]} ${year}${year === now.getFullYear() && month === now.getMonth() ? ' · actual' : ''}`,
        });
      }
      values.push({ value: `year:${year}`, label: `Todo el año ${year}` });
    }
    return values;
  }, []);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get('period')
      || window.localStorage.getItem(STORAGE_KEY);
    if (!selected || selected === defaultValue) return;
    const timer = window.setTimeout(() => setPeriod(selected), 0);
    return () => window.clearTimeout(timer);
  }, [defaultValue]);

  const changePeriod = (value: string) => {
    setPeriodOpen(false);
    setPeriod(value);
    window.localStorage.setItem(STORAGE_KEY, value);
    const url = new URL(window.location.href);
    url.searchParams.set('period', value);
    window.location.assign(url.toString());
  };
  const selectedLabel = options.find((option) => option.value === period)?.label ?? 'Seleccionar periodo';

  return (
    <header className="sticky top-0 z-20 flex min-h-16 w-full items-center gap-2 bg-background px-4 py-3 sm:gap-4 sm:px-6 lg:min-h-20 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button aria-label="Abrir menú" variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0 lg:hidden">
          <Menu className="size-5" />
        </Button>
        {currentPath === '/' || currentPath === '/users' || currentPath === '/articles' || currentPath === '/sections' ? (
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-label="Periodo de analítica"
                  aria-expanded={periodOpen}
                  className="h-10 min-w-0 w-full max-w-sm justify-between rounded-lg border-0 bg-white px-3 text-xs font-semibold text-[#001391] shadow-sm hover:bg-white/80 focus-visible:border-transparent focus-visible:ring-0 sm:px-4 sm:text-sm"
                />
              }
            >
              <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                <CalendarDays className="size-4 shrink-0 text-[#0c6dff]" />
                <span className="truncate">{selectedLabel}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] rounded-xl border-0 p-1 shadow-xl">
              <Command>
                <CommandInput placeholder="Buscar mes o año…" />
                <CommandList>
                  <CommandEmpty>No se encontró ese periodo.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.value}`}
                        data-checked={period === option.value}
                        onSelect={() => changePeriod(option.value)}
                        className="rounded-lg px-3 py-2.5"
                      >
                        <CalendarDays className="size-4 text-slate-400" />
                        <span>{option.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <p className="text-sm font-medium text-slate-500">Analítica Estratega Life</p>
        )}
        <a
          href="https://usuarios-bbva-estratega-life.netlify.app/"
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir dashboard de usuarios"
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#001391] shadow-sm transition hover:bg-blue-50 sm:px-4 sm:text-sm"
        >
          <Users className="size-4 text-[#0c6dff]" />
          <span className="hidden sm:inline">Dashboard de usuarios</span>
          <ExternalLink className="hidden size-3.5 text-slate-400 md:block" />
        </a>
      </div>

    </header>
  );
};
