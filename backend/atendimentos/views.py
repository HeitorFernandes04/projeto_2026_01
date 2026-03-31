from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Atendimento
from .permissions import IsFuncionarioDoAtendimento
from .serializers import (
    AtendimentoSerializer,
    MidiaAtendimentoSerializer,
    MidiaAtendimentoUploadSerializer,
)
from .services import MidiaAtendimentoService


class AtendimentosHojeView(APIView):
    def get(self, request):
        hoje = timezone.localdate()

        atendimentos = Atendimento.objects.filter(
            data_hora__date=hoje
        ).order_by('data_hora')

        serializer = AtendimentoSerializer(atendimentos, many=True)
        return Response(serializer.data)


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
