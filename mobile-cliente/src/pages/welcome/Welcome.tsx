import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, logInOutline } from 'ionicons/icons';
import logoImg from './logo.jpeg';
import './Welcome.css';

const Welcome: React.FC = () => {
  const [etapa, setEtapa] = useState<'splash' | 'landing'>('splash');
  const history = useHistory();

  useEffect(() => {
    // Transição automática: splash → landing em 2.8s
    const timer = setTimeout(() => setEtapa('landing'), 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleEncontrarLavajato = () => {
    // Redireciona sempre para a tela de permissão conforme o fluxo exigido (RF-28)
    history.push('/permissao');
  };

  const handleAcessarConta = () => {
    // Rota direta para login, pulando a barreira de checkout (AuthGate)
    history.push('/auth/whatsapp');
  };

  return (
    <IonPage className="wc-page">
      <IonContent scrollY={false} fullscreen>
        <div className={`wc-wrapper ${etapa}`}>

          {/* Glow ambiente desfocado */}
          <div className="wc-ambient-glow" />

          {/* ═══ LOGO LAVA-ME ═══ */}
          <div className={`wc-logo-area ${etapa}`}>
            <div className="wc-logo-box">
              <img
                src={logoImg}
                alt="Lava-Me"
                className="wc-logo-img"
                draggable={false}
              />
            </div>
          </div>

          {/* ═══ TEXTOS ═══ */}
          <div className={`wc-text-area ${etapa}`}>
            {etapa === 'splash' ? (
              <div className="wc-text-block" key="splash-text">
                <h1 className="wc-title-splash">Lava-Me</h1>
                <p className="wc-subtitle">Seu carro impecável sem filas</p>
              </div>
            ) : (
              <div className="wc-text-block" key="landing-text">
                <h1 className="wc-title-landing">
                  Bem-vindo ao <span className="wc-highlight">Lava-Me</span>
                </h1>
                <p className="wc-subtitle">
                  Agendamento inteligente para seu veículo.<br/>
                  Mais brilho pro carro, mais tempo pra você.
                </p>
              </div>
            )}
          </div>

          {/* ═══ DOTS DE LOADING (apenas na splash) ═══ */}
          {etapa === 'splash' && (
            <div className="wc-dots">
              <span className="wc-dot" />
              <span className="wc-dot" />
              <span className="wc-dot" />
            </div>
          )}

          {/* ═══ BOTÕES CTA (apenas na landing) ═══ */}
          <div className={`wc-actions ${etapa}`}>
            {etapa === 'landing' && (
              <>
                <button className="wc-btn wc-btn-primary" onClick={handleEncontrarLavajato}>
                  <IonIcon icon={locationOutline} className="wc-btn-icon" />
                  <span>Encontrar Lavajato</span>
                </button>
                <button className="wc-btn wc-btn-secondary" onClick={handleAcessarConta}>
                  <IonIcon icon={logInOutline} className="wc-btn-icon" />
                  <span>Acessar minha conta</span>
                </button>
              </>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;