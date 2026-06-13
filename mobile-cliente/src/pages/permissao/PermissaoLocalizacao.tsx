import React from 'react';
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/react';
import { locationOutline, navigateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import './PermissaoLocalizacao.css';

const PermissaoLocalizacao: React.FC = () => {
  const history = useHistory();

  const handlePermitir = async () => {
    try {
      await Geolocation.requestPermissions();
    } catch {
      // Permissão negada ou não disponível — continua normalmente
    }
    localStorage.setItem('lm_localizacao_solicitada', 'true');
    history.replace('/mapa');
  };

  const handleAgoraNao = () => {
    localStorage.setItem('lm_localizacao_solicitada', 'true');
    history.replace('/mapa');
  };

  return (
    <IonPage className="lm-page permissao-page">
      <IonContent className="ion-padding permissao-content">
        <div className="permissao-container">
          <div className="permissao-icon-container">
            <div className="permissao-pulse-ring"></div>
            <div className="permissao-icon-circle">
              <span className="permissao-emoji"><IonIcon icon={locationOutline} /></span>
            </div>
          </div>

          <h1 className="permissao-titulo">
            Encontre lava-jatos próximos
          </h1>

          <p className="permissao-descricao">
            Precisamos da sua localização para mostrar os melhores 
            estabelecimentos perto de você.
          </p>

          <IonButton
            className="permissao-btn-custom"
            expand="block"
            onClick={handlePermitir}
          >
            <IonIcon icon={navigateOutline} style={{ marginRight: '8px', fontSize: '18px' }} />
            Permitir localização
          </IonButton>

          <button className="permissao-link" onClick={handleAgoraNao}>
            Agora não
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PermissaoLocalizacao;
