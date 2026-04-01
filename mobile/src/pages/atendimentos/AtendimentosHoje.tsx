import { IonContent, IonPage, IonSpinner, useIonViewDidEnter } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje } from '../../services/api';
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
}

const FILTROS = ['Todos', 'Aguardando', 'Em andamento', 'Finalizado'];

const STATUS_MAP: Record<string, { label: string; classe: string }> = {
  agendado:     { label: 'Aguardando',   classe: 'lm-badge-agendado' },
  em_andamento: { label: 'Em andamento', classe: 'lm-badge-andamento' },
  finalizado:   { label: 'Finalizado',   classe: 'lm-badge-finalizado' },
  cancelado:    { label: 'Cancelado',    classe: 'lm-badge-cancelado' },
};

const dataFormatada = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const formatarHora = (dt: string) =>
  new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cardNome: { color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 4px' },
  cardVeiculo: { color: '#8899aa', fontSize: 13, margin: '0 0 8px' },
  cardInfo: { color: '#8899aa', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 },
  dot: { color: '#00b4d8', fontWeight: 900 },
  centro: { display: 'flex', justifyContent: 'center', marginTop: 60 },
};

export default AtendimentosHoje;
