import pytest
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, Cliente, Estabelecimento, Funcionario, Gestor
from core.models import Veiculo, Servico
from operacao.models import OrdemServico, MidiaOrdemServico

@pytest.fixture
def api_client():
    return APIClient()

def generate_photo(name="test.jpg"):
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100))
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type='image/jpeg')

@pytest.fixture
def setup_full_flow_data(db):
    est = Estabelecimento.objects.create(nome_fantasia="Lava Jato Flow", cnpj="99888777000166")
    
    # Criar Gestor
    gestor_user = User.objects.create_user(email="gestor@flow.com", password="password", username="gestor")
    Gestor.objects.create(user=gestor_user, estabelecimento=est)
    
    # Criar Lavador
    lavador_user = User.objects.create_user(email="lavador@flow.com", password="password", username="lavador")
    Funcionario.objects.create(user=lavador_user, estabelecimento=est, cargo="LAVADOR")
    
    # Criar Cliente
    cliente_user = User.objects.create_user(email="cliente@flow.com", password="password", username="cliente")
    cliente = Cliente.objects.create(user=cliente_user)
    
    servico = Servico.objects.create(estabelecimento=est, nome="Lavagem Completa", preco=100.00, duracao_estimada_minutos=60)
    
    return {
        "est": est,
        "gestor": gestor_user,
        "lavador": lavador_user,
        "cliente": cliente_user,
        "servico": servico
    }

@pytest.mark.django_db
def test_rf26_full_lifecycle_and_privacy(api_client, setup_full_flow_data):
    """
    Testa o fluxo completo da RF-26:
    1. Operador cria OS.
    2. Operador faz upload de 5 fotos de Entrada.
    3. Operador avança para Vistoria.
    4. Operador avança para Execução.
    5. Operador faz upload de mídia de Processo (Interna).
    6. Operador avança para Finalização.
    7. Operador faz upload de 5 fotos de Entrega.
    8. Operador finaliza OS.
    9. Cliente acessa galeria pública e valida restrições.
    """
    lavador = setup_full_flow_data["lavador"]
    cliente = setup_full_flow_data["cliente"]
    servico = setup_full_flow_data["servico"]
    
    api_client.force_authenticate(user=lavador)
    
    # 1. Criar OS
    url_criar = reverse('os-criar')
    payload_criar = {
        "placa": "ABC1234",
        "modelo": "Test Flow",
        "marca": "Honda",
        "cor": "BRANCO",
        "nome_dono": "Dono Teste",
        "servico_id": servico.id,
        "data_hora": "2026-05-02T10:00:00Z",
        "iniciar_agora": False
    }
    res_criar = api_client.post(url_criar, payload_criar)
    assert res_criar.status_code == status.HTTP_201_CREATED
    os_id = res_criar.data['id']
    
    # Vincular cliente ao veículo manualmente (simulamos o vínculo preexistente)
    os = OrdemServico.objects.get(id=os_id)
    os.veiculo.cliente = Cliente.objects.get(user=cliente)
    os.veiculo.save()

    # 2. Upload 5 fotos ENTRADA
    url_upload = reverse('os-fotos', kwargs={'pk': os_id})
    photos = [generate_photo(f"entrada_{i}.jpg") for i in range(5)]
    res_up = api_client.post(url_upload, {"arquivos": photos, "momento": "ENTRADA"}, format='multipart')
    assert res_up.status_code == status.HTTP_201_CREATED

    # 3. Avançar para Vistoria Inicial (PATIO -> VISTORIA_INICIAL)
    url_avancar = reverse('os-avancar', kwargs={'pk': os_id})
    res_avancar = api_client.patch(url_avancar, {"laudo_vistoria": "OK"})
    assert res_avancar.status_code == status.HTTP_200_OK
    assert res_avancar.data['status'] == 'VISTORIA_INICIAL'

    # 4. Avançar para Execução (VISTORIA_INICIAL -> EM_EXECUCAO)
    res_avancar = api_client.patch(url_avancar, {"comentario_lavagem": "Iniciando"})
    assert res_avancar.status_code == status.HTTP_200_OK
    assert res_avancar.data['status'] == 'EM_EXECUCAO'

    # 5. Upload mídia PROCESSO (Interna)
    photo_proc = generate_photo("processo.jpg")
    res_up_proc = api_client.post(url_upload, {"arquivos": [photo_proc], "momento": "PROCESSO"}, format='multipart')
    assert res_up_proc.status_code == status.HTTP_201_CREATED

    # 6. Avançar para Finalização (EM_EXECUCAO -> LIBERACAO)
    # Primeiro move para acabamento (internamente na máquina de estados)
    res_avancar = api_client.patch(url_avancar, {}) # horario_acabamento
    assert res_avancar.status_code == status.HTTP_200_OK
    # Depois move para LIBERACAO
    res_avancar = api_client.patch(url_avancar, {"comentario_acabamento": "Pronto"})
    assert res_avancar.status_code == status.HTTP_200_OK
    assert res_avancar.data['status'] == 'LIBERACAO'

    # 7. Upload 5 fotos FINALIZACAO
    photos_final = [generate_photo(f"final_{i}.jpg") for i in range(5)]
    res_up_final = api_client.post(url_upload, {"arquivos": photos_final, "momento": "FINALIZACAO"}, format='multipart')
    assert res_up_final.status_code == status.HTTP_201_CREATED

    # 8. Finalizar OS
    url_finalizar = reverse('os-finalizar', kwargs={'pk': os_id})
    res_finalizar = api_client.patch(url_finalizar, {"vaga_patio": "VAGA-01"})
    assert res_finalizar.status_code == status.HTTP_200_OK
    assert res_finalizar.data['status'] == 'FINALIZADO'

    # 9. Cliente acessa galeria pública
    api_client.force_authenticate(user=cliente)
    url_galeria = reverse('galeria-cliente', kwargs={'pk': os_id})
    res_galeria = api_client.get(url_galeria)
    
    assert res_galeria.status_code == status.HTTP_200_OK
    # Deve conter 10 fotos (5 ENTRADA + 5 FINALIZACAO)
    assert len(res_galeria.data) == 10
    
    momentos = [m['momento'] for m in res_galeria.data]
    assert "ENTRADA" in momentos
    assert "FINALIZACAO" in momentos
    assert "PROCESSO" not in momentos # RF-26: Privacidade garantida
