import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  carOutline,
  timeOutline,
  calendarOutline,
  cubeOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
// CORREÇÃO: Sintaxe correta de importação ES Modules para Vite e TypeScript
import logoImg from '../welcome/logo.jpeg';
import './HomeDashboard.css';

// Altere para `true` para simular o card de "Veículo finalizado, pronto para retirada"
const isServiceFinished = false;

const HomeDashboard: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage className="home-page">
      {/* HEADER PREMIUM: Retângulo superior cinza idêntico ao padrão das outras telas */}
      <IonHeader className="ion-no-border veiculo-header">
        <IonToolbar className="veiculo-toolbar-fluid">
          <div className="home-header-content-flex">
            <div className="home-greeting-group">
              <h1 className="home-greeting-title">Olá, Letícia!</h1>
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

      {/* Conteúdo rolável com container interno seguro */}
      <IonContent className="home-content-premium" scrollY={true}>
        <div className="home-main-container">
          
          {/* COMPONENTE 1: CARD DE STATUS DO SERVIÇO ATIVO */}
          <div className="home-card-ativo">
            
            {/* Header do Status */}
            <div className="status-header">
              <div className="status-icon-box">
                <IonIcon icon={cubeOutline} />
              </div>
              <div className="status-titles">
                <span className="status-subtitle">Status do Serviço</span>
                <h2 className="status-title">
                  {isServiceFinished ? "Serviço finalizado" : "Lavagem em andamento"}
                </h2>
              </div>
            </div>

            {/* Informações do Veículo */}
            <div className="status-veiculo-info">
              <IonIcon icon={carOutline} className="veiculo-icon" />
              <span className="veiculo-text">Toyota Corolla - ABC-1234</span>
            </div>

            {/* Andamento vs Finalizado */}
            {!isServiceFinished ? (
              <>
                {/* Linha do Tempo Horizontal (Stepper) */}
                <div className="status-stepper">
                  <div className="stepper-track">
                    <div className="stepper-fill" style={{ width: '66%' }} />
                  </div>

                  <div className="stepper-steps">
                    <div className="step-item completed">
                      <div className="step-circle"><div className="step-dot" /></div>
                      <span className="step-label">No pátio</span>
                    </div>
                    
                    <div className="step-item completed">
                      <div className="step-circle"><div className="step-dot" /></div>
                      <span className="step-label">Em vistoria</span>
                    </div>
                    
                    <div className="step-item pulsing">
                      <div className="step-circle"><div className="step-dot" /></div>
                      <span className="step-label">Em execução</span>
                    </div>
                    
                    <div className="step-item">
                      <div className="step-circle"><div className="step-dot" /></div>
                      <span className="step-label">Em liberação</span>
                    </div>
                  </div>
                </div>

                {/* Horário Estimado */}
                <div className="status-footer">
                  <IonIcon icon={timeOutline} className="status-time-icon" />
                  <span className="status-time-text">
                    Previsão de entrega: <strong>14:30</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="status-success-banner">
                <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
                <p className="success-text">Veículo finalizado,<br/>pronto para retirada.</p>
              </div>
            )}
          </div>

          {/* COMPONENTE 2: SEÇÃO DE PRÓXIMOS AGENDAMENTOS */}
          <h3 className="home-section-title">Próximos agendamentos</h3>
          <div className="home-card-futuro">
            <div className="home-futuro-left">
              <p className="home-futuro-servico">Lavagem Completa</p>
              <div className="home-futuro-info-row">
                <IonIcon icon={carOutline} className="home-futuro-icon" />
                <span>Corolla Branco</span>
              </div>
            </div>
            <div className="home-futuro-right">
              <span className="home-futuro-badge">Amanhã, 14:00</span>
            </div>
          </div>

          {/* COMPONENTE 3: BOTÃO PRINCIPAL DE AGENDAMENTO CORRIGIDO */}
          <div className="home-footer-action">
            <button
              className="home-btn-agendar-premium"
              onClick={() => history.push('/permissao')}
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