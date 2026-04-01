import { IonContent, IonPage, useIonViewDidEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import '../../theme/lava-me.css';

const cards = [
  {
    icon: '📱',
    titulo: 'Cliente',
    descricao: 'Faça agendamentos e acompanhe seus serviços',
    rota: null,
  },
  {
    icon: '👥',
    titulo: 'Funcionário',
    descricao: 'Gerencie a agenda e registre atendimentos',
    rota: '/login',
  },
  {
    icon: '🖥️',
    titulo: 'Dono',
    descricao: 'Painel administrativo completo do negócio',
    rota: null,
  },
];

const SelecaoAcesso: React.FC = () => {
  const history = useHistory();

  useIonViewDidEnter(() => {
    if (localStorage.getItem('access')) {
      history.replace('/atendimentos/hoje');
    }
  });

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>

          {/* Logo */}
          <div style={styles.logoArea}>
            <div style={styles.logoIconWrap}>
              <span style={styles.logoIcon}>🚗</span>
            </div>
            <span style={styles.logoText}>Lava-Me</span>
          </div>

          <h2 style={styles.titulo}>Selecione o tipo de acesso</h2>
          <p style={styles.subtitulo}>Escolha entre as três interfaces disponíveis</p>

          {/* Cards */}
          <div style={styles.cardsRow}>
            {cards.map((c) => (
              <div key={c.titulo} style={styles.card}>
                <div style={styles.cardIconWrap}>
                  <span style={styles.cardIcon}>{c.icon}</span>
                </div>
                <h3 style={styles.cardTitulo}>{c.titulo}</h3>
                <p style={styles.cardDesc}>{c.descricao}</p>
                <button
                  style={{
                    ...styles.cardBtn,
                    opacity: c.rota ? 1 : 0.4,
                    cursor: c.rota ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!c.rota}
                  onClick={() => c.rota && history.push(c.rota)}
                >
                  Acessar
                </button>
              </div>
            ))}
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
    padding: '48px 20px 32px',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
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
  logoIcon: { fontSize: 40 },
  logoText: {
    fontSize: 32,
    fontWeight: 800,
    color: '#00b4d8',
    letterSpacing: 1,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    margin: '0 0 8px',
  },
  subtitulo: {
    color: '#8899aa',
    fontSize: 14,
    textAlign: 'center',
    margin: '0 0 40px',
  },
  cardsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  card: {
    background: '#161b27',
    border: '1px solid #1e2d40',
    borderRadius: 20,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(0,180,216,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardIcon: { fontSize: 30 },
  cardTitulo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  cardDesc: {
    color: '#8899aa',
    fontSize: 13,
    textAlign: 'center',
    margin: '0 0 8px',
    lineHeight: 1.5,
  },
  cardBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 28,
    border: 'none',
    background: 'linear-gradient(90deg, #00b4d8, #0096c7)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.5,
    boxShadow: '0 4px 16px rgba(0,180,216,0.3)',
  },
};

export default SelecaoAcesso;
