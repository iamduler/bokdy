-include .env
export

export PATH := $(PATH):$(shell go env GOPATH)/bin

BACKEND_DIR=backend
MIGRATION_PATH=./$(BACKEND_DIR)/migrations
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)

GOOSE ?= $(shell command -v goose 2>/dev/null || echo "$(shell go env GOPATH)/bin/goose")
SQLC ?= $(shell command -v sqlc 2>/dev/null || echo "$(shell go env GOPATH)/bin/sqlc")

ENV_FILE=.env
NOAPP_COMPOSE_FILE=deployments/docker-compose.noapp.yml
DEV_COMPOSE_FILE=deployments/docker-compose.dev.yml

server:
	go -C $(BACKEND_DIR) run ./cmd/api

worker:
	go -C $(BACKEND_DIR) run ./cmd/worker

migrate_up:
	$(GOOSE) -dir $(MIGRATION_PATH) postgres "$(DATABASE_URL)" up

migrate_down:
	$(GOOSE) -dir $(MIGRATION_PATH) postgres "$(DATABASE_URL)" down

migrate_status:
	$(GOOSE) -dir $(MIGRATION_PATH) postgres "$(DATABASE_URL)" status

migrate_create:
	$(GOOSE) -dir $(MIGRATION_PATH) create $(name) sql

install_tools:
	go install github.com/pressly/goose/v3/cmd/goose@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

db_create:
	bash ./scripts/create-db.sh

db_setup: db_create migrate_up seed

seed:
	go -C $(BACKEND_DIR) run ./cmd/seed

sqlc:
	cd $(BACKEND_DIR) && $(SQLC) generate

test:
	go -C $(BACKEND_DIR) test ./...

vet:
	go -C $(BACKEND_DIR) vet ./...

check: vet test build

build:
	go -C $(BACKEND_DIR) build -o bin/api ./cmd/api
	go -C $(BACKEND_DIR) build -o bin/worker ./cmd/worker

noapp:
	docker compose -f $(NOAPP_COMPOSE_FILE) down
	docker compose -f $(NOAPP_COMPOSE_FILE) --env-file $(ENV_FILE) up -d --build

stop_noapp:
	docker compose -f $(NOAPP_COMPOSE_FILE) down

dev:
	docker compose -f $(DEV_COMPOSE_FILE) down
	docker compose -f $(DEV_COMPOSE_FILE) --env-file $(ENV_FILE) up --build

.PHONY: server worker migrate_up migrate_down migrate_status migrate_create install_tools
.PHONY: db_create db_setup seed sqlc test vet check build noapp stop_noapp dev
