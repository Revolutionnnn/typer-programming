# ─────────────────────────────────────────────
#  Typing Code Learn – Makefile
# ─────────────────────────────────────────────
#  make dev      → levantar entorno de desarrollo
#  make prod     → levantar entorno de producción
#  make down     → parar todo
#  make logs     → ver logs en tiempo real
# ─────────────────────────────────────────────

# Detectar el binario de docker o podman
DOCKER_BIN ?= $(shell command -v podman 2>/dev/null || echo docker)

.PHONY: help dev dev-build dev-down prod prod-build prod-down down logs logs-api logs-web clean status restart-api restart-web

# ── Colores ──
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Mostrar esta ayuda
	@echo ""
	@echo "$(CYAN)═══ Typing Code Learn ═══$(RESET)"
	@echo ""
	@echo "Usando binario: $(DOCKER_BIN)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────
#  Development
# ─────────────────────────────────────────────

dev: ## Levantar en modo desarrollo (hot‑reload)
	@echo "$(CYAN)▶ Levantando entorno de DESARROLLO con $(DOCKER_BIN)...$(RESET)"
	$(DOCKER_BIN) compose --env-file .env.dev up --build

dev-build: ## Reconstruir imágenes de desarrollo
	$(DOCKER_BIN) compose --env-file .env.dev build --no-cache

dev-down: ## Parar entorno de desarrollo
	$(DOCKER_BIN) compose --env-file .env.dev down

dev-detach: ## Levantar dev en background
	$(DOCKER_BIN) compose --env-file .env.dev up --build -d

# ─────────────────────────────────────────────
#  Production
# ─────────────────────────────────────────────

prod: ## Levantar en modo producción
	@echo "$(CYAN)▶ Levantando entorno de PRODUCCIÓN con $(DOCKER_BIN)...$(RESET)"
	@if [ ! -f .env.prod ]; then \
		echo "$(GREEN)⚠  No se encontró .env.prod — copiando desde .env.prod.example$(RESET)"; \
		cp .env.prod.example .env.prod; \
		echo "$(GREEN)   Edita .env.prod con tus valores reales antes de exponer a internet.$(RESET)"; \
	fi
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

prod-build: ## Reconstruir imágenes de producción
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

prod-down: ## Parar entorno de producción
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod down

# ─────────────────────────────────────────────
#  Utilidades
# ─────────────────────────────────────────────

down: ## Parar TODOS los contenedores (dev + prod)
	$(DOCKER_BIN) compose --env-file .env.dev down 2>/dev/null || true
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod down 2>/dev/null || true

logs: ## Ver logs en tiempo real (dev)
	$(DOCKER_BIN) compose --env-file .env.dev logs -f

logs-prod: ## Ver logs en tiempo real (prod)
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod logs -f

logs-api: ## Ver logs solo de la API
	$(DOCKER_BIN) compose --env-file .env.dev logs -f api

logs-web: ## Ver logs solo del frontend
	$(DOCKER_BIN) compose --env-file .env.dev logs -f web

status: ## Ver estado de los contenedores
	@echo "$(CYAN)── Desarrollo ──$(RESET)"
	@$(DOCKER_BIN) compose --env-file .env.dev ps 2>/dev/null || echo "  (no hay contenedores de dev)"
	@echo ""
	@echo "$(CYAN)── Producción ──$(RESET)"
	@$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod ps 2>/dev/null || echo "  (no hay contenedores de prod)"

restart-api: ## Reiniciar solo la API (dev)
	$(DOCKER_BIN) compose --env-file .env.dev restart api

restart-web: ## Reiniciar solo el frontend (dev)
	$(DOCKER_BIN) compose --env-file .env.dev restart web

clean: ## Limpiar imágenes, volúmenes y cache de docker/podman
	@echo "$(CYAN)▶ Limpiando todo...$(RESET)"
	$(DOCKER_BIN) compose --env-file .env.dev down -v --rmi local 2>/dev/null || true
	$(DOCKER_BIN) compose -f docker-compose.prod.yml --env-file .env.prod down -v --rmi local 2>/dev/null || true
	$(DOCKER_BIN) system prune -f
