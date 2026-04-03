import { IonContent, IonPage, IonSpinner, useIonViewDidEnter } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje, getHistoricoAtendimentos } from '../../services/api';
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

type ModoLista = 'hoje' | 'historico';

const FILTROS = ['Todos', 'Aguardando', 'Em andamento', 'Finalizado'];
const MODOS: Array<{ id: ModoLista; label: string }> = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'historico', label: 'Historico' },
];

const STATUS_MAP: Record<string, { label: string; classe: string }> = {
  agendado: { label: 'Aguardando', classe: 'lm-badge-agendado' },
  em_andamento: { label: 'Em andamento', classe: 'lm-badge-andamento' },
  finalizado: { label: 'Finalizado', classe: 'lm-badge-finalizado' },
  cancelado: { label: 'Cancelado', classe: 'lm-badge-cancelado' },
};

const dataFormatada = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const formatarHora = (dt: string) =>
  new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatarDataInput = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const primeiroDiaDoMes = () => {
  const hoje = new Date();
  return formatarDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
};

const hojeIso = () => formatarDataInput(new Date());

const formatarDataHora = (dt: string) =>
  new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatarPeriodo = (inicio: string, fim: string) => {
  if (!inicio || !fim) return 'Selecione um intervalo para consultar.';

  const dataInicio = new Date(`${inicio}T00:00:00`);
  const dataFim = new Date(`${fim}T00:00:00`);

  return `${dataInicio.toLocaleDateString('pt-BR')} ate ${dataFim.toLocaleDateString('pt-BR')}`;
};

const AtendimentosHoje: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('Aguardando');

  useIonViewDidEnter(() => {
    setCarregando(true);
    setErro('');
    getAtendimentosHoje()
      .then(setAtendimentos)
      .catch(() => setErro('Não foi possível carregar os atendimentos.'))
      .finally(() => setCarregando(false));
  });

  const filtrados = atendimentos.filter((a) => {
    if (filtro === 'Todos') return true;
    const info = STATUS_MAP[a.status];
    return info?.label === filtro;
  });

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logoSmall}>
              <div style={styles.logoIconWrap}><span style={{ fontSize: 22 }}>🚗</span></div>
              <span style={styles.logoText}>Lava-Me</span>
            </div>
            <button style={styles.btnNovo} onClick={() => history.push('/atendimentos/novo')}>
              + Novo
            </button>
          </div>

          {/* Título */}
          <div style={styles.tituloRow}>
            <span style={{ fontSize: 20, color: '#00b4d8' }}>📅</span>
            <div>
              <h2 style={styles.titulo}>Agenda do Dia</h2>
              <p style={styles.data}>{dataFormatada()}</p>
            </div>
          </div>

          {/* Filtros */}
          <div style={styles.filtrosRow}>
            <span style={{ color: '#8899aa', fontSize: 16 }}>⚡</span>
            {FILTROS.map((f) => (
              <button
                key={f}
                style={{
                  ...styles.chipBtn,
                  background: filtro === f ? '#00b4d8' : '#1e2535',
                  color: filtro === f ? '#fff' : '#8899aa',
                  fontWeight: filtro === f ? 700 : 400,
                }}
                onClick={() => setFiltro(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Estados */}
          {carregando && (
            <div style={styles.centro}><IonSpinner style={{ color: '#00b4d8' }} /></div>
          )}
          {!carregando && erro && (
            <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>{erro}</p>
          )}
          {!carregando && !erro && atendimentos.length === 0 && (
            <p style={{ color: '#8899aa', textAlign: 'center', marginTop: 40 }}>
              Nenhum atendimento para hoje.
            </p>
          )}
          {!carregando && !erro && atendimentos.length > 0 && filtrados.length === 0 && (
            <p style={{ color: '#8899aa', textAlign: 'center', marginTop: 40 }}>
              Nenhum atendimento com status "{filtro}".
            </p>
          )}

          {/* Lista */}
          {!carregando && !erro && filtrados.map((a) => {
            const info = STATUS_MAP[a.status] ?? { label: a.status, classe: '' };
            return (
              <button
                key={a.id}
                style={styles.card}
                onClick={() => history.push(`/atendimentos/${a.id}`)}
              >
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.cardNome}>{a.veiculo.nome_dono}</h3>
                    <p style={styles.cardVeiculo}>
                      {a.veiculo.marca} {a.veiculo.modelo} {a.veiculo.cor}
                    </p>
                    <p style={styles.cardInfo}>
                      {formatarHora(a.data_hora)}
                      <span style={styles.dot}>•</span>
                      {a.servico.nome}
                    </p>
                  </div>
                  <span className={`lm-badge ${info.classe}`}>{info.label}</span>
                </div>
              </button>
            );
          })}

        </div>
      </IonContent>
    </IonPage>
  );
};

const AtendimentosHojeComHistorico: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('Aguardando');
  const [modo, setModo] = useState<ModoLista>('hoje');
  const [dataInicial, setDataInicial] = useState(primeiroDiaDoMes());
  const [dataFinal, setDataFinal] = useState(hojeIso());

  const carregarAtendimentosHoje = () => {
    setCarregando(true);
    setErro('');
    getAtendimentosHoje()
      .then((dados) => {
        setAtendimentos(dados);
        setFiltro('Aguardando');
      })
      .catch(() => setErro('Nao foi possivel carregar os atendimentos do dia.'))
      .finally(() => setCarregando(false));
  };

  const carregarHistorico = () => {
    if (!dataInicial || !dataFinal) {
      setErro('Informe a data inicial e a data final para consultar o historico.');
      return;
    }

    setCarregando(true);
    setErro('');
    getHistoricoAtendimentos(dataInicial, dataFinal)
      .then((dados) => {
        setAtendimentos(dados);
        setFiltro('Todos');
      })
      .catch((e: Error) => setErro(e.message || 'Nao foi possivel carregar o historico.'))
      .finally(() => setCarregando(false));
  };

  useIonViewDidEnter(() => {
    if (modo === 'historico') {
      carregarHistorico();
      return;
    }

    carregarAtendimentosHoje();
  });

  const alternarModo = (novoModo: ModoLista) => {
    setModo(novoModo);

    if (novoModo === 'historico') {
      carregarHistorico();
      return;
    }

    carregarAtendimentosHoje();
  };

  const filtrados = atendimentos.filter((a) => {
    if (filtro === 'Todos') return true;
    const info = STATUS_MAP[a.status];
    return info?.label === filtro;
  });

  const titulo = modo === 'historico' ? 'Historico de Atendimentos' : 'Agenda do Dia';
  const subtitulo = modo === 'historico' ? formatarPeriodo(dataInicial, dataFinal) : dataFormatada();
  const mensagemVazia = modo === 'historico'
    ? 'Nenhum atendimento encontrado no periodo informado.'
    : 'Nenhum atendimento para hoje.';

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.logoSmall}>
              <div style={styles.logoIconWrap}><span style={{ fontSize: 22 }}>L</span></div>
              <span style={styles.logoText}>Lava-Me</span>
            </div>
            <button style={styles.btnNovo} onClick={() => history.push('/atendimentos/novo')}>
              + Novo
            </button>
          </div>

          <div style={styles.modoRow}>
            {MODOS.map((item) => (
              <button
                key={item.id}
                style={{
                  ...styles.modoBtn,
                  background: modo === item.id ? 'linear-gradient(90deg, #00b4d8, #0096c7)' : '#1a2231',
                  color: modo === item.id ? '#fff' : '#93a4b8',
                }}
                onClick={() => alternarModo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={styles.tituloRow}>
            <span style={{ fontSize: 20, color: '#00b4d8' }}>•</span>
            <div>
              <h2 style={styles.titulo}>{titulo}</h2>
              <p style={styles.data}>{subtitulo}</p>
            </div>
          </div>

          {modo === 'historico' && (
            <div style={styles.periodoCard}>
              <div style={styles.periodoGrid}>
                <label style={styles.campoLabel}>
                  <span style={styles.campoTexto}>Data inicial</span>
                  <input
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    style={styles.inputData}
                  />
                </label>
                <label style={styles.campoLabel}>
                  <span style={styles.campoTexto}>Data final</span>
                  <input
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    style={styles.inputData}
                  />
                </label>
              </div>
              <button style={styles.btnBuscar} onClick={carregarHistorico}>
                Aplicar periodo
              </button>
            </div>
          )}

          <div style={styles.filtrosRow}>
            <span style={{ color: '#8899aa', fontSize: 16 }}>•</span>
            {FILTROS.map((f) => (
              <button
                key={f}
                style={{
                  ...styles.chipBtn,
                  background: filtro === f ? '#00b4d8' : '#1e2535',
                  color: filtro === f ? '#fff' : '#8899aa',
                  fontWeight: filtro === f ? 700 : 400,
                }}
                onClick={() => setFiltro(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {carregando && (
            <div style={styles.centro}><IonSpinner style={{ color: '#00b4d8' }} /></div>
          )}
          {!carregando && erro && (
            <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>{erro}</p>
          )}
          {!carregando && !erro && atendimentos.length === 0 && (
            <p style={{ color: '#8899aa', textAlign: 'center', marginTop: 40 }}>
              {mensagemVazia}
            </p>
          )}
          {!carregando && !erro && atendimentos.length > 0 && filtrados.length === 0 && (
            <p style={{ color: '#8899aa', textAlign: 'center', marginTop: 40 }}>
              Nenhum atendimento com status "{filtro}".
            </p>
          )}

          {!carregando && !erro && filtrados.map((a) => {
            const info = STATUS_MAP[a.status] ?? { label: a.status, classe: '' };
            return (
              <button
                key={a.id}
                style={styles.card}
                onClick={() => history.push(`/atendimentos/${a.id}`)}
              >
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.cardNome}>{a.veiculo.nome_dono}</h3>
                    <p style={styles.cardVeiculo}>
                      {a.veiculo.marca} {a.veiculo.modelo} {a.veiculo.cor}
                    </p>
                    <p style={styles.cardInfo}>
                      {formatarDataHora(a.data_hora)}
                      <span style={styles.dot}>•</span>
                      {a.servico.nome}
                    </p>
                  </div>
                  <span className={`lm-badge ${info.classe}`}>{info.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d1117',
    padding: '20px 16px 40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoSmall: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logoIconWrap: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#00b4d8', fontWeight: 800, fontSize: 16 },
  modoRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    background: '#121926',
    border: '1px solid #1f2a3b',
    borderRadius: 18,
    padding: 6,
    marginBottom: 22,
  },
  modoBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnNovo: {
    background: 'linear-gradient(90deg, #00b4d8, #0096c7)',
    color: '#fff', border: 'none', borderRadius: 24,
    padding: '10px 20px', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,180,216,0.3)',
  },
  tituloRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24,
  },
  titulo: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  data: { color: '#8899aa', fontSize: 13, margin: '4px 0 0' },
  periodoCard: {
    background: '#141c28',
    border: '1px solid #213047',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  periodoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 12,
  },
  campoLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  campoTexto: {
    color: '#9eb0c5',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  inputData: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #28405f',
    borderRadius: 12,
    color: '#f3f7fb',
    padding: '12px 14px',
    boxSizing: 'border-box',
  },
  btnBuscar: {
    width: '100%',
    background: '#1e2535',
    color: '#fff',
    border: '1px solid #314862',
    borderRadius: 14,
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  filtrosRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    overflowX: 'auto', marginBottom: 20, paddingBottom: 4,
  },
  chipBtn: {
    border: 'none', borderRadius: 20,
    padding: '8px 16px', fontSize: 13, cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'all 0.2s',
  },
  card: {
    width: '100%', background: '#161b27',
    border: '1px solid #1e2d40', borderRadius: 16,
    padding: '18px 16px', marginBottom: 12,
    cursor: 'pointer', textAlign: 'left',
    boxSizing: 'border-box',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  },
  cardNome: { color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 4px' },
  cardVeiculo: { color: '#8899aa', fontSize: 13, margin: '0 0 8px' },
  cardInfo: { color: '#8899aa', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { color: '#00b4d8', fontWeight: 900 },
  centro: { display: 'flex', justifyContent: 'center', marginTop: 60 },
};

export default AtendimentosHojeComHistorico;
