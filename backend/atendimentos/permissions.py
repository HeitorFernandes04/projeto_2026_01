"""
Permissões customizadas — atendimentos.

Controle de acesso modular. Views nunca fazem verificações manuais
de posse (ex: if obj.dono != request.user). Tudo fica aqui.
"""
from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission

from atendimentos.models import Atendimento


class IsFuncionarioDoAtendimento(BasePermission):
    """
    Permite acesso apenas se request.user for o funcionário
    vinculado ao Atendimento identificado pelo 'pk' da URL.
    """

    message = 'Você não tem permissão para acessar este atendimento.'

    def has_permission(self, request, view):
        pk = view.kwargs.get('pk')
        if pk is None:
            return False

        atendimento = get_object_or_404(Atendimento, pk=pk)

        # Armazena no request para evitar query duplicada na view
        request.atendimento = atendimento

        # Permite acesso quando o atendimento ainda não tem dono (fila livre)
        # ou quando o usuário logado já é o funcionário vinculado.
        return atendimento.funcionario is None or atendimento.funcionario == request.user
