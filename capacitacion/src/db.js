import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL PRIMARY KEY,
  module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id          SERIAL PRIMARY KEY,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'link' CHECK (kind IN ('link','upload')),
  url         TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed  BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL = para todos
  type        TEXT NOT NULL DEFAULT 'info',   -- info | course_new | unlock | announcement
  title       TEXT NOT NULL,
  body        TEXT DEFAULT '',
  link        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_reads (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_videos_lesson ON videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
`;

export async function initDb() {
  await pool.query(SCHEMA);

  // Seed / sync admin user from environment
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPass = process.env.ADMIN_PASSWORD;

  if (adminPass) {
    const hash = await bcrypt.hash(adminPass, 10);
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [adminUser]);
    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO users (username, password, role, full_name) VALUES ($1, $2, 'admin', $3)`,
        [adminUser, hash, 'Administrador']
      );
      console.log(`[db] Admin creado: ${adminUser}`);
    } else {
      // Keep the admin password in sync with the env value on every boot
      await pool.query(`UPDATE users SET password = $1, role = 'admin' WHERE username = $2`, [hash, adminUser]);
      console.log(`[db] Admin sincronizado: ${adminUser}`);
    }
  } else {
    console.warn('[db] ADMIN_PASSWORD no definido; no se creó/actualizó el admin.');
  }
}
