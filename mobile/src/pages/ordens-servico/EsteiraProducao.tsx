import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonIcon, useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';
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
import { getOrdemServico } from '../../services/api';
import EstadoVistoria from '../../components/EstadoVistoria';
import EstadoLavagem from '../../components/EstadoLavagem';
import EstadoAcabamento from '../../components/EstadoAcabamento';
import EstadoLiberacao from '../../components/EstadoLiberacao';
import TabBar from '../../components/TabBar';

interface OrdemServicoData {
  id: number;
  etapa_atual: number;
  status: string;
  veiculo: { placa: string; modelo: string; marca: string };
}

const EsteiraProducao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [ordemServico, setOrdemServico] = useState<OrdemServicoData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarOrdemServico = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await getOrdemServico(Number(id));
      if (dados) setOrdemServico(dados as unknown as OrdemServicoData);
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isAtivoRef = useRef(false);

  // Axioma: Limpeza agressiva ao sair da página (Prevenção de Ghost Polling)
  useIonViewWillLeave(() => {
    isAtivoRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  });

  useIonViewWillEnter(() => {
    isAtivoRef.current = true;

    // Carregamento inicial silencioso se já houver dados
    if (!ordemServico) {
      carregarOrdemServico();
    }

    // Inicia Polling apenas se a página estiver ativa
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        if (!isAtivoRef.current) return;

        getOrdemServico(Number(id)).then(dados => {
          if (dados && isAtivoRef.current) setOrdemServico(dados as unknown as OrdemServicoData);
        }).catch(err => console.debug("Silent sync failed:", err));
      }, 15000);
    }
  });

  // Mantemos o useEffect apenas para o reset inicial do ID
  useEffect(() => {
    return () => {
      setOrdemServico(null);
    };
  }, [id]);

  if (loading) return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <div style={{display:'flex', justifyContent:'center', height:'100vh', alignItems:'center'}}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    </IonPage>
  );

  if (!ordemServico) return null;

  // BLOQUEIO DE SEGURANÇA: intercepta OS com incidente antes de renderizar as etapas
  if (ordemServico.status === 'BLOQUEADO_INCIDENTE') {
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
                Esta Ordem de Serviço (<strong>#{ordemServico.id}</strong>) possui um incidente registrado e está bloqueada para auditoria do gestor.
              </p>
              <p style={styles.blockSubText}>O cronômetro de produtividade foi interrompido.</p>
              
              <button onClick={() => history.push('/ordens-servico/hoje')} style={styles.btnBack}>
                <IonIcon icon={homeOutline} style={{ marginRight: '10px' }} /> RETORNAR AO PÁTIO
              </button>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const etapaAtiva = ordemServico.etapa_atual || 1;

  return (
    <IonPage className="lm-page-dark">
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={styles.headerNav}>
          <button onClick={() => history.push('/ordens-servico/hoje')} style={styles.btnCircle}>
            <IonIcon icon={chevronBackOutline} />
          </button>
          <div style={styles.titleGroup}>
            <h1 style={styles.osTitle}>OS #{String(ordemServico.id).padStart(4, '0')}</h1>
            <p style={styles.carSubtitle}>
              {ordemServico.veiculo.marca} • <span style={{color: 'var(--lm-primary)'}}>{ordemServico.veiculo.placa}</span>
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
            { step: 1, icon: clipboardOutline, label: 'VISTORIA INICIAL' },
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
          {etapaAtiva === 1 && <EstadoVistoria ordemServicoId={ordemServico.id} onComplete={carregarOrdemServico} />}
          {etapaAtiva === 2 && <EstadoLavagem ordemServicoId={ordemServico.id} onComplete={carregarOrdemServico} />}
          {etapaAtiva === 3 && <EstadoAcabamento ordemServicoId={ordemServico.id} onComplete={carregarOrdemServico} />}
          {etapaAtiva >= 4 && <EstadoLiberacao ordemServicoId={ordemServico.id} onComplete={carregarOrdemServico} />}
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