# HealthTwin.AI — dev conveniences
# Usage: `make help` for the list of targets.

SHELL := /bin/bash
PY    ?= python3.12
COMPOSE ?= docker compose

.PHONY: help up down logs restart rebuild backend frontend mongo clean install run-local test smoke

help:
	@echo ""
	@echo "HealthTwin.AI — available targets"
	@echo "  make up             Start MongoDB + backend + frontend via docker compose"
	@echo "  make down           Stop and remove containers"
	@echo "  make logs           Tail logs from all services"
	@echo "  make restart        Restart every service"
	@echo "  make rebuild        Rebuild images and restart"
	@echo "  make backend        Follow backend logs"
	@echo "  make frontend       Follow frontend logs"
	@echo "  make mongo          Open a mongosh shell"
	@echo "  make clean          Down + remove volumes (wipes DB)"
	@echo "  make install        Local (non-docker) install: venv + pip + yarn"
	@echo "  make run-local      Run backend + frontend locally (needs 'make install')"
	@echo "  make smoke          Curl-based smoke test against the running API"
	@echo ""

# ---------- docker compose ----------
up:
	$(COMPOSE) up -d --build
	@echo ""
	@echo "▶ Backend : http://localhost:8001/api"
	@echo "▶ Frontend: http://localhost:3000"
	@echo "▶ Admin   : admin@healthtwin.ai / Admin@123"

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100

restart:
	$(COMPOSE) restart

rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

backend:
	$(COMPOSE) logs -f backend

frontend:
	$(COMPOSE) logs -f frontend

mongo:
	$(COMPOSE) exec mongo mongosh healthtwin

clean:
	$(COMPOSE) down -v

# ---------- local (non-docker) ----------
install:
	cd backend && $(PY) -m venv .venv \
	  && source .venv/bin/activate \
	  && pip install --upgrade pip \
	  && pip install -r requirements.txt \
	  && pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
	cd frontend && yarn install

run-local:
	@echo "Starting backend on :8001 and frontend on :3000 (Ctrl-C to stop)"
	@(cd backend && source .venv/bin/activate && uvicorn server:app --reload --host 0.0.0.0 --port 8001) & \
	 (cd frontend && yarn start) & \
	 wait

smoke:
	@echo "▶ Login as admin…"
	@curl -s -X POST http://localhost:8001/api/auth/login \
	  -H "Content-Type: application/json" \
	  -d '{"email":"admin@healthtwin.ai","password":"Admin@123"}' | python3 -m json.tool
