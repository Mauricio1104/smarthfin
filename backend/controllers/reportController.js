const pool = require('../config/db');

async function summary(req, res) {
  try {
    const [[{ total_initial }]] = await pool.query(
      'SELECT COALESCE(SUM(initial_balance), 0) AS total_initial FROM accounts WHERE user_id = ?',
      [req.userId]
    );
    const [[{ total_receitas }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_receitas FROM transactions WHERE user_id = ? AND type = 'receita'",
      [req.userId]
    );
    const [[{ total_despesas }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_despesas FROM transactions WHERE user_id = ? AND type = 'despesa'",
      [req.userId]
    );

    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [[{ receitas_mes }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS receitas_mes FROM transactions WHERE user_id = ? AND type = 'receita' AND transaction_date >= ?",
      [req.userId, firstDay]
    );
    const [[{ despesas_mes }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS despesas_mes FROM transactions WHERE user_id = ? AND type = 'despesa' AND transaction_date >= ?",
      [req.userId, firstDay]
    );

    res.json({
      saldo_total: Number(total_initial) + Number(total_receitas) - Number(total_despesas),
      receitas_mes: Number(receitas_mes),
      despesas_mes: Number(despesas_mes),
      saldo_mes: Number(receitas_mes) - Number(despesas_mes)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro.' });
  }
}

async function byCategory(req, res) {
  const { start_date, end_date, type } = req.query;
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
  if (type) {
    conditions.push('t.type = ?');
    params.push(type);
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.id AS category_id, c.name AS category_name, c.color, t.type, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY c.id, t.type
       ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório por categoria.' });
  }
}

async function monthly(req, res) {
  const months = Number(req.query.months) || 6;
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
              SUM(CASE WHEN type = 'receita' THEN amount ELSE 0 END) AS receitas,
              SUM(CASE WHEN type = 'despesa' THEN amount ELSE 0 END) AS despesas
       FROM transactions
       WHERE user_id = ? AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [req.userId, months]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório mensal.' });
  }
}

module.exports = { summary, byCategory, monthly };
