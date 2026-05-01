import { IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { Clock, ChevronRight, Car, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getOrdensServicoHoje, getMeuPerfil } from '../../services/api';
import TabBar from '../../components/TabBar'; 

import logoLavaMe from '../../assets/logo.jpeg';

// Interface atualizada para incluir campos necessários da esteira operacional
interface OrdemServico {
  id: number;
  veiculo: { placa: string; modelo: string };
  servico: { nome: string };
  status: 'PATIO' | 'EM_EXECUCAO' | 'FINALIZADO' | 'CANCELADO';
  data_hora: string;
  etapa_atual?: number; // Axioma: Controle da máquina de estados
}

const OrdemServicosHoje: React.FC = () => {
  const history = useHistory();
  const [ordensServico, setOrdemServicos] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState('Colaborador');
  const [logoUnidade, setLogoUnidade] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useIonViewWillEnter(() => {
    // Só exibe o spinner na primeira carga total
    if (ordensServico.length === 0) {
      setLoading(true);
    }

    // Busca Perfil para o Header (Agora com logo dinâmica)
    getMeuPerfil().then(p => {
      setNomeUsuario(p.name);
      if (p.estabelecimento?.logo_url) {
        setLogoUnidade(p.estabelecimento.logo_url);
      }
    }).catch(() => {});

    getOrdensServicoHoje()
      .then((dados) => {
        if (dados && Array.isArray(dados)) {
          const ativos = dados.filter((a: OrdemServico) => 
            a.status !== 'FINALIZADO' && a.status !== 'CANCELADO'
          );
          setOrdemServicos(ativos);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar pátio:", err);
      })
      .finally(() => setLoading(false));
  }, [ordensServico.length]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('nome_usuario');
    history.replace('/login');
  };

  return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={styles.container}>
          
          {/* Header com Logo e Logout */}
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.logoWrapper}>
                <img src={logoUnidade || logoLavaMe} alt="Lava-Me" style={styles.logoImg} />
              </div>
              <div>
                <h1 style={styles.headerTitle}>Lava-Me</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <p style={styles.headerSubtitle}>Olá, {nomeUsuario}</p>
                  <span style={{ color: '#444', fontSize: '10px' }}>•</span>
                  <div style={styles.clockHeader}>
                    <Clock size={10} color="var(--lm-primary)" />
                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} style={styles.btnLogout}>
              <LogOut size={20} color="#666" />
            </button>
          </div>

          <h2 style={styles.pageTitle}>Pátio</h2>
          <p style={styles.pageSubtitle}>Agendamentos ativos</p>

          {/* Cards de Estatísticas Rápidas */}
          <div style={styles.statsGrid}>
            <div style={styles.cardAgendado}>
              <p style={styles.statsLabelBlue}>AGENDADOS</p>
              <span style={styles.statsValue}>
                {ordensServico.filter(a => a.status === 'PATIO').length}
              </span>
            </div>
            <div style={styles.cardAndamento}>
              <p style={styles.statsLabelGray}>EM EXECUÇÃO</p>
              <span style={styles.statsValue}>
                {ordensServico.filter(a => a.status === 'EM_EXECUCAO').length}
              </span>
            </div>
          </div>

          {/* Listagem de OrdemServicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <IonSpinner color="primary" />
              </div>
            ) : ordensServico.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
                <p>Nenhum veículo no pátio agora.</p>
              </div>
            ) : (
              ordensServico.map((at) => (
                <div 
                  key={at.id} 
                  // Rota operacional da esteira conforme App.tsx
                  onClick={() => history.push(`/ordens-servico/${at.id}/esteira`)}
                  style={styles.ordemServicoCard}
                >
                  <div style={styles.cardTop}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={styles.iconBox}><Car color="#fff" size={20} /></div>
                      <div>
                        <h3 style={styles.placaText}>{at.veiculo.placa}</h3>
                        <p style={styles.modeloText}>{at.veiculo.modelo}</p>
                      </div>
                    </div>
                    <ChevronRight color="#333" size={20} />
                  </div>
                  
                  <div style={styles.metaRow}>
                    <div style={styles.timeWrapper}>
                      <Clock size={14} />
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {new Date(at.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ ...styles.statusBadge, 
                      background: at.status === 'EM_EXECUCAO' ? 'rgba(0,255,102,0.1)' : 'rgba(0,102,255,0.15)',
                      color: at.status === 'EM_EXECUCAO' ? '#00ff66' : '#0066ff',
                    }}>
                      {at.status.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div style={styles.divider} />
                  <div style={styles.servicoNome}>{at.servico.nome}</div>
                </div>
              ))
            )}
          </div>

          <TabBar activeTab="pátio" />
        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { background: 'var(--lm-bg)', minHeight: '100vh', padding: '32px 20px 140px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  logoWrapper: { padding: '2px', borderRadius: '12px', border: '1px solid var(--lm-border)', background: '#000000' },
  logoImg: { width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' },
  headerTitle: { color: 'var(--lm-text)', fontSize: '20px', fontWeight: 800, margin: 0 },
  headerSubtitle: { color: 'var(--lm-text-muted)', fontSize: '12px', margin: 0, fontWeight: 700 },
  clockHeader: { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--lm-primary)', fontSize: '11px', fontWeight: 800 },
  btnLogout: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  pageTitle: { color: 'var(--lm-text)', fontSize: '32px', fontWeight: 900, margin: '0 0 4px' },
  pageSubtitle: { color: '#444', fontSize: '14px', fontWeight: 700, marginBottom: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' },
  cardAgendado: { background: '#0a1220', border: '1px solid #0066ff50', padding: '24px', borderRadius: '24px' },
  cardAndamento: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '24px' },
  statsLabelBlue: { color: '#0066ff', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' },
  statsLabelGray: { color: '#444', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' },
  statsValue: { color: 'var(--lm-text)', fontSize: '40px', fontWeight: 900 },
  ordemServicoCard: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '24px', cursor: 'pointer' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { background: '#222', padding: '10px', borderRadius: '14px' },
  placaText: { color: 'var(--lm-text)', fontSize: '20px', fontWeight: 900, margin: 0 },
  modeloText: { color: 'var(--lm-text-muted)', fontSize: '14px', margin: '2px 0 0' },
  metaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' },
  timeWrapper: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--lm-text-muted)' },
  statusBadge: { padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'capitalize' },
  divider: { height: '1px', background: '#222', margin: '20px 0 16px' },
  servicoNome: { color: 'var(--lm-text)', fontSize: '15px', fontWeight: 800 }
};

export default OrdemServicosHoje;