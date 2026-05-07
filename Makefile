.PHONY: dev install release

# Inicia todo o ecossistema (Backend, Web e Mobile) ao mesmo tempo em 1 terminal
dev:
	@echo "🚀 Iniciando os 3 servidores do Lava-Me simultaneamente..."
	@trap 'kill %1 %2 %3 2>/dev/null || true' EXIT; \
	(cd backend && ../venv/bin/python manage.py runserver) & \
	(cd web && npm start) & \
	(cd mobile && npm run dev) & \
	wait

# Instala todas as dependências de todos os projetos de uma vez
install:
	@echo "📦 Instalando todas as dependências..."
	cd web && npm install
	cd mobile && npm install
	cd backend && ../venv/bin/pip install -r requirements.txt

# Automação do GitFlow: Fecha a sprint, faz merge e publica no GitHub sozinho!
release:
	@if [ -z "$(v)" ] || [ -z "$(title)" ]; then \
		echo "Erro! Use o formato: make release v=3.0.0 title='Sprint 3 - Funcionalidade X'"; \
		exit 1; \
	fi
	@echo "🚀 Automatizando a Release $(v)..."
	git checkout develop
	git pull origin develop
	git checkout -b release/$(v)
	# Aqui você pode editar o README.md manualmente antes de rodar, o script fará o commit dele
	git add .
	git commit -m "docs: prepara release $(v)" || echo "Nenhuma alteração pendente"
	git checkout main
	git merge --no-ff release/$(v) -m "Merge release $(v)"
	git tag -a v$(v) -m "Release $(v) - $(title)"
	git checkout develop
	git merge --no-ff release/$(v) -m "Merge release $(v) de volta para develop"
	git push origin main develop --tags
	gh release create v$(v) --target main --title "Release $(v) - $(title)" --generate-notes
	@echo "✅ Release $(v) concluída e publicada no GitHub com sucesso!"
