import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronsUpDown, Download, ExternalLink, FileSpreadsheet, FileText, LoaderCircle, Menu, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { downloadAnalyticsCsv, downloadDashboardPdf } from '@/lib/downloadDashboard';
import { useDashboardExport } from './DashboardExportContext';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type TopbarProps = { currentPath?: string; onMenuClick?: () => void };

export const Topbar: React.FC<TopbarProps> = ({ currentPath = '/', onMenuClick }) => {
  const { exportData } = useDashboardExport();
  const now = new Date();
  const defaultValue = `month:${now.getFullYear()}:${now.getMonth()}`;
  const [period, setPeriod] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return new URLSearchParams(window.location.search).get('period') || defaultValue;
  });
  const [periodOpen, setPeriodOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'csv' | null>(null);
  const [downloadError, setDownloadError] = useState('');

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

  const changePeriod = (value: string) => {
    setPeriodOpen(false);
    setPeriod(value);
    const url = new URL(window.location.href);
    url.searchParams.set('period', value);
    window.location.assign(url.toString());
  };
  const selectedLabel = options.find((option) => option.value === period)?.label ?? 'Seleccionar periodo';
  const pageName = currentPath === '/articles' ? 'articulos' : currentPath === '/sections' ? 'secciones' : currentPath === '/users' ? 'usuarios' : 'home';

  const runDownload = async (type: 'pdf' | 'csv') => {
    setDownloadOpen(false);
    setDownloadError('');
    setDownloading(type);
    try {
      if (type === 'pdf') await downloadDashboardPdf(pageName);
      else await downloadAnalyticsCsv(pageName, exportData);
    } catch (error) {
      console.error('Error al generar la descarga:', error);
      setDownloadError(error instanceof Error ? error.message : 'No se pudo generar la descarga. Inténtalo nuevamente.');
    } finally {
      setDownloading(null);
    }
  };

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
        <Popover open={downloadOpen} onOpenChange={setDownloadOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                aria-label="Abrir opciones de descarga"
                disabled={downloading !== null}
                className="h-10 shrink-0 gap-2 rounded-lg border-0 bg-white px-3 text-xs font-semibold text-[#001391] shadow-sm hover:bg-blue-50 sm:px-4 sm:text-sm"
              />
            }
          >
            {downloading ? <LoaderCircle className="size-4 animate-spin text-[#0c6dff]" /> : <Download className="size-4 text-[#0c6dff]" />}
            <span className="hidden md:inline">{downloading ? 'Generando…' : 'Descargar'}</span>
            <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 rounded-xl border-0 p-2 shadow-xl">
            <button type="button" onClick={() => runDownload('pdf')} className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-blue-50">
              <FileText className="mt-0.5 size-5 shrink-0 text-red-500" />
              <span><b className="block text-sm text-slate-800">Descargar PDF</b><small className="text-xs text-slate-500">Vista completa con gráficas</small></span>
            </button>
            <button type="button" onClick={() => runDownload('csv')} className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-emerald-50">
              <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <span><b className="block text-sm text-slate-800">Descargar CSV</b><small className="text-xs text-slate-500">Datos completos de las tablas</small></span>
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {downloadError && <p className="absolute right-4 top-16 z-30 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm sm:right-6 lg:right-8">{downloadError}</p>}

    </header>
  );
};
