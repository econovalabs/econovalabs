const ADMIN_EMAIL = 'sherin122491@gmail.com';
const PUBLIC_ORIGIN = 'https://econovalabs.github.io';
const WEBSITE = PUBLIC_ORIGIN + '/econovalabs/';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function response(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { ...securityHeaders, ...headers } });
}
function json(data, status = 200, headers = {}) {
  return response(JSON.stringify(data), status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
}
function allowedOrigin(request) {
  const origin = request.headers.get('origin');
  return origin === PUBLIC_ORIGIN || origin === new URL(request.url).origin;
}
function cors(request) {
  return allowedOrigin(request) ? { 'Access-Control-Allow-Origin': request.headers.get('origin'), 'Vary': 'Origin' } : {};
}
function isAdmin(request) {
  // Sites dispatch authenticates visitors and supplies these trusted headers.
  // Never host this Worker without that authentication boundary.
  return !!request.headers.get('oai-authenticated-user-id') && request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase() === ADMIN_EMAIL;
}
async function readBody(request) {
  if (!request.body) throw new Error('empty');
  const reader = request.body.getReader();
  let size = 0; const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function rateLimit(db, key, max, now, ttl) {
  const row = await db.prepare(`INSERT INTO submission_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN expires_at <= ? THEN 1 ELSE count + 1 END,
    expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
    RETURNING count`).bind(key, now + ttl, now, now).first();
  return row.count <= max;
}
async function submit(request, env) {
  const headers = cors(request);
  if (!allowedOrigin(request)) return json({ error: 'This website is not allowed to submit feedback.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Send feedback as JSON.' }, 415, headers);
  let data;
  try { data = await readBody(request); } catch (error) { return json({ error: error.message === 'size' ? 'Your response is too long.' : 'Please check your response and try again.' }, error.message === 'size' ? 413 : 400, headers); }
  if (!data || typeof data !== 'object' || data.website) return json({ error: 'Unable to accept this response.' }, 400, headers);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const comments = typeof data.comments === 'string' ? data.comments.trim() : '';
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)
    || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)
    || !Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5
    || comments.length < 5 || comments.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(comments)
    || data.consent !== true) return json({ error: 'Enter your name, a valid email, a 1–5 rating and at least 5 characters of suggestions/details. Consent is required.' }, 400, headers);
  if (!env.DB) return json({ error: 'Feedback is temporarily unavailable. Please try again later.' }, 503, headers);
  const now = Math.floor(Date.now() / 1000);
  const emailKey = 'email:' + await hash(email);
  if (!await rateLimit(env.DB, emailKey, 3, now, 3600)) return json({ error: 'You have submitted several responses. Please try again in an hour.' }, 429, { ...headers, 'Retry-After': '3600' });
  const ip = request.headers.get('cf-connecting-ip');
  if (ip && !await rateLimit(env.DB, 'ip:' + await hash(ip), 30, now, 3600)) return json({ error: 'Too many submissions from this connection. Please try again in an hour.' }, 429, { ...headers, 'Retry-After': '3600' });
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO feedback (id, created_at, name, email, rating, comments, consent_version) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, new Date().toISOString(), name, email, data.rating, comments, 'feedback-v1').run();
  await env.DB.prepare('DELETE FROM submission_limits WHERE expires_at < ?').bind(now - 86400).run();
  return json({ id, message: 'Thank you! Your feedback has been saved.' }, 201, headers);
}
function filters(url) {
  const search = (url.searchParams.get('search') || '').trim().slice(0, 100);
  const rating = Number(url.searchParams.get('rating'));
  const clauses = []; const bindings = [];
  if (search) {
    const value = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
    clauses.push("(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR comments LIKE ? ESCAPE '\\')");
    bindings.push(value, value, value);
  }
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) { clauses.push('rating = ?'); bindings.push(rating); }
  return { where: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', bindings };
}
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
async function adminData(request, env, exportCsv) {
  if (!isAdmin(request)) return json({ error: 'Dashboard access is restricted to the authorized account.' }, request.headers.get('oai-authenticated-user-id') ? 403 : 401);
  if (!env.DB) return json({ error: 'Database is unavailable.' }, 503);
  const url = new URL(request.url); const { where, bindings } = filters(url);
  if (exportCsv) {
    const rows = await env.DB.prepare('SELECT created_at, name, email, rating, comments FROM feedback' + where + ' ORDER BY created_at DESC, id DESC LIMIT 10000').bind(...bindings).all();
    const csv = '\uFEFF' + [['Date (UTC)', 'Name', 'Email', 'Rating', 'Suggestions / details'].map(csvCell).join(','), ...rows.results.map(row => [row.created_at, row.name, row.email, row.rating, row.comments].map(csvCell).join(','))].join('\r\n');
    return response(csv, 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="econovalabs-feedback.csv"' });
  }
  const page = Math.max(1, Math.min(100000, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const totals = await env.DB.prepare('SELECT count(*) AS total, avg(rating) AS average FROM feedback' + where).bind(...bindings).first();
  const breakdown = await env.DB.prepare('SELECT rating, count(*) AS count FROM feedback' + where + ' GROUP BY rating ORDER BY rating DESC').bind(...bindings).all();
  const rows = await env.DB.prepare('SELECT id, created_at, name, email, rating, comments FROM feedback' + where + ' ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ?').bind(...bindings, (page - 1) * 25).all();
  return json({ items: rows.results, total: totals.total, average: totals.average, breakdown: breakdown.results, page, pageSize: 25 });
}
function signInPage(signedIn) {
  const title = signedIn ? 'This account does not have access.' : 'Your feedback, in one private place.';
  const text = signedIn ? 'Please sign out and use the ChatGPT account associated with sherin122491@gmail.com.' : 'Sign in with the ChatGPT account associated with sherin122491@gmail.com to view visitor feedback.';
  const link = signedIn ? '/signout-with-chatgpt?return_to=%2Fadmin' : '/signin-with-chatgpt?return_to=%2Fadmin';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Econova Labs | Dashboard sign-in</title><link rel="stylesheet" href="/dashboard.css"></head><body class="login-body"><main class="login-card"><a class="brand" href="' + WEBSITE + '">econova<span>labs</span></a><p class="eyebrow">PRIVATE FEEDBACK DASHBOARD</p><h1>' + title + '</h1><p>' + text + '</p><a class="button" target="_top" href="' + link + '">' + (signedIn ? 'Sign out and switch account' : 'Sign in with ChatGPT') + ' ↗</a><a class="back-link" href="' + WEBSITE + '">← Back to the website</a></main></body></html>';
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url); const path = url.pathname;
    try {
      if (path === '/api/feedback' && request.method === 'OPTIONS') {
        if (!allowedOrigin(request)) return response(null, 403);
        return response(null, 204, { ...cors(request), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
      }
      if (path === '/api/feedback' && request.method === 'POST') return await submit(request, env);
      if (path === '/api/admin/feedback' && request.method === 'GET') return await adminData(request, env, false);
      if (path === '/api/admin/export' && request.method === 'GET') return await adminData(request, env, true);
      if ((path === '/' || path === '/admin' || path === '/admin/') && request.method === 'GET') {
        return response(isAdmin(request) ? DASHBOARD_HTML : signInPage(!!request.headers.get('oai-authenticated-user-id')), isAdmin(request) || !request.headers.get('oai-authenticated-user-id') ? 200 : 403, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' });
      }
      if (path === '/dashboard.css' && request.method === 'GET') return response(DASHBOARD_CSS, 200, { 'Content-Type': 'text/css; charset=utf-8' });
      if (path === '/dashboard.js' && request.method === 'GET') return response(DASHBOARD_JS, 200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      if (path.startsWith('/api/')) return json({ error: 'Method or endpoint not supported.' }, 405);
      return response('Not found', 404, { 'Content-Type': 'text/plain' });
    } catch {
      // Do not log submitted names, emails, comments or database messages.
      return json({ error: 'The service is temporarily unavailable. Please try again shortly.' }, 503, path === '/api/feedback' ? cors(request) : {});
    }
  }
};
