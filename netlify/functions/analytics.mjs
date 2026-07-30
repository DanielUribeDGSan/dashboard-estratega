const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

export default async (request) => {
  if (!['GET', 'POST'].includes(request.method)) {
    return json(405, { message: 'Método no permitido' });
  }

  const baseUrl = process.env.ANALYTICS_API_BASE_URL;
  const token = process.env.ANALYTICS_BEARER_TOKEN;
  if (!baseUrl || !token) {
    return json(500, { message: 'Faltan variables de analítica en Netlify' });
  }

  const incomingUrl = new URL(request.url);
  const functionPrefix = '/.netlify/functions/analytics';
  const endpoint = incomingUrl.pathname.startsWith(functionPrefix)
    ? incomingUrl.pathname.slice(functionPrefix.length)
    : incomingUrl.pathname;
  const upstreamUrl = new URL(`${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`);
  upstreamUrl.search = incomingUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': request.headers.get('content-type') || 'application/json',
        Accept: 'application/json',
      },
      body: request.method === 'POST' ? await request.text() : undefined,
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return json(502, { message: 'No fue posible conectar con el servicio de analítica' });
  }
};
