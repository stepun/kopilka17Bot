.PHONY: help build up down logs restart clean dev prod

help:
	@echo "Доступные команды:"
	@echo "  make dev    - Запуск в режиме разработки"
	@echo "  make prod   - Запуск в production режиме"
	@echo "  make down   - Остановка всех контейнеров"
	@echo "  make logs   - Просмотр логов"
	@echo "  make clean  - Полная очистка (контейнеры + образы)"

dev:
	docker-compose -f docker-compose.dev.yml up --build

prod:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v --rmi all