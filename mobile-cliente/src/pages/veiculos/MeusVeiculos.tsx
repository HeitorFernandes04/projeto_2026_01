import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { getVeiculos } from '../../services/api';
import type { Veiculo } from '../../services/api';
import './Veiculos.css';

const MeusVeiculos: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const history = useHistory();

  useIonViewWillEnter(() => {
    getVeiculos()
      .then(setVeiculos)
      .catch(() => {});
  });

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="veiculo-toolbar">
          <IonTitle className="veiculo-title">Meus Veículos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <p className="veiculos-subtitulo">Gerencie seus veículos</p>

        {veiculos.length === 0 ? (
          <div className="veiculos-vazio">
            <span className="veiculos-vazio-emoji">🚗</span>
            <p className="veiculos-vazio-texto">
              Cadastre seus veículos para agilizar futuros agendamentos.
            </p>
          </div>
        ) : (
          veiculos.map(v => (
            <div
              key={v.id}
              className="lm-card veiculo-card"
              onClick={() => history.push(`/veiculo/${v.id}`)}
            >
              <span className="veiculo-card-icon">🚗</span>
              <div className="veiculo-card-info">
                <span className="veiculo-card-nome">{v.marca} {v.modelo}</span>
                <span className="veiculo-card-detalhe">Placa: {v.placa}</span>
                <span className="veiculo-card-detalhe">Cor: {v.cor}</span>
              </div>
              <span className="veiculo-card-chevron">›</span>
            </div>
          ))
        )}

        <IonButton
          fill="outline"
          expand="block"
          className="veiculos-add-btn"
          onClick={() => history.push('/veiculo/novo')}
        >
          + Adicionar Veículo
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default MeusVeiculos;
