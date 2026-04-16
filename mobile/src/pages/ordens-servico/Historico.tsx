import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  IonPage, IonContent, IonSpinner, IonIcon, 
  IonSearchbar, useIonViewWillEnter 
} from '@ionic/react';
import { 
  calendarOutline, 
  checkmarkCircle, 
  chevronForwardOutline,
  timeOutline,
  logOutOutline
} from 'ionicons/icons';
import { getHistoricoOrdemServico } from '../../services/api';
import TabBar from '../../components/TabBar';
import logoImg from '../../assets/logo.jpeg';
import '../../theme/lava-me.css';

interface OrdemServicoHistorico {
  id: number;
  veiculo: { placa: string; modelo: string; marca: string };
  servico: { nome: string; duracao_estimada_min?: number };
  horario_finalizacao: string;
  status: string;
}

const Historico: React.FC = () => {
  const history = useHistory();
  const [ordemServicos, setOrdemServicos] = useState<OrdemServicoHistorico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [dataInicial, setDataInicial] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0]);

  // Carrega os dados da API com base nas datas selecionadas
  const carregarHistorico = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await getHistoricoOrdemServico(dataInicial, dataFinal);
      
      if (dados && Array.isArray(dados)) {
        // Filtra apenas os finalizados conforme regra de negócio
        setOrdemServicos(dados.filter((at: OrdemServicoHistorico) => at.status === 'FINALIZADO'));
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }, [dataInicial, dataFinal]);

  // Lógica de Filtro Local (Barra de Busca)
  // O useMemo garante que o filtro só rode quando searchTerm ou ordemServicos mudarem
  const ordemServicosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return ordemServicos;

    const term = searchTerm.toLowerCase();
    return ordemServicos.filter(at => 
      at.veiculo.placa.toLowerCase().includes(term) ||
      at.veiculo.modelo.toLowerCase().includes(term) ||
      at.veiculo.marca.toLowerCase().includes(term)
    );
  }, [searchTerm, ordemServicos]);

  useIonViewWillEnter(() => {
    carregarHistorico();
  });

  return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={{ padding: '32px 20px 140px' }}>
          
          <div style={styles.headerArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoImg} alt="Logo" style={styles.logo} />
              <h1 style={styles.title}>Histórico</h1>
            </div>
            <button onClick={() => history.replace('/login')} style={styles.btnLogout}>
              <IonIcon icon={logOutOutline} style={{ fontSize: '20px', color: '#666' }} />
            </button>
          </div>
          <p style={styles.subtitle}>Serviços finalizados</p>

          <div style={styles.filterGrid}>
            <div>
              <label style={styles.filterLabel}>Início</label>
              <div style={styles.dateWrapper}>
                <IonIcon icon={calendarOutline} style={{ color: '#444' }} />
                <input 
                  type="date" 
                  value={dataInicial} 
                  onChange={(e) => setDataInicial(e.target.value)} 
                  style={styles.dateInput}
                />
              </div>
            </div>
            <div>
              <label style={styles.filterLabel}>Fim</label>
              <div style={styles.dateWrapper}>
                <IonIcon icon={calendarOutline} style={{ color: '#444' }} />
                <input 
                  type="date" 
                  value={dataFinal} 
                  onChange={(e) => setDataFinal(e.target.value)} 
                  style={styles.dateInput}
                />
              </div>
            </div>
          </div>

          <IonSearchbar 
            placeholder="Placa ou modelo..." 
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value || '')}
            style={styles.searchbar}
          />

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <IonSpinner color="primary" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ordemServicosFiltrados.length > 0 ? (
                ordemServicosFiltrados.map((at) => (
                  <div 
                    key={at.id}
                    onClick={() => history.push(`/ordens-servico/${at.id}`)}
                    style={styles.card}
                  >
                    <div style={styles.cardTop}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={styles.checkIcon}>
                          <IonIcon icon={checkmarkCircle} color="success" />
                        </div>
                        <div>
                          <h3 style={styles.placa}>{at.veiculo.placa}</h3>
                          <p style={styles.modelo}>{at.veiculo.modelo}</p>
                        </div>
                      </div>
                      <IonIcon icon={chevronForwardOutline} style={{ color: '#333' }} />
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.metaRow}>
                      <div style={styles.metaInfo}>
                        <IonIcon icon={calendarOutline} size="small" />
                        {new Date(at.horario_finalizacao).toLocaleDateString()}
                      </div>
                      <div style={styles.metaInfo}>
                        <IonIcon icon={timeOutline} size="small" />
                        {new Date(at.horario_finalizacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={styles.footerRow}>
                      <span style={styles.servicoNome}>{at.servico.nome}</span>
                      <span style={styles.duracao}>{at.servico.duracao_estimada_min || '--'} min</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#444', textAlign: 'center', marginTop: '20px', fontWeight: 700 }}>
                  Nenhum ordemServico encontrado.
                </p>
              )}
            </div>
          )}
        </div>

        <TabBar activeTab="histórico" />
      </IonContent>
    </IonPage>
  );
};

const styles = {
  headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  logo: { width: '32px', height: '32px', borderRadius: '6px' },
  title: { color: '#fff', fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-1px' },
  btnLogout: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: '#666', fontSize: '15px', fontWeight: 600, margin: '0 0 32px' },
  filterGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  filterLabel: { color: '#888', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' },
  dateWrapper: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  dateInput: { background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, width: '100%', outline: 'none', colorScheme: 'dark' },
  searchbar: { '--background': 'var(--lm-card)', '--color': '#fff', '--placeholder-color': '#444', '--icon-color': '#444', '--border-radius': '12px', padding: 0, marginBottom: '24px' },
  card: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', borderRadius: '20px', padding: '24px', cursor: 'pointer' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  checkIcon: { background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', fontSize: '20px' },
  placa: { color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 },
  modelo: { color: '#666', fontSize: '14px', margin: '2px 0 0', fontWeight: 600 },
  divider: { height: '1px', background: '#1a1a1a', margin: '16px 0' },
  metaRow: { display: 'flex', gap: '15px', marginBottom: '16px' },
  metaInfo: { display: 'flex', alignItems: 'center', gap: '6px', color: '#444', fontSize: '12px', fontWeight: 700 },
  footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  servicoNome: { color: '#fff', fontSize: '15px', fontWeight: 800 },
  duracao: { color: '#444', fontSize: '13px', fontWeight: 700 }
};

export default Historico;