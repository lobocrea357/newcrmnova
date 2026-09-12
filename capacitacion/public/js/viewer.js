let TREE = [];
let currentLesson = null;

async function boot() {
  let me;
  try { me = (await api('/auth/me')).user; }
  catch { location.href = BASE + '/login'; return; }

  document.getElementById('userChip').textContent = me.full_name || me.username;
  if (me.role === 'admin') document.getElementById('adminLink').style.display = '';

  await loadContent();
}

async function loadContent() {
  const { modules } = await api('/content');
  TREE = modules;
  renderSidebar();
  // Auto-select first lesson that has videos
  const first = TREE.flatMap(m => m.lessons).find(l => l.videos.length) || TREE.flatMap(m => m.lessons)[0];
  if (first) selectLesson(first.id);
  else renderEmpty();
}

function renderSidebar() {
  const sb = document.getElementById('sidebar');
  sb.innerHTML = '';
  if (!TREE.length) {
    sb.appendChild(el('div', { class: 'empty-state', style: 'padding:30px 10px' },
      el('p', {}, 'Aún no hay módulos.')));
    return;
  }
  for (const m of TREE) {
    const block = el('div', { class: 'module-block' });
    block.appendChild(el('div', { class: 'module-title' }, m.title));
    if (!m.lessons.length) {
      block.appendChild(el('div', { class: 'lesson-item', style: 'color:var(--muted);cursor:default' }, 'Sin lecciones'));
    }
    for (const l of m.lessons) {
      const item = el('div', {
        class: 'lesson-item' + (currentLesson === l.id ? ' active' : ''),
        'data-lesson': l.id,
        onclick: () => selectLesson(l.id),
      }, el('span', { class: 'dot' }), l.title);
      block.appendChild(item);
    }
    sb.appendChild(block);
  }
}

function findLesson(id) {
  for (const m of TREE) for (const l of m.lessons) if (l.id === id) return l;
  return null;
}

function selectLesson(id) {
  currentLesson = id;
  document.querySelectorAll('.lesson-item').forEach(n =>
    n.classList.toggle('active', Number(n.dataset.lesson) === id));
  const lesson = findLesson(id);
  if (!lesson) return;
  renderLesson(lesson, 0);
}

function renderLesson(lesson, videoIdx) {
  const c = document.getElementById('content');
  c.innerHTML = '';

  if (!lesson.videos.length) {
    c.appendChild(el('div', {},
      el('h1', { style: 'margin:0 0 6px' }, lesson.title),
      lesson.description ? el('p', { style: 'color:var(--muted)' }, lesson.description) : null,
      el('div', { class: 'empty-state' }, el('h3', {}, 'Esta lección todavía no tiene videos.'))
    ));
    return;
  }

  const video = lesson.videos[videoIdx] || lesson.videos[0];
  const card = el('div', { class: 'player-card' });
  const frame = el('div', { class: 'video-frame' });
  frame.appendChild(buildVideoEmbed(video.url));
  card.appendChild(frame);
  card.appendChild(el('div', { class: 'player-meta' },
    el('h2', {}, video.title),
    lesson.description ? el('p', {}, lesson.description) : null
  ));

  if (lesson.videos.length > 1) {
    const tabs = el('div', { class: 'video-tabs' });
    lesson.videos.forEach((v, i) => {
      tabs.appendChild(el('button', {
        class: 'video-tab' + (i === videoIdx ? ' active' : ''),
        onclick: () => renderLesson(lesson, i),
      }, `${i + 1}. ${v.title}`));
    });
    card.appendChild(tabs);
  }

  c.appendChild(el('h1', { style: 'margin:0 0 16px; font-size:22px' }, lesson.title));
  c.appendChild(card);
}

function renderEmpty() {
  document.getElementById('content').innerHTML =
    '<div class="empty-state"><h3>Bienvenido a Capacitación Nova</h3><p>El administrador aún no ha publicado contenido.</p></div>';
}

boot();
