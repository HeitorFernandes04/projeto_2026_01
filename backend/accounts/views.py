from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices
from accounts.serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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
        
        # Criar user e perfil funcionário
        new_user = serializer.save()
        Funcionario.objects.create(
            user=new_user,
            estabelecimento=estabelecimento,
            cargo=self.request.data.get('cargo', CargoChoices.LAVADOR)
        )


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
        data.update({
            'tipo_perfil': 'FUNCIONARIO',
            'cargo': funcionario.cargo,
            'estabelecimento': {
                'id': funcionario.estabelecimento.id,
                'nome_fantasia': funcionario.estabelecimento.nome_fantasia,
            }
        })
    elif hasattr(user, 'perfil_gestor'):
        gestor = user.perfil_gestor
        data.update({
            'tipo_perfil': 'GESTOR',
            'estabelecimento': {
                'id': gestor.estabelecimento.id,
                'nome_fantasia': gestor.estabelecimento.nome_fantasia,
            }
        })
    
    return Response(data)