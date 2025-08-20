export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_OWNER = process.env.GH_OWNER || 'YOUR_GH_USERNAME';
  const GH_REPO  = process.env.GH_REPO  || 'kaelbnb-data';
  const GH_PATH  = process.env.GH_PATH  || 'data/state.json';
  const BRANCH   = process.env.GH_BRANCH || 'main';

  if (!GH_TOKEN) return { statusCode: 500, body: 'Missing GH_TOKEN' };

  const state = event.body || '{}';
  const contentB64 = Buffer.from(state, 'utf-8').toString('base64');

  const base = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}?ref=${BRANCH}`;
  const headers = {
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  let sha = undefined;
  const getRes = await fetch(base, { headers });
  if (getRes.ok) {
    const j = await getRes.json();
    sha = j.sha;
  }

  const putRes = await fetch(base, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'KaelBnB backup',
      content: contentB64,
      sha,
      branch: BRANCH
    })
  });

  if (!putRes.ok) {
    const txt = await putRes.text();
    return { statusCode: putRes.status, body: `GitHub PUT failed: ${txt}` };
  }
  return { statusCode: 200, body: 'OK' };
}