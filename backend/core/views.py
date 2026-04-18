# core/views.py
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Servico, TagPeca
from .serializers import ServicoSerializer, TagPecaSerializer
from accounts.models import Estabelecimento
from .services import EstabelecimentoService, ServicoService
from .permissions import IsGestorOrReadOnlyFuncionario

class ServicoViewSet(viewsets.ModelViewSet):
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated, IsGestorOrReadOnlyFuncionario]

    def get_queryset(self):
        user = self.request.user
        # Obter o estabelecimento do usuário logado (Gestor ou Funcionário)
        estabelecimento = None
        if hasattr(user, 'perfil_gestor'):
            estabelecimento = user.perfil_gestor.estabelecimento
        elif hasattr(user, 'perfil_funcionario'):
            estabelecimento = user.perfil_funcionario.estabelecimento
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Usuário sem estabelecimento vinculado.")

        return Servico.objects.filter(
            estabelecimento=estabelecimento, 
            is_active=True
        )
            
    def perform_create(self, serializer):
        """Usa ServicoService para criar serviço com validações de negócio"""
        try:
            dados_servico = serializer.validated_data.copy()
            servico = ServicoService.criar_servico(self.request.user, dados_servico)
            # Atualiza o serializer com a instância criada
            serializer.instance = servico
        except (ValidationError, PermissionDenied) as e:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(str(e))

    def destroy(self, request, *args, **kwargs):
        """Soft Delete - marca is_active=False em vez de remover"""
        try:
            instance = self.get_object()
            ServicoService.soft_delete_servico(request.user, instance.id)
            return Response(status=204)
        except (ValidationError, PermissionDenied) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )


class ServicoListView(generics.ListAPIView):
    """Lista serviços ativos do estabelecimento do usuário."""
    permission_classes = [IsAuthenticated]
    serializer_class = ServicoSerializer

    def get_queryset(self):
        return Servico.objects.filter(
            estabelecimento=self.request.user.estabelecimento,
            is_active=True
        ).order_by('nome')


class TagPecaListView(generics.ListAPIView):
    """Lista tags de peça do estabelecimento do usuário."""
    permission_classes = [IsAuthenticated]
    serializer_class = TagPecaSerializer

    def get_queryset(self):
        return TagPeca.objects.filter(
            estabelecimento=self.request.user.estabelecimento
        ).order_by('nome')


class GestaoViewSet(viewsets.ViewSet):
    """
    ViewSet unificado para gestão do estabelecimento (RF-13)
    Endpoint: /api/gestao/estabelecimento/
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'])
    def estabelecimento(self, request):
        """
        GET /api/gestao/estabelecimento/ - Retorna dados do estabelecimento
        PATCH /api/gestao/estabelecimento/ - Atualiza dados do estabelecimento
        """
        if request.method == 'GET':
            # Retorna dados do estabelecimento do usuário logado
            estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(request.user)
            
            data = {
                'id': estabelecimento.id,
                'nome_fantasia': estabelecimento.nome_fantasia,
                'cnpj': estabelecimento.cnpj,
                'endereco_completo': estabelecimento.endereco_completo,
                'is_active': estabelecimento.is_active
            }
            return Response(data)
        
        elif request.method == 'PATCH':
            # Atualiza dados do estabelecimento (RF-13)
            try:
                dados_atualizacao = request.data
                
                # Validação de campos permitidos
                campos_permitidos = ['nome_fantasia', 'cnpj', 'endereco_completo']
                dados_filtrados = {
                    k: v for k, v in dados_atualizacao.items() 
                    if k in campos_permitidos
                }
                
                if not dados_filtrados:
                    return Response(
                        {'error': 'Nenhum campo válido fornecido para atualização.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                estabelecimento = EstabelecimentoService.atualizar_dados_estabelecimento(
                    request.user, dados_filtrados
                )
                
                # CA-05: Dados refletidos imediatamente na resposta
                data = {
                    'id': estabelecimento.id,
                    'nome_fantasia': estabelecimento.nome_fantasia,
                    'cnpj': estabelecimento.cnpj,
                    'endereco_completo': estabelecimento.endereco_completo,
                    'is_active': estabelecimento.is_active,
                    'message': 'Dados atualizados com sucesso.'
                }
                return Response(data)
                
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except PermissionDenied as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_403_FORBIDDEN
                )
            except Exception as e:
                return Response(
                    {'error': 'Erro interno do servidor.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )