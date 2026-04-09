import { IonContent, IonPage, IonSpinner, useIonViewWillEnter, IonAlert, IonToast } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { 
  getOrdemServico, 
  atualizarOrdemServico, 
  finalizarOrdemServico,
  adicionarMaterialOS,
  atualizarEtapaOS,
  getAtendimento
} from '../../services/api';
import GaleriaFotos from '../../components/GaleriaFotos';
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

interface EtapaOS {
  id: number;
  nome: string;
  concluida: boolean;
  tempo_estimado: string;
  ordem: number;
}

interface MaterialOS {
  id: number;
  nome: string;
  quantidade: string;
  unidade: string;
  custo_unitario: string;
  custo_total: string;
}

interface MidiaAtendimento {
  id: number;
  atendimento: number;
  arquivo: string;
  momento: 'ANTES' | 'DEPOIS';
  enviado_em: string;
}

interface AtendimentoCompleto extends Atendimento {
  midias: MidiaAtendimento[];
}

interface OrdemServico {
  id: number;
  atendimento: AtendimentoCompleto;
  funcionario: number;
  funcionario_nome: string;
  status: string;
  descricao: string;
  data_criacao: string;
  data_finalizacao: string | null;
  custo_total: string;
  etapas: EtapaOS[];
  materiais: MaterialOS[];
}

const STATUS_MAP: Record<string, { label: string; classe: string }> = {
  aberta: { label: 'Aberta', classe: 'lm-badge-agendado' },
  execucao: { label: 'Em Execução', classe: 'lm-badge-andamento' },
  finalizada: { label: 'Finalizada', classe: 'lm-badge-finalizado' },
  cancelada: { label: 'Cancelada', classe: 'lm-badge-cancelado' },
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

const formatarMoeda = (valor: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(valor));
};

const DetalhesOrdemServico: React.FC = () => {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [descricaoEditada, setDescricaoEditada] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [novoMaterial, setNovoMaterial] = useState({
    nome: '',
    quantidade: '',
    unidade: '',
    custo_unitario: ''
  });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const carregarOrdem = async () => {
    try {
      setLoading(true);
      const response = await getOrdemServico(Number(id));
      setOrdem(response.data);
      setDescricaoEditada(response.data.descricao);
    } catch (error) {
      console.error('Erro ao carregar ordem de serviço:', error);
      setToastMessage('Erro ao carregar ordem de serviço');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    carregarOrdem();
  });

  const handleAtualizarDescricao = async () => {
    if (!ordem) return;
    
    try {
      await atualizarOrdemServico(ordem.id, { descricao: descricaoEditada });
      setOrdem({ ...ordem, descricao: descricaoEditada });
      setEditando(false);
      setToastMessage('Descrição atualizada com sucesso');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      setToastMessage('Erro ao atualizar descrição');
      setShowToast(true);
    }
  };

  const handleMudarStatus = async (novoStatus: string) => {
    if (!ordem) return;
    
    try {
      await atualizarOrdemServico(ordem.id, { status: novoStatus });
      setOrdem({ ...ordem, status: novoStatus });
      setToastMessage('Status atualizado com sucesso');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setToastMessage('Erro ao atualizar status');
      setShowToast(true);
    }
  };

  const handleFinalizar = async () => {
    if (!ordem) return;
    
    try {
      await finalizarOrdemServico(ordem.id, { observacoes: '' });
      carregarOrdem(); // Recarrega para obter dados atualizados
      setToastMessage('Ordem de serviço finalizada com sucesso');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao finalizar ordem:', error);
      setToastMessage('Erro ao finalizar ordem de serviço');
      setShowToast(true);
    }
  };

  const handleAdicionarMaterial = async () => {
    if (!ordem || !novoMaterial.nome || !novoMaterial.quantidade || !novoMaterial.unidade || !novoMaterial.custo_unitario) {
      setToastMessage('Preencha todos os campos do material');
      setShowToast(true);
      return;
    }

    try {
      await adicionarMaterialOS(ordem.id, novoMaterial);
      carregarOrdem(); // Recarrega para obter dados atualizados
      setNovoMaterial({ nome: '', quantidade: '', unidade: '', custo_unitario: '' });
      setShowMaterialForm(false);
      setToastMessage('Material adicionado com sucesso');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao adicionar material:', error);
      setToastMessage('Erro ao adicionar material');
      setShowToast(true);
    }
  };

  const handleToggleEtapa = async (etapaId: number, concluida: boolean) => {
    if (!ordem) return;

    try {
      await atualizarEtapaOS(ordem.id, etapaId, { concluida });
      carregarOrdem(); // Recarrega para obter dados atualizados
      setToastMessage('Etapa atualizada com sucesso');
      setShowToast(true);
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      setToastMessage('Erro ao atualizar etapa');
      setShowToast(true);
    }
  };

  const podeFinalizar = ordem ? ordem.etapas.every(e => e.concluida) : false;

  if (loading) {
    return (
      <IonPage className="lm-page">
        <IonContent>
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Carregando ordem de serviço...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!ordem) {
    return (
      <IonPage className="lm-page">
        <IonContent>
          <div className="ion-text-center ion-padding">
            <p>Ordem de serviço não encontrada</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="lm-page">
      <IonContent>
        <div className="ion-padding">
          {/* Header */}
          <div className="ion-justify-content-between ion-align-items-center">
            <div>
              <h1 className="ion-no-margin">OS #{ordem.id}</h1>
              <p className="ion-text-muted ion-no-margin">
                {formatarData(ordem.data_criacao)}
              </p>
            </div>
            <div className="ion-text-right">
              <span className={`lm-badge ${STATUS_MAP[ordem.status]?.classe}`}>
                {STATUS_MAP[ordem.status]?.label}
              </span>
            </div>
          </div>

          {/* Informações do Atendimento */}
          <div className="lm-card ion-padding ion-margin-top">
            <h3>Atendimento Vinculado</h3>
            <p><strong>Veículo:</strong> {ordem.atendimento.veiculo.placa} - {ordem.atendimento.veiculo.modelo}</p>
            <p><strong>Cliente:</strong> {ordem.atendimento.veiculo.nome_dono}</p>
            <p><strong>Serviço:</strong> {ordem.atendimento.servico.nome}</p>
            <p><strong>Funcionário:</strong> {ordem.funcionario_nome}</p>
          </div>

          {/* Descrição */}
          <div className="lm-card ion-padding ion-margin-top">
            <div className="ion-justify-content-between ion-align-items-center">
              <h3>Descrição</h3>
              {!ordem.data_finalizacao && (
                <button
                  className="lm-btn-primary ion-text-capitalize"
                  onClick={() => setEditando(!editando)}
                >
                  {editando ? 'Cancelar' : 'Editar'}
                </button>
              )}
            </div>
            
            {editando ? (
              <div className="ion-margin-top">
                <textarea
                  className="lm-input"
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                  rows={4}
                  placeholder="Descreva os detalhes da ordem de serviço..."
                />
                <div className="ion-margin-top">
                  <button
                    className="lm-btn-primary"
                    onClick={handleAtualizarDescricao}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <p className="ion-margin-top">
                {ordem.descricao || 'Nenhuma descrição informada'}
              </p>
            )}
          </div>

          {/* Etapas */}
          {ordem.etapas.length > 0 && (
            <div className="lm-card ion-padding ion-margin-top">
              <h3>Etapas</h3>
              {ordem.etapas.map(etapa => (
                <div key={etapa.id} className="ion-margin-bottom">
                  <div className="ion-justify-content-between ion-align-items-center">
                    <div>
                      <p className="ion-no-margin ion-text-capitalize">{etapa.nome}</p>
                      <p className="ion-text-muted ion-no-margin">{etapa.tempo_estimado}</p>
                    </div>
                    {!ordem.data_finalizacao && (
                      <button
                        className={`lm-badge ${etapa.concluida ? 'lm-badge-finalizado' : 'lm-badge-agendado'}`}
                        onClick={() => handleToggleEtapa(etapa.id, !etapa.concluida)}
                      >
                        {etapa.concluida ? 'Concluída' : 'Pendente'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Materiais */}
          <div className="lm-card ion-padding ion-margin-top">
            <div className="ion-justify-content-between ion-align-items-center">
              <h3>Materiais</h3>
              {!ordem.data_finalizacao && (
                <button
                  className="lm-btn-primary ion-text-capitalize"
                  onClick={() => setShowMaterialForm(!showMaterialForm)}
                >
                  {showMaterialForm ? 'Cancelar' : 'Adicionar'}
                </button>
              )}
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

            {ordem.materiais.length > 0 && (
              <div className="ion-margin-top">
                {ordem.materiais.map(material => (
                  <div key={material.id} className="ion-margin-bottom">
                    <div className="ion-justify-content-between ion-align-items-center">
                      <div>
                        <p className="ion-no-margin">{material.nome}</p>
                        <p className="ion-text-muted ion-no-margin">
                          {material.quantidade} {material.unidade} × {formatarMoeda(material.custo_unitario)}
                        </p>
                      </div>
                      <div className="ion-text-right">
                        <p className="ion-no-margin ion-text-bold">{formatarMoeda(material.custo_total)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fotos do Atendimento */}
          <div className="lm-card ion-padding ion-margin-top">
            <h3>Fotos do Atendimento</h3>
            <div className="ion-margin-top">
              <div className="ion-margin-bottom">
                <h4>Fotos ANTES</h4>
                <GaleriaFotos
                  atendimentoId={ordem.atendimento.id}
                  momento="ANTES"
                  fotosIniciais={ordem.atendimento.midias.map(midia => ({
                    id: midia.id,
                    arquivo: midia.arquivo,
                    momento: midia.momento
                  }))}
                  somenteLeitura={ordem.data_finalizacao !== null}
                />
              </div>
              <div className="ion-margin-top">
                <h4>Fotos DEPOIS</h4>
                <GaleriaFotos
                  atendimentoId={ordem.atendimento.id}
                  momento="DEPOIS"
                  fotosIniciais={ordem.atendimento.midias.map(midia => ({
                    id: midia.id,
                    arquivo: midia.arquivo,
                    momento: midia.momento
                  }))}
                  somenteLeitura={ordem.data_finalizacao !== null}
                />
              </div>
            </div>
          </div>

          {/* Custo Total */}
          <div className="lm-card ion-padding ion-margin-top">
            <div className="ion-justify-content-between ion-align-items-center">
              <h3>Custo Total</h3>
              <div className="ion-text-right">
                <p className="ion-no-margin ion-text-bold" style={{ fontSize: '1.2em' }}>
                  {formatarMoeda(ordem.custo_total)}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          {!ordem.data_finalizacao && (
            <div className="ion-margin-top">
              <div className="ion-grid ion-grid-cols-2">
                <button
                  className="lm-btn-primary"
                  onClick={() => handleMudarStatus('execucao')}
                  disabled={ordem.status === 'execucao'}
                >
                  Iniciar Execução
                </button>
                <button
                  className="lm-btn-primary"
                  onClick={() => setShowAlert(true)}
                  disabled={!podeFinalizar}
                >
                  Finalizar OS
                </button>
              </div>
            </div>
          )}

          {/* Alert de Confirmação */}
          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Confirmar Finalização"
            message="Tem certeza que deseja finalizar esta ordem de serviço? Esta ação não poderá ser desfeita."
            buttons={[
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Finalizar',
                handler: handleFinalizar
              }
            ]}
          />

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

export default DetalhesOrdemServico;
