"""
Testes unitários para a camada de serviço.
RF-04: Criar atendimento com veículo embutido.
RF-05: Upload de fotos antes do atendimento.
RF-06: Upload de fotos após o atendimento.
"""
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from PIL import Image

from atendimentos.models import MidiaAtendimento
from atendimentos.services import MidiaAtendimentoService
from atendimentos.tests.factories import (
    AtendimentoFactory,
    criar_imagem_fake,
    criar_imagem_fake_grande,
)


class TestMidiaAtendimentoService(TestCase):
    """Testes para MidiaAtendimentoService.processar_upload_multiplo"""

    def setUp(self):
        self.atendimento = AtendimentoFactory(status='agendado')

    # -------------------------------------------------------------------
    # Cenários de Sucesso
    # -------------------------------------------------------------------

    def test_upload_multiplo_sucesso_agendado(self):
        """Upload de 2 fotos com momento='ANTES' para atendimento AGENDADO deve criar 2 registros."""
        arquivos = [criar_imagem_fake('foto1.jpg'), criar_imagem_fake('foto2.jpg')]

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=arquivos,
        )

        self.assertEqual(len(midias), 2)
        self.assertEqual(MidiaAtendimento.objects.filter(atendimento=self.atendimento).count(), 2)
        for midia in midias:
            self.assertEqual(midia.momento, 'ANTES')
            self.assertTrue(midia.arquivo.name.startswith('atendimentos/'))

    def test_upload_atendimento_em_andamento_sucesso(self):
        """Upload deve funcionar quando status é EM_ANDAMENTO."""
        self.atendimento.status = 'em_andamento'
        self.atendimento.save()

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[criar_imagem_fake()],
        )

        self.assertEqual(len(midias), 1)

    # -------------------------------------------------------------------
    # Cenários de Falha — Ciclo de Vida
    # -------------------------------------------------------------------

    def test_upload_atendimento_cancelado_falha(self):
        """Upload para atendimento CANCELADO deve levantar ValidationError."""
        self.atendimento.status = 'cancelado'
        self.atendimento.save()

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=[criar_imagem_fake()],
            )

        self.assertIn('status', str(ctx.exception).lower())

    def test_upload_atendimento_finalizado_falha(self):
        """Upload para atendimento FINALIZADO deve levantar ValidationError."""
        self.atendimento.status = 'finalizado'
        self.atendimento.save()

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=[criar_imagem_fake()],
            )

        self.assertIn('status', str(ctx.exception).lower())

    # -------------------------------------------------------------------
    # RF-05/06 — Limite de 5 fotos por momento
    # -------------------------------------------------------------------

    def test_limite_5_fotos_por_momento_bloqueia_sexta(self):
        """Enviar a 6ª foto no mesmo momento deve levantar ValidationError."""
        # Pré-popula 5 fotos ANTES
        MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[criar_imagem_fake(f'f{i}.jpg') for i in range(5)],
        )

        with self.assertRaises(ValidationError) as ctx:
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='ANTES',
                arquivos=[criar_imagem_fake('sexta.jpg')],
            )

        self.assertIn('5', str(ctx.exception))

    def test_limite_5_fotos_estourado_em_lote_unico(self):
        """Enviar 6 fotos de uma vez no mesmo momento deve levantar ValidationError."""
        with self.assertRaises(ValidationError):
            MidiaAtendimentoService.processar_upload_multiplo(
                atendimento=self.atendimento,
                momento='DEPOIS',
                arquivos=[criar_imagem_fake(f'f{i}.jpg') for i in range(6)],
            )

    def test_momentos_diferentes_nao_interferem(self):
        """5 fotos ANTES + 5 fotos DEPOIS devem ser aceitas independentemente."""
        MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[criar_imagem_fake(f'a{i}.jpg') for i in range(5)],
        )
        midias_depois = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='DEPOIS',
            arquivos=[criar_imagem_fake(f'd{i}.jpg') for i in range(5)],
        )

        self.assertEqual(len(midias_depois), 5)
        self.assertEqual(
            MidiaAtendimento.objects.filter(atendimento=self.atendimento).count(), 10,
        )

    # -------------------------------------------------------------------
    # RF-05/06 — Compressão de imagem (Pillow)
    # -------------------------------------------------------------------

    def test_imagem_grande_e_redimensionada_para_max_1920(self):
        """Imagem de 4000x3000 deve ser redimensionada para no máximo 1920px no lado maior."""
        arquivo_grande = criar_imagem_fake_grande('grande.jpg', largura=4000, altura=3000)

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[arquivo_grande],
        )

        img_salva = Image.open(midias[0].arquivo.path)
        self.assertLessEqual(img_salva.width, 1920)
        self.assertLessEqual(img_salva.height, 1920)

    def test_imagem_pequena_nao_e_ampliada(self):
        """Imagem menor que 1920px não deve ser ampliada (upscale)."""
        arquivo_pequeno = criar_imagem_fake('pequena.jpg')  # 10x10

        midias = MidiaAtendimentoService.processar_upload_multiplo(
            atendimento=self.atendimento,
            momento='ANTES',
            arquivos=[arquivo_pequeno],
        )

        img_salva = Image.open(midias[0].arquivo.path)
        self.assertLessEqual(img_salva.width, 10)


class TestAtendimentoService(TestCase):
    """Testes para AtendimentoService.criar_com_veiculo — RF-04."""

    def setUp(self):
        from atendimentos.tests.factories import ServicoFactory, UserFactory
        self.funcionario = UserFactory()
        self.servico = ServicoFactory()

    def _dados_validos(self, **overrides):
        from django.utils import timezone
        import datetime
        dados = {
            'nome_dono': 'João Silva',
            'celular_dono': '63999990000',
            'placa': 'ABC1D23',
            'modelo': 'Onix',
            'marca': 'Chevrolet',
            'cor': 'Prata',
            'servico_id': self.servico.pk,
            'data_hora': timezone.make_aware(datetime.datetime(2026, 4, 1, 10, 0)),
            'observacoes': 'Carro com lama',
        }
        dados.update(overrides)
        return dados

    # -------------------------------------------------------------------
    # Cenário de Sucesso
    # -------------------------------------------------------------------

    def test_criar_atendimento_com_veiculo_sucesso(self):
        """Deve criar veículo + atendimento e retornar a instância de Atendimento."""
        from atendimentos.services import AtendimentoService
        from atendimentos.models import Atendimento, Veiculo

        dados = self._dados_validos()
        atendimento = AtendimentoService.criar_com_veiculo(
            dados=dados, funcionario=self.funcionario,
        )

        self.assertIsInstance(atendimento, Atendimento)
        self.assertEqual(atendimento.funcionario, self.funcionario)
        self.assertEqual(atendimento.servico, self.servico)
        self.assertEqual(atendimento.veiculo.placa, 'ABC1D23')
        self.assertEqual(Veiculo.objects.count(), 1)

    # -------------------------------------------------------------------
    # Reutilização de veículo pela placa
    # -------------------------------------------------------------------

    def test_veiculo_existente_e_atualizado_pela_placa(self):
        """Se já existe veículo com a mesma placa, atualiza os campos e reutiliza."""
        from atendimentos.services import AtendimentoService
        from atendimentos.models import Veiculo
        from django.utils import timezone
        import datetime

        # Primeiro atendimento cria o veículo
        AtendimentoService.criar_com_veiculo(
            dados=self._dados_validos(cor='Prata'),
            funcionario=self.funcionario,
        )

        # Segundo com mesma placa mas cor diferente (horário diferente para não dar conflito)
        dt_novo = timezone.make_aware(datetime.datetime(2026, 4, 1, 15, 0))
        AtendimentoService.criar_com_veiculo(
            dados=self._dados_validos(cor='Preto', data_hora=dt_novo),
            funcionario=self.funcionario,
        )

        self.assertEqual(Veiculo.objects.count(), 1)
        self.assertEqual(Veiculo.objects.first().cor, 'Preto')

    # -------------------------------------------------------------------
    # Cenário de Falha — Serviço inexistente
    # -------------------------------------------------------------------

    def test_servico_inexistente_levanta_erro(self):
        """servico_id de um serviço que não existe deve levantar Http404."""
        from atendimentos.services import AtendimentoService
        from django.http import Http404

        dados = self._dados_validos(servico_id=99999)

        with self.assertRaises(Http404):
            AtendimentoService.criar_com_veiculo(
                dados=dados, funcionario=self.funcionario,
            )

    # -------------------------------------------------------------------
    # RF-06 — Finalizar Serviço
    # -------------------------------------------------------------------

    def test_finalizar_status_invalido(self):
        """Não pode finalizar se não estiver em andamento."""
        from atendimentos.services import AtendimentoService
        from django.core.exceptions import ValidationError
        from atendimentos.tests.factories import AtendimentoFactory

        atendimento = AtendimentoFactory(funcionario=self.funcionario, status='agendado')

        with self.assertRaisesMessage(ValidationError, 'Apenas atendimentos em andamento podem ser finalizados.'):
            AtendimentoService.finalizar(atendimento)

    def test_finalizar_sem_foto_depois(self):
        """Não pode finalizar se estiver em andamento mas não tiver foto do DEPOIS."""
        from atendimentos.services import AtendimentoService
        from django.core.exceptions import ValidationError
        from atendimentos.models import MidiaAtendimento
        from atendimentos.tests.factories import AtendimentoFactory

        atendimento = AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')

        # Tem foto do ANTES apenas
        MidiaAtendimento.objects.create(atendimento=atendimento, arquivo='fake.jpg', momento='ANTES')
        
        with self.assertRaisesMessage(ValidationError, 'Não é possível finalizar sem enviar as fotos do DEPOIS.'):
            AtendimentoService.finalizar(atendimento)

    def test_finalizar_com_foto_depois_sucesso(self):
        """Finaliza com sucesso se tiver foto do DEPOIS."""
        from atendimentos.services import AtendimentoService
        from atendimentos.models import MidiaAtendimento
        from atendimentos.tests.factories import AtendimentoFactory

        atendimento = AtendimentoFactory(funcionario=self.funcionario, status='em_andamento')

        MidiaAtendimento.objects.create(atendimento=atendimento, arquivo='fake.jpg', momento='DEPOIS')
        
        atualizado = AtendimentoService.finalizar(atendimento)
        self.assertEqual(atualizado.status, 'finalizado')

    # -------------------------------------------------------------------
    # RF-09 — Conflito de Horário
    # -------------------------------------------------------------------

    def test_criar_com_conflito_levanta_erro(self):
        """Bloquear criação se houver colisão de horários considerando a duração (RF-09)."""
        from atendimentos.services import AtendimentoService
        from django.core.exceptions import ValidationError
        from django.utils import timezone
        import datetime

        dt_inicio = timezone.make_aware(datetime.datetime(2026, 4, 1, 10, 0))
        dt_conflito = timezone.make_aware(datetime.datetime(2026, 4, 1, 10, 20))

        dados = self._dados_validos(data_hora=dt_inicio)
        AtendimentoService.criar_com_veiculo(dados=dados, funcionario=self.funcionario)

        dados_conflito = self._dados_validos(data_hora=dt_conflito, placa='XYZ0000')

        with self.assertRaises(ValidationError) as ctx:
            AtendimentoService.criar_com_veiculo(dados=dados_conflito, funcionario=self.funcionario)
        
        self.assertIn('entra em conflito', str(ctx.exception))

    def test_ignora_conflito_em_finalizado(self):
        """Conflitos não se aplicam se o atendimento prévio já estiver finalizado (liberação antecipada)."""
        from atendimentos.services import AtendimentoService
        from django.utils import timezone
        import datetime
        
        dt_inicio = timezone.make_aware(datetime.datetime(2026, 4, 1, 10, 0))
        dt_novo = timezone.make_aware(datetime.datetime(2026, 4, 1, 10, 20))

        dados = self._dados_validos(data_hora=dt_inicio)
        atendimento = AtendimentoService.criar_com_veiculo(dados=dados, funcionario=self.funcionario)
        atendimento.status = 'finalizado'
        atendimento.save()

        dados_novo = self._dados_validos(data_hora=dt_novo, placa='XYZ0000')
        novo_atendimento = AtendimentoService.criar_com_veiculo(dados=dados_novo, funcionario=self.funcionario)
        
        self.assertEqual(novo_atendimento.veiculo.placa, 'XYZ0000')

    def test_listar_historico_por_periodo_sem_status_retorna_todos_os_status_do_funcionario_no_intervalo(self):
        """Deve retornar apenas atendimentos finalizados do funcionÃ¡rio dentro do perÃ­odo informado."""
        from atendimentos.services import AtendimentoService
        from atendimentos.tests.factories import UserFactory
        import datetime

        outro_funcionario = UserFactory()

        dentro_periodo = AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 10, 9, 0)),
        )
        outro_status_mesmo_periodo = AtendimentoFactory(
            funcionario=self.funcionario,
            status='agendado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 11, 9, 0)),
        )
        AtendimentoFactory(
            funcionario=outro_funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 12, 9, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 15, 9, 0)),
        )

        historico = AtendimentoService.listar_historico_por_periodo(
            funcionario=self.funcionario,
            data_inicial=datetime.date(2026, 3, 10),
            data_final=datetime.date(2026, 3, 12),
        )

        self.assertEqual(list(historico), [outro_status_mesmo_periodo, dentro_periodo])

    def test_listar_historico_por_periodo_filtra_por_status_quando_informado(self):
        """Com filtro de status, deve retornar somente o status solicitado dentro do período."""
        from atendimentos.services import AtendimentoService
        import datetime

        finalizado = AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 10, 9, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='agendado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 11, 9, 0)),
        )
        AtendimentoFactory(
            funcionario=self.funcionario,
            status='em_andamento',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 12, 9, 0)),
        )

        historico = AtendimentoService.listar_historico_por_periodo(
            funcionario=self.funcionario,
            data_inicial=datetime.date(2026, 3, 10),
            data_final=datetime.date(2026, 3, 12),
            status='finalizado',
        )

        self.assertEqual(list(historico), [finalizado])

    def test_listar_historico_por_periodo_inclui_datas_limite_e_ordena_do_mais_recente(self):
        """O perÃ­odo deve ser inclusivo e o histÃ³rico deve vir do mais recente para o mais antigo."""
        from atendimentos.services import AtendimentoService
        import datetime

        mais_antigo = AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 1, 8, 0)),
        )
        mais_recente = AtendimentoFactory(
            funcionario=self.funcionario,
            status='finalizado',
            data_hora=timezone.make_aware(datetime.datetime(2026, 3, 30, 18, 0)),
        )

        historico = list(
            AtendimentoService.listar_historico_por_periodo(
                funcionario=self.funcionario,
                data_inicial=datetime.date(2026, 3, 1),
                data_final=datetime.date(2026, 3, 30),
            )
        )

        self.assertEqual(historico, [mais_recente, mais_antigo])

    def test_listar_historico_por_periodo_rejeita_intervalo_invalido(self):
        """Data inicial maior que data final deve levantar ValidationError."""
        from atendimentos.services import AtendimentoService
        import datetime

        with self.assertRaisesMessage(ValidationError, 'A data inicial nÃ£o pode ser maior que a data final.'):
            AtendimentoService.listar_historico_por_periodo(
                funcionario=self.funcionario,
                data_inicial=datetime.date(2026, 4, 20),
                data_final=datetime.date(2026, 4, 10),
            )

    def test_listar_historico_por_periodo_rejeita_datas_futuras(self):
        """Histórico não deve aceitar consulta com datas futuras."""
        from atendimentos.services import AtendimentoService
        import datetime

        with self.assertRaisesMessage(ValidationError, 'O periodo do historico nao pode incluir datas futuras.'):
            AtendimentoService.listar_historico_por_periodo(
                funcionario=self.funcionario,
                data_inicial=timezone.localdate(),
                data_final=timezone.localdate() + datetime.timedelta(days=1),
            )

