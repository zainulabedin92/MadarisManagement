import { open, DB } from '@op-engineering/op-sqlite';

/**
 * Local SQL store (SQLite — the embedded SQL engine for mobile; MySQL itself
 * cannot run inside a React Native app). Holds:
 *  - cache:  last successful GET responses (read offline)
 *  - outbox: write operations made offline, replayed to Express/MongoDB later
 */

export interface OutboxItem {
  id: number;
  method: string;
  endpoint: string;
  body: string | null;
  tempId: string | null;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export interface LocalUserRow {
  id: number;
  username: string;
  name: string;
  cnic: string | null;
  phone: string | null;
  email: string | null;
  pin: string;
  role: string;
  status: string;
  createdAt: number;
}

let db: DB | null = null;

function getDb(): DB {
  if (!db) {
    db = open({ name: 'madaris_offline.db' });
    db.executeSync(
      `CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );
    db.executeSync(
      `CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        body TEXT,
        temp_id TEXT,
        created_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      )`
    );
    db.executeSync(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        cnic TEXT UNIQUE,
        phone TEXT UNIQUE,
        email TEXT,
        pin TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'superadmin',
        status TEXT NOT NULL DEFAULT 'Active',
        created_at INTEGER NOT NULL
      )`
    );

    // Ensure default Super Admin record exists in the `users` table with role='superadmin'
    const superAdminRes = db.executeSync(
      'SELECT id, role, status FROM users WHERE lower(username) = ? LIMIT 1',
      ['superadmin']
    );
    const existingSuperAdmin = superAdminRes.rows?.[0] as any;
    if (!existingSuperAdmin) {
      db.executeSync(
        `INSERT INTO users (username, name, cnic, phone, email, pin, role, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'superadmin',
          'Hazrat Maulana Muhtamim Sahib',
          '00000-0000000-0',
          '03000000000',
          'muhtamim@mms.edu',
          '1234',
          'superadmin',
          'Active',
          Date.now(),
        ]
      );
    } else if (existingSuperAdmin.role !== 'superadmin' || existingSuperAdmin.status !== 'Active') {
      db.executeSync(
        'UPDATE users SET role = ?, status = ? WHERE id = ?',
        ['superadmin', 'Active', existingSuperAdmin.id]
      );
    }
  }
  return db;
}

export const localDb = {
  cacheSet(key: string, value: unknown) {
    getDb().executeSync(
      'INSERT OR REPLACE INTO cache (key, json, updated_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), Date.now()]
    );
  },

  cacheGet<T = any>(key: string): T | null {
    const res = getDb().executeSync('SELECT json FROM cache WHERE key = ?', [key]);
    const row: any = res.rows?.[0];
    if (!row) return null;
    try {
      return JSON.parse(row.json) as T;
    } catch {
      return null;
    }
  },

  /** All cached entries whose key (without query string) equals `path`. */
  cacheEntriesForPath(path: string): { key: string; value: any }[] {
    const res = getDb().executeSync(
      'SELECT key, json FROM cache WHERE key = ? OR key LIKE ?',
      [path, `${path}?%`]
    );
    const out: { key: string; value: any }[] = [];
    for (const row of (res.rows as any[]) || []) {
      try {
        out.push({ key: row.key, value: JSON.parse(row.json) });
      } catch {}
    }
    return out;
  },

  enqueue(method: string, endpoint: string, body: string | null, tempId: string | null) {
    getDb().executeSync(
      'INSERT INTO outbox (method, endpoint, body, temp_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [method, endpoint, body, tempId, Date.now()]
    );
  },

  outboxAll(): OutboxItem[] {
    const res = getDb().executeSync('SELECT * FROM outbox ORDER BY id ASC');
    return ((res.rows as any[]) || []).map(r => ({
      id: r.id,
      method: r.method,
      endpoint: r.endpoint,
      body: r.body,
      tempId: r.temp_id,
      createdAt: r.created_at,
      attempts: r.attempts,
      lastError: r.last_error,
    }));
  },

  outboxCount(): number {
    const res = getDb().executeSync('SELECT COUNT(*) AS c FROM outbox');
    return Number((res.rows?.[0] as any)?.c || 0);
  },

  outboxRemove(id: number) {
    getDb().executeSync('DELETE FROM outbox WHERE id = ?', [id]);
  },

  outboxFail(id: number, error: string) {
    getDb().executeSync(
      'UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      [error, id]
    );
  },

  /** Replace a temporary client id with the real server id in all queued + cached data. */
  replaceId(tempId: string, realId: string) {
    const d = getDb();
    d.executeSync(
      'UPDATE outbox SET endpoint = REPLACE(endpoint, ?, ?), body = REPLACE(body, ?, ?)',
      [tempId, realId, tempId, realId]
    );
    d.executeSync('UPDATE cache SET json = REPLACE(json, ?, ?)', [tempId, realId]);
  },

  clearCache() {
    getDb().executeSync('DELETE FROM cache');
  },

  /** Find a user in the `users` table by username, CNIC, or phone. */
  findUserByIdentifier(identifier: string): LocalUserRow | null {
    const clean = identifier.trim();
    if (!clean) return null;
    const res = getDb().executeSync(
      `SELECT * FROM users
       WHERE LOWER(username) = LOWER(?) OR cnic = ? OR phone = ?
       LIMIT 1`,
      [clean, clean, clean]
    );
    const row: any = res.rows?.[0];
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      cnic: row.cnic,
      phone: row.phone,
      email: row.email,
      pin: row.pin,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    };
  },

  /** Check login credentials against the `users` table. */
  authenticateUser(
    identifier: string,
    pin: string
  ):
    | { matched: false }
    | { matched: true; validPin: boolean; active: boolean; user: LocalUserRow } {
    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      return { matched: false };
    }
    const active = user.status === 'Active';
    const validPin = String(user.pin).trim() === String(pin).trim();
    return {
      matched: true,
      validPin,
      active,
      user,
    };
  },

  /** Insert or update a user record in the local `users` table. */
  upsertUser(user: {
    username: string;
    name: string;
    cnic?: string | null;
    phone?: string | null;
    email?: string | null;
    pin: string;
    role?: string;
    status?: string;
  }) {
    getDb().executeSync(
      `INSERT INTO users (username, name, cnic, phone, email, pin, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(username) DO UPDATE SET
         name = excluded.name,
         cnic = COALESCE(excluded.cnic, users.cnic),
         phone = COALESCE(excluded.phone, users.phone),
         email = COALESCE(excluded.email, users.email),
         pin = excluded.pin,
         role = excluded.role,
         status = excluded.status`,
      [
        user.username.trim().toLowerCase(),
        user.name.trim(),
        user.cnic || null,
        user.phone || null,
        user.email || null,
        user.pin.trim(),
        user.role || 'superadmin',
        user.status || 'Active',
        Date.now(),
      ]
    );
  },
};

