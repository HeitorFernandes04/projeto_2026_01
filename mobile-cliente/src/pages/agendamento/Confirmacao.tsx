import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonAlert,
  IonToast,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import { locationOutline, constructOutline, calendarOutline, carOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { createAgendamento, getVeiculos } from '../../services/api';
import type { Servico, Veiculo } from '../../services/api';
import './Confirmacao.css';

interface LocationState {
  slug: string;
  servico: Servico;
  estabelecimento_nome: string;
  data: string;
  horario: string;
  veiculo: Veiculo;
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${dia} de ${meses[Number(mes) - 1]}, ${ano}`;
}

const Confirmacao: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  
  const [stateData, setStateData] = useState<LocationState | null>(location.state);
  const [loadingData, setLoadingData] = useState(!location.state);

  const [loading, setLoading] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  React.useEffect(() => {
    if (!stateData) {
      const pending = localStorage.getItem('lm_agendamento_pendente') || localStorage.getItem('lm_agendamento_temporario');
      if (pending) {
        const agendamentoData = JSON.parse(pending);
        getVeiculos().then(veiculos => {
          if (veiculos.length > 0) {
            setStateData({ ...agendamentoData, veiculo: veiculos[0] });
          } else {
            history.replace('/veiculo/novo');
          }
          setLoadingData(false);
        }).catch(() => {
          history.replace('/inicio');
          setLoadingData(false);
        });
      } else {
        history.replace('/inicio');
        setLoadingData(false);
      }
    }
  }, [stateData, history]);

  if (loadingData) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
          Carregando dados do agendamento...
        </IonContent>
      </IonPage>
    );
  }

  if (!stateData) {
    return null;
  }

  const { slug, servico, estabelecimento_nome, data, horario, veiculo } = stateData;

  const handleConfirmar = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await createAgendamento({
        slug,
        servico_id: servico.id,
        veiculo_id: veiculo.id,
        data_hora: `${data}T${horario}:00`, // Combina "YYYY-MM-DD" e "HH:MM" para formato ISO válido
      });

      localStorage.removeItem('lm_agendamento_temporario');
      localStorage.removeItem('lm_agendamento_pendente');

      setSucesso(true);
    } catch (e) {
      const err = e as Error & { status?: number };
      setLoading(false);
      setErroMsg(err.message ?? 'Erro ao comunicar com o servidor.');
      setShowAlerta(true);
    }
  };

  if (sucesso) {
    return (
      <IonPage className="confirm-page">
        <IonContent className="ion-padding confirm-content success-view">
          <div className="success-container" style={{ textAlign: 'center', marginTop: '60px' }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '80px', color: 'var(--ion-color-success)' }} />
            <h1 style={{ color: 'white', marginTop: '20px' }}>Agendamento Confirmado!</h1>
            <p style={{ color: 'var(--ion-color-medium)', marginBottom: '40px' }}>
              Seu agendamento foi realizado com sucesso.
            </p>

            <div className="confirm-card">
              <p className="confirm-card-header">Resumo</p>
              <p className="confirm-info-row">
                <span className="confirm-icon"><IonIcon icon={locationOutline} /></span> {estabelecimento_nome}
              </p>
              <p className="confirm-info-row">
                <span className="confirm-icon"><IonIcon icon={calendarOutline} /></span> {formatarData(data)} às {horario}
              </p>
            </div>

            <IonButton
              className="confirm-btn-primary"
              expand="block"
              style={{ marginTop: '40px' }}
              onClick={() => history.replace('/inicio')}
            >
              Ir para o Painel
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="confirm-page">
      <IonHeader className="ion-no-border confirm-header">
        <IonToolbar className="confirm-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/agendamento" text="" className="confirm-back-button" />
          </IonButtons>
          <IonTitle className="confirm-title">Confirmação</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding confirm-content">
        
        {/* Bloco 1: Serviço (Estabelecimento, Nome, Data, Hora) */}
        <div className="confirm-card">
          <p className="confirm-card-header">Detalhes do Serviço</p>
          <p className="confirm-info-row">
            <span className="confirm-icon"><IonIcon icon={locationOutline} /></span> {estabelecimento_nome}
          </p>
          <p className="confirm-info-row">
            <span className="confirm-icon"><IonIcon icon={constructOutline} /></span> {servico.nome}
          </p>
          <p className="confirm-info-row">
            <span className="confirm-icon"><IonIcon icon={calendarOutline} /></span> {formatarData(data)} às {horario}
          </p>
        </div>

        {/* Bloco 2: Veículo (Marca, Modelo, Cor e Placa em caixa alta) */}
        <div className="confirm-card">
          <p className="confirm-card-header">Seu Veículo</p>
          <div className="confirm-info-row">
            <span className="confirm-icon"><IonIcon icon={carOutline} /></span> 
            {veiculo.marca} {veiculo.modelo} ({veiculo.cor})
            <span className="confirm-placa">{veiculo.placa}</span>
          </div>
        </div>

        {/* Bloco 3: Total e Tempo */}
        <div className="confirm-card confirm-card-total">
          <div className="confirm-total-row">
            <span className="confirm-total-label">Total</span>
            <span className="confirm-total-valor">R$ {Number(servico.preco).toFixed(2).replace('.', ',')}</span>
          </div>
          <p className="confirm-duracao">Duração estimada: {servico.duracao_estimada_min} min</p>
        </div>

      </IonContent>

      <div className="confirm-footer">
        <IonButton
          className="confirm-btn-primary"
          expand="block"
          disabled={loading}
          onClick={handleConfirmar}
        >
          {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
        </IonButton>
      </div>

      <IonAlert
        isOpen={showAlerta}
        header="Atenção"
        message={erroMsg}
        buttons={['Entendi']}
        onDidDismiss={() => setShowAlerta(false)}
      />

      <IonToast
        isOpen={showToast}
        message="Agendamento confirmado!"
        duration={1500}
        color="success"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default Confirmacao;
