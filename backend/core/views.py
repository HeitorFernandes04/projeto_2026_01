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


class TagPecaListView(generics.ListAPIView):
    """Lista tags de peça do estabelecimento do usuário."""
    permission_classes = [IsAuthenticated]
    serializer_class = TagPecaSerializer

    def get_queryset(self):
        return TagPeca.objects.filter(
            estabelecimento=self.request.user.estabelecimento
        ).order_by('nome')


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
                'is_active': estabelecimento.is_active
            }
            return Response(data)
        
        elif request.method == 'PATCH':
            # Atualiza dados do estabelecimento (RF-13)
            try:
                dados_atualizacao = request.data
                
                # Validação de campos permitidos
                campos_permitidos = ['nome_fantasia', 'cnpj', 'endereco_completo']
                dados_filtrados = {
                    k: v for k, v in dados_atualizacao.items() 
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
                    'message': 'Dados atualizados com sucesso.'
                }
                return Response(data)
                
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except PermissionDenied as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_403_FORBIDDEN
                )
            except Exception as e:
                return Response(
                    {'error': 'Erro interno do servidor.'},
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
        
        ordens = OrdemServico.objects.filter(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
            horario_finalizacao__date=data_filtro
        )

        total_os = ordens.count()
        receita_total = ordens.aggregate(total=Sum('servico__preco'))['total'] or 0.0
        
        # 1. Volume por Hora do dia (Gráfico de Linha Diário)
        volume_por_hora = [0] * 24
        for os in ordens:
            if os.horario_finalizacao:
                # Transforma a hora local pra alinhar graficamente (opcional)
                hora_local = timezone.localtime(os.horario_finalizacao).hour
                volume_por_hora[hora_local] += 1
                
        # 2. Receita Semanal (Últimos 7 dias) - Gráfico de Área
        data_ini_semana = data_filtro - timezone.timedelta(days=6)
        ordens_semana = OrdemServico.objects.filter(
            estabelecimento=gestor.estabelecimento,
            status='FINALIZADO',
            horario_finalizacao__date__gte=data_ini_semana,
            horario_finalizacao__date__lte=data_filtro
        ).select_related('servico')
        
        receita_semanal_dict = { (data_ini_semana + timezone.timedelta(days=i)).strftime('%Y-%m-%d'): 0.0 for i in range(7) }
        
        for os in ordens_semana:
            if os.horario_finalizacao:
                data_str = timezone.localtime(os.horario_finalizacao).date().strftime('%Y-%m-%d')
                if data_str in receita_semanal_dict:
                    receita_semanal_dict[data_str] += float(os.servico.preco)
                    
        receita_semanal = [{'data': k, 'valor': round(v, 2)} for k, v in receita_semanal_dict.items()]

        return Response({
            'totalOsFinalizadas': total_os,
            'receitaTotal': round(float(receita_total), 2),
            'volume_por_hora': volume_por_hora,
            'receita_semanal': receita_semanal
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