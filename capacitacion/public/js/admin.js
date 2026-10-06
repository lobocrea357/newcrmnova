let TREE = [];
let sel = null;               // { type:'module'|'lesson', id }
const openMods = new Set();   // expanded module ids in the nav

/* ---------- icons ---------- */
const ICON = {
  caret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
};
function icon(name) { return el('span', { html: ICON[name], style: 'display:inline-grid;place-items:center;width:15px;height:15px' }); }

function videoKind(url) {
  const u = String(url || '');
  if (/(?:youtube\.com|youtu\.be)/i.test(u)) return { label: 'YouTube', cls: 'yt' };
  if (/vimeo\.com/i.test(u)) return { label: 'Vimeo', cls: 'vm' };
  if (/drive\.google\.com/i.test(u)) return { label: 'Drive', cls: 'dr' };
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u)) return { label: 'Archivo', cls: 'mp' };
  return { label: 'Enlace', cls: '' };
}

/* ---------- modal ---------- */
function openModal({ title, subtitle, fields, okText = 'Guardar' }) {
  return new Promise(resolve => {
    const inputs = {};
    const body = el('div', {});
    for (const f of fields) {
      body.appendChild(el('label', {}, f.label));
      const inp = f.type === 'textarea' ? el('textarea', { placeholder: f.placeholder || '' }) : el('input', { type: f.type || 'text', placeholder: f.placeholder || '' });
      if (f.value != null) inp.value = f.value;
      inputs[f.name] = inp;
      body.appendChild(inp);
    }
    const overlay = el('div', { class: 'modal-overlay' });
    const close = (val) => { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(val); };
    const submit = () => { const out = {}; for (const [k, inp] of Object.entries(inputs)) out[k] = inp.value.trim(); close(out); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    const modal = el('div', { class: 'modal' },
      el('h3', {}, title),
      subtitle ? el('p', { class: 'msub' }, subtitle) : null,
      body,
      el('div', { class: 'mbtns' },
        el('button', { class: 'btn ghost', onclick: () => close(null) }, 'Cancelar'),
        el('button', { class: 'btn', onclick: submit }, okText))
    );
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    const first = Object.values(inputs)[0]; if (first) first.focus();
  });
}

/* ---------- reveal add-form ---------- */
function addSlot(label, fields, onSubmit) {
  const slot = el('div', { class: 'add-slot' });
  const inputs = {};
  const form = el('div', { class: 'add-form', hidden: true });
  const fieldWrap = el('div', { class: 'fields' });
  for (const f of fields) { const inp = el('input', { placeholder: f.placeholder }); inputs[f.name] = inp; fieldWrap.appendChild(inp); }
  const toggle = el('button', { class: 'add-toggle', onclick: () => { form.hidden = false; toggle.hidden = true; const fi = Object.values(inputs)[0]; if (fi) fi.focus(); } }, '+ ' + label);
  const reset = () => { for (const inp of Object.values(inputs)) inp.value = ''; form.hidden = true; toggle.hidden = false; };
  const save = async () => { const vals = {}; for (const [k, inp] of Object.entries(inputs)) vals[k] = inp.value.trim(); try { await onSubmit(vals, reset); } catch (e) { toast(e.message, true); } };
  form.appendChild(fieldWrap);
  form.appendChild(el('div', { class: 'btns' },
    el('button', { class: 'btn sm', onclick: save }, 'Guardar'),
    el('button', { class: 'btn ghost sm', onclick: reset }, 'Cancelar')));
  Object.values(inputs).forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); }));
  slot.appendChild(toggle); slot.appendChild(form);
  return slot;
}

/* ---------- reorder ---------- */
async function reorder(siblings, id, dir, endpoint) {
  const idx = siblings.findIndex(x => x.id === id);
  const j = idx + dir;
  if (j < 0 || j >= siblings.length) return;
  const arr = siblings.slice();
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  await Promise.all(arr.map((x, i) => api(`${endpoint}/${x.id}`, { method: 'PATCH', body: { position: i } })));
  await loadContent();
}
function orderBtns(siblings, id, endpoint) {
  const idx = siblings.findIndex(x => x.id === id);
  const up = el('button', { class: 'iconbtn', title: 'Subir', onclick: (e) => { e.stopPropagation(); reorder(siblings, id, -1, endpoint); } }, icon('up'));
  const down = el('button', { class: 'iconbtn', title: 'Bajar', onclick: (e) => { e.stopPropagation(); reorder(siblings, id, 1, endpoint); } }, icon('down'));
  if (idx <= 0) up.disabled = true;
  if (idx === siblings.length - 1) down.disabled = true;
  return [up, down];
}

/* ---------- lookups ---------- */
function findModule(id) { return TREE.find(m => m.id === id) || null; }
function findLesson(id) { for (const m of TREE) { const l = m.lessons.find(x => x.id === id); if (l) return { module: m, lesson: l }; } return null; }

/* ================= BOOT ================= */
async function boot() {
  let me;
  try { me = (await api('/auth/me')).user; } catch { location.href = BASE + '/login'; return; }
  if (me.role !== 'admin') { location.href = BASE + '/'; return; }
  document.querySelectorAll('.section-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.section-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      for (const name of ['content', 'users', 'avisos']) {
        document.getElementById('tab-' + name).style.display = t.dataset.tab === name ? '' : 'none';
      }
    });
  });
  await loadContent();
  await loadUsers();
  await loadAvisos();
}

/* ================= AVISOS ================= */
async function loadAvisos() {
  let sent = [];
  try { sent = (await api('/admin/notifications')).notifications; } catch (e) {}
  const root = document.getElementById('tab-avisos');
  root.innerHTML = '';

  const card = el('div', { class: 'card' });
  card.appendChild(el('h2', {}, 'Enviar aviso a todos'));
  card.appendChild(el('p', { class: 'hint' }, 'Aparecerá como notificación (📣) para todos los usuarios.'));
  const title = el('input', { placeholder: 'Título (ej. Nueva práctica por Zoom)' });
  const body = el('textarea', { placeholder: 'Mensaje (opcional)' });
  const link = el('input', { placeholder: 'Enlace opcional (ej. #/module/3)' });
  const send = el('button', { class: 'btn', onclick: async () => {
    if (!title.value.trim()) return toast('Escribe un título', true);
    try {
      await api('/admin/notifications', { method: 'POST', body: { title: title.value.trim(), body: body.value.trim(), link: link.value.trim() } });
      title.value = ''; body.value = ''; link.value = '';
      toast('Aviso enviado a todos'); await loadAvisos();
    } catch (e) { toast(e.message, true); }
  }}, 'Enviar aviso');
  card.appendChild(el('div', { class: 'field-grid' },
    el('div', {}, el('label', {}, 'Título'), title),
    el('div', {}, el('label', {}, 'Mensaje'), body),
    el('div', {}, el('label', {}, 'Enlace (opcional)'), link)));
  card.appendChild(el('div', { class: 'saverow' }, send));
  root.appendChild(card);

  const listCard = el('div', { class: 'card' });
  listCard.appendChild(el('h2', {}, 'Avisos enviados'));
  if (!sent.length) listCard.appendChild(el('p', { class: 'hint', style: 'margin:0' }, 'Aún no hay avisos. Los avisos automáticos de "nuevo curso" también aparecen aquí.'));
  for (const n of sent) {
    const tag = n.type === 'course_new' ? 'automático' : 'aviso';
    listCard.appendChild(el('div', { class: 'list-item' },
      el('div', { class: 'meta' },
        el('strong', {}, n.title, el('span', { class: 'pill', style: 'margin-left:8px' }, tag)),
        el('small', {}, (n.body || '') + (n.link ? `  ·  ${n.link}` : '')))));
  }
  root.appendChild(listCard);
}

/* ================= CONTENIDO (dos paneles) ================= */
async function loadContent() {
  TREE = (await api('/content')).modules;
  // Validate current selection still exists
  if (sel) {
    if (sel.type === 'module' && !findModule(sel.id)) sel = null;
    if (sel.type === 'lesson' && !findLesson(sel.id)) sel = null;
  }
  // Auto-select something sensible on first load
  if (!sel && TREE.length) { sel = { type: 'module', id: TREE[0].id }; openMods.add(TREE[0].id); }
  render();
}

function render() {
  const root = document.getElementById('tab-content');
  root.innerHTML = '';
  const editor = el('div', { class: 'editor' });
  editor.appendChild(renderNav());
  editor.appendChild(renderDetail());
  root.appendChild(editor);
}

function renderNav() {
  const nav = el('div', { class: 'ed-nav' });
  const head = el('div', { class: 'ed-nav-head' });
  head.appendChild(el('button', { class: 'btn block sm', onclick: newModule }, '+ Nuevo módulo'));
  nav.appendChild(head);

  if (!TREE.length) {
    nav.appendChild(el('div', { class: 'empty-hint', style: 'padding:16px' }, 'Crea tu primer módulo arriba.'));
    return nav;
  }

  for (const m of TREE) {
    const isOpen = openMods.has(m.id);
    const modWrap = el('div', { class: 'nav-mod' + (isOpen ? ' open' : '') });
    const mhead = el('div', {
      class: 'nav-mod-head' + (sel && sel.type === 'module' && sel.id === m.id ? ' active' : ''),
      onclick: () => { sel = { type: 'module', id: m.id }; openMods.add(m.id); render(); },
    });
    const caret = el('span', { class: 'caret', html: ICON.caret, onclick: (e) => { e.stopPropagation(); isOpen ? openMods.delete(m.id) : openMods.add(m.id); render(); } });
    mhead.appendChild(caret);
    mhead.appendChild(el('span', { class: 't' }, m.title));
    mhead.appendChild(el('span', { class: 'n' }, String(m.lessons.length)));
    modWrap.appendChild(mhead);

    if (isOpen) {
      const lessons = el('div', { class: 'nav-lessons' });
      for (const l of m.lessons) {
        lessons.appendChild(el('div', {
          class: 'nav-lesson' + (sel && sel.type === 'lesson' && sel.id === l.id ? ' active' : ''),
          onclick: () => { sel = { type: 'lesson', id: l.id }; render(); },
        }, el('span', { class: 'ldot' }), l.title));
      }
      const addWrap = el('div', { class: 'nav-add-lesson' });
      addWrap.appendChild(addSlot('Lección', [{ name: 'title', placeholder: 'Título de la lección' }], async (v, reset) => {
        if (!v.title) return toast('Escribe un título', true);
        const l = await api('/lessons', { method: 'POST', body: { module_id: m.id, title: v.title, position: m.lessons.length } });
        reset(); sel = { type: 'lesson', id: l.id }; toast('Lección creada'); await loadContent();
      }));
      lessons.appendChild(addWrap);
      modWrap.appendChild(lessons);
    }
    nav.appendChild(modWrap);
  }
  return nav;
}

function renderDetail() {
  const main = el('div', { class: 'ed-main' });
  if (!sel) {
    main.appendChild(el('div', { class: 'ed-empty' }, el('div', {},
      el('div', { class: 'big' }, '📚'),
      el('div', {}, 'Selecciona un módulo o lección a la izquierda,'),
      el('div', {}, 'o crea uno nuevo para empezar.'))));
    return main;
  }
  if (sel.type === 'module') return renderModuleDetail(main, findModule(sel.id));
  const found = findLesson(sel.id);
  return renderLessonDetail(main, found.module, found.lesson);
}

/* editable title+description block with save */
function fieldBlock(entity, endpoint, extra = {}) {
  const title = el('input', { value: entity.title });
  const desc = el('textarea', { placeholder: 'Descripción (opcional)' }); desc.value = entity.description || '';
  const tick = el('span', { class: 'saved-tick' }, '✓ Guardado');
  const save = async () => {
    if (!title.value.trim()) return toast('El título no puede quedar vacío', true);
    await api(`${endpoint}/${entity.id}`, { method: 'PATCH', body: { title: title.value.trim(), description: desc.value.trim() } });
    tick.classList.add('show'); setTimeout(() => tick.classList.remove('show'), 1600);
    await loadContent();
  };
  title.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
  return el('div', {},
    el('div', { class: 'field-grid' },
      el('div', {}, el('label', {}, extra.titleLabel || 'Título'), title),
      el('div', {}, el('label', {}, 'Descripción'), desc)),
    el('div', { class: 'saverow' }, el('button', { class: 'btn', onclick: save }, 'Guardar cambios'), tick));
}

function renderModuleDetail(main, m) {
  main.appendChild(el('div', { class: 'detail-crumb' }, 'Módulo'));
  const actions = el('div', { class: 'acc-actions' });
  orderBtns(TREE, m.id, '/modules').forEach(b => actions.appendChild(b));
  actions.appendChild(el('button', { class: 'iconbtn danger', title: 'Eliminar módulo', onclick: () => delItem('módulo', `/modules/${m.id}`, () => { sel = null; }) }, icon('trash')));
  main.appendChild(el('div', { class: 'detail-title-row' }, el('h1', {}, m.title), actions));

  const s1 = el('div', { class: 'detail-section' });
  s1.appendChild(el('h3', {}, 'Datos del módulo'));
  s1.appendChild(fieldBlock(m, '/modules'));
  main.appendChild(s1);

  const s2 = el('div', { class: 'detail-section' });
  s2.appendChild(el('h3', {}, `Lecciones (${m.lessons.length})`));
  if (!m.lessons.length) s2.appendChild(el('div', { class: 'empty-hint' }, 'Aún no hay lecciones en este módulo.'));
  for (const l of m.lessons) {
    const row = el('div', { class: 'vrow', style: 'cursor:pointer', onclick: () => { sel = { type: 'lesson', id: l.id }; openMods.add(m.id); render(); } });
    row.appendChild(el('div', { class: 'vmeta' }, el('strong', {}, l.title), el('small', {}, `${l.videos.length} video(s)`)));
    const acts = el('div', { class: 'acc-actions' });
    orderBtns(m.lessons, l.id, '/lessons').forEach(b => acts.appendChild(b));
    acts.appendChild(el('button', { class: 'iconbtn', title: 'Abrir', onclick: (e) => { e.stopPropagation(); sel = { type: 'lesson', id: l.id }; openMods.add(m.id); render(); } }, icon('caret')));
    row.appendChild(acts);
    s2.appendChild(row);
  }
  s2.appendChild(addSlot('Agregar lección', [{ name: 'title', placeholder: 'Título de la lección' }], async (v, reset) => {
    if (!v.title) return toast('Escribe un título', true);
    const l = await api('/lessons', { method: 'POST', body: { module_id: m.id, title: v.title, position: m.lessons.length } });
    reset(); sel = { type: 'lesson', id: l.id }; toast('Lección creada'); await loadContent();
  }));
  main.appendChild(s2);
  return main;
}

function renderLessonDetail(main, m, l) {
  main.appendChild(el('div', { class: 'detail-crumb' }, el('b', {}, m.title), ' › Lección'));
  const actions = el('div', { class: 'acc-actions' });
  orderBtns(m.lessons, l.id, '/lessons').forEach(b => actions.appendChild(b));
  actions.appendChild(el('button', { class: 'iconbtn danger', title: 'Eliminar lección', onclick: () => delItem('lección', `/lessons/${l.id}`, () => { sel = { type: 'module', id: m.id }; }) }, icon('trash')));
  main.appendChild(el('div', { class: 'detail-title-row' }, el('h1', {}, l.title), actions));

  const s1 = el('div', { class: 'detail-section' });
  s1.appendChild(el('h3', {}, 'Datos de la lección'));
  s1.appendChild(fieldBlock(l, '/lessons'));
  main.appendChild(s1);

  const s2 = el('div', { class: 'detail-section' });
  s2.appendChild(el('h3', {}, `Videos (${l.videos.length})`));
  if (!l.videos.length) s2.appendChild(el('div', { class: 'empty-hint' }, 'Aún no hay videos. Agrega el primero abajo.'));
  for (const v of l.videos) {
    const k = videoKind(v.url);
    const row = el('div', { class: 'vrow' });
    row.appendChild(el('span', { class: 'badge ' + k.cls }, k.label));
    row.appendChild(el('div', { class: 'vmeta' }, el('strong', {}, v.title), el('small', { title: v.url }, v.url)));
    const acts = el('div', { class: 'acc-actions' });
    orderBtns(l.videos, v.id, '/videos').forEach(b => acts.appendChild(b));
    acts.appendChild(el('button', { class: 'iconbtn', title: 'Editar', onclick: () => editVideo(v) }, icon('edit')));
    acts.appendChild(el('button', { class: 'iconbtn danger', title: 'Eliminar', onclick: () => delItem('video', `/videos/${v.id}`) }, icon('trash')));
    row.appendChild(acts);
    s2.appendChild(row);
  }
  // persistent add-video form
  const vt = el('input', { placeholder: 'Título del video' });
  const vu = el('input', { placeholder: 'Link (YouTube, Vimeo, Drive o .mp4)' });
  const addv = async () => {
    if (!vt.value.trim() || !vu.value.trim()) return toast('Título y link requeridos', true);
    await api('/videos', { method: 'POST', body: { lesson_id: l.id, title: vt.value.trim(), url: vu.value.trim(), kind: 'link', position: l.videos.length } });
    toast('Video agregado'); await loadContent();
  };
  vu.addEventListener('keydown', e => { if (e.key === 'Enter') addv(); });
  const addForm = el('div', { class: 'add-form', style: 'margin-top:14px' },
    el('div', { class: 'fields' }, vt, vu),
    el('div', { class: 'btns' }, el('button', { class: 'btn sm', onclick: addv }, '+ Agregar video')));
  s2.appendChild(addForm);
  main.appendChild(s2);

  // Sección de evaluación (quiz)
  const s3 = el('div', { class: 'detail-section' });
  s3.appendChild(el('h3', {}, 'Evaluación (quiz)'));
  const quizWrap = el('div', {});
  s3.appendChild(quizWrap);
  loadLessonQuiz(l, quizWrap);
  main.appendChild(s3);
  return main;
}

async function loadLessonQuiz(l, wrap) {
  let questions = [];
  try { questions = (await api(`/quiz/${l.id}`)).questions; } catch (e) {}
  wrap.innerHTML = '';
  if (!questions.length) wrap.appendChild(el('div', { class: 'empty-hint' }, 'Esta lección aún no tiene preguntas.'));
  questions.forEach((q, qi) => {
    const box = el('div', { class: 'qadmin' });
    const head = el('div', { class: 'qadmin-head' });
    head.appendChild(el('strong', {}, `${qi + 1}. ${q.question}`));
    head.appendChild(el('button', { class: 'iconbtn danger', title: 'Eliminar pregunta', onclick: () => delQuizQ(l, q.id, wrap) }, icon('trash')));
    box.appendChild(head);
    (q.options || []).forEach((opt, oi) => {
      box.appendChild(el('div', { class: 'qadmin-opt' + (oi === q.correct_index ? ' correct' : '') },
        el('span', { class: 'qmark' }, oi === q.correct_index ? '✓' : '·'), opt));
    });
    if (q.explanation) box.appendChild(el('div', { class: 'qadmin-exp' }, '💡 ' + q.explanation));
    wrap.appendChild(box);
  });
  // Formulario para agregar pregunta
  wrap.appendChild(quizAddForm(l, wrap, questions.length));
}

function quizAddForm(l, wrap, position) {
  const q = el('input', { placeholder: 'Pregunta' });
  const opts = [0, 1, 2, 3].map(i => el('input', { placeholder: `Opción ${i + 1}${i < 2 ? ' (requerida)' : ' (opcional)'}` }));
  const correct = el('select', {}, ...[0, 1, 2, 3].map(i => el('option', { value: i }, `Correcta: Opción ${i + 1}`)));
  const exp = el('input', { placeholder: 'Explicación (opcional)' });
  const save = async () => {
    const options = opts.map(o => o.value.trim()).filter(Boolean);
    if (!q.value.trim() || options.length < 2) return toast('Pregunta y mínimo 2 opciones', true);
    const ci = Math.min(Number(correct.value), options.length - 1);
    try {
      await api('/quiz-questions', { method: 'POST', body: { lesson_id: l.id, question: q.value.trim(), options, correct_index: ci, explanation: exp.value.trim(), position } });
      toast('Pregunta agregada'); loadLessonQuiz(l, wrap);
    } catch (e) { toast(e.message, true); }
  };
  return el('div', { class: 'add-form', style: 'margin-top:12px' },
    el('div', { class: 'fields', style: 'flex-direction:column' }, q, opts[0], opts[1], opts[2], opts[3], correct, exp),
    el('div', { class: 'btns' }, el('button', { class: 'btn sm', onclick: save }, '+ Agregar pregunta')));
}

async function delQuizQ(l, id, wrap) {
  if (!confirm('¿Eliminar esta pregunta?')) return;
  await api(`/quiz-questions/${id}`, { method: 'DELETE' });
  toast('Pregunta eliminada');
  loadLessonQuiz(l, wrap);
}

async function newModule() {
  const v = await openModal({ title: 'Nuevo módulo', subtitle: 'Agrupa lecciones (ej. "Ventas", "Inducción").', fields: [
    { name: 'title', label: 'Título', placeholder: 'Título del módulo' },
    { name: 'description', label: 'Descripción', placeholder: 'Opcional', type: 'textarea' },
  ], okText: 'Crear módulo' });
  if (!v) return;
  if (!v.title) return toast('Escribe un título', true);
  const m = await api('/modules', { method: 'POST', body: { title: v.title, description: v.description, position: TREE.length } });
  openMods.add(m.id); sel = { type: 'module', id: m.id };
  toast('Módulo creado'); await loadContent();
}

async function editVideo(v0) {
  const v = await openModal({ title: 'Editar video', fields: [
    { name: 'title', label: 'Título', value: v0.title },
    { name: 'url', label: 'Link del video', value: v0.url },
  ]});
  if (!v) return;
  if (!v.title || !v.url) return toast('Título y link requeridos', true);
  await api(`/videos/${v0.id}`, { method: 'PATCH', body: v });
  toast('Actualizado'); await loadContent();
}

async function delItem(label, path, after) {
  if (!confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
  await api(path, { method: 'DELETE' });
  if (after) after();
  toast('Eliminado'); await loadContent();
}

/* ================= USUARIOS ================= */
function uInitials(u) {
  const s = (u.full_name || u.username || '?').trim();
  const p = s.split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || s[0].toUpperCase();
}
// Avatar del usuario: foto si tiene, si no iniciales
function uAvatar(u, cls = 'uav', extraStyle = '') {
  const node = el('div', { class: cls, style: extraStyle });
  if (u.avatar) node.appendChild(el('img', { src: u.avatar, alt: '', style: 'width:100%;height:100%;object-fit:cover' }));
  else node.textContent = uInitials(u);
  return node;
}

async function loadUsers() {
  const [usersRes, summary] = await Promise.all([api('/users'), api('/admin/progress')]);
  const map = {};
  summary.users.forEach(u => { map[u.id] = u; });
  renderUsers(usersRes.users, map, summary.total);
}

async function showUserProgress(usr) {
  let completed = [];
  try { completed = (await api(`/users/${usr.id}/progress`)).completed; }
  catch (e) { return toast(e.message, true); }
  const done = new Set(completed);
  let total = 0, doneCount = 0;
  const rows = TREE.map(m => {
    const t = m.lessons.length;
    const d = m.lessons.filter(l => done.has(l.id)).length;
    total += t; doneCount += d;
    return { title: m.title, t, d, pct: t ? Math.round(d / t * 100) : 0 };
  });
  const overall = total ? Math.round(doneCount / total * 100) : 0;

  const overlay = el('div', { class: 'modal-overlay' });
  const close = () => overlay.remove();
  overlay.appendChild(el('div', { class: 'modal wide' },
    el('h3', {}, `Progreso de ${usr.full_name || usr.username}`),
    el('p', { class: 'msub' }, `@${usr.username}`),
    el('div', { class: 'pg-overall' }, el('span', { class: 'big' }, `${overall}%`), el('small', {}, `${doneCount} de ${total} lecciones completadas`)),
    el('div', { class: 'pg-bar' }, el('i', { style: `width:${overall}%` })),
    rows.length ? rows.map(r => el('div', { class: 'pg-row' },
      el('div', { class: 'pg-top' }, el('strong', {}, r.title), el('span', {}, `${r.d}/${r.t} · ${r.pct}%`)),
      el('div', { class: 'pg-bar' }, el('i', { style: `width:${r.pct}%` })))) : el('div', { class: 'pg-empty', style: 'margin-top:12px' }, 'Aún no hay módulos.'),
    el('div', { class: 'mbtns' }, el('button', { class: 'btn', onclick: close }, 'Cerrar'))));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  document.body.appendChild(overlay);
}

function renderUsers(users, prog = {}, totalLessons = 0) {
  const root = document.getElementById('tab-users');
  root.innerHTML = '';
  const addCard = el('div', { class: 'card' });
  addCard.appendChild(el('h2', {}, 'Nuevo usuario'));
  addCard.appendChild(el('p', { class: 'hint' }, 'Los usuarios pueden ver el contenido. Los administradores además pueden gestionarlo.'));
  const u = el('input', { placeholder: 'Usuario (sin espacios)' });
  const n = el('input', { placeholder: 'Nombre completo (opcional)' });
  const p = el('input', { placeholder: 'Contraseña', type: 'text' });
  const r = el('select', {}, el('option', { value: 'user' }, 'Usuario'), el('option', { value: 'admin' }, 'Administrador'));
  const b = el('button', { class: 'btn', onclick: async () => {
    if (!u.value.trim() || !p.value) return toast('Usuario y contraseña requeridos', true);
    try {
      await api('/users', { method: 'POST', body: { username: u.value.trim(), full_name: n.value.trim(), password: p.value, role: r.value } });
      u.value = ''; n.value = ''; p.value = ''; r.value = 'user';
      toast('Usuario creado'); await loadUsers();
    } catch (e) { toast(e.message, true); }
  }}, 'Crear usuario');
  addCard.appendChild(el('div', { class: 'row' }, el('div', { class: 'grow' }, u), el('div', { class: 'grow' }, n), el('div', { class: 'grow' }, p), r, b));
  root.appendChild(addCard);

  // Solicitudes pendientes de aprobación
  const pending = users.filter(u => u.status === 'pending');
  if (pending.length) {
    const pc = el('div', { class: 'card', style: 'border-color:#f59e0b' });
    pc.appendChild(el('h2', {}, `Solicitudes pendientes (${pending.length})`));
    pc.appendChild(el('p', { class: 'hint' }, 'Estos usuarios se registraron y esperan tu aprobación para poder ingresar.'));
    for (const u of pending) {
      const item = el('div', { class: 'user-card', style: 'border-color:#f6d38a; background:#2a2410' });
      item.appendChild(uAvatar(u, 'uav', 'background:linear-gradient(135deg,#d97706,#f59e0b)'));
      item.appendChild(el('div', { class: 'uinfo' },
        el('div', { class: 'un' }, u.full_name || u.username),
        el('div', { class: 'us' }, `@${u.username}${u.email ? ' · ' + u.email : ''}`)));
      item.appendChild(el('div', { class: 'uactions' },
        el('button', { class: 'btn ok sm', onclick: () => approveUser(u) }, '✓ Aprobar'),
        el('button', { class: 'btn danger sm', onclick: () => rejectUser(u) }, 'Rechazar')));
      pc.appendChild(item);
    }
    root.appendChild(pc);
  }

  // Resumen (solo usuarios activos)
  users = users.filter(u => u.status !== 'pending');
  const count = users.length;
  const avg = count && totalLessons
    ? Math.round(users.reduce((a, u) => a + (prog[u.id]?.completed || 0) / totalLessons * 100, 0) / count)
    : 0;
  const summary = el('div', { class: 'users-summary' },
    el('div', { class: 'usum' }, el('div', { class: 'k' }, 'Usuarios'), el('div', { class: 'v' }, String(count))),
    el('div', { class: 'usum' }, el('div', { class: 'k' }, 'Lecciones'), el('div', { class: 'v' }, String(totalLessons))),
    el('div', { class: 'usum' }, el('div', { class: 'k' }, 'Avance prom.'), el('div', { class: 'v' }, `${avg}%`)));

  const listCard = el('div', { class: 'card' });
  listCard.appendChild(el('h2', {}, 'Usuarios'));
  listCard.appendChild(summary);

  for (const usr of users) {
    const p = prog[usr.id] || { completed: 0 };
    const pct = totalLessons ? Math.round((p.completed || 0) / totalLessons * 100) : 0;
    const pctCls = pct >= 100 ? 'done' : (pct === 0 ? 'zero' : '');
    const card = el('div', { class: 'user-card' });
    card.appendChild(uAvatar(usr));
    card.appendChild(el('div', { class: 'uinfo' },
      el('div', { class: 'un' }, usr.full_name || usr.username,
        usr.role === 'admin' ? el('span', { class: 'pill', style: 'margin-left:8px' }, 'admin') : null),
      el('div', { class: 'us' }, `@${usr.username} · ${p.completed || 0}/${totalLessons} lecciones`)));
    card.appendChild(el('div', { class: 'uprog' },
      el('div', { class: 'pt' },
        el('span', { class: 'user-pct ' + pctCls }, `${pct}%`),
        el('span', { style: 'color:var(--muted);font-size:12px;font-weight:700' }, pct >= 100 ? 'Completo' : (pct === 0 ? 'Sin iniciar' : 'En curso'))),
      el('div', { class: 'pg-bar' }, el('i', { style: `width:${pct}%` }))));
    card.appendChild(el('div', { class: 'uactions' },
      el('button', { class: 'btn sm', onclick: () => showUserProgress(usr) }, 'Ver progreso'),
      el('button', { class: 'btn ghost sm', onclick: () => resetPass(usr) }, '🔑 Contraseña'),
      el('button', { class: 'iconbtn danger', title: 'Eliminar usuario', onclick: () => delUser(usr) }, icon('trash'))));
    listCard.appendChild(card);
  }
  root.appendChild(listCard);
}

async function resetPass(usr) {
  const v = await openModal({ title: 'Cambiar contraseña', subtitle: `Usuario: ${usr.username}`, okText: 'Actualizar', fields: [{ name: 'password', label: 'Nueva contraseña', placeholder: 'Escribe la nueva contraseña' }] });
  if (!v) return;
  if (!v.password) return toast('Escribe una contraseña', true);
  await api(`/users/${usr.id}/password`, { method: 'PATCH', body: { password: v.password } });
  toast('Contraseña actualizada');
}
async function delUser(usr) {
  if (!confirm(`¿Eliminar al usuario "${usr.username}"?`)) return;
  try { await api(`/users/${usr.id}`, { method: 'DELETE' }); toast('Usuario eliminado'); await loadUsers(); } catch (e) { toast(e.message, true); }
}

async function approveUser(u) {
  try { await api(`/users/${u.id}/approve`, { method: 'POST' }); toast('Usuario aprobado'); await loadUsers(); }
  catch (e) { toast(e.message, true); }
}
async function rejectUser(u) {
  if (!confirm(`¿Rechazar la solicitud de "${u.username}"? Se eliminará su registro.`)) return;
  try { await api(`/users/${u.id}`, { method: 'DELETE' }); toast('Solicitud rechazada'); await loadUsers(); }
  catch (e) { toast(e.message, true); }
}

boot();
