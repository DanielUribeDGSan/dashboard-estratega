import React, { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Building2, Clock3, UserPlus, Users, X } from 'lucide-react';
import { Card } from './ui/Card';
import { useUsersData } from '../hooks/useUsersData';
import { useChartLabelWidth } from '../hooks/useChartLabelWidth';
import { useRegisterDashboardExport } from './layout/DashboardExportContext';

const COLORS = ['#001391', '#0c6dff', '#2dcccd', '#7a4ce0', '#f8b500'];
const shortDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
};
const seconds = (value: number) => value >= 60 ? `${Math.floor(value / 60)} min ${Math.round(value % 60)} s` : `${Math.round(value)} s`;
const truncate = (value: unknown, max = 24) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const UsersTooltip = ({ active, payload, label, suffix = 'usuarios' }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="max-w-xs rounded-xl bg-white p-4 text-xs shadow-xl ring-1 ring-slate-100">
    <b className="text-[#001391]">{point.date ? shortDate(point.date) : point.name || point.phone || point.code}</b>
    <p className="mt-1 text-slate-500">{payload[0].value} {suffix}</p>
    {point.users?.length > 0 && <div className="mt-2 max-h-32 overflow-auto">{point.users.slice(0, 10).map((item: any, index: number) =>
      <p key={index} className="flex justify-between gap-5 py-0.5"><span>{item.phone}</span><b>{item.code}</b></p>)}</div>}
    {point.phone && <p className="mt-1">Teléfono: {point.phone} · Banca: {point.code}</p>}
  </div>;
};

const Detail = ({ detail, close }: any) => detail ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#001391]/25 p-4 backdrop-blur-sm" onClick={close}>
  <div className="max-h-[75vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
    <div className="mb-4 flex justify-between"><div><p className="text-xs font-bold uppercase text-[#0c6dff]">{detail.label}</p><h2 className="text-xl font-semibold text-[#001391]">{detail.title}</h2></div><button aria-label="Cerrar" onClick={close}><X /></button></div>
    <div className="space-y-2">{detail.items?.map((item: any, index: number) => <div key={index} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{item.phone}<small className="ml-2 text-slate-400">Banca {item.code}</small></span></div>)}</div>
  </div>
</div> : null;

const ChartCard = ({ title, subtitle, children, className = '' }: any) => <Card className={`flex min-h-[390px] min-w-0 flex-col ${className}`}>
  <h2 className="text-lg font-semibold text-[#001391]">{title}</h2><p className="mb-5 mt-1 text-xs text-slate-500">{subtitle}</p><div className="min-h-[285px] min-w-0 flex-1">{children}</div>
</Card>;

export const UsersView: React.FC = () => {
  const { loading, error, data } = useUsersData();
  useRegisterDashboardExport(data);
  const [detail, setDetail] = useState<any>(null);
  const sectionLabelWidth = useChartLabelWidth(260, 210, 105);
  const activityLabelWidth = useChartLabelWidth(170, 145, 90);
  if (loading) return <div className="grid min-h-[65vh] place-items-center text-[#001391]">Preparando actividad de usuarios…</div>;
  if (error || !data) return <Card className="mx-auto mt-20 max-w-xl text-center">{error}</Card>;
  const hasData = data.metrics.registrations + data.metrics.activeUsers + data.activityMap.length > 0;
  const showUsers = (point: any, label: string) => point && setDetail({ label, title: point.date ? shortDate(point.date) : point.name, items: point.users ?? [] });

  return <div className="space-y-6 pb-8">
    <div><h1 className="text-2xl font-semibold text-[#001391]">Análisis de usuarios</h1><p className="mt-1 text-sm text-slate-500">Actividad del {shortDate(data.period.from)} al {shortDate(data.period.to)}</p></div>
    {!hasData ? <Card className="grid min-h-[420px] place-items-center text-center"><div><Users className="mx-auto text-blue-200" size={44} /><h2 className="mt-4 text-xl font-semibold text-[#001391]">No hay información de este periodo</h2></div></Card> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Nuevos usuarios', data.metrics.registrations, 'Registros del periodo', UserPlus],
          ['Usuarios activos', data.metrics.activeUsers, 'Personas únicas con actividad', Users],
          ['Tiempo prom. sección', seconds(data.metrics.avgSection), 'Promedio redondeado', Clock3],
          ['Tiempo prom. artículo', seconds(data.metrics.avgArticle), 'Promedio redondeado', Clock3],
        ].map(([label, value, caption, Icon]: any) => <Card key={label}><div className="flex justify-between"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><Icon size={18} className="text-[#0c6dff]" /></div><p className="mt-3 text-3xl font-semibold">{typeof value === 'number' ? value.toLocaleString('es-MX') : value}</p><p className="mt-2 text-xs text-slate-500">{caption}</p></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <ChartCard className="xl:col-span-6" title="Nuevos usuarios" subtitle="Registros diarios a lo largo del periodo; clic para ver teléfono y banca.">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.dailyRegistrations} onClick={(state: any) => showUsers(state?.activePayload?.[0]?.payload, 'Nuevos usuarios')}><CartesianGrid vertical={false} stroke="#eef1f6" /><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={25} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip />} /><Area dataKey="value" type="monotone" stroke="#00a86b" fill="#dcfce7" strokeWidth={3} /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-6" title="Usuarios activos" subtitle="Personas con actividad diaria; hover o clic para conocer phone y code.">
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.dailyActive} onClick={(state: any) => showUsers(state?.activePayload?.[0]?.payload, 'Usuarios activos')}><CartesianGrid vertical={false} stroke="#eef1f6" /><XAxis dataKey="date" tickFormatter={shortDate} minTickGap={25} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip />} /><Area dataKey="value" type="monotone" stroke="#0c6dff" fill="#dbeafe" strokeWidth={3} /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-12" title="Secciones más vistas" subtitle="De menor a mayor navegación, con tiempo promedio redondeado y usuarios.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.sectionRanking} layout="vertical" onClick={(state: any) => showUsers(state?.activePayload?.[0]?.payload, 'Usuarios de la sección')}><XAxis type="number" axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={sectionLabelWidth} tickFormatter={(value) => truncate(value, sectionLabelWidth < 150 ? 14 : 32)} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="visitas" />} /><Bar dataKey="views" fill="#001391" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-12" title="Tiempo promedio por sección" subtitle="Secciones ordenadas por duración promedio de navegación.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={[...data.sectionRanking].sort((a: any, b: any) => a.average - b.average)} layout="vertical"><XAxis type="number" tickFormatter={(value) => `${value}s`} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={sectionLabelWidth} tickFormatter={(value) => truncate(value, sectionLabelWidth < 150 ? 14 : 32)} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="segundos promedio" />} /><Bar dataKey="average" fill="#2dcccd" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-7" title="Usuarios con más lecturas" subtitle="De menor a mayor cantidad de artículos vistos, con phone y code.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.articleUsers}><CartesianGrid vertical={false} stroke="#eef1f6" /><XAxis dataKey="phone" hide /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="artículos vistos" />} /><Bar dataKey="views" fill="#7a4ce0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-5" title="Usuarios con más interacciones" subtitle="Ranking de menor a mayor por acciones realizadas; hover para ver phone y code.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.interactionUsers}><CartesianGrid vertical={false} stroke="#eef1f6" /><XAxis dataKey="phone" hide /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="interacciones" />} /><Bar dataKey="interactions" fill="#0c6dff" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-12" title="Banca más activa" subtitle="Actividad total agrupada por code y usuarios únicos.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.banks} layout="vertical"><XAxis type="number" axisLine={false} tickLine={false} /><YAxis type="category" dataKey="code" width={70} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="eventos" />} /><Bar dataKey="events" radius={[0, 7, 7, 0]}>{data.banks.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard className="xl:col-span-12" title="Mapa de actividad" subtitle="Secciones y artículos con mayor movimiento durante el periodo.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.activityMap} layout="vertical"><XAxis type="number" axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={activityLabelWidth} tickFormatter={(value) => truncate(value, activityLabelWidth < 100 ? 11 : 24)} axisLine={false} tickLine={false} /><Tooltip content={<UsersTooltip suffix="movimientos" />} /><Bar dataKey="value" radius={[0, 7, 7, 0]}>{data.activityMap.map((item: any, index: number) => <Cell key={index} fill={item.type === 'Sección' ? '#0c6dff' : '#2dcccd'} />)}</Bar></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <Detail detail={detail} close={() => setDetail(null)} />
    </>}
  </div>;
};
