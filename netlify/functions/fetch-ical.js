export async function handler(event) {
  const url = event.queryStringParameters.url;
  if (event.queryStringParameters.ping) {
    return { statusCode: 200, body: "pong" };
  }
  if (!url) return { statusCode: 400, body: 'Missing url' };

  try {
    const res = await fetch(url);
    const text = await res.text();
    return { statusCode: 200, body: text };
  } catch (e) {
    return { statusCode: 500, body: 'Error fetching: '+e.message };
  }
}