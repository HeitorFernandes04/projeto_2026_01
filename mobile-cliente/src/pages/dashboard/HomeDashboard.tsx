import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  carOutline,
  calendarOutline,
  cubeOutline,
} from 'ionicons/icons';
import logoImg from '../welcome/logo.jpeg';
import { getPainelCliente, PainelClienteResponse } from '../../services/api';
import './HomeDashboard.css';

const HomeDashboard: React.FC = () => {
  const history = useHistory();
  const [painelData, setPainelData] = useState<PainelClienteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useIonViewWillEnter(() => {
    setLoading(true);
    getPainelCliente()
      .then(data => {
        setPainelData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar painel:', err);
        setLoading(false);
      });
  });

  const ativos = painelData?.ativos ?? [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Prioridade para ordens que já estão em execução
  const emExecucao = ativos.filter(a => 
    ['VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE'].includes(a.status)
  );

  let ativo: any = null;

  if (emExecucao.length > 0) {
    ativo = emExecucao.sort((a, b) => a.data_hora.localeCompare(b.data_hora))[0];
  } else {
    // 2. Se nenhuma está em execução, procura as que estão no PÁTIO hoje
    const noPatioHoje = ativos.filter(a => {
      if (a.status !== 'PATIO') return false;
      const dateStr = a.data_hora.split('T')[0];
      return dateStr === todayStr;
    });

    if (noPatioHoje.length > 0) {
      ativo = noPatioHoje.sort((a, b) => a.data_hora.localeCompare(b.data_hora))[0];
    }
  }
  
  const temAtivo = !!ativo;

  // Agendamentos futuros são aqueles que não são o ativo atual
  const futuros = ativos.filter(a => a.id !== ativo?.id);
  const clienteNome = painelData?.cliente_nome ?? 'Cliente';

  const steps = [
    { label: 'Vistoria', status: 'VISTORIA_INICIAL' },
    { label: 'Execução', status: 'EM_EXECUCAO' },
    { label: 'Liberação', status: 'LIBERACAO' }
  ];

  const getStepIndex = (status: string) => {
    if (status === 'VISTORIA_INICIAL') return 0;
    if (status === 'EM_EXECUCAO' || status === 'BLOQUEADO_INCIDENTE') return 1;
    if (status === 'LIBERACAO') return 2;
    return -1;
  };

  const currentStepIndex = ativo ? getStepIndex(ativo.status) : -1;

  // Busca serviço finalizado (removi o limite de 2h para fins de teste)
  const finalizadoRecente = [...ativos, ...(painelData?.historico ?? [])].find(a => a.status === 'FINALIZADO');

  return (
    <IonPage className="home-page">
      <IonHeader className="ion-no-border veiculo-header">
        <IonToolbar className="veiculo-toolbar-fluid">
          <div className="home-header-content-flex">
            <div className="home-greeting-group">
              <h1 className="home-greeting-title">Olá, {clienteNome}!</h1>
              <p className="home-greeting-subtitle">Bem-vindo de volta</p>
            </div>
            <div className="home-logo-box">
              <img 
                src={logoImg} 
                alt="Lava-Me Logo" 
                className="home-logo-img" 
                draggable={false} 
              />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content-premium" scrollY={true}>
        <div className="home-main-container">
          
          {/* COMPONENTE: AVISO DE VEÍCULO PRONTO */}
          {finalizadoRecente && (
            <div className="home-card-ativo" style={{ background: '#1E293B', borderColor: '#34D399', borderStyle: 'solid', borderWidth: '1px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', gap: '12px' }}>
                
                <div className="success-animation-box">
                  <div className="pulse-circle"></div>
                  <IonIcon icon={carOutline} style={{ fontSize: '40px', color: '#34D399', zIndex: 2 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h2 style={{ color: '#F8FAFC', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                    Olá, {clienteNome}!
                  </h2>
                  <p style={{ color: '#CBD5E1', fontSize: '15px', margin: 0 }}>
                    Seu serviço foi finalizado! 🎉
                  </p>
                  <p style={{ color: '#34D399', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Busque seu carro no estabelecimento.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '12px', width: '100%', marginTop: '4px' }}>
                  <p style={{ color: '#F8FAFC', fontSize: '13px', margin: 0 }}>
                    <strong>{finalizadoRecente.veiculo_modelo}</strong> ({finalizadoRecente.veiculo_placa})
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '11px', margin: '2px 0 0 0' }}>
                    {finalizadoRecente.estabelecimento.nome_fantasia}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* COMPONENTE 1: CARD DE STATUS DO SERVIÇO ATIVO */}
          {temAtivo && (
            <div className="home-card-ativo">
              <div className="status-header">
                <div className="status-icon-box">
                  <IonIcon icon={cubeOutline} />
                </div>
                <div className="status-titles">
                  <span className="status-subtitle">Status do Serviço</span>
                  <h2 className="status-title">{ativo.status_display}</h2>
                </div>
              </div>

              <div className="status-veiculo-info">
                <IonIcon icon={carOutline} className="veiculo-icon" />
                <span className="veiculo-text">{ativo.veiculo_modelo} - {ativo.veiculo_placa}</span>
              </div>

              <div className="status-veiculo-info">
                <IonIcon icon={cubeOutline} className="veiculo-icon" />
                <span className="veiculo-text">{ativo.servico_nome} | {ativo.estabelecimento.nome_fantasia}</span>
              </div>

              <div className="status-stepper" style={{ marginTop: '8px', marginBottom: '8px' }}>
                <div className="stepper-track">
                  <div 
                    className="stepper-fill" 
                    style={{ 
                      width: `${currentStepIndex >= 0 ? (currentStepIndex / 2) * 100 : 0}%`, 
                      transition: 'width 0.8s ease' 
                    }} 
                  />
                </div>
                <div className="stepper-steps">
                  {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    let itemClass = 'step-item';
                    if (isCompleted) itemClass += ' completed';
                    if (isCurrent) itemClass += ' pulsing';
                    
                    return (
                      <div key={step.status} className={itemClass}>
                        <div className="step-circle">
                          <div className="step-dot"></div>
                        </div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="status-footer" style={{ marginTop: '16px' }}>
                <button 
                  className="home-btn-agendar-premium" 
                  style={{ height: '44px', fontSize: '14px' }}
                  onClick={() => history.push('/acompanhamento')}
                >
                  Acompanhar
                </button>
              </div>
            </div>
          )}

          {/* COMPONENTE: PRÓXIMOS AGENDAMENTOS */}
          {futuros.length > 0 && (
            <>
              <h3 className="home-section-title">Próximos agendamentos</h3>
              {futuros.map(f => (
                <div key={f.id} className="home-card-futuro" style={{ marginBottom: '12px' }}>
                  <div className="home-futuro-left">
                    <p className="home-futuro-servico">{f.servico_nome}</p>
                    <div className="home-futuro-info-row">
                      <IonIcon icon={carOutline} className="home-futuro-icon" />
                      <span>{f.veiculo_modelo} ({f.veiculo_placa})</span>
                    </div>
                    <div className="home-futuro-info-row">
                      <IonIcon icon={cubeOutline} className="home-futuro-icon" />
                      <span>{f.estabelecimento.nome_fantasia}</span>
                    </div>
                  </div>
                  <div className="home-futuro-right">
                    <span className="home-futuro-badge">{f.status === 'PATIO' ? 'Agendado' : f.status_display}</span>

                  </div>
                </div>
              ))}
            </>
          )}

          {!temAtivo && futuros.length === 0 && !finalizadoRecente && !loading && (
            <p style={{ color: 'var(--auth-muted)', textAlign: 'center', marginTop: '20px' }}>
              Você ainda não possui agendamentos.
            </p>
          )}


          {/* COMPONENTE 3: BOTÃO PRINCIPAL DE AGENDAMENTO */}
          <div className="home-footer-action">
            <button
              className="home-btn-agendar-premium"
              onClick={() => history.push('/mapa')}
            >
              <IonIcon icon={calendarOutline} className="home-btn-icon-large" />
              Agendar Nova Lavagem
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeDashboard;