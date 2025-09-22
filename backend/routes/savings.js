const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/user', async (req, res) => {
  const { id: telegram_id, username, first_name, last_name } = req.telegramUser;

  db.get(
    'SELECT * FROM users WHERE telegram_id = ?',
    [telegram_id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!user) {
        db.run(
          'INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
          [telegram_id, username, first_name, last_name],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              id: this.lastID,
              telegram_id,
              username,
              first_name,
              last_name
            });
          }
        );
      } else {
        res.json(user);
      }
    }
  );
});

router.get('/goals', async (req, res) => {
  const telegram_id = req.telegramUser.id;

  db.all(
    `SELECT g.* FROM goals g
     JOIN users u ON g.user_id = u.id
     WHERE u.telegram_id = ? AND g.is_active = 1
     ORDER BY g.created_at DESC`,
    [telegram_id],
    (err, goals) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(goals || []);
    }
  );
});

router.get('/goal/:id', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const goalId = req.params.id;

  db.get(
    `SELECT g.* FROM goals g
     JOIN users u ON g.user_id = u.id
     WHERE u.telegram_id = ? AND g.id = ? AND g.is_active = 1`,
    [telegram_id, goalId],
    (err, goal) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(goal || null);
    }
  );
});

router.post('/goal', async (req, res) => {
  const { name, target_amount, initial_amount = 0 } = req.body;
  const telegram_id = req.telegramUser.id;

  db.get(
    'SELECT id FROM users WHERE telegram_id = ?',
    [telegram_id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      db.run(
        `INSERT INTO goals (user_id, name, target_amount, current_amount, initial_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, name, target_amount, initial_amount, initial_amount],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });

          db.run(
            `INSERT INTO activity_logs (user_id, action, details)
             VALUES (?, 'goal_created', ?)`,
            [user.id, JSON.stringify({ goal_id: this.lastID, name, target_amount })],
            () => {
              res.json({
                id: this.lastID,
                name,
                target_amount,
                current_amount: initial_amount,
                initial_amount
              });
            }
          );
        }
      );
    }
  );
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

  db.get(
    `SELECT g.*, u.id as user_id FROM goals g
     JOIN users u ON g.user_id = u.id
     WHERE u.telegram_id = ? AND g.id = ? AND g.is_active = 1`,
    [telegram_id, goal_id],
    (err, goal) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!goal) return res.status(404).json({ error: 'Goal not found' });

      const newAmount = type === 'deposit'
        ? goal.current_amount + amount
        : goal.current_amount - amount;

      if (newAmount < 0) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      db.serialize(() => {
        db.run(
          'UPDATE goals SET current_amount = ? WHERE id = ?',
          [newAmount, goal.id]
        );

        db.run(
          `INSERT INTO transactions (goal_id, user_id, type, amount, balance_after)
           VALUES (?, ?, ?, ?, ?)`,
          [goal.id, goal.user_id, type, amount, newAmount]
        );

        db.run(
          `INSERT INTO activity_logs (user_id, action, details)
           VALUES (?, ?, ?)`,
          [goal.user_id, `transaction_${type}`, JSON.stringify({ amount, balance_after: newAmount })],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              success: true,
              current_amount: newAmount,
              target_amount: goal.target_amount,
              progress: (newAmount / goal.target_amount) * 100
            });
          }
        );
      });
    }
  );
});

router.get('/transactions', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const limit = parseInt(req.query.limit) || 10;

  db.all(
    `SELECT t.* FROM transactions t
     JOIN users u ON t.user_id = u.id
     JOIN goals g ON t.goal_id = g.id
     WHERE u.telegram_id = ? AND g.is_active = 1
     ORDER BY t.created_at DESC
     LIMIT ?`,
    [telegram_id, limit],
    (err, transactions) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(transactions || []);
    }
  );
});

router.delete('/goal/:id', async (req, res) => {
  const telegram_id = req.telegramUser.id;
  const goalId = req.params.id;

  db.get(
    'SELECT id FROM users WHERE telegram_id = ?',
    [telegram_id],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      db.get(
        'SELECT * FROM goals WHERE id = ? AND user_id = ? AND is_active = 1',
        [goalId, user.id],
        (err, goal) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!goal) return res.status(404).json({ error: 'Goal not found' });

          db.run(
            'UPDATE goals SET is_active = 0 WHERE id = ?',
            [goalId],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              db.run(
                `INSERT INTO activity_logs (user_id, action, details)
                 VALUES (?, 'goal_deleted', ?)`,
                [user.id, JSON.stringify({ goal_id: goalId, name: goal.name })],
                () => {
                  res.json({ success: true, message: 'Goal deleted successfully' });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;