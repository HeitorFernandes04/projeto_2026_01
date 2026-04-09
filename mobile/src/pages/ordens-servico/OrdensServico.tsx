import { IonContent, IonPage, IonSpinner, IonToast, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getOrdensServico } from '../../services/api';
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

interface OrdemServico {
  id: number;
  atendimento: Atendimento;
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

const FILTROS = ['Todos', 'Aberta', 'Em Execução', 'Finalizada', 'Cancelada'];

const STATUS_MAP: Record<string, { label: string; classe: string }> = {
  aberta: { label: 'Aberta', classe: 'lm-badge-agendado' },
  execucao: { label: 'Em Execução', classe: 'lm-badge-andamento' },
  finalizada: { label: 'Finalizada', classe: 'lm-badge-finalizado' },
  cancelada: { label: 'Cancelada', classe: 'lm-badge-cancelado' },
};

const dataFormatada = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

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

const OrdensServico: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSelecionado, setFiltroSelecionado] = useState('Todos');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const carregarOrdens = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = filtroSelecionado !== 'Todos' ? { status: filtroSelecionado } : {};
      const response = await getOrdensServico(params);
      // Garante que sempre seja um array
      setOrdens(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço:', error);
      setOrdens([]); // Garante array vazio em caso de erro
      setToastMessage('Erro ao carregar ordens de serviço');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    carregarOrdens();
  });

  const handleFiltroChange = (filtro: string) => {
    setFiltroSelecionado(filtro);
  };

  const handleCriarOS = () => {
    history.push('/ordens-servico/nova');
  };

  const handleVerDetalhes = (id: number) => {
    history.push(`/ordens-servico/${id}`);
  };

  const ordensFiltradas = (ordens || []).filter(os => 
    os && os.status && (filtroSelecionado === 'Todos' || os.status === filtroSelecionado.toLowerCase())
  );

  return (
    <IonPage className="lm-page">
      <IonContent>
        <div className="ion-padding">
          <h1>Ordens de Serviço</h1>
          <p className="ion-text-muted">{dataFormatada()}</p>

          {/* Filtros */}
          <div className="ion-margin-top">
            <div className="ion-segment">
              {FILTROS.map(filtro => (
                <button
                  key={filtro}
                  className={`lm-segment-button ${filtroSelecionado === filtro ? 'lm-segment-active' : ''}`}
                  onClick={() => handleFiltroChange(filtro)}
                >
                  {filtro}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Criar */}
          <div className="ion-margin-top">
            <button
              className="lm-btn-primary ion-padding"
              onClick={handleCriarOS}
            >
              Nova Ordem de Serviço
            </button>
          </div>

          {/* Lista de Ordens */}
          {loading ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" />
              <p>Carregando ordens de serviço...</p>
            </div>
          ) : ordensFiltradas.length === 0 ? (
            <div className="ion-text-center ion-padding">
              <p>Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <div className="ion-margin-top">
              {ordensFiltradas.map(os => (
                <div
                  key={os.id}
                  className="lm-card ion-padding ion-margin-bottom"
                  onClick={() => handleVerDetalhes(os.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ion-justify-content-between ion-align-items-center">
                    <div>
                      <h3 className="ion-no-margin">OS #{os.id}</h3>
                      <p className="ion-text-muted ion-no-margin">
                        {os.atendimento.veiculo.placa} - {os.atendimento.veiculo.modelo}
                      </p>
                      <p className="ion-text-muted ion-no-margin">
                        {os.atendimento.servico.nome}
                      </p>
                    </div>
                    <div className="ion-text-right">
                      <span className={`lm-badge ${STATUS_MAP[os.status]?.classe}`}>
                        {STATUS_MAP[os.status]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="ion-margin-top">
                    <p className="ion-no-margin">
                      <strong>Data:</strong> {formatarData(os.data_criacao)}
                    </p>
                    <p className="ion-no-margin">
                      <strong>Funcionário:</strong> {os.funcionario_nome}
                    </p>
                    <p className="ion-no-margin">
                      <strong>Custo Total:</strong> {formatarMoeda(os.custo_total)}
                    </p>
                  </div>

                  {os.descricao && (
                    <div className="ion-margin-top">
                      <p className="ion-no-margin ion-text-muted">
                        {os.descricao.length > 100 
                          ? `${os.descricao.substring(0, 100)}...` 
                          : os.descricao
                        }
                      </p>
                    </div>
                  )}

                  {os.etapas && os.etapas.length > 0 && (
                    <div className="ion-margin-top">
                      <p className="ion-no-margin ion-text-muted">
                        <strong>Etapas:</strong> {os.etapas.filter(e => e && e.concluida).length}/{os.etapas.length} concluídas
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Toast para feedback */}
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

export default OrdensServico;
