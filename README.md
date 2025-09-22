# Telegram Бот "Копилка"

Telegram Mini App для отслеживания накоплений на цели.

## Функционал

- Создание цели накопления с указанием суммы
- Пополнение и снятие средств
- Визуальный прогресс-бар
- История транзакций
- Полная интеграция с Telegram

## Быстрый запуск через Docker

### Требования
- Docker и Docker Compose
- Telegram Bot Token от [@BotFather](https://t.me/botfather)

### Запуск за 3 шага

1. **Клонируйте проект и настройте переменные:**
```bash
git clone <your-repo-url>
cd savings-bot
cp .env.example .env
# Отредактируйте .env - добавьте BOT_TOKEN
```

2. **Запустите для разработки:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

3. **Или запустите production версию:**
```bash
docker-compose up -d --build
```

Приложение будет доступно на http://localhost:3000

### Команды Docker

```bash
# Запуск в фоне
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f

# Перезапуск сервисов
docker-compose restart

# Пересборка после изменений
docker-compose up --build
```

## Установка без Docker

### 1. Создание Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Выберите имя и username для бота
4. Сохраните полученный токен

### 2. Настройка проекта

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd savings-bot

# Установите зависимости
npm install

# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env файл
# BOT_TOKEN=ваш_токен_от_BotFather
# WEBAPP_URL=ваш_домен (например: https://your-app.render.com)
# PORT=3000
```

### 3. Локальный запуск

```bash
# Запуск сервера
npm start

# В отдельном терминале запуск бота
npm run bot

# Для разработки (с автоперезапуском)
npm run dev
```

## Деплой на Render.com (БЕСПЛАТНО)

### Шаг 1: Подготовка

1. Создайте аккаунт на [Render.com](https://render.com)
2. Загрузите проект на GitHub

### Шаг 2: Создание Web Service

1. В Render Dashboard нажмите "New +"
2. Выберите "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте:
   - **Name**: savings-tracker-bot
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Шаг 3: Переменные окружения

В настройках сервиса добавьте Environment Variables:
- `BOT_TOKEN` - токен вашего бота
- `WEBAPP_URL` - URL вашего сервиса (будет вида https://savings-tracker-bot.onrender.com)
- `PORT` - оставьте пустым (Render сам установит)

### Шаг 4: Настройка бота

1. После деплоя скопируйте URL вашего приложения
2. В BotFather выполните:
   - `/mybots`
   - Выберите вашего бота
   - `Bot Settings`
   - `Menu Button`
   - Введите URL вашего приложения

### Шаг 5: Запуск бота отдельно

Для запуска бота можно использовать отдельный сервис:
- Создайте второй Web Service для бота
- Start Command: `node bot/index.js`
- Или используйте Background Worker на Render

## Альтернативные варианты деплоя

### Railway.app
1. Зарегистрируйтесь на [Railway](https://railway.app)
2. Создайте новый проект из GitHub
3. Добавьте переменные окружения
4. Деплой автоматический

### Vercel (только для frontend)
1. Backend разместите на Render
2. Frontend на Vercel для лучшей производительности

### VPS (DigitalOcean, Hetzner)
```bash
# На сервере
git clone <repo>
cd savings-bot
npm install
npm install -g pm2

# Запуск через PM2
pm2 start backend/server.js --name api
pm2 start bot/index.js --name bot
pm2 save
pm2 startup
```

## Структура проекта

```
savings-bot/
├── backend/
│   ├── server.js        # Express сервер
│   ├── database.js      # SQLite база данных
│   └── routes/
│       └── savings.js   # API endpoints
├── frontend/
│   ├── index.html       # Mini App интерфейс
│   ├── styles.css       # Стили
│   └── app.js          # Клиентская логика
├── bot/
│   └── index.js        # Telegram бот
├── package.json
└── .env.example
```

## API Endpoints

- `GET /api/savings/user` - Получить/создать пользователя
- `GET /api/savings/goal` - Получить активную цель
- `POST /api/savings/goal` - Создать новую цель
- `POST /api/savings/transaction` - Добавить транзакцию
- `GET /api/savings/transactions` - История транзакций

## Безопасность

- Все запросы проверяются через Telegram InitData
- База данных SQLite хранится локально
- Для продакшена рекомендуется PostgreSQL

## Поддержка

Для вопросов создайте issue в репозитории.