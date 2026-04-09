import { IonContent, IonPage, IonSpinner, useIonViewWillEnter, IonAlert, IonToast } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje, criarOrdemServico } from '../../services/api';
import '../../theme/lava-me.css';

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  nome_dono: string;
  celular_dono: string;
}

interface Servico {
  id: number;
  nome: string;
  preco: string;
  duracao_estimada_min: number;
}

interface Atendimento {
  id: number;
  veiculo: Veiculo;
  servico: Servico;
  data_hora: string;
  horario_inicio: string | null;
  status: string;
  observacoes: string;
}

interface EtapaNova {
  nome: string;
  tempo_estimado: string;
  ordem: number;
}

interface MaterialNovo {
  nome: string;
  quantidade: string;
  unidade: string;
  custo_unitario: string;
}

const NovaOrdemServico: React.FC = () => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [etapas, setEtapas] = useState<EtapaNova[]>([]);
  const [materiais, setMateriais] = useState<MaterialNovo[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [novaEtapa, setNovaEtapa] = useState<EtapaNova>({
    nome: '',
    tempo_estimado: '00:30:00',
    ordem: 1
  });
  
  const [novoMaterial, setNovoMaterial] = useState<MaterialNovo>({
    nome: '',
    quantidade: '',
    unidade: '',
    custo_unitario: ''
  });

  const [showEtapaForm, setShowEtapaForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  const history = useHistory();

  const carregarAtendimentos = async () => {
    try {
      setLoading(true);
      const response = await getAtendimentosHoje();
      // Filtrar apenas atendimentos em andamento que não possuem OS
      const atendimentosDisponiveis = response.data.filter((atendimento: Atendimento) => 
        atendimento.status === 'em_andamento'
      );
      setAtendimentos(atendimentosDisponiveis);
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
      setToastMessage('Erro ao carregar atendimentos disponíveis');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    carregarAtendimentos();
  });

  const handleAdicionarEtapa = () => {
    if (novaEtapa.nome.trim()) {
      setEtapas([...etapas, { ...novaEtapa, ordem: etapas.length + 1 }]);
      setNovaEtapa({ nome: '', tempo_estimado: '00:30:00', ordem: etapas.length + 2 });
      setShowEtapaForm(false);
      setToastMessage('Etapa adicionada com sucesso');
      setShowToast(true);
    }
  };

  const handleRemoverEtapa = (index: number) => {
    const novasEtapas = etapas.filter((_, i) => i !== index);
    setEtapas(novasEtapas.map((etapa, i) => ({ ...etapa, ordem: i + 1 })));
  };

  const handleAdicionarMaterial = () => {
    if (novoMaterial.nome.trim() && novoMaterial.quantidade && novoMaterial.unidade && novoMaterial.custo_unitario) {
      setMateriais([...materiais, novoMaterial]);
      setNovoMaterial({ nome: '', quantidade: '', unidade: '', custo_unitario: '' });
      setShowMaterialForm(false);
      setToastMessage('Material adicionado com sucesso');
      setShowToast(true);
    } else {
      setToastMessage('Preencha todos os campos do material');
      setShowToast(true);
    }
  };

  const handleRemoverMaterial = (index: number) => {
    setMateriais(materiais.filter((_, i) => i !== index));
  };

  const handleCriarOS = async () => {
    if (!atendimentoSelecionado) {
      setToastMessage('Selecione um atendimento');
      setShowToast(true);
      return;
    }

    try {
      setCriando(true);
      const dadosOS = {
        atendimento_id: atendimentoSelecionado,
        descricao,
        etapas: etapas.length > 0 ? etapas : undefined,
        materiais: materiais.length > 0 ? materiais : undefined
      };

      const response = await criarOrdemServico(dadosOS);
      setToastMessage('Ordem de serviço criada com sucesso');
      setShowToast(true);
      
      setTimeout(() => {
        history.push(`/ordens-servico/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      setToastMessage('Erro ao criar ordem de serviço');
      setShowToast(true);
    } finally {
      setCriando(false);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <IonPage className="lm-page">
        <IonContent>
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Carregando atendimentos...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="lm-page">
      <IonContent>
        <div className="ion-padding">
          <h1>Nova Ordem de Serviço</h1>

          {/* Seleção de Atendimento */}
          <div className="lm-card ion-padding ion-margin-top">
            <h3>Selecione o Atendimento</h3>
            {atendimentos.length === 0 ? (
              <p className="ion-text-muted">Nenhum atendimento em andamento disponível</p>
            ) : (
              <div className="ion-margin-top">
                {atendimentos.map(atendimento => (
                  <div
                    key={atendimento.id}
                    className={`lm-card ion-padding ion-margin-bottom ${atendimentoSelecionado === atendimento.id ? 'lm-card-selected' : ''}`}
                    onClick={() => setAtendimentoSelecionado(atendimento.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ion-justify-content-between ion-align-items-center">
                      <div>
                        <p className="ion-no-margin ion-text-capitalize">
                          <strong>{atendimento.veiculo.placa}</strong> - {atendimento.veiculo.modelo}
                        </p>
                        <p className="ion-text-muted ion-no-margin">
                          {atendimento.veiculo.nome_dono}
                        </p>
                        <p className="ion-text-muted ion-no-margin">
                          {atendimento.servico.nome}
                        </p>
                      </div>
                      <div className="ion-text-right">
                        <p className="ion-no-margin ion-text-muted">
                          {formatarData(atendimento.data_hora)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="lm-card ion-padding ion-margin-top">
            <h3>Descrição</h3>
            <textarea
              className="lm-input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva os detalhes da ordem de serviço..."
            />
          </div>

          {/* Etapas */}
          <div className="lm-card ion-padding ion-margin-top">
            <div className="ion-justify-content-between ion-align-items-center">
              <h3>Etapas</h3>
              <button
                className="lm-btn-primary ion-text-capitalize"
                onClick={() => setShowEtapaForm(!showEtapaForm)}
              >
                {showEtapaForm ? 'Cancelar' : 'Adicionar Etapa'}
              </button>
            </div>

            {showEtapaForm && (
              <div className="ion-margin-top">
                <div className="ion-grid ion-grid-cols-2">
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Nome da etapa"
                    value={novaEtapa.nome}
                    onChange={(e) => setNovaEtapa({...novaEtapa, nome: e.target.value})}
                  />
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Tempo estimado (HH:MM:SS)"
                    value={novaEtapa.tempo_estimado}
                    onChange={(e) => setNovaEtapa({...novaEtapa, tempo_estimado: e.target.value})}
                  />
                </div>
                <div className="ion-margin-top">
                  <button
                    className="lm-btn-primary"
                    onClick={handleAdicionarEtapa}
                  >
                    Adicionar Etapa
                  </button>
                </div>
              </div>
            )}

            {etapas.length > 0 && (
              <div className="ion-margin-top">
                {etapas.map((etapa, index) => (
                  <div key={index} className="ion-margin-bottom">
                    <div className="ion-justify-content-between ion-align-items-center">
                      <div>
                        <p className="ion-no-margin ion-text-capitalize">
                          {etapa.ordem}. {etapa.nome}
                        </p>
                        <p className="ion-text-muted ion-no-margin">{etapa.tempo_estimado}</p>
                      </div>
                      <button
                        className="lm-badge lm-badge-cancelado"
                        onClick={() => handleRemoverEtapa(index)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materiais */}
          <div className="lm-card ion-padding ion-margin-top">
            <div className="ion-justify-content-between ion-align-items-center">
              <h3>Materiais</h3>
              <button
                className="lm-btn-primary ion-text-capitalize"
                onClick={() => setShowMaterialForm(!showMaterialForm)}
              >
                {showMaterialForm ? 'Cancelar' : 'Adicionar Material'}
              </button>
            </div>

            {showMaterialForm && (
              <div className="ion-margin-top">
                <div className="ion-grid ion-grid-cols-2">
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Nome do material"
                    value={novoMaterial.nome}
                    onChange={(e) => setNovoMaterial({...novoMaterial, nome: e.target.value})}
                  />
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Quantidade"
                    value={novoMaterial.quantidade}
                    onChange={(e) => setNovoMaterial({...novoMaterial, quantidade: e.target.value})}
                  />
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Unidade"
                    value={novoMaterial.unidade}
                    onChange={(e) => setNovoMaterial({...novoMaterial, unidade: e.target.value})}
                  />
                  <input
                    type="text"
                    className="lm-input"
                    placeholder="Custo unitário"
                    value={novoMaterial.custo_unitario}
                    onChange={(e) => setNovoMaterial({...novoMaterial, custo_unitario: e.target.value})}
                  />
                </div>
                <div className="ion-margin-top">
                  <button
                    className="lm-btn-primary"
                    onClick={handleAdicionarMaterial}
                  >
                    Adicionar Material
                  </button>
                </div>
              </div>
            )}

            {materiais.length > 0 && (
              <div className="ion-margin-top">
                {materiais.map((material, index) => (
                  <div key={index} className="ion-margin-bottom">
                    <div className="ion-justify-content-between ion-align-items-center">
                      <div>
                        <p className="ion-no-margin">{material.nome}</p>
                        <p className="ion-text-muted ion-no-margin">
                          {material.quantidade} {material.unidade} × R$ {material.custo_unitario}
                        </p>
                      </div>
                      <button
                        className="lm-badge lm-badge-cancelado"
                        onClick={() => handleRemoverMaterial(index)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Criar */}
          <div className="ion-margin-top">
            <button
              className="lm-btn-primary ion-padding"
              onClick={handleCriarOS}
              disabled={!atendimentoSelecionado || criando}
            >
              {criando ? (
                <>
                  <IonSpinner name="crescent" />
                  <span>Criando...</span>
                </>
              ) : (
                'Criar Ordem de Serviço'
              )}
            </button>
          </div>

          {/* Toast */}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            position="bottom"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NovaOrdemServico;
