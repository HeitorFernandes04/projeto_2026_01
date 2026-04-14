import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import { 
  chevronBackOutline, 
  logOutOutline, 
  clipboardOutline, 
  waterOutline, 
  sparklesOutline, 
  keyOutline,
  warningOutline,
  homeOutline
} from 'ionicons/icons';
import { getAtendimento } from '../../services/api';
import EstadoVistoria from '../../components/EstadoVistoria';
import EstadoLavagem from '../../components/EstadoLavagem';
import EstadoAcabamento from '../../components/EstadoAcabamento';
import EstadoLiberacao from '../../components/EstadoLiberacao';
import TabBar from '../../components/TabBar';

interface AtendimentoData {
  id: number;
  etapa_atual: number;
  status: string;
  veiculo: { placa: string; modelo: string; marca: string };
}

const EsteiraProducao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<AtendimentoData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await getAtendimento(Number(id));
      if (dados) setAtendimento(dados as unknown as AtendimentoData);
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    if (id) {
      carregarAtendimento();
      
      // Polling de segurança: verifica o status no banco a cada 10 segundos
      // para garantir que o bloqueio apareça se o gestor travar a OS remotamente
      const interval = setInterval(() => {
        getAtendimento(Number(id)).then(dados => {
          if (dados) setAtendimento(dados as unknown as AtendimentoData);
        });
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [id, carregarAtendimento]);

  if (loading) return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <div style={{display:'flex', justifyContent:'center', height:'100vh', alignItems:'center'}}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    </IonPage>
  );

  if (!atendimento) return null;

  // BLOQUEIO DE SEGURANÇA (Gatilho Mestre): intercepta antes de renderizar as etapas
  // Verifica o status de forma insensível a maiúsculas/minúsculas
  if (atendimento.status?.toUpperCase() === 'INCIDENTE') {
    return (
      <IonPage>
        <IonContent style={{ '--background': 'var(--lm-bg)' }}>
          <div style={styles.blockContainer}>
            <div style={styles.blockCard}>
              <div style={styles.alertCircle}>
                <IonIcon icon={warningOutline} style={{ fontSize: '60px', color: 'var(--lm-amber)' }} />
              </div>
              <h2 style={styles.blockTitle}>ESTEIRA SUSPENSA</h2>
              <p style={styles.blockText}>
                Esta Ordem de Serviço (<strong>#{atendimento.id}</strong>) possui um incidente registrado e está bloqueada para auditoria do gestor.
              </p>
              <p style={styles.blockSubText}>O cronômetro de produtividade foi interrompido.</p>
              
              <button onClick={() => history.push('/atendimentos/hoje')} style={styles.btnBack}>
                <IonIcon icon={homeOutline} style={{ marginRight: '10px' }} /> RETORNAR AO PÁTIO
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const etapaAtiva = atendimento.etapa_atual || 1;

  return (
    <IonPage className="lm-page-dark">
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={styles.headerNav}>
          <button onClick={() => history.push('/atendimentos/hoje')} style={styles.btnCircle}>
            <IonIcon icon={chevronBackOutline} />
          </button>
          <div style={styles.titleGroup}>
            <h1 style={styles.osTitle}>OS #{String(atendimento.id).padStart(4, '0')}</h1>
            <p style={styles.carSubtitle}>
              {atendimento.veiculo.marca} • <span style={{color: 'var(--lm-primary)'}}>{atendimento.veiculo.placa}</span>
            </p>
          </div>
          <button onClick={() => history.replace('/login')} style={styles.btnExit}>
             <IonIcon icon={logOutOutline} style={{fontSize: '20px'}} />
          </button>
        </div>

        {/* STEPPER VISUAL (Acompanha a Etapa Ativa) */}
        <div style={styles.stepperContainer}>
          <div style={styles.stepLine} />
          {[
            { step: 1, icon: clipboardOutline, label: 'VISTORIA' },
            { step: 2, icon: waterOutline, label: 'LAVAGEM' },
            { step: 3, icon: sparklesOutline, label: 'ACABAMENTO' },
            { step: 4, icon: keyOutline, label: 'LIBERAÇÃO' }
          ].map((item) => (
            <div key={item.step} style={styles.stepItem}>
              <div style={{
                ...styles.stepCircle,
                background: etapaAtiva >= item.step ? 'var(--lm-primary)' : 'var(--lm-card)',
                boxShadow: etapaAtiva === item.step ? '0 0 15px var(--lm-primary-glow)' : 'none',
                border: etapaAtiva >= item.step ? 'none' : '1px solid var(--lm-border)'
              }}>
                <IonIcon icon={item.icon} style={{ color: etapaAtiva >= item.step ? '#fff' : '#444' }} />
              </div>
              <span style={{ ...styles.stepLabel, color: etapaAtiva >= item.step ? 'var(--lm-primary)' : '#444' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 20px 120px' }}>
          {etapaAtiva === 1 && <EstadoVistoria atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
          {etapaAtiva === 2 && <EstadoLavagem atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
          {etapaAtiva === 3 && <EstadoAcabamento atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
          {etapaAtiva >= 4 && <EstadoLiberacao atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
        </div>
        <TabBar activeTab="pátio" />
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'transparent' },
  btnCircle: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  titleGroup: { textAlign: 'center' },
  osTitle: { color: '#fff', fontSize: '24px', fontWeight: 900, margin: 0 },
  carSubtitle: { color: '#888', fontSize: '14px', fontWeight: 700, margin: '4px 0 0', textTransform: 'uppercase' },
  btnExit: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '10px', borderRadius: '12px', color: '#666' },
  stepperContainer: { display: 'flex', justifyContent: 'space-between', padding: '20px 30px 40px', position: 'relative' },
  stepLine: { position: 'absolute', top: '40px', left: '60px', right: '60px', height: '2px', background: 'var(--lm-border)', zIndex: 0 },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 },
  stepCircle: { width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.3s ease' },
  stepLabel: { fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' },
  
  // Estilos da Tela de Bloqueio Industrial
  blockContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '24px' },
  blockCard: { background: 'var(--lm-card)', border: '2px solid var(--lm-border)', borderRadius: '32px', padding: '40px 24px', textAlign: 'center', width: '100%' },
  alertCircle: { marginBottom: '24px', display: 'flex', justifyContent: 'center' },
  blockTitle: { color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '16px', letterSpacing: '1px' },
  blockText: { color: 'var(--lm-text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' },
  blockSubText: { color: '#444', fontSize: '12px', fontWeight: 700, marginBottom: '32px', textTransform: 'uppercase' },
  btnBack: { background: '#fff', color: '#000', width: '100%', padding: '20px', borderRadius: '16px', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', textTransform: 'uppercase' }
};

export default EsteiraProducao;