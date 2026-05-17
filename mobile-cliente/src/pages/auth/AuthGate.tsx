import React, { useEffect } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const AuthGate: React.FC = () => {
  const { token } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (token) {
      const destino = localStorage.getItem('lm_destino_pos_auth') ?? '/inicio';
      localStorage.removeItem('lm_destino_pos_auth');
      history.replace(destino);
    }
  }, [token, history]);

  const irParaWhatsApp = () => history.push('/auth/whatsapp');

  return (
    <IonPage className="lm-page">
      <IonContent className="ion-padding">
        <div className="auth-container">
          <div className="auth-icon lm-card">
            <span className="auth-emoji">🔒</span>
          </div>

          <h1 className="auth-titulo">Autenticação necessária</h1>

          <p className="auth-descricao">
            Para continuar com seu agendamento, você precisa entrar ou criar uma conta.
          </p>

          <IonButton className="lm-btn-primary" expand="block" onClick={irParaWhatsApp}>
            💬 Entrar com WhatsApp
          </IonButton>

          <IonButton
            fill="outline"
            expand="block"
            onClick={irParaWhatsApp}
            className="auth-btn-outline"
          >
            👤 Criar conta
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthGate;
