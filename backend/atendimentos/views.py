from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Atendimento
from .serializers import AtendimentoSerializer


class AtendimentosHojeView(APIView):
    def get(self, request):
        hoje = timezone.localdate()

        atendimentos = Atendimento.objects.filter(
            data_hora__date=hoje
        ).order_by('data_hora')

        serializer = AtendimentoSerializer(atendimentos, many=True)
        return Response(serializer.data)
