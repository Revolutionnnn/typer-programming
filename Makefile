# ─────────────────────────────────────────────
#  Typing Code Learn – Makefile
# ─────────────────────────────────────────────
#  make dev      → levantar entorno de desarrollo
#  make prod     → levantar entorno de producción
#  make down     → parar todo
#  make logs     → ver logs en tiempo real
# ─────────────────────────────────────────────

.PHONY: help dev dev-build dev-down prod prod-build prod-down down logs logs-api logs-web clean status restart-api restart-web

# ── Colores ──
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

# ── Container engine / compose ──
# Auto-detect: prefer podman, fallback to docker, then docker-compose.
ENGINE := $(shell if command -v podman >/dev/null 2>&1; then echo podman; elif command -v docker >/dev/null 2>&1; then echo docker; else echo ""; fi)
COMPOSE := $(shell if command -v podman >/dev/null 2>&1; then echo "podman compose"; elif command -v docker >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo ""; fi)

help: ## Mostrar esta ayuda
	@echo ""
	@echo "$(CYAN)═══ Typing Code Learn ═══$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────
#  Development
# ─────────────────────────────────────────────

dev: ## Levantar en modo desarrollo (hot‑reload)
	@echo "$(CYAN)▶ Levantando entorno de DESARROLLO...$(RESET)"
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev up --build

dev-build: ## Reconstruir imágenes de desarrollo
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev build --no-cache

dev-down: ## Parar entorno de desarrollo
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev down

dev-detach: ## Levantar dev en background
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev up --build -d

# ─────────────────────────────────────────────
#  Production
# ─────────────────────────────────────────────

prod: ## Levantar en modo producción
	@echo "$(CYAN)▶ Levantando entorno de PRODUCCIÓN...$(RESET)"
	@if [ ! -f .env.prod ]; then \
		echo "$(GREEN)⚠  No se encontró .env.prod — copiando desde .env.prod.example$(RESET)"; \
		cp .env.prod.example .env.prod; \
		echo "$(GREEN)   Edita .env.prod con tus valores reales antes de exponer a internet.$(RESET)"; \
	fi
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod up --build -d

prod-build: ## Reconstruir imágenes de producción
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod build --no-cache

prod-down: ## Parar entorno de producción
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down

# ─────────────────────────────────────────────
#  Utilidades
# ─────────────────────────────────────────────

down: ## Parar TODOS los contenedores (dev + prod)
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev down 2>/dev/null || true
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down 2>/dev/null || true

logs: ## Ver logs en tiempo real (dev)
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev logs -f

logs-prod: ## Ver logs en tiempo real (prod)
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f

logs-api: ## Ver logs solo de la API
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev logs -f api

logs-web: ## Ver logs solo del frontend
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev logs -f web

status: ## Ver estado de los contenedores
	@echo "$(CYAN)── Desarrollo ──$(RESET)"
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	@$(COMPOSE) --env-file .env.dev ps 2>/dev/null || echo "  (no hay contenedores de dev)"
	@echo ""
	@echo "$(CYAN)── Producción ──$(RESET)"
	@$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod ps 2>/dev/null || echo "  (no hay contenedores de prod)"

restart-api: ## Reiniciar solo la API (dev)
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev restart api

restart-web: ## Reiniciar solo el frontend (dev)
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev restart web

clean: ## Limpiar imágenes, volúmenes y cache de podman
	@echo "$(CYAN)▶ Limpiando todo...$(RESET)"
	@if [ -z "$(COMPOSE)" ]; then echo "No se encontró podman/docker/docker-compose en PATH"; exit 127; fi
	$(COMPOSE) --env-file .env.dev down -v --rmi local 2>/dev/null || true
	$(COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down -v --rmi local 2>/dev/null || true
	@if [ -n "$(ENGINE)" ]; then $(ENGINE) system prune -f; fi
