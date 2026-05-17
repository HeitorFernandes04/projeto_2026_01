import React from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
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
    <IonPage className="lm-page">
      <IonContent className="ion-padding">
        <div className="permissao-container">
          <div className="permissao-icon lm-card">
            <span className="permissao-emoji">📍</span>
          </div>

          <h1 className="permissao-titulo">
            Encontre lava-jatos próximos
          </h1>

          <p className="permissao-descricao">
            Precisamos da sua localização para mostrar os estabelecimentos
            mais próximos de você.
          </p>

          <IonButton
            className="lm-btn-primary"
            expand="block"
            onClick={handlePermitir}
          >
            ✈️ Permitir localização
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
