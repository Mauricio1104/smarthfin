const pool = require('../config/db');

async function list(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, type, color FROM categories WHERE user_id = ? ORDER BY type, name',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
}

async function create(req, res) {
  const { name, type, color } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo da categoria são obrigatórios.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)',
      [req.userId, name, type, color || '#6366f1']
    );
    res.status(201).json({ id: result.insertId, name, type, color: color || '#6366f1' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, type, color } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, type, color || '#6366f1', id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.json({ id: Number(id), name, type, color: color || '#6366f1' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover categoria.' });
  }
}

module.exports = { list, create, update, remove };
