import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  personOutline, 
  callOutline, 
  logOutOutline, 
  chevronForwardOutline 
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getPerfil, updatePerfil } from '../../services/api';
import type { ClientePerfil } from '../../services/api';
import './Perfil.css';

const Perfil: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showEditNameAlert, setShowEditNameAlert] = useState(false);

  const carregarDadosPerfil = () => {
    getPerfil()
      .then(setPerfil)
      .catch(() => {});
  };

  useIonViewWillEnter(() => {
    carregarDadosPerfil();
  });

  const handleLogout = () => {
    logout();
    history.replace('/welcome');
  };

  const handleSalvarNome = (novoNome: string) => {
    if (!novoNome.trim() || novoNome.trim().length < 3) return;
    updatePerfil({ nome: novoNome.trim() })
      .then(() => carregarDadosPerfil())
      .catch(() => {});
  };

  const nome = perfil?.nome ?? user?.nome ?? 'Cliente Lava-Me';
  const telefone = perfil?.telefone ?? user?.telefone ?? '+55 (11) 99999-9999';
  
  const membroDesde = perfil?.membro_desde
    ? new Date(perfil.membro_desde).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Maio de 2026';

  return (
    <IonPage className="perfil-page-premium">
      <IonHeader className="ion-no-border perfil-header-premium">
        <IonToolbar className="perfil-toolbar-fluid">
          <div className="header-content-fluid">
            <h1 className="perfil-title-premium">Perfil</h1>
            
            <div className="perfil-avatar-row">
              <div className="perfil-avatar-circle">
                <IonIcon icon={personOutline} />
              </div>
              <div className="perfil-avatar-info">
                <h2 className="avatar-user-name">{nome}</h2>
                <p className="avatar-user-date">Membro desde {membroDesde}</p>
              </div>
            </div>

          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="perfil-content-premium" scrollY={true}>
        <div className="perfil-main-container">

          {/* Seção 1: Informações Pessoais */}
          <div className="perfil-section-block">
            <p className="perfil-section-label">Informações Pessoais</p>

            {/* Card Interativo: Editar Nome */}
            <motion.div 
              className="perfil-item-card"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditNameAlert(true)}
            >
              <div className="card-item-left-icon">
                <IonIcon icon={personOutline} />
              </div>
              <div className="card-item-center-text">
                <span className="item-label">Nome</span>
                <span className="item-value">{nome}</span>
              </div>
              <div className="card-item-right-chevron">
                <IonIcon icon={chevronForwardOutline} />
              </div>
            </motion.div>

            {/* Card Interativo: Atualizar WhatsApp */}
            <motion.div 
              className="perfil-item-card"
              whileTap={{ scale: 0.98 }}
              onClick={() => history.push('/auth/whatsapp', { redirect_to: '/perfil', nome: nome })}
            >
              <div className="card-item-left-icon">
                <IonIcon icon={callOutline} />
              </div>
              <div className="card-item-center-text">
                <span className="item-label">WhatsApp</span>
                <span className="item-value">{telefone}</span>
              </div>
              <div className="card-item-right-chevron">
                <IonIcon icon={chevronForwardOutline} />
              </div>
            </motion.div>
          </div>

          {/* Seção 2: Ação de Logout */}
          <div className="perfil-section-block" style={{ marginTop: '8px' }}>
            <motion.div 
              className="perfil-item-card btn-logout-outline"
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLogoutAlert(true)}
            >
              <div className="card-item-left-icon logout-icon-box">
                <IonIcon icon={logOutOutline} />
              </div>
              <div className="card-item-center-text">
                <span className="item-label-logout">Sair da conta</span>
              </div>
            </motion.div>
          </div>

          {/* Rodapé Informativo */}
          <div className="perfil-footer-version">
            <p className="version-code">Lava-Me v1.0.0</p>
            <p className="version-tagline">Seu carro impecável sem filas</p>
          </div>

        </div>
      </IonContent>

      {/* Alerta de Edição de Nome */}
      <IonAlert
        isOpen={showEditNameAlert}
        header="Atualizar Nome"
        message="Insira o seu nome completo para atualizar o cadastro:"
        inputs={[
          {
            name: 'novoNome',
            type: 'text',
            placeholder: 'Ex: Letícia Gomes',
            value: nome
          }
        ]}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { 
            text: 'Salvar', 
            handler: (data) => handleSalvarNome(data.novoNome)
          },
        ]}
        onDidDismiss={() => setShowEditNameAlert(false)}
      />

      {/* Alerta de Confirmação de Logout */}
      <IonAlert
        isOpen={showLogoutAlert}
        header="Sair da conta"
        message="Tem certeza que deseja desconectar do aplicativo?"
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Desconectar', role: 'destructive', handler: handleLogout },
        ]}
        onDidDismiss={() => setShowLogoutAlert(false)}
      />
    </IonPage>
  );
};

export default Perfil;