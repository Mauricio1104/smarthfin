const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const DEFAULT_CATEGORIES = [
  { name: 'Salário', type: 'receita', color: '#22c55e' },
  { name: 'Outras receitas', type: 'receita', color: '#16a34a' },
  { name: 'Alimentação', type: 'despesa', color: '#ef4444' },
  { name: 'Transporte', type: 'despesa', color: '#f97316' },
  { name: 'Moradia', type: 'despesa', color: '#eab308' },
  { name: 'Saúde', type: 'despesa', color: '#06b6d4' },
  { name: 'Lazer', type: 'despesa', color: '#8b5cf6' },
  { name: 'Outras despesas', type: 'despesa', color: '#64748b' }
];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres.' });
  }

  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    const userId = result.insertId;

    await connection.query(
      'INSERT INTO accounts (user_id, name, type, initial_balance) VALUES (?, ?, ?, ?)',
      [userId, 'Carteira', 'carteira', 0]
    );

    for (const cat of DEFAULT_CATEGORIES) {
      await connection.query(
        'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
        [userId, cat.name, cat.type, cat.color]
      );
    }

    await connection.commit();

    const token = signToken(userId);
    res.status(201).json({
      token,
      user: { id: userId, name, email }
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  } finally {
    connection.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
}

module.exports = { register, login, me };
