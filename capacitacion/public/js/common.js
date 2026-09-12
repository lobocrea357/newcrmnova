const BASE = window.BASE_PATH || '/capacitacion';

async function api(path, opts = {}) {
  const res = await fetch(BASE + '/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Error ' + res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// Turn any video URL into an embeddable player element
function buildVideoEmbed(url) {
  const u = String(url || '').trim();
  // YouTube
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return iframe(`https://www.youtube.com/embed/${m[1]}`);
  // Vimeo
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return iframe(`https://player.vimeo.com/video/${m[1]}`);
  // Google Drive
  m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]+)/);
  if (m) return iframe(`https://drive.google.com/file/d/${m[1]}/preview`);
  // Direct video file
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u)) {
    const v = document.createElement('video');
    v.src = u; v.controls = true; v.playsInline = true;
    return v;
  }
  // Fallback: raw iframe
  return iframe(u);
}
function iframe(src) {
  const f = document.createElement('iframe');
  f.src = src;
  f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  return f;
}

function toast(msg, isErr = false) {
  let t = document.querySelector('.toast');
  if (!t) { t = el('div', { class: 'toast' }); document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 2800);
}

async function logout() {
  try { await api('/auth/logout', { method: 'POST' }); } catch (_) {}
  location.href = BASE + '/login';
}
