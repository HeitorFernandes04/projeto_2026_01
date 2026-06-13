from django.apps import AppConfig


class OperacaoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'operacao'

    def ready(self):
        import operacao.signals
