import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const ACTION_TRANSLATIONS: Record<string, string> = {
  pdf_download: 'Descarga de PDF',
  pdf_preview: 'Vista previa de PDF',
  contact_phone: 'Llamada a teléfono fijo',
  contact_mobile: 'Contacto por móvil / WhatsApp',
  contact_email: 'Contacto por correo',
  video_play: 'Reproducción de video',
  audio_play: 'Reproducción de audio',
  share: 'Contenido compartido',
};

export type Person = { phone: string; code: string; average?: number };
export type ArticleDetail = { title: string; views: number; average: number };

const rows = (response: any): any[] => {
  const body = response?.data;
  const candidates = [
    body?.data?.items,
    body?.items,
    body?.data?.data?.items,
    body?.records?.items,
  ];
  return candidates.find(Array.isArray) ?? [];
};

const datePart = (value?: string) => value?.slice(0, 10) ?? '';
const number = (value: unknown) => Number(value) || 0;
const identity = (row: any) => String(row.phone || row.reader_id || row.client_session_id || '');
const person = (row: any): Person => ({
  phone: row.phone || 'Sin teléfono',
  code: row.code || row.code_bbva || 'Sin banca',
});

const monthDays = (from: string, to: string) => {
  const result: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const boundsForPeriod = (period: string) => {
  const now = new Date();
  const [mode, yearValue, monthValue] = period.split(':');
  const year = Number(yearValue);
  if (mode === 'year' && Number.isInteger(year)) {
    const isCurrentYear = year === now.getFullYear();
    return {
      dateFrom: `${year}-01-01`,
      dateTo: isCurrentYear ? now.toISOString().slice(0, 10) : `${year}-12-31`,
      mode: 'year',
    };
  }
  const month = Number(monthValue);
  const safeYear = Number.isInteger(year) ? year : now.getFullYear();
  const safeMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month : now.getMonth();
  const isCurrentMonth = safeYear === now.getFullYear() && safeMonth === now.getMonth();
  const dateFrom = `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-01`;
  const dateTo = isCurrentMonth
    ? now.toISOString().slice(0, 10)
    : `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}-${String(new Date(safeYear, safeMonth + 1, 0).getDate()).padStart(2, '0')}`;
  return { dateFrom, dateTo, mode: 'month' };
};

export const useHomeData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const now = new Date();
  const [period] = useState(() => {
    const fallback = `month:${now.getFullYear()}:${now.getMonth()}`;
    if (typeof window === 'undefined') return fallback;
    return new URLSearchParams(window.location.search).get('period') || fallback;
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { dateFrom, dateTo, mode } = boundsForPeriod(period);
        const payload = { date_from: dateFrom, date_to: dateTo, all: true, max_all: 20000 };

        const [sectionsResponse, articlesResponse, registrationsResponse, actionsResponse] =
          await Promise.all([
            api.post('/analytics/table/sections', payload),
            api.post('/analytics/table/articles', payload),
            api.post('/analytics/table/registrations', payload),
            api.post('/analytics/table/actions', payload),
          ]);

        const sections = rows(sectionsResponse);
        const articles = rows(articlesResponse);
        const registrations = rows(registrationsResponse);
        const actions = rows(actionsResponse);
        const days = monthDays(dateFrom, dateTo);

        // Un usuario se considera activo si aparece en cualquier actividad del mes.
        const activityRows = [...sections, ...articles, ...actions];
        const activeIdentities = new Map<string, Person>();
        const activeByDay = new Map<string, Map<string, Person>>();
        activityRows.forEach((row) => {
          const id = identity(row);
          const day = datePart(row.entered_at || row.occurred_at || row.created_at);
          if (!id || !day) return;
          activeIdentities.set(id, person(row));
          if (!activeByDay.has(day)) activeByDay.set(day, new Map());
          activeByDay.get(day)!.set(id, person(row));
        });

        const activeUsersChart = days.map((date) => {
          const users = [...(activeByDay.get(date)?.values() ?? [])];
          return { date, value: users.length, users };
        });

        const registrationsByDay = new Map<string, Person[]>();
        registrations.forEach((row) => {
          const day = datePart(row.registered_at || row.created_at);
          if (!day) return;
          registrationsByDay.set(day, [...(registrationsByDay.get(day) ?? []), person(row)]);
        });
        const registrationsChart = days.map((date) => ({
          date,
          value: registrationsByDay.get(date)?.length ?? 0,
          users: registrationsByDay.get(date) ?? [],
        }));

        const articleStats = new Map<string, {
          title: string; views: number; duration: number; users: Map<string, Person>;
        }>();
        const articleViewsByDay = new Map<string, any[]>();
        articles.forEach((row) => {
          const id = String(row.detail_id || row.article_title || row.id);
          const title = row.article_title || `Artículo ${row.detail_id || row.id}`;
          if (!articleStats.has(id)) {
            articleStats.set(id, { title, views: 0, duration: 0, users: new Map() });
          }
          const stat = articleStats.get(id)!;
          stat.views += 1;
          stat.duration += number(row.duration_seconds);
          const userId = identity(row);
          if (userId) stat.users.set(userId, person(row));
          const day = datePart(row.entered_at || row.created_at);
          if (day) articleViewsByDay.set(day, [...(articleViewsByDay.get(day) ?? []), row]);
        });

        const articleRanking = [...articleStats.values()]
          .map((stat) => ({
            title: stat.title,
            views: stat.views,
            average: stat.views ? stat.duration / stat.views : 0,
            users: [...stat.users.values()],
          }))
          .sort((a, b) => a.views - b.views);

        const articleViewsChart = days.map((date) => {
          const dayRows = articleViewsByDay.get(date) ?? [];
          const articlesMap = new Map<string, number>();
          dayRows.forEach((row) => {
            const title = row.article_title || `Artículo ${row.detail_id || row.id}`;
            articlesMap.set(title, (articlesMap.get(title) ?? 0) + 1);
          });
          return {
            date,
            value: dayRows.length,
            articles: [...articlesMap].map(([title, views]) => ({ title, views })),
          };
        });

        const durationRanking = [...articleRanking].sort((a, b) => a.average - b.average);
        const userDurationMap = new Map<string, { duration: number; views: number; user: Person }>();
        articles.forEach((row) => {
          const id = identity(row);
          if (!id) return;
          const current = userDurationMap.get(id) ?? { duration: 0, views: 0, user: person(row) };
          current.duration += number(row.duration_seconds);
          current.views += 1;
          userDurationMap.set(id, current);
        });
        const userDurationRanking = [...userDurationMap.values()]
          .map(({ duration, views, user }) => ({ ...user, average: views ? duration / views : 0 }))
          .sort((a, b) => a.average - b.average);

        const actionKeys = [...new Set(actions.map((row) => row.action_type).filter(Boolean))];
        const actionsChart = days.map((date) => {
          const dayRows = actions.filter((row) => datePart(row.occurred_at || row.created_at) === date);
          const point: any = { date, value: dayRows.length, actions: dayRows };
          actionKeys.forEach((key) => {
            point[key] = dayRows.filter((row) => row.action_type === key).length;
          });
          return point;
        });

        const totalArticleDuration = articles.reduce((sum, row) => sum + number(row.duration_seconds), 0);
        if (mounted) {
          setData({
            period: { from: dateFrom, to: dateTo, mode },
            metrics: {
              activeUsers: activeIdentities.size,
              registrations: registrations.length,
              interactions: actions.length,
              averageArticleDuration: articles.length ? totalArticleDuration / articles.length : 0,
              topArticle: articleRanking.at(-1) ?? null,
            },
            activeUsersChart,
            registrationsChart,
            articleViewsChart,
            articleRanking,
            durationRanking,
            userDurationRanking,
            actionsChart,
            actionKeys,
          });
          setError('');
        }
      } catch (requestError: any) {
        if (mounted) setError(requestError?.response?.data?.message || requestError?.message || 'No fue posible cargar la analítica.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [period]);

  return { loading, error, data };
};
