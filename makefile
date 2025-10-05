# 检查必要的命令是否存在
GIT := $(shell command -v git 2> /dev/null)
POETRY := $(shell command -v poetry 2> /dev/null)

# default port for cleaning/listening operations
PORT ?= 8000
# default front-end ports to stop (vite/dev servers)
PORTS ?= 3000 3001 3002 3003

# 自动让当前项目适配新的名字
setup:
	@echo "安装依赖..."
	@poetry install
	@echo "初始化项目..."
	@make configure-project

.PHONY: publish test

# 如果测试命令不存在，则跳过测试
test:
	@if [ -f "pytest" ] || [ -f "python -m pytest" ]; then \
		pytest; \
	else \
		echo "警告: 未找到测试命令，跳过测试"; \
	fi

report:
	poetry run allure serve tmp/allure_results

configure-project:
	@poetry run python scripts/configure_project.py

.PHONY: preprocess
preprocess:
	@echo "Converting CSV dataset to Parquet..."
	@poetry run python scripts/preprocess_to_parquet.py \
		--data-dir /Users/songshgeo/Documents/VSCode/WatM-DT/data \
		--out-dir /Users/songshgeo/Documents/VSCode/WatM-DT/data_parquet \
		--excel /Users/songshgeo/Documents/VSCode/WatM-DT/scenario_combinations3.xlsx

.PHONY: dash
dash:
	@echo "Starting Dash app at http://127.0.0.1:8050 ..."
	@poetry run python scripts/dash_app.py --data-parquet /Users/songshgeo/Documents/VSCode/WatM-DT/data_parquet --data-dir /Users/songshgeo/Documents/VSCode/WatM-DT/data --host 127.0.0.1 --port 8050

.PHONY: api
api:
	@echo "Starting FastAPI server at http://127.0.0.1:8000 ..."
	@poetry run uvicorn scripts.api_server:app --host 127.0.0.1 --port 8000

.PHONY: kill-port
kill-port:
	@echo "Scanning for processes listening on port $(PORT) ..."
	@pids=$$(lsof -nP -iTCP:$(PORT) -sTCP:LISTEN -t 2>/dev/null); \
	if [ -n "$$pids" ]; then \
		echo "Found PIDs: $$pids"; \
		kill $$pids || true; \
		sleep 1; \
		pids2=$$(lsof -nP -iTCP:$(PORT) -sTCP:LISTEN -t 2>/dev/null); \
		if [ -n "$$pids2" ]; then \
			echo "Force killing PIDs: $$pids2"; \
			kill -9 $$pids2 || true; \
		fi; \
	else \
		echo "No process is listening on port $(PORT)"; \
	fi

.PHONY: kill-vite
kill-vite:
	@echo "Stopping dev servers on ports: $(PORTS) ..."
	@for p in $(PORTS); do \
		echo "Checking port $$p ..."; \
		pids=$$(lsof -nP -iTCP:$$p -sTCP:LISTEN -t 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			echo "Found PIDs on $$p: $$pids"; \
			kill $$pids || true; \
			sleep 1; \
			pids2=$$(lsof -nP -iTCP:$$p -sTCP:LISTEN -t 2>/dev/null); \
			if [ -n "$$pids2" ]; then \
				echo "Force killing PIDs on $$p: $$pids2"; \
				kill -9 $$pids2 || true; \
			fi; \
		else \
			echo "No listener on $$p"; \
		fi; \
	done; \
	echo "Attempting to stop lingering vite/node dev processes (best-effort) ..."; \
	pkill -f "vite" 2>/dev/null || true; \
	pkill -f "node .*vite" 2>/dev/null || true; \
	echo "Done."
