import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { carOutline, chevronForwardOutline, addOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import './Veiculos.css';

// Interface estrita para eliminar o erro do ESLint (no-explicit-any)
interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  cor: string;
}

const VehiclesScreen: React.FC = () => {
  // Estado tipado corretamente com a interface Veiculo
  const [veiculos] = useState<Veiculo[]>([
    { id: 1, marca: 'Toyota', modelo: 'Corolla', placa: 'ABC-1234', cor: 'Preto' },
    { id: 2, marca: 'Honda', modelo: 'Civic', placa: 'XYZ-5678', cor: 'Prata' }
  ]);
  const history = useHistory();

  return (
    <IonPage className="veiculo-page">
      {/* Header Premium com alinhamento lateral fluido de 24px */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="veiculo-toolbar-fluid">
          <div className="header-content-fluid">
            <h1 className="veiculo-title-premium">Meus Veículos</h1>
            <p className="veiculo-subtitle-premium">Gerencie seus veículos cadastrados</p>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* CORREÇÃO: Removido o 'ion-padding' para eliminar a margem dupla e expandir os cards horizontalmente */}
      <IonContent className="veiculo-content-premium" scrollY={true}>
        <div className="veiculos-main-container">

          {/* Lista de Veículos (Cards Premium) */}
          <div className="veiculos-lista-vertical">
            {veiculos.map(v => (
              <motion.div
                key={v.id}
                className="veiculo-card-interactive"
                whileTap={{ scale: 0.98 }}
                onClick={() => history.push(`/veiculo/${v.id}`)}
              >
                {/* Box do Ícone à Esquerda */}
                <div className="card-left-box">
                  <IonIcon icon={carOutline} />
                </div>

                {/* Informações Centrais do Grid */}
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

                {/* Chevron Indicativo da Direita */}
                <div className="card-right-chevron">
                  <IonIcon icon={chevronForwardOutline} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Botão Premium de Adicionar com efeito Glow */}
          <motion.button
            className="btn-add-vehicle-premium"
            whileTap={{ scale: 0.96 }}
            onClick={() => history.push('/veiculo/novo')}
          >
            <IonIcon icon={addOutline} className="btn-icon" />
            Adicionar Veículo
          </motion.button>

          {/* Caixa de Dica Outline de Rodapé */}
          <div className="footer-tip-box-premium">
            <p>Cadastre seus veículos para agilizar futuros agendamentos</p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default VehiclesScreen;