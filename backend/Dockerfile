FROM python:3.11-slim

# Variáveis de ambiente para o Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependências do Sistema Operacional (PostgreSQL e libs para compilação)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar os requerimentos e instalar
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
# Instalando o gunicorn (servidor de produção) e o psycopg2 (adaptador Postgres)
RUN pip install gunicorn psycopg2-binary django-redis

# Copiar o restante do código
COPY . /app/

# Criar a pasta de logs (o Git ignora pastas vazias, o que causa erro no FileHandler do Django)
RUN mkdir -p /app/logs

# Expor a porta 8000
EXPOSE 8000

# O comando de execução real será definido no docker-compose
CMD ["gunicorn", "lava_me.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
