# Local Docker workflows. "prod" means the production-style local Compose
# configuration, not a deployable production environment.
ENV ?= dev
SVC ?=
NO_CACHE ?= 0
CONFIRM ?=

ifneq ($(filter $(ENV),dev prod),$(ENV))
$(error ENV must be dev or prod (got '$(ENV)'))
endif

DC = docker compose -f compose.yaml $(if $(filter dev,$(ENV)),-f compose.dev.yaml)
INFRA = db keycloak workflow-engine object-storage

.PHONY: help setup up down down-v purge restart ps build rebuild pull logs sh exec \
	infra-up infra-stop test test-api test-web migrate seed lint lint-api lint-web \
	typecheck typecheck-api typecheck-web clean prune guard-dev guard-svc

help: ## Show available commands
	@printf '%s\n' \
		'Usage: make <target> [ENV=dev|prod] [SVC=service] [NO_CACHE=1]' \
		'Default ENV=dev; ENV=prod uses compose.yaml only (local, not a production deployment).' \
		'' \
		'Lifecycle: setup up down restart ps infra-up infra-stop' \
		'Build:     build rebuild pull                  (SVC optional; NO_CACHE=1 for build/rebuild)' \
		'Debug:     logs sh exec                      (SVC optional for logs; required for sh/exec)' \
		'App/DB:    test test-api test-web migrate seed lint lint-api lint-web' \
		'           typecheck typecheck-api typecheck-web' \
		'Cleanup:   clean purge prune                 (purge/prune require CONFIRM=...)' \
		'' \
		'Examples:  make up; make logs SVC=api; make build SVC=web NO_CACHE=1' \
		'           make purge CONFIRM=delete-data; make prune CONFIRM=prune-global'

setup: ## Create .env without overwriting an existing one
	@if [ -e .env ]; then \
		printf '%s\n' '.env already exists; leaving it unchanged'; \
	else \
		cp .env.example .env; \
		printf '%s\n' 'Created .env; replace sample passwords before starting'; \
	fi

up: ## Start the selected stack and wait for healthchecks
	$(DC) up -d --wait

down: ## Stop the selected stack; preserve volumes
	$(DC) down

restart: ## Restart all services or SVC=api
	$(DC) restart $(SVC)

ps: ## Show services and health status
	$(DC) ps

infra-up: ## Start the infrastructure services and their dependencies
	$(DC) up -d --wait $(INFRA)

infra-stop: ## Stop infrastructure services (apps may become unhealthy)
	$(DC) stop $(INFRA) keycloak-db workflow-db

build: ## Build images, optionally SVC=api and/or NO_CACHE=1
	$(DC) build $(if $(filter 1,$(NO_CACHE)),--no-cache) $(SVC)

rebuild: ## Rebuild and start; NO_CACHE=1 forces a clean image build
ifeq ($(NO_CACHE),1)
	$(DC) build --no-cache $(SVC)
	$(DC) up -d --wait $(SVC)
else
	$(DC) up -d --build --wait $(SVC)
endif

pull: ## Pull registry images (skip locally buildable services)
	$(DC) pull --ignore-buildable $(SVC)

logs: ## Follow logs of all services or SVC=api
	$(DC) logs -f --tail=100 $(SVC)

guard-svc:
	@test -n "$(SVC)" || { printf '%s\n' 'Set SVC, e.g. make sh SVC=api' >&2; exit 1; }

sh exec: guard-svc ## Open a shell in a running service (SVC required)
	$(DC) exec $(SVC) sh

guard-dev:
	@test "$(ENV)" = dev || { printf '%s\n' 'This task needs dev dependencies; use ENV=dev' >&2; exit 1; }

test: test-api test-web ## Run both app test suites in running dev containers

test-api: guard-dev
	$(DC) exec -T api npm test -- --runInBand

test-web: guard-dev
	$(DC) exec -T web npm test

migrate: ## Run API migrations in the running container
ifeq ($(ENV),dev)
	$(DC) exec -T api npm run db:migrate
else
	$(DC) exec -T api npm run db:migrate:prod
endif

seed: ## Seed demo auth data; set DEMO_USER_PASSWORD in .env first
	$(DC) --profile demo run --rm auth-demo-seed

lint: lint-api lint-web ## Lint both apps without auto-fixing files

lint-api: guard-dev
	$(DC) exec -T api npm exec -- eslint '{src,apps,libs,test}/**/*.ts'

lint-web: guard-dev
	$(DC) exec -T web npm run lint

typecheck: typecheck-api typecheck-web ## Type-check both apps

typecheck-api: guard-dev
	$(DC) exec -T api npm exec -- tsc --noEmit --incremental false --project tsconfig.build.json

typecheck-web: guard-dev
	$(DC) exec -T web npm run type-check

clean: ## Remove this project's containers/networks and orphans; keep volumes
	$(DC) down --remove-orphans

down-v purge: ## DANGER: delete this project's persistent volumes (DB/storage)
	@test "$(CONFIRM)" = delete-data || { printf '%s\n' 'This deletes local DB/storage data. Run: make purge CONFIRM=delete-data' >&2; exit 1; }
	$(DC) down --volumes --remove-orphans

prune: ## DANGER: prune unused resources across ALL Docker projects (not volumes)
	@test "$(CONFIRM)" = prune-global || { printf '%s\n' 'This affects all Docker projects. Run: make prune CONFIRM=prune-global' >&2; exit 1; }
	docker system prune --force
