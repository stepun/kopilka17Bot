const express = require('express');
const router = express.Router();
const { pool } = require('../database');

router.get('/user', async (req, res) => {
  const { id: telegram_id, username, first_name, last_name } = req.telegramUser;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    if (userResult.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO users (telegram_id, username, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [telegram_id, username, first_name, last_name]
      );
      res.json(insertResult.rows[0]);
    } else {
      res.json(userResult.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/goals', async (req, res) => {
  const telegram_id = req.telegramUser.id;

  try {
    const result = await pool.query(
      `SELECT g.* FROM goals g
       JOIN users u ON g.user_id = u.id
       WHERE u.telegram_id = $1 AND g.is_active = true
       ORDER BY g.created_at DESC`,
      [telegram_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/goal/:id', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const goalId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT g.* FROM goals g
       JOIN users u ON g.user_id = u.id
       WHERE u.telegram_id = $1 AND g.id = $2 AND g.is_active = true`,
      [telegram_id, goalId]
    );

    res.json(result.rows.length > 0 ? result.rows[0] : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/goal', async (req, res) => {
  const { name, target_amount, initial_amount = 0 } = req.body;
  const telegram_id = req.telegramUser.id;

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const goalResult = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, initial_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, name, target_amount, initial_amount, initial_amount]
    );

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, 'goal_created', $2)`,
      [userId, JSON.stringify({ goal_id: goalResult.rows[0].id, name, target_amount })]
    );

    res.json(goalResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transaction', async (req, res) => {
  const { type, amount, goal_id } = req.body;
  const telegram_id = req.telegramUser.id;

  if (!['deposit', 'withdrawal'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  if (!goal_id) {
    return res.status(400).json({ error: 'Goal ID is required' });
  }

  try {
    const goalResult = await pool.query(
      `SELECT g.*, u.id as user_id FROM goals g
       JOIN users u ON g.user_id = u.id
       WHERE u.telegram_id = $1 AND g.id = $2 AND g.is_active = true`,
      [telegram_id, goal_id]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];
    const newAmount = type === 'deposit'
      ? parseFloat(goal.current_amount) + amount
      : parseFloat(goal.current_amount) - amount;

    if (newAmount < 0) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Обновляем цель
    await pool.query(
      'UPDATE goals SET current_amount = $1 WHERE id = $2',
      [newAmount, goal.id]
    );

    // Записываем транзакцию
    await pool.query(
      `INSERT INTO transactions (goal_id, user_id, type, amount, balance_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [goal.id, goal.user_id, type, amount, newAmount]
    );

    // Логируем активность
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [goal.user_id, `transaction_${type}`, JSON.stringify({ amount, balance_after: newAmount })]
    );

    res.json({
      success: true,
      current_amount: newAmount,
      target_amount: goal.target_amount,
      progress: (newAmount / goal.target_amount) * 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await pool.query(
      `SELECT t.* FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN goals g ON t.goal_id = g.id
       WHERE u.telegram_id = $1 AND g.is_active = true
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [telegram_id, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/goal/:id', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const goalId = req.params.id;

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegram_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const goalResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2 AND is_active = true',
      [goalId, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];

    await pool.query(
      'UPDATE goals SET is_active = false WHERE id = $1',
      [goalId]
    );

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, 'goal_deleted', $2)`,
      [userId, JSON.stringify({ goal_id: goalId, name: goal.name })]
    );

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;