from django.core.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import viewsets, status

from .models import Atendimento, Servico, OrdemServico, EtapaOS, MaterialOS
from .permissions import IsFuncionarioDoAtendimento
from .serializers import (
    AtendimentoSerializer,
    CriarAtendimentoSerializer,
    HistoricoAtendimentoFiltroSerializer,
    MidiaAtendimentoSerializer,
    MidiaAtendimentoUploadSerializer,
    ServicoSerializer,
    AtualizarComentarioSerializer,
    OrdemServicoSerializer,
    CriarOrdemServicoSerializer,
    AtualizarOrdemServicoSerializer,
    FinalizarOSSerializer,
    EtapaOSSerializer,
    MaterialOSSerializer,
)
from .services import AtendimentoService, MidiaAtendimentoService
from .viewsets import OrdemServicoViewSet


class AtendimentosHojeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()

        atendimentos = Atendimento.objects.filter(
            Q(funcionario__isnull=True) | Q(funcionario=request.user),
            data_hora__date=hoje,
        ).select_related('veiculo', 'servico').prefetch_related('midias').order_by('data_hora')

        serializer = AtendimentoSerializer(atendimentos, many=True, context={'request': request})
        return Response(serializer.data)


class HistoricoAtendimentosView(APIView):
    """GET /api/atendimentos/historico/?data_inicial=YYYY-MM-DD&data_final=YYYY-MM-DD&search=PLACA"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filtro_serializer = HistoricoAtendimentoFiltroSerializer(data=request.query_params)
        filtro_serializer.is_valid(raise_exception=True)

        # Parâmetro de busca
        search_term = request.query_params.get('search', '').strip()

        try:
            atendimentos = AtendimentoService.listar_historico_por_periodo(
                funcionario=request.user,
                data_inicial=filtro_serializer.validated_data['data_inicial'],
                data_final=filtro_serializer.validated_data['data_final'],
                status=filtro_serializer.validated_data['status'],
            )

            # Aplicar filtro de busca se fornecido
            if search_term:
                atendimentos = atendimentos.filter(
                    Q(veiculo__placa__icontains=search_term) |
                    Q(veiculo__nome_dono__icontains=search_term) |
                    Q(veiculo__modelo__icontains=search_term)
                )

        except ValidationError as e:
            return Response(
                {'detail': e.messages[0] if hasattr(e, 'messages') else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AtendimentoSerializer(atendimentos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ServicoListView(APIView):
    """GET /api/atendimentos/servicos/ — lista todos os serviços disponíveis."""

    def get(self, request):
        servicos = Servico.objects.all()
        serializer = ServicoSerializer(servicos, many=True)
        return Response(serializer.data)


class HorariosLivresView(APIView):
    """
    GET /api/atendimentos/horarios-livres/?data=YYYY-MM-DD&servico_id=X
    Retorna os slots vagos para um determinado dia e serviço, bloqueando intersecções.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_str = request.query_params.get('data')
        servico_id = request.query_params.get('servico_id')

        if not data_str or not servico_id:
            return Response(
                {'detail': 'Parâmetros "data" e "servico_id" são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            horarios = AtendimentoService.get_horarios_livres(data_str, servico_id)
            return Response({'horarios': horarios}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({'detail': e.messages[0] if hasattr(e, 'messages') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            from django.http import Http404
            if isinstance(e, Http404):
                return Response({'detail': 'Serviço não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AtendimentoDetailView(APIView):
    """GET /api/atendimentos/{id}/ — detalhe completo de um atendimento."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def get(self, request, pk):
        # Atendimento já carregado e autorizado pela permission
        serializer = AtendimentoSerializer(request.atendimento, context={'request': request})
        return Response(serializer.data)


class CriarAtendimentoView(APIView):
    """
    POST /api/atendimentos/
    Cria um veículo (ou reutiliza pela placa) e registra o atendimento.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print(f"DEBUG: CriarAtendimentoView - Dados recebidos: {request.data}")
        serializer = CriarAtendimentoSerializer(data=request.data)
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

        return Response(AtendimentoSerializer(atendimento, context={'request': request}).data, status=status.HTTP_201_CREATED)


class IniciarAtendimentoView(APIView):
    """
    PATCH /api/atendimentos/{id}/iniciar/

    Inicia um atendimento: salva o horário de início e muda o status para em_andamento.
    Só é possível iniciar um atendimento que esteja com status 'agendado'.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def patch(self, request, pk):
        # Atendimento já carregado e autorizado pela permission
        atendimento = request.atendimento

        if atendimento.status != 'agendado':
            return Response(
                {'detail': f'Não é possível iniciar um atendimento com status "{atendimento.status}".'},
                status=status.HTTP_409_CONFLICT,
            )

        # Trava: o funcionário já está ocupado com outro atendimento?
        hoje = timezone.localdate()
        if Atendimento.objects.filter(
            funcionario=request.user, 
            status='em_andamento',
            data_hora__date=hoje  # Ignora atendimentos de dias anteriores
        ).exists():
            return Response(
                {'detail': 'Termine o atendimento atual antes de iniciar outro.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Concorrência: outro funcionário assumiu este atendimento no intervalo entre
        # a checagem de permissão e esta execução? Relê o DB para garantir estado fresco.
        atendimento.refresh_from_db()
        if atendimento.funcionario is not None and atendimento.funcionario != request.user:
            return Response(
                {'detail': 'Este serviço acabou de ser assumido por outro funcionário.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Claim: assume a fila e inicia
        atendimento.funcionario = request.user
        atendimento.status = 'em_andamento'
        atendimento.horario_inicio = timezone.now()
        atendimento.save()

        serializer = AtendimentoSerializer(atendimento, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class FotoUploadView(APIView):
    """
    POST /api/atendimentos/{id}/fotos/

    Upload de múltiplas fotos para um atendimento.
    Toda lógica de negócio é delegada para MidiaAtendimentoService.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def post(self, request, pk):
        # O atendimento já foi carregado pela permission e cacheado em request
        atendimento = request.atendimento

        # Validação de entrada
        serializer = MidiaAtendimentoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        momento = serializer.validated_data['momento']
        arquivos = serializer.validated_data['arquivos']

        # Delega para a camada de serviço
        try:
            midias = MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=atendimento,
                momento=momento,
                arquivos=arquivos,
            )
        except ValidationError as e:
            return Response(
                {'detail': e.message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Serializa a saída com URLs absolutas
        output = MidiaAtendimentoSerializer(
            midias,
            many=True,
            context={'request': request},
        )

        return Response(output.data, status=status.HTTP_201_CREATED)


class OrdemServicoDetailView(APIView):
    """GET /api/ordens-servico/{id}/ - Detalhes de uma OS específica"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            os = OrdemServico.objects.select_related(
                'atendimento__veiculo', 
                'atendimento__servico',
                'funcionario'
            ).prefetch_related('etapas', 'materiais').get(id=pk)
        except OrdemServico.DoesNotExist:
            return Response(
                {'detail': 'Ordem de Serviço não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica permissão
        if not request.user.is_staff and os.funcionario != request.user:
            return Response(
                {'detail': 'Sem permissão para acessar esta OS'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = OrdemServicoSerializer(os, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        """PATCH /api/ordens-servico/{id}/ - Atualiza status ou descrição"""
        try:
            os = OrdemServico.objects.get(id=pk)
        except OrdemServico.DoesNotExist:
            return Response(
                {'detail': 'Ordem de Serviço não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica permissão
        if not request.user.is_staff and os.funcionario != request.user:
            return Response(
                {'detail': 'Sem permissão para alterar esta OS'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AtualizarOrdemServicoSerializer(os, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Validação específica para finalização
        if serializer.validated_data.get('status') == 'finalizada':
            if not os.pode_finalizar():
                return Response(
                    {'detail': 'Existem etapas pendentes. Finalize todas as etapas antes de finalizar a OS.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            os.data_finalizacao = timezone.now()

        serializer.save()
        return Response(
            OrdemServicoSerializer(os, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class FinalizarOSView(APIView):
    """POST /api/ordens-servico/{id}/finalizar/ - Finaliza uma OS"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            os = OrdemServico.objects.get(id=pk)
        except OrdemServico.DoesNotExist:
            return Response(
                {'detail': 'Ordem de Serviço não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica permissão
        if not request.user.is_staff and os.funcionario != request.user:
            return Response(
                {'detail': 'Sem permissão para finalizar esta OS'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not os.pode_finalizar():
            return Response(
                {'detail': 'Existem etapas pendentes. Finalize todas as etapas antes de finalizar a OS.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Finaliza a OS
        os.status = 'finalizada'
        os.data_finalizacao = timezone.now()
        os.save()

        # Adiciona observações se fornecidas
        serializer = FinalizarOSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if serializer.validated_data.get('observacoes'):
            os.descricao += f"\n\nObservações da finalização:\n{serializer.validated_data['observacoes']}"
            os.save()

        return Response(
            OrdemServicoSerializer(os, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class AdicionarMaterialOSView(APIView):
    """POST /api/ordens-servico/{id}/materiais/ - Adiciona material à OS"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            os = OrdemServico.objects.get(id=pk)
        except OrdemServico.DoesNotExist:
            return Response(
                {'detail': 'Ordem de Serviço não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica permissão
        if not request.user.is_staff and os.funcionario != request.user:
            return Response(
                {'detail': 'Sem permissão para adicionar materiais a esta OS'},
                status=status.HTTP_403_FORBIDDEN
            )

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


class AtualizarEtapaOSView(APIView):
    """PATCH /api/ordens-servico/{id}/etapas/{etapa_id}/ - Atualiza status de uma etapa"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, etapa_id):
        try:
            os = OrdemServico.objects.get(id=pk)
            etapa = EtapaOS.objects.get(id=etapa_id, ordem_servico=os)
        except (OrdemServico.DoesNotExist, EtapaOS.DoesNotExist):
            return Response(
                {'detail': 'Ordem de Serviço ou Etapa não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verifica permissão
        if not request.user.is_staff and os.funcionario != request.user:
            return Response(
                {'detail': 'Sem permissão para alterar esta etapa'},
                status=status.HTTP_403_FORBIDDEN
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


class AdicionarComentarioView(APIView):
    """PATCH /api/atendimentos/{id}/comentario/"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def patch(self, request, pk):
        atendimento = request.atendimento # Injetado pela permissionIsFuncionarioDoAtendimento
        serializer = AtualizarComentarioSerializer(atendimento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        atendimento_atualizado = serializer.save()
        return Response(AtendimentoSerializer(atendimento_atualizado, context={'request': request}).data)


class OrdemServicoListView(APIView):
    """GET /api/ordens-servico/ - Lista ordens de serviço com filtros"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = OrdemServico.objects.select_related(
            'atendimento__veiculo', 
            'atendimento__servico',
            'funcionario'
        ).prefetch_related('etapas', 'materiais')

        # Filtros
        status_param = request.query_params.get('status')
        atendimento_id = request.query_params.get('atendimento_id')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if atendimento_id:
            queryset = queryset.filter(atendimento_id=atendimento_id)
        if data_inicio:
            queryset = queryset.filter(data_criacao__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_criacao__date__lte=data_fim)

        # Filtra por funcionário se não for admin
        if not request.user.is_staff:
            queryset = queryset.filter(funcionario=request.user)

        queryset = queryset.order_by('-data_criacao')
        serializer = OrdemServicoSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class CriarOrdemServicoView(APIView):
    """POST /api/ordens-servico/ - Cria nova ordem de serviço"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CriarOrdemServicoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            atendimento = Atendimento.objects.get(id=serializer.validated_data['atendimento_id'])
        except Atendimento.DoesNotExist:
            return Response(
                {'detail': 'Atendimento não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cria a OS
        os = OrdemServico.objects.create(
            atendimento=atendimento,
            funcionario=request.user,
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

        return Response(
            OrdemServicoSerializer(os, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )