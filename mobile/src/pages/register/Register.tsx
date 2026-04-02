import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonText
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Register: React.FC = () => {
  const history = useHistory();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cadastro realizado com sucesso!');
        history.push('/login');
      } else {
        alert('Erro ao cadastrar: ' + JSON.stringify(data));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Cadastro</h2>

        <IonInput
          label="Nome"
          labelPlacement="stacked"
          placeholder="Digite seu nome"
          value={name}
          onIonChange={(e) => setName(e.detail.value!)}
        />

        <IonInput
          label="Email"
          labelPlacement="stacked"
          placeholder="Digite seu email"
          type="email"
          value={email}
          onIonChange={(e) => setEmail(e.detail.value!)}
        />

        <IonInput
          label="Username"
          labelPlacement="stacked"
          placeholder="Digite seu username"
          value={username}
          onIonChange={(e) => setUsername(e.detail.value!)}
        />

        <IonInput
          label="Senha"
          labelPlacement="stacked"
          placeholder="Digite sua senha"
          type="password"
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
        />

        <IonButton expand="block" onClick={handleRegister} style={{ marginTop: '20px' }}>
          Cadastrar
        </IonButton>

        <IonText>
          <p style={{ marginTop: '16px', textAlign: 'center' }}>
            Já tem conta?{' '}
            <span
              style={{ color: '#3880ff', cursor: 'pointer' }}
              onClick={() => history.push('/login')}
            >
              Entrar
            </span>
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Register;