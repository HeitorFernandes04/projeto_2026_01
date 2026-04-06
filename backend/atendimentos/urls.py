# atendimentos/urls.py
from django.urls import path
from .views import (
    CriarAtendimentoView,
    AtendimentosHojeView,
    HistoricoAtendimentosView,
    HorariosLivresView,
    ServicoListView,
    AtendimentoDetailView,
    IniciarAtendimentoView,
    FinalizarAtendimentoView,
    FotoUploadView,
    AdicionarComentarioView,
)

urlpatterns = [
    # 1. Coloque caminhos específicos e fixos PRIMEIRO
    path('hoje/', AtendimentosHojeView.as_view(), name='atendimentos-hoje'),
    path('historico/', HistoricoAtendimentosView.as_view(), name='atendimentos-historico'),
    path('horarios-livres/', HorariosLivresView.as_view(), name='horarios-livres'),
    path('servicos/', ServicoListView.as_view(), name='servico-list'),

    # 2. A rota vazia para o POST (Criação) deve vir depois das fixas
    path('', CriarAtendimentoView.as_view(), name='atendimento-criar'),

    # 3. Rotas com parâmetros (como <int:pk>) SEMPRE por último
    path('<int:pk>/', AtendimentoDetailView.as_view(), name='atendimento-detail'),
    path('<int:pk>/iniciar/', IniciarAtendimentoView.as_view(), name='atendimento-iniciar'),
    path('<int:pk>/finalizar/', FinalizarAtendimentoView.as_view(), name='atendimento-finalizar'),
    path('<int:pk>/fotos/', FotoUploadView.as_view(), name='atendimento-fotos'),
    path('<int:pk>/comentario/', AdicionarComentarioView.as_view(), name='atendimento-comentario'),
]