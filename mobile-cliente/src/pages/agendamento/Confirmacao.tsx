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
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { createAgendamento } from '../../services/api';
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
  const state = location.state;

  const [loading, setLoading] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  if (!state) {
    history.replace('/mapa');
    return null;
  }

  const { slug, servico, estabelecimento_nome, data, horario, veiculo } = state;

  const handleConfirmar = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await createAgendamento({
        slug,
        servico_id: servico.id,
        veiculo_id: veiculo.id,
        data,
        horario,
      });
      setShowToast(true);
      setTimeout(() => history.replace('/inicio'), 1500);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        setErroMsg('Este horário acabou de ser ocupado. Volte e selecione outro.');
      } else {
        setErroMsg(err.message ?? 'Erro ao confirmar agendamento.');
      }
      setShowAlerta(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="confirm-toolbar">
          <IonTitle className="confirm-title">Confirmação</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="lm-card confirm-card">
          <p className="confirm-card-label">Serviço</p>
          <p className="confirm-info">📍 {estabelecimento_nome}</p>
          <p className="confirm-info">🔧 {servico.nome}</p>
          <p className="confirm-info">📅 {formatarData(data)}</p>
          <p className="confirm-info">🕐 {horario}</p>
        </div>

        <div className="lm-card confirm-card">
          <p className="confirm-card-label">Veículo</p>
          <p className="confirm-info">🚗 {veiculo.marca} {veiculo.modelo} · {veiculo.cor}</p>
          <p className="confirm-info">{veiculo.placa}</p>
        </div>

        <div className="lm-card confirm-card confirm-card-total">
          <div className="confirm-total-row">
            <span className="confirm-total-label">$ Total</span>
            <span className="confirm-total-valor">R$ {Number(servico.preco).toFixed(2)}</span>
          </div>
          <p className="confirm-duracao">Duração: {servico.duracao_estimada_min} min</p>
        </div>
      </IonContent>

      <div className="confirm-footer">
        <IonButton
          className="lm-btn-primary"
          expand="block"
          disabled={loading}
          onClick={handleConfirmar}
        >
          {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
        </IonButton>
      </div>

      <IonAlert
        isOpen={showAlerta}
        header="Erro no agendamento"
        message={erroMsg}
        buttons={['OK']}
        onDidDismiss={() => setShowAlerta(false)}
      />

      <IonToast
        isOpen={showToast}
        message="Agendamento confirmado! ✅"
        duration={1500}
        color="success"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default Confirmacao;
