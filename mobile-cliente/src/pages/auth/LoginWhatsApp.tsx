import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonInput,
  IonItem,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { solicitarOTP } from '../../services/api';
import './Auth.css';

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
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const telefoneLimpo = telefoneFormatado.replace(/\D/g, '');
  const isValido = telefoneLimpo.length === 10 || telefoneLimpo.length === 11;

  const handleInput = (valor: string) => {
    setTelefoneFormatado(aplicarMascaraTelefone(valor));
    setErro('');
  };

  const handleContinuar = async () => {
    if (!isValido) return;
    setLoading(true);
    setErro('');
    try {
      await solicitarOTP(`+55${telefoneLimpo}`);
      history.push('/auth/verificacao', { telefone: `+55${telefoneLimpo}` });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="auth-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth" text="Voltar" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="auth-container">
          <div className="auth-icon lm-card">
            <span className="auth-emoji">🚗</span>
          </div>

          <h1 className="auth-titulo">Digite seu número</h1>
          <p className="auth-descricao">
            Enviaremos um código de verificação via WhatsApp.
          </p>

          <div className="auth-telefone-row">
            <IonItem className="auth-ddi lm-input" lines="none">
              <IonInput value="+55" readonly />
            </IonItem>
            <IonItem className="auth-numero lm-input" lines="none">
              <IonInput
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefoneFormatado}
                onIonInput={e => handleInput(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </div>

          {erro && <p className="auth-erro">{erro}</p>}

          <IonButton
            className="lm-btn-primary"
            expand="block"
            disabled={!isValido || loading}
            onClick={handleContinuar}
          >
            {loading ? 'Enviando...' : 'Continuar →'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginWhatsApp;
