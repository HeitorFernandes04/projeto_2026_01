"""
Permissões customizadas - Ordens de Serviço.

Controle de acesso modular. Views nunca fazem verificações manuais
de posse (ex: if obj.dono != request.user). Tudo fica aqui.
"""
from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission

from operacao.models import OrdemServico


class IsGestor(BasePermission):
    """Permite acesso apenas a usuários com perfil de Gestor."""

    message = 'Apenas gestores podem acessar este recurso.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'perfil_gestor')
        )


class IsFuncionarioDaOS(BasePermission):
    """
    Permite acesso apenas se request.user for o funcionário
    vinculado à OrdemServico identificada pelo 'pk' da URL.
    """

    message = 'Você não tem permissão para acessar esta Ordem de Serviço.'

    def has_permission(self, request, view):
        pk = view.kwargs.get('pk')
        if pk is None:
            return False

        os = get_object_or_404(OrdemServico, pk=pk)

        # Armazena no request para evitar query duplicada na view
        request.ordem_servico = os

        # Permite acesso quando a OS ainda não tem dono (fila livre)
        # ou quando o usuário logado já é o funcionário vinculado.
        return os.funcionario is None or os.funcionario == request.user
