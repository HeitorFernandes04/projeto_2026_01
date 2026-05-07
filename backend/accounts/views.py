from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from django.shortcuts import get_object_or_404
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices
from accounts.serializers import ClienteSerializer, RegisterSerializer, EstabelecimentoSerializer, EstabelecimentoUpdateSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class RegistroClienteView(generics.CreateAPIView):
    """RF-25: Cadastro público de perfil Cliente. Username é auto-derivado do email.
    Após criar, linka retroativamente veículos com o mesmo celular_dono."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ClienteSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        user = serializer.save()
        telefone = serializer.validated_data.get('telefone_whatsapp', '')
        if telefone and hasattr(user, 'perfil_cliente'):
            from core.models import Veiculo
            Veiculo.objects.filter(
                celular_dono=telefone, cliente__isnull=True
            ).update(cliente=user.perfil_cliente)


class FuncionarioListCreateView(generics.ListCreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtro multi-tenant: apenas funcionários do mesmo estabelecimento
        user = self.request.user
        try:
            gestor = user.perfil_gestor
            estabelecimento_id = gestor.estabelecimento.id
        except AttributeError:
            # Se não for gestor, retorna queryset vazio
            return User.objects.none()
        
        return User.objects.filter(
            perfil_funcionario__estabelecimento_id=estabelecimento_id
        ).select_related('perfil_funcionario', 'perfil_funcionario__estabelecimento')

    def perform_create(self, serializer):
        # Apenas gestores podem criar funcionários para seu estabelecimento
        user = self.request.user
        try:
            gestor = user.perfil_gestor
            estabelecimento = gestor.estabelecimento
        except AttributeError:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Apenas gestores podem cadastrar funcionários.")
        
        # O serializer.save() já cria o User E o perfil Funcionario
        # vinculando ao estabelecimento passado no formulário.
        serializer.save(estabelecimento=estabelecimento)


class FuncionarioDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtro multi-tenant: apenas funcionários do mesmo estabelecimento
        user = self.request.user
        try:
            gestor = user.perfil_gestor
            estabelecimento_id = gestor.estabelecimento.id
        except AttributeError:
            return User.objects.none()
        
        return User.objects.filter(
            perfil_funcionario__estabelecimento_id=estabelecimento_id
        ).select_related('perfil_funcionario', 'perfil_funcionario__estabelecimento')

    def perform_update(self, serializer):
        # Captura a senha se ela foi enviada para reset
        password = self.request.data.get('password')
        user = serializer.save()
        
        if password:
            user.set_password(password)
            user.save()
            
        # Atualiza o cargo no perfil vinculado, se enviado
        cargo = self.request.data.get('cargo')
        if cargo and hasattr(user, 'perfil_funcionario'):
            perfil = user.perfil_funcionario
            perfil.cargo = cargo
            perfil.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def meu_perfil(request):
    """Endpoint para o usuário logado consultar seu próprio perfil"""
    user = request.user
    data = {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'username': user.username,
        'is_active': user.is_active,
        'date_joined': user.date_joined,
    }
    
    # Verificar tipo de perfil e adicionar dados específicos
    if hasattr(user, 'perfil_cliente'):
        cliente = user.perfil_cliente
        data.update({
            'tipo_perfil': 'CLIENTE',
            'telefone_whatsapp': cliente.telefone_whatsapp,
            'endereco_padrao': cliente.endereco_padrao,
        })
    elif hasattr(user, 'perfil_funcionario'):
        funcionario = user.perfil_funcionario
        est_serializer = EstabelecimentoSerializer(funcionario.estabelecimento, context={'request': request})
        data.update({
            'tipo_perfil': 'FUNCIONARIO',
            'cargo': funcionario.cargo,
            'estabelecimento': est_serializer.data
        })
    elif hasattr(user, 'perfil_gestor'):
        gestor = user.perfil_gestor
        est_serializer = EstabelecimentoSerializer(gestor.estabelecimento, context={'request': request})
        data.update({
            'tipo_perfil': 'GESTOR',
            'estabelecimento': est_serializer.data
        })
    
    return Response(data)
class EstabelecimentoMeView(generics.RetrieveUpdateAPIView):
    """
    Endpoint para o Gestor consultar e atualizar dados do seu estabelecimento.
    """
    serializer_class = EstabelecimentoUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        if hasattr(user, 'perfil_gestor'):
            return user.perfil_gestor.estabelecimento
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Apenas gestores podem acessar as configurações da unidade.")

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return EstabelecimentoSerializer
        return EstabelecimentoUpdateSerializer
