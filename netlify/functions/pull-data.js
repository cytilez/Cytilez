export async function handler() {
  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_OWNER = process.env.GH_OWNER || 'YOUR_GH_USERNAME';
  const GH_REPO  = process.env.GH_REPO  || 'kaelbnb-data';
  const GH_PATH  = process.env.GH_PATH  || 'data/state.json';
  const BRANCH   = process.env.GH_BRANCH || 'main';

  if (!GH_TOKEN) return { statusCode: 500, body: 'Missing GH_TOKEN' };

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    return { statusCode: res.status, body: 'Not found or unauthorized' };
  }
  const j = await res.json();
  const json = Buffer.from(j.content, 'base64').toString('utf-8');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*' },
    body: json
  };
}