import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonInput,
  IonItem,
  IonIcon,
} from '@ionic/react';
import { sparklesOutline, warningOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { solicitarOTP } from '../../services/api';
import './Auth.css';

// Helper de formatação em tempo real
function aplicarMascaraTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

const LoginWhatsApp: React.FC = () => {
  const [nome, setNome] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  // Verifica se o usuário vem de um fluxo de agendamento (novo cadastro) ou login direto
  const hasAgendamento = !!(localStorage.getItem('lm_agendamento_temporario') || localStorage.getItem('lm_agendamento_pendente'));

  const telefoneLimpo = telefoneFormatado.replace(/\D/g, '');
  
  // Validação estrita: se for agendamento precisa de nome > 2. Se for login direto, apenas telefone.
  const isTelefoneValido = telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
  const isValido = hasAgendamento 
    ? isTelefoneValido && nome.trim().length >= 3 
    : isTelefoneValido;

  const handleInputTelefone = (valor: string) => {
    setTelefoneFormatado(aplicarMascaraTelefone(valor));
    setErro('');
  };

  const handleContinuar = async () => {
    if (!isValido) return;
    
    setLoading(true);
    setErro('');
    
    try {
      await solicitarOTP(`+55${telefoneLimpo}`);
      
      history.push('/auth/verificacao', { 
        telefone: `+55${telefoneLimpo}`,
        nome_cliente: hasAgendamento ? nome.trim() : undefined
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha na comunicação. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonHeader className="ion-no-border auth-header">
        <IonToolbar className="auth-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth" text="" className="auth-back-button" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding auth-content">
        <div className="auth-emoji-box glow-primary">
          <IonIcon icon={sparklesOutline} />
        </div>

        <h1 className="auth-title">Identificação</h1>
        <p className="auth-subtitle">
          {hasAgendamento 
            ? "Insira seus dados para finalizar e acompanhar o seu agendamento em tempo real."
            : "Insira seu número de WhatsApp para acessar sua conta."}
        </p>

        {/* Renderização Condicional do Nome */}
        {hasAgendamento && (
          <div className="auth-form-group">
            <label className="auth-label">Seu Nome completo</label>
            <IonItem className="auth-input-item" lines="none">
              <IonInput
                type="text"
                placeholder="Ex: João Silva"
                value={nome}
                onIonInput={e => {
                  setNome(String(e.detail.value ?? ''));
                  setErro('');
                }}
              />
            </IonItem>
          </div>
        )}

        <div className="auth-form-group">
          <label className="auth-label">Número do WhatsApp</label>
          <div className="auth-phone-row">
            <IonItem className="auth-input-item auth-ddi-box" lines="none">
              <IonInput value="+55" readonly className="ion-text-center" />
            </IonItem>
            
            <IonItem className="auth-input-item auth-phone-box" lines="none">
              <IonInput
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefoneFormatado}
                onIonInput={e => handleInputTelefone(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </div>
        </div>

        {erro && (
          <div className="auth-alert-card">
            <p className="auth-alert-text">
              <IonIcon icon={warningOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {erro}
            </p>
          </div>
        )}
      </IonContent>

      <div className="auth-footer">
        <button
          className="auth-btn-primary"
          disabled={!isValido || loading}
          onClick={handleContinuar}
        >
          {loading ? 'Aguarde...' : (hasAgendamento ? 'Enviar Código por WhatsApp' : 'Entrar com WhatsApp')}
        </button>
      </div>
    </IonPage>
  );
};

export default LoginWhatsApp;
