import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { loginUsuario } from '../../services/api';
import '../../theme/lava-me.css';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

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
      history.push('/atendimentos/hoje');
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
          <div style={styles.logoArea}>
            <div style={styles.logoIconWrap}>
              <span style={{ fontSize: 40 }}>🚗</span>
            </div>
            <span style={styles.logoText}>Lava-Me</span>
          </div>

          {/* Título portal */}
          <div style={styles.portalRow}>
            <span style={{ fontSize: 22, color: '#00b4d8' }}>👥</span>
            <span style={styles.portalTitulo}>Portal do Funcionário</span>
          </div>

          {/* Formulário */}
          <div style={styles.form}>
            <label style={styles.label}>E-mail</label>
            <input
              style={styles.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label style={styles.label}>Senha</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />

            {erro && <p style={styles.erro}>{erro}</p>}

            <button
              style={{ ...styles.btn, opacity: carregando ? 0.7 : 1 }}
              disabled={carregando}
              onClick={handleLogin}
            >
              {carregando ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : 'Entrar'}
            </button>
          </div>

          <button
            style={styles.voltar}
            onClick={() => history.push('/selecao')}
          >
            ← Voltar para seleção de acesso
          </button>

          <p style={styles.registerLink}>
            Ainda não tem conta?{' '}
            <span
              style={styles.registerSpan}
              onClick={() => history.push('/register')}
            >
              Cadastrar-se
            </span>
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
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 24px rgba(0,180,216,0.4)',
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
  input: {
    background: '#1e2535',
    border: '1px solid #1e2d40',
    borderRadius: 14,
    padding: '14px 18px',
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 20,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  btn: {
    marginTop: 8,
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
    textDecoration: 'underline',
  },
};

export default Login;
