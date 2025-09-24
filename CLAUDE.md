# Копилка Бот - Telegram Mini App

## Описание проекта
Telegram Mini App для отслеживания накоплений на цели. Пользователи могут создавать цели, пополнять копилку, снимать средства и отслеживать прогресс с помощью визуального интерфейса.

## Технический стек

### Backend
- **Node.js** + **Express.js** - серверная часть
- **PostgreSQL** - база данных (с connection pooling)
- **node-telegram-bot-api** - интеграция с Telegram Bot API
- **dotenv** - управление переменными окружения

### Frontend
- **Vanilla JavaScript** - клиентская логика
- **CSS Grid/Flexbox** - адаптивная верстка
- **Telegram Web App SDK** - интеграция с Telegram
- **Haptic Feedback** - тактильная обратная связь

### Развертывание
- **Railway.app** - облачный хостинг
- **Docker** - контейнеризация
- **Git** - система контроля версий

## Функциональность

### Основные возможности
- ✅ Создание целей накопления
- ✅ Пополнение и снятие средств
- ✅ Визуальный прогресс-бар
- ✅ Управление несколькими целями
- ✅ Быстрое пополнение (шаблоны +100, +500, +1000)
- ✅ Удаление целей через UI
- ✅ Постоянное хранение данных
- ✅ Telegram Bot интеграция с меню кнопкой
- ✅ Упрощенные команды бота для навигации

### UI/UX особенности
- Интуитивный интерфейс в стиле Telegram
- Кнопки-корзинки для удаления целей
- Встроенная форма создания целей
- Accumulative amount templates
- Тематическая адаптация под Telegram

## Архитектура

### Структура проекта
```
kopilka_bot/
├── backend/
│   ├── server.js          # Главный сервер + Telegram Bot
│   ├── database.js        # Подключение к PostgreSQL
│   └── routes/
│       └── savings.js     # API маршруты
├── bot/
│   └── index.js          # Standalone бот (не используется)
├── frontend/
│   ├── index.html         # UI структура
│   ├── app.js            # Клиентская логика
│   └── styles.css        # Стили
├── Dockerfile            # Конфигурация Docker
├── Procfile              # Railway web service config
├── Procfile.bot          # Railway bot service config (резерв)
└── package.json          # Зависимости проекта
```

### База данных
- `users` - пользователи Telegram
- `goals` - цели накопления
- `transactions` - операции пополнения/снятия
- `activity_logs` - журнал активности

## Развертывание

### Railway.app
- **Web Service**: Express.js приложение с интегрированным Telegram Bot
- **PostgreSQL Service**: Постоянная база данных
- **Автоматический деплой**: из Git main ветки
- **Unified Architecture**: Бот и веб-приложение в одном процессе

### Переменные окружения
```
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://your-app.railway.app
NODE_ENV=production
DATABASE_URL=postgresql://...
```

## Безопасность
- Валидация Telegram InitData
- Параметризованные SQL запросы
- CORS настройки
- SSL/TLS для production

## Производительность
- Connection pooling для PostgreSQL
- Минимальные зависимости
- Оптимизированные SQL запросы
- Responsive UI без лишних библиотек

---

**Разработано с Claude Code** 🤖
Проект готов к использованию и масштабированию.