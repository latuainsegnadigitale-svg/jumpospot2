// Jumbo Spot — protezione accesso e intermediario Pixabay (Netlify Edge Function)
//
// Impostazioni da inserire su Netlify (Site configuration > Environment variables):
//   JUMBO_USERS   credenziali di accesso, formato  utente:password
//                 (più accessi separati da uno spazio: venditori:pass1 clienti:pass2)
//   JUMBO_SECRET  una stringa lunga e casuale, serve a firmare le sessioni
//   PIXABAY_KEY   la chiave API di Pixabay     (foto e video)
//   PEXELS_KEY    la chiave API di Pexels      (foto e video)   facoltativa
//   UNSPLASH_KEY  la "Access Key" di Unsplash  (solo foto)      facoltativa
// "Cerca online" usa tutte le librerie di cui trova la chiave.
// Cambiando JUMBO_USERS o JUMBO_SECRET tutte le sessioni aperte vengono chiuse.

const COOKIE = 'jspot_sess';
const SESSION_DAYS = 30;
const enc = new TextEncoder();

const env = (k) => (globalThis.Netlify && Netlify.env.get(k)) || '';

function users(){
  return env('JUMBO_USERS').split(/\s+/).filter(Boolean).map(p => {
    const i = p.indexOf(':'); return i > 0 ? [p.slice(0, i), p.slice(i + 1)] : null;
  }).filter(Boolean);
}
function signingKey(){ return env('JUMBO_SECRET') + '|' + env('JUMBO_USERS'); }

async function hmac(data){
  const key = await crypto.subtle.importKey('raw', enc.encode(signingKey()), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
  let s = ''; sig.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sameText(a, b){
  a = String(a); b = String(b); let r = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) r |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return r === 0;
}
function readCookie(req){
  const found = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.indexOf(COOKIE + '=') === 0);
  return found ? decodeURIComponent(found.slice(COOKIE.length + 1)) : '';
}
async function hasSession(req){
  if (!env('JUMBO_SECRET') || !users().length) return false;
  const parts = readCookie(req).split('.'); if (parts.length !== 3) return false;
  const [exp, user, sig] = parts;
  if (!/^\d+$/.test(exp) || Date.now()/1000 > Number(exp)) return false;
  if (!users().some(u => u[0] === user)) return false;
  return sameText(sig, await hmac(exp + '.' + user));
}
function safeNext(v){ return (v && v.charAt(0) === '/' && v.charAt(1) !== '/' && v.indexOf('\\') < 0) ? v : '/'; }
function redirect(to, extra){
  const h = new Headers({ Location: to, 'Cache-Control': 'no-store' });
  if (extra) for (const [k, v] of Object.entries(extra)) h.append(k, v);
  return new Response(null, { status: 303, headers: h });
}
function json(obj, status){ return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store' } }); }

function loginPage(error, next, misconfigured){
  const msg = misconfigured ? 'Accesso non ancora configurato: mancano le impostazioni su Netlify.'
            : error ? 'Nome utente o password non corretti.' : '';
  return new Response(`<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Accesso · Jumbo Spot</title>
<meta name="theme-color" content="#2A0A22">
<link rel="icon" href="/icon-192.png" type="image/png">
<link rel="manifest" href="/manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
<style>
:root{box-sizing:border-box;color-scheme:dark;background:#07030A;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);}
*,*::before,*::after{box-sizing:inherit;}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 18px;font-family:"Nunito",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;background:linear-gradient(100deg,#5B1247 0%,#3E0D31 28%,#1D0718 60%,#050205 100%);}
.card{width:100%;max-width:380px;background:rgba(20,6,18,.66);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:26px 22px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
.logo{width:72px;height:72px;border-radius:16px;display:block;margin:0 auto 14px;}
h1{font-size:2.1rem;font-weight:900;letter-spacing:-.02em;margin:0;text-align:center;}
p.sub{margin:6px 0 22px;text-align:center;color:rgba(255,255,255,.7);font-size:.95rem;}
label{display:block;font-weight:800;font-size:.9rem;margin:14px 0 6px;}
input{width:100%;padding:13px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font:inherit;font-size:1rem;}
input:focus-visible{outline:2px solid #fff;outline-offset:1px;border-color:transparent;}
button{width:100%;margin-top:22px;min-height:50px;border:none;border-radius:12px;background:#fff;color:#3A0B2E;font:inherit;font-weight:800;font-size:1.02rem;cursor:pointer;}
button:focus-visible{outline:2px solid #fff;outline-offset:3px;}
.err{background:rgba(206,38,35,.18);color:#FFD6D4;border-left:3px solid #CE2623;border-radius:10px;padding:10px 12px;font-size:.9rem;margin:0 0 6px;}
.bars{display:flex;gap:6px;justify-content:center;margin:18px 0 0;}
.bars i{width:34px;height:5px;border-radius:3px;display:block;}
.foot{text-align:center;color:rgba(255,255,255,.6);font-size:.8rem;margin:16px 0 0;}
</style></head>
<body><main class="card">
<img class="logo" src="/icon-192.png" alt="JSE Insegne Digitali">
<h1>Jumbo Spot</h1>
<p class="sub">Accesso riservato ai clienti JSE Insegne Digitali</p>
${msg ? `<p class="err" role="alert">${msg}</p>` : ''}
<form method="post" action="/login">
<input type="hidden" name="next" value="${next.replace(/[&<>"']/g, '')}">
<label for="u">Nome utente</label>
<input id="u" name="user" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required>
<label for="p">Password</label>
<input id="p" name="pass" type="password" autocomplete="current-password" required>
<button type="submit">Entra</button>
</form>
<div class="bars" aria-hidden="true"><i style="background:#CE2623"></i><i style="background:#1A8B4B"></i><i style="background:#3F81CD"></i></div>
<p class="foot">Jumbo Spot è un servizio di JSE Insegne Digitali</p>
</main></body></html>`, { status: 200, headers: { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow' } });
}

/* ---------- librerie gratuite ---------- */
const PER = 12;
const MEDIA_HOSTS = /(^|\.)(pixabay\.com|pexels\.com|unsplash\.com|vimeo\.com|vimeocdn\.com)$/;
async function getJSON(u, headers){
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 8000);
  try { const r = await fetch(u, { headers: headers || {}, signal: ac.signal }); if (!r.ok) return { err: r.status }; return { data: await r.json() }; }
  catch (e){ return { err: 'net' }; } finally { clearTimeout(t); }
}
async function searchPixabay(q, page, kind, orient){
  const key = env('PIXABAY_KEY'); if (!key) return null;
  const isV = kind === 'video'; const u = new URL('https://pixabay.com/api/' + (isV ? 'videos/' : ''));
  const p = { key, q, lang:'it', safesearch:'true', per_page:String(PER), page:String(page) };
  if (isV) p.video_type = 'film'; else { p.image_type = 'photo'; if (orient) p.orientation = orient === 'v' ? 'vertical' : 'horizontal'; }
  for (const k in p) u.searchParams.set(k, p[k]);
  const r = await getJSON(u.toString()); if (!r.data) return { err: r.err, hits: [], more: false };
  const hits = (r.data.hits || []).map(h => {
    if (!isV) return { src:'pixabay', id:'pb' + h.id, prev:h.webformatURL, large:h.largeImageURL || h.webformatURL, alt:h.webformatURL, user:h.user, page:h.pageURL };
    const v = h.videos || {}; const pick = v.tiny && v.tiny.url ? v.tiny : (v.small && v.small.url ? v.small : v.medium || {});
    const thumb = (v.tiny && v.tiny.thumbnail) || (v.small && v.small.thumbnail) || (v.medium && v.medium.thumbnail) || (h.picture_id ? 'https://i.vimeocdn.com/video/' + h.picture_id + '_295x166.jpg' : '');
    return { src:'pixabay', id:'pb' + h.id, prev:thumb, large:pick.url, alt:(v.small && v.small.url) || '', dur:h.duration || 0, user:h.user, page:h.pageURL };
  }).filter(h => h.large);
  return { hits, more: page*PER < (r.data.totalHits || 0) };
}
async function searchPexels(q, page, kind, orient){
  const key = env('PEXELS_KEY'); if (!key) return null;
  const isV = kind === 'video';
  const build = base => { const u = new URL(base); u.searchParams.set('query', q); u.searchParams.set('per_page', String(PER)); u.searchParams.set('page', String(page)); u.searchParams.set('locale', 'it-IT'); if (orient) u.searchParams.set('orientation', orient === 'v' ? 'portrait' : 'landscape'); return u.toString(); };
  let r = await getJSON(build(isV ? 'https://api.pexels.com/v1/videos/search' : 'https://api.pexels.com/v1/search'), { Authorization: key });
  if (isV && r.err === 404) r = await getJSON(build('https://api.pexels.com/videos/search'), { Authorization: key });
  if (!r.data) return { err: r.err, hits: [], more: false };
  const d = r.data;
  const hits = isV
    ? (d.videos || []).map(v => {
        const files = (v.video_files || []).filter(f => f.link && String(f.file_type || '').indexOf('mp4') > -1).sort((a, b) => (a.width || 0) - (b.width || 0));
        const ok = files.filter(f => Math.min(f.width || 0, f.height || 0) >= 360);
        const good = ok[0] || files[files.length - 1]; if (!good) return null;
        return { src:'pexels', id:'pv' + v.id, prev:v.image, large:good.link, alt:(ok[1] && ok[1].link) || '', dur:v.duration || 0, user:(v.user || {}).name || 'Pexels', page:v.url };
      }).filter(Boolean)
    : (d.photos || []).map(p => ({ src:'pexels', id:'pp' + p.id, prev:(p.src || {}).medium, large:(p.src || {}).large2x || (p.src || {}).large, alt:(p.src || {}).large, user:p.photographer, page:p.url })).filter(h => h.large);
  return { hits, more: !!d.next_page };
}
async function searchUnsplash(q, page, kind, orient){
  if (kind === 'video') return null;
  const key = env('UNSPLASH_KEY'); if (!key) return null;
  const u = new URL('https://api.unsplash.com/search/photos');
  u.searchParams.set('query', q); u.searchParams.set('page', String(page)); u.searchParams.set('per_page', String(PER)); u.searchParams.set('content_filter', 'high');
  if (orient) u.searchParams.set('orientation', orient === 'v' ? 'portrait' : 'landscape');
  const r = await getJSON(u.toString(), { Authorization: 'Client-ID ' + key, 'Accept-Version':'v1' });
  if (!r.data) return { err: r.err, hits: [], more: false };
  const utm = '?utm_source=jumbo_spot&utm_medium=referral';
  const hits = (r.data.results || []).map(p => ({
    src:'unsplash', id:'us' + p.id, prev:(p.urls || {}).small, large:(p.urls || {}).regular, alt:(p.urls || {}).small,
    user:(p.user || {}).name || 'Unsplash', page:(((p.user || {}).links || {}).html || 'https://unsplash.com') + utm, dl:(p.links || {}).download_location
  })).filter(h => h.large);
  return { hits, more: page < (r.data.total_pages || 0) };
}
// Interroga le librerie in parallelo e alterna i risultati (uno per libreria).
async function searchAll(q, page, kind, orient){
  const all = (await Promise.all([searchPixabay, searchPexels, searchUnsplash].map(fn => fn(q, page, kind, orient)))).filter(Boolean);
  const lists = all.map(r => r.hits); const hits = [];
  for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => { if (i < l.length) hits.push(l[i]); });
  return { hits, more: all.some(r => r.more), tried: all.length, failed: all.filter(r => r.err).length, rate: all.some(r => r.err === 429 || r.err === 403) };
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const misconfigured = !env('JUMBO_SECRET') || !users().length;

  if (path === '/login' && request.method === 'POST'){
    let form; try { form = await request.formData(); } catch (e){ form = new FormData(); }
    const user = String(form.get('user') || '').trim(), pass = String(form.get('pass') || '');
    const next = safeNext(String(form.get('next') || '/'));
    const ok = !misconfigured && users().some(u => sameText(u[0], user) && sameText(u[1], pass));
    if (!ok){
      await new Promise(r => setTimeout(r, 700)); // rallenta i tentativi a raffica
      return redirect('/login?e=1&next=' + encodeURIComponent(next));
    }
    const exp = Math.floor(Date.now()/1000) + SESSION_DAYS*86400;
    const value = exp + '.' + user + '.' + await hmac(exp + '.' + user);
    return redirect(next, { 'Set-Cookie': `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${SESSION_DAYS*86400}; HttpOnly; Secure; SameSite=Lax` });
  }
  if (path === '/login'){
    if (!misconfigured && await hasSession(request)) return redirect(safeNext(url.searchParams.get('next')));
    return loginPage(url.searchParams.get('e') === '1', safeNext(url.searchParams.get('next')), misconfigured);
  }
  if (path === '/logout'){
    return redirect('/login', { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  const logged = await hasSession(request);
  if (!logged){
    if (path.indexOf('/api/') === 0) return json({ error:'auth' }, 401);
    const wantsPage = request.method === 'GET' && (request.headers.get('accept') || '').indexOf('text/html') > -1;
    if (wantsPage) return redirect('/login?next=' + encodeURIComponent(path + url.search));
    return new Response('Accesso richiesto', { status: 401, headers: { 'Cache-Control':'no-store' } });
  }

  // "Cerca online": una ricerca su tutte le librerie configurate. Le chiavi restano sul server.
  if (path === '/api/search'){
    if (!env('PIXABAY_KEY') && !env('PEXELS_KEY') && !env('UNSPLASH_KEY')) return json({ error:'nokey' }, 503);
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    if (!q) return json({ hits:[], more:false }, 200);
    const kind = url.searchParams.get('kind') === 'video' ? 'video' : 'photo';
    const page = Math.min(50, Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1));
    const o = url.searchParams.get('orient'); const orient = o === 'h' || o === 'v' ? o : '';
    let res = await searchAll(q, page, kind, orient);
    if (orient && page === 1 && !res.hits.length) res = await searchAll(q, page, kind, ''); // riprova senza orientamento
    if (!res.hits.length && res.tried && res.failed === res.tried) return json({ error:'upstream' }, res.rate ? 429 : 502);
    return new Response(JSON.stringify({ hits: res.hits, more: res.more }), { status: 200, headers: { 'Content-Type':'application/json', 'Cache-Control':'private, max-age=86400' } });
  }
  // Unsplash chiede di segnalare ogni foto effettivamente usata.
  if (path === '/api/track'){
    let t; try { t = new URL(url.searchParams.get('u') || ''); } catch (e){ return json({ error:'bad' }, 400); }
    if (t.protocol !== 'https:' || t.hostname !== 'api.unsplash.com' || !/^\/photos\/[^/]+\/download/.test(t.pathname) || !env('UNSPLASH_KEY')) return json({ error:'bad' }, 400);
    try { await fetch(t.toString(), { headers: { Authorization: 'Client-ID ' + env('UNSPLASH_KEY'), 'Accept-Version':'v1' } }); } catch (e){}
    return new Response(null, { status: 204 });
  }
  // Scarico foto e video delle librerie per conto del browser (solo i loro indirizzi).
  if (path === '/api/px-media'){
    let target; try { target = new URL(url.searchParams.get('u') || ''); } catch (e){ return json({ error:'bad' }, 400); }
    if (target.protocol !== 'https:' || !MEDIA_HOSTS.test(target.hostname)) return json({ error:'host' }, 403);
    let r; try { r = await fetch(target.toString()); } catch (e){ return json({ error:'upstream' }, 502); }
    if (!r.ok) return json({ error:'upstream', status:r.status }, 502);
    return new Response(r.body, { status: 200, headers: { 'Content-Type': r.headers.get('content-type') || 'application/octet-stream', 'Cache-Control':'private, max-age=3600' } });
  }
  if (path.indexOf('/api/') === 0) return json({ error:'not_found' }, 404);

  return context.next();
};

export const config = {
  path: '/*',
  excludedPath: ['/manifest.json', '/icon-192.png', '/icon-512.png']
};
