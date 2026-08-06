import React, { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BellRing, BookOpen, CalendarDays, Clock3, MousePointerClick, TrendingUp, Users, X } from 'lucide-react';
import { Card } from './ui/Card';
import { ACTION_TRANSLATIONS, useHomeData } from '../hooks/useHomeData';
import { useChartLabelWidth } from '../hooks/useChartLabelWidth';
import { useRegisterDashboardExport } from './layout/DashboardExportContext';

const COLORS = ['#001391', '#0c6dff', '#2dcccd', '#f8b500', '#7a4ce0', '#f35b74', '#00a86b', '#64748b'];
const shortDate = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(value ?? '');
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
};
const seconds = (value: number) => value >= 60 ? `${Math.floor(value / 60)} min ${Math.round(value % 60)} s` : `${Math.round(value)} s`;
const truncateLabel = (value: unknown, max = 23) => {
  const label = String(value ?? '');
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
};

const TooltipBox = ({ active, payload, label, kind }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="max-w-[310px] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
      <p className="mb-2 text-sm font-semibold text-[#001391]">{label ? shortDate(label) : point.title}</p>
      {kind === 'users' && (
        <>
          <p className="text-xs text-slate-500">{point.value} usuario{point.value === 1 ? '' : 's'}</p>
          <div className="mt-2 max-h-32 space-y-1 overflow-auto">
            {point.users?.slice(0, 8).map((user: any, index: number) => (
              <p key={`${user.phone}-${index}`} className="flex justify-between gap-5 text-xs">
                <span className="font-semibold text-[#0c6dff]">{user.code}</span><span>{user.phone}</span>
              </p>
            ))}
          </div>
        </>
      )}
      {kind === 'articles' && (
        <>
          <p className="text-xs text-slate-500">{point.value} visualizaciones</p>
          <div className="mt-2 max-h-32 space-y-1 overflow-auto">
            {point.articles?.slice(0, 8).map((article: any) => (
              <p key={article.title} className="flex justify-between gap-5 text-xs">
                <span className="truncate">{article.title}</span><b>{article.views}</b>
              </p>
            ))}
          </div>
        </>
      )}
      {kind === 'registrations' && <p className="text-xs text-slate-600">{point.value} registros nuevos</p>}
      {kind === 'notifications' && <>
        <p className="text-xs text-slate-500">{point.value} usuarios únicos · {point.opens} aperturas</p>
        <div className="mt-2 max-h-32 space-y-1 overflow-auto">
          {point.users?.slice(0, 8).map((user: any, index: number) => (
            <p key={`${user.phone}-${index}`} className="flex justify-between gap-5 text-xs">
              <span className="font-semibold text-[#f35b74]">{user.code}</span><span>{user.phone}</span>
            </p>
          ))}
        </div>
      </>}
      {kind === 'duration' && <p className="text-xs text-slate-600">Promedio: <b>{seconds(point.average)}</b></p>}
      {kind === 'ranking' && <p className="text-xs text-slate-600">Visualizaciones: <b>{point.views}</b></p>}
      {kind === 'actions' && (
        <div className="space-y-1">
          {payload.filter((item: any) => item.value > 0).map((item: any) => (
            <p key={item.dataKey} className="flex justify-between gap-5 text-xs">
              <span>{ACTION_TRANSLATIONS[item.dataKey] || item.dataKey}</span><b>{item.value}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailModal = ({ detail, onClose }: any) => {
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001391]/25 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#0c6dff]">{detail.eyebrow}</p><h2 className="mt-1 text-xl font-semibold text-[#001391]">{detail.title}</h2></div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2" aria-label="Cerrar detalle"><X size={18} /></button>
        </div>
        <div className="space-y-2">
          {(detail.items || []).map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium text-slate-800">{item.label}</p>{item.sub && <p className="text-xs text-slate-500">{item.sub}</p>}</div>
              <b className="shrink-0 text-[#001391]">{item.value}</b>
            </div>
          ))}
          {!detail.items?.length && <p className="py-8 text-center text-sm text-slate-500">No hay registros para este día.</p>}
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, className = '' }: any) => (
  <Card className={`flex min-h-[390px] flex-col ${className}`}>
    <div className="mb-5"><h2 className="text-lg font-semibold text-[#001391]">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>
    <div className="min-h-[285px] min-w-0 flex-1">{children}</div>
  </Card>
);

export const HomeView: React.FC = () => {
  const { loading, error, data } = useHomeData();
  useRegisterDashboardExport(data);
  const [detail, setDetail] = useState<any>(null);
  const articleLabelWidth = useChartLabelWidth(155, 130, 88);
  const actionLabels = data?.actionKeys?.map((key: string) => ({ key, label: ACTION_TRANSLATIONS[key] || key })) ?? [];

  if (loading) return <div className="grid min-h-[65vh] place-items-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#0c6dff] border-t-transparent" /><p className="mt-4 text-sm text-slate-500">Preparando las métricas del mes…</p></div></div>;
  if (error || !data) return <Card className="mx-auto mt-20 max-w-xl text-center"><h2 className="text-lg font-semibold text-[#001391]">No pudimos cargar el Home</h2><p className="mt-2 text-sm text-slate-500">{error}</p></Card>;

  const clickUsers = (point: any, eyebrow: string) => point && setDetail({
    eyebrow, title: shortDate(point.date),
    items: point.users?.map((user: any) => ({ label: user.phone, sub: `Banca ${user.code}`, value: user.average == null ? '' : seconds(user.average) })),
  });

  const hasInformation =
    data.metrics.activeUsers > 0 ||
    data.metrics.registrations > 0 ||
    data.metrics.interactions > 0 ||
    data.metrics.notificationOpens > 0 ||
    data.articleRanking.length > 0;
  const periodName = data.period.mode === 'year' ? 'este año' : 'este mes';

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-[#001391]">Resumen del {data.period.mode === 'year' ? 'año' : 'mes'}</h1><p className="mt-1 text-sm text-slate-500">Actividad del {shortDate(data.period.from)} al {shortDate(data.period.to)}</p></div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0c6dff]">Datos en vivo · 5 tablas</span>
      </div>

      {!hasInformation ? (
        <Card className="grid min-h-[420px] place-items-center text-center">
          <div className="max-w-sm">
            <CalendarDays className="mx-auto h-11 w-11 text-blue-200" />
            <h2 className="mt-4 text-xl font-semibold text-[#001391]">No hay información de {periodName}</h2>
            <p className="mt-2 text-sm text-slate-500">Selecciona otro mes o un año completo desde el menú superior.</p>
          </div>
        </Card>
      ) : <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Usuarios activos', data.metrics.activeUsers, 'Personas únicas con actividad', Users, '#001391'],
          ['Nuevos registros', data.metrics.registrations, 'Altas durante el periodo', TrendingUp, '#00a86b'],
          ['Interacciones', data.metrics.interactions, 'Acciones dentro de artículos', MousePointerClick, '#0c6dff'],
          ['Duración prom. artículo', seconds(data.metrics.averageArticleDuration), 'Promedio general de lectura', Clock3, '#7a4ce0'],
          ['Artículo más visto', data.metrics.topArticle?.views ?? 0, data.metrics.topArticle?.title ?? 'Sin visualizaciones', BookOpen, '#f8b500'],
          ['Abrieron notificaciones', data.metrics.notificationUsers, `${data.metrics.notificationOpens.toLocaleString('es-MX')} aperturas en el periodo`, BellRing, '#f35b74'],
        ].map(([label, value, caption, Icon, color]: any) => (
          <Card key={label} className="min-h-[150px]">
            <div className="flex items-start justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p><span className="rounded-xl p-2" style={{ background: `${color}12`, color }}><Icon size={18} /></span></div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{typeof value === 'number' ? value.toLocaleString('es-MX') : value}</p>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <ChartCard className="xl:col-span-8 min-h-[470px]" title="Usuarios activos por día" subtitle="Pasa el cursor para ver banca y teléfono; haz clic para abrir el detalle completo.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activeUsersChart} margin={{ top: 12, right: 15, left: -15, bottom: 2 }} onClick={(state: any) => clickUsers(state?.activePayload?.[0]?.payload, 'Usuarios activos')}>
              <defs><linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0c6dff" stopOpacity=".35" /><stop offset="95%" stopColor="#0c6dff" stopOpacity=".02" /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={28} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip content={<TooltipBox kind="users" />} />
              <Area type="monotone" dataKey="value" stroke="#0c6dff" strokeWidth={3} fill="url(#activeUsersGradient)" activeDot={{ r: 6, cursor: 'pointer' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-4 min-h-[470px]" title="Artículos más vistos" subtitle="Ranking completo de menor a mayor número de visualizaciones.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.articleRanking} layout="vertical" margin={{ top: 0, right: 15, left: 8, bottom: 0 }} onClick={(state: any) => {
              const point = state?.activePayload?.[0]?.payload;
              if (point) setDetail({ eyebrow: 'Artículo', title: point.title, items: point.users.map((user: any) => ({ label: user.phone, sub: `Banca ${user.code}`, value: 'Vio el artículo' })) });
            }}>
              <CartesianGrid horizontal={false} stroke="#eef1f6" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" width={articleLabelWidth} tickFormatter={(value) => truncateLabel(value, articleLabelWidth < 100 ? 12 : 23)} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="ranking" />} />
              <Bar dataKey="views" radius={[0, 7, 7, 0]}>{data.articleRanking.map((_: any, i: number) => <Cell key={i} fill={i === data.articleRanking.length - 1 ? '#001391' : '#69a8ff'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-6" title="Tiempo promedio por usuario" subtitle="De quien tuvo el menor promedio de lectura al mayor; clic para ver banca y teléfono.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.userDurationRanking} margin={{ top: 10, right: 10, left: -5, bottom: 5 }} onClick={(state: any) => {
              const user = state?.activePayload?.[0]?.payload;
              if (user) setDetail({ eyebrow: 'Tiempo promedio', title: user.phone, items: [{ label: user.phone, sub: `Banca ${user.code}`, value: seconds(user.average) }] });
            }}>
              <CartesianGrid vertical={false} stroke="#eef1f6" />
              <XAxis dataKey="phone" hide />
              <YAxis tickFormatter={(v) => `${Math.round(v)}s`} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip content={({ active, payload }: any) => active && payload?.length ? <div className="rounded-xl border bg-white p-3 text-xs shadow-xl"><b>{payload[0].payload.phone}</b><p>Banca: {payload[0].payload.code}</p><p>Promedio: {seconds(payload[0].payload.average)}</p></div> : null} />
              <Bar dataKey="average" fill="#7a4ce0" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-6" title="Duración promedio por artículo" subtitle="Comparación de menor a mayor; haz clic para conocer los artículos y sus lectores.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.durationRanking} layout="vertical" margin={{ top: 0, right: 12, left: 10, bottom: 0 }} onClick={(state: any) => {
              const point = state?.activePayload?.[0]?.payload;
              if (point) setDetail({ eyebrow: 'Duración del artículo', title: point.title, items: point.users.map((user: any) => ({ label: user.phone, sub: `Banca ${user.code}`, value: 'Lector' })) });
            }}>
              <CartesianGrid horizontal={false} stroke="#eef1f6" />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v)}s`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" width={articleLabelWidth} tickFormatter={(value) => truncateLabel(value, articleLabelWidth < 100 ? 12 : 23)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="duration" />} />
              <Bar dataKey="average" fill="#2dcccd" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-7" title="Artículo más visto del periodo" subtitle={`${data.metrics.topArticle?.title ?? 'Sin artículo'} · evolución diaria de todas las visualizaciones.`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.articleViewsChart} onClick={(state: any) => {
              const point = state?.activePayload?.[0]?.payload;
              if (point) setDetail({ eyebrow: 'Visualizaciones', title: shortDate(point.date), items: point.articles.map((article: any) => ({ label: article.title, value: `${article.views} vistas` })) });
            }}>
              <defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#001391" stopOpacity=".28" /><stop offset="1" stopColor="#001391" stopOpacity=".01" /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#eef1f6" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={25} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="articles" />} />
              <Area dataKey="value" type="monotone" fill="url(#viewsGradient)" stroke="#001391" strokeWidth={3} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-5" title="Nuevos registros" subtitle="Altas registradas cada día durante el periodo; clic para ver los usuarios.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.registrationsChart} onClick={(state: any) => clickUsers(state?.activePayload?.[0]?.payload, 'Nuevos registros')}>
              <CartesianGrid vertical={false} stroke="#eef1f6" />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={20} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="users" />} />
              <Bar dataKey="value" fill="#00a86b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-12 min-h-[440px]" title="Usuarios que abrieron notificaciones" subtitle="Evolución diaria de usuarios únicos; pasa el cursor o haz clic para ver teléfono y banca.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.notificationOpensChart} margin={{ top: 10, right: 15, left: -10, bottom: 5 }} onClick={(state: any) => clickUsers(state?.activePayload?.[0]?.payload, 'Aperturas de notificaciones')}>
              <defs><linearGradient id="notificationGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f35b74" stopOpacity=".3" /><stop offset="1" stopColor="#f35b74" stopOpacity=".02" /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#eef1f6" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={20} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="notifications" />} />
              <Area dataKey="value" type="monotone" fill="url(#notificationGradient)" stroke="#f35b74" strokeWidth={3} activeDot={{ r: 6, cursor: 'pointer' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard className="xl:col-span-12 min-h-[440px]" title="Interacciones en artículos" subtitle="Evolución diaria por tipo de interacción, presentada completamente en español.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.actionsChart} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
              <CartesianGrid vertical={false} stroke="#eef1f6" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={20} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipBox kind="actions" />} />
              <Legend formatter={(value) => ACTION_TRANSLATIONS[value] || value} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
              {actionLabels.map(({ key }: any, index: number) => <Line key={key} dataKey={key} type="monotone" stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DetailModal detail={detail} onClose={() => setDetail(null)} />
      </>}
    </div>
  );
};
