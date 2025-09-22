const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://your-app.com';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'там';

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
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;

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
});

console.log('Bot started...');