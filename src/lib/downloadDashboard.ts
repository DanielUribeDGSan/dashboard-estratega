import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const periodBounds = (period: string) => {
  const now = new Date();
  const [mode, yearText, monthText] = period.split(':');
  const year = Number(yearText) || now.getFullYear();

  if (mode === 'year') {
    return {
      from: `${year}-01-01`,
      to: year === now.getFullYear() ? now.toISOString().slice(0, 10) : `${year}-12-31`,
    };
  }

  const parsedMonth = Number(monthText);
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11
    ? parsedMonth
    : now.getMonth();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: isCurrent
      ? now.toISOString().slice(0, 10)
      : `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`,
  };
};

const selectedPeriod = () => {
  const now = new Date();
  return new URLSearchParams(window.location.search).get('period')
    || `month:${now.getFullYear()}:${now.getMonth()}`;
};

const filePeriod = () => {
  const { from, to } = periodBounds(selectedPeriod());
  return `${from}_${to}`;
};

type SheetDefinition = { key: string; name: string; fields?: Record<string, string> };

const SHEETS_BY_PAGE: Record<string, SheetDefinition[]> = {
  home: [
    { key: 'activeUsersChart', name: 'Usuarios activos', fields: { date: 'Fecha', value: 'Usuarios activos', users: 'Usuarios' } },
    { key: 'articleRanking', name: 'Artículos más vistos', fields: { title: 'Artículo', views: 'Visualizaciones', average: 'Promedio segundos', users: 'Usuarios' } },
    { key: 'userDurationRanking', name: 'Promedio por usuario', fields: { phone: 'Teléfono', code: 'Banca', average: 'Promedio segundos' } },
    { key: 'durationRanking', name: 'Promedio por artículo', fields: { title: 'Artículo', average: 'Promedio segundos', views: 'Visualizaciones', users: 'Usuarios' } },
    { key: 'articleViewsChart', name: 'Artículo más visto', fields: { date: 'Fecha', value: 'Visualizaciones', articles: 'Artículos' } },
    { key: 'registrationsChart', name: 'Nuevos registros', fields: { date: 'Fecha', value: 'Registros', users: 'Usuarios' } },
    { key: 'actionsChart', name: 'Interacciones artículos' },
    { key: 'notificationOpensChart', name: 'Aperturas notificaciones', fields: { date: 'Fecha', value: 'Usuarios únicos', opens: 'Aperturas', users: 'Usuarios' } },
    { key: 'notificationRanking', name: 'Notificaciones por artículo', fields: { title: 'Artículo o notificación', opens: 'Aperturas', users: 'Usuarios', detailId: 'ID artículo', notificationId: 'ID notificación' } },
  ],
  usuarios: [
    { key: 'dailyRegistrations', name: 'Nuevos usuarios', fields: { date: 'Fecha', value: 'Registros', users: 'Usuarios' } },
    { key: 'dailyActive', name: 'Usuarios activos', fields: { date: 'Fecha', value: 'Usuarios activos', users: 'Usuarios' } },
    { key: 'dailyPlatforms', name: 'Android vs iOS', fields: { date: 'Fecha', android: 'Android', ios: 'iOS' } },
    { key: 'sectionRanking', name: 'Secciones más vistas', fields: { name: 'Sección', views: 'Visitas', users: 'Usuarios' } },
    { key: 'sectionRanking', name: 'Promedio por sección', fields: { name: 'Sección', average: 'Promedio segundos', users: 'Usuarios' } },
    { key: 'articleUsers', name: 'Usuarios con lecturas', fields: { phone: 'Teléfono', code: 'Banca', views: 'Artículos vistos' } },
    { key: 'interactionUsers', name: 'Más interacciones', fields: { phone: 'Teléfono', code: 'Banca', interactions: 'Interacciones' } },
    { key: 'banks', name: 'Banca más activa', fields: { code: 'Banca', events: 'Eventos', users: 'Usuarios únicos' } },
    { key: 'activityMap', name: 'Mapa de actividad', fields: { name: 'Contenido', type: 'Tipo', value: 'Movimientos' } },
    { key: 'dailyNotificationOpens', name: 'Aperturas notificaciones', fields: { date: 'Fecha', value: 'Usuarios únicos', opens: 'Aperturas', users: 'Usuarios' } },
    { key: 'notificationUsers', name: 'Usuarios notificaciones', fields: { phone: 'Teléfono', code: 'Banca', opens: 'Aperturas' } },
    { key: 'notificationRanking', name: 'Notificaciones por artículo', fields: { name: 'Artículo o notificación', opens: 'Aperturas', users: 'Usuarios', detailId: 'ID artículo', notificationId: 'ID notificación' } },
  ],
  articulos: [
    { key: 'viewRanking', name: 'Artículos más vistos', fields: { title: 'Artículo', views: 'Visualizaciones', users: 'Usuarios' } },
    { key: 'interactionRanking', name: 'Interacciones artículo', fields: { title: 'Artículo', interactions: 'Interacciones', users: 'Usuarios' } },
    { key: 'dailyComparison', name: 'Interacciones vs vistas', fields: { date: 'Fecha', views: 'Visualizaciones', interactions: 'Interacciones' } },
    { key: 'traffic', name: 'Tráfico en artículos', fields: { source: 'Origen', views: 'Visualizaciones' } },
  ],
  secciones: [
    { key: 'viewRanking', name: 'Secciones más vistas', fields: { name: 'Sección', views: 'Visualizaciones', users: 'Usuarios' } },
    { key: 'interactionRanking', name: 'Interacciones sección', fields: { name: 'Sección', interactions: 'Interacciones', users: 'Usuarios' } },
    { key: 'dailyComparison', name: 'Interacciones vs visitas', fields: { date: 'Fecha', views: 'Visitas', interactions: 'Interacciones' } },
    { key: 'traffic', name: 'Tráfico en secciones', fields: { route: 'Ruta', views: 'Visitas' } },
  ],
};

const readableValue = (value: unknown): string | number | boolean => {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item !== 'object' || item == null) return String(item);
      if ('phone' in item || 'code' in item) return `${item.phone || 'Sin teléfono'} (${item.code || 'Sin banca'})`;
      if ('title' in item) return `${item.title}${item.views == null ? '' : ` (${item.views})`}`;
      return Object.values(item).join(' · ');
    }).join('; ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return `'${value}`;
  return value;
};

const rowsForSheet = (rows: any[], fields?: Record<string, string>) => rows.map((row) => {
  const entries = fields
    ? Object.entries(fields).map(([field, label]) => [label, readableValue(row[field])])
    : Object.entries(row)
      .filter(([field]) => field !== 'actions' && field !== 'users' && field !== 'articles')
      .map(([field, value]) => [field, readableValue(value)]);
  return Object.fromEntries(entries);
});

export const downloadAnalyticsWorkbook = async (pageName: string, data: any) => {
  if (!data) throw new Error('Los datos todavía no están disponibles');
  const workbook = XLSX.utils.book_new();
  const definitions = SHEETS_BY_PAGE[pageName] ?? [];

  definitions.forEach((definition) => {
    const sourceRows = Array.isArray(data[definition.key]) ? data[definition.key] : [];
    const rows = rowsForSheet(sourceRows, definition.fields);
    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Información: 'No hay datos para este periodo' }]);
    const headers = rows.length ? Object.keys(rows[0]) : ['Información'];
    worksheet['!cols'] = headers.map((header) => ({
      wch: Math.min(55, Math.max(header.length + 2, ...rows.slice(0, 200).map((row) => String(row[header] ?? '').length + 2))),
    }));
    if (rows.length) worksheet['!autofilter'] = { ref: worksheet['!ref']! };
    XLSX.utils.book_append_sheet(workbook, worksheet, definition.name.slice(0, 31));
  });

  if (workbook.SheetNames.length === 0) throw new Error('No hay tablas disponibles para exportar');
  XLSX.writeFile(workbook, `datos-${pageName}-${filePeriod()}.xlsx`, { compression: true });
};

export const downloadDashboardPdf = async (pageName: string) => {
  const target = document.querySelector<HTMLElement>('[data-dashboard-export]');
  if (!target) throw new Error('No se encontró el contenido del dashboard');

  await document.fonts?.ready;
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  const captureRect = target.getBoundingClientRect();
  const captureWidth = captureRect.width;
  const captureHeight = target.scrollHeight;
  const canvas = await html2canvas(target, {
    backgroundColor: '#f7f8fa',
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
    onclone: (clonedDocument) => {
      const exportRoot = clonedDocument.querySelector<HTMLElement>('[data-dashboard-export]');
      if (exportRoot) {
        exportRoot.style.backgroundColor = '#f7f8fa';
        exportRoot.style.overflow = 'visible';
        exportRoot.querySelectorAll<HTMLElement>('*').forEach((element) => {
          element.style.animation = 'none';
          element.style.transition = 'none';
        });
        exportRoot.querySelectorAll<HTMLElement>('[data-export-block]').forEach((card) => {
          card.style.background = '#ffffff';
          card.style.backgroundColor = '#ffffff';
          card.style.borderColor = '#e5e7eb';
          card.style.boxShadow = 'none';
          card.style.opacity = '1';
        });
      }
      clonedDocument.querySelectorAll<HTMLElement>('[data-dashboard-export] h1').forEach((heading) => {
        heading.style.whiteSpace = 'nowrap';
        heading.style.lineHeight = '1.25';
      });
    },
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const maxSliceCssHeight = (captureWidth * usableHeight) / usableWidth;
  const targetRect = target.getBoundingClientRect();
  const blocks = [...target.querySelectorAll<HTMLElement>('[data-export-block]')].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: Math.max(0, rect.top - targetRect.top),
      bottom: Math.min(captureHeight, rect.bottom - targetRect.top),
    };
  });
  const slices: Array<{ start: number; end: number }> = [];
  let start = 0;

  while (start < captureHeight - 1) {
    const desiredEnd = Math.min(start + maxSliceCssHeight, captureHeight);
    if (desiredEnd >= captureHeight) {
      slices.push({ start, end: captureHeight });
      break;
    }
    const crossingBlocks = blocks.filter((block) => block.top < desiredEnd && block.bottom > desiredEnd);
    const safeEnd = crossingBlocks.length ? Math.min(...crossingBlocks.map((block) => block.top)) - 10 : desiredEnd;
    const end = safeEnd > start + 180 ? safeEnd : desiredEnd;
    slices.push({ start, end });
    start = end;
  }

  if (slices.length === 0) throw new Error('El dashboard no tiene contenido para exportar');

  const pixelRatio = canvas.width / captureWidth;
  slices.forEach((slice, page) => {
    const sourceY = Math.max(0, Math.round(slice.start * pixelRatio));
    const sourceHeight = Math.min(canvas.height - sourceY, Math.ceil((slice.end - slice.start) * pixelRatio));
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const context = pageCanvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar una página del PDF');
    context.fillStyle = '#f7f8fa';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
    const renderedHeight = (sourceHeight * usableWidth) / pageCanvas.width;
    if (page > 0) pdf.addPage('a4', 'landscape');
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, usableWidth, renderedHeight, undefined, 'FAST');
  });
  pdf.save(`dashboard-${pageName}-${filePeriod()}.pdf`);
};
