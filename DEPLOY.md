# Деплой на Railway.app

Railway.app - самый простой способ развернуть Telegram бота с Mini App.

## Шаги деплоя:

### 1. Подготовка (уже готово ✅)
- ✅ `railway.json` - конфигурация Railway
- ✅ `Procfile` - процессы для запуска
- ✅ `package.json` - обновлен для продакшена

### 2. Загрузка на GitHub

```bash
# Инициализируйте git репозиторий
git init
git add .
git commit -m "Initial commit: Telegram savings tracker bot"

# Создайте репозиторий на GitHub и загрузите код
git remote add origin https://github.com/YOUR_USERNAME/savings-tracker-bot.git
git branch -M main
git push -u origin main
```

### 3. Регистрация на Railway

1. Откройте [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите "Deploy from GitHub repo"
5. Выберите ваш репозиторий `savings-tracker-bot`

### 4. Настройка переменных окружения

В Railway Dashboard добавьте Variables:

**Обязательные:**
- `BOT_TOKEN` = `8132949997:AAGkASXMhe6xBt97nXmYS7Wzq88e18533EM`
- `NODE_ENV` = `production`

**После деплоя добавьте:**
- `WEBAPP_URL` = `https://ваш-домен.railway.app` (Railway предоставит домен)

### 5. Деплой

1. Railway автоматически начнет деплой
2. Процесс займет 2-3 минуты
3. Получите URL вида: `https://savings-tracker-bot-production-XXXX.railway.app`
4. Добавьте этот URL в переменную `WEBAPP_URL`
5. Перезапустите сервис

### 6. Настройка бота в BotFather

1. Откройте [@BotFather](https://t.me/botfather)
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Нажмите "Bot Settings" → "Menu Button"
5. Укажите URL: `https://ваш-домен.railway.app`

### 7. Проверка

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Нажмите кнопку "💰 Открыть копилку"
5. Mini App должно открыться!

## Полезные команды Railway CLI (опционально)

```bash
# Установка CLI
npm install -g @railway/cli

# Логин
railway login

# Просмотр логов
railway logs

# Локальная разработка с переменными из Railway
railway run npm start
```

## Особенности бесплатного тарифа Railway

- ✅ Автоматические деплои из GitHub
- ✅ Custom домены
- ✅ 500 часов выполнения в месяц
- ✅ Автоматический SSL
- ⚠️ Засыпает после 30 минут бездействия

## Если что-то не работает

1. **Проверьте логи** в Railway Dashboard
2. **Убедитесь что переменные** `BOT_TOKEN` и `WEBAPP_URL` заданы правильно
3. **URL должен быть HTTPS** - Railway предоставляет его автоматически
4. **Перезапустите сервис** после изменения переменных

## Альтернативы

- **Render.com** - аналогично Railway, есть готовый `render.yaml`
- **Vercel** - только для фронтенда
- **Heroku** - платный после 2022 года