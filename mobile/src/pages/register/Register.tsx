import {
  IonContent,
  IonPage,
  IonSpinner,
} from '@ionic/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { registerUsuario } from '../../services/api';

const Register: React.FC = () => {
  const history = useHistory();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleRegister = async () => {
    // Validações client-side antes de bater na API
    const emailLimpo = email.trim().toLowerCase();
    const passwordLimpo = password.trim();
    const nameLimpo = name.trim();
    const usernameLimpo = username.trim();

    if (!nameLimpo || !emailLimpo || !usernameLimpo || !passwordLimpo) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (!emailLimpo.includes('@') || !emailLimpo.includes('.')) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (passwordLimpo.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setErro('');
    setIsLoading(true);
    try {
      await registerUsuario({
        name: nameLimpo,
        email: emailLimpo,
        username: usernameLimpo,
        password: passwordLimpo,
      });
      alert('Cadastro realizado com sucesso!');
      history.push('/login');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao conectar com o servidor.';
      setErro(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage style={{ background: '#0d1117' }}>
      <IonContent style={{ '--background': '#0d1117' }}>
        <div style={styles.container}>
          <div style={styles.logoArea}>
            <div style={styles.logoIconWrap}>
              <span style={{ fontSize: 40 }}>🚗</span>
            </div>
            <span style={styles.logoText}>Lava-Me</span>
          </div>

          <h2 style={styles.titulo}>Criar Conta</h2>
          <p style={styles.subtitulo}>Preencha os dados para se cadastrar</p>

          <div style={styles.form}>
            <label style={styles.label}>Nome completo</label>
            <input
              style={styles.input}
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label style={styles.label}>E-mail</label>
            <input
              style={styles.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label style={styles.label}>Nome de usuário</label>
            <input
              style={styles.input}
              placeholder="usuario123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label style={styles.label}>Senha</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {erro && <p style={styles.erro}>{erro}</p>}

            <button
              style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }}
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : 'Cadastrar'}
            </button>
          </div>

          <p style={styles.loginLink}>
            Já tem conta?{' '}
            <span
              style={styles.loginSpan}
              onClick={() => history.push('/login')}
            >
              Entrar
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
    padding: '48px 24px 40px',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoIconWrap: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00b4d8, #0096c7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 24px rgba(0,180,216,0.4)',
  },
  logoText: {
    fontSize: 26,
    fontWeight: 800,
    color: '#00b4d8',
    letterSpacing: 1,
  },
  titulo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 900,
    margin: '0 0 4px',
  },
  subtitulo: {
    color: '#8899aa',
    fontSize: 14,
    margin: '0 0 32px',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
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
    boxSizing: 'border-box' as const,
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
  loginLink: {
    marginTop: 24,
    color: '#8899aa',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  loginSpan: {
    color: '#00b4d8',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Register;