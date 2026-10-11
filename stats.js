/*
 * Live data strategy:
 * 1) Preferred: configure window.MACSEKY_CONFIG.statsEndpoint to a same-origin/serverless proxy
 *    backed by Kick's official API. Never put OAuth client secrets in browser JavaScript.
 * 2) Fallback: try Kick's public channel endpoint. Browser CORS/rate limits may prevent this.
 * The UI deliberately shows "غير متاح" on failure instead of inventing numbers.
 */
(() => {
  const cfg = window.MACSEKY_CONFIG || {};
  const endpoint = cfg.statsEndpoint || 'https://kick.com/api/v2/channels/macseky';
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const format = (value) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-US').format(Number(value)) : 'غير متاح';
  const duration = (startedAt) => {
    if (!startedAt) return '—';
    const start = new Date(startedAt).getTime();
    if (!Number.isFinite(start) || start > Date.now()) return '—';
    const mins = Math.floor((Date.now() - start) / 60000);
    const days = Math.floor(mins / 1440), hours = Math.floor((mins % 1440) / 60), minutes = mins % 60;
    return `${days ? `${days}ي ` : ''}${hours}س ${minutes}د`;
  };
  const setNote = (message, state) => { const note = $('stats-note'); if (note) { note.textContent = message; note.dataset.state = state; } };
  const getStream = (data) => data?.data?.livestream ?? data?.livestream ?? data?.data?.[0] ?? null;
  const getChannel = (data) => data?.channel ?? data?.data?.[0] ?? data?.data ?? data;
  async function loadStats() {
    setNote('جاري الاتصال بمصدر البيانات…', 'loading');
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(9000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const channel = getChannel(data);
      const stream = getStream(data);
      const live = Boolean(stream && (stream.is_live === true || stream.is_live === 1 || stream.is_live === 'true' || stream.id));
      const viewers = stream?.viewer_count ?? stream?.viewers;
      const game = stream?.categories?.[0]?.name ?? stream?.category?.name ?? stream?.category_name ?? stream?.category ?? 'غير متاح';
      const title = stream?.stream_title ?? stream?.session_title ?? stream?.title ?? 'لا يوجد بث حالي';
      const started = stream?.started_at ?? stream?.start_time ?? null;
      const followers = channel?.followers_count ?? channel?.followersCount ?? channel?.followers_count_total;
      set('viewers', live ? format(viewers) : '0');
      set('game', live ? (typeof game === 'object' ? game.name || 'غير متاح' : String(game)) : '—');
      set('status', live ? 'مباشر الآن' : 'غير مباشر');
      const status = $('status'); if (status) status.className = `stat-value status-value ${live ? 'status-live' : 'status-offline'}`;
      set('uptime', live ? duration(started) : '—');
      set('followers', followers == null ? 'غير متاح' : format(followers));
      set('stream-title', live ? title : 'لا يوجد بث حالي');
      setNote('تم تحديث البيانات من المصدر المتاح.', 'ok');
    } catch (error) {
      set('viewers', 'غير متاح'); set('game', 'غير متاح'); set('status', 'تعذّر التحقق'); set('uptime', 'غير متاح'); set('followers', 'غير متاح');
      const status = $('status'); if (status) status.className = 'stat-value status-value status-unknown';
      setNote('تعذّر جلب البيانات. قد تكون واجهة Kick محجوبة من المتصفح أو تحتاج إلى ربط API خلفي. لن نعرض أرقامًا غير مؤكدة.', 'error');
      console.warn('MACSEKY stats could not load:', error);
    }
  }
  loadStats();
  window.setInterval(loadStats, Math.max(30000, Number(cfg.refreshMs) || 60000));
})();
