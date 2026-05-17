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
import { locationOutline, constructOutline, calendarOutline, carOutline } from 'ionicons/icons';
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

  // Segurança de Fluxo: Garante que só carrega a tela com os dados
  if (!state) {
    history.replace('/inicio');
    return null;
  }

  const { slug, servico, estabelecimento_nome, data, horario, veiculo } = state;

  const handleConfirmar = async () => {
    // 1. Prevenção de Duplo Clique Instantânea
    if (loading) return;
    setLoading(true);
    
    try {
      // 2. Acionamento real do Monolito via API service
      await createAgendamento({
        slug,
        servico_id: servico.id,
        veiculo_id: veiculo.id,
        data,
        horario,
      });
      
      // 3. Sucesso: Remoção limpa de vestígios do fluxo anônimo (Checkout Sem Fricção)
      localStorage.removeItem('lm_agendamento_temporario');
      localStorage.removeItem('lm_agendamento_pendente');
      
      // 4. Sucesso: Redirecionamento IMEDIATO e disparo do Toast
      setShowToast(true);
      history.replace('/inicio');
    } catch (e) {
      // Tratamento de Erro: liberação da trava de UI e alerta ao usuário
      const err = e as Error & { status?: number };
      setLoading(false);
      setErroMsg(err.message ?? 'Erro ao comunicar com o servidor.');
      setShowAlerta(true);
    }
  };

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

      {/* Alerta Nativo para Falhas de API */}
      <IonAlert
        isOpen={showAlerta}
        header="Atenção"
        message={erroMsg}
        buttons={['Entendi']}
        onDidDismiss={() => setShowAlerta(false)}
      />

      {/* Toast Nativo de Sucesso */}
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
