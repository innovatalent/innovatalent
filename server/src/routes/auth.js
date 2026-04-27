const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../middleware/validate');

const router = Router();

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
  return { accessToken, refreshToken };
}

// Register
router.post('/register', authLimiter, validateBody({
  email: { required: true, type: 'email', maxLength: 255 },
  password: { required: true, maxLength: 128 },
  role: { required: false, enum: ['startup', 'candidate'] },
}), async (req, res) => {
  try {
    const { email, password, role = 'startup' } = req.body;

    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );

    const user = rows[0];
    const tokens = generateTokens(user);

    await db.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [tokens.refreshToken, user.id]);

    await db.query(
      `INSERT INTO activity_log (user_id, action, details, ip) VALUES ($1, 'register', $2, $3)`,
      [user.id, JSON.stringify({ role }), req.ip]
    );

    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role }, ...tokens });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Login
router.post('/login', authLimiter, validateBody({
  email: { required: true, type: 'email' },
  password: { required: true },
}), async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokens = generateTokens(user);
    await db.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [tokens.refreshToken, user.id]);

    await db.query(
      `INSERT INTO activity_log (user_id, action, ip) VALUES ($1, 'login', $2)`,
      [user.id, req.ip]
    );

    res.json({ user: { id: user.id, email: user.email, role: user.role }, ...tokens });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token requerido' });

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, refreshToken]);

    if (!rows.length) return res.status(401).json({ error: 'Token inválido' });

    const user = rows[0];
    const tokens = generateTokens(user);
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token expirado o inválido' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, role, email_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
  res.json({ message: 'Sesión cerrada' });
});

module.exports = router;
