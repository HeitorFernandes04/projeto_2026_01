from django.core.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Atendimento, Servico
from .permissions import IsFuncionarioDoAtendimento
from .serializers import (
    AtendimentoSerializer,
    CriarAtendimentoSerializer,
    MidiaAtendimentoSerializer,
    MidiaAtendimentoUploadSerializer,
    ServicoSerializer,
)
from .services import AtendimentoService, MidiaAtendimentoService


class AtendimentosHojeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()

        atendimentos = Atendimento.objects.filter(
            Q(funcionario__isnull=True) | Q(funcionario=request.user),
            data_hora__date=hoje,
        ).select_related('veiculo', 'servico').order_by('data_hora')

        serializer = AtendimentoSerializer(atendimentos, many=True)
        return Response(serializer.data)


class ServicoListView(APIView):
    """GET /api/atendimentos/servicos/ — lista todos os serviços disponíveis."""

    def get(self, request):
        servicos = Servico.objects.all()
        serializer = ServicoSerializer(servicos, many=True)
        return Response(serializer.data)


class AtendimentoDetailView(APIView):
    """GET /api/atendimentos/{id}/ — detalhe completo de um atendimento."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsFuncionarioDoAtendimento]

    def get(self, request, pk):
        # Atendimento já carregado e autorizado pela permission
        serializer = AtendimentoSerializer(request.atendimento)
        return Response(serializer.data)


class CriarAtendimentoView(APIView):
    """
    POST /api/atendimentos/
    Cria um veículo (ou reutiliza pela placa) e registra o atendimento.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CriarAtendimentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        atendimento = AtendimentoService.criar_com_veiculo(
            dados=serializer.validated_data,
            funcionario=request.user,
        )

        return Response(AtendimentoSerializer(atendimento).data, status=status.HTTP_201_CREATED)


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
        if Atendimento.objects.filter(funcionario=request.user, status='em_andamento').exists():
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

        serializer = AtendimentoSerializer(atendimento)
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
