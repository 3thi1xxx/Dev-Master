import fetch from 'node-fetch';

export async function relayDispatch(path, body) {
  const url = `http://localhost:3055${path}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Relay-Key': process.env.RELAY_KEY || 'chad-relay-2025'
    },
    body: JSON.stringify(body)
  });
  const ok = resp.status >= 200 && resp.status < 300;
  return { ok, status: resp.status, json: ok ? await resp.json() : await resp.text() };
} 