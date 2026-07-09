const pool = require('../config/db');

async function list(req, res) {
  const { start_date, end_date, account_id, category_id, type } = req.query;

  const conditions = ['t.user_id = ?'];
  const params = [req.userId];

  if (start_date) {
    conditions.push('t.transaction_date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('t.transaction_date <= ?');
    params.push(end_date);
  }
  if (account_id) {
    conditions.push('t.account_id = ?');
    params.push(account_id);
  }
  if (category_id) {
    conditions.push('t.category_id = ?');
    params.push(category_id);
  }
  if (type) {
    conditions.push('t.type = ?');
    params.push(type);
  }

  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.description, t.amount, t.type, t.transaction_date,
              t.account_id, a.name AS account_name,
              t.category_id, c.name AS category_name, c.color AS category_color
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN categories c ON c.id = t.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.transaction_date DESC, t.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar transações.' });
  }
}

async function create(req, res) {
  const { description, amount, type, transaction_date, account_id, category_id } = req.body;

  if (!description || !amount || !type || !transaction_date || !account_id || !category_id) {
    return res.status(400).json({ error: 'Todos os campos da transação são obrigatórios.' });
  }
  if (!['receita', 'despesa'].includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'O valor deve ser maior que zero.' });
  }

  try {
    const [accountRows] = await pool.query('SELECT id FROM accounts WHERE id = ? AND user_id = ?', [account_id, req.userId]);
    const [categoryRows] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.userId]);
    if (accountRows.length === 0 || categoryRows.length === 0) {
      return res.status(400).json({ error: 'Conta ou categoria inválida.' });
    }

    const [result] = await pool.query(
      `INSERT INTO transactions (user_id, account_id, category_id, description, amount, type, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, account_id, category_id, description, amount, type, transaction_date]
    );
    res.status(201).json({ id: result.insertId, description, amount, type, transaction_date, account_id, category_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { description, amount, type, transaction_date, account_id, category_id } = req.body;

  if (!['receita', 'despesa'].includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE transactions
       SET description = ?, amount = ?, type = ?, transaction_date = ?, account_id = ?, category_id = ?
       WHERE id = ? AND user_id = ?`,
      [description, amount, type, transaction_date, account_id, category_id, id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    res.json({ id: Number(id), description, amount, type, transaction_date, account_id, category_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover transação.' });
  }
}

module.exports = { list, create, update, remove };
