from rest_framework import permissions


class IsGestorOrReadOnlyFuncionario(permissions.BasePermission):
    """
    Permite acesso apenas a usuários com perfil Funcionário para chamadas de leitura (GET).
    Usuários Gestor têm acesso completo.
    """
    def has_permission(self, request, view):
        # Se for método seguro (GET, HEAD, OPTIONS), permite apenas funcionários ou gestores
        if request.method in permissions.SAFE_METHODS:
            return (hasattr(request.user, 'perfil_funcionario') or 
                    hasattr(request.user, 'perfil_gestor'))
        
        # Para métodos de escrita, permite apenas gestores
        return hasattr(request.user, 'perfil_gestor')
