/* Cloudflare Worker starter for a server-side Kick API proxy.
 * Configure secrets: KICK_CLIENT_ID and KICK_CLIENT_SECRET.
 * Configure vars: KICK_CHANNEL_SLUG=macseky and ALLOWED_ORIGIN=https://albetar25-a11y.github.io
 * Keep credentials in Worker secrets; never put them in HTML/JS.
 * Verify current Kick scopes and endpoint schemas in https://docs.kick.com before deployment.
 */
let tokenCache = { token: null, expiresAt: 0 };
const json = (body, status = 200, origin = '*') => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, OPTIONS', 'cache-control': 'no-store', 'vary': 'Origin' } });
async function getToken(env) {
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.token;
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.KICK_CLIENT_ID, client_secret: env.KICK_CLIENT_SECRET });
  const response = await fetch('https://id.kick.com/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  if (!response.ok) throw new Error(`Kick OAuth returned ${response.status}`);
  const data = await response.json();
  if (!data.access_token) throw new Error('Kick OAuth response did not include access_token');
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return tokenCache.token;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    if (allowed !== '*' && origin && origin !== allowed) return json({ error: 'origin_not_allowed' }, 403, allowed);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': allowed, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, allowed);
    const url = new URL(request.url);
    if (url.pathname !== '/api/stats') return json({ error: 'not_found' }, 404, allowed);
    if (!env.KICK_CLIENT_ID || !env.KICK_CLIENT_SECRET) return json({ error: 'missing_kick_api_secrets' }, 503, allowed);
    try {
      const token = await getToken(env);
      const headers = { authorization: `Bearer ${token}`, accept: 'application/json' };
      const slug = env.KICK_CHANNEL_SLUG || 'macseky';
      const channelResponse = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, { headers });
      if (!channelResponse.ok) throw new Error(`Kick channels API returned ${channelResponse.status}`);
      const channelPayload = await channelResponse.json();
      const channel = Array.isArray(channelPayload.data) ? channelPayload.data[0] : channelPayload.data;
      if (!channel) return json({ error: 'channel_not_found' }, 404, allowed);
      let stream = null;
      const broadcasterId = channel.broadcaster_user_id ?? channel.user_id ?? channel.id;
      if (broadcasterId != null) {
        const streamResponse = await fetch(`https://api.kick.com/public/v1/livestreams?broadcaster_user_id=${encodeURIComponent(broadcasterId)}`, { headers });
        if (!streamResponse.ok) throw new Error(`Kick livestreams API returned ${streamResponse.status}`);
        const streamPayload = await streamResponse.json();
        stream = Array.isArray(streamPayload.data) ? streamPayload.data[0] || null : streamPayload.data || null;
      }
      const live = Boolean(stream);
      return json({ ok: true, channel: { slug, followers_count: channel.followers_count ?? channel.followersCount ?? null }, livestream: live ? { is_live: true, viewer_count: stream.viewer_count ?? null, stream_title: stream.stream_title ?? stream.title ?? '', started_at: stream.started_at ?? null, categories: stream.categories ?? (stream.category ? [stream.category] : []) } : null, checked_at: new Date().toISOString() }, 200, allowed);
    } catch (error) {
      return json({ error: 'kick_api_request_failed', message: String(error?.message || error) }, 502, allowed);
    }
  }
};
