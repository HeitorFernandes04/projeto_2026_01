import { IonContent, IonPage, IonSpinner, useIonAlert, IonIcon, useIonViewWillEnter } from '@ionic/react';
import { eyeOutline, eyeOffOutline, idCardOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { loginUsuario, getMeuPerfil, passwordResetRequest } from '../../services/api';
import '../../theme/lava-me.css';
import logoLavaMe from '../../assets/logo.jpeg';

const Login: React.FC = () => {
  const history = useHistory();
  const [present] = useIonAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useIonViewWillEnter(() => {
    if (localStorage.getItem('access')) {
      history.replace('/ordens-servico/hoje');
    }
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const data = await loginUsuario(email, password);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      
      // Validação de Perfil (CA: Apenas Operadores no Mobile)
      const perfil = await getMeuPerfil();
      if (perfil.cargo === 'GESTOR') {
        localStorage.clear();
        setErro('Acesso negado: Este aplicativo é restrito à equipe operacional.');
        return;
      }

      history.replace('/ordens-servico/hoje');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível conectar ao servidor.';
      setErro(msg);
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

          {/* Título portal */}
          <div style={{ ...styles.portalRow, '--delay': '0.1s' } as React.CSSProperties} className="animate-fade-in-up">
            <IonIcon icon={idCardOutline} style={{ fontSize: 26, color: '#00b4d8', filter: 'drop-shadow(0 0 6px rgba(0,180,216,0.6))' }} />
            <span style={styles.portalTitulo}>Portal do Funcionário</span>
          </div>

          {/* Formulário */}
          <div style={{ ...styles.form, '--delay': '0.2s' } as React.CSSProperties} className="animate-fade-in-up">
            <label style={styles.label}>E-mail</label>
            <div style={styles.inputWrapper}>
              <IonIcon icon={mailOutline} style={styles.inputLeftIcon} />
              <input
                style={{ ...styles.input, paddingLeft: 44 }}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <IonIcon icon={lockClosedOutline} style={styles.inputLeftIcon} />
              <input
                style={{ ...styles.input, paddingLeft: 44 }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <IonIcon 
                icon={showPassword ? eyeOffOutline : eyeOutline} 
                style={styles.eyeIcon} 
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div style={styles.forgotPassContainer}>
              <span 
                style={styles.forgotPass}
                onClick={() => present({
                  header: 'Esqueci minha senha',
                  message: 'Digite seu e-mail corporativo para receber as instruções de redefinição.',
                  inputs: [
                    {
                      name: 'email',
                      type: 'email',
                      placeholder: 'seu@email.com',
                    }
                  ],
                  buttons: [
                    {
                      text: 'Cancelar',
                      role: 'cancel'
                    },
                    {
                      text: 'Enviar',
                      handler: async (alertData) => {
                        if (!alertData.email) return false;
                        setCarregando(true);
                        try {
                          await passwordResetRequest(alertData.email);
                          present({
                            header: 'E-mail Enviado',
                            message: 'Se o e-mail estiver cadastrado, você receberá instruções em instantes.',
                            buttons: ['OK']
                          });
                        } catch (e: any) {
                          setErro(e.message || 'Ocorreu um erro ao solicitar redefinição.');
                        } finally {
                          setCarregando(false);
                        }
                      }
                    }
                  ]
                })}
              >
                Esqueci minha senha
              </span>
            </div>

            {erro && <p style={styles.erro}>{erro}</p>}

                <div style={{ ...styles.btnWrapper, '--delay': '0.3s' } as React.CSSProperties} className="animate-fade-in-up">
                  <button
                    style={{ ...styles.btn, opacity: carregando ? 0.7 : 1 }}
                    className="btn-pulse"
                    disabled={carregando}
                    onClick={handleLogin}
                  >
                    {carregando ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : 'Entrar'}
                  </button>
                </div>
          </div>

          <p style={styles.registerLink}>
            Problemas técnicos?{' '}
            <span style={styles.registerSpan}>Suporte TI</span>
          </p>

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
  inputLeftIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8899aa',
    fontSize: 20,
    zIndex: 2,
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
  erro: {
    color: '#ef4444',
    fontSize: 13,
    margin: '-8px 0 16px',
  },
  voltar: {
    marginTop: 32,
    color: '#8899aa',
    fontSize: 13,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  registerLink: {
    marginTop: 24,
    color: '#8899aa',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  registerSpan: {
    color: '#00b4d8',
    fontWeight: 700,
    cursor: 'pointer',
  },
  forgotPassContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 24,
    marginTop: -8
  },
  forgotPass: {
    color: '#8899aa',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'none'
  }
};

export default Login;
