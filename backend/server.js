const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./database');
const savingsRoutes = require('./routes/savings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

function validateTelegramWebAppData(telegramInitData) {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  initData.delete('hash');

  const dataCheckString = Array.from(initData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN || '')
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

app.use('/api', (req, res, next) => {
  const telegramInitData = req.headers['x-telegram-init-data'];

  if (!telegramInitData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!validateTelegramWebAppData(telegramInitData)) {
    return res.status(401).json({ error: 'Invalid data' });
  }

  const initData = new URLSearchParams(telegramInitData);
  const user = JSON.parse(initData.get('user') || '{}');
  req.telegramUser = user;

  next();
});

app.use('/api/savings', savingsRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});