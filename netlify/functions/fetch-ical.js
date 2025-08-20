export async function handler(event) {
  const qs = event.queryStringParameters || {};
  if (qs.ping) return { statusCode: 200, body: 'pong' };
  const url = qs.url;
  if (!url) return { statusCode: 400, body: 'Missing url parameter' };
  try {
    const res = await fetch(url);
    if (!res.ok) return { statusCode: res.status, body: 'Error fetching iCal' };
    const text = await res.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: text
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
}