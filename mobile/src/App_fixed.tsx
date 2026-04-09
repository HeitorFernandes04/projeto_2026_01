import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import SelecaoAcesso from './pages/selecao/SelecaoAcesso';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import AtendimentosHoje from './pages/atendimentos/AtendimentosHoje';
import DetalhesAtendimento from './pages/atendimentos/DetalhesAtendimento';
import NovoAtendimento from './pages/atendimentos/NovoAtendimento';
import Historico from './pages/atendimentos/Historico';
import EsteiraProducao from './pages/atendimentos/EsteiraProducao';
import OrdensServico from './pages/ordens-servico/OrdensServico';
import DetalhesOrdemServico from './pages/ordens-servico/DetalhesOrdemServico';
import NovaOrdemServico from './pages/ordens-servico/NovaOrdemServico';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/selecao" component={SelecaoAcesso} exact />
        <Route path="/login" component={Login} exact />
        <Route path="/register" component={Register} exact />
        <Route path="/atendimentos/hoje" component={AtendimentosHoje} exact />
        <Route path="/atendimentos/novo" component={NovoAtendimento} exact />
        <Route path="/atendimentos/agendar" component={NovoAtendimento} exact />
        <Route path="/atendimentos/historico" component={Historico} exact />
        <Route path="/atendimentos/:id(\d+)/esteira" component={EsteiraProducao} exact />
        <Route path="/atendimentos/:id(\d+)" component={DetalhesAtendimento} exact />
        
        {/* Rotas de Ordem de Serviço */}
        <Route path="/ordens-servico" component={OrdensServico} exact />
        <Route path="/ordens-servico/nova" component={NovaOrdemServico} exact />
        <Route path="/ordens-servico/:id(\d+)" component={DetalhesOrdemServico} exact />
        
        <Route exact path="/">
          <Redirect to="/selecao" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
