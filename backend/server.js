const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const db = require('./database');
const savingsRoutes = require('./routes/savings');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Telegram Bot
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.com';
const bot = new TelegramBot(token);

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
    // For testing, create a dummy user
    req.telegramUser = {
      id: 123456789,
      first_name: 'Test',
      username: 'testuser'
    };
    return next();
  }

  try {
    const initData = new URLSearchParams(telegramInitData);
    const user = JSON.parse(initData.get('user') || '{}');
    req.telegramUser = user;
  } catch (error) {
    // Fallback to dummy user if parsing fails
    req.telegramUser = {
      id: 123456789,
      first_name: 'Test',
      username: 'testuser'
    };
  }

  next();
});

// Telegram Bot Handlers
function handleBotMessage(msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'там';

  if (msg.text === '/start') {
    if (webAppUrl.startsWith('https://')) {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '💰 Открыть копилку',
            web_app: { url: webAppUrl }
          }
        ]]
      };

      bot.sendMessage(
        chatId,
        `Привет, ${firstName}! 👋\n\nЯ помогу тебе копить на твою мечту! 🎯\n\nНажми кнопку ниже, чтобы начать копить:`,
        { reply_markup: keyboard }
      );
    } else {
      bot.sendMessage(
        chatId,
        `Привет, ${firstName}! 👋\n\nЯ помогу тебе копить на твою мечту! 🎯\n\n⚠️ Для работы Mini App нужен HTTPS домен.\n📱 Пока что бот готов к работе в локальном режиме на: ${webAppUrl}\n\n🚀 Для полноценной работы нужно развернуть на Render.com или использовать ngrok.`
      );
    }
  } else if (msg.text && !msg.text.startsWith('/')) {
    if (webAppUrl.startsWith('https://')) {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '💰 Открыть копилку',
            web_app: { url: webAppUrl }
          }
        ]]
      };

      bot.sendMessage(
        chatId,
        'Используй кнопку ниже, чтобы открыть копилку:',
        { reply_markup: keyboard }
      );
    } else {
      bot.sendMessage(
        chatId,
        '💰 Копилка готова к работе!\n\n📱 Web интерфейс: ' + webAppUrl + '\n\n⚠️ Для Mini App нужен HTTPS домен.'
      );
    }
  }
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const update = req.body;

  if (update.message) {
    handleBotMessage(update.message);
  }

  res.sendStatus(200);
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