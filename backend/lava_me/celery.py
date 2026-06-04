import os
from celery import Celery

# Define o módulo de configurações padrão do Django para o Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')

app = Celery('lava_me')

# Usa string para que os workers não precisem serializar as configurações do Django.
# O namespace 'CELERY' significa que todas as chaves de configuração devem começar com 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carrega tasks de todas as aplicações registradas no INSTALLED_APPS
app.autodiscover_tasks()
