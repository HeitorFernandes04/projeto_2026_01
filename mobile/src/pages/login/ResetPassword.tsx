import { IonContent, IonPage, IonSpinner, useIonAlert, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircleOutline, eyeOutline, eyeOffOutline, lockClosedOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { passwordResetConfirm } from '../../services/api';
import '../../theme/lava-me.css';
import logoLavaMe from '../../assets/logo.jpeg';

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonAlert();

  // Extrair token da URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validações Reativas
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;

  const handleReset = async () => {
    if (!token) {
      setErro('Token inválido ou ausente.');
      return;
    }
    if (!isPasswordValid) {
      setErro('A senha não cumpre todos os critérios de segurança.');
      return;
    }
    if (password !== confirmPassword) {
      setErro('As senhas não coincidem.');
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      await passwordResetConfirm(token, password);
      present({
        header: 'Sucesso',
        message: 'Sua senha foi redefinida com sucesso!',
        buttons: [
          {
            text: 'Fazer Login',
            handler: () => {
              history.replace('/login');
            }
          }
        ]
      });
    } catch (e: any) {
      setErro(e.message || 'Não foi possível redefinir a senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>

          {/* Logo */}
          <div style={{ ...styles.logoArea, '--delay': '0s' } as React.CSSProperties} className="animate-fade-in">
            <div style={styles.logoIconWrap} className="btn-pulse">
              <img src={logoLavaMe} alt="Lava-Me Logo" style={styles.logoImg} />
            </div>
            <span style={styles.logoText}>Lava-Me</span>
          </div>

          <div style={{ ...styles.portalRow, '--delay': '0.1s' } as React.CSSProperties} className="animate-fade-in-up">
            <IonIcon icon={lockClosedOutline} style={{ fontSize: 26, color: '#00b4d8', filter: 'drop-shadow(0 0 6px rgba(0,180,216,0.6))' }} />
            <span style={styles.portalTitulo}>Redefinir Senha</span>
          </div>

          <div style={{ ...styles.form, '--delay': '0.2s' } as React.CSSProperties} className="animate-fade-in-up">
            {token ? (
              <>
                <label style={styles.label}>Nova Senha</label>
                <div style={styles.inputWrapper}>
                  <input
                    style={styles.input}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <IonIcon 
                    icon={showPassword ? eyeOffOutline : eyeOutline} 
                    style={styles.eyeIcon} 
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>

                <div style={styles.checklist}>
                  <div style={styles.checkItem}>
                    <IonIcon icon={hasMinLength ? checkmarkCircle : closeCircleOutline} style={hasMinLength ? styles.iconSuccess : styles.iconMuted} />
                    <span style={hasMinLength ? styles.textSuccess : styles.textMuted}>Mínimo de 8 caracteres</span>
                  </div>
                  <div style={styles.checkItem}>
                    <IonIcon icon={hasUpperCase ? checkmarkCircle : closeCircleOutline} style={hasUpperCase ? styles.iconSuccess : styles.iconMuted} />
                    <span style={hasUpperCase ? styles.textSuccess : styles.textMuted}>Pelo menos uma letra maiúscula</span>
                  </div>
                  <div style={styles.checkItem}>
                    <IonIcon icon={hasNumber ? checkmarkCircle : closeCircleOutline} style={hasNumber ? styles.iconSuccess : styles.iconMuted} />
                    <span style={hasNumber ? styles.textSuccess : styles.textMuted}>Pelo menos um número</span>
                  </div>
                  <div style={styles.checkItem}>
                    <IonIcon icon={hasSpecialChar ? checkmarkCircle : closeCircleOutline} style={hasSpecialChar ? styles.iconSuccess : styles.iconMuted} />
                    <span style={hasSpecialChar ? styles.textSuccess : styles.textMuted}>Pelo menos um caractere especial (@, #, $, etc)</span>
                  </div>
                </div>

                <label style={styles.label}>Confirme a Nova Senha</label>
                <div style={styles.inputWrapper}>
                  <input
                    style={styles.input}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <IonIcon 
                    icon={showConfirmPassword ? eyeOffOutline : eyeOutline} 
                    style={styles.eyeIcon} 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p style={styles.erroText}>As senhas não coincidem.</p>
                )}

                {erro && <p style={styles.erro}>{erro}</p>}

                <div style={{ ...styles.btnWrapper, '--delay': '0.3s' } as React.CSSProperties} className="animate-fade-in-up">
                  <button
                    style={{ ...styles.btn, opacity: (carregando || !isPasswordValid || password !== confirmPassword || !password) ? 0.7 : 1 }}
                    className="btn-pulse"
                    disabled={carregando || !isPasswordValid || password !== confirmPassword || !password}
                    onClick={handleReset}
                  >
                    {carregando ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : 'Redefinir'}
                  </button>
                </div>
              </>
            ) : (
              <p style={styles.erroCentral}>Link de redefinição inválido.</p>
            )}

            <button
              style={styles.voltar}
              onClick={() => history.replace('/login')}
            >
              Voltar para o Login
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px 32px',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  logoIconWrap: {
    width: 80,
    height: 80,
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--lm-border)',
    background: 'var(--lm-card)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#00b4d8',
    letterSpacing: 1,
  },
  portalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  portalTitulo: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 700,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative' as const,
    width: '100%',
    marginBottom: 20,
  },
  input: {
    background: '#1e2535',
    border: '1px solid #1e2d40',
    borderRadius: 14,
    padding: '14px 44px 14px 18px',
    color: '#ffffff',
    fontSize: 15,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  eyeIcon: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8899aa',
    fontSize: 22,
    cursor: 'pointer',
  },
  btnWrapper: {
    width: '100%',
    marginTop: 8,
  },
  btn: {
    width: '100%',
    padding: '16px 0',
    borderRadius: 28,
    border: 'none',
    background: 'linear-gradient(90deg, #00b4d8, #0096c7)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,180,216,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dica: {
    color: '#8899aa',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
    marginTop: -8,
    background: '#141a23',
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid #1e2d40',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconMuted: {
    color: '#8899aa',
    fontSize: 18,
  },
  iconSuccess: {
    color: '#2dd36f',
    fontSize: 18,
  },
  textMuted: {
    color: '#8899aa',
    fontSize: 13,
    transition: 'color 0.2s',
  },
  textSuccess: {
    color: '#2dd36f',
    fontSize: 13,
    fontWeight: 600,
    transition: 'color 0.2s',
  },
  erroText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: -12,
    marginBottom: 16,
  },
  erro: {
    color: '#ef4444',
    fontSize: 13,
    margin: '-8px 0 16px',
  },
  erroCentral: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  voltar: {
    marginTop: 32,
    color: '#8899aa',
    fontSize: 14,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  }
};

export default ResetPassword;
