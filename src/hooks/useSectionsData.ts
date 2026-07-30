import { useEffect, useState } from 'react';
import { api } from '../services/api';

const rows = (response: any): any[] =>
  [response?.data?.data?.items, response?.data?.items, response?.data?.data?.data?.items]
    .find(Array.isArray) ?? [];
const datePart = (value?: string) => value?.slice(0, 10) ?? '';
const identity = (row: any) => String(row.phone || row.reader_id || row.client_session_id || '');
const person = (row: any) => ({ phone: row.phone || 'Sin teléfono', code: row.code || row.code_bbva || 'Sin banca' });

const bounds = (period: string) => {
  const now = new Date();
  const [mode, yearText, monthText] = period.split(':');
  const year = Number(yearText) || now.getFullYear();
  if (mode === 'year') return { from: `${year}-01-01`, to: year === now.getFullYear() ? now.toISOString().slice(0, 10) : `${year}-12-31`, mode };
  const month = Number(monthText);
  const current = year === now.getFullYear() && month === now.getMonth();
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: current ? now.toISOString().slice(0, 10) : `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`,
    mode: 'month',
  };
};

const periodDays = (from: string, to: string) => {
  const result: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) { result.push(cursor.toISOString().slice(0, 10)); cursor.setDate(cursor.getDate() + 1); }
  return result;
};

export const useSectionsData = () => {
  const now = new Date();
  const [period] = useState(() => {
    const fallback = `month:${now.getFullYear()}:${now.getMonth()}`;
    if (typeof window === 'undefined') return fallback;
    return new URLSearchParams(window.location.search).get('period') || window.localStorage.getItem('analytics-selected-period') || fallback;
  });
  const [state, setState] = useState<any>({ loading: true, error: '', data: null });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const range = bounds(period);
        const payload = { date_from: range.from, date_to: range.to, all: true, max_all: 20000 };
        const [sectionsResponse, actionsResponse] = await Promise.all([
          api.post('/analytics/table/sections', payload),
          api.post('/analytics/table/actions', payload),
        ]);
        const sections = rows(sectionsResponse);
        const actions = rows(actionsResponse);

        const sectionNames = new Map<string, string>();
        const viewMap = new Map<string, any>();
        sections.forEach((row) => {
          const id = String(row.section_id || row.nav_key || row.id);
          const name = String(row.section_name || row.nav_key || `Sección ${row.section_id || row.id}`).trim();
          sectionNames.set(id, name);
          const current = viewMap.get(id) ?? { id, name, views: 0, users: new Map() };
          current.views += 1;
          const userId = identity(row);
          if (userId) current.users.set(userId, person(row));
          viewMap.set(id, current);
        });
        const viewRanking = [...viewMap.values()].map((item) => ({
          id: item.id, name: item.name, views: item.views, users: [...item.users.values()],
        })).sort((a, b) => a.views - b.views);

        const interactionMap = new Map<string, any>();
        actions.filter((row) => row.section_id || row.section_name).forEach((row) => {
          const id = String(row.section_id || row.section_name);
          const name = String(row.section_name || sectionNames.get(id) || `Sección ${row.section_id}`).trim();
          const current = interactionMap.get(id) ?? { id, name, interactions: 0, users: new Map() };
          current.interactions += 1;
          const userId = identity(row);
          if (userId) current.users.set(userId, person(row));
          interactionMap.set(id, current);
        });
        const interactionRanking = [...interactionMap.values()].map((item) => ({
          id: item.id, name: item.name, interactions: item.interactions, users: [...item.users.values()],
        })).sort((a, b) => a.interactions - b.interactions);

        const dailyComparison = periodDays(range.from, range.to).map((date) => ({
          date,
          views: sections.filter((row) => datePart(row.entered_at || row.created_at) === date).length,
          interactions: actions.filter((row) => (row.section_id || row.section_name) && datePart(row.occurred_at || row.created_at) === date).length,
        }));

        const trafficMap = new Map<string, number>();
        sections.forEach((row) => {
          const route = [row.nav_key, row.tab_key].filter(Boolean).join(' / ') || 'Sin ruta';
          trafficMap.set(route, (trafficMap.get(route) || 0) + 1);
        });
        const traffic = [...trafficMap].map(([route, views]) => ({ route, views })).sort((a, b) => a.views - b.views);

        if (mounted) setState({
          loading: false, error: '', data: {
            period: range, viewRanking, interactionRanking, dailyComparison, traffic,
            metrics: {
              totalViews: sections.length,
              totalInteractions: interactionRanking.reduce((sum, item) => sum + item.interactions, 0),
              mostViewed: viewRanking.at(-1) ?? null,
              mostInteractive: interactionRanking.at(-1) ?? null,
            },
          },
        });
      } catch (error: any) {
        if (mounted) setState({ loading: false, data: null, error: error?.response?.data?.message || error?.message || 'No se pudieron cargar las secciones.' });
      }
    };
    load();
    return () => { mounted = false; };
  }, [period]);
  return state;
};
