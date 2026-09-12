import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

/* ============ AUTH ============ */
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  const r = await pool.query('SELECT * FROM users WHERE username = $1', [String(username).trim()]);
  if (r.rowCount === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
  req.session.user = { id: user.id, username: user.username, role: user.role, full_name: user.full_name };
  res.json({ user: req.session.user });
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/auth/me', (req, res) => {
  if (req.session && req.session.user) return res.json({ user: req.session.user });
  res.status(401).json({ error: 'No autenticado' });
});

/* ============ CONTENT (viewer) ============ */
// Full tree: modules -> lessons -> videos
router.get('/content', requireAuth, async (req, res) => {
  const mods = (await pool.query('SELECT * FROM modules ORDER BY position, id')).rows;
  const lessons = (await pool.query('SELECT * FROM lessons ORDER BY position, id')).rows;
  const videos = (await pool.query('SELECT * FROM videos ORDER BY position, id')).rows;
  const tree = mods.map(m => ({
    ...m,
    lessons: lessons.filter(l => l.module_id === m.id).map(l => ({
      ...l,
      videos: videos.filter(v => v.lesson_id === l.id),
    })),
  }));
  res.json({ modules: tree });
});

/* ============ MODULES (admin) ============ */
router.post('/modules', requireAdmin, async (req, res) => {
  const { title, description = '', position = 0 } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Título requerido' });
  const r = await pool.query(
    'INSERT INTO modules (title, description, position) VALUES ($1,$2,$3) RETURNING *',
    [title, description, position]
  );
  res.status(201).json(r.rows[0]);
});

router.patch('/modules/:id', requireAdmin, async (req, res) => {
  const { title, description, position } = req.body || {};
  const r = await pool.query(
    `UPDATE modules SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       position = COALESCE($3, position)
     WHERE id = $4 RETURNING *`,
    [title ?? null, description ?? null, position ?? null, req.params.id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json(r.rows[0]);
});

router.delete('/modules/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ============ LESSONS (admin) ============ */
router.post('/lessons', requireAdmin, async (req, res) => {
  const { module_id, title, description = '', position = 0 } = req.body || {};
  if (!module_id || !title) return res.status(400).json({ error: 'module_id y título requeridos' });
  const r = await pool.query(
    'INSERT INTO lessons (module_id, title, description, position) VALUES ($1,$2,$3,$4) RETURNING *',
    [module_id, title, description, position]
  );
  res.status(201).json(r.rows[0]);
});

router.patch('/lessons/:id', requireAdmin, async (req, res) => {
  const { title, description, position } = req.body || {};
  const r = await pool.query(
    `UPDATE lessons SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       position = COALESCE($3, position)
     WHERE id = $4 RETURNING *`,
    [title ?? null, description ?? null, position ?? null, req.params.id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json(r.rows[0]);
});

router.delete('/lessons/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ============ VIDEOS (admin) ============ */
router.post('/videos', requireAdmin, async (req, res) => {
  const { lesson_id, title, url, kind = 'link', position = 0 } = req.body || {};
  if (!lesson_id || !title || !url) return res.status(400).json({ error: 'lesson_id, título y url requeridos' });
  const r = await pool.query(
    'INSERT INTO videos (lesson_id, title, url, kind, position) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [lesson_id, title, url, kind, position]
  );
  res.status(201).json(r.rows[0]);
});

router.patch('/videos/:id', requireAdmin, async (req, res) => {
  const { title, url, position } = req.body || {};
  const r = await pool.query(
    `UPDATE videos SET
       title = COALESCE($1, title),
       url = COALESCE($2, url),
       position = COALESCE($3, position)
     WHERE id = $4 RETURNING *`,
    [title ?? null, url ?? null, position ?? null, req.params.id]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json(r.rows[0]);
});

router.delete('/videos/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM videos WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ============ USERS (admin) ============ */
router.get('/users', requireAdmin, async (req, res) => {
  const r = await pool.query('SELECT id, username, role, full_name, created_at FROM users ORDER BY id');
  res.json({ users: r.rows });
});

router.post('/users', requireAdmin, async (req, res) => {
  const { username, password, full_name = '', role = 'user' } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  const safeRole = role === 'admin' ? 'admin' : 'user';
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      'INSERT INTO users (username, password, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id, username, role, full_name, created_at',
      [String(username).trim(), hash, full_name, safeRole]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese usuario ya existe' });
    throw e;
  }
});

router.patch('/users/:id/password', requireAdmin, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.params.id]);
  res.json({ ok: true });
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  // Prevent deleting yourself
  if (Number(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
