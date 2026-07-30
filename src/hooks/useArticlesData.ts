import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const ARTICLE_ACTION_LABELS: Record<string, string> = {
  pdf_download: 'Descarga de PDF',
  pdf_preview: 'Vista previa de PDF',
  contact_phone: 'Llamada a teléfono fijo',
  contact_mobile: 'Contacto móvil / WhatsApp',
  contact_email: 'Contacto por correo',
  video_play: 'Reproducción de video',
  audio_play: 'Reproducción de audio',
  share: 'Contenido compartido',
};

const rows = (response: any): any[] =>
  [response?.data?.data?.items, response?.data?.items, response?.data?.data?.data?.items]
    .find(Array.isArray) ?? [];
const datePart = (value?: string) => value?.slice(0, 10) ?? '';
const person = (row: any) => ({ phone: row.phone || 'Sin teléfono', code: row.code || row.code_bbva || 'Sin banca' });
const identity = (row: any) => String(row.phone || row.reader_id || row.client_session_id || '');

const periodBounds = (period: string) => {
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

const days = (from: string, to: string) => {
  const result: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

export const useArticlesData = () => {
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
        const bounds = periodBounds(period);
        const payload = { date_from: bounds.from, date_to: bounds.to, all: true, max_all: 20000 };
        const [articlesResponse, actionsResponse] = await Promise.all([
          api.post('/analytics/table/articles', payload),
          api.post('/analytics/table/actions', payload),
        ]);
        const articles = rows(articlesResponse);
        const actions = rows(actionsResponse);

        const articleMap = new Map<string, any>();
        articles.forEach((row) => {
          const key = String(row.detail_id || row.article_title || row.id);
          const current = articleMap.get(key) ?? {
            id: key,
            title: row.article_title || `Artículo ${row.detail_id || row.id}`,
            views: 0,
            users: new Map(),
          };
          current.views += 1;
          const userId = identity(row);
          if (userId) current.users.set(userId, person(row));
          articleMap.set(key, current);
        });
        const viewRanking = [...articleMap.values()].map((item) => ({
          id: item.id, title: item.title, views: item.views, users: [...item.users.values()],
        })).sort((a, b) => a.views - b.views);

        const actionMap = new Map<string, any>();
        actions.forEach((row) => {
          const key = String(row.detail_id || row.article_title || 'sin-articulo');
          const current = actionMap.get(key) ?? {
            id: key,
            title: row.article_title || (row.detail_id ? `Artículo ${row.detail_id}` : 'Sin artículo relacionado'),
            interactions: 0,
            users: new Map(),
            types: {},
          };
          current.interactions += 1;
          current.types[row.action_type] = (current.types[row.action_type] || 0) + 1;
          const userId = identity(row);
          if (userId) current.users.set(userId, person(row));
          actionMap.set(key, current);
        });
        const interactionRanking = [...actionMap.values()].map((item) => ({
          id: item.id, title: item.title, interactions: item.interactions,
          users: [...item.users.values()], types: item.types,
        })).sort((a, b) => a.interactions - b.interactions);

        const dailyComparison = days(bounds.from, bounds.to).map((date) => ({
          date,
          views: articles.filter((row) => datePart(row.entered_at || row.created_at) === date).length,
          interactions: actions.filter((row) => datePart(row.occurred_at || row.created_at) === date).length,
        }));

        const sourceMap = new Map<string, number>();
        articles.forEach((row) => {
          const source = String(row.source || 'Sin origen');
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
        });
        const traffic = [...sourceMap].map(([source, views]) => ({ source, views }))
          .sort((a, b) => a.views - b.views);

        if (mounted) setState({
          loading: false, error: '', data: {
            period: bounds, viewRanking, interactionRanking, dailyComparison, traffic,
            metrics: {
              totalViews: articles.length,
              totalInteractions: actions.length,
              mostViewed: viewRanking.at(-1) ?? null,
              mostInteractive: interactionRanking.at(-1) ?? null,
            },
          },
        });
      } catch (error: any) {
        if (mounted) setState({ loading: false, data: null, error: error?.response?.data?.message || error?.message || 'No se pudieron cargar los artículos.' });
      }
    };
    load();
    return () => { mounted = false; };
  }, [period]);

  return state;
};
