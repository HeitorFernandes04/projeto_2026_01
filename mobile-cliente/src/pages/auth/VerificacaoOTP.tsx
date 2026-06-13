import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import { warningOutline, refreshOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { verificarOTP, solicitarOTP, getVeiculos } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const TOTAL_DIGITS = 4;
const COUNTDOWN_INICIAL = 45;

const VerificacaoOTP: React.FC = () => {
  const location = useLocation<{ telefone?: string, redirect_to?: string, nome_cliente?: string }>();
  const telefone = location.state?.telefone ?? '';
  const nomeCliente = location.state?.nome_cliente;
  const isPerfilFlow = location.state?.redirect_to === '/perfil';
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
    // Manter o foco automático na primeira caixa (UX suave)
    setTimeout(() => {
      ref0.current?.focus();
    }, 150);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Inteligência Pós-Autenticação (Fricção Zero)
  const processarRedirecionamento = async () => {
    if (isPerfilFlow) {
      history.replace('/perfil');
      return;
    }
    // Verificamos ambas as chaves possíveis para garantir cobertura total
    const agendamentoStr = localStorage.getItem('lm_agendamento_pendente') || localStorage.getItem('lm_agendamento_temporario');
    
    if (agendamentoStr) {
      try {
        const agendamentoData = JSON.parse(agendamentoStr);
        
        // Verifica se usuário já tem veículos cadastrados
        try {
          const veiculos = await getVeiculos();
          if (veiculos.length > 0) {
            // Já tem veículo, vai direto para confirmação
            history.replace('/agendamento/confirmacao', { ...agendamentoData, veiculo: veiculos[0] });
          } else {
            // Não tem veículo, vai para cadastro
            history.replace('/veiculo/novo', { next: 'agendamento', ...agendamentoData });
          }
        } catch {
          // Erro ao buscar veículos, vai para cadastro
          history.replace('/veiculo/novo', { next: 'agendamento', ...agendamentoData });
        }
      } catch {
        history.replace('/veiculo/novo');
      }
    } else {
      // Sem agendamento pendente, vai direto para a tela de início (Painel do Cliente)
      history.replace('/inicio');
    }

  };

  const submitOTP = async (codigo: string) => {
    if (loading) return;
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('lm_access_token');
      const { access, refresh, usuario } = await verificarOTP(telefone, codigo, token);
      // Salva no AuthContext global
      login(
        { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, membro_desde: usuario.membro_desde },
        access,
        refresh,
      );
      await processarRedirecionamento();
    } catch (e) {
      // Falha na Verificação
      setErro(e instanceof Error ? e.message : 'Código inválido.');
      setDigits(Array(TOTAL_DIGITS).fill(''));
      
      // Dispara a animação OTP Shake
      setShake(true);
      setTimeout(() => setShake(false), 450);
      
      // Retorna o foco pro input 1
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

    // Avanço automático
    if (digit && index < TOTAL_DIGITS - 1) {
      refs[index + 1].current?.focus();
    }

    // Submissão automática
    if (newDigits.every(d => d !== '')) {
      submitOTP(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Retrocesso automático com Backspace
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleReenviar = async () => {
    try {
      await solicitarOTP(telefone, nomeCliente);
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
    <IonPage className="auth-page">
      <IonHeader className="ion-no-border auth-header">
        <IonToolbar className="auth-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/auth/whatsapp" text="" className="auth-back-button" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding auth-content">
        <h1 className="auth-title" style={{ marginTop: '32px' }}>Confirmar Código</h1>
        
        <p className="auth-subtitle">
          Enviamos um PIN de {TOTAL_DIGITS} dígitos para o WhatsApp{' '}
          <span className="auth-phone-highlight">{telefone}</span>. Digite-o abaixo:
        </p>

        {/* Caixas de Código PIN (Grid Horizontal) */}
        <div className={`auth-otp-container ${shake ? 'otp-shake' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              className={`auth-otp-box ${erro ? 'otp-erro' : ''}`}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
            />
          ))}
        </div>

        {/* Alerta Visual de Erro */}
        {erro && (
          <div className="auth-alert-card">
            <p className="auth-alert-text">
              <IonIcon icon={warningOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {erro}
            </p>
          </div>
        )}

        {/* Bloco de Reenvio / Timer */}
        {countdown > 0 ? (
          <p className="auth-timer-text">
            Aguarde ({mm}:{ss}) para reenviar código
          </p>
        ) : (
          <button className="auth-reenviar-btn" onClick={handleReenviar}>
            <IonIcon icon={refreshOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Enviar novo código por WhatsApp
          </button>
        )}
      </IonContent>
    </IonPage>
  );
};

export default VerificacaoOTP;
