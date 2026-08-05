import React, { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { BookOpen, Eye, MousePointerClick, Route, X } from 'lucide-react';
import { Card } from './ui/Card';
import { ARTICLE_ACTION_LABELS, useArticlesData } from '../hooks/useArticlesData';
import { useChartLabelWidth } from '../hooks/useChartLabelWidth';
import { useRegisterDashboardExport } from './layout/DashboardExportContext';

const shortDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
};
const truncate = (value: unknown, max = 55) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const RankingTooltip = ({ active, payload, field }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="max-w-sm rounded-xl bg-white p-4 text-xs shadow-xl ring-1 ring-slate-100">
    <b className="text-[#001391]">{point.title}</b>
    <p className="mt-1 text-slate-500">{point[field]} {field === 'views' ? 'visualizaciones' : 'interacciones'}</p>
    {point.types && <div className="mt-2">{Object.entries(point.types).map(([type, value]) =>
      <p key={type} className="flex justify-between gap-5"><span>{ARTICLE_ACTION_LABELS[type] || type}</span><b>{String(value)}</b></p>)}</div>}
    {point.users?.length > 0 && <div className="mt-2 max-h-28 overflow-auto border-t pt-2">{point.users.slice(0, 8).map((item: any, index: number) =>
      <p key={index} className="flex justify-between gap-5"><span>{item.phone}</span><b>{item.code}</b></p>)}</div>}
  </div>;
};

const Detail = ({ detail, close }: any) => detail ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#001391]/25 p-4 backdrop-blur-sm" onClick={close}>
  <div className="max-h-[75vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
    <div className="mb-4 flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-[#0c6dff]">{detail.label}</p><h2 className="text-xl font-semibold text-[#001391]">{detail.title}</h2></div><button aria-label="Cerrar" onClick={close}><X /></button></div>
    <div className="space-y-2">{detail.users?.map((item: any, index: number) => <div key={index} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{item.phone}</span><b>{item.code}</b></div>)}</div>
  </div>
</div> : null;

const ChartCard = ({ title, subtitle, children, className = '' }: any) => <Card className={`flex min-h-[410px] min-w-0 flex-col ${className}`}>
  <h2 className="text-lg font-semibold text-[#001391]">{title}</h2><p className="mb-5 mt-1 text-xs text-slate-500">{subtitle}</p><div className="min-h-[300px] min-w-0 flex-1">{children}</div>
</Card>;

export const ArticlesView: React.FC = () => {
  const { loading, error, data } = useArticlesData();
  useRegisterDashboardExport(data);
  const [detail, setDetail] = useState<any>(null);
  const labelWidth = useChartLabelWidth(420, 260, 105);
  if (loading) return <div className="grid min-h-[65vh] place-items-center text-[#001391]">Preparando artículos…</div>;
  if (error || !data) return <Card className="mx-auto mt-20 max-w-xl text-center">{error}</Card>;
  const hasData = data.metrics.totalViews + data.metrics.totalInteractions > 0;
  const openDetail = (point: any, label: string) => point && setDetail({ label, title: point.title, users: point.users });

  return <div className="space-y-6 pb-8">
    <div><h1 className="text-2xl font-semibold text-[#001391]">Rendimiento de artículos</h1><p className="mt-1 text-sm text-slate-500">Actividad del {shortDate(data.period.from)} al {shortDate(data.period.to)}</p></div>
    {!hasData ? <Card className="grid min-h-[420px] place-items-center text-center"><div><BookOpen className="mx-auto text-blue-200" size={44} /><h2 className="mt-4 text-xl font-semibold text-[#001391]">No hay información de este periodo</h2></div></Card> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Visualizaciones', data.metrics.totalViews, 'Vistas totales del periodo', Eye],
          ['Interacciones', data.metrics.totalInteractions, 'Acciones dentro de artículos', MousePointerClick],
          ['Artículo más visto', data.metrics.mostViewed?.views ?? 0, data.metrics.mostViewed?.title ?? 'Sin datos', BookOpen],
          ['Más interactivo', data.metrics.mostInteractive?.interactions ?? 0, data.metrics.mostInteractive?.title ?? 'Sin datos', Route],
        ].map(([label, value, caption, Icon]: any) => <Card key={label}><div className="flex justify-between"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><Icon size={18} className="text-[#0c6dff]" /></div><p className="mt-3 text-3xl font-semibold">{Number(value).toLocaleString('es-MX')}</p><p className="mt-2 line-clamp-2 text-xs text-slate-500">{caption}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <ChartCard className="xl:col-span-12" title="Artículos más vistos" subtitle="Ranking de menor a mayor visualización; clic para ver los usuarios y su banca.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.viewRanking} layout="vertical" onClick={(state: any) => openDetail(state?.activePayload?.[0]?.payload, 'Lectores del artículo')} margin={{ left: 0 }}><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="title" width={labelWidth} tickFormatter={(value) => truncate(value, labelWidth < 150 ? 14 : labelWidth < 300 ? 30 : 55)} axisLine={false} tickLine={false} /><Tooltip content={<RankingTooltip field="views" />} /><Bar dataKey="views" fill="#001391" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-12" title="Interacciones por artículo" subtitle="Del artículo con menos acciones al que generó más interacción durante el periodo.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.interactionRanking} layout="vertical" onClick={(state: any) => openDetail(state?.activePayload?.[0]?.payload, 'Usuarios que interactuaron')} margin={{ left: 0 }}><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="title" width={labelWidth} tickFormatter={(value) => truncate(value, labelWidth < 150 ? 14 : labelWidth < 300 ? 30 : 55)} axisLine={false} tickLine={false} /><Tooltip content={<RankingTooltip field="interactions" />} /><Bar dataKey="interactions" fill="#7a4ce0" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-8" title="Interacciones vs. visualizaciones" subtitle="Comparación diaria a lo largo del periodo seleccionado.">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.dailyComparison}><defs><linearGradient id="articleViews" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c6dff" stopOpacity=".28" /><stop offset="1" stopColor="#0c6dff" stopOpacity=".02" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eef1f6" /><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip labelFormatter={(value) => shortDate(String(value))} /><Legend formatter={(value) => value === 'views' ? 'Visualizaciones' : 'Interacciones'} /><Area type="monotone" dataKey="views" name="views" stroke="#0c6dff" fill="url(#articleViews)" strokeWidth={3} /><Area type="monotone" dataKey="interactions" name="interactions" stroke="#7a4ce0" fill="#ede9fe" strokeWidth={3} /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-4" title="Tráfico en artículos" subtitle="Origen desde el que se abrieron los contenidos.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.traffic} layout="vertical"><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="source" width={105} axisLine={false} tickLine={false} /><Tooltip formatter={(value: any) => [value, 'Visualizaciones']} /><Bar dataKey="views" radius={[0, 7, 7, 0]}>{data.traffic.map((_: any, index: number) => <Cell key={index} fill={['#001391', '#0c6dff', '#2dcccd', '#7a4ce0'][index % 4]} />)}</Bar></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <Detail detail={detail} close={() => setDetail(null)} />
    </>}
  </div>;
};
