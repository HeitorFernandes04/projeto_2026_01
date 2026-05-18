import React from 'react';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import {
  homeOutline,
  timeOutline,
  carOutline,
  listOutline,
  personOutline,
} from 'ionicons/icons';
import HomeDashboard from '../../pages/dashboard/HomeDashboard';
import Acompanhamento from '../../pages/acompanhamento/Acompanhamento';
import MeusVeiculos from '../../pages/veiculos/MeusVeiculos';
import Historico from '../../pages/historico/Historico';
import Perfil from '../../pages/perfil/Perfil';
import './TabLayout.css';

const TabLayout: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Mapeamento estrito e correto das rotas internas */}
        <Route exact path="/inicio" component={HomeDashboard} />
        <Route exact path="/acompanhamento" component={Acompanhamento} />
        <Route exact path="/veiculos" component={MeusVeiculos} />
        <Route exact path="/historico" component={Historico} />
        <Route exact path="/perfil" component={Perfil} />
        <Route exact path="/tabs">
          <Redirect to="/inicio" />
        </Route>
      </IonRouterOutlet>

      {/* Barra de Navegação Inferior Corrigida e Alinhada */}
      <IonTabBar slot="bottom" className="lm-tab-bar">
        {/* 1. ABA INÍCIO: Aponta estritamente para /inicio */}
        <IonTabButton tab="inicio" href="/inicio">
          <IonIcon icon={homeOutline} />
          <IonLabel>Início</IonLabel>
        </IonTabButton>

        {/* 2. ABA ACOMPANHAMENTO */}
        <IonTabButton tab="acompanhamento" href="/acompanhamento">
          <IonIcon icon={timeOutline} />
          <IonLabel>Acompanhar</IonLabel>
        </IonTabButton>

        {/* 3. ABA VEÍCULOS */}
        <IonTabButton tab="veiculos" href="/veiculos">
          <IonIcon icon={carOutline} />
          <IonLabel>Veículos</IonLabel>
        </IonTabButton>

        {/* 4. ABA HISTÓRICO */}
        <IonTabButton tab="historico" href="/historico">
          <IonIcon icon={listOutline} />
          <IonLabel>Histórico</IonLabel>
        </IonTabButton>

        {/* 5. ABA PERFIL: Aponta estritamente para /perfil */}
        <IonTabButton tab="perfil" href="/perfil">
          <IonIcon icon={personOutline} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default TabLayout;