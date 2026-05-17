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

const TabLayout: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/inicio" component={HomeDashboard} />
      <Route exact path="/acompanhamento" component={Acompanhamento} />
      <Route exact path="/veiculos" component={MeusVeiculos} />
      <Route exact path="/historico" component={Historico} />
      <Route exact path="/perfil" component={Perfil} />
      <Route exact path="/tabs">
        <Redirect to="/inicio" />
      </Route>
    </IonRouterOutlet>

    <IonTabBar slot="bottom" className="lm-tab-bar">
      <IonTabButton tab="inicio" href="/inicio">
        <IonIcon icon={homeOutline} />
        <IonLabel>Início</IonLabel>
      </IonTabButton>
      <IonTabButton tab="acompanhamento" href="/acompanhamento">
        <IonIcon icon={timeOutline} />
        <IonLabel>Acompanhar</IonLabel>
      </IonTabButton>
      <IonTabButton tab="veiculos" href="/veiculos">
        <IonIcon icon={carOutline} />
        <IonLabel>Veículos</IonLabel>
      </IonTabButton>
      <IonTabButton tab="historico" href="/historico">
        <IonIcon icon={listOutline} />
        <IonLabel>Histórico</IonLabel>
      </IonTabButton>
      <IonTabButton tab="perfil" href="/perfil">
        <IonIcon icon={personOutline} />
        <IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default TabLayout;
