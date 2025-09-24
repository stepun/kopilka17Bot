const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.com';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'там';

  bot.sendMessage(
    chatId,
    `Привет, ${firstName}! 👋\n\nЯ помогу тебе копить на твою мечту! 🎯\n\n💰 Нажми "Открыть копилку" в меню бота, чтобы начать!`
  );
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;

    bot.sendMessage(
      chatId,
      '💰 Используй кнопку "Открыть копилку" в меню бота!'
    );
  }
});

console.log('Bot started...');