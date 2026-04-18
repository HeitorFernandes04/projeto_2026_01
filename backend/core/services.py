# core/services.py
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Servico
from accounts.models import Estabelecimento, User


class EstabelecimentoService:
    """Serviço para gerenciar dados do estabelecimento (RF-13)"""
    
    @staticmethod
    def obter_estabelecimento_usuario(user):
        """Obtém o estabelecimento do usuário logado com validação de isolamento (RNF-01)"""
        if not hasattr(user, 'perfil_gestor') or not user.perfil_gestor:
            raise PermissionDenied("Usuário não está vinculado a um estabelecimento.")
        
        estabelecimento = user.perfil_gestor.estabelecimento
        
        if not estabelecimento.is_active:
            raise PermissionDenied("Estabelecimento inativo.")
        
        return estabelecimento
    
    @staticmethod
    def atualizar_dados_estabelecimento(user, dados_atualizacao):
        """
        Atualiza os dados do estabelecimento do usuário logado.
        
        Args:
            user: Usuário autenticado
            dados_atualizacao: Dict com campos a atualizar (nome_fantasia, cnpj, endereco_completo)
        
        Returns:
            Estabelecimento: Instância atualizada
        
        Raises:
            ValidationError: Se dados forem inválidos
            PermissionDenied: Se violação de isolamento (RNF-01)
        """
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        
        # Validações de negócio
        if 'cnpj' in dados_atualizacao:
            novo_cnpj = dados_atualizacao['cnpj']
            if len(novo_cnpj) != 14 or not novo_cnpj.isdigit():
                raise ValidationError("CNPJ deve conter exatamente 14 dígitos numéricos.")
            
            # Verifica se CNPJ já existe em outro estabelecimento
            if Estabelecimento.objects.filter(cnpj=novo_cnpj).exclude(id=estabelecimento.id).exists():
                raise ValidationError("CNPJ já está em uso por outro estabelecimento.")
        
        # Atualiza apenas os campos permitidos
        campos_permitidos = ['nome_fantasia', 'cnpj', 'endereco_completo']
        for campo, valor in dados_atualizacao.items():
            if campo in campos_permitidos:
                setattr(estabelecimento, campo, valor)
        
        estabelecimento.save()
        return estabelecimento


class ServicoService:
    """Serviço para gerenciar serviços do estabelecimento (RF-11)"""
    
    @staticmethod
    def criar_servico(user, dados_servico):
        """
        Cria um novo serviço para o estabelecimento do usuário.
        
        Args:
            user: Usuário autenticado (gestor)
            dados_servico: Dict com dados do serviço
        
        Returns:
            Servico: Instância criada
        
        Raises:
            ValidationError: Se dados forem inválidos
            PermissionDenied: Se violação de isolamento (RNF-01)
        """
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        
        # Validações de negócio
        if 'duracao_estimada_minutos' in dados_servico:
            duracao = dados_servico['duracao_estimada_minutos']
            if not isinstance(duracao, int) or duracao <= 0:
                raise ValidationError("Duração estimada deve ser um número inteiro positivo.")
        
        # Verifica duplicidade de nome no mesmo estabelecimento
        if 'nome' in dados_servico:
            nome_normalizado = dados_servico['nome'].strip().lower()
            if Servico.objects.filter(
                nome__iexact=nome_normalizado,
                estabelecimento=estabelecimento,
                is_active=True
            ).exists():
                raise ValidationError("Já existe um serviço com este nome no estabelecimento.")
        
        # Cria o serviço
        dados_servico['estabelecimento'] = estabelecimento
        dados_servico['is_active'] = True
        
        return Servico.objects.create(**dados_servico)
    
    @staticmethod
    def soft_delete_servico(user, servico_id):
        """
        Realiza soft delete de um serviço (CA-02).
        
        Args:
            user: Usuário autenticado
            servico_id: ID do serviço a inativar
        
        Returns:
            Servico: Instância inativada
        
        Raises:
            PermissionDenied: Se serviço não pertencer ao estabelecimento (RNF-01)
        """
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        
        try:
            servico = Servico.objects.get(
                id=servico_id,
                estabelecimento=estabelecimento,
                is_active=True
            )
        except Servico.DoesNotExist:
            raise PermissionDenied("Serviço não encontrado ou não pertence ao seu estabelecimento.")
        
        servico.soft_delete()

class FuncionarioService:
    """Serviço para gerenciar equipe do estabelecimento (RF-12)"""

    @staticmethod
    def listar_funcionarios(user):
        """Lista funcionários do estabelecimento do gestor logado"""
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        from accounts.models import Funcionario
        # Retorna apenas usuários que possuem perfil de funcionário neste estabelecimento
        return User.objects.filter(
            perfil_funcionario__estabelecimento=estabelecimento,
            is_active=True
        ).select_related('perfil_funcionario')

    @staticmethod
    def criar_funcionario(user, dados_funcionario):
        """Cria um novo usuário e perfil de funcionário vinculado ao estabelecimento"""
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        from accounts.serializers import FuncionarioSerializer
        
        # Força o estabelecimento do gestor logado (Previne IDOR CA-04)
        dados_funcionario['estabelecimento'] = estabelecimento.id
        
        serializer = FuncionarioSerializer(data=dados_funcionario)
        if serializer.is_valid(raise_exception=True):
            return serializer.save()
        return None

    @staticmethod
    def inativar_funcionario(user, funcionario_id):
        """Inativa um funcionário (Soft Delete) garantindo isolamento"""
        estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(user)
        
        try:
            # Busca o usuário que tem perfil de funcionário no estabelecimento do gestor
            funcionario_user = User.objects.get(
                id=funcionario_id,
                perfil_funcionario__estabelecimento=estabelecimento
            )
            funcionario_user.is_active = False
            funcionario_user.save()
            return funcionario_user
        except User.DoesNotExist:
            raise PermissionDenied("Funcionário não encontrado ou não pertence ao seu estabelecimento.")
