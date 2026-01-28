.PHONY: build up down logs restart clean dev prod

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

dev:
	docker-compose -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.dev.yml up --build

prod:
	docker-compose up -d

prod-build:
	docker-compose up -d --build

stop:
	docker-compose down

stop-dev:
	docker-compose -f docker-compose.dev.yml down










