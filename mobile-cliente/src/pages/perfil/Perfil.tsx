import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToggle,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPerfil, updatePerfil } from '../../services/api';
import type { ClientePerfil } from '../../services/api';
import './Perfil.css';

const Perfil: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [notificacoes, setNotificacoes] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  useIonViewWillEnter(() => {
    getPerfil()
      .then(p => {
        setPerfil(p);
        setNotificacoes(p.notificacoes_ativas ?? true);
      })
      .catch(() => {});
  });

  const handleLogout = () => {
    logout();
    history.replace('/mapa');
  };

  const handleToggleNotificacoes = (ativo: boolean) => {
    setNotificacoes(ativo);
    updatePerfil({ notificacoes_ativas: ativo }).catch(() => {});
  };

  const nome = perfil?.nome ?? user?.nome ?? 'Cliente Lava-Me';
  const telefone = perfil?.telefone ?? user?.telefone ?? '';
  const membroDesde = perfil?.membro_desde
    ? new Date(perfil.membro_desde).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    : '';

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="perfil-toolbar">
          <IonTitle className="perfil-title">Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Avatar + info */}
        <div className="perfil-avatar-row">
          <div className="perfil-avatar lm-card">
            <span className="perfil-avatar-emoji">👤</span>
          </div>
          <div className="perfil-avatar-info">
            <p className="perfil-nome">{nome}</p>
            {membroDesde && (
              <p className="perfil-membro">Membro desde {membroDesde}</p>
            )}
          </div>
        </div>

        {/* Informações pessoais */}
        <p className="perfil-section-label">INFORMAÇÕES PESSOAIS</p>

        <div className="lm-card perfil-item-card">
          <span className="perfil-item-icon">👤</span>
          <div className="perfil-item-info">
            <span className="perfil-item-label">Nome</span>
            <span className="perfil-item-valor">{nome}</span>
          </div>
          <span className="perfil-item-chevron">›</span>
        </div>

        <div className="lm-card perfil-item-card">
          <span className="perfil-item-icon">📞</span>
          <div className="perfil-item-info">
            <span className="perfil-item-label">WhatsApp</span>
            <span className="perfil-item-valor">{telefone}</span>
          </div>
        </div>

        {/* Preferências */}
        <p className="perfil-section-label">PREFERÊNCIAS</p>

        <div className="lm-card perfil-item-card">
          <span className="perfil-item-icon">🔔</span>
          <div className="perfil-item-info">
            <span className="perfil-item-label">Notificações</span>
            <span className="perfil-item-valor-muted">Receber atualizações</span>
          </div>
          <IonToggle
            checked={notificacoes}
            onIonChange={e => handleToggleNotificacoes(e.detail.checked)}
          />
        </div>

        {/* Logout */}
        <div
          className="lm-card perfil-item-card perfil-logout"
          onClick={() => setShowLogoutAlert(true)}
        >
          <span className="perfil-logout-texto">→ Sair da conta</span>
        </div>

        <p className="perfil-versao">Lava-Me v1.0.0</p>
      </IonContent>

      <IonAlert
        isOpen={showLogoutAlert}
        header="Sair da conta"
        message="Tem certeza que deseja sair?"
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Sair', role: 'destructive', handler: handleLogout },
        ]}
        onDidDismiss={() => setShowLogoutAlert(false)}
      />
    </IonPage>
  );
};

export default Perfil;
