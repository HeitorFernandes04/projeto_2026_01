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
import { carOutline, chevronForwardOutline, addOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { getVeiculos } from '../../services/api';
import type { Veiculo } from '../../services/api';
import './MeusVeiculos.css';

const MeusVeiculos: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useIonViewWillEnter(() => {
    setLoading(true);
    getVeiculos()
      .then(setVeiculos)
      .catch(() => setVeiculos([]))
      .finally(() => setLoading(false));
  });


  return (
    <IonPage className="veiculo-page">
      {/* Header Premium com a classe de ancoragem de cor corrigida */}
      <IonHeader className="ion-no-border veiculo-header">
        <IonToolbar className="veiculo-toolbar-fluid">
          <div className="header-content-fluid">
            <h1 className="veiculo-title-premium">Meus Veículos</h1>
            <p className="veiculo-subtitle-premium">Gerencie seus veículos cadastrados</p>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* Conteúdo com o fundo azul escuro fluido */}
      <IonContent className="veiculo-content-premium" scrollY={true}>
        <div className="veiculos-main-container">

          {loading ? (
            <p style={{ textAlign: 'center', color: 'white', marginTop: '50px' }}>Carregando veículos...</p>
          ) : (
            <>
              {/* Lista de Veículos */}
              {veiculos.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-radar-box">
                    <IonIcon icon={carOutline} className="empty-radar-icon" />
                  </div>
                  <h2 className="empty-title">Nenhum veículo cadastrado</h2>
                  <p className="empty-subtitle">Cadastre seus veículos para agilizar seus agendamentos.</p>
                </div>
              ) : (
                <div className="veiculos-lista-vertical">
                  {veiculos.map(v => (
                    <motion.div
                      key={v.id}
                      className="veiculo-card-interactive"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => history.push(`/veiculo/${v.id}`)}
                    >
                      <div className="card-left-box">
                        <IonIcon icon={carOutline} />
                      </div>

                      <div className="card-center-info">
                        <h3 className="card-vehicle-title">{v.marca} {v.modelo}</h3>
                        <div className="card-mini-grid">
                          <div className="grid-column">
                            <span className="column-label">Placa</span>
                            <span className="column-value">{v.placa}</span>
                          </div>
                          <div className="grid-column">
                            <span className="column-label">Cor</span>
                            <span className="column-value">{v.cor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-right-chevron">
                        <IonIcon icon={chevronForwardOutline} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}


          {/* Botão de Adicionar */}
          <motion.button
            className="btn-add-vehicle-premium"
            whileTap={{ scale: 0.96 }}
            onClick={() => history.push('/veiculo/novo')}
          >
            <IonIcon icon={addOutline} className="btn-icon" />
            Adicionar Veículo
          </motion.button>

          {/* Dica de Rodapé */}
          <div className="footer-tip-box-premium">
            <p>Cadastre seus veículos para agilizar futuros agendamentos</p>
          </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MeusVeiculos;