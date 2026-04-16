import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import SelecaoAcesso from './pages/selecao/SelecaoAcesso';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import OrdensServicoHoje from './pages/ordens-servico/OrdensServicoHoje';
import DetalhesOrdemServico from './pages/ordens-servico/DetalhesOrdemServico';
import NovaOrdemServico from './pages/ordens-servico/NovaOrdemServico';
import Historico from './pages/ordens-servico/Historico';
import Agendar from './pages/ordens-servico/Agendar'; 
import EsteiraProducao from './pages/ordens-servico/EsteiraProducao';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact({
  mode: 'md'
});

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rota inicial de seleção de perfil */}
        <Route path="/selecao" component={SelecaoAcesso} exact />
        
        {/* Rotas de Autenticação */}
        <Route path="/login" component={Login} exact />
        <Route path="/register" component={Register} exact />
        
        {/* Pátio Principal (Ordens de Serviço Ativas) */}
        <Route path="/ordens-servico/hoje" component={OrdensServicoHoje} exact />
        
        {/* Gestão de Fluxo */}
        <Route path="/ordens-servico/novo" component={NovaOrdemServico} exact />
        <Route path="/ordens-servico/agendar" component={Agendar} exact />
        
        {/* Histórico e Relatórios */}
        <Route path="/ordens-servico/historico" component={Historico} exact />

        {/* Detalhes e Operação (Esteira) */}
        <Route path="/ordens-servico/:id/esteira" component={EsteiraProducao} exact />

        {/* Detalhes ( fallback para ID numérico ) */}
        <Route path="/ordens-servico/:id(\d+)" component={DetalhesOrdemServico} exact />
        
        {/* Redirecionamento Padrão */}
        <Route exact path="/">
          <Redirect to="/selecao" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;