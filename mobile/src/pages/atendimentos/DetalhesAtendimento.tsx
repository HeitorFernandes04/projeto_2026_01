import { IonContent, IonPage, IonSpinner, useIonAlert } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getAtendimento, iniciarAtendimento, finalizarAtendimento } from '../../services/api';
import GaleriaFotos from '../../components/GaleriaFotos';
import '../../theme/lava-me.css';

interface Veiculo {
  id: number; placa: string; modelo: string;
  marca: string; cor: string; nome_dono: string; celular_dono: string;
}
interface Servico {
  id: number; nome: string; preco: string; duracao_estimada_min: number;
}
interface Atendimento {
  id: number; veiculo: Veiculo; servico: Servico;
  data_hora: string; horario_inicio: string | null;
  status: string; observacoes: string;
  midias: { id: number; arquivo: string; momento: 'ANTES' | 'DEPOIS' }[];
}

const STATUS_MAP: Record<string, { label: string; classe: string }> = {
  agendado:     { label: 'Aguardando',   classe: 'lm-badge-agendado' },
  em_andamento: { label: 'Em andamento', classe: 'lm-badge-andamento' },
  finalizado:   { label: 'Finalizado',   classe: 'lm-badge-finalizado' },
  cancelado:    { label: 'Cancelado',    classe: 'lm-badge-cancelado' },
};

const formatarHora = (dt: string) =>
  new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatarDataHora = (dt: string) =>
  new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const DetalhesAtendimento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState('');

  const [finalizando, setFinalizando] = useState(false);

  const carregarDetalhes = () => {
    getAtendimento(Number(id))
      .then(setAtendimento)
      .catch(() => setErro('Não foi possível carregar o atendimento.'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  const [presentAlert] = useIonAlert();

  const handleIniciar = async () => {
    if (!atendimento) return;
    setIniciando(true);
    try {
      const atualizado = await iniciarAtendimento(atendimento.id);
      setAtendimento(atualizado);
    } catch (e) {
      console.error('Erro ao iniciar atendimento:', e);
      alert('Não foi possível iniciar o atendimento.');
    } finally {
      setIniciando(false);
    }
  };

  const handleFinalizar = async () => {
    if (!atendimento) return;
    setFinalizando(true);
    try {
      const atualizado = await finalizarAtendimento(atendimento.id);
      setAtendimento(atualizado);
    } catch (e: any) {
      console.error('Erro ao finalizar atendimento:', e);
      alert(e.message || 'Não foi possível finalizar o atendimento.');
    } finally {
      setFinalizando(false);
    }
  };

  const confirmarFinalizar = () => {
    presentAlert({
      header: 'Finalizar Atendimento',
      message: 'Tem certeza que deseja encerrar o serviço? Você não poderá adicionar/remover fotos depois.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sim, finalizar', role: 'confirm', handler: () => handleFinalizar() },
      ],
    });
  };

  if (carregando) return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
          <IonSpinner style={{ color: '#00b4d8' }} />
        </div>
      </IonContent>
    </IonPage>
  );

  if (erro || !atendimento) return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>
          <button style={styles.btnVoltar} onClick={() => history.goBack()}>← Voltar</button>
          <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>{erro}</p>
        </div>
      </IonContent>
    </IonPage>
  );

  const { veiculo, servico } = atendimento;
  const statusInfo = STATUS_MAP[atendimento.status] ?? { label: atendimento.status, classe: '' };

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>

          {/* Header */}
          <div style={styles.header}>
            <button style={styles.btnVoltar} onClick={() => history.goBack()}>← Voltar</button>
            <span className={`lm-badge ${statusInfo.classe}`}>{statusInfo.label}</span>
          </div>

          <h2 style={styles.titulo}>Detalhes do Atendimento</h2>

          {/* Seção Veículo */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span style={styles.secaoIcon}>🚗</span>
              <span>Veículo</span>
            </div>
            <h3 style={styles.veiculoNome}>
              {veiculo.marca} {veiculo.modelo}
            </h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Cor</span>
                <span style={styles.infoValor}>{veiculo.cor || '—'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Placa</span>
                <span style={{ ...styles.infoValor, ...styles.placa }}>{veiculo.placa}</span>
              </div>
            </div>
          </div>

          {/* Seção Cliente */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span style={styles.secaoIcon}>👤</span>
              <span>Cliente</span>
            </div>
            <p style={styles.clienteNome}>{veiculo.nome_dono}</p>
            {veiculo.celular_dono && (
              <a href={`tel:${veiculo.celular_dono}`} style={styles.telefone}>
                📞 {veiculo.celular_dono}
              </a>
            )}
          </div>

          {/* Seção Serviço */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span style={styles.secaoIcon}>⚙️</span>
              <span>Serviço</span>
            </div>
            <p style={styles.servicoNome}>{servico.nome}</p>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Duração estimada</span>
                <span style={styles.infoValor}>{servico.duracao_estimada_min} min</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Preço</span>
                <span style={styles.infoValor}>
                  R$ {parseFloat(servico.preco).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Seção Horários */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span style={styles.secaoIcon}>🕐</span>
              <span>Horários</span>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Agendado para</span>
                <span style={styles.infoValor}>{formatarDataHora(atendimento.data_hora)}</span>
              </div>
              {atendimento.horario_inicio && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Iniciado às</span>
                  <span style={{ ...styles.infoValor, color: '#22c55e' }}>
                    {formatarHora(atendimento.horario_inicio)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seção Fotos ANTES */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span style={styles.secaoIcon}>📷</span>
              <span>Fotos Antes do Serviço</span>
            </div>
            <GaleriaFotos 
              atendimentoId={atendimento.id}
              momento="ANTES"
              fotosIniciais={atendimento.midias || []}
              onUploadSuccess={carregarDetalhes}
              somenteLeitura={atendimento.status !== 'agendado'}
            />
          </div>

          {/* Seção Fotos DEPOIS */}
          {['em_andamento', 'finalizado'].includes(atendimento.status) && (
            <div style={styles.secao}>
              <div style={styles.secaoTitulo}>
                <span style={styles.secaoIcon}>✨</span>
                <span>Fotos Depois do Serviço</span>
              </div>
              <GaleriaFotos 
                atendimentoId={atendimento.id}
                momento="DEPOIS"
                fotosIniciais={atendimento.midias || []}
                onUploadSuccess={carregarDetalhes}
                somenteLeitura={atendimento.status !== 'em_andamento'}
              />
            </div>
          )}

          {atendimento.observacoes && (
            <div style={styles.secao}>
              <div style={styles.secaoTitulo}>
                <span style={styles.secaoIcon}>📝</span>
                <span>Observações</span>
              </div>
              <p style={styles.obs}>{atendimento.observacoes}</p>
            </div>
          )}

          {/* Botão Iniciar — fixo no fundo, só aparece se agendado */}
          {atendimento.status === 'agendado' && (
            <button
              style={{ ...styles.btnIniciar, opacity: iniciando ? 0.7 : 1 }}
              disabled={iniciando}
              onClick={handleIniciar}
            >
              {iniciando
                ? <IonSpinner name="crescent" style={{ width: 22, height: 22 }} />
                : '▶  Iniciar Atendimento'}
            </button>
          )}

          {/* Botão Finalizar — só aparece se em andamento */}
          {atendimento.status === 'em_andamento' && (
            <button
              style={{ ...styles.btnFinalizar, opacity: finalizando || !(atendimento.midias || []).some((m) => m.momento === 'DEPOIS') ? 0.6 : 1 }}
              disabled={finalizando || !(atendimento.midias || []).some((m) => m.momento === 'DEPOIS')}
              onClick={confirmarFinalizar}
            >
              {finalizando
                ? <IonSpinner name="crescent" style={{ width: 22, height: 22 }} />
                : '✔  Finalizar Atendimento'}
            </button>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d1117',
    padding: '20px 16px 100px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  btnVoltar: {
    background: 'none', border: 'none',
    color: '#8899aa', fontSize: 15, cursor: 'pointer', padding: 0,
  },
  titulo: { color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 24px' },
  secao: {
    background: '#161b27', border: '1px solid #1e2d40',
    borderRadius: 16, padding: '18px 16px', marginBottom: 14,
  },
  secaoTitulo: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#00b4d8', fontWeight: 700, fontSize: 14,
    marginBottom: 12,
  },
  secaoIcon: { fontSize: 18 },
  veiculoNome: { color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 12px' },
  infoGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 },
  infoLabel: { color: '#8899aa', fontSize: 12 },
  infoValor: { color: '#fff', fontSize: 15, fontWeight: 600 },
  placa: {
    fontFamily: 'monospace', background: '#1e2535',
    padding: '4px 10px', borderRadius: 8, width: 'fit-content',
  },
  clienteNome: { color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' },
  telefone: {
    color: '#00b4d8', fontSize: 14, textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  servicoNome: { color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 12px' },
  fotosArea: {
    minHeight: 80, borderRadius: 12,
    border: '2px dashed #1e2d40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  fotosVazio: { color: '#8899aa', fontSize: 13, margin: 0 },
  obs: { color: '#8899aa', fontSize: 14, margin: 0, lineHeight: 1.6 },
  btnIniciar: {
    width: '100%', padding: '18px 0', borderRadius: 28,
    border: 'none', marginTop: 8,
    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnFinalizar: {
    width: '100%', padding: '18px 0', borderRadius: 28,
    border: 'none', marginTop: 8,
    background: 'linear-gradient(90deg, #22c55e, #16a34a)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
};

export default DetalhesAtendimento;
