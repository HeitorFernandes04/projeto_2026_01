import { IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { Clock, ChevronRight, Car, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje } from '../../services/api';
import TabBar from '../../components/TabBar'; // Ajustado conforme estrutura de pastas

import logoLavaMe from '../../assets/logo.jpeg';

interface Atendimento {
  id: number;
  veiculo: { placa: string; modelo: string };
  servico: { nome: string };
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  data_hora: string;
}

const AtendimentosHoje: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  const nomeFuncionario = localStorage.getItem('nome_usuario') || 'Funcionário';

  useIonViewWillEnter(() => {
    setLoading(true);
    getAtendimentosHoje()
      .then((dados) => {
        if (dados && Array.isArray(dados)) {
          const ativos = dados.filter((a: Atendimento) => 
            a.status !== 'finalizado' && a.status !== 'cancelado'
          );
          setAtendimentos(ativos);
        }
      })
      .catch((err) => console.error("Erro ao carregar pátio:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={styles.container}>
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.logoWrapper}>
                <img src={logoLavaMe} alt="Lava-Me" style={styles.logoImg} />
              </div>
              <div>
                <h1 style={styles.headerTitle}>Lava-Me</h1>
                <p style={styles.headerSubtitle}>Olá, {nomeFuncionario}</p>
              </div>
            </div>
            <button onClick={() => history.replace('/login')} style={styles.btnLogout}>
              <LogOut size={20} color="#666" />
            </button>
          </div>

          <h2 style={styles.pageTitle}>Pátio</h2>
          <p style={styles.pageSubtitle}>Agendamentos ativos</p>

          <div style={styles.statsGrid}>
            <div style={styles.cardAgendado}>
              <p style={styles.statsLabelBlue}>AGENDADOS</p>
              <span style={styles.statsValue}>
                {atendimentos.filter(a => a.status === 'agendado').length}
              </span>
            </div>
            <div style={styles.cardAndamento}>
              <p style={styles.statsLabelGray}>EM EXECUÇÃO</p>
              <span style={styles.statsValue}>
                {atendimentos.filter(a => a.status === 'em_andamento').length}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <IonSpinner color="primary" />
              </div>
            ) : (
              atendimentos.map((at) => (
                <div key={at.id} onClick={() => history.push(`/atendimentos/${at.id}`)} style={styles.atendimentoCard}>
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
                      background: at.status === 'em_andamento' ? 'rgba(0,255,102,0.1)' : 'rgba(0,102,255,0.15)',
                      color: at.status === 'em_andamento' ? '#00ff66' : '#0066ff',
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
  headerSubtitle: { color: 'var(--lm-text-muted)', fontSize: '11px', margin: 0, fontWeight: 700 },
  btnLogout: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: 'var(--lm-text)', fontSize: '32px', fontWeight: 900, margin: '0 0 4px' },
  pageSubtitle: { color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' },
  cardAgendado: { background: '#0a1220', border: '1px solid #0066ff50', padding: '24px', borderRadius: '24px' },
  cardAndamento: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '24px' },
  statsLabelBlue: { color: '#0066ff', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' },
  statsLabelGray: { color: '#444', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' },
  statsValue: { color: 'var(--lm-text)', fontSize: '40px', fontWeight: 900 },
  atendimentoCard: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '24px', cursor: 'pointer' },
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

export default AtendimentosHoje;