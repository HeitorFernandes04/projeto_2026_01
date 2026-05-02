# core/views.py
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Servico, TagPeca
from .serializers import ServicoSerializer, TagPecaSerializer
from accounts.models import Estabelecimento, Funcionario
from .services import EstabelecimentoService, ServicoService, FuncionarioService
from .permissions import IsGestorOrReadOnlyFuncionario, IsGestorOnly

class ServicoViewSet(viewsets.ModelViewSet):
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated, IsGestorOrReadOnlyFuncionario]

    def get_queryset(self):
        user = self.request.user
        # Obter o estabelecimento do usuário logado (Gestor ou Funcionário)
        estabelecimento = None
        if hasattr(user, 'perfil_gestor'):
            estabelecimento = user.perfil_gestor.estabelecimento
        elif hasattr(user, 'perfil_funcionario'):
            estabelecimento = user.perfil_funcionario.estabelecimento
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Usuário sem estabelecimento vinculado.")

        return Servico.objects.filter(
            estabelecimento=estabelecimento, 
            is_active=True
        )
            
    def perform_create(self, serializer):
        """Usa ServicoService para criar serviço com validações de negócio"""
        try:
            dados_servico = serializer.validated_data.copy()
            servico = ServicoService.criar_servico(self.request.user, dados_servico)
            # Atualiza o serializer com a instância criada
            serializer.instance = servico
        except (ValidationError, PermissionDenied) as e:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(str(e))

    def destroy(self, request, *args, **kwargs):
        """Soft Delete - marca is_active=False em vez de remover"""
        try:
            instance = self.get_object()
            ServicoService.soft_delete_servico(request.user, instance.id)
            return Response(status=204)
        except (ValidationError, PermissionDenied) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )


class ServicoListView(generics.ListAPIView):
    """Lista serviços ativos do estabelecimento do usuário."""
    permission_classes = [IsAuthenticated]
    serializer_class = ServicoSerializer

    def get_queryset(self):
        return Servico.objects.filter(
            estabelecimento=self.request.user.estabelecimento,
            is_active=True
        ).order_by('nome')


class TagPecaViewSet(viewsets.ModelViewSet):
    """CRUD de tags de peça do estabelecimento do usuário.
    
    Leitura (list/retrieve): qualquer usuário autenticado com vínculo.
    Escrita (create/update/delete): apenas gestores.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TagPecaSerializer

    def _obter_estabelecimento(self, user):
        """Resolve o estabelecimento do usuário (gestor ou funcionário)."""
        if hasattr(user, 'perfil_gestor'):
            return user.perfil_gestor.estabelecimento
        if hasattr(user, 'perfil_funcionario'):
            return user.perfil_funcionario.estabelecimento
        return None

    def get_queryset(self):
        estabelecimento = self._obter_estabelecimento(self.request.user)
        if not estabelecimento:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Usuário sem estabelecimento vinculado.")
        return TagPeca.objects.filter(estabelecimento=estabelecimento).order_by('nome')

    def _verificar_gestor(self):
        """Garante que apenas gestores executem operações de escrita."""
        if not hasattr(self.request.user, 'perfil_gestor'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Apenas gestores podem gerenciar tags.")

    def perform_create(self, serializer):
        self._verificar_gestor()
        serializer.save(estabelecimento=self.request.user.perfil_gestor.estabelecimento)

    def perform_update(self, serializer):
        self._verificar_gestor()
        serializer.save()

    def perform_destroy(self, instance):
        self._verificar_gestor()
        instance.delete()


class GestaoViewSet(viewsets.ViewSet):
    """
    ViewSet unificado para gestão do estabelecimento (RF-13)
    Endpoint: /api/gestao/estabelecimento/
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'])
    def estabelecimento(self, request):
        """
        GET /api/gestao/estabelecimento/ - Retorna dados do estabelecimento
        PATCH /api/gestao/estabelecimento/ - Atualiza dados do estabelecimento
        """
        if request.method == 'GET':
            # Retorna dados do estabelecimento do usuário logado
            estabelecimento = EstabelecimentoService.obter_estabelecimento_usuario(request.user)

            data = {
                'id': estabelecimento.id,
                'nome_fantasia': estabelecimento.nome_fantasia,
                'cnpj': estabelecimento.cnpj,
                'endereco_completo': estabelecimento.endereco_completo,
                'is_active': estabelecimento.is_active,
                # RF-21: Logo retornada no GET para o frontend exibir imediatamente
                'logo_url': request.build_absolute_uri(estabelecimento.logo.url) if estabelecimento.logo else None,
                'slug': estabelecimento.slug,
            }
            return Response(data)

        elif request.method == 'PATCH':
            # Atualiza dados do estabelecimento (RF-13 + RF-21)
            try:
                # Validação de campos permitidos (incluindo upload de logo)
                campos_permitidos = ['nome_fantasia', 'cnpj', 'endereco_completo', 'logo']
                dados_filtrados = {
                    k: v for k, v in request.data.items()
                    if k in campos_permitidos
                }

                if not dados_filtrados:
                    return Response(
                        {'error': 'Nenhum campo válido fornecido para atualização.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                estabelecimento = EstabelecimentoService.atualizar_dados_estabelecimento(
                    request.user, dados_filtrados
                )

                # CA-05: Dados refletidos imediatamente na resposta
                data = {
                    'id': estabelecimento.id,
                    'nome_fantasia': estabelecimento.nome_fantasia,
                    'cnpj': estabelecimento.cnpj,
                    'endereco_completo': estabelecimento.endereco_completo,
                    'is_active': estabelecimento.is_active,
                    'logo_url': request.build_absolute_uri(estabelecimento.logo.url) if estabelecimento.logo else None,
                    'slug': estabelecimento.slug,
                    'message': 'Dados da unidade atualizados com sucesso!'
                }
                return Response(data)

            except ValidationError as e:
                # Mapeia erros técnicos para mensagens legíveis ao gestor
                mensagem = str(e)
                if 'CNPJ' in mensagem and 'em uso' in mensagem:
                    mensagem = 'Este CNPJ já está vinculado a outra unidade cadastrada no sistema.'
                elif 'CNPJ' in mensagem:
                    mensagem = 'CNPJ inválido. Verifique se o número contém exatamente 14 dígitos.'
                return Response({'error': mensagem}, status=status.HTTP_400_BAD_REQUEST)

            except PermissionDenied as e:
                return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

            except Exception as e:
                return Response(
                    {'error': 'Não foi possível salvar as alterações. Tente novamente em instantes.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    @action(detail=False, methods=['get', 'post'], permission_classes=[IsAuthenticated, IsGestorOnly])
    def funcionarios(self, request):
        """
        GET /api/gestao/funcionarios/ - Lista funcionários do estabelecimento
        POST /api/gestao/funcionarios/ - Cadastra novo funcionário
        """
        if request.method == 'GET':
            from accounts.serializers import FuncionarioSerializer
            funcionarios = FuncionarioService.listar_funcionarios(request.user)
            serializer = FuncionarioSerializer(funcionarios, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            try:
                user_criado = FuncionarioService.criar_funcionario(request.user, request.data)
                from accounts.serializers import FuncionarioSerializer
                serializer = FuncionarioSerializer(user_criado)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except PermissionDenied as e:
                return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsGestorOnly], url_path='funcionarios')
    def funcionarios_detalhe(self, request, pk=None):
        """
        PATCH /api/gestao/funcionarios/<id>/ - Atualiza dados do funcionário (Incluindo Status)
        """
        try:
            # CA-02/CA-03/CA-05: Atualização genérica via Service
            funcionario_atualizado = FuncionarioService.atualizar_funcionario(request.user, pk, request.data)
            from accounts.serializers import FuncionarioSerializer
            serializer = FuncionarioSerializer(funcionario_atualizado)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            print(f"Erro ao atualizar funcionário: {e}")
            return Response({'error': 'Erro ao processar atualização do colaborador.'}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.views import APIView
from django.db.models import Sum
from django.utils.dateparse import parse_date
from django.utils import timezone

class DashboardAPIView(APIView):
    """
    GET /api/gestao/gestor/dashboard/indicadores
    RF-19: Dashboard Executivo Básico
    """
    permission_classes = [IsAuthenticated, IsGestorOnly]

    def get(self, request):
        from operacao.models import OrdemServico
        data_str = request.query_params.get('data')
        
        if data_str:
            data_filtro = parse_date(data_str)
            if not data_filtro:
                return Response({'error': 'Data inválida. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            data_filtro = timezone.localtime().date()

        gestor = request.user.perfil_gestor
        
        # O SQLite possui bugs documentados ao usar __date exato, então faremos uma range de 7 dias 
        # (que funciona perfeitamente __gte e __lte) e faremos a apuração matemática local no Python, o que é 10x mais seguro.
        data_ini_semana = data_filtro - timezone.timedelta(days=6)
        
        ordens_semana = OrdemServico.objects.filter(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
            horario_finalizacao__date__gte=data_ini_semana,
            horario_finalizacao__date__lte=data_filtro
        ).select_related('servico')

        receita_semanal_dict = { (data_ini_semana + timezone.timedelta(days=i)).strftime('%Y-%m-%d'): 0.0 for i in range(7) }
        volume_por_hora = [0] * 24
        total_os = 0
        receita_total = 0.0
        
        for os in ordens_semana:
            if os.horario_finalizacao:
                os_local = timezone.localtime(os.horario_finalizacao)
                data_str = os_local.date().strftime('%Y-%m-%d')
                
                # Montando array de Receita Semanal
                if data_str in receita_semanal_dict:
                    receita_semanal_dict[data_str] += float(os.servico.preco)
                
                # Apuração EXATA do dia atual (data_filtro)
                if os_local.date() == data_filtro:
                    total_os += 1
                    receita_total += float(os.servico.preco)
                    volume_por_hora[os_local.hour] += 1
                    
        receita_semanal = [{'data': k, 'valor': round(v, 2)} for k, v in receita_semanal_dict.items()]

        from operacao.models import IncidenteOS
        
        incidentes_ativos = IncidenteOS.objects.filter(
            ordem_servico__estabelecimento=gestor.estabelecimento,
            resolvido=False
        ).count()

        return Response({
            'totalOsFinalizadas': total_os,
            'receitaTotal': round(receita_total, 2),
            'volume_por_hora': volume_por_hora,
            'receita_semanal': receita_semanal,
            'incidentesAtivos': incidentes_ativos
        })

class EficienciaAPIView(APIView):
    """
    GET /api/gestao/gestor/dashboard/eficiencia-equipe
    RF-20: Relatório de Eficiência da Equipe
    """
    permission_classes = [IsAuthenticated, IsGestorOnly]

    def get(self, request):
        from operacao.models import OrdemServico
        data_ini_str = request.query_params.get('dataInicio')
        data_fim_str = request.query_params.get('dataFim')
        
        # Intervalo default: última semana caso não seja provido
        data_fim = parse_date(data_fim_str) if data_fim_str else timezone.localtime().date()
        data_ini = parse_date(data_ini_str) if data_ini_str else (data_fim - timezone.timedelta(days=7))
        
        if not data_fim or not data_ini:
            return Response({'error': 'Datas fornecidas inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        gestor = request.user.perfil_gestor
        
        ordens = OrdemServico.objects.filter(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
            horario_finalizacao__date__gte=data_ini,
            horario_finalizacao__date__lte=data_fim
        ).select_related('funcionario', 'servico')

        # Agrupamento via Python Dictionary (Robusto para cross-db tests vs DurationField bugs)
        dados_equipe = {}
        
        for os in ordens:
            func_id = os.funcionario.id if os.funcionario else 0
            if func_id not in dados_equipe:
                # O ID pode ser None teoricamente (usuario deletado mas protected não deixa se tiver modelado correto),
                nome = 'Sem Nome'
                if os.funcionario:
                    nome = getattr(os.funcionario, 'name', None) or os.funcionario.username
                
                dados_equipe[func_id] = {
                    'funcionarioId': func_id,
                    'nomeFuncionario': nome,
                    'totalOs': 0,
                    'tempoTotalEstimadoMinutos': 0,
                    'tempoTotalRealMinutos': 0,
                }
            
            duracao_real = 0
            if os.horario_finalizacao and os.horario_lavagem:
                duracao_real = round((os.horario_finalizacao - os.horario_lavagem).total_seconds() / 60)
            
            dados_equipe[func_id]['totalOs'] += 1
            dados_equipe[func_id]['tempoTotalEstimadoMinutos'] += os.servico.duracao_estimada_minutos
            dados_equipe[func_id]['tempoTotalRealMinutos'] += duracao_real
            
        resultados = []
        for item in dados_equipe.values():
            item['desvioTotalMinutos'] = item['tempoTotalRealMinutos'] - item['tempoTotalEstimadoMinutos']
            resultados.append(item)
            
        return Response(resultados)