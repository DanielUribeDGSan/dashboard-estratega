import { api } from '@/services/api';

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

const responseRows = (response: any): any[] => [
  response?.data?.data?.items,
  response?.data?.items,
  response?.data?.data?.data?.items,
  response?.data?.records?.items,
].find(Array.isArray) ?? [];

const csvCell = (value: unknown) => {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadAnalyticsCsv = async () => {
  const { from, to } = periodBounds(selectedPeriod());
  const payload = { date_from: from, date_to: to, all: true, max_all: 20000 };
  const tableNames = ['sections', 'articles', 'registrations', 'actions'] as const;
  const responses = await Promise.all(
    tableNames.map((table) => api.post(`/analytics/table/${table}`, payload)),
  );
  const records = responses.flatMap((response, index) =>
    responseRows(response).map((row) => ({ tabla: tableNames[index], ...row })),
  );
  const columns = [...new Set(records.flatMap((row) => Object.keys(row)))];
  const csv = [
    columns.map(csvCell).join(','),
    ...records.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
  ].join('\r\n');
  downloadBlob(
    new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    `datos-analytics-${filePeriod()}.csv`,
  );
};

export const downloadDashboardPdf = async (pageName: string) => {
  const target = document.querySelector<HTMLElement>('[data-dashboard-export]');
  if (!target) throw new Error('No se encontró el contenido del dashboard');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(target, {
    backgroundColor: '#f7f8fa',
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
    windowWidth: Math.max(target.scrollWidth, 1280),
    width: target.scrollWidth,
    height: target.scrollHeight,
  });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  const image = canvas.toDataURL('image/jpeg', 0.92);

  for (let offset = 0, page = 0; offset < imageHeight; offset += pageHeight, page += 1) {
    if (page > 0) pdf.addPage('a4', 'landscape');
    pdf.addImage(image, 'JPEG', 0, -offset, pageWidth, imageHeight, undefined, 'FAST');
  }
  pdf.save(`dashboard-${pageName}-${filePeriod()}.pdf`);
};
