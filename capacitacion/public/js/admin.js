let TREE = [];

async function boot() {
  let me;
  try { me = (await api('/auth/me')).user; }
  catch { location.href = BASE + '/login'; return; }
  if (me.role !== 'admin') { location.href = BASE + '/'; return; }

  document.querySelectorAll('.section-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.section-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('tab-content').style.display = t.dataset.tab === 'content' ? '' : 'none';
      document.getElementById('tab-users').style.display = t.dataset.tab === 'users' ? '' : 'none';
    });
  });

  await loadContent();
  await loadUsers();
}

/* ================= CONTENIDO ================= */
async function loadContent() {
  TREE = (await api('/content')).modules;
  renderContent();
}

function renderContent() {
  const root = document.getElementById('tab-content');
  root.innerHTML = '';

  // New module card
  const addCard = el('div', { class: 'card' });
  addCard.appendChild(el('h2', {}, 'Nuevo módulo'));
  addCard.appendChild(el('p', { class: 'hint' }, 'Los módulos agrupan lecciones (ej. "Ventas", "Inducción").'));
  const mTitle = el('input', { placeholder: 'Título del módulo' });
  const mDesc = el('input', { placeholder: 'Descripción (opcional)' });
  const addBtn = el('button', { class: 'btn', onclick: async () => {
    if (!mTitle.value.trim()) return toast('Escribe un título', true);
    await api('/modules', { method: 'POST', body: { title: mTitle.value.trim(), description: mDesc.value.trim() } });
    mTitle.value = ''; mDesc.value = '';
    toast('Módulo creado'); await loadContent();
  }}, 'Agregar módulo');
  addCard.appendChild(el('div', { class: 'row' },
    el('div', { class: 'grow' }, mTitle),
    el('div', { class: 'grow' }, mDesc),
    addBtn));
  root.appendChild(addCard);

  if (!TREE.length) {
    root.appendChild(el('div', { class: 'card' }, el('p', { class: 'hint', style: 'margin:0' }, 'Todavía no hay módulos. Crea el primero arriba.')));
    return;
  }

  for (const m of TREE) root.appendChild(renderModule(m));
}

function renderModule(m) {
  const box = el('div', { class: 'tree-module' });
  const head = el('div', { class: 'head' });
  head.appendChild(el('div', {},
    el('strong', { style: 'font-size:16px' }, m.title),
    m.description ? el('div', { style: 'color:var(--muted);font-size:13px' }, m.description) : null
  ));
  head.appendChild(el('div', { class: 'actions' },
    el('button', { class: 'btn ghost sm', onclick: () => editModule(m) }, 'Editar'),
    el('button', { class: 'btn danger sm', onclick: () => delItem('módulo', `/modules/${m.id}`) }, 'Eliminar')
  ));
  box.appendChild(head);

  const lessonsWrap = el('div', { class: 'tree-lessons' });
  for (const l of m.lessons) lessonsWrap.appendChild(renderLesson(l));

  // Add lesson inline
  const lTitle = el('input', { placeholder: 'Título de la lección' });
  const lAdd = el('button', { class: 'btn sm', onclick: async () => {
    if (!lTitle.value.trim()) return toast('Escribe un título', true);
    await api('/lessons', { method: 'POST', body: { module_id: m.id, title: lTitle.value.trim() } });
    toast('Lección creada'); await loadContent();
  }}, '+ Lección');
  lessonsWrap.appendChild(el('div', { class: 'row', style: 'margin-top:10px' },
    el('div', { class: 'grow' }, lTitle), lAdd));

  box.appendChild(lessonsWrap);
  return box;
}

function renderLesson(l) {
  const wrap = el('div', { style: 'margin-top:10px' });
  const item = el('div', { class: 'list-item' });
  item.appendChild(el('div', { class: 'meta' },
    el('strong', {}, l.title),
    el('small', {}, `${l.videos.length} video(s)`)
  ));
  item.appendChild(el('div', { class: 'actions' },
    el('button', { class: 'btn ghost sm', onclick: () => editLesson(l) }, 'Editar'),
    el('button', { class: 'btn danger sm', onclick: () => delItem('lección', `/lessons/${l.id}`) }, 'Eliminar')
  ));
  wrap.appendChild(item);

  // Videos
  const vids = el('div', { style: 'margin-left:14px' });
  for (const v of l.videos) {
    const vi = el('div', { class: 'list-item' });
    vi.appendChild(el('div', { class: 'meta' },
      el('strong', {}, v.title),
      el('small', {}, v.url)
    ));
    vi.appendChild(el('div', { class: 'actions' },
      el('button', { class: 'btn ghost sm', onclick: () => editVideo(v) }, 'Editar'),
      el('button', { class: 'btn danger sm', onclick: () => delItem('video', `/videos/${v.id}`) }, 'Eliminar')
    ));
    vids.appendChild(vi);
  }
  // Add video inline
  const vTitle = el('input', { placeholder: 'Título del video' });
  const vUrl = el('input', { placeholder: 'Link (YouTube, Vimeo, Drive o .mp4)' });
  const vAdd = el('button', { class: 'btn sm', onclick: async () => {
    if (!vTitle.value.trim() || !vUrl.value.trim()) return toast('Título y link requeridos', true);
    await api('/videos', { method: 'POST', body: { lesson_id: l.id, title: vTitle.value.trim(), url: vUrl.value.trim(), kind: 'link' } });
    toast('Video agregado'); await loadContent();
  }}, '+ Video');
  vids.appendChild(el('div', { class: 'row', style: 'margin-top:8px' },
    el('div', { class: 'grow' }, vTitle),
    el('div', { class: 'grow' }, vUrl),
    vAdd));
  wrap.appendChild(vids);
  return wrap;
}

async function editModule(m) {
  const title = prompt('Título del módulo:', m.title); if (title === null) return;
  const description = prompt('Descripción:', m.description || ''); if (description === null) return;
  await api(`/modules/${m.id}`, { method: 'PATCH', body: { title, description } });
  toast('Actualizado'); await loadContent();
}
async function editLesson(l) {
  const title = prompt('Título de la lección:', l.title); if (title === null) return;
  const description = prompt('Descripción:', l.description || ''); if (description === null) return;
  await api(`/lessons/${l.id}`, { method: 'PATCH', body: { title, description } });
  toast('Actualizado'); await loadContent();
}
async function editVideo(v) {
  const title = prompt('Título del video:', v.title); if (title === null) return;
  const url = prompt('Link del video:', v.url); if (url === null) return;
  await api(`/videos/${v.id}`, { method: 'PATCH', body: { title, url } });
  toast('Actualizado'); await loadContent();
}
async function delItem(label, path) {
  if (!confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
  await api(path, { method: 'DELETE' });
  toast('Eliminado'); await loadContent();
}

/* ================= USUARIOS ================= */
async function loadUsers() {
  const { users } = await api('/users');
  renderUsers(users);
}

function renderUsers(users) {
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
  addCard.appendChild(el('div', { class: 'row' },
    el('div', { class: 'grow' }, u),
    el('div', { class: 'grow' }, n),
    el('div', { class: 'grow' }, p),
    r, b));
  root.appendChild(addCard);

  const listCard = el('div', { class: 'card' });
  listCard.appendChild(el('h2', {}, 'Usuarios'));
  for (const usr of users) {
    const item = el('div', { class: 'list-item' });
    item.appendChild(el('div', { class: 'meta' },
      el('strong', {}, usr.username, usr.role === 'admin' ? el('span', { class: 'pill', style: 'margin-left:8px' }, 'admin') : null),
      el('small', {}, usr.full_name || '—')
    ));
    item.appendChild(el('div', { class: 'actions' },
      el('button', { class: 'btn ghost sm', onclick: () => resetPass(usr) }, 'Cambiar contraseña'),
      el('button', { class: 'btn danger sm', onclick: () => delUser(usr) }, 'Eliminar')
    ));
    listCard.appendChild(item);
  }
  root.appendChild(listCard);
}

async function resetPass(usr) {
  const password = prompt(`Nueva contraseña para "${usr.username}":`);
  if (!password) return;
  await api(`/users/${usr.id}/password`, { method: 'PATCH', body: { password } });
  toast('Contraseña actualizada');
}
async function delUser(usr) {
  if (!confirm(`¿Eliminar al usuario "${usr.username}"?`)) return;
  try { await api(`/users/${usr.id}`, { method: 'DELETE' }); toast('Usuario eliminado'); await loadUsers(); }
  catch (e) { toast(e.message, true); }
}

boot();
