import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setUnauthorizedHandler } from './services/http';

import Home from './pages/home/Home';
import PermissaoLocalizacao from './pages/permissao/PermissaoLocalizacao';
import AuthGate from './pages/auth/AuthGate';
import LoginWhatsApp from './pages/auth/LoginWhatsApp';
import VerificacaoOTP from './pages/auth/VerificacaoOTP';
import Servicos from './pages/servicos/Servicos';
import Agendamento from './pages/agendamento/Agendamento';
import Confirmacao from './pages/agendamento/Confirmacao';
import SeuVeiculo from './pages/veiculos/SeuVeiculo';
import TabLayout from './components/TabLayout/TabLayout';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Leaflet CSS */
import 'leaflet/dist/leaflet.css';

/* Dark Mode nativo */
import '@ionic/react/css/palettes/dark.system.css';

/* Tema Lava-Me */
import './theme/variables.css';
import './theme/lava-me.css';

setupIonicReact({ mode: 'md' });

const AppRoutes: React.FC = () => {
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const localizacaoSolicitada =
    localStorage.getItem('lm_localizacao_solicitada') === 'true';

  return (
    <IonRouterOutlet>
      <Route exact path="/">
        {localizacaoSolicitada
          ? <Redirect to="/mapa" />
          : <Redirect to="/permissao" />}
      </Route>

      <Route exact path="/permissao" component={PermissaoLocalizacao} />
      <Route exact path="/mapa" component={Home} />

      <Route exact path="/auth" component={AuthGate} />
      <Route exact path="/auth/whatsapp" component={LoginWhatsApp} />
      <Route exact path="/auth/verificacao" component={VerificacaoOTP} />

      <Route exact path="/servicos/:slug" component={Servicos} />
      <Route exact path="/agendamento" component={Agendamento} />
      <Route exact path="/agendamento/confirmacao" component={Confirmacao} />
      <Route exact path="/veiculo/novo" component={SeuVeiculo} />
      <Route exact path="/veiculo/:id" component={SeuVeiculo} />

      {/* Rotas com tab bar — logado */}
      <Route
        path="/(inicio|acompanhamento|veiculos|historico|perfil)"
        component={TabLayout}
      />
    </IonRouterOutlet>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;
