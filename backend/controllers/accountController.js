const pool = require('../config/db');

async function list(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.name, a.type, a.initial_balance,
              a.initial_balance
              + COALESCE(SUM(CASE WHEN t.type = 'receita' THEN t.amount ELSE -t.amount END), 0) AS current_balance
       FROM accounts a
       LEFT JOIN transactions t ON t.account_id = a.id
       WHERE a.user_id = ?
       GROUP BY a.id
       ORDER BY a.created_at ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar contas.' });
  }
}

async function create(req, res) {
  const { name, type, initial_balance } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo da conta são obrigatórios.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO accounts (user_id, name, type, initial_balance) VALUES (?, ?, ?, ?)',
      [req.userId, name, type, initial_balance || 0]
    );
    res.status(201).json({ id: result.insertId, name, type, initial_balance: initial_balance || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, type, initial_balance } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE accounts SET name = ?, type = ?, initial_balance = ? WHERE id = ? AND user_id = ?',
      [name, type, initial_balance || 0, id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conta não encontrada.' });
    }
    res.json({ id: Number(id), name, type, initial_balance: initial_balance || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar conta.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conta não encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover conta.' });
  }
}

module.exports = { list, create, update, remove };
