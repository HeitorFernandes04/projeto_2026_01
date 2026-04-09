from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
import datetime
from datetime import timedelta
from django.shortcuts import get_object_or_404
from .services import AtendimentoService, MidiaAtendimentoService
from .serializers import CriarAtendimentoSerializer
from .models import OrdemServico, EtapaOS, MaterialOS, Atendimento
from .serializers import (
    OrdemServicoSerializer,
    CriarOrdemServicoSerializer,
    AtualizarOrdemServicoSerializer,
    FinalizarOSSerializer,
    EtapaOSSerializer,
    MaterialOSSerializer,
    AtendimentoSerializer,
)


class OrdemServicoViewSet(viewsets.ModelViewSet):
    """ViewSet para Ordem de Serviço com endpoints completos"""
    serializer_class = OrdemServicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OrdemServico.objects.select_related(
            'atendimento__veiculo', 
            'atendimento__servico',
            'funcionario'
        ).prefetch_related('etapas', 'materiais')

        # Filtros
        status_param = self.request.query_params.get('status')
        atendimento_id = self.request.query_params.get('atendimento_id')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if atendimento_id:
            queryset = queryset.filter(atendimento_id=atendimento_id)
        if data_inicio:
            queryset = queryset.filter(data_criacao__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_criacao__date__lte=data_fim)

        # Filtra por funcionário se não for admin
        if not self.request.user.is_staff:
            queryset = queryset.filter(funcionario=self.request.user)

        return queryset.order_by('-data_criacao')

    def get_serializer_class(self):
        if self.action == 'create':
            return CriarOrdemServicoSerializer
        elif self.action in ['update', 'partial_update']:
            return AtualizarOrdemServicoSerializer
        return OrdemServicoSerializer

    def perform_create(self, serializer):
        """Cria a OS e suas etapas/materiais associados"""
        atendimento_id = serializer.validated_data['atendimento_id']
        
        try:
            atendimento = Atendimento.objects.get(id=atendimento_id)
        except Atendimento.DoesNotExist:
            raise ValueError('Atendimento não encontrado')

        # Cria a OS
        os = OrdemServico.objects.create(
            atendimento=atendimento,
            funcionario=self.request.user,
            descricao=serializer.validated_data.get('descricao', '')
        )

        # Cria etapas se fornecidas
        if 'etapas' in serializer.validated_data:
            for etapa_data in serializer.validated_data['etapas']:
                EtapaOS.objects.create(
                    ordem_servico=os,
                    nome=etapa_data['nome'],
                    tempo_estimado=etapa_data['tempo_estimado'],
                    ordem=etapa_data.get('ordem', 0)
                )

        # Cria materiais se fornecidos
        if 'materiais' in serializer.validated_data:
            for material_data in serializer.validated_data['materiais']:
                MaterialOS.objects.create(
                    ordem_servico=os,
                    nome=material_data['nome'],
                    quantidade=material_data['quantidade'],
                    unidade=material_data['unidade'],
                    custo_unitario=material_data['custo_unitario']
                )

        return os

    def get_object(self):
        """Override para verificar permissões"""
        obj = super().get_object()
        
        # Verifica permissão
        if not self.request.user.is_staff and obj.funcionario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Sem permissão para acessar esta OS')
        
        return obj

    def update(self, request, *args, **kwargs):
        """Override para validações específicas"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if instance.status == 'finalizada':
            return Response(
                {'detail': 'Não é possível alterar uma OS finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Validação específica para finalização
        if serializer.validated_data.get('status') == 'finalizada':
            if not instance.pode_finalizar():
                return Response(
                    {'detail': 'Existem etapas pendentes. Finalize todas as etapas antes de finalizar a OS.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            instance.data_finalizacao = timezone.now()

        serializer.save()
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(
            OrdemServicoSerializer(instance, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza uma OS com observações opcionais"""
        os = self.get_object()

        if not os.pode_finalizar():
            return Response(
                {'detail': 'Existem etapas pendentes. Finalize todas as etapas antes de finalizar a OS.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Adiciona observações se fornecidas
        serializer = FinalizarOSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if serializer.validated_data.get('observacoes'):
            os.descricao += f"\n\nObservações da finalização:\n{serializer.validated_data['observacoes']}"

        # Finaliza a OS
        os.status = 'finalizada'
        os.data_finalizacao = timezone.now()
        os.save()

        return Response(
            OrdemServicoSerializer(os, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def materiais(self, request, pk=None):
        """Adiciona material à OS"""
        os = self.get_object()

        if os.status == 'finalizada':
            return Response(
                {'detail': 'Não é possível adicionar materiais a uma OS finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = MaterialOSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        material = MaterialOS.objects.create(
            ordem_servico=os,
            **serializer.validated_data
        )

        return Response(
            MaterialOSSerializer(material).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'], url_path='etapas/(?P<etapa_id>[^/.]+)')
    def atualizar_etapa(self, request, pk=None, etapa_id=None):
        """Atualiza status de uma etapa específica"""
        os = self.get_object()

        try:
            etapa = EtapaOS.objects.get(id=etapa_id, ordem_servico=os)
        except EtapaOS.DoesNotExist:
            return Response(
                {'detail': 'Etapa não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        if os.status == 'finalizada':
            return Response(
                {'detail': 'Não é possível alterar etapas de uma OS finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        concluida = request.data.get('concluida')
        if concluida is not None:
            etapa.concluida = bool(concluida)
            etapa.save()

        return Response(
            EtapaOSSerializer(etapa).data,
            status=status.HTTP_200_OK
        )


class AtendimentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operações do Atendimento.
    Filtra automaticamente para que 'finalizados' não apareçam no pátio.
    """
    serializer_class = AtendimentoSerializer
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return CriarAtendimentoSerializer
        return AtendimentoSerializer

    def create(self, request, *args, **kwargs):
        """Cria atendimento usando CriarAtendimentoSerializer e AtendimentoService"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            atendimento = AtendimentoService.criar_com_veiculo(
                dados=serializer.validated_data,
                funcionario=request.user,
            )
        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            AtendimentoSerializer(atendimento, context={'request': request}).data, 
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'])
    def proxima_etapa(self, request, pk=None):
        """Avança para próxima etapa (1->2, 2->3, 3->4)"""
        atendimento = self.get_object()
        
        # Verifica se já está na etapa 4 (Liberação)
        if atendimento.etapa_atual >= 4:
            return Response(
                {'detail': 'Este atendimento já está na etapa final. Use o endpoint finalizar para concluir.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        atendimento_atualizado = AtendimentoService.avancar_etapa(atendimento, request.data)
        serializer = self.get_serializer(atendimento_atualizado)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def finalizar(self, request, pk=None):
        """Finaliza atendimento na etapa 4 (Liberação)"""
        atendimento = self.get_object()
        
        # Log para debug
        print(f"FINALIZAR: ID={atendimento.id}, status={atendimento.status}, etapa={atendimento.etapa_atual}")
        
        # Verifica se está na etapa 4
        if atendimento.etapa_atual != 4:
            return Response(
                {'detail': 'Apenas atendimentos na etapa de Liberação podem ser finalizados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Se já está finalizado, retorna dados atual (idepotente)
        if atendimento.status == 'finalizado':
            print(f"FINALIZAR: Atendimento {atendimento.id} já está finalizado, retornando dados atuais")
            serializer = self.get_serializer(atendimento)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Atualiza campos
        atendimento.status = 'finalizado'
        if 'vaga_patio' in request.data:
            # Adiciona vaga_patio às observações (campo não existe no modelo)
            vaga = request.data['vaga_patio']
            obs_vaga = f'Vaga de liberação: {vaga}'
            if atendimento.observacoes:
                atendimento.observacoes += f'\n{obs_vaga}'
            else:
                atendimento.observacoes = obs_vaga
        
        if 'observacoes' in request.data:
            obs_finais = request.data['observacoes']
            if obs_finais.strip():
                if atendimento.observacoes:
                    atendimento.observacoes += f'\n\nObservações finais:\n{obs_finais}'
                else:
                    atendimento.observacoes = f'Observações finais:\n{obs_finais}'
        
        atendimento.save()
        print(f"FINALIZAR: Atendimento {atendimento.id} finalizado com sucesso")
        
        serializer = self.get_serializer(atendimento)
        return Response(serializer.data)



    def get_queryset(self):
        """
        Filtro Global: Remove carros finalizados de todas as listagens do pátio.
        """
        # O .exclude(status='finalizado') é a chave aqui
        return Atendimento.objects.exclude(status='finalizado').select_related(
            'veiculo', 'servico'
        ).prefetch_related('midias').order_by('horario_inicio')

    def get_object(self):
        """
        Sobrescrito para permitir acesso a atendimentos finalizados em actions específicas.
        """
        # Para actions de finalização e proxima_etapa, usa queryset sem filtro
        if self.action in ['finalizar', 'proxima_etapa']:
            queryset = Atendimento.objects.select_related(
                'veiculo', 'servico'
            ).prefetch_related('midias')
        else:
            queryset = self.get_queryset()
        
        return get_object_or_404(queryset, pk=self.kwargs["pk"])

@action(detail=False, methods=['get'])
def hoje(self, request):
    hoje = timezone.now().date()
    # Usar data_hora garante que agendados que ainda não iniciaram apareçam no pátio
    queryset = Atendimento.objects.filter(
        data_hora__date=hoje 
    ).exclude(status='finalizado').select_related(
        'veiculo', 'servico'
    ).order_by('data_hora')
    
    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)