import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonText
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const history = useHistory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        alert('Login realizado com sucesso!');
      } else {
        alert('Email ou senha inválidos.');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Login</h2>

        <IonInput
          label="Email"
          labelPlacement="stacked"
          placeholder="Digite seu email"
          value={email}
          onIonChange={(e) => setEmail(e.detail.value!)}
        />

        <IonInput
          label="Senha"
          labelPlacement="stacked"
          type="password"
          placeholder="Digite sua senha"
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
        />

        <IonButton expand="block" onClick={handleLogin} style={{ marginTop: '20px' }}>
          Entrar
        </IonButton>

        <IonText>
          <p style={{ marginTop: '16px', textAlign: 'center' }}>
            Não tem conta?{' '}
            <span
              style={{ color: '#3880ff', cursor: 'pointer' }}
              onClick={() => history.push('/register')}
            >
              Cadastre-se
            </span>
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Login;