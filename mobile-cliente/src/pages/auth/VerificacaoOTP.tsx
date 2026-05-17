import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { verificarOTP, solicitarOTP } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const TOTAL_DIGITS = 4;
const COUNTDOWN_INICIAL = 45;

const VerificacaoOTP: React.FC = () => {
  const location = useLocation<{ telefone?: string }>();
  const telefone = location.state?.telefone ?? '';
  const history = useHistory();
  const { login } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(TOTAL_DIGITS).fill(''));
  const [shake, setShake] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_INICIAL);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  useEffect(() => {
    ref0.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const submitOTP = async (codigo: string) => {
    if (loading) return;
    setLoading(true);
    setErro('');
    try {
      const { access, refresh, usuario } = await verificarOTP(telefone, codigo);
      login(
        { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, membro_desde: usuario.membro_desde },
        access,
        refresh,
      );
      const destino = localStorage.getItem('lm_destino_pos_auth') ?? '/inicio';
      localStorage.removeItem('lm_destino_pos_auth');
      history.replace(destino);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Código inválido.');
      setDigits(Array(TOTAL_DIGITS).fill(''));
      setShake(true);
      setTimeout(() => setShake(false), 450);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, valor: string) => {
    const digit = valor.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErro('');

    if (digit && index < TOTAL_DIGITS - 1) {
      refs[index + 1].current?.focus();
    }

    if (newDigits.every(d => d !== '')) {
      submitOTP(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleReenviar = async () => {
    try {
      await solicitarOTP(telefone);
      setCountdown(COUNTDOWN_INICIAL);
      setDigits(Array(TOTAL_DIGITS).fill(''));
      setErro('');
      refs[0].current?.focus();
    } catch {
      setErro('Erro ao reenviar código.');
    }
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="auth-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth/whatsapp" text="Voltar" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="auth-container">
          <h1 className="auth-titulo">Verificação</h1>
          <p className="auth-descricao">
            Digite o código enviado para{' '}
            <strong style={{ color: 'var(--lm-text)' }}>{telefone}</strong>
          </p>

          <div className={`otp-boxes ${shake ? 'otp-shake' : ''}`}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                className={`otp-box${erro ? ' otp-erro' : ''}`}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
              />
            ))}
          </div>

          {erro && <p className="auth-erro">{erro}</p>}

          <div className="otp-reenviar">
            {countdown > 0 ? (
              <span>Reenviar código ({mm}:{ss})</span>
            ) : (
              <button className="otp-reenviar-link" onClick={handleReenviar}>
                Reenviar código
              </button>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerificacaoOTP;
