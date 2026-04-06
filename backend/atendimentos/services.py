import datetime
from io import BytesIO
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from PIL import Image
from atendimentos.models import Atendimento, MidiaAtendimento, Servico, Veiculo

MAX_FOTOS_POR_MOMENTO = 10
MAX_DIMENSAO_PX = 1920
QUALIDADE_JPEG = 85
HORARIO_ABERTURA = datetime.time(8, 0)
HORARIO_FECHAMENTO = datetime.time(18, 0)
SLOT_MINUTOS = 30

class MidiaAtendimentoService:
    STATUS_PERMITIDOS = {'agendado', 'em_andamento'}

    @staticmethod
    def processar_upload_multiplo(atendimento, momento, arquivos, parte_nome=''):
        if atendimento.status not in MidiaAtendimentoService.STATUS_PERMITIDOS:
            raise ValidationError(f'Status "{atendimento.get_status_display()}" não permite mídias.')

        fotos_existentes = MidiaAtendimento.objects.filter(atendimento=atendimento, momento=momento).count()
        if fotos_existentes + len(arquivos) > MAX_FOTOS_POR_MOMENTO:
            vagas = MAX_FOTOS_POR_MOMENTO - fotos_existentes
            raise ValidationError(f'Limite de {MAX_FOTOS_POR_MOMENTO} fotos atingido. Vagas: {max(vagas, 0)}.')

        arquivos_processados = [MidiaAtendimentoService._comprimir_imagem(arq) for arq in arquivos]
        midias = [MidiaAtendimento(atendimento=atendimento, arquivo=arquivo, momento=momento, parte_nome=parte_nome) for arquivo in arquivos_processados]
        return MidiaAtendimento.objects.bulk_create(midias)

    @staticmethod
    def _comprimir_imagem(arquivo):
        img = Image.open(arquivo)
        if img.mode in ('RGBA', 'P'): img = img.convert('RGB')
        if img.width > MAX_DIMENSAO_PX or img.height > MAX_DIMENSAO_PX:
            img.thumbnail((MAX_DIMENSAO_PX, MAX_DIMENSAO_PX), Image.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=QUALIDADE_JPEG, optimize=True)
        buffer.seek(0)
        nome_original = getattr(arquivo, 'name', 'foto.jpg')
        nome_saida = f"{nome_original.rsplit('.', 1)[0]}.jpg"
        return InMemoryUploadedFile(
            file=buffer, 
            field_name='arquivo', 
            name=nome_saida, 
            content_type='image/jpeg', 
            size=buffer.getbuffer().nbytes, 
            charset=None
        )

class AtendimentoService:
    @staticmethod
    def listar_historico_por_periodo(funcionario, data_inicial, data_final, status='todos'):
        if data_inicial > data_final: 
            raise ValidationError('A data inicial não pode ser maior que a data final.')
        
        filtros = {
            'funcionario': funcionario, 
            'data_hora__date__gte': data_inicial, 
            'data_hora__date__lte': data_final
        }
        if status and status != 'todos': 
            filtros['status'] = status
            
        return Atendimento.objects.filter(**filtros).select_related('veiculo', 'servico').prefetch_related('midias').order_by('-data_hora')

    @staticmethod
    def verificar_conflito(data_hora, duracao):
        fim = data_hora + duracao
        conflitos = Atendimento.objects.filter(data_hora__date=data_hora.date(), status__in=['agendado', 'em_andamento'])
        for a in conflitos:
            a_inicio = timezone.localtime(a.data_hora)
            a_fim = a_inicio + datetime.timedelta(minutes=a.servico.duracao_estimada_min)
            if data_hora < a_fim and a_inicio < fim: 
                raise ValidationError('Conflito de horário com outro agendamento.')

    @staticmethod
    def get_horarios_livres(data_str, servico_id):
        servico = get_object_or_404(Servico, pk=servico_id)
        from django.utils.dateparse import parse_date
        data = parse_date(data_str)
        ocupados = [
            (timezone.localtime(a.data_hora), timezone.localtime(a.data_hora) + datetime.timedelta(minutes=a.servico.duracao_estimada_min)) 
            for a in Atendimento.objects.filter(data_hora__date=data, status__in=['agendado', 'em_andamento'])
        ]
        horarios = []
        curr = timezone.make_aware(datetime.datetime.combine(data, HORARIO_ABERTURA))
        fim = timezone.make_aware(datetime.datetime.combine(data, HORARIO_FECHAMENTO))
        dur = datetime.timedelta(minutes=servico.duracao_estimada_min)
        while curr + dur <= fim:
            if curr >= timezone.localtime() and not any(curr < o_fim and o_inicio < curr + dur for o_inicio, o_fim in ocupados):
                horarios.append(curr.strftime('%H:%M'))
            curr += datetime.timedelta(minutes=SLOT_MINUTOS)
        return horarios

    @staticmethod
    def criar_com_veiculo(dados, funcionario):
        servico = get_object_or_404(Servico, pk=dados['servico_id'])
        AtendimentoService.verificar_conflito(dados['data_hora'], datetime.timedelta(minutes=servico.duracao_estimada_min))
        
        veiculo, _ = Veiculo.objects.update_or_create(
            placa=dados['placa'], 
            defaults={
                'modelo': dados['modelo'], 
                'marca': dados['marca'], 
                'cor': dados['cor'], 
                'nome_dono': dados['nome_dono'], 
                'celular_dono': dados['celular_dono'],
                'ano': dados.get('ano')
            }
        )
        
        iniciar = dados.get('iniciar_agora', False)
        return Atendimento.objects.create(
            veiculo=veiculo, 
            servico=servico, 
            funcionario=funcionario, 
            data_hora=dados['data_hora'], 
            horario_inicio=timezone.now() if iniciar else None, 
            status='em_andamento' if iniciar else 'agendado', 
            etapa_atual=1, 
            observacoes=dados.get('observacoes', '')
        )

    @staticmethod
    def avancar_etapa(atendimento, novos_dados):
        etapa_atual = atendimento.etapa_atual

        # 1. Transição: Vistoria -> Lavagem
        if etapa_atual == 1:
            # Primeiro, atualizamos as partes de avaria com os dados novos
            if 'partes_avaria' in novos_dados:
                atendimento.partes_avaria = novos_dados['partes_avaria']
                atendimento.save()

            # VALIDAÇÃO CRÍTICA:
            # Se a lista de avarias não estiver vazia, verificamos as fotos no DB
            if atendimento.partes_avaria:
                # Contamos as fotos reais vinculadas a este atendimento como 'ANTES'
                qtd_fotos_no_db = atendimento.midias.filter(momento='ANTES').count()
                qtd_partes_marcadas = len(atendimento.partes_avaria)
                
                if qtd_fotos_no_db < qtd_partes_marcadas:
                    raise ValidationError(
                        f"Impossível avançar: Foram marcadas {qtd_partes_marcadas} avarias, "
                        f"mas o sistema registou apenas {qtd_fotos_no_db} fotos. "
                        "Por favor, capture todas as fotos obrigatórias."
                    )

            # Se passar na validação ou não houver avarias, permite o avanço
            atendimento.etapa_atual = 2
            atendimento.horario_lavagem = timezone.now()
            
            if atendimento.status == 'agendado':
                atendimento.status = 'em_andamento'
                atendimento.horario_inicio = timezone.now()

        # 3. Acabamento -> Liberação
        elif etapa_atual == 3:
            if 'vaga_patio' in novos_dados:
                if not novos_dados.get('vaga_patio'):
                    raise ValidationError("Informe a localização (vaga) do veículo no pátio.")
                atendimento.etapa_atual = 4

        atendimento.save()
        return atendimento


    @staticmethod
    def finalizar(atendimento):
        """Finaliza o atendimento registrando o horário de conclusão (RF-06)."""
        if atendimento.status != 'em_andamento': 
            raise ValidationError('Apenas atendimentos em andamento podem ser finalizados.')
        
        # Validação de fotos do DEPOIS baseada nas avarias da Vistoria
        qtd_avarias = len(atendimento.partes_avaria)
        qtd_fotos_depois = atendimento.midias.filter(momento='DEPOIS').count()
        
        if qtd_avarias > 0 and qtd_fotos_depois < qtd_avarias:
            raise ValidationError(
                f'Erro de Segurança: Existem {qtd_avarias} avarias registadas, '
                f'mas apenas {qtd_fotos_depois} fotos do "DEPOIS" foram enviadas.'
            )
        
        # Caso não haja avarias, exige-se pelo menos uma foto geral de entrega
        if qtd_avarias == 0 and qtd_fotos_depois == 0:
            raise ValidationError('É obrigatório enviar pelo menos uma foto do estado final do veículo.')

        atendimento.status = 'finalizado'
        atendimento.horario_finalizacao = timezone.now()
        atendimento.save()
        return atendimento