const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const env = require('../config/env');

async function init() {
  console.log('[DB] Initializing database...');

  try {
    // Run schemas
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('[DB] Base schema created');

    const schemaV2 = fs.readFileSync(path.join(__dirname, 'schema-v2.sql'), 'utf8');
    await pool.query(schemaV2);
    console.log('[DB] v2 schema (GHL modules) created');

    // Create admin user
    const passwordHash = await bcrypt.hash(env.admin.password, 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, email_verified)
       VALUES ($1, $2, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [env.admin.email, passwordHash]
    );
    console.log(`[DB] Admin user created: ${env.admin.email}`);

    console.log('[DB] ✅ Database initialized successfully');
  } catch (err) {
    console.error('[DB] ❌ Initialization error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

init().catch(() => process.exit(1));
