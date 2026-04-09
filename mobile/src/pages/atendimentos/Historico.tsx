import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  IonPage, IonContent, IonSpinner, IonIcon, 
  IonSearchbar, useIonViewWillEnter 
} from '@ionic/react';
import { 
  calendarOutline, 
  checkmarkCircle, 
  chevronForwardOutline,
  timeOutline
} from 'ionicons/icons';
import { getHistoricoAtendimentos } from '../../services/api';
import TabBar from '../../components/TabBar';

import logoImg from '../../assets/logo.jpeg';

interface AtendimentoHistorico {
  id: number;
  veiculo: { placa: string; modelo: string; marca: string };
  servico: { nome: string; duracao_estimada_min?: number };
  horario_finalizacao: string;
  status: string;
}

const Historico: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<AtendimentoHistorico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [dataInicial, setDataInicial] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0]);

  // CORREÇÃO: useCallback estabiliza a função para ser usada no useEffect
  const carregarHistorico = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await getHistoricoAtendimentos(dataInicial, dataFinal, searchTerm);
      
      if (dados && Array.isArray(dados)) {
        // CORREÇÃO: Tipagem explícita no filter removendo o 'any'
        setAtendimentos(dados.filter((at: AtendimentoHistorico) => at.status === 'finalizado'));
      }
    } catch (err) {
      console.error("Erro no histórico:", err);
    } finally {
      setLoading(false);
    }
  }, [dataInicial, dataFinal, searchTerm]);

  useIonViewWillEnter(() => {
    carregarHistorico();
  });

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]); // CORREÇÃO: Dependência incluída com segurança

  return (
    <IonPage style={{ background: '#0a0a0a' }}>
      <IonContent style={{ '--background': '#0a0a0a' }}>
        <div style={{ padding: '32px 20px 140px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <img src={logoImg} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
              Histórico
            </h1>
          </div>
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 600, margin: '0 0 32px' }}>
            Serviços finalizados
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Data Inicial</label>
              <div style={styles.dateInputWrapper}>
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
              <label style={{ color: '#888', fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Data Final</label>
              <div style={styles.dateInputWrapper}>
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
            placeholder="Buscar por placa ou modelo..." 
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value || '')}
            style={styles.searchbar as React.CSSProperties} // CORREÇÃO: Cast seguro de CSS
          />

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '40px' }}><IonSpinner color="primary" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {atendimentos.map((at) => (
                <div 
                  key={at.id}
                  onClick={() => history.push(`/atendimentos/${at.id}`)}
                  style={styles.card}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={styles.checkIcon}>
                        <IonIcon icon={checkmarkCircle} color="success" />
                      </div>
                      <div>
                        <h3 style={styles.placa}>{at.veiculo.placa}</h3>
                        <p style={styles.modelo}>{at.veiculo.modelo}</p>
                      </div>
                    </div>
                    <IonIcon icon={chevronForwardOutline} style={{ color: '#333', fontSize: '20px' }} />
                  </div>

                  <div style={styles.divider} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={styles.metaInfo}>
                        <IonIcon icon={calendarOutline} size="small" />
                        {new Date(at.horario_finalizacao).toLocaleDateString()}
                      </div>
                      <div style={styles.metaInfo}>
                        <IonIcon icon={timeOutline} size="small" />
                        {new Date(at.horario_finalizacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                    <span style={styles.servicoNome}>{at.servico.nome}</span>
                    <span style={styles.duracao}>{at.servico.duracao_estimada_min || '--'} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TabBar activeTab="histórico" />
      </IonContent>
    </IonPage>
  );
};

const styles = {
  dateInputWrapper: {
    background: '#121212', border: '1px solid #222', borderRadius: '12px',
    padding: '12px', display: 'flex', alignItems: 'center', gap: '10px'
  },
  dateInput: {
    background: 'transparent', border: 'none', color: '#fff', fontSize: '14px',
    fontWeight: 700, width: '100%', outline: 'none', colorScheme: 'dark'
  },
  searchbar: {
    '--background': '#121212', '--color': '#fff', '--placeholder-color': '#444',
    '--icon-color': '#444', '--border-radius': '12px', padding: 0, marginBottom: '24px'
  },
  card: {
    background: '#121212', border: '1px solid #1a1a1a', borderRadius: '20px',
    padding: '24px', cursor: 'pointer'
  },
  checkIcon: {
    background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', fontSize: '20px'
  },
  placa: { color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 },
  modelo: { color: '#666', fontSize: '14px', margin: '2px 0 0', fontWeight: 600 },
  divider: { height: '1px', background: '#1a1a1a', margin: '16px 0' },
  metaInfo: { display: 'flex', alignItems: 'center', gap: '6px', color: '#444', fontSize: '12px', fontWeight: 700 },
  servicoNome: { color: '#fff', fontSize: '15px', fontWeight: 800 },
  duracao: { color: '#444', fontSize: '13px', fontWeight: 700 }
};

export default Historico;