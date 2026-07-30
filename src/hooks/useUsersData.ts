import { useEffect, useState } from 'react';
import { api } from '../services/api';

const rows = (response: any): any[] =>
  [response?.data?.data?.items, response?.data?.items, response?.data?.data?.data?.items]
    .find(Array.isArray) ?? [];
const num = (value: unknown) => Number(value) || 0;
const datePart = (value?: string) => value?.slice(0, 10) ?? '';
const identity = (row: any) => String(row.phone || row.reader_id || row.client_session_id || '');
const user = (row: any) => ({ phone: row.phone || 'Sin teléfono', code: row.code || row.code_bbva || 'Sin banca' });

const bounds = (period: string) => {
  const now = new Date();
  const [mode, yearText, monthText] = period.split(':');
  const year = Number(yearText) || now.getFullYear();
  if (mode === 'year') return {
    from: `${year}-01-01`,
    to: year === now.getFullYear() ? now.toISOString().slice(0, 10) : `${year}-12-31`,
    mode,
  };
  const month = Number(monthText);
  const current = year === now.getFullYear() && month === now.getMonth();
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: current ? now.toISOString().slice(0, 10) : `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`,
    mode: 'month',
  };
};

const daysBetween = (from: string, to: string) => {
  const days: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

export const useUsersData = () => {
  const now = new Date();
  const [period] = useState(() => {
    const fallback = `month:${now.getFullYear()}:${now.getMonth()}`;
    if (typeof window === 'undefined') return fallback;
    return new URLSearchParams(window.location.search).get('period')
      || window.localStorage.getItem('analytics-selected-period')
      || fallback;
  });
  const [state, setState] = useState<any>({ loading: true, error: '', data: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setState((current: any) => ({ ...current, loading: true, error: '' }));
        const periodBounds = bounds(period);
        const payload = { date_from: periodBounds.from, date_to: periodBounds.to, all: true, max_all: 20000 };
        const [sectionsResponse, articlesResponse, registrationsResponse, actionsResponse] = await Promise.all([
          api.post('/analytics/table/sections', payload),
          api.post('/analytics/table/articles', payload),
          api.post('/analytics/table/registrations', payload),
          api.post('/analytics/table/actions', payload),
        ]);
        const sections = rows(sectionsResponse);
        const articles = rows(articlesResponse);
        const registrations = rows(registrationsResponse);
        const actions = rows(actionsResponse);
        const days = daysBetween(periodBounds.from, periodBounds.to);

        const dailyRegistrations = days.map((date) => {
          const records = registrations.filter((row) => datePart(row.registered_at || row.created_at) === date);
          return { date, value: records.length, users: records.map(user) };
        });

        const activity = [...sections, ...articles, ...actions];
        const allUsers = new Map<string, any>();
        const dailyActive = days.map((date) => {
          const unique = new Map<string, any>();
          activity.filter((row) => datePart(row.entered_at || row.occurred_at || row.created_at) === date)
            .forEach((row) => {
              const id = identity(row);
              if (id) { unique.set(id, user(row)); allUsers.set(id, user(row)); }
            });
          return { date, value: unique.size, users: [...unique.values()] };
        });

        const sectionMap = new Map<string, any>();
        sections.forEach((row) => {
          const name = row.section_name || row.nav_key || `Sección ${row.section_id || row.id}`;
          const current = sectionMap.get(name) ?? { name, views: 0, duration: 0, users: new Map() };
          current.views += 1;
          current.duration += num(row.duration_seconds);
          const id = identity(row);
          if (id) current.users.set(id, user(row));
          sectionMap.set(name, current);
        });
        const sectionRanking = [...sectionMap.values()].map((item) => ({
          name: item.name, views: item.views,
          average: item.views ? Math.round(item.duration / item.views) : 0,
          users: [...item.users.values()],
        })).sort((a, b) => a.views - b.views);

        const articleUserMap = new Map<string, any>();
        const articleMap = new Map<string, number>();
        articles.forEach((row) => {
          const id = identity(row);
          if (id) {
            const current = articleUserMap.get(id) ?? { ...user(row), views: 0, duration: 0 };
            current.views += 1;
            current.duration += num(row.duration_seconds);
            articleUserMap.set(id, current);
          }
          const title = row.article_title || `Artículo ${row.detail_id || row.id}`;
          articleMap.set(title, (articleMap.get(title) ?? 0) + 1);
        });
        const articleUsers = [...articleUserMap.values()].map((item) => ({
          ...item, average: item.views ? Math.round(item.duration / item.views) : 0,
        })).sort((a, b) => a.views - b.views);

        const bankMap = new Map<string, { code: string; events: number; users: Set<string> }>();
        activity.forEach((row) => {
          const code = row.code || row.code_bbva || 'Sin banca';
          const current = bankMap.get(code) ?? { code, events: 0, users: new Set() };
          current.events += 1;
          const id = identity(row);
          if (id) current.users.add(id);
          bankMap.set(code, current);
        });
        const banks = [...bankMap.values()].map((item) => ({
          code: item.code, events: item.events, users: item.users.size,
        })).sort((a, b) => a.events - b.events);

        const interactionUsersMap = new Map<string, any>();
        actions.forEach((row) => {
          const id = identity(row);
          if (!id) return;
          const current = interactionUsersMap.get(id) ?? { ...user(row), interactions: 0 };
          current.interactions += 1;
          interactionUsersMap.set(id, current);
        });
        const interactionUsers = [...interactionUsersMap.values()]
          .sort((a, b) => a.interactions - b.interactions);

        const activityMap = [
          ...sectionRanking.map((item) => ({ name: item.name, value: item.views, type: 'Sección' })),
          ...[...articleMap].map(([name, value]) => ({ name, value, type: 'Artículo' })),
        ].sort((a, b) => b.value - a.value).slice(0, 12);

        const avgSection = sections.length ? Math.round(sections.reduce((sum, row) => sum + num(row.duration_seconds), 0) / sections.length) : 0;
        const avgArticle = articles.length ? Math.round(articles.reduce((sum, row) => sum + num(row.duration_seconds), 0) / articles.length) : 0;

        if (mounted) setState({
          loading: false, error: '', data: {
            period: periodBounds,
            metrics: { registrations: registrations.length, activeUsers: allUsers.size, avgSection, avgArticle },
            dailyRegistrations, dailyActive, sectionRanking, articleUsers, interactionUsers, banks, activityMap,
          },
        });
      } catch (error: any) {
        if (mounted) setState({ loading: false, data: null, error: error?.response?.data?.message || error?.message || 'No se pudieron cargar los usuarios.' });
      }
    };
    load();
    return () => { mounted = false; };
  }, [period]);

  return state;
};
