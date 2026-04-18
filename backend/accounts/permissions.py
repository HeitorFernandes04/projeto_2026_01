from rest_framework import permissions
from accounts.models import Cliente, Funcionario, Gestor


class IsGestor(permissions.BasePermission):
    """
    Permite acesso apenas a usuários com perfil Gestor.
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil_gestor')


class IsFuncionario(permissions.BasePermission):
    """
    Permite acesso apenas a usuários com perfil Funcionário.
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil_funcionario')


class IsCliente(permissions.BasePermission):
    """
    Permite acesso apenas a usuários com perfil Cliente.
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil_cliente')


class IsGestorOrReadOnly(permissions.BasePermission):
    """
    Permite acesso total a gestores e apenas leitura a outros usuários autenticados.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        return hasattr(request.user, 'perfil_gestor')


class IsGestorDoEstabelecimento(permissions.BasePermission):
    """
    Permite acesso apenas a gestores do mesmo estabelecimento do recurso.
    Para uso em objetos que possuem estabelecimento_id.
    """
    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'perfil_gestor'):
            return False
        
        gestor_estabelecimento_id = request.user.perfil_gestor.estabelecimento.id
        
        # Verificar se o objeto pertence ao mesmo estabelecimento
        if hasattr(obj, 'estabelecimento'):
            return obj.estabelecimento.id == gestor_estabelecimento_id
        elif hasattr(obj, 'estabelecimento_id'):
            return obj.estabelecimento_id == gestor_estabelecimento_id
        elif hasattr(obj, 'perfil_funcionario'):
            return obj.perfil_funcionario.estabelecimento.id == gestor_estabelecimento_id
        
        return False


class IsFuncionarioDoEstabelecimento(permissions.BasePermission):
    """
    Permite acesso apenas a funcionários do mesmo estabelecimento do recurso.
    """
    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'perfil_funcionario'):
            return False
        
        funcionario_estabelecimento_id = request.user.perfil_funcionario.estabelecimento.id
        
        # Verificar se o objeto pertence ao mesmo estabelecimento
        if hasattr(obj, 'estabelecimento'):
            return obj.estabelecimento.id == funcionario_estabelecimento_id
        elif hasattr(obj, 'estabelecimento_id'):
            return obj.estabelecimento_id == funcionario_estabelecimento_id
        elif hasattr(obj, 'perfil_funcionario'):
            return obj.perfil_funcionario.estabelecimento.id == funcionario_estabelecimento_id
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite acesso total ao dono do recurso e apenas leitura a outros usuários autenticados.
    Para uso em objetos que possuem user_id.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Verificar se o usuário é dono do recurso
        if hasattr(obj, 'user'):
            return obj.user.id == request.user.id
        elif hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        
        return False


class CanCreateFuncionario(permissions.BasePermission):
    """
    Permite que apenas gestores possam criar novos funcionários para seu estabelecimento.
    RF-12: Permissões granulares para gestão de funcionários.
    """
    def has_permission(self, request, view):
        if request.method != 'POST':
            return request.user.is_authenticated
        
        return hasattr(request.user, 'perfil_gestor')


class IsMultiTenantSafe(permissions.BasePermission):
    """
    Garante que o usuário só possa acessar recursos do seu próprio estabelecimento.
    Esta permissão deve ser usada em conjunto com filtros no queryset.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Verificar se o usuário tem um perfil com estabelecimento vinculado
        return (hasattr(request.user, 'perfil_funcionario') or 
                hasattr(request.user, 'perfil_gestor'))
