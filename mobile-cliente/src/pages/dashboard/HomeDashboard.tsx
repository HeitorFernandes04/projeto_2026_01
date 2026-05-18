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

  const ativo = ativos.find(a => {
    if (a.status === 'PATIO') {
      const dateStr = a.data_hora.split('T')[0];
      return dateStr === todayStr;
    }
    return ['VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'BLOQUEADO_INCIDENTE'].includes(a.status);
  });
  
  const temAtivo = !!ativo;

  // Agendamentos futuros são aqueles que não são o ativo atual
  const futuros = ativos.filter(a => a.id !== ativo?.id);
  const clienteNome = painelData?.cliente_nome ?? 'Cliente';



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

              <div className="status-stepper">
                <div className="stepper-track">
                  <div className="stepper-fill" style={{ width: `${ativo.etapa_atual}%`, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ marginTop: '8px', textAlign: 'right', color: 'var(--auth-primary)', fontSize: '14px' }}>
                  {ativo.etapa_atual}%
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

          {/* COMPONENTE 2: SEÇÃO DE AGENDAMENTOS RECENTES */}
          <h3 className="home-section-title">Agendamentos recentes</h3>
          {painelData?.historico.map(h => (
            <div key={h.id} className="home-card-futuro" style={{ marginBottom: '12px' }}>
              <div className="home-futuro-left">
                <p className="home-futuro-servico">{h.servico_nome}</p>
                <div className="home-futuro-info-row">
                  <IonIcon icon={carOutline} className="home-futuro-icon" />
                  <span>{h.veiculo_modelo} ({h.veiculo_placa})</span>
                </div>
                <div className="home-futuro-info-row">
                  <IonIcon icon={cubeOutline} className="home-futuro-icon" />
                  <span>{h.estabelecimento.nome_fantasia}</span>
                </div>
              </div>
              <div className="home-futuro-right">
                <span className="home-futuro-badge">{h.status_display}</span>
              </div>
            </div>
          ))}

          {painelData?.historico.length === 0 && !temAtivo && futuros.length === 0 && !loading && (
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