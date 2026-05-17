import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonContent,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { lockClosedOutline, warningOutline } from 'ionicons/icons';
import './Auth.css';

const AuthGate: React.FC = () => {
  const history = useHistory();
  const [mostrarAvisoRecusa, setMostrarAvisoRecusa] = useState(false);

  const handleRecusa = () => {
    if (!mostrarAvisoRecusa) {
      // Primeiro clique: mostra o aviso
      setMostrarAvisoRecusa(true);
    } else {
      // Segundo clique: retorna para o calendário
      history.push('/agendamento');
    }
  };

  const handleAvancar = () => {
    history.push('/auth/whatsapp');
  };

  return (
    <IonPage className="auth-page">
      <IonHeader className="ion-no-border auth-header">
        <IonToolbar className="auth-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/agendamento" text="" className="auth-back-button" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding auth-content">
        <div className="auth-icon-box glow-primary">
          <IonIcon icon={lockClosedOutline} />
        </div>
        
        <h1 className="auth-title">Identificação Necessária</h1>
        
        <p className="auth-subtitle">
          Para garantir a reserva da sua vaga no lava-jato e permitir o acompanhamento do status do serviço em tempo real, precisamos de uma identificação rápida.
        </p>

        {mostrarAvisoRecusa && (
          <div className="auth-alert-card">
            <p className="auth-alert-text">
              <IonIcon icon={warningOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Atenção: De acordo com as diretrizes do sistema, a validação do WhatsApp é obrigatória para vincular o veículo à vaga. Sem a identificação, o agendamento não poderá ser concluído.
            </p>
          </div>
        )}
      </IonContent>

      <div className="auth-footer">
        <button className="auth-btn-primary" onClick={handleAvancar}>
          Avançar para o WhatsApp
        </button>
        
        <button className="auth-btn-secondary" onClick={handleRecusa}>
          Não quero me identificar agora
        </button>
      </div>
    </IonPage>
  );
};

export default AuthGate;
