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
import Agendar from './pages/atendimentos/Agendar'; 
import EsteiraProducao from './pages/atendimentos/EsteiraProducao';

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

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rota inicial de seleção de perfil */}
        <Route path="/selecao" component={SelecaoAcesso} exact />
        
        {/* Rotas de Autenticação */}
        <Route path="/login" component={Login} exact />
        <Route path="/register" component={Register} exact />
        
        {/* Pátio Principal (Atendimentos Ativos) */}
        <Route path="/atendimentos/hoje" component={AtendimentosHoje} exact />
        
        {/* Entrada de Veículos: Rápida vs Agendada */}
        <Route path="/atendimentos/novo" component={NovoAtendimento} exact />
        <Route path="/atendimentos/agendar" component={Agendar} exact />
        
        {/* Consulta de Serviços Finalizados */}
        <Route path="/atendimentos/historico" component={Historico} exact />

        {/* ROTA OPERACIONAL: Esteira de Produção 
          Axioma 13: Deve vir antes da rota genérica para evitar conflitos de ID.
        */}
        <Route path="/atendimentos/:id/esteira" component={EsteiraProducao} exact />
        
        {/* Rota de Detalhes (Visualização de Histórico) */}
        <Route path="/atendimentos/:id(\d+)" component={DetalhesAtendimento} exact />
        
        {/* Redirecionamento Padrão */}
        <Route exact path="/">
          <Redirect to="/selecao" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;