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
import { useHistory, useLocation } from 'react-router-dom';
import { solicitarOTP } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth();
  const location = useLocation<{ redirect_to?: string, nome?: string }>();
  const isPerfilFlow = location.state?.redirect_to === '/perfil';

  const [precisaNome, setPrecisaNome] = useState(false);

  // Verifica se o usuário vem de um fluxo de agendamento
  const hasAgendamento = !!(localStorage.getItem('lm_agendamento_temporario') || localStorage.getItem('lm_agendamento_pendente'));

  const telefoneLimpo = telefoneFormatado.replace(/\D/g, '');
  
  // Validação: se precisar do nome (novo usuário), exige 3 caracteres. Senão, só valida o telefone.
  const isTelefoneValido = telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
  const isValido = precisaNome 
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
    
    const nomeParaEnvio = isPerfilFlow 
      ? (location.state?.nome || user?.nome) 
      : (precisaNome ? nome.trim() : undefined);
    
    try {
      const res = await solicitarOTP(`+55${telefoneLimpo}`, nomeParaEnvio);
      console.log('PIN_DEBUG:', res.pin_debug);
      
      history.push('/auth/verificacao', { 
        telefone: `+55${telefoneLimpo}`,
        nome_cliente: nomeParaEnvio,
        redirect_to: isPerfilFlow ? '/perfil' : undefined
      });
    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      // Se o backend avisar que não tem cadastro, exibe o campo de nome
      if (errorMsg.includes('Usuário não cadastrado')) {
        setPrecisaNome(true);
        setErro('Parece que é seu primeiro acesso! Por favor, informe seu nome para continuarmos.');
      } else {
        setErro(errorMsg || 'Falha na comunicação. Verifique sua conexão e tente novamente.');
      }
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

        <h1 className="auth-title">{isPerfilFlow ? "Atualização" : "Identificação"}</h1>
        <p className="auth-subtitle">
          {isPerfilFlow
            ? "Atualize seu número de WhatsApp."
            : hasAgendamento 
              ? "Insira seus dados para finalizar e acompanhar o seu agendamento em tempo real."
              : "Insira seu número de WhatsApp para acessar sua conta."}
        </p>

        {/* Renderização Condicional do Nome (Apenas se precisar cadastrar) */}
        {precisaNome && (
          <div className="auth-form-group fade-in">
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
                maxlength={15}
                onIonInput={e => handleInputTelefone(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </div>
        </div>

        {erro && (
          <div className="auth-alert-card fade-in">
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
