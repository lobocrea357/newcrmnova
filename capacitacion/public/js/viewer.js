let ME = null;
let TREE = [];
let DONE = new Set();     // completed lesson ids
let LAST = null;          // last viewed lesson id
let curVideoIdx = 0;
let lastMain = '#/';      // última pantalla principal (para "atrás")
let NOTIF = [];
let NOTIF_UNREAD = 0;

const BELL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';

function relTime(iso) {
  const d = new Date(iso), s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)} d`;
  return d.toLocaleDateString('es');
}

const MOD_ICONS = ['✈️','🧳','📈','👥','📚','🎯','💼','🌍','⭐','🧭','📝','🎓'];
const modIcon = (i) => MOD_ICONS[i % MOD_ICONS.length];

const LOGO_SVG = `<svg viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs>
  <path d="M1 2h10l8.5 17L28 2h10L23 32h-6L1 2Z" fill="url(#vg)"/>
  <path d="M21 12.5 27 2h10L26.5 22 21 12.5Z" fill="#a855f7" opacity=".55"/>
</svg>`;

const HERO_ART = `<svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMin meet">
  <circle cx="150" cy="40" r="66" fill="#ffffff" opacity="0.09"/>
  <circle cx="150" cy="40" r="42" fill="#ffffff" opacity="0.09"/>
  <path d="M36 40 Q 108 6 182 30" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" fill="none" opacity="0.9"/>
  <circle cx="36" cy="40" r="3.5" fill="#ffffff"/>
  <g transform="translate(178 18) rotate(26)">
    <path d="M0 7 L20 0 L12 20 L9 12 Z" fill="#ffffff"/>
  </g>
</svg>`;

const TAB_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  mods: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
  prog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
};

/* ---------- data ---------- */
async function loadAll() {
  try { ME = (await api('/auth/me')).user; }
  catch { location.href = BASE + '/login'; return false; }
  const [content, prog, notif] = await Promise.all([api('/content'), api('/me/progress'), api('/me/notifications')]);
  TREE = content.modules;
  DONE = new Set(prog.completed);
  LAST = prog.lastLessonId;
  NOTIF = notif.notifications;
  NOTIF_UNREAD = notif.unread;
  return true;
}

/* ---------- helpers ---------- */
function firstName() { return (ME.full_name || ME.username || '').trim().split(/\s+/)[0] || ME.username; }
function initials() { const s = (ME.full_name || ME.username || '?').trim(); const p = s.split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || s[0].toUpperCase(); }
function modStats(m) {
  const total = m.lessons.length;
  const done = m.lessons.filter(l => DONE.has(l.id)).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const status = total && done === total ? 'done' : (done > 0 ? 'curso' : 'zero');
  return { total, done, pct, status };
}
function overall() {
  let total = 0, done = 0;
  for (const m of TREE) for (const l of m.lessons) { total++; if (DONE.has(l.id)) done++; }
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}
function moduleComplete(m) { const s = modStats(m); return s.total === 0 || s.done === s.total; }
// Módulos desbloqueados: el primero siempre; los demás si el anterior está 100% completo.
// Los administradores ven todo desbloqueado.
function unlockedSet() {
  const set = new Set();
  if (ME && ME.role === 'admin') { TREE.forEach(m => set.add(m.id)); return set; }
  let prevOK = true;
  for (const m of TREE) {
    if (prevOK) set.add(m.id);
    prevOK = set.has(m.id) && moduleComplete(m);
  }
  return set;
}
function isLocked(moduleId) { return !unlockedSet().has(moduleId); }
function allLessons() { return TREE.flatMap(m => m.lessons.map(l => ({ m, l }))); }
function resumeInfo() {
  const list = allLessons(); if (!list.length) return null;
  let pick = LAST ? list.find(x => x.l.id === LAST) : null;
  if (pick && DONE.has(pick.l.id)) {
    const idx = list.indexOf(pick);
    pick = list.slice(idx + 1).find(x => !DONE.has(x.l.id)) || list.find(x => !DONE.has(x.l.id)) || pick;
  }
  if (!pick) pick = list.find(x => !DONE.has(x.l.id)) || list[0];
  return pick;
}
function ytId(url) { const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/); return m ? m[1] : null; }
function thumbUrl(v) { if (!v) return null; const id = ytId(v.url); return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null; }
function findModule(id) { return TREE.find(m => m.id === id); }
function findLessonCtx(id) { for (const m of TREE) { const i = m.lessons.findIndex(l => l.id === id); if (i >= 0) return { m, l: m.lessons[i], idx: i }; } return null; }

/* ---------- shell ---------- */
const app = () => document.getElementById('app');
function tabbar(active) {
  const mk = (key, label, hash) => el('button', {
    class: 'tab' + (active === key ? ' active' : ''),
    onclick: () => { location.hash = hash; },
  }, el('span', { html: TAB_ICONS[key] }), label);
  return el('div', { class: 'tabbar' },
    mk('home', 'Inicio', '#/'),
    mk('mods', 'Módulos', '#/modules'),
    mk('prog', 'Progreso', '#/progress'),
    mk('user', 'Perfil', '#/profile'));
}
function paint(nodes, activeTab) {
  const a = app(); a.innerHTML = '';
  (Array.isArray(nodes) ? nodes : [nodes]).forEach(n => n && a.appendChild(n));
  a.appendChild(tabbar(activeTab));
  a.scrollTop = 0; window.scrollTo(0, 0);
}
function appbar() {
  return el('div', { class: 'appbar' },
    el('div', { class: 'wordmark' },
      el('div', { class: 'v', html: LOGO_SVG }),
      el('div', { class: 'txt', html: '<b>VIAJES NOVA</b><small>Academia</small>' })),
    el('div', { class: 'tools' },
      bellButton(),
      el('div', { class: 'avatar', onclick: () => location.hash = '#/profile' }, initials())));
}
function bellButton() {
  const bell = el('div', { class: 'iconbadge', title: 'Notificaciones', onclick: () => location.hash = '#/notifications', html: BELL_SVG });
  if (NOTIF_UNREAD > 0) bell.appendChild(el('span', { class: 'notif-count' }, NOTIF_UNREAD > 9 ? '9+' : String(NOTIF_UNREAD)));
  return bell;
}
function pbar(pct) { return el('div', { class: 'pbar' }, el('i', { style: `width:${pct}%` })); }

/* ---------- HOME ---------- */
function continueItems() {
  const items = [];
  const unlocked = unlockedSet();
  TREE.forEach((m) => {
    if (!m.lessons.length || !unlocked.has(m.id)) return;
    const done = m.lessons.filter(l => DONE.has(l.id)).length;
    if (done < m.lessons.length) {
      const l = m.lessons.find(x => !DONE.has(x.id)) || m.lessons[0];
      items.push({ m, l, idx: m.lessons.indexOf(l) });
    }
  });
  // Put the most recently viewed module first
  if (LAST) {
    const k = items.findIndex(x => x.m.lessons.some(l => l.id === LAST));
    if (k > 0) items.unshift(items.splice(k, 1)[0]);
  }
  // Fallback: everything done or nothing started
  if (!items.length) {
    const r = resumeInfo();
    if (r) items.push({ m: r.m, l: r.l, idx: findLessonCtx(r.l.id).idx });
  }
  return items;
}

function renderHome() {
  const ov = overall();
  const hero = el('div', { class: 'hero' },
    el('div', { class: 'htext' },
      el('h1', {}, `¡Hola, ${firstName()}!`),
      el('p', {}, 'Continúa fortaleciendo tus habilidades'),
      el('div', { class: 'progress-pill' },
        el('div', { class: 'row' }, el('b', {}, `${ov.pct}%`), el('span', {}, 'completado')),
        el('div', { class: 'track' }, el('i', { style: `width:${ov.pct}%` })))));

  const unlocked = unlockedSet();
  const grid = el('div', { class: 'courses' });
  TREE.forEach((m, i) => grid.appendChild(courseCard(m, i, !unlocked.has(m.id))));

  const section = el('div', { class: 'screen' },
    el('div', { class: 'sec-head' },
      el('h2', {}, 'Tu ruta de aprendizaje'),
      el('a', { href: '#/modules' }, 'Ver todo ›')),
    TREE.length ? grid : el('div', { class: 'empty' }, el('div', { class: 'big' }, '🗂️'), 'Aún no hay cursos publicados.'));

  const nodes = [appbar(), hero, section];

  const items = continueItems();
  if (items.length) {
    const carousel = el('div', { class: 'carousel' });
    items.forEach(({ m, l, idx }) => {
      const th = thumbUrl(l.videos[0]);
      carousel.appendChild(el('div', { class: 'cont-card' },
        el('div', { class: 'cc-top' },
          el('div', { class: 'thumb' },
            th ? el('img', { src: th, alt: '' }) : null,
            el('div', { class: 'play', html: '▶' })),
          el('div', { class: 'cc-info' },
            el('h4', {}, l.title),
            el('small', {}, `${m.title} · Lección ${idx + 1}`))),
        el('div', { class: 'cc-btn' },
          el('button', { class: 'btn block', onclick: () => location.hash = `#/lesson/${l.id}` }, 'Continuar lección ›'))));
    });
    const dots = el('div', { class: 'dots' });
    items.forEach((_, i) => dots.appendChild(el('span', { class: 'd' + (i === 0 ? ' active' : '') })));
    if (items.length > 1) {
      carousel.addEventListener('scroll', () => {
        const i = Math.round(carousel.scrollLeft / carousel.clientWidth);
        dots.querySelectorAll('.d').forEach((d, k) => d.classList.toggle('active', k === i));
      });
    }
    const cont = el('div', { class: 'screen', style: 'padding-top:0' },
      el('div', { class: 'sec-head' }, el('h2', {}, 'Continúa donde quedaste')),
      el('div', { class: 'sec-sub' }, 'Retoma tu formación y sigue avanzando'),
      carousel);
    if (items.length > 1) cont.appendChild(dots);
    nodes.push(cont);
  }
  paint(nodes, 'home');
}

function courseCard(m, i, locked) {
  const s = modStats(m);
  let badge = null;
  if (locked) badge = el('span', { class: 'badge-status lock' }, '🔒 Bloqueado');
  else if (s.status === 'done') badge = el('span', { class: 'badge-status done' }, 'Completado');
  else if (s.status === 'curso') badge = el('span', { class: 'badge-status' }, 'En curso');
  return el('div', {
      class: 'course' + (locked ? ' locked' : (s.status === 'curso' ? ' active' : '')),
      onclick: () => {
        if (locked) { toast('🔒 Completa el módulo anterior para desbloquear'); return; }
        location.hash = `#/module/${m.id}`;
      },
    },
    badge,
    el('div', { class: 'top' }, el('span', { class: 'num' }, String(i + 1).padStart(2, '0')), el('span', { class: 'chev' }, locked ? '🔒' : '›')),
    el('div', { class: 'cicon' }, modIcon(i)),
    el('h3', {}, m.title),
    el('div', { class: 'lc' }, `${s.total} lección${s.total === 1 ? '' : 'es'}`),
    pbar(locked ? 0 : s.pct),
    locked
      ? el('div', { class: 'pct zero' }, 'Bloqueado')
      : el('div', { class: 'pct ' + (s.status === 'done' ? 'done' : s.status === 'zero' ? 'zero' : '') }, `${s.pct}% completado`));
}

/* ---------- MÓDULOS (lista) ---------- */
function renderModules() {
  const unlocked = unlockedSet();
  const list = el('div', { class: 'courses' });
  TREE.forEach((m, i) => list.appendChild(courseCard(m, i, !unlocked.has(m.id))));
  paint([
    el('div', { class: 'screen' },
      el('div', { class: 'sec-head' }, el('h2', {}, 'Módulos')),
      TREE.length ? list : el('div', { class: 'empty' }, el('div', { class: 'big' }, '🗂️'), 'Aún no hay cursos.')),
  ], 'mods');
}

/* ---------- CURSO ---------- */
function renderCourse(id) {
  const m = findModule(id);
  if (!m) { location.hash = '#/'; return; }
  if (isLocked(id)) { toast('🔒 Completa el módulo anterior para desbloquear'); location.hash = '#/'; return; }
  const idx = TREE.indexOf(m);
  const s = modStats(m);

  const back = el('div', { class: 'subhead' },
    el('button', { class: 'backbtn', onclick: () => location.hash = lastMain }, '‹'),
    el('div', {}, el('div', { class: 'sub' }, `Módulo ${String(idx + 1).padStart(2, '0')}`)));

  const hero = el('div', { class: 'course-hero' },
    el('div', { class: 'cicon' }, modIcon(idx)),
    el('h2', {}, m.title),
    m.description ? el('p', {}, m.description) : null,
    el('div', { class: 'bar' }, el('i', { style: `width:${s.pct}%` })),
    el('div', { class: 'pct' }, `${s.done}/${s.total} lecciones · ${s.pct}% completado`));

  const lessons = el('div', { class: 'lessons' });
  if (!m.lessons.length) lessons.appendChild(el('div', { class: 'empty' }, 'Este módulo aún no tiene lecciones.'));
  m.lessons.forEach((l, i) => {
    const done = DONE.has(l.id);
    lessons.appendChild(el('div', { class: 'lrow' + (done ? ' done' : ''), onclick: () => location.hash = `#/lesson/${l.id}` },
      el('div', { class: 'check' }, '✓'),
      el('div', { class: 'lmeta' }, el('strong', {}, `${i + 1}. ${l.title}`), el('small', {}, `${l.videos.length} video${l.videos.length === 1 ? '' : 's'}`)),
      el('div', { class: 'lchev' }, '›')));
  });

  paint([back, hero, lessons], 'mods');
}

/* ---------- LECCIÓN ---------- */
function renderLesson(id) {
  const ctx = findLessonCtx(id);
  if (!ctx) { location.hash = '#/'; return; }
  const { m, l, idx } = ctx;
  if (isLocked(m.id)) { toast('🔒 Completa el módulo anterior para desbloquear'); location.hash = '#/'; return; }
  curVideoIdx = 0;
  LAST = id;
  api(`/me/progress/${id}/touch`, { method: 'POST' }).catch(() => {});
  drawLesson(m, l, idx);
}

function drawLesson(m, l, idx) {
  const done = DONE.has(l.id);
  const back = el('div', { class: 'subhead' },
    el('button', { class: 'backbtn', onclick: () => location.hash = `#/module/${m.id}` }, '‹'),
    el('div', {}, el('h1', {}, l.title), el('div', { class: 'sub' }, `${m.title} · Lección ${idx + 1}`)));

  const player = el('div', { class: 'player' });
  if (l.videos.length) {
    const v = l.videos[curVideoIdx] || l.videos[0];
    const frame = el('div', { class: 'frame' });
    frame.appendChild(buildVideoEmbed(v.url));
    player.appendChild(frame);
    player.appendChild(el('h2', {}, v.title));
    if (l.description) player.appendChild(el('p', { class: 'pdesc' }, l.description));
    if (l.videos.length > 1) {
      const tabs = el('div', { class: 'vtabs' });
      l.videos.forEach((vv, i) => tabs.appendChild(el('button', {
        class: 'vtab' + (i === curVideoIdx ? ' active' : ''),
        onclick: () => { curVideoIdx = i; drawLesson(m, l, idx); },
      }, `${i + 1}. ${vv.title}`)));
      player.appendChild(tabs);
    }
  } else {
    player.appendChild(el('div', { class: 'empty' }, el('div', { class: 'big' }, '🎬'), 'Esta lección aún no tiene videos.'));
  }

  // Mark complete
  const completeBtn = el('button', {
    class: 'btn block ' + (done ? 'ok' : ''),
    onclick: async () => {
      const nowDone = !DONE.has(l.id);
      try {
        await api(`/me/progress/${l.id}`, { method: 'PUT', body: { completed: nowDone } });
        if (nowDone) DONE.add(l.id); else DONE.delete(l.id);
        toast(nowDone ? '¡Lección completada!' : 'Marcada como pendiente');
        drawLesson(m, l, idx);
      } catch (e) { toast(e.message, true); }
    },
  }, done ? '✓ Completada' : 'Marcar como completada');

  // Prev / next
  const nav = el('div', { class: 'lesson-nav' });
  if (idx > 0) nav.appendChild(el('button', { class: 'btn ghost', onclick: () => location.hash = `#/lesson/${m.lessons[idx - 1].id}` }, '‹ Anterior'));
  if (idx < m.lessons.length - 1) nav.appendChild(el('button', { class: 'btn soft', onclick: () => location.hash = `#/lesson/${m.lessons[idx + 1].id}` }, 'Siguiente ›'));

  paint([back, player, el('div', { class: 'screen', style: 'padding-top:6px' }, completeBtn, nav)], 'mods');
}

/* ---------- PROGRESO ---------- */
function renderProgress() {
  const ov = overall();
  const R = 40, C = 2 * Math.PI * R, off = C * (1 - ov.pct / 100);
  const ring = el('div', { class: 'ring-wrap' },
    el('div', { html: `
      <svg class="ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="#ece9f4" stroke-width="10"/>
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="#7c3aed" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 50 50)"/>
        <text class="num" x="50" y="57" text-anchor="middle">${ov.pct}%</text>
      </svg>` }),
    el('div', {},
      el('div', { style: 'font-size:16px;font-weight:800' }, 'Progreso general'),
      el('div', { style: 'color:var(--muted);font-size:13px;margin-top:2px' }, `${ov.done} de ${ov.total} lecciones completadas`)));

  const stats = el('div', { class: 'stat-list' });
  TREE.forEach((m, i) => {
    const s = modStats(m);
    stats.appendChild(el('div', { class: 'stat', onclick: () => location.hash = `#/module/${m.id}`, style: 'cursor:pointer' },
      el('div', { class: 'st-top' },
        el('strong', {}, `${modIcon(i)}  ${m.title}`),
        el('span', {}, `${s.pct}%`)),
      pbar(s.pct)));
  });

  paint([
    el('div', { class: 'screen' }, el('div', { class: 'sec-head' }, el('h2', {}, 'Tu progreso'))),
    ring,
    TREE.length ? stats : el('div', { class: 'empty' }, 'Sin cursos todavía.'),
  ], 'prog');
}

/* ---------- PERFIL ---------- */
function renderProfile() {
  const ov = overall();
  const block = el('div', { class: 'profile' },
    el('div', { class: 'big-av' }, initials()),
    el('h2', {}, ME.full_name || ME.username),
    el('div', { class: 'role' }, ME.role === 'admin' ? 'Administrador' : 'Estudiante'),
    el('div', { class: 'prow' }, el('span', {}, 'Usuario'), el('small', {}, ME.username)),
    el('div', { class: 'prow' }, el('span', {}, 'Progreso general'), el('small', {}, `${ov.pct}%`)),
    el('div', { class: 'prow' }, el('span', {}, 'Lecciones completadas'), el('small', {}, `${ov.done} / ${ov.total}`)));
  if (ME.role === 'admin') {
    block.appendChild(el('a', { href: 'admin', style: 'text-decoration:none' },
      el('button', { class: 'btn soft block', style: 'margin-top:14px' }, '⚙ Panel de administración')));
  }
  block.appendChild(el('button', { class: 'btn ghost block', style: 'margin-top:10px', onclick: logout }, 'Cerrar sesión'));
  paint([el('div', { class: 'screen' }, el('div', { class: 'sec-head' }, el('h2', {}, 'Perfil'))), block], 'user');
}

/* ---------- NOTIFICACIONES ---------- */
async function renderNotifications() {
  let data;
  try { data = await api('/me/notifications'); }
  catch { location.href = BASE + '/login'; return; }
  NOTIF = data.notifications;
  if (NOTIF_UNREAD > 0) { api('/me/notifications/read', { method: 'POST' }).catch(() => {}); NOTIF_UNREAD = 0; }

  const back = el('div', { class: 'subhead' },
    el('button', { class: 'backbtn', onclick: () => location.hash = lastMain }, '‹'),
    el('div', {}, el('h1', {}, 'Notificaciones')));

  const list = el('div', { class: 'screen' });
  if (!NOTIF.length) {
    list.appendChild(el('div', { class: 'empty' }, el('div', { class: 'big' }, '🔔'), 'No tienes notificaciones por ahora.'));
  } else {
    NOTIF.forEach(n => {
      const ic = n.type === 'unlock' ? '🔓' : n.type === 'course_new' ? '🎓' : n.type === 'announcement' ? '📣' : '🔔';
      list.appendChild(el('div', {
        class: 'notif' + (n.read ? '' : ' unread'),
        onclick: () => { if (n.link) location.hash = n.link; },
      },
        el('div', { class: 'nicon' }, ic),
        el('div', { class: 'nbody' },
          el('strong', {}, n.title),
          n.body ? el('p', {}, n.body) : null,
          el('small', {}, relTime(n.created_at))),
        n.link ? el('span', { class: 'nchev' }, '›') : null));
    });
  }
  paint([back, list], null);
}

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#/, '');
  if (['', '/', '/modules', '/progress', '/profile'].includes(h)) lastMain = h && h !== '/' ? '#' + h : '#/';
  if (h === '/notifications') return renderNotifications();
  if (h.startsWith('/module/')) return renderCourse(Number(h.split('/')[2]));
  if (h.startsWith('/lesson/')) return renderLesson(Number(h.split('/')[2]));
  if (h === '/modules') return renderModules();
  if (h === '/progress') return renderProgress();
  if (h === '/profile') return renderProfile();
  return renderHome();
}

async function boot() {
  if (!(await loadAll())) return;
  window.addEventListener('hashchange', route);
  route();
}
boot();
